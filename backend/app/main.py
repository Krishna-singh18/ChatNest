# Ye app ka main entry point hai (This is the main entry point of the app)
import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import engine, Base, AsyncSessionLocal
from app.models.models import User
from app.routers import auth, users, conversations, messages
from app.ws.connection_manager import manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chatnest.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI Backend for ChatNest (Signal Clone) with REST & Real-time WebSockets",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during dev/demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(messages.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    user_id_str = decode_access_token(token)
    if not user_id_str:
        await websocket.close(code=4001, reason="Invalid authentication token")
        return

    user_id = int(user_id_str)
    await manager.connect(user_id, websocket)
    logger.info(f"WebSocket connected: user {user_id}")

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
                await manager.handle_event(user_id, data)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from user {user_id}: {raw_data}")
            except Exception as e:
                logger.error(f"Error processing WS event from user {user_id}: {e}")
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
        logger.info(f"WebSocket disconnected: user {user_id}")
