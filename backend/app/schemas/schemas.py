# Ye Pydantic models hain data validation ke liye (Pydantic models for data validation)
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

import re
from pydantic import field_validator

# --- Auth & User Schemas ---
class RegisterRequest(BaseModel):
    phone_number: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    password: Optional[str] = None

    @field_validator('phone_number')

    @classmethod
    def validate_phone(cls, v: str) -> str:
        v_clean = v.strip()
        if not v_clean:
            raise ValueError('Phone number is required')
        if not re.match(r'^\d{10}$', v_clean):
            raise ValueError('Invalid phone number. Must be exactly 10 digits (e.g. 9876543210)')
        return v_clean


    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if not v_clean:
            raise ValueError('Username is required')
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', v_clean):
            raise ValueError('Username must be 3-30 characters (letters, numbers, underscores only)')
        return v_clean


class VerifyOTPRequest(BaseModel):
    identifier: str  # phone_number or username
    otp: str = "123456"

class LoginRequest(BaseModel):
    identifier: str
    password: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    phone_number: Optional[str] = None
    username: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    is_online: bool = False
    last_seen_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Contact Schemas ---
class ContactCreate(BaseModel):
    contact_user_id: int
    nickname: Optional[str] = None

class ContactResponse(BaseModel):
    id: int
    owner_id: int
    contact_user_id: int
    nickname: Optional[str] = None
    created_at: datetime
    contact_user: UserResponse

    model_config = ConfigDict(from_attributes=True)

# --- Reaction & Status Schemas ---
class ReactionCreate(BaseModel):
    emoji: str

class MessageReactionResponse(BaseModel):
    id: int
    message_id: int
    user_id: int
    emoji: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MessageStatusResponse(BaseModel):
    id: int
    message_id: int
    user_id: int
    status: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Message Schemas ---
class MessageCreate(BaseModel):
    content: Optional[str] = None
    type: str = "text"
    reply_to_message_id: Optional[int] = None
    attachment_url: Optional[str] = None
    expires_in_seconds: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender: UserResponse
    content: Optional[str] = None
    type: str = "text"
    reply_to_message_id: Optional[int] = None
    attachment_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    edited_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    statuses: List[MessageStatusResponse] = []
    reactions: List[MessageReactionResponse] = []

    model_config = ConfigDict(from_attributes=True)

# --- Conversation & Participant Schemas ---
class ParticipantResponse(BaseModel):
    id: int
    conversation_id: int
    user_id: int
    role: str
    joined_at: datetime
    last_read_message_id: Optional[int] = None
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)

class DirectConversationCreate(BaseModel):
    target_user_id: int

class GroupConversationCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None
    member_ids: List[int]

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class AddMemberRequest(BaseModel):
    user_id: int
    role: str = "member"

class MarkReadRequest(BaseModel):
    last_read_message_id: int

class ConversationResponse(BaseModel):
    id: int
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    last_message_at: datetime
    participants: List[ParticipantResponse] = []
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)
