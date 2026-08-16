"""
LLM X-Ray - Model Engine (Step 2, Step 5, Step 6, Step 7, Step 8, Step 9, Step 10)
Handles model loading, forward-pass hook extraction (embeddings, 28 hidden layers,
multi-head attention weights, logits), and step-by-step auto-regressive generation tracking.
"""

import math
from typing import Dict, Any, List, Optional, Tuple
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


def get_system_device() -> str:
    """Detects best available compute hardware (CUDA GPU, MPS, or CPU)."""
    if not TORCH_AVAILABLE:
        return "cpu"
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model_and_tokenizer(model_id: str = DEFAULT_MODEL_ID, device: Optional[str] = None):
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


def run_xray_forward_pass(model, tokenizer, prompt: str, device: str = "cpu") -> Dict[str, Any]:
    """
    Executes a single forward pass through the transformer model to capture:
      - Input Token IDs & Decoded Tokens
      - Input Embeddings (Matrix [seq_len, hidden_dim])
      - Hidden States across all 28 layers ([layer, seq_len, hidden_dim])
      - Attention weights across all layers and heads ([layer, heads, seq_len, seq_len])
      - Final token Logits & Top-K Softmax Probabilities
    """
    if not prompt.strip():
        return {}

    # Tokenize input
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
        # outputs.hidden_states is a tuple of (num_layers + 1) tensors of shape [batch, seq_len, hidden_dim]
        hidden_states_list = []
        for l_idx, hs in enumerate(outputs.hidden_states):
            # hs: [1, seq_len, hidden_dim] -> [seq_len, hidden_dim]
            hidden_states_list.append(hs[0].detach().cpu().to(torch.float32).numpy())

        # 4. Extract Attention Weights
        # outputs.attentions is a tuple of num_layers tensors of shape [batch, num_heads, seq_len, seq_len]
        attentions_list = []
        if outputs.attentions is not None:
            for l_idx, att in enumerate(outputs.attentions):
                # att: [1, num_heads, seq_len, seq_len] -> [num_heads, seq_len, seq_len]
                attentions_list.append(att[0].detach().cpu().to(torch.float32).numpy())

        # 5. Extract Logits for next token (last token position in sequence)
        last_token_logits = outputs.logits[0, -1, :].detach().cpu().to(torch.float32)
        probabilities = F.softmax(last_token_logits, dim=-1)

        # Calculate prediction entropy
        probs_np = probabilities.numpy()
        entropy = -float(np.sum(probs_np * np.log(probs_np + 1e-12)))

        # Get Top-K Next Token Predictions
        topk_probs, topk_indices = torch.topk(probabilities, k=25)
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

    # Model architecture metadata
    num_layers = getattr(model.config, "num_hidden_layers", len(hidden_states_list) - 1)
    num_heads = getattr(model.config, "num_attention_heads", len(attentions_list[0]) if attentions_list else 0)
    hidden_dim = getattr(model.config, "hidden_size", input_embeddings.shape[1])
    vocab_size = getattr(model.config, "vocab_size", tokenizer.vocab_size if hasattr(tokenizer, "vocab_size") else 0)

    return {
        "prompt": prompt,
        "input_ids": input_ids[0].tolist(),
        "tokens": tokens,
        "seq_len": seq_len,
        "input_embeddings": input_embeddings,  # shape [seq_len, hidden_dim]
        "hidden_states": hidden_states_list,   # list of [seq_len, hidden_dim] per layer
        "attentions": attentions_list,         # list of [num_heads, seq_len, seq_len] per layer
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
                indices_to_remove = scaled_logits < torch.topk(scaled_logits, top_k)[0][..., -1, None]
                scaled_logits[indices_to_remove] = -float("Inf")

            # Apply Top-P (nucleus) filtering
            if 0.0 < top_p < 1.0:
                sorted_logits, sorted_indices = torch.sort(scaled_logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                sorted_indices_to_remove = cumulative_probs > top_p
                # Shift indices to keep at least one token
                sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                sorted_indices_to_remove[..., 0] = 0
                indices_to_remove = sorted_indices[sorted_indices_to_remove]
                scaled_logits[indices_to_remove] = -float("Inf")

            # Compute Softmax probabilities
            probs = F.softmax(scaled_logits, dim=-1)
            raw_probs = F.softmax(next_token_logits, dim=-1)

            # Extract Top 5 candidate tokens for step visualizer
            top5_probs, top5_indices = torch.topk(raw_probs, k=5)
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
            
            # Check for EOS token
            is_eos = chosen_id == tokenizer.eos_token_id if hasattr(tokenizer, "eos_token_id") else False
            
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

            # Append chosen token to input sequence for next auto-regressive step
            curr_input_ids = torch.cat([curr_input_ids, next_token_id], dim=-1)

    full_generated_text = tokenizer.decode(generated_tokens_ids, skip_special_tokens=True)
    
    return {
        "steps": steps_log,
        "total_tokens_generated": len(generated_tokens_ids),
        "full_generated_text": full_generated_text
    }
