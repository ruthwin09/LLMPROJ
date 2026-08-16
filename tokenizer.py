"""
LLM X-Ray - Tokenizer Module (Step 4)
Handles prompt tokenization, token decomposition, token ID mapping,
special tokens inspection, and rich HTML chip visualization.
"""

from typing import List, Dict, Any, Tuple
import html


def tokenize_input(tokenizer, text: str) -> Dict[str, Any]:
    """
    Tokenizes the input text and extracts detailed token-level metadata.
    
    Returns:
        Dict containing:
            - input_ids: List[int]
            - tokens: List[str]
            - token_data: List[Dict[str, Any]] (token, id, bytes, is_special)
            - stats: Dict[str, Any] (counts, compression ratio)
    """
    if not text:
        return {
            "input_ids": [],
            "tokens": [],
            "token_data": [],
            "stats": {"char_count": 0, "token_count": 0, "compression_ratio": 0.0, "vocab_size": getattr(tokenizer, "vocab_size", 0)}
        }
    
    # Encode with tokenizer
    encoding = tokenizer(text, return_tensors=None, add_special_tokens=False)
    input_ids = encoding["input_ids"]
    
    # Convert token IDs to token strings and inspect properties
    tokens = [tokenizer.decode([tid]) for tid in input_ids]
    raw_tokens = tokenizer.convert_ids_to_tokens(input_ids)
    
    token_data = []
    for idx, (tid, tok_str, raw_tok) in enumerate(zip(input_ids, tokens, raw_tokens)):
        is_special = tid in tokenizer.all_special_ids if hasattr(tokenizer, "all_special_ids") else False
        token_bytes = len(tok_str.encode("utf-8"))
        token_data.append({
            "index": idx,
            "token_id": tid,
            "display_token": tok_str,
            "raw_token": str(raw_tok),
            "byte_length": token_bytes,
            "is_special": is_special
        })
        
    char_count = len(text)
    token_count = len(input_ids)
    compression = round(char_count / max(token_count, 1), 2)
    
    vocab_size = getattr(tokenizer, "vocab_size", len(tokenizer) if hasattr(tokenizer, "__len__") else "Unknown")

    return {
        "input_ids": input_ids,
        "tokens": tokens,
        "raw_tokens": raw_tokens,
        "token_data": token_data,
        "stats": {
            "char_count": char_count,
            "token_count": token_count,
            "compression_ratio": compression,
            "vocab_size": vocab_size
        }
    }


def render_token_chips_html(token_data: List[Dict[str, Any]]) -> str:
    """
    Generates a sleek, color-coded HTML chip representation of the tokenized sequence.
    Alternates pleasant modern neon/pastel background badges so token boundaries are obvious.
    """
    if not token_data:
        return "<div style='color: #888;'>No tokens to display</div>"

    palette = [
        {"bg": "rgba(99, 102, 241, 0.22)", "border": "rgba(99, 102, 241, 0.6)", "text": "#818cf8"},  # Indigo
        {"bg": "rgba(168, 85, 247, 0.22)", "border": "rgba(168, 85, 247, 0.6)", "text": "#c084fc"},  # Purple
        {"bg": "rgba(236, 72, 153, 0.22)", "border": "rgba(236, 72, 153, 0.6)", "text": "#f472b6"},  # Pink
        {"bg": "rgba(59, 130, 246, 0.22)", "border": "rgba(59, 130, 246, 0.6)", "text": "#60a5fa"},  # Blue
        {"bg": "rgba(16, 185, 129, 0.22)", "border": "rgba(16, 185, 129, 0.6)", "text": "#34d399"},  # Emerald
        {"bg": "rgba(245, 158, 11, 0.22)", "border": "rgba(245, 158, 11, 0.6)", "text": "#fbbf24"},  # Amber
        {"bg": "rgba(20, 184, 166, 0.22)", "border": "rgba(20, 184, 166, 0.6)", "text": "#2dd4bf"},  # Teal
        {"bg": "rgba(244, 63, 94, 0.22)", "border": "rgba(244, 63, 94, 0.6)", "text": "#fb7185"},   # Rose
    ]

    chips_html = ["<div style='display: flex; flex-wrap: wrap; gap: 8px; align-items: center; line-height: 1.8; margin-top: 10px;'>"]

    for item in token_data:
        idx = item["index"]
        tid = item["token_id"]
        raw = item["display_token"]
        color = palette[idx % len(palette)]
        
        # Display visual whitespace representation
        display_text = raw.replace(" ", "␣").replace("\n", "↵\n").replace("\t", "⇥")
        escaped_text = html.escape(display_text)
        
        chip = f"""
        <div style="
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            background: {color['bg']};
            border: 1px solid {color['border']};
            border-radius: 8px;
            padding: 4px 10px;
            margin: 2px 0;
            font-family: 'Fira Code', 'JetBrains Mono', monospace;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
        " title="Token Index: {idx} | Token ID: {tid} | Bytes: {item['byte_length']}">
            <span style="font-size: 0.95rem; font-weight: 600; color: {color['text']};">
                {escaped_text}
            </span>
            <span style="font-size: 0.70rem; opacity: 0.75; color: #a1a1aa;">
                #{tid}
            </span>
        </div>
        """
        chips_html.append(chip)

    chips_html.append("</div>")
    return "".join(chips_html)
