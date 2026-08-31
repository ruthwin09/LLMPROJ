# 🚀 ChatGPT-Style AI Platform — Project Phase 3

A deployable, multi-user **ChatGPT-Style AI Web Application** built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **FastAPI**, **PostgreSQL**, **JWT & Google OAuth**, **Hosted LLM Endpoints**, and a **RAG Document Engine** for PDF, DOCX, TXT, CSV, and JSON QA with page citations.

---

## 🌟 Key Architecture & Features

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Frontend UI** | **Next.js + React + TypeScript + Tailwind** | ChatGPT dark UX, responsive sidebar, streaming typing effect, markdown parsing, code syntax highlighting + copy, upvote/downvote feedback, user settings. |
| **Backend API** | **FastAPI (Python)** | Async endpoints, JWT bearer auth, Google OAuth login, Server-Sent Events (SSE) token streaming, database session management. |
| **Hosted LLMs** | **Groq / OpenAI / Gemini / OpenRouter** | Zero local GPU needed; streams completions from hosted cloud API endpoints (`Llama 3.3 70B`, `Qwen 2.5 Coder`, `GPT-4o Mini`, `Gemini 1.5 Flash`). |
| **RAG Engine** | **PyPDF + python-docx + Pandas + TF-IDF Vector Search** | Extracts text from PDF, DOCX, TXT, CSV, JSON; chunks content; retrieves contextual passages with page & file citations (`[Document.pdf, Page 3]`). |
| **Database** | **PostgreSQL / SQLite** | Multi-tenant user schema, persistent chat history, document chunk indices. |

---

## 📂 Project Directory Structure

```
LLM-PROJECT/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # Signup, Login, Google OAuth, Profile, Password Reset
│   │   │   ├── chat.py          # Multi-turn SSE streaming, conversation CRUD, search
│   │   │   ├── upload.py        # PDF, DOCX, TXT, CSV, JSON ingestion & RAG search
│   │   │   └── settings.py      # User settings & API key manager
│   │   ├── core/
│   │   │   ├── config.py        # ENV configuration & settings
│   │   │   ├── database.py      # PostgreSQL / SQLite async engine
│   │   │   └── security.py      # Bcrypt password hashing & JWT token handling
│   │   ├── models/
│   │   │   ├── user.py          # User & Auth schemas
│   │   │   ├── chat.py          # Conversation & Message schemas
│   │   │   └── document.py      # Document & Chunk schemas
│   │   ├── services/
│   │   │   ├── llm_service.py   # Hosted LLM streaming client (Groq/OpenAI/Gemini/OpenRouter)
│   │   │   └── rag_service.py   # File parsing, text chunking, and similarity search
│   │   └── main.py              # FastAPI server entry point
│   ├── requirements.txt         # Backend Python dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Main ChatGPT platform view
│   │   │   ├── login/page.tsx   # Login page
│   │   │   ├── register/page.tsx# Registration page
│   │   │   └── settings/page.tsx# User profile & settings page
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      # Conversation list, search, rename, delete
│   │   │   ├── Header.tsx       # Model picker, dark mode, user menu
│   │   │   ├── ChatWindow.tsx   # Chat bubble streaming, markdown, syntax highlighter
│   │   │   ├── ChatInput.tsx    # Message input + attachment button
│   │   │   ├── DocumentDrawer.tsx# RAG file upload drawer
│   │   │   └── CodeBlock.tsx    # Code syntax block with copy button
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios & SSE streaming reader
│   │   │   └── auth.ts          # Token storage manager
│   │   └── types/
│   │       └── index.ts         # TypeScript definitions
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## ⚡ Local Quickstart Guide

### 1. Run FastAPI Backend

```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

FastAPI server runs at `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).

### 2. Run Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🌐 Cloud Deployment Guide

1. **Backend (Render / Railway / Fly.io)**:
   - Deploy `backend/` directory as Python web service.
   - Set environment variables (`DATABASE_URL`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `SECRET_KEY`).
2. **Database (Supabase / Neon / Render PostgreSQL)**:
   - Provide standard PostgreSQL string `postgresql://user:pass@host:5432/dbname`.
3. **Frontend (Vercel / Netlify)**:
   - Deploy `frontend/` directory to Vercel.
   - Set `NEXT_PUBLIC_API_URL` to backend URL.
