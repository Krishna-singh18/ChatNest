# Ye database me dummy data daalne ke liye script hai (This script seeds dummy data into the DB)
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select, delete

from app.db.session import AsyncSessionLocal, engine, Base
from app.models.models import (
    User, Contact, Conversation, ConversationParticipant, Message, MessageStatus, MessageReaction
)
from app.core.security import get_password_hash

async def seed_data():
    print("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("Clearing existing data...")
        await session.execute(delete(MessageReaction))
        await session.execute(delete(MessageStatus))
        await session.execute(delete(Message))
        await session.execute(delete(ConversationParticipant))
        await session.execute(delete(Conversation))
        await session.execute(delete(Contact))
        await session.execute(delete(User))
        await session.commit()

        print("Seeding demo users...")
        now = datetime.utcnow()

        users_data = [
            {
                "username": "priya",
                "phone_number": "9876543210",
                "display_name": "Priya Sharma",
                "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            },
            {
                "username": "rahul",
                "phone_number": "9876543211",
                "display_name": "Rahul Mehta",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            },
            {
                "username": "ananya",
                "phone_number": "9876543212",
                "display_name": "Ananya Roy",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            },
            {
                "username": "vikram",
                "phone_number": "9876543213",
                "display_name": "Vikram Singh",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            },
            {
                "username": "sara",
                "phone_number": "9876543214",
                "display_name": "Sara Chen",
                "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
            },
        ]

        users = {}
        for ud in users_data:
            user = User(
                username=ud["username"],
                phone_number=ud["phone_number"],
                display_name=ud["display_name"],
                avatar_url=ud["avatar_url"],
                password_hash=get_password_hash("password123"),
                is_online=True if ud["username"] in ("priya", "rahul") else False,
                last_seen_at=now - timedelta(minutes=5)
            )
            session.add(user)
            users[ud["username"]] = user

        await session.flush()

        print("Seeding contacts...")
        contacts = [
            Contact(owner_id=users["priya"].id, contact_user_id=users["rahul"].id, nickname="Rahul (Tech Lead)"),
            Contact(owner_id=users["priya"].id, contact_user_id=users["ananya"].id, nickname="Ananya"),
            Contact(owner_id=users["priya"].id, contact_user_id=users["vikram"].id, nickname="Vikram"),
            Contact(owner_id=users["rahul"].id, contact_user_id=users["priya"].id),
            Contact(owner_id=users["rahul"].id, contact_user_id=users["ananya"].id),
            Contact(owner_id=users["rahul"].id, contact_user_id=users["sara"].id),
        ]
        session.add_all(contacts)
        await session.flush()

        print("Seeding 1:1 & Group conversations...")
        # 1:1 Priya & Rahul
        conv_pr = Conversation(type="direct", created_by=users["priya"].id, last_message_at=now - timedelta(minutes=2))
        # 1:1 Priya & Ananya
        conv_pa = Conversation(type="direct", created_by=users["ananya"].id, last_message_at=now - timedelta(hours=1))
        # Group: Signal Dev Team
        conv_group = Conversation(
            type="group",
            name="Signal Dev Team 🚀",
            avatar_url="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
            created_by=users["rahul"].id,
            last_message_at=now - timedelta(minutes=15)
        )

        session.add_all([conv_pr, conv_pa, conv_group])
        await session.flush()

        # Add participants
        part_pr1 = ConversationParticipant(conversation_id=conv_pr.id, user_id=users["priya"].id, role="admin")
        part_pr2 = ConversationParticipant(conversation_id=conv_pr.id, user_id=users["rahul"].id, role="member")

        part_pa1 = ConversationParticipant(conversation_id=conv_pa.id, user_id=users["priya"].id, role="admin")
        part_pa2 = ConversationParticipant(conversation_id=conv_pa.id, user_id=users["ananya"].id, role="member")

        part_g1 = ConversationParticipant(conversation_id=conv_group.id, user_id=users["rahul"].id, role="admin")
        part_g2 = ConversationParticipant(conversation_id=conv_group.id, user_id=users["priya"].id, role="member")
        part_g3 = ConversationParticipant(conversation_id=conv_group.id, user_id=users["ananya"].id, role="member")
        part_g4 = ConversationParticipant(conversation_id=conv_group.id, user_id=users["vikram"].id, role="member")

        session.add_all([part_pr1, part_pr2, part_pa1, part_pa2, part_g1, part_g2, part_g3, part_g4])
        await session.flush()

        print("Seeding messages...")
        # Messages in Priya <-> Rahul
        messages_pr = [
            ("rahul", "Hey Priya! Did you check out the new Signal Clone design specs?", now - timedelta(hours=3)),
            ("priya", "Yes! The dark mode theme and clean message bubble specs look awesome 🔥", now - timedelta(hours=2, minutes=50)),
            ("rahul", "Great! The real-time status transitions (sent → delivered → read) are super smooth over WebSockets.", now - timedelta(hours=2, minutes=30)),
            ("priya", "Awesome! Testing the blue double-tick read receipts right now.", now - timedelta(minutes=2))
        ]

        last_msg_id = None
        for sender_uname, text, ts in messages_pr:
            msg = Message(
                conversation_id=conv_pr.id,
                sender_id=users[sender_uname].id,
                content=text,
                type="text",
                created_at=ts
            )
            session.add(msg)
            await session.flush()
            last_msg_id = msg.id

            recipient = users["rahul"] if sender_uname == "priya" else users["priya"]
            st = MessageStatus(message_id=msg.id, user_id=recipient.id, status="read", updated_at=ts)
            session.add(st)

        part_pr1.last_read_message_id = last_msg_id
        part_pr2.last_read_message_id = last_msg_id

        # Messages in Group
        messages_group = [
            ("rahul", "Rahul Mehta created the group \"Signal Dev Team 🚀\"", now - timedelta(days=1), "system"),
            ("rahul", "Welcome team! Let's build the ultimate Signal Messenger clone.", now - timedelta(days=1, minutes=-5), "text"),
            ("ananya", "Thanks Rahul! Frontend is setup with Next.js App Router & Tailwind.", now - timedelta(hours=10), "text"),
            ("vikram", "Backend FastAPI REST & WebSockets are ready!", now - timedelta(hours=5), "text"),
            ("priya", "Group member administration and typing indicators are live!", now - timedelta(minutes=15), "text"),
        ]

        g_last_id = None
        for sender_uname, text, ts, mtype in messages_group:
            msg = Message(
                conversation_id=conv_group.id,
                sender_id=users[sender_uname].id,
                content=text,
                type=mtype,
                created_at=ts
            )
            session.add(msg)
            await session.flush()
            g_last_id = msg.id

            for member_name in ["priya", "rahul", "ananya", "vikram"]:
                if member_name != sender_uname:
                    st = MessageStatus(message_id=msg.id, user_id=users[member_name].id, status="read", updated_at=ts)
                    session.add(st)

        part_g1.last_read_message_id = g_last_id
        part_g2.last_read_message_id = g_last_id
        part_g3.last_read_message_id = g_last_id
        part_g4.last_read_message_id = g_last_id

        await session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
