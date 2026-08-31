"""Chat & Conversation API Endpoints."""

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import datetime

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.chat import Conversation, Message
from app.models.document import Document, DocumentChunk
from app.services.llm_service import stream_chat_completion, HOSTED_MODELS
from app.services.rag_service import compute_tf_idf_similarity

router = APIRouter(prefix="/chat", tags=["chat"])


# Schemas
class MessageSchema(BaseModel):
    id: str
    role: str
    content: str
    citations: Optional[List[Dict[str, Any]]] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ConversationSchema(BaseModel):
    id: str
    title: str
    model: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    messages: Optional[List[MessageSchema]] = []

    class Config:
        from_attributes = True


class CreateConversationSchema(BaseModel):
    title: Optional[str] = "New Chat"
    model: Optional[str] = "llama-3.3-70b-versatile"


class UpdateConversationSchema(BaseModel):
    title: str


class ChatStreamRequestSchema(BaseModel):
    conversation_id: str
    message: str
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    document_ids: Optional[List[str]] = None


@router.get("/conversations", response_model=List[ConversationSchema])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all conversations for current user ordered by update time."""
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return conversations


@router.post("/conversations", response_model=ConversationSchema)
def create_conversation(
    data: CreateConversationSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new chat conversation."""
    conv = Conversation(
        user_id=current_user.id,
        title=data.title or "New Chat",
        model=data.model or current_user.preferred_model or "llama-3.3-70b-versatile"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversations/search", response_model=List[ConversationSchema])
def search_conversations(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Searches conversation titles and message content."""
    query_str = f"%{q.lower()}%"
    conversations = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == current_user.id,
            Conversation.title.ilike(query_str)
        )
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationSchema)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gets conversation with messages."""
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.patch("/conversations/{conversation_id}", response_model=ConversationSchema)
def update_conversation(
    conversation_id: str,
    data: UpdateConversationSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Renames conversation."""
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.title = data.title
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes conversation."""
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully"}


@router.post("/stream")
async def stream_chat(
    data: ChatStreamRequestSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Streams AI response for user message, persisting conversation history and RAG citations.
    """
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == data.conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        # Self-healing: auto-create conversation if missing/expired ID was provided
        clean_title = data.message.strip().replace("\n", " ")
        conv = Conversation(
            id=data.conversation_id,
            user_id=current_user.id,
            title=clean_title[:32] + "..." if len(clean_title) > 32 else (clean_title or "New Chat"),
            model=data.model or current_user.preferred_model or "llama-3.3-70b-versatile"
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    elif not conv.messages:
        clean_title = data.message.strip().replace("\n", " ")
        conv.title = clean_title[:32] + "..." if len(clean_title) > 32 else clean_title

    # Save User message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=data.message.strip()
    )
    db.add(user_msg)
    db.commit()

    # RAG Retrieval if documents attached or exist for user
    rag_citations = []
    rag_context_prompt = ""
    
    docs_to_search = []
    if data.document_ids:
        docs_to_search = db.query(Document).filter(Document.id.in_(data.document_ids), Document.user_id == current_user.id).all()
    else:
        docs_to_search = db.query(Document).filter(Document.user_id == current_user.id).all()

    if docs_to_search:
        all_chunks = []
        for doc in docs_to_search:
            for chunk in doc.chunks:
                all_chunks.append({
                    "text": chunk.content,
                    "page": chunk.page_number,
                    "filename": doc.filename
                })
        relevant = compute_tf_idf_similarity(data.message, all_chunks, top_k=4)
        if not relevant and all_chunks:
            # Fallback for generic queries like "summarize this document" or "analyse this file"
            relevant = all_chunks[:4]

        if relevant:
            rag_citations = [{"filename": r.get("filename", "Document"), "page": r.get("page", 1), "text": r["text"][:150] + "..."} for r in relevant]
            context_blocks = [f"Source: {r.get('filename', 'Document')} (Page {r.get('page', 1)}):\n{r['text']}" for r in relevant]
            rag_context_prompt = "\n\nContext information from uploaded documents:\n" + "\n---\n".join(context_blocks) + "\n\nAnswer using the context above when applicable and cite page sources."

    # Build prompt messages history
    messages_history = []
    for msg in conv.messages:
        messages_history.append({"role": msg.role, "content": msg.content})

    sys_prompt = data.system_prompt or "You are a helpful, accurate, and concise AI assistant."
    if rag_context_prompt:
        sys_prompt += rag_context_prompt

    model_to_use = data.model or conv.model or current_user.preferred_model or "llama-3.3-70b-versatile"

    async def event_generator():
        full_response_accumulated = []
        try:
            async for chunk in stream_chat_completion(
                messages=messages_history,
                model_name=model_to_use,
                user_api_key=current_user.user_api_key,
                system_prompt=sys_prompt
            ):
                if chunk.startswith("data: "):
                    data_str = chunk[6:].strip()
                    if data_str != "[DONE]":
                        try:
                            parsed = json.loads(data_str)
                            full_response_accumulated.append(parsed.get("content", ""))
                        except Exception:
                            pass
                yield chunk

            full_assistant_text = "".join(full_response_accumulated).strip()
            
            # Save Assistant message in DB
            asst_msg = Message(
                conversation_id=conv.id,
                role="assistant",
                content=full_assistant_text or "No response generated.",
                citations=rag_citations if rag_citations else None
            )
            db.add(asst_msg)
            conv.updated_at = datetime.datetime.utcnow()
            db.commit()

        except Exception as e:
            err_msg = f"\n[Streaming error: {str(e)}]"
            yield f"data: {json.dumps({'content': err_msg})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
