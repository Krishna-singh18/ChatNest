# Yahan saare database tables define kiye gaye hain (All database tables are defined here)
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phone_number = Column(String(32), unique=True, nullable=True, index=True)
    username = Column(String(64), unique=True, nullable=True, index=True)
    display_name = Column(String(128), nullable=False)
    avatar_url = Column(Text, nullable=True)
    password_hash = Column(String(256), nullable=True)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_online = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    contacts = relationship("Contact", foreign_keys="Contact.owner_id", back_populates="owner", cascade="all, delete-orphan")
    participants = relationship("ConversationParticipant", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="sender")

class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (
        UniqueConstraint("owner_id", "contact_user_id", name="uq_owner_contact"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nickname = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="contacts")
    contact_user = relationship("User", foreign_keys=[contact_user_id])

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(String(16), nullable=False, default="direct")  # 'direct' or 'group'
    name = Column(String(128), nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_message_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"
    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conversation_user"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(16), default="member", nullable=False)  # 'admin' or 'member'
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)
    cleared_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    last_read_message_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)

    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User", back_populates="participants")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=True)
    type = Column(String(16), default="text", nullable=False)  # 'text', 'image', 'file', 'system'
    reply_to_message_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    attachment_url = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    edited_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")
    statuses = relationship("MessageStatus", back_populates="message", cascade="all, delete-orphan")
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")
    reply_to = relationship("Message", remote_side=[id])

class MessageStatus(Base):
    __tablename__ = "message_status"
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_message_user_status"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(16), default="sent", nullable=False)  # 'sent', 'delivered', 'read'
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    message = relationship("Message", back_populates="statuses")
    user = relationship("User")

class MessageReaction(Base):
    __tablename__ = "message_reactions"
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", "emoji", name="uq_message_user_emoji"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    emoji = Column(String(16), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    message = relationship("Message", back_populates="reactions")
    user = relationship("User")
