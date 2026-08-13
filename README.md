# ChatNest — Secure Real-Time Messaging Platform (Signal Clone)

[![Signal Clone](https://img.shields.io/badge/Signal-Clone-3A76F0?style=for-the-badge&logo=signal&logoColor=white)](https://github.com/Krishna-singh18/ChatNest)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**ChatNest** is a high-fidelity, real-time messaging application replicating Signal Messenger's visual identity, user experience, and core chat workflows. 

Built for the SDE Fullstack Assignment, ChatNest features real-time 1:1 direct messaging, group chat with admin controls, live delivery & read receipts (`sending` → `sent` → `delivered` → `read`), typing indicators, emoji reactions, quoted replies, dark/light theme switching, and a perfectly synchronized SQLite database.

> **One-line pitch:** *"Signal's look and feel, built fast, expertly documented."*

## 🌐 Live Demo

The application is currently hosted 24/7 on an **AWS EC2** instance using **Docker Containers**. 
You can access the live chat environment here:
**👉 [http://54.90.76.125:3000/chat](http://54.90.76.125:3000/chat)**

---

## 🌟 Key Features

- **Signal UX & Visual Parity**:
  - Authentically styled message bubbles, sender alignment, custom timestamps, and Signal privacy badges.
  - Native dark/light mode toggle (`data-theme="dark"`).
  - Responsive layout (desktop 2-pane / mobile 1-pane with navigation back state).
  - Custom sleek SVG App Icon specifically designed for ChatNest.
- **Authentication & Onboarding**:
  - Phone number or username registration with display name.
  - Multi-step login flow with fixed mock OTP verification (`123456`) for rapid evaluation.
  - JWT session persistence stored securely in client state & local storage.
- **Real-Time 1:1 & Group Messaging**:
  - Instant WebSocket push delivery across active client sockets.
  - Accurate status lifecycle: single tick (sent), double grey tick (delivered), double blue tick (read).
  - Group creation, member multi-select picker, admin badges, and admin member removal controls.
  - Automated typing indicator broadcast with 2-second auto-clear timer upon message send or typing pause.
  - Quoted message replies and emoji reactions popover (`❤️`, `👍`, `🔥`, `😂`, `😮`, `🙏`).
- **Fully Documented Codebase**:
  - **Every single file** in both the Frontend (Next.js) and Backend (FastAPI) contains descriptive 1-line Hinglish-English comments at the top, explaining exactly what the file does.
- **Clean Architecture**:
  - Zero unused boilerplate. All default Next.js SVGs and leftover testing scripts have been aggressively pruned to ensure the repository contains *only* ChatNest code.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend: Next.js 14+ (TypeScript)          │
│  - App Router (/login, /register, /chat)                │
│  - Tailwind CSS + Signal Dark/Light Design System       │
│  - React Query (@tanstack/react-query) + useSocket      │
└─────────────┬─────────────────────────────┬─────────────┘
              │ HTTPS (REST API)            │ WSS (WebSockets)
              ▼                             ▼
┌─────────────────────────────────────────────────────────┐
│               Backend: FastAPI (Python 3.10+)           │
│  - REST Routers (auth, users, contacts, conversations)   │
│  - ConnectionManager (user_id -> WS map & room dispatch) │
│  - SQLAlchemy 2.x Async ORM + Pydantic v2               │
└─────────────┬───────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────┐
│                    SQLite Database                      │
│ (users, contacts, conversations, participants, messages)│
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ Real-Time WebSocket Protocol

**Endpoint:** `ws://<host>/ws?token=<jwt_token>`

Client envelope: `{ "type": "<event>", "payload": { ... } }`

| Event Type | Direction | Payload | Purpose |
|---|---|---|---|
| `message:send` | Client → Server | `{ conversation_id, content, reply_to_message_id? }` | Send a new message |
| `typing:start` | Client → Server | `{ conversation_id }` | Broadcast typing start |
| `typing:stop` | Client → Server | `{ conversation_id }` | Broadcast typing stop |
| `message:read` | Client → Server | `{ conversation_id, message_id }` | Mark read up to message |
| `message:new` | Server → Client | Full message object | Push incoming message |
| `message:status` | Server → Client | `{ conversation_id, message_id, user_id, status }` | Live tick update (blue double tick) |
| `typing:update` | Server → Client | `{ conversation_id, user_id, is_typing }` | Live typing indicator update |
| `presence:update` | Server → Client | `{ user_id, is_online, last_seen_at }` | User online/offline update |

---

## 🛠️ Quick Start & Setup Instructions

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ & pip
- Git

*Note: Environment variables (`backend/.env` and `frontend/.env.local`) are pre-configured out of the box for immediate testing.*

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run database migration & seed script (creates 5 users & 50+ messages)
python -m app.db.seed

# Start FastAPI dev server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI REST API & Swagger docs will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup (Next.js)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🔑 Pre-Seeded Evaluation Credentials

The database comes pre-seeded with populated contacts, direct chats, and a group conversation:

| Username | Phone Number | Mock OTP Code | Role |
|---|---|---|---|
| `priya` | `9876543210` | `123456` | Active chatter (1:1 & Group) |
| `rahul` | `9876543211` | `123456` | Group Admin (`Signal Dev Team 🚀`) |
| `ananya` | `9876543212` | `123456` | Group Member |
| `vikram` | `9876543213` | `123456` | Group Member |
| `sara` | `9876543214` | `123456` | Registered user |

> **Quick Login**: On the `/login` page, simply click any of the quick-login pills (`@priya`, `@rahul`, `@ananya`) to auto-fill the identifier and verify instantly.

---

## 🧪 Testing

### Backend Unit & Integration Tests
Run automated pytest suite covering Auth, REST endpoints, and WebSocket message serialization:

```bash
cd backend
python -m pytest
```

### Frontend Production Build Check
Run Next.js type-checking & static site generation verification:

```bash
cd frontend
npm run build
```

---



