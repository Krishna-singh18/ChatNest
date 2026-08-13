# Ye users search aur contacts ke endpoints hai (Endpoints for searching users and contacts)
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import User, Contact
from app.schemas.schemas import UserResponse, UserUpdate, ContactCreate, ContactResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="", tags=["Users & Contacts"])

@router.get("/users/search", response_model=List[UserResponse])
async def search_users(
    q: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.id != current_user.id)
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.where(
            or_(
                User.username.ilike(search_term),
                User.display_name.ilike(search_term),
                User.phone_number.ilike(search_term)
            )
        )
    query = query.limit(50)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/users/me", response_model=UserResponse)
async def update_profile(
    req: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.display_name is not None:
        current_user.display_name = req.display_name
    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/contacts", response_model=List[ContactResponse])
async def list_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.contact_user))
        .where(Contact.owner_id == current_user.id)
    )
    return result.scalars().all()

@router.post("/contacts", response_model=ContactResponse)
async def add_contact(
    req: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.contact_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")

    target_res = await db.execute(select(User).where(User.id == req.contact_user_id))
    target = target_res.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User to add not found")

    existing_res = await db.execute(
        select(Contact).where(
            Contact.owner_id == current_user.id,
            Contact.contact_user_id == req.contact_user_id
        )
    )
    if existing_res.scalars().first():
        raise HTTPException(status_code=400, detail="Contact already added")

    new_contact = Contact(
        owner_id=current_user.id,
        contact_user_id=req.contact_user_id,
        nickname=req.nickname
    )
    db.add(new_contact)
    await db.commit()

    # Re-fetch with contact_user loaded
    res = await db.execute(
        select(Contact)
        .options(selectinload(Contact.contact_user))
        .where(Contact.id == new_contact.id)
    )
    return res.scalars().first()

@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.owner_id == current_user.id
        )
    )
    contact = res.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    await db.delete(contact)
    await db.commit()
    return {"message": "Contact removed"}
