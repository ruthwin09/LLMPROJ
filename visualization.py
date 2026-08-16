"""
LLM X-Ray - Visualizations Engine (Steps 5, 6, 7, 8, 9, 10)
High-performance Plotly visual analytics for Embeddings, Multi-Head Attention,
Transformer Hidden States, Next-Token Logits & Probabilities, and Step-by-Step Generation.
"""

from typing import List, Dict, Any, Optional
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from sklearn.decomposition import PCA


# Sleek dark/modern theme styling constants
PLOTLY_TEMPLATE = "plotly_dark"
COLOR_PRIMARY = "#6366f1"   # Modern Indigo
COLOR_SECONDARY = "#a855f7" # Modern Purple
COLOR_ACCENT = "#38bdf8"    # Modern Sky Blue
COLOR_SUCCESS = "#10b981"   # Modern Emerald
COLOR_WARN = "#f59e0b"      # Modern Amber
BG_PAPER = "rgba(17, 24, 39, 0.7)"
BG_PLOT = "rgba(15, 23, 42, 0.85)"


def plot_embedding_pca_2d(tokens: List[str], embeddings: np.ndarray) -> go.Figure:
    """
    Computes 2D PCA on input token embedding vectors and generates an interactive scatter plot.
    """
    n_samples = len(tokens)
    if n_samples < 2:
        fig = go.Figure()
        fig.add_annotation(
            text="Need at least 2 tokens to project with PCA",
            showarrow=False,
            font=dict(size=14, color="#94a3b8")
        )
        fig.update_layout(template=PLOTLY_TEMPLATE, height=420)
        return fig

    n_components = min(2, n_samples, embeddings.shape[1])
    pca = PCA(n_components=n_components)
    coords = pca.fit_transform(embeddings)

    var_explained = [round(v * 100, 1) for v in pca.explained_variance_ratio_]
    var_label = f" (Var: PC1={var_explained[0]}%, PC2={var_explained[1]}%)" if len(var_explained) > 1 else ""

    token_norms = [float(np.linalg.norm(vec)) for vec in embeddings]
    display_tokens = [tok.replace(" ", "␣").replace("\n", "↵") for tok in tokens]

    fig = go.Figure()

    # Add points
    fig.add_trace(go.Scatter(
        x=coords[:, 0],
        y=coords[:, 1] if coords.shape[1] > 1 else np.zeros(n_samples),
        mode="markers+text",
        text=display_tokens,
        textposition="top center",
        textfont=dict(family="Fira Code, monospace", size=12, color="#e2e8f0"),
        marker=dict(
            size=14,
            color=token_norms,
            colorscale="Viridis",
            showscale=True,
            colorbar=dict(title="L2 Norm", titleside="right"),
            line=dict(width=2, color="#ffffff")
        ),
        hovertemplate="<b>Token:</b> %{text}<br><b>Token Index:</b> %{customdata[0]}<br><b>L2 Norm:</b> %{customdata[1]:.3f}<br><b>PC1:</b> %{x:.3f}<br><b>PC2:</b> %{y:.3f}<extra></extra>",
        customdata=list(zip(range(n_samples), token_norms))
    ))

    fig.update_layout(
        title=f"2D PCA Projection of Input Token Embeddings{var_label}",
        xaxis_title=f"Principal Component 1 ({var_explained[0]}%)" if var_explained else "PC1",
        yaxis_title=f"Principal Component 2 ({var_explained[1]}%)" if len(var_explained) > 1 else "PC2",
        template=PLOTLY_TEMPLATE,
        height=480,
        margin=dict(l=40, r=40, t=50, b=40),
        plot_bgcolor=BG_PLOT,
        paper_bgcolor=BG_PAPER
    )
    return fig


def plot_embedding_pca_3d(tokens: List[str], embeddings: np.ndarray) -> go.Figure:
    """
    Computes 3D PCA projection for input token embeddings.
    """
    n_samples = len(tokens)
    if n_samples < 3:
        fig = go.Figure()
        fig.add_annotation(
            text="Need at least 3 tokens for 3D PCA projection",
            showarrow=False,
            font=dict(size=14, color="#94a3b8")
        )
        fig.update_layout(template=PLOTLY_TEMPLATE, height=480)
        return fig

    n_components = min(3, n_samples, embeddings.shape[1])
    pca = PCA(n_components=n_components)
    coords = pca.fit_transform(embeddings)

    var_explained = [round(v * 100, 1) for v in pca.explained_variance_ratio_]
    token_norms = [float(np.linalg.norm(vec)) for vec in embeddings]
    display_tokens = [tok.replace(" ", "␣").replace("\n", "↵") for tok in tokens]

    fig = go.Figure(data=[go.Scatter3d(
        x=coords[:, 0],
        y=coords[:, 1],
        z=coords[:, 2] if coords.shape[1] > 2 else np.zeros(n_samples),
        mode="markers+text",
        text=display_tokens,
        textposition="top center",
        textfont=dict(family="Fira Code, monospace", size=11, color="#f1f5f9"),
        marker=dict(
            size=7,
            color=token_norms,
            colorscale="Plasma",
            opacity=0.9,
            line=dict(width=1, color="#ffffff")
        ),
        hovertemplate="<b>Token:</b> %{text}<br><b>L2 Norm:</b> %{customdata:.3f}<br><b>PC1:</b> %{x:.2f}<br><b>PC2:</b> %{y:.2f}<br><b>PC3:</b> %{z:.2f}<extra></extra>",
        customdata=token_norms
    )])

    fig.update_layout(
        title="3D PCA Token Embedding Manifold",
        scene=dict(
            xaxis_title=f"PC1 ({var_explained[0]}%)",
            yaxis_title=f"PC2 ({var_explained[1]}%)",
            zaxis_title=f"PC3 ({var_explained[2]}%)" if len(var_explained) > 2 else "PC3",
            bgcolor=BG_PLOT
        ),
        template=PLOTLY_TEMPLATE,
        height=520,
        margin=dict(l=20, r=20, t=40, b=20),
        paper_bgcolor=BG_PAPER
    )
    return fig


def plot_embedding_heatmap(tokens: List[str], embeddings: np.ndarray, max_dims: int = 64) -> go.Figure:
    """
    Visualizes a slice of the high-dimensional embedding matrix across input tokens.
    """
    display_tokens = [tok.replace(" ", "␣").replace("\n", "↵") for tok in tokens]
    dim_slice = min(max_dims, embeddings.shape[1])
    data_slice = embeddings[:, :dim_slice]

    fig = go.Figure(data=go.Heatmap(
        z=data_slice,
        x=[f"Dim {i}" for i in range(dim_slice)],
        y=display_tokens,
        colorscale="RdBu_r",
        zmid=0.0,
        colorbar=dict(title="Weight Value"),
        hovertemplate="<b>Token:</b> %{y}<br><b>Dimension:</b> %{x}<br><b>Value:</b> %{z:.4f}<extra></extra>"
    ))

    fig.update_layout(
        title=f"Input Embedding Matrix Heatmap (First {dim_slice} of {embeddings.shape[1]} Dimensions)",
        xaxis_title="Embedding Dimensions",
        yaxis_title="Sequence Tokens",
        template=PLOTLY_TEMPLATE,
        height=380,
        margin=dict(l=60, r=30, t=50, b=40),
        plot_bgcolor=BG_PLOT,
        paper_bgcolor=BG_PAPER
    )
    return fig


def plot_attention_heatmap(tokens: List[str], attention_matrix: np.ndarray, layer_idx: int, head_idx: int) -> go.Figure:
    """
    Plots an interactive attention heatmap for a specific transformer layer and attention head.
    attention_matrix: shape [seq_len, seq_len]
    """
    display_tokens = [f"[{i}] {tok.replace(' ', '␣').replace(chr(10), '↵')}" for i, tok in enumerate(tokens)]

    fig = go.Figure(data=go.Heatmap(
        z=attention_matrix,
        x=display_tokens,
        y=display_tokens,
        colorscale="Inferno",
        zmin=0.0,
        zmax=1.0,
        colorbar=dict(title="Attention"),
        hovertemplate="<b>Query (Attending From):</b> %{y}<br><b>Key (Attended To):</b> %{x}<br><b>Attention Weight:</b> %{z:.4f}<extra></extra>"
    ))

    fig.update_layout(
        title=f"Self-Attention Matrix — Layer {layer_idx + 1} | Head {head_idx + 1}",
        xaxis_title="Key Tokens (Attended To)",
        yaxis_title="Query Tokens (Attending From)",
        template=PLOTLY_TEMPLATE,
        height=480,
        margin=dict(l=80, r=40, t=50, b=80),
        xaxis=dict(tickangle=-45),
        plot_bgcolor=BG_PLOT,
        paper_bgcolor=BG_PAPER
    )
    return fig


def plot_attention_head_comparison(tokens: List[str], layer_attentions: np.ndarray, target_token_idx: int = -1) -> go.Figure:
    """
    Plots attention across all attention heads in a layer for a chosen token.
    layer_attentions: shape [num_heads, seq_len, seq_len]
    """
    num_heads = layer_attentions.shape[0]
    seq_len = layer_attentions.shape[1]
    
    if target_token_idx < 0:
        target_token_idx = seq_len - 1

    display_tokens = [tok.replace(" ", "␣").replace("\n", "↵") for tok in tokens]
    target_token_label = display_tokens[target_token_idx]

    # Matrix: [num_heads, seq_len] (attentions from target_token to each key token)
    head_weights = layer_attentions[:, target_token_idx, :]

    fig = go.Figure(data=go.Heatmap(
        z=head_weights,
        x=display_tokens,
        y=[f"Head {h + 1}" for h in range(num_heads)],
        colorscale="Cividis",
        colorbar=dict(title="Attention Weight"),
        hovertemplate="<b>%{y}</b><br>Target Token '%{customdata}' attends to <b>%{x}</b><br>Weight: %{z:.4f}<extra></extra>",
        customdata=[target_token_label] * seq_len
    ))

    fig.update_layout(
        title=f"All Attention Heads Focus for Token: '{target_token_label}' (Pos {target_token_idx})",
        xaxis_title="Key Tokens",
        yaxis_title="Attention Heads",
        template=PLOTLY_TEMPLATE,
        height=450,
        margin=dict(l=60, r=40, t=50, b=60),
        plot_bgcolor=BG_PLOT,
        paper_bgcolor=BG_PAPER
    )
    return fig


def plot_hidden_states_evolution(tokens: List[str], hidden_states: List[np.ndarray]) -> go.Figure:
    """
    Visualizes how token vector representations evolve across the 28 Transformer layers.
    Calculates layer-to-layer cosine similarity and L2 Norm trajectory.
    """
    num_layers = len(hidden_states)
    seq_len = len(tokens)
    display_tokens = [tok.replace(" ", "␣").replace("\n", "↵") for tok in tokens]

    layer_names = ["Embeddings (L0)"] + [f"Layer {i}" for i in range(1, num_layers)]

    # Compute L2 Norm trajectory for each token across layers
    fig = go.Figure()
    colors = px.colors.qualitative.Plotly

    for tok_idx, tok_name in enumerate(display_tokens):
        norms = [float(np.linalg.norm(hidden_states[l][tok_idx])) for l in range(num_layers)]
        c = colors[tok_idx % len(colors)]
        fig.add_trace(go.Scatter(
            x=list(range(num_layers)),
            y=norms,
            mode="lines+markers",
            name=f"[{tok_idx}] {tok_name}",
            line=dict(width=2, color=c),
            marker=dict(size=5),
            hovertemplate="<b>Token:</b> " + tok_name + "<br><b>Layer:</b> %{customdata}<br><b>L2 Norm:</b> %{y:.2f}<extra></extra>",
            customdata=layer_names
        ))

    fig.update_layout(
        title="Hidden State Representation Magnitude (L2 Norm) Across All 28 Layers",
        xaxis_title="Transformer Depth (0 = Input Embeddings, 28 = Final Layer)",
        yaxis_title="Hidden State L2 Norm",
        template=PLOTLY_TEMPLATE,
        height=440,
        margin=dict(l=40, r=40, t=50, b=40),
        xaxis=dict(tickmode="linear", tick0=0, dtick=2),
        plot_bgcolor=BG_PLOT,
        paper_bgcolor=BG_PAPER
    )
    return fig


def plot_hidden_layer_drift_heatmap(hidden_states: List[np.ndarray]) -> go.Figure:
    """
    Computes pairwise cosine similarity between consecutive layer representations across the network.
    """
    num_layers = len(hidden_states)
    sim_matrix = np.zeros((num_layers, num_layers))

    # Mean pooled representation per layer
    layer_vecs = [np.mean(hs, axis=0) for hs in hidden_states]
    layer_vecs = [v / (np.linalg.norm(v) + 1e-10) for v in layer_vecs]

    for i in range(num_layers):
        for j in range(num_layers):
            sim_matrix[i, j] = float(np.dot(layer_vecs[i], layer_vecs[j]))

    labels = ["Emb"] + [f"L{i}" for i in range(1, num_layers)]

    fig = go.Figure(data=go.Heatmap(
        z=sim_matrix,
        x=labels,
        y=labels,
        colorscale="Viridis",
        zmin=0.0,
        zmax=1.0,
        colorbar=dict(title="Cosine Sim"),
        hovertemplate="<b>From:</b> %{y}<br><b>To:</b> %{x}<br><b>Cosine Similarity:</b> %{z:.3f}<extra></extra>"
    ))

    fig.update_layout(
        title="Layer-to-Layer Representation Similarity Matrix (Network Depth Correlation)",
        xaxis_title="Transformer Layer",
        yaxis_title="Transformer Layer",
        template=PLOTLY_TEMPLATE,
        height=460,
        margin=dict(l=50, r=30, t=50, b=50),
        plot_bgcolor=BG_PLOT,
        paper_bgcolor=BG_PAPER
    )
    return fig


def plot_logits_distribution(top_predictions: List[Dict[str, Any]], top_k: int = 15) -> go.Figure:
    """
    Plots interactive horizontal bar chart of next-token candidates and their Softmax probabilities.
    """
    items = top_predictions[:top_k]
    tokens = [item["display_token"] for item in items][::-1]
    probs = [item["probability_percent"] for item in items][::-1]
    logits = [item["logit"] for item in items][::-1]
    token_ids = [item["token_id"] for item in items][::-1]

    fig = go.Figure(go.Bar(
        x=probs,
        y=tokens,
        orientation="h",
        marker=dict(
            color=probs,
            colorscale="Tealgrn",
            line=dict(color="#ffffff", width=1)
        ),
        text=[f"{p:.2f}% (Logit: {l:.2f})" for p, l in zip(probs, logits)],
        textposition="outside",
        hovertemplate="<b>Candidate Token:</b> '%{y}'<br><b>Token ID:</b> %{customdata[0]}<br><b>Probability:</b> %{x:.3f}%<br><b>Raw Logit:</b> %{customdata[1]:.2f}<extra></extra>",
        customdata=list(zip(token_ids, logits))
    ))

    fig.update_layout(
        title=f"Next Token Candidate Probability Distribution (Top {top_k})",
        xaxis_title="Softmax Probability (%)",
        yaxis_title="Candidate Token",
        template=PLOTLY_TEMPLATE,
        height=max(420, top_k * 26),
        margin=dict(l=90, r=80, t=50, b=40),
        plot_bgcolor=BG_PLOT,
        paper_bgcolor=BG_PAPER
    )
    return fig


def plot_generation_step_candidates(step_data: Dict[str, Any]) -> go.Figure:
    """
    Plots candidate tokens considered at a specific auto-regressive generation step.
    """
    candidates = step_data["top_candidates"]
    tokens = [c["display_token"] for c in candidates][::-1]
    probs = [c["prob_percent"] for c in candidates][::-1]
    
    # Highlight chosen token with a distinct color
    colors = []
    chosen = step_data["chosen_token_display"]
    for t in tokens:
        if t == chosen:
            colors.append("#10b981") # Emerald for chosen token
        else:
            colors.append("#6366f1") # Indigo for alternative candidates

    fig = go.Figure(go.Bar(
        x=probs,
        y=tokens,
        orientation="h",
        marker=dict(color=colors, line=dict(color="#ffffff", width=1)),
        text=[f"{p:.2f}%" for p in probs],
        textposition="outside",
        hovertemplate="<b>Candidate:</b> '%{y}'<br><b>Probability:</b> %{x:.2f}%<extra></extra>"
    ))

    fig.update_layout(
        title=f"Step {step_data['step']} Decision: Generated Token '{step_data['chosen_token_display']}'",
        xaxis_title="Probability (%)",
        yaxis_title="Candidate",
        template=PLOTLY_TEMPLATE,
        height=280,
        margin=dict(l=80, r=60, t=40, b=30),
        plot_bgcolor=BG_PLOT,
        paper_bgcolor=BG_PAPER
    )
    return fig
