# Ye message bhejne aur fetch karne ke endpoints hai (Endpoints to send and fetch messages)
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import User, Conversation, ConversationParticipant, Message, MessageStatus, MessageReaction
from app.schemas.schemas import MessageResponse, MessageCreate, ReactionCreate, MessageReactionResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="", tags=["Messages"])

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    conversation_id: int,
    before: Optional[int] = Query(None, description="Fetch messages with ID less than this cursor"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify participant access
    p_res = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
            ConversationParticipant.left_at.is_(None)
        )
    )
    curr_p = p_res.scalars().first()
    if not curr_p:
        raise HTTPException(status_code=403, detail="Not a participant of this conversation")

    query = (
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.statuses),
            selectinload(Message.reactions)
        )
        .where(Message.conversation_id == conversation_id)
    )
    
    if curr_p.cleared_at:
        query = query.where(Message.created_at > curr_p.cleared_at)

    if before:
        query = query.where(Message.id < before)

    query = query.order_by(Message.id.desc()).limit(limit)

    res = await db.execute(query)
    messages = list(res.scalars().all())
    # Return in ascending chronological order for chat view
    messages.reverse()
    return messages

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message_rest(
    conversation_id: int,
    req: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify participant access
    p_res = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.left_at.is_(None)
        )
    )
    participants = p_res.scalars().all()
    curr_p = next((p for p in participants if p.user_id == current_user.id), None)
    if not curr_p:
        raise HTTPException(status_code=403, detail="Not a participant of this conversation")

    new_msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=req.content,
        type=req.type,
        reply_to_message_id=req.reply_to_message_id,
        attachment_url=req.attachment_url,
        created_at=datetime.utcnow()
    )
    db.add(new_msg)
    await db.flush()

    # Update sender's last_read_message_id
    curr_p.last_read_message_id = new_msg.id

    # Create message statuses for all other participants
    from app.ws.connection_manager import manager
    for p in participants:
        if p.user_id != current_user.id:
            st_val = "delivered" if p.user_id in manager.active_connections else "sent"
            st = MessageStatus(
                message_id=new_msg.id,
                user_id=p.user_id,
                status=st_val,
                updated_at=datetime.utcnow()
            )
            db.add(st)
        
        # Ensure conversation reappears if it was deleted
        if p.deleted_at is not None:
            p.deleted_at = None


    await db.execute(
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(last_message_at=datetime.utcnow())
    )
    await db.commit()

    # Refetch full message
    msg_res = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.statuses),
            selectinload(Message.reactions)
        )
        .where(Message.id == new_msg.id)
    )
    full_msg = msg_res.scalars().first()

    # Broadcast via WS manager to all online participants
    try:
        from app.ws.connection_manager import manager
        msg_payload = {
            "id": full_msg.id,
            "conversation_id": conversation_id,
            "sender_id": current_user.id,
            "sender": {
                "id": current_user.id,
                "username": current_user.username,
                "display_name": current_user.display_name,
                "avatar_url": current_user.avatar_url,
                "is_online": current_user.is_online,
                "last_seen_at": current_user.last_seen_at.isoformat() if current_user.last_seen_at else None,
                "created_at": current_user.created_at.isoformat()
            },
            "content": full_msg.content,
            "type": full_msg.type,
            "reply_to_message_id": full_msg.reply_to_message_id,
            "attachment_url": full_msg.attachment_url,
            "created_at": full_msg.created_at.isoformat(),
            "statuses": [
                {
                    "id": st.id,
                    "message_id": st.message_id,
                    "user_id": st.user_id,
                    "status": st.status,
                    "updated_at": st.updated_at.isoformat()
                }
                for st in full_msg.statuses
            ],
            "reactions": []
        }
        new_msg_event = {"type": "message:new", "payload": msg_payload}
        for p in participants:
            await manager.send_personal_json(p.user_id, new_msg_event)
    except Exception as e:
        pass

    return full_msg


@router.post("/messages/{message_id}/reactions", response_model=MessageReactionResponse)
async def toggle_reaction(
    message_id: int,
    req: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    msg_res = await db.execute(select(Message).where(Message.id == message_id))
    msg = msg_res.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    existing_res = await db.execute(
        select(MessageReaction).where(
            MessageReaction.message_id == message_id,
            MessageReaction.user_id == current_user.id,
            MessageReaction.emoji == req.emoji
        )
    )
    existing = existing_res.scalars().first()

    if existing:
        await db.delete(existing)
        await db.commit()
        raise HTTPException(status_code=200, detail="Reaction removed")

    new_reaction = MessageReaction(
        message_id=message_id,
        user_id=current_user.id,
        emoji=req.emoji,
        created_at=datetime.utcnow()
    )
    db.add(new_reaction)
    await db.commit()
    await db.refresh(new_reaction)
    return new_reaction
