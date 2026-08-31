"""RAG Service for file ingestion (PDF, DOCX, TXT, CSV, JSON), text chunking, and similarity retrieval."""

import io
import json
import math
import pandas as pd
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
from docx import Document as DocxDocument


def process_file_content(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Parses file content and extracts structured pages/chunks.
    Returns list of dicts: {"page": int, "text": str}
    """
    ext = filename.lower().split(".")[-1]
    pages_text = []

    try:
        if ext == "pdf":
            reader = PdfReader(io.BytesIO(file_bytes))
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append({"page": idx + 1, "text": text.strip()})
        elif ext == "docx":
            doc = DocxDocument(io.BytesIO(file_bytes))
            full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            pages_text.append({"page": 1, "text": full_text})
        elif ext in ["txt", "md"]:
            text = file_bytes.decode("utf-8", errors="ignore")
            pages_text.append({"page": 1, "text": text})
        elif ext == "csv":
            df = pd.read_csv(io.BytesIO(file_bytes))
            summary_text = f"CSV File '{filename}' with columns: {list(df.columns)}\nData Summary:\n{df.head(20).to_string()}"
            pages_text.append({"page": 1, "text": summary_text})
        elif ext == "json":
            json_data = json.loads(file_bytes.decode("utf-8", errors="ignore"))
            formatted_json = json.dumps(json_data, indent=2)
            pages_text.append({"page": 1, "text": formatted_json[:5000]})
        else:
            text = file_bytes.decode("utf-8", errors="ignore")
            pages_text.append({"page": 1, "text": text})
    except Exception as e:
        pages_text.append({"page": 1, "text": f"Error extracting content from {filename}: {str(e)}"})

    return pages_text


def chunk_text(pages: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, Any]]:
    """
    Splits page text into overlapping semantic chunks with page provenance.
    """
    chunks = []
    chunk_index = 0

    for page_info in pages:
        page_num = page_info["page"]
        text = page_info["text"]
        words = text.split()

        if len(words) <= chunk_size:
            chunks.append({
                "chunk_index": chunk_index,
                "page": page_num,
                "text": text
            })
            chunk_index += 1
        else:
            step = chunk_size - overlap
            for i in range(0, len(words), step):
                chunk_words = words[i:i + chunk_size]
                chunk_text_str = " ".join(chunk_words)
                chunks.append({
                    "chunk_index": chunk_index,
                    "page": page_num,
                    "text": chunk_text_str
                })
                chunk_index += 1

    return chunks


def compute_tf_idf_similarity(query: str, chunks: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Computes lightweight keyword TF-IDF similarity score to rank relevant document chunks.
    Returns top_k chunks with citation information.
    """
    if not chunks:
        return []

    query_terms = set(query.lower().split())
    results = []

    for chunk in chunks:
        chunk_text_lower = chunk["text"].lower()
        score = 0
        for term in query_terms:
            if len(term) > 2:
                count = chunk_text_lower.count(term)
                score += count * (1.0 / math.log(len(term) + 1.5))

        if score > 0:
            results.append({
                "score": score,
                "page": chunk.get("page", 1),
                "text": chunk["text"],
                "filename": chunk.get("filename", "Document")
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
