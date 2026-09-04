"""LLM Service Provider with Keyless Local LLM Engine & Hosted Endpoint Fallback.
Runs 100% locally with Hugging Face Transformers when no API key is set.
"""

import json
import time
import asyncio
import threading
import httpx
from typing import AsyncGenerator, List, Dict, Any, Optional
from app.core.config import settings

# Lazy loaded PyTorch & Transformers modules to allow instant lightweight cloud startup
torch = None
AutoTokenizer = None
AutoModelForCausalLM = None
TextIteratorStreamer = None

def _ensure_transformers():
    global torch, AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
    if torch is None:
        import torch as _torch
        from transformers import AutoTokenizer as _AutoTokenizer, AutoModelForCausalLM as _AutoModelForCausalLM, TextIteratorStreamer as _TextIteratorStreamer
        torch = _torch
        AutoTokenizer = _AutoTokenizer
        AutoModelForCausalLM = _AutoModelForCausalLM
        TextIteratorStreamer = _TextIteratorStreamer

# Supported models configuration (Defaulting to keyless local model)
HOSTED_MODELS = {
    "qwen-2.5-0.5b-local": {"name": "Qwen 2.5 0.5B (Local Keyless LLM)", "provider": "local"},
    "qwen-2.5-1.5b-local": {"name": "Qwen 2.5 1.5B (Local Keyless LLM)", "provider": "local"},
    "llama-3.3-70b-versatile": {"name": "Llama 3.3 70B (Groq Cloud)", "provider": "groq"},
    "gpt-4o-mini": {"name": "OpenAI GPT-4o Mini", "provider": "openai"},
    "gemini-1.5-flash": {"name": "Google Gemini 1.5 Flash", "provider": "gemini"},
    "deepseek-r1": {"name": "DeepSeek R1 (OpenRouter)", "provider": "openrouter"}
}

# Singleton local model holder
_LOCAL_MODEL_CACHE: Dict[str, Any] = {}
_LOCAL_LOCK = threading.Lock()


def get_local_model_and_tokenizer(model_id: str = "Qwen/Qwen2.5-0.5B-Instruct"):
    """
    Loads and caches local Hugging Face model and tokenizer with optimized speed settings.
    """
    _ensure_transformers()
    with _LOCAL_LOCK:
        if model_id in _LOCAL_MODEL_CACHE:
            return _LOCAL_MODEL_CACHE[model_id]

        device = "cuda" if torch.cuda.is_available() else "cpu"
        # Use bfloat16/float16 on CPU/GPU if supported, which cuts memory and computes ~2x faster
        dtype = torch.bfloat16 if hasattr(torch, "bfloat16") else torch.float32

        tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=dtype,
            trust_remote_code=True,
            low_cpu_mem_usage=True
        )
        model.to(device)
        model.eval()

        # Set PyTorch thread count for maximum CPU throughput
        if device == "cpu" and hasattr(torch, "set_num_threads"):
            import os
            cores = os.cpu_count() or 4
            torch.set_num_threads(max(1, min(cores, 8)))

        _LOCAL_MODEL_CACHE[model_id] = (model, tokenizer)
        return model, tokenizer


def format_chat_messages(tokenizer, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
    """Formats chat messages using the model's native chat template."""
    formatted_messages = []
    if system_prompt:
        formatted_messages.append({"role": "system", "content": system_prompt})
    for m in messages:
        formatted_messages.append({"role": m["role"], "content": m["content"]})

    if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
        try:
            return tokenizer.apply_chat_template(formatted_messages, tokenize=False, add_generation_prompt=True)
        except Exception:
            pass

    # ChatML fallback
    prompt_parts = []
    for msg in formatted_messages:
        prompt_parts.append(f"<|im_start|>{msg['role']}\n{msg['content']}<|im_end|>\n")
    prompt_parts.append("<|im_start|>assistant\n")
    return "".join(prompt_parts)


async def stream_local_llm_completion(
    messages: List[Dict[str, str]],
    model_id: str = "Qwen/Qwen2.5-0.5B-Instruct",
    system_prompt: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """
    Executes 100% keyless local LLM inference using optimized PyTorch and Hugging Face Transformers.
    Streams tokens in real time via Server-Sent Events (SSE).
    """
    _ensure_transformers()
    model, tokenizer = get_local_model_and_tokenizer(model_id)
    prompt = format_chat_messages(tokenizer, messages, system_prompt)

    device = next(model.parameters()).device
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    input_ids = inputs["input_ids"]
    attention_mask = inputs.get("attention_mask", torch.ones_like(input_ids))

    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    generation_kwargs = dict(
        input_ids=input_ids,
        attention_mask=attention_mask,
        streamer=streamer,
        max_new_tokens=384,
        do_sample=False,  # Greedy decoding: 2x faster than sampling, deterministic and sharp
        use_cache=True,   # Key-Value caching for fast sequential next-token generation
        pad_token_id=tokenizer.eos_token_id
    )

    # Run generation in a background thread to prevent blocking ASGI event loop
    thread = threading.Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()

    loop = asyncio.get_running_loop()
    
    # Read tokens iteratively from streamer
    def get_next_token():
        try:
            return next(streamer)
        except StopIteration:
            return None

    while True:
        token_text = await loop.run_in_executor(None, get_next_token)
        if token_text is None:
            break
        yield f"data: {json.dumps({'content': token_text})}\n\n"

    yield "data: [DONE]\n\n"


async def stream_chat_completion(
    messages: List[Dict[str, str]],
    model_name: str = "qwen-2.5-0.5b-local",
    user_api_key: Optional[str] = None,
    system_prompt: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """
    Unified streaming provider:
    - Uses 100% Keyless Local LLM if provider is 'local' or if no API Key is provided.
    - Uses Hosted Cloud API (Groq/OpenAI/Gemini/OpenRouter) if valid API key is present.
    """
    model_info = HOSTED_MODELS.get(model_name, {"provider": "local"})
    provider = model_info.get("provider", "local")

    api_key = user_api_key

    # Select provider based on model or available API key
    if provider == "groq":
        api_key = api_key or settings.GROQ_API_KEY
    elif provider == "openai":
        api_key = api_key or settings.OPENAI_API_KEY
    elif provider == "openrouter":
        api_key = api_key or settings.OPENROUTER_API_KEY

    # If keyless or no valid API key set, fallback to Local LLM Engine
    if provider == "local" or not api_key or "demo" in api_key.lower():
        hf_model_id = "Qwen/Qwen2.5-1.5B-Instruct" if "1.5b" in model_name.lower() else "Qwen/Qwen2.5-0.5B-Instruct"
        async for chunk in stream_local_llm_completion(messages, model_id=hf_model_id, system_prompt=system_prompt):
            yield chunk
        return

    # Hosted Cloud API Execution
    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    if provider == "openai":
        endpoint = "https://api.openai.com/v1/chat/completions"
    elif provider == "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    formatted_messages = []
    if system_prompt:
        formatted_messages.append({"role": "system", "content": system_prompt})
    for msg in messages:
        formatted_messages.append({"role": msg["role"], "content": msg["content"]})

    payload = {
        "model": model_name,
        "messages": formatted_messages,
        "stream": True,
        "temperature": 0.7
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream("POST", endpoint, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    # Fallback to local LLM on API key errors
                    hf_model_id = "Qwen/Qwen2.5-0.5B-Instruct"
                    async for chunk in stream_local_llm_completion(messages, model_id=hf_model_id, system_prompt=system_prompt):
                        yield chunk
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            chunk_json = json.loads(data_str)
                            delta = chunk_json.get("choices", [{}])[0].get("delta", {})
                            content_piece = delta.get("content", "")
                            if content_piece:
                                yield f"data: {json.dumps({'content': content_piece})}\n\n"
                        except json.JSONDecodeError:
                            continue
        except Exception:
            # Fallback to local LLM on connection failure
            hf_model_id = "Qwen/Qwen2.5-0.5B-Instruct"
            async for chunk in stream_local_llm_completion(messages, model_id=hf_model_id, system_prompt=system_prompt):
                yield chunk
