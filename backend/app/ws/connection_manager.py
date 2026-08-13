# Ye WebSocket connections aur real-time events handle karta hai (Handles WebSocket connections and real-time events)
import json
import logging
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSessionLocal
from app.models.models import User, Conversation, ConversationParticipant, Message, MessageStatus

logger = logging.getLogger("chatnest.ws")

class ConnectionManager:
    def __init__(self):
        # Map user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
        # Update user status to online in DB and notify contacts
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(User).where(User.id == user_id).values(is_online=True, last_seen_at=datetime.utcnow())
            )
            await session.commit()
            
        await self.broadcast_presence(user_id, is_online=True)

    async def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(User).where(User.id == user_id).values(is_online=False, last_seen_at=datetime.utcnow())
            )
            await session.commit()
            
        await self.broadcast_presence(user_id, is_online=False)

    async def send_personal_json(self, user_id: int, data: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(data)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")

    async def broadcast_presence(self, user_id: int, is_online: bool):
        event = {
            "type": "presence:update",
            "payload": {
                "user_id": user_id,
                "is_online": is_online,
                "last_seen_at": datetime.utcnow().isoformat()
            }
        }
        for uid in list(self.active_connections.keys()):
            if uid != user_id:
                await self.send_personal_json(uid, event)

    async def handle_event(self, sender_id: int, data: dict):
        event_type = data.get("type")
        payload = data.get("payload", {})

        if event_type == "message:send":
            await self._handle_message_send(sender_id, payload)
        elif event_type in ("typing:start", "typing:stop"):
            await self._handle_typing(sender_id, payload, is_typing=(event_type == "typing:start"))
        elif event_type == "message:read":
            await self._handle_message_read(sender_id, payload)

    async def _handle_message_send(self, sender_id: int, payload: dict):
        conversation_id = payload.get("conversation_id")
        content = payload.get("content")
        msg_type = payload.get("type", "text")
        reply_to_id = payload.get("reply_to_message_id")
        attachment_url = payload.get("attachment_url")

        if not conversation_id or (not content and not attachment_url):
            return

        async with AsyncSessionLocal() as session:
            # Check conversation membership
            result = await session.execute(
                select(ConversationParticipant).where(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.user_id == sender_id,
                    ConversationParticipant.left_at.is_(None)
                )
            )
            participant = result.scalars().first()
            if not participant:
                return

            # Create message
            new_message = Message(
                conversation_id=conversation_id,
                sender_id=sender_id,
                content=content,
                type=msg_type,
                reply_to_message_id=reply_to_id,
                attachment_url=attachment_url,
                created_at=datetime.utcnow()
            )
            session.add(new_message)
            await session.flush()

            # Fetch all participants to create MessageStatus records
            p_result = await session.execute(
                select(ConversationParticipant).where(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.left_at.is_(None)
                )
            )
            participants = p_result.scalars().all()

            # Update conversation last_message_at and sender's last_read_message_id
            await session.execute(
                update(Conversation)
                .where(Conversation.id == conversation_id)
                .values(last_message_at=datetime.utcnow())
            )
            await session.execute(
                update(ConversationParticipant)
                .where(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.user_id == sender_id
                )
                .values(last_read_message_id=new_message.id)
            )


            statuses = []
            for p in participants:
                if p.user_id != sender_id:
                    # If user is online, set status to delivered instantly, else sent
                    st_val = "delivered" if p.user_id in self.active_connections else "sent"
                    st = MessageStatus(
                        message_id=new_message.id,
                        user_id=p.user_id,
                        status=st_val,
                        updated_at=datetime.utcnow()
                    )
                    session.add(st)
                    statuses.append(st)

            await session.commit()

            # Load full sender info for serialization
            sender_res = await session.execute(select(User).where(User.id == sender_id))
            sender_user = sender_res.scalars().first()

            msg_payload = {
                "id": new_message.id,
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "sender": {
                    "id": sender_user.id,
                    "username": sender_user.username,
                    "display_name": sender_user.display_name,
                    "avatar_url": sender_user.avatar_url,
                    "is_online": sender_user.is_online,
                    "last_seen_at": sender_user.last_seen_at.isoformat() if sender_user.last_seen_at else None,
                    "created_at": sender_user.created_at.isoformat()
                },
                "content": new_message.content,
                "type": new_message.type,
                "reply_to_message_id": new_message.reply_to_message_id,
                "attachment_url": new_message.attachment_url,
                "created_at": new_message.created_at.isoformat(),
                "statuses": [
                    {
                        "id": st.id,
                        "message_id": st.message_id,
                        "user_id": st.user_id,
                        "status": st.status,
                        "updated_at": st.updated_at.isoformat()
                    }
                    for st in statuses
                ],
                "reactions": []
            }

            # Broadcast message:new to all participants
            new_msg_event = {"type": "message:new", "payload": msg_payload}
            for p in participants:
                await self.send_personal_json(p.user_id, new_msg_event)

            # Automatically clear typing indicator for the message sender
            await self._handle_typing(sender_id, {"conversation_id": conversation_id}, is_typing=False)


    async def _handle_typing(self, sender_id: int, payload: dict, is_typing: bool):
        conversation_id = payload.get("conversation_id")
        if not conversation_id:
            return

        async with AsyncSessionLocal() as session:
            p_result = await session.execute(
                select(ConversationParticipant.user_id).where(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.left_at.is_(None)
                )
            )
            participant_ids = p_result.scalars().all()

        event = {
            "type": "typing:update",
            "payload": {
                "conversation_id": conversation_id,
                "user_id": sender_id,
                "is_typing": is_typing
            }
        }
        for uid in participant_ids:
            if uid != sender_id:
                await self.send_personal_json(uid, event)

    async def _handle_message_read(self, sender_id: int, payload: dict):
        conversation_id = payload.get("conversation_id")
        message_id = payload.get("message_id")
        if not conversation_id or not message_id:
            return

        async with AsyncSessionLocal() as session:
            # Update last_read_message_id on participant row
            await session.execute(
                update(ConversationParticipant)
                .where(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.user_id == sender_id
                )
                .values(last_read_message_id=message_id)
            )

            # Update statuses for all messages in this conversation up to message_id for this user
            messages_res = await session.execute(
                select(Message.id).where(
                    Message.conversation_id == conversation_id,
                    Message.id <= message_id
                )
            )
            msg_ids = messages_res.scalars().all()

            if msg_ids:
                await session.execute(
                    update(MessageStatus)
                    .where(
                        MessageStatus.message_id.in_(msg_ids),
                        MessageStatus.user_id == sender_id
                    )
                    .values(status="read", updated_at=datetime.utcnow())
                )

            await session.commit()

            # Find participants to notify message:status update (especially message sender)
            p_result = await session.execute(
                select(ConversationParticipant.user_id).where(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.left_at.is_(None)
                )
            )
            participant_ids = p_result.scalars().all()

        event = {
            "type": "message:status",
            "payload": {
                "conversation_id": conversation_id,
                "message_id": message_id,
                "user_id": sender_id,
                "status": "read"
            }
        }
        for uid in participant_ids:
            await self.send_personal_json(uid, event)

manager = ConnectionManager()
