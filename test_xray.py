import numpy as np
import torch
import transformers
import streamlit as st
import plotly
import sklearn

from tokenizer import tokenize_input, render_token_chips_html
from visualization import (
    plot_embedding_pca_2d,
    plot_embedding_pca_3d,
    plot_embedding_heatmap,
    plot_attention_heatmap,
    plot_attention_head_comparison,
    plot_hidden_states_evolution,
    plot_hidden_layer_drift_heatmap,
    plot_logits_distribution,
    plot_generation_step_candidates
)
from model import get_system_device

print("=== LLM X-RAY SMOKE TEST ===")
print("PyTorch Version:", torch.__version__)
print("Transformers Version:", transformers.__version__)
print("Streamlit Version:", st.__version__)
print("Plotly Version:", plotly.__version__)
print("Hardware Device:", get_system_device())

# Test Token Chips HTML generator
mock_token_data = [
    {"index": 0, "token_id": 128000, "display_token": "Explain", "byte_length": 7, "is_special": False},
    {"index": 1, "token_id": 8421, "display_token": "Machine", "byte_length": 7, "is_special": False},
    {"index": 2, "token_id": 9931, "display_token": "Learning", "byte_length": 8, "is_special": False},
]
chips_html = render_token_chips_html(mock_token_data)
assert "Explain" in chips_html
print("[PASS] Token chips HTML generated successfully")

# Test Visualizations
tokens = ["Explain", "Machine", "Learning"]
embeddings = np.random.randn(3, 64)
att_matrix = np.random.rand(3, 3)
att_layer = np.random.rand(12, 3, 3)
hidden_states = [np.random.randn(3, 64) for _ in range(29)] # L0 to L28

fig_pca2d = plot_embedding_pca_2d(tokens, embeddings)
fig_pca3d = plot_embedding_pca_3d(tokens, embeddings)
fig_emb_heat = plot_embedding_heatmap(tokens, embeddings)
fig_att = plot_attention_heatmap(tokens, att_matrix, 0, 0)
fig_att_comp = plot_attention_head_comparison(tokens, att_layer, -1)
fig_hs_evo = plot_hidden_states_evolution(tokens, hidden_states)
fig_hs_drift = plot_hidden_layer_drift_heatmap(hidden_states)

mock_top_preds = [
    {"token_id": 318, "token": " is", "display_token": "␣is", "probability": 0.35, "probability_percent": 35.0, "logit": 14.2},
    {"token_id": 373, "token": " was", "display_token": "␣was", "probability": 0.20, "probability_percent": 20.0, "logit": 12.8},
]
fig_logits = plot_logits_distribution(mock_top_preds, top_k=2)

mock_step = {
    "step": 1,
    "chosen_token": " is",
    "chosen_token_display": "␣is",
    "top_candidates": [
        {"token": " is", "display_token": "␣is", "token_id": 318, "prob": 0.35, "prob_percent": 35.0},
        {"token": " was", "display_token": "␣was", "token_id": 373, "prob": 0.20, "prob_percent": 20.0},
    ]
}
fig_step = plot_generation_step_candidates(mock_step)

print("[PASS] All 9 Plotly visualization engines tested and validated successfully!")
print("=== ALL TESTS PASSED SUCCESSFULLY ===")
