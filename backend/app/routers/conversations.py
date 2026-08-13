# Ye chat groups aur direct messages ke endpoints hai (Endpoints for chat groups and DMs)
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import User, Conversation, ConversationParticipant, Message
from app.schemas.schemas import (
    ConversationResponse, DirectConversationCreate, GroupConversationCreate,
    GroupUpdate, AddMemberRequest, MarkReadRequest
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find all conversation IDs where current user is a non-left participant
    p_query = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == current_user.id,
        ConversationParticipant.left_at.is_(None),
        ConversationParticipant.deleted_at.is_(None)
    )
    p_res = await db.execute(p_query)
    c_ids = p_res.scalars().all()

    if not c_ids:
        return []

    # Fetch conversations with participants & user info loaded
    query = (
        select(Conversation)
        .options(
            selectinload(Conversation.participants).selectinload(ConversationParticipant.user)
        )
        .where(Conversation.id.in_(c_ids))
        .order_by(Conversation.last_message_at.desc())
    )
    res = await db.execute(query)
    conversations = res.scalars().all()

    response_list = []
    for c in conversations:
        # Find current user participant record
        curr_part = next((p for p in c.participants if p.user_id == current_user.id), None)
        last_read_id = curr_part.last_read_message_id if curr_part else 0

        # Unread count: messages in this conversation with id > last_read_id and sender != current_user
        unread_q = select(func.count(Message.id)).where(
            Message.conversation_id == c.id,
            Message.sender_id != current_user.id
        )
        if last_read_id:
            unread_q = unread_q.where(Message.id > last_read_id)

        unread_res = await db.execute(unread_q)
        unread_cnt = unread_res.scalar() or 0

        # Fetch last message
        last_msg_q = (
            select(Message)
            .options(selectinload(Message.sender), selectinload(Message.statuses), selectinload(Message.reactions))
            .where(Message.conversation_id == c.id)
        )
        
        if curr_part and curr_part.cleared_at:
            last_msg_q = last_msg_q.where(Message.created_at > curr_part.cleared_at)
            
        last_msg_q = last_msg_q.order_by(Message.id.desc()).limit(1)
        
        last_msg_res = await db.execute(last_msg_q)
        last_msg = last_msg_res.scalars().first()

        # Format 1:1 conversation display name & avatar from the other participant
        display_name = c.name
        display_avatar = c.avatar_url

        if c.type == "direct":
            other_part = next((p for p in c.participants if p.user_id != current_user.id), None)
            if other_part and other_part.user:
                display_name = other_part.user.display_name
                display_avatar = other_part.user.avatar_url
            else:
                display_name = "Saved Messages"

        c_dict = {
            "id": c.id,
            "type": c.type,
            "name": display_name,
            "avatar_url": display_avatar,
            "created_by": c.created_by,
            "created_at": c.created_at,
            "last_message_at": c.last_message_at,
            "participants": c.participants,
            "last_message": last_msg,
            "unread_count": unread_cnt
        }
        response_list.append(c_dict)

    return response_list

@router.post("/direct", response_model=ConversationResponse)
async def create_direct_conversation(
    req: DirectConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot create direct chat with yourself")

    target_res = await db.execute(select(User).where(User.id == req.target_user_id))
    target = target_res.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check if a direct conversation already exists between these two users
    q = (
        select(Conversation)
        .options(selectinload(Conversation.participants).selectinload(ConversationParticipant.user))
        .where(Conversation.type == "direct")
    )
    res = await db.execute(q)
    existing_convs = res.scalars().all()

    for c in existing_convs:
        u_ids = {p.user_id for p in c.participants if p.left_at is None}
        if u_ids == {current_user.id, req.target_user_id}:
            # If the user previously deleted the chat, undelete it
            curr_p = next((p for p in c.participants if p.user_id == current_user.id), None)
            if curr_p and curr_p.deleted_at is not None:
                curr_p.deleted_at = None
                await db.commit()
            
            return {
                "id": c.id,
                "type": c.type,
                "name": target.display_name,
                "avatar_url": target.avatar_url,
                "created_by": c.created_by,
                "created_at": c.created_at,
                "last_message_at": c.last_message_at,
                "participants": c.participants,
                "last_message": None,
                "unread_count": 0
            }

    # Create new direct conversation
    new_conv = Conversation(
        type="direct",
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        last_message_at=datetime.utcnow()
    )
    db.add(new_conv)
    await db.flush()

    p1 = ConversationParticipant(conversation_id=new_conv.id, user_id=current_user.id, role="admin")
    p2 = ConversationParticipant(conversation_id=new_conv.id, user_id=req.target_user_id, role="member")
    db.add_all([p1, p2])
    await db.commit()

    # Refetch full conversation
    res = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants).selectinload(ConversationParticipant.user))
        .where(Conversation.id == new_conv.id)
    )
    c = res.scalars().first()

    return {
        "id": c.id,
        "type": c.type,
        "name": target.display_name,
        "avatar_url": target.avatar_url,
        "created_by": c.created_by,
        "created_at": c.created_at,
        "last_message_at": c.last_message_at,
        "participants": c.participants,
        "last_message": None,
        "unread_count": 0
    }

@router.post("/group", response_model=ConversationResponse)
async def create_group_conversation(
    req: GroupConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Group name is required")

    new_conv = Conversation(
        type="group",
        name=req.name.strip(),
        avatar_url=req.avatar_url,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        last_message_at=datetime.utcnow()
    )
    db.add(new_conv)
    await db.flush()

    participants = [ConversationParticipant(conversation_id=new_conv.id, user_id=current_user.id, role="admin")]
    member_set = set(req.member_ids) - {current_user.id}
    for m_id in member_set:
        participants.append(ConversationParticipant(conversation_id=new_conv.id, user_id=m_id, role="member"))

    db.add_all(participants)
    await db.flush()

    # Add system message for group creation
    sys_msg = Message(
        conversation_id=new_conv.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} created the group \"{new_conv.name}\"",
        type="system",
        created_at=datetime.utcnow()
    )
    db.add(sys_msg)
    await db.commit()

    res = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants).selectinload(ConversationParticipant.user))
        .where(Conversation.id == new_conv.id)
        .execution_options(populate_existing=True)
    )
    c = res.scalars().first()

    # Refetch system message with relationships loaded for response_model
    last_msg_q = (
        select(Message)
        .options(selectinload(Message.sender), selectinload(Message.statuses), selectinload(Message.reactions))
        .where(Message.id == sys_msg.id)
        .execution_options(populate_existing=True)
    )
    last_msg_res = await db.execute(last_msg_q)
    last_msg = last_msg_res.scalars().first()

    return {
        "id": c.id,
        "type": c.type,
        "name": c.name,
        "avatar_url": c.avatar_url,
        "created_by": c.created_by,
        "created_at": c.created_at,
        "last_message_at": c.last_message_at,
        "participants": c.participants,
        "last_message": last_msg,
        "unread_count": 0
    }


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation_detail(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants).selectinload(ConversationParticipant.user))
        .where(Conversation.id == conversation_id)
    )
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")

    curr_p = next((p for p in c.participants if p.user_id == current_user.id and p.left_at is None), None)
    if not curr_p:
        raise HTTPException(status_code=403, detail="Not a participant of this conversation")

    display_name = c.name
    display_avatar = c.avatar_url
    if c.type == "direct":
        other_p = next((p for p in c.participants if p.user_id != current_user.id), None)
        if other_p and other_p.user:
            display_name = other_p.user.display_name
            display_avatar = other_p.user.avatar_url

    return {
        "id": c.id,
        "type": c.type,
        "name": display_name,
        "avatar_url": display_avatar,
        "created_by": c.created_by,
        "created_at": c.created_at,
        "last_message_at": c.last_message_at,
        "participants": c.participants,
        "last_message": None,
        "unread_count": 0
    }

@router.post("/{conversation_id}/members", response_model=ConversationResponse)
async def add_group_member(
    conversation_id: int,
    req: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants))
        .where(Conversation.id == conversation_id)
    )
    c = res.scalars().first()
    if not c or c.type != "group":
        raise HTTPException(status_code=404, detail="Group conversation not found")

    admin_p = next((p for p in c.participants if p.user_id == current_user.id and p.role == "admin" and p.left_at is None), None)
    if not admin_p:
        raise HTTPException(status_code=403, detail="Admin permissions required to add members")

    existing_p = next((p for p in c.participants if p.user_id == req.user_id), None)
    if existing_p and existing_p.left_at is None:
        raise HTTPException(status_code=400, detail="User is already a member of this group")

    added_user_res = await db.execute(select(User).where(User.id == req.user_id))
    added_user = added_user_res.scalars().first()
    if not added_user:
        raise HTTPException(status_code=404, detail="User to add not found")

    if existing_p:
        existing_p.left_at = None
        existing_p.role = req.role
        existing_p.joined_at = datetime.utcnow()
    else:
        new_p = ConversationParticipant(
            conversation_id=conversation_id,
            user_id=req.user_id,
            role=req.role
        )
        db.add(new_p)

    sys_msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} added {added_user.display_name}",
        type="system",
        created_at=datetime.utcnow()
    )
    db.add(sys_msg)
    c.last_message_at = datetime.utcnow()
    await db.commit()

    return await get_conversation_detail(conversation_id, current_user, db)

@router.delete("/{conversation_id}/members/{user_id}")
async def remove_group_member(
    conversation_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants))
        .where(Conversation.id == conversation_id)
    )
    c = res.scalars().first()
    if not c or c.type != "group":
        raise HTTPException(status_code=404, detail="Group conversation not found")

    admin_p = next((p for p in c.participants if p.user_id == current_user.id and p.role == "admin" and p.left_at is None), None)
    if not admin_p and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Admin permissions required to remove members")

    target_p = next((p for p in c.participants if p.user_id == user_id and p.left_at is None), None)
    if not target_p:
        raise HTTPException(status_code=404, detail="Member not active in this group")

    rem_user_res = await db.execute(select(User).where(User.id == user_id))
    rem_user = rem_user_res.scalars().first()

    target_p.left_at = datetime.utcnow()

    sys_msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} removed {rem_user.display_name if rem_user else 'a member'}",
        type="system",
        created_at=datetime.utcnow()
    )
    db.add(sys_msg)
    c.last_message_at = datetime.utcnow()
    await db.commit()

    return {"message": "Member removed from group"}

@router.post("/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: int,
    req: MarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
            ConversationParticipant.left_at.is_(None)
        )
    )
    p = res.scalars().first()
    if not p:
        raise HTTPException(status_code=403, detail="Not a participant")

    p.last_read_message_id = req.last_read_message_id
    await db.commit()
    return {"message": "Marked read"}

@router.post("/{conversation_id}/clear")
async def clear_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id
        )
    )
    p = res.scalars().first()
    if not p:
        raise HTTPException(status_code=403, detail="Not a participant")

    p.cleared_at = datetime.utcnow()
    await db.commit()
    return {"message": "Conversation cleared"}

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    c_res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    c = c_res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")

    p_res = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id
        )
    )
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=403, detail="Not a participant")

    now = datetime.utcnow()
    p.cleared_at = now
    
    if c.type == "group":
        p.left_at = now
    else:
        p.deleted_at = now
        
    await db.commit()
    return {"message": "Conversation deleted"}
