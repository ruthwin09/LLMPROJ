"""Document Upload & RAG File Management Endpoints."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import datetime

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.services.rag_service import process_file_content, chunk_text

router = APIRouter(prefix="/upload", tags=["upload"])


class DocumentResponseSchema(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    chunk_count: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


@router.post("", response_model=DocumentResponseSchema)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads and ingests a document (PDF, DOCX, TXT, CSV, JSON) for RAG question answering.
    """
    file_bytes = await file.read()
    filename = file.filename
    file_size = len(file_bytes)
    ext = filename.lower().split(".")[-1]

    allowed_exts = ["pdf", "docx", "txt", "csv", "json", "md"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed formats: {', '.join(allowed_exts)}"
        )

    # Extract text pages
    pages = process_file_content(file_bytes, filename)
    chunks = chunk_text(pages)

    # Save document record
    doc = Document(
        user_id=current_user.id,
        filename=filename,
        file_type=ext,
        file_size=file_size,
        page_count=len(pages),
        chunk_count=len(chunks)
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Save chunk records
    for c in chunks:
        doc_chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=c["chunk_index"],
            page_number=c["page"],
            content=c["text"]
        )
        db.add(doc_chunk)

    db.commit()
    return doc


@router.get("/documents", response_model=List[DocumentResponseSchema])
def list_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all uploaded documents for current user."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    return docs


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes uploaded document and its index chunks."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
