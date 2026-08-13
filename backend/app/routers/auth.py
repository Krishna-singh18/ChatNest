# Ye login aur registration ke endpoints manage karta hai (Manages login and registration endpoints)
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import RegisterRequest, VerifyOTPRequest, LoginRequest, TokenResponse, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

async def get_current_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authentication token")
    
    token = authorization.split(" ")[1]
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.id == int(user_id_str)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user

@router.post("/register", response_model=UserResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not req.phone_number or not req.phone_number.strip():
        raise HTTPException(status_code=400, detail="Phone number is required")
    if not req.username or not req.username.strip():
        raise HTTPException(status_code=400, detail="Username is required")

    # Check duplicate username
    uname_res = await db.execute(select(User).where(User.username == req.username.strip().lower()))
    if uname_res.scalars().first():
        raise HTTPException(status_code=400, detail=f"Username '@{req.username.strip().lower()}' is already taken")

    # Check duplicate phone_number
    phone_res = await db.execute(select(User).where(User.phone_number == req.phone_number.strip()))
    if phone_res.scalars().first():
        raise HTTPException(status_code=400, detail=f"Phone number '{req.phone_number.strip()}' is already registered")

    pwd_hash = get_password_hash(req.password) if req.password else None
    new_user = User(
        phone_number=req.phone_number.strip(),
        username=req.username.strip().lower(),
        display_name=req.display_name.strip(),
        avatar_url=req.avatar_url,
        password_hash=pwd_hash,
        last_seen_at=datetime.utcnow()
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(req: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    # Mock OTP verification (accepts '123456' or any 6-digit code in dev mode)
    result = await db.execute(
        select(User).where(
            or_(User.phone_number == req.identifier, User.username == req.identifier)
        )
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found with provided identifier")

    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token, user=user)

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            or_(User.phone_number == req.identifier, User.username == req.identifier)
        )
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Invalid phone number/username or password")

    if user.password_hash:
        if not req.password or not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    else:
        # For seeded demo users without a password_hash, we allow them to login with a generic password 'password123'
        if req.password != 'password123':
            raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token, user=user)

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
