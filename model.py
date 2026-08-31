"""
LLM X-Ray & ChatGPT Model Engine
Handles model loading, chat template formatting, multi-turn streaming generation,
forward-pass hook extraction (embeddings, hidden layers, multi-head attention weights, logits),
and step-by-step auto-regressive generation tracking.
"""

import time
import math
from typing import Dict, Any, List, Optional, Tuple, Iterator
import numpy as np

# Lazy/conditional imports to allow flexible environments
try:
    import torch
    import torch.nn.functional as F
    from transformers import AutoTokenizer, AutoModelForCausalLM
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


DEFAULT_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"
LIGHT_MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"

# System Prompt Presets
SYSTEM_PERSONAS = {
    "Helpful Assistant (Default)": "You are a helpful, respectful, and honest AI assistant. Provide clear, accurate, and structured answers.",
    "Python & Software Engineer": "You are an expert software engineer and Python specialist. Write clean, idiomatic, well-commented, and efficient code with explanations.",
    "Data Scientist & AI Researcher": "You are an AI researcher and machine learning scientist. Provide deep mathematical insights, algorithm explanations, and empirical reasoning.",
    "Concise & Direct": "You are an AI that gives ultra-concise, direct, and to-the-point answers with zero fluff.",
    "Creative & Engaging": "You are a creative writer and engaging conversationalist. Use vibrant analogies, compelling narratives, and thoughtful depth.",
    "Custom Persona": ""
}


def get_system_device() -> str:
    """Detects best available compute hardware (CUDA GPU, MPS, or CPU)."""
    if not TORCH_AVAILABLE:
        return "cpu"
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model_and_tokenizer(model_id: str = LIGHT_MODEL_ID, device: Optional[str] = None):
    """
    Loads Hugging Face AutoTokenizer and AutoModelForCausalLM with attention
    and hidden state outputs enabled.
    """
    if not TORCH_AVAILABLE:
        raise RuntimeError("PyTorch or Transformers is not installed. Please check requirements.")

    if device is None:
        device = get_system_device()

    tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        trust_remote_code=True
    )
    
    # Configure model with float32 on CPU or float16 on GPU
    torch_dtype = torch.float16 if device == "cuda" else torch.float32
    
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch_dtype,
        output_attentions=True,
        output_hidden_states=True,
        trust_remote_code=True,
        low_cpu_mem_usage=True
    )
    model.to(device)
    model.eval()

    return model, tokenizer


def format_chat_prompt(tokenizer, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
    """
    Formats multi-turn conversation history using the model's native chat template.
    Falls back to a standard ChatML/markdown prompt format if chat_template is unavailable.
    """
    formatted_messages = []
    
    if system_prompt and system_prompt.strip():
        formatted_messages.append({"role": "system", "content": system_prompt.strip()})
        
    for msg in messages:
        if msg.get("content", "").strip():
            formatted_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "").strip()
            })

    if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
        try:
            return tokenizer.apply_chat_template(
                formatted_messages,
                tokenize=False,
                add_generation_prompt=True
            )
        except Exception:
            pass

    # Fallback ChatML style formatting
    prompt_parts = []
    for msg in formatted_messages:
        role = msg["role"]
        content = msg["content"]
        prompt_parts.append(f"<|im_start|>{role}\n{content}<|im_end|>\n")
    prompt_parts.append("<|im_start|>assistant\n")
    return "".join(prompt_parts)


def run_xray_forward_pass(model, tokenizer, prompt: str, device: str = "cpu") -> Dict[str, Any]:
    """
    Executes a single forward pass through the transformer model to capture:
      - Input Token IDs & Decoded Tokens
      - Input Embeddings (Matrix [seq_len, hidden_dim])
      - Hidden States across all layers ([layer, seq_len, hidden_dim])
      - Attention weights across all layers and heads ([layer, heads, seq_len, seq_len])
      - Final token Logits & Top-K Softmax Probabilities
    """
    if not prompt.strip():
        return {}

    inputs = tokenizer(prompt, return_tensors="pt")
    input_ids = inputs["input_ids"].to(device)
    attention_mask = inputs.get("attention_mask", torch.ones_like(input_ids)).to(device)
    
    seq_len = input_ids.shape[1]
    tokens = [tokenizer.decode([tid]) for tid in input_ids[0].tolist()]

    with torch.no_grad():
        # 1. Extract Input Embeddings directly from embedding layer
        embedding_layer = model.get_input_embeddings()
        input_embeddings_tensor = embedding_layer(input_ids)[0]  # [seq_len, hidden_dim]
        input_embeddings = input_embeddings_tensor.detach().cpu().to(torch.float32).numpy()

        # 2. Run Forward Pass with attentions & hidden states
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_attentions=True,
            output_hidden_states=True
        )

        # 3. Extract Hidden States across all layers
        hidden_states_list = []
        if outputs.hidden_states is not None:
            for l_idx, hs in enumerate(outputs.hidden_states):
                hidden_states_list.append(hs[0].detach().cpu().to(torch.float32).numpy())

        # 4. Extract Attention Weights
        attentions_list = []
        if outputs.attentions is not None:
            for l_idx, att in enumerate(outputs.attentions):
                attentions_list.append(att[0].detach().cpu().to(torch.float32).numpy())

        # 5. Extract Logits for next token (last token position in sequence)
        last_token_logits = outputs.logits[0, -1, :].detach().cpu().to(torch.float32)
        probabilities = F.softmax(last_token_logits, dim=-1)

        # Calculate prediction entropy
        probs_np = probabilities.numpy()
        entropy = -float(np.sum(probs_np * np.log(probs_np + 1e-12)))

        # Get Top-K Next Token Predictions
        k_val = min(25, probabilities.shape[-1])
        topk_probs, topk_indices = torch.topk(probabilities, k=k_val)
        topk_logits = last_token_logits[topk_indices]

        top_predictions = []
        for p, idx_val, logit_val in zip(topk_probs.tolist(), topk_indices.tolist(), topk_logits.tolist()):
            decoded_tok = tokenizer.decode([idx_val])
            top_predictions.append({
                "token_id": idx_val,
                "token": decoded_tok,
                "display_token": decoded_tok.replace(" ", "␣").replace("\n", "↵"),
                "probability": float(p),
                "probability_percent": round(float(p) * 100, 3),
                "logit": round(float(logit_val), 3)
            })

    num_layers = getattr(model.config, "num_hidden_layers", len(hidden_states_list) - 1 if hidden_states_list else 0)
    num_heads = getattr(model.config, "num_attention_heads", len(attentions_list[0]) if attentions_list else 0)
    hidden_dim = getattr(model.config, "hidden_size", input_embeddings.shape[1] if len(input_embeddings.shape) > 1 else 0)
    vocab_size = getattr(model.config, "vocab_size", tokenizer.vocab_size if hasattr(tokenizer, "vocab_size") else 0)

    return {
        "prompt": prompt,
        "input_ids": input_ids[0].tolist(),
        "tokens": tokens,
        "seq_len": seq_len,
        "input_embeddings": input_embeddings,
        "hidden_states": hidden_states_list,
        "attentions": attentions_list,
        "top_predictions": top_predictions,
        "entropy": entropy,
        "model_meta": {
            "num_layers": num_layers,
            "num_heads": num_heads,
            "hidden_dim": hidden_dim,
            "vocab_size": vocab_size,
            "model_type": getattr(model.config, "model_type", "transformer"),
        }
    }


def run_step_by_step_generation(
    model,
    tokenizer,
    prompt: str,
    max_new_tokens: int = 20,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 50,
    device: str = "cpu"
) -> Dict[str, Any]:
    """
    Simulates auto-regressive next-token generation step-by-step, logging candidate
    token distributions, chosen token, entropy, and cumulative response at every step.
    """
    inputs = tokenizer(prompt, return_tensors="pt")
    curr_input_ids = inputs["input_ids"].to(device)
    
    steps_log = []
    generated_tokens_ids = []
    
    for step_idx in range(max_new_tokens):
        with torch.no_grad():
            outputs = model(input_ids=curr_input_ids)
            next_token_logits = outputs.logits[0, -1, :].clone().to(torch.float32)
            
            # Apply Temperature scaling
            if temperature > 0:
                scaled_logits = next_token_logits / temperature
            else:
                scaled_logits = next_token_logits

            # Apply Top-K filtering
            if top_k > 0:
                indices_to_remove = scaled_logits < torch.topk(scaled_logits, min(top_k, scaled_logits.shape[-1]))[0][..., -1, None]
                scaled_logits[indices_to_remove] = -float("Inf")

            # Apply Top-P (nucleus) filtering
            if 0.0 < top_p < 1.0:
                sorted_logits, sorted_indices = torch.sort(scaled_logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                sorted_indices_to_remove = cumulative_probs > top_p
                sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                sorted_indices_to_remove[..., 0] = 0
                indices_to_remove = sorted_indices[sorted_indices_to_remove]
                scaled_logits[indices_to_remove] = -float("Inf")

            probs = F.softmax(scaled_logits, dim=-1)
            raw_probs = F.softmax(next_token_logits, dim=-1)

            top5_probs, top5_indices = torch.topk(raw_probs, k=min(5, raw_probs.shape[-1]))
            candidates = []
            for p_val, idx_val in zip(top5_probs.tolist(), top5_indices.tolist()):
                c_tok = tokenizer.decode([idx_val])
                candidates.append({
                    "token": c_tok,
                    "display_token": c_tok.replace(" ", "␣").replace("\n", "↵"),
                    "token_id": idx_val,
                    "prob": float(p_val),
                    "prob_percent": round(float(p_val) * 100, 2)
                })

            # Sample next token
            if temperature == 0:
                next_token_id = torch.argmax(scaled_logits).unsqueeze(0).unsqueeze(0)
            else:
                next_token_id = torch.multinomial(probs, num_samples=1).unsqueeze(0)

            chosen_id = int(next_token_id[0, 0].item())
            chosen_token_str = tokenizer.decode([chosen_id])
            
            # Check for EOS or special stop tokens
            is_eos = False
            if hasattr(tokenizer, "eos_token_id") and chosen_id == tokenizer.eos_token_id:
                is_eos = True
            if hasattr(tokenizer, "all_special_ids") and chosen_id in tokenizer.all_special_ids and chosen_token_str in ["<|im_end|>", "<|endoftext|>", "</s>"]:
                is_eos = True
            
            generated_tokens_ids.append(chosen_id)
            current_cumulative_text = tokenizer.decode(generated_tokens_ids, skip_special_tokens=True)

            steps_log.append({
                "step": step_idx + 1,
                "chosen_token": chosen_token_str,
                "chosen_token_display": chosen_token_str.replace(" ", "␣").replace("\n", "↵"),
                "chosen_token_id": chosen_id,
                "top_candidates": candidates,
                "cumulative_text": current_cumulative_text,
                "is_eos": is_eos
            })

            if is_eos:
                break

            curr_input_ids = torch.cat([curr_input_ids, next_token_id], dim=-1)

    full_generated_text = tokenizer.decode(generated_tokens_ids, skip_special_tokens=True)
    
    return {
        "steps": steps_log,
        "total_tokens_generated": len(generated_tokens_ids),
        "full_generated_text": full_generated_text
    }


def generate_chat_response(
    model,
    tokenizer,
    messages: List[Dict[str, str]],
    system_prompt: Optional[str] = None,
    max_new_tokens: int = 150,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 50,
    device: str = "cpu"
) -> Dict[str, Any]:
    """
    Fast conversational response generator using model.generate() via HuggingFace pipeline.
    Uses the model's native chat template for proper multi-turn formatting.
    Returns the response text and timing — X-Ray inspection is run separately on demand.
    """
    formatted_prompt = format_chat_prompt(tokenizer, messages, system_prompt)

    start_time = time.time()

    # Tokenize the formatted chat prompt
    inputs = tokenizer(formatted_prompt, return_tensors="pt")
    input_ids = inputs["input_ids"].to(device)
    attention_mask = inputs.get("attention_mask", torch.ones_like(input_ids)).to(device)
    prompt_len = input_ids.shape[1]

    # Build generation kwargs
    gen_kwargs = {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "max_new_tokens": max_new_tokens,
        "do_sample": temperature > 0,
        "pad_token_id": tokenizer.eos_token_id,
    }
    if temperature > 0:
        gen_kwargs["temperature"] = temperature
        gen_kwargs["top_p"] = top_p
        gen_kwargs["top_k"] = top_k

    with torch.no_grad():
        output_ids = model.generate(**gen_kwargs)

    # Decode only the newly generated tokens (not the input prompt)
    new_token_ids = output_ids[0][prompt_len:]
    response_text = tokenizer.decode(new_token_ids, skip_special_tokens=True).strip()

    # Clean up any stray chat markup
    for marker in ["<|im_end|>", "<|im_start|>", "<|endoftext|>", "</s>"]:
        response_text = response_text.replace(marker, "").strip()

    gen_time = time.time() - start_time
    tokens_generated = new_token_ids.shape[0]

    return {
        "response": response_text,
        "formatted_prompt": formatted_prompt,
        "timing": {
            "generation_time": gen_time,
            "total_time": gen_time,
            "tokens_per_sec": round(tokens_generated / max(gen_time, 0.001), 2)
        }
    }


def run_xray_on_demand(
    model,
    tokenizer,
    formatted_prompt: str,
    max_new_tokens: int = 20,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 50,
    device: str = "cpu"
) -> Dict[str, Any]:
    """
    On-demand X-Ray analysis runner. Called only when the user clicks 'Inspect'.
    Runs the full forward pass + step-by-step generation trace for deep inspection.
    """
    fwd_start = time.time()
    xray_data = run_xray_forward_pass(model, tokenizer, formatted_prompt, device=device)
    fwd_time = time.time() - fwd_start

    gen_start = time.time()
    gen_data = run_step_by_step_generation(
        model=model,
        tokenizer=tokenizer,
        prompt=formatted_prompt,
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        device=device
    )
    gen_time = time.time() - gen_start

    xray_data["timing"] = {
        "forward_time": fwd_time,
        "generation_time": gen_time,
    }

    return {
        "xray_data": xray_data,
        "generation_data": gen_data
    }


# Keep for backward compatibility / standalone X-Ray usage
def generate_chat_response_with_xray(
    model,
    tokenizer,
    messages: List[Dict[str, str]],
    system_prompt: Optional[str] = None,
    max_new_tokens: int = 150,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 50,
    device: str = "cpu"
) -> Dict[str, Any]:
    """Wraps fast chat generation + on-demand X-Ray (full pipeline, slower)."""
    fast = generate_chat_response(
        model, tokenizer, messages, system_prompt,
        max_new_tokens, temperature, top_p, top_k, device
    )
    xray = run_xray_on_demand(
        model, tokenizer, fast["formatted_prompt"],
        min(max_new_tokens, 20), temperature, top_p, top_k, device
    )
    return {**fast, **xray}


