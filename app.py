"""
=============================================================================
 PROJECT PHASE 1 - LLM X-RAY: Interactive Visualization of LLM Inference
 Complete Streamlit Application implementing Steps 1 to 10
=============================================================================
"""

import time
import streamlit as st
import numpy as np
import pandas as pd

# Internal modules
from tokenizer import tokenize_input, render_token_chips_html
from model import (
    DEFAULT_MODEL_ID,
    LIGHT_MODEL_ID,
    get_system_device,
    load_model_and_tokenizer,
    run_xray_forward_pass,
    run_step_by_step_generation,
    TORCH_AVAILABLE
)
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

# ---------------------------------------------------------------------------
# Page Configuration & UI Theme Styling
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="LLM X-Ray | Interactive Visualization of LLM Inference",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom High-End Modern CSS
st.markdown("""
<style>
    /* Global App Container */
    .main .block-container {
        padding-top: 1.8rem;
        padding-bottom: 3rem;
        max-width: 1300px;
    }
    
    /* Sleek Gradient Hero Header */
    .hero-header {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(56, 189, 248, 0.12) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px 30px;
        margin-bottom: 24px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
    }
    .hero-title {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 6px;
    }
    .hero-subtitle {
        font-size: 1.05rem;
        color: #94a3b8;
        margin-bottom: 14px;
    }
    .pipeline-badge-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        margin-top: 10px;
    }
    .pipeline-step {
        background: rgba(30, 41, 59, 0.85);
        border: 1px solid rgba(99, 102, 241, 0.35);
        color: #e2e8f0;
        padding: 3px 9px;
        border-radius: 6px;
        font-size: 0.78rem;
        font-weight: 500;
    }
    .pipeline-arrow {
        color: #818cf8;
        font-weight: 700;
        font-size: 0.8rem;
    }

    /* Cards & Containers */
    .metric-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 16px 20px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .metric-title {
        font-size: 0.82rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
    }
    .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f8fafc;
    }
    
    /* Result Box */
    .response-card {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 12px;
        padding: 20px;
        margin-top: 14px;
        font-size: 1.05rem;
        line-height: 1.6;
        color: #f1f5f9;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.1);
    }

    /* Tabs Styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: rgba(30, 41, 59, 0.5);
        border-radius: 8px 8px 0 0;
        padding: 8px 16px;
        font-weight: 600;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
</style>
""", unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Cached Model Loader
# ---------------------------------------------------------------------------
@st.cache_resource(show_spinner=False)
def get_cached_model(model_id: str, device: str):
    return load_model_and_tokenizer(model_id, device=device)


# ---------------------------------------------------------------------------
# Sidebar: Model, Compute & Hyperparameter Controls (Step 6)
# ---------------------------------------------------------------------------
with st.sidebar:
    st.image("https://raw.githubusercontent.com/huggingface/transformers/main/docs/source/en/imgs/transformers_logo_name.png", width=180)
    st.markdown("### ⚙️ Model & Hardware Controls")

    detected_device = get_system_device()
    
    model_choice = st.selectbox(
        "Select Hugging Face Model",
        options=[
            DEFAULT_MODEL_ID,
            LIGHT_MODEL_ID
        ],
        index=0,
        help="Qwen2.5-1.5B-Instruct has 28 Transformer layers and 1.54B parameters as specified in the project PDF."
    )

    device_option = st.radio(
        "Compute Device",
        options=["Auto-Detect (" + detected_device.upper() + ")", "cpu", "cuda"] if detected_device == "cuda" else ["Auto-Detect (CPU)", "cpu"],
        index=0
    )
    active_device = "cuda" if "cuda" in device_option.lower() else "cpu"

    st.markdown("---")
    st.markdown("### 🎛️ Generation Hyperparameters")

    temperature = st.slider("Temperature", min_value=0.0, max_value=1.5, value=0.7, step=0.05,
                            help="Lower values make output deterministic; higher values increase variety.")
    top_p = st.slider("Top-P (Nucleus Sampling)", min_value=0.1, max_value=1.0, value=0.9, step=0.05,
                      help="Accumulates candidates until cumulative probability reaches P.")
    top_k = st.slider("Top-K Filtering", min_value=1, max_value=100, value=50, step=1,
                      help="Restricts generation to top K probability candidates.")
    max_tokens = st.slider("Max New Tokens", min_value=5, max_value=64, value=20, step=5,
                           help="Maximum number of tokens to generate auto-regressively.")

    st.markdown("---")
    st.markdown("### ℹ️ Architecture Specs")
    st.info(
        "• **Model:** `Qwen2.5-1.5B-Instruct`\n"
        "• **Layers:** 28 Transformer Blocks\n"
        "• **Attention Heads:** 12 Query / 2 Key-Value (GQA)\n"
        "• **Hidden Dim:** 1536\n"
        "• **Vocab Size:** 151,936\n"
        "• **Framework:** PyTorch + HF Transformers"
    )


# ---------------------------------------------------------------------------
# Main Hero Section
# ---------------------------------------------------------------------------
st.markdown("""
<div class="hero-header">
    <div class="hero-title">🔬 PROJECT PHASE 1 — LLM X-RAY</div>
    <div class="hero-subtitle">Interactive Visualization of Local Large Language Model Inference</div>
    <div class="pipeline-badge-container">
        <span class="pipeline-step">1. Input Prompt</span>
        <span class="pipeline-arrow">➔</span>
        <span class="pipeline-step">2. Tokenizer & IDs</span>
        <span class="pipeline-arrow">➔</span>
        <span class="pipeline-step">3. Input Embeddings</span>
        <span class="pipeline-arrow">➔</span>
        <span class="pipeline-step">4. 28 Transformer Layers</span>
        <span class="pipeline-arrow">➔</span>
        <span class="pipeline-step">5. Self-Attention</span>
        <span class="pipeline-arrow">➔</span>
        <span class="pipeline-step">6. Hidden States</span>
        <span class="pipeline-arrow">➔</span>
        <span class="pipeline-step">7. LM Head Logits</span>
        <span class="pipeline-arrow">➔</span>
        <span class="pipeline-step">8. Softmax & Generation</span>
    </div>
</div>
""", unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Step 3 - Interactive Prompt Input Interface
# ---------------------------------------------------------------------------
col_prompt, col_preset = st.columns([3, 1])

with col_preset:
    preset_choice = st.selectbox(
        "💡 Quick Preset Prompts",
        options=[
            "Custom Input...",
            "Explain Machine Learning",
            "What is AI?",
            "The capital of France is",
            "def quicksort(arr):",
            "Why is the sky blue?"
        ]
    )

default_prompt = "Explain Machine Learning" if preset_choice == "Custom Input..." else (
    preset_choice if preset_choice != "Custom Input..." else "Explain Machine Learning"
)

with col_prompt:
    prompt_input = st.text_input(
        "Enter your prompt to X-Ray:",
        value=default_prompt,
        placeholder="Type any prompt to observe the LLM inner workings..."
    )

generate_clicked = st.button("⚡ Run LLM X-Ray Forward Pass & Generation", type="primary", use_container_width=True)

# ---------------------------------------------------------------------------
# Model Loading & Inference Execution
# ---------------------------------------------------------------------------
if "xray_data" not in st.session_state:
    st.session_state.xray_data = None
if "generation_data" not in st.session_state:
    st.session_state.generation_data = None
if "current_prompt" not in st.session_state:
    st.session_state.current_prompt = ""

if generate_clicked and prompt_input.strip():
    with st.spinner(f"Loading '{model_choice}' on {active_device.upper()} and running full X-Ray inference..."):
        try:
            start_time = time.time()
            model, tokenizer = get_cached_model(model_choice, active_device)
            load_time = time.time() - start_time

            # 1. Run full X-Ray Forward pass (captures embeddings, hidden states, attention, logits)
            fwd_start = time.time()
            xray_data = run_xray_forward_pass(model, tokenizer, prompt_input, device=active_device)
            fwd_time = time.time() - fwd_start

            # 2. Run Step-by-Step Auto-regressive Generation
            gen_start = time.time()
            generation_data = run_step_by_step_generation(
                model=model,
                tokenizer=tokenizer,
                prompt=prompt_input,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                device=active_device
            )
            gen_time = time.time() - gen_start

            xray_data["timing"] = {
                "load_time": load_time,
                "forward_time": fwd_time,
                "generation_time": gen_time
            }

            st.session_state.xray_data = xray_data
            st.session_state.generation_data = generation_data
            st.session_state.current_prompt = prompt_input
            st.success(f"X-Ray completed in {fwd_time + gen_time:.2f}s!")

        except Exception as e:
            st.error(f"Inference error: {str(e)}")


# ---------------------------------------------------------------------------
# Step 4 to 10: Multi-Tab Interactive X-Ray Visualizer
# ---------------------------------------------------------------------------
if st.session_state.xray_data is not None:
    xray = st.session_state.xray_data
    gen = st.session_state.generation_data
    tokens = xray["tokens"]
    input_ids = xray["input_ids"]
    embeddings = xray["input_embeddings"]
    hidden_states = xray["hidden_states"]
    attentions = xray["attentions"]
    top_preds = xray["top_predictions"]
    num_layers = len(attentions)
    num_heads = attentions[0].shape[0] if attentions else 12

    # Overview Metrics Row
    m1, m2, m3, m4, m5 = st.columns(5)
    with m1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Input Tokens</div>
            <div class="metric-value">{xray['seq_len']}</div>
        </div>
        """, unsafe_allow_html=True)
    with m2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Generated Tokens</div>
            <div class="metric-value">{gen['total_tokens_generated']}</div>
        </div>
        """, unsafe_allow_html=True)
    with m3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Transformer Layers</div>
            <div class="metric-value">{num_layers}</div>
        </div>
        """, unsafe_allow_html=True)
    with m4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Attention Heads</div>
            <div class="metric-value">{num_heads}</div>
        </div>
        """, unsafe_allow_html=True)
    with m5:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Top Prediction</div>
            <div class="metric-value" style="color: #34d399;">{top_preds[0]['probability_percent']}%</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Main Tabs
    tab_chat, tab_token, tab_emb, tab_arch, tab_att, tab_logits, tab_gen = st.tabs([
        "💬 Chat & Output",
        "🔤 Step 4: Tokenization & IDs",
        "🧬 Step 5: Embeddings & PCA",
        "🏗️ Steps 6 & 8: Transformer & Hidden States",
        "👁️ Step 7: Attention Visualization",
        "📊 Step 9: Logits & Probabilities",
        "⏩ Step 10: Step-by-Step Generation"
    ])

    # -----------------------------------------------------------------------
    # TAB 1: Chat Interface & Full Generated Output (Step 3)
    # -----------------------------------------------------------------------
    with tab_chat:
        st.markdown("### 💬 Chat Response & Generation Summary")
        
        st.markdown("**Prompt:**")
        st.info(st.session_state.current_prompt)
        
        st.markdown("**Model Generated Response:**")
        st.markdown(f"""
        <div class="response-card">
            <b>{gen['full_generated_text']}</b>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        c_t1, c_t2, c_t3 = st.columns(3)
        c_t1.metric("Forward Pass Time", f"{xray['timing']['forward_time']:.3f} s")
        c_t2.metric("Generation Time", f"{xray['timing']['generation_time']:.3f} s")
        c_t3.metric("Prediction Uncertainty (Entropy)", f"{xray['entropy']:.2f}")

    # -----------------------------------------------------------------------
    # TAB 2: Tokenization & Token IDs (Step 4)
    # -----------------------------------------------------------------------
    with tab_token:
        st.markdown("### 🔤 Step 4 — Tokenization & Token IDs")
        st.markdown(
            "The tokenizer converts raw text into numerical token IDs that the model's neural network can process. "
            "Each color below represents an individual token boundary."
        )

        # Get token metadata
        tok_data = []
        for idx, (tid, tok_str) in enumerate(zip(input_ids, tokens)):
            tok_data.append({
                "index": idx,
                "token_id": tid,
                "display_token": tok_str,
                "byte_length": len(tok_str.encode("utf-8")),
                "is_special": False
            })

        st.markdown("#### 🎨 Color-Coded Token Sequence:")
        st.markdown(render_token_chips_html(tok_data), unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        t_col1, t_col2 = st.columns([3, 2])

        with t_col1:
            st.markdown("#### 📋 Detailed Token Breakdown:")
            df_tokens = pd.DataFrame([
                {
                    "Index": d["index"],
                    "Token String": repr(d["display_token"]),
                    "Token ID": d["token_id"],
                    "Byte Length": d["byte_length"]
                }
                for d in tok_data
            ])
            st.dataframe(df_tokens, use_container_width=True, hide_index=True)

        with t_col2:
            st.markdown("#### 🔢 Raw Input Token IDs Tensor:")
            st.code(str(input_ids), language="python")
            
            st.markdown("#### 📊 Tokenizer Statistics:")
            st.write(f"• **Total Characters:** `{len(st.session_state.current_prompt)}`")
            st.write(f"• **Total Tokens:** `{len(input_ids)}`")
            st.write(f"• **Compression Ratio:** `{round(len(st.session_state.current_prompt) / max(len(input_ids), 1), 2)} chars/token`")
            st.write(f"• **Vocabulary Size:** `{xray['model_meta']['vocab_size']:,}`")

    # -----------------------------------------------------------------------
    # TAB 3: Embedding Visualization & PCA (Step 5)
    # -----------------------------------------------------------------------
    with tab_emb:
        st.markdown("### 🧬 Step 5 — Input Embedding Vectors & PCA Projection")
        st.markdown(
            "Each token ID is mapped to a continuous high-dimensional vector in embedding space "
            f"(Dimension = **{embeddings.shape[1]}** for {model_choice})."
        )

        pca_mode = st.radio("PCA Projection Dimension", ["2D PCA Scatter", "3D PCA Scatter"], horizontal=True)
        if pca_mode == "2D PCA Scatter":
            st.plotly_chart(plot_embedding_pca_2d(tokens, embeddings), use_container_width=True)
        else:
            st.plotly_chart(plot_embedding_pca_3d(tokens, embeddings), use_container_width=True)

        st.markdown("---")
        st.markdown("#### 🌡️ Input Embedding Heatmap & Vector Statistics:")
        e_col1, e_col2 = st.columns([3, 2])

        with e_col1:
            st.plotly_chart(plot_embedding_heatmap(tokens, embeddings, max_dims=64), use_container_width=True)

        with e_col2:
            st.markdown("##### 📈 Embedding Vector Statistics:")
            stats_rows = []
            for i, (tok, vec) in enumerate(zip(tokens, embeddings)):
                stats_rows.append({
                    "Token": repr(tok),
                    "L2 Norm": round(float(np.linalg.norm(vec)), 3),
                    "Mean": round(float(np.mean(vec)), 4),
                    "Std": round(float(np.std(vec)), 4),
                    "Min": round(float(np.min(vec)), 3),
                    "Max": round(float(np.max(vec)), 3)
                })
            st.dataframe(pd.DataFrame(stats_rows), use_container_width=True, hide_index=True)

    # -----------------------------------------------------------------------
    # TAB 4: Transformer Architecture & Hidden States (Steps 6 & 8)
    # -----------------------------------------------------------------------
    with tab_arch:
        st.markdown("### 🏗️ Steps 6 & 8 — Transformer Architecture & Hidden States Evolution")
        st.markdown(
            f"The input flows through **{num_layers} Transformer Blocks**. In each block, token vectors undergo "
            "Multi-Head Self-Attention, RMS Normalization, and MLP Feed-Forward expansions."
        )

        st.plotly_chart(plot_hidden_states_evolution(tokens, hidden_states), use_container_width=True)

        st.markdown("---")
        h_col1, h_col2 = st.columns([3, 2])

        with h_col1:
            st.plotly_chart(plot_hidden_layer_drift_heatmap(hidden_states), use_container_width=True)

        with h_col2:
            st.markdown("#### 🔍 Inspect Specific Layer Hidden State:")
            selected_inspect_layer = st.selectbox(
                "Select Transformer Layer to Inspect",
                options=list(range(len(hidden_states))),
                format_func=lambda x: "Layer 0 (Embeddings)" if x == 0 else f"Layer {x} (Transformer Block {x})"
            )
            hs_layer = hidden_states[selected_inspect_layer]
            st.write(f"• **Tensor Shape:** `[{hs_layer.shape[0]} tokens, {hs_layer.shape[1]} dimensions]`")
            st.write(f"• **Mean Magnitude:** `{np.mean(np.linalg.norm(hs_layer, axis=1)):.3f}`")
            st.write(f"• **Cosine Similarity with Embedding:** `{float(np.dot(np.mean(hidden_states[0], axis=0), np.mean(hs_layer, axis=0)) / (np.linalg.norm(np.mean(hidden_states[0], axis=0)) * np.linalg.norm(np.mean(hs_layer, axis=0)) + 1e-10)):.3f}`")

    # -----------------------------------------------------------------------
    # TAB 5: Attention Visualization (Step 7)
    # -----------------------------------------------------------------------
    with tab_att:
        st.markdown("### 👁️ Step 7 — Multi-Head Self-Attention Heatmaps")
        st.markdown(
            "Self-attention allows each token to attend to other tokens in the prompt sequence to build context-aware representations."
        )

        c_l, c_h = st.columns(2)
        with c_l:
            sel_layer = st.slider("Select Transformer Layer", min_value=0, max_value=num_layers - 1, value=0)
        with c_h:
            sel_head = st.slider("Select Attention Head", min_value=0, max_value=num_heads - 1, value=0)

        # Plot specific attention matrix
        layer_att_matrix = attentions[sel_layer] # [num_heads, seq_len, seq_len]
        head_matrix = layer_att_matrix[sel_head] # [seq_len, seq_len]

        st.plotly_chart(plot_attention_heatmap(tokens, head_matrix, sel_layer, sel_head), use_container_width=True)

        st.markdown("---")
        st.markdown("#### 🎯 Multi-Head Attention Focus for Target Token:")
        st.plotly_chart(plot_attention_head_comparison(tokens, layer_att_matrix, target_token_idx=-1), use_container_width=True)

    # -----------------------------------------------------------------------
    # TAB 6: Logits & Next-Token Probabilities (Step 9)
    # -----------------------------------------------------------------------
    with tab_logits:
        st.markdown("### 📊 Step 9 — LM Head Logits & Next-Token Softmax Probabilities")
        st.markdown(
            "The final layer hidden state passes into the **LM Head** projection to produce unnormalized **Logits** across "
            "all vocabulary items, which are transformed via **Softmax** into probability distributions."
        )

        top_k_display = st.slider("Display Top-K Candidates", min_value=5, max_value=25, value=12)
        st.plotly_chart(plot_logits_distribution(top_preds, top_k=top_k_display), use_container_width=True)

        st.markdown("#### 🏆 Top Candidate Ranking Table:")
        df_preds = pd.DataFrame(top_preds[:top_k_display])[["token_id", "display_token", "probability_percent", "logit"]]
        df_preds.columns = ["Token ID", "Candidate Token", "Probability (%)", "Raw Logit"]
        st.dataframe(df_preds, use_container_width=True, hide_index=True)

    # -----------------------------------------------------------------------
    # TAB 7: Step-by-Step Auto-Regressive Generation (Step 10)
    # -----------------------------------------------------------------------
    with tab_gen:
        st.markdown("### ⏩ Step 10 — Step-by-Step Auto-Regressive Generation Trace")
        st.markdown(
            "Large Language Models generate text one token at a time. In each step, the model samples a new token, "
            "appends it to the context, and repeats the process."
        )

        gen_steps = gen["steps"]
        if gen_steps:
            step_idx = st.slider("Generation Step Replay", min_value=1, max_value=len(gen_steps), value=1)
            active_step_data = gen_steps[step_idx - 1]

            g_c1, g_c2 = st.columns([2, 3])
            with g_c1:
                st.markdown(f"#### 🎯 Step {active_step_data['step']} Details:")
                st.write(f"• **Chosen Token:** `{repr(active_step_data['chosen_token'])}`")
                st.write(f"• **Chosen Token ID:** `{active_step_data['chosen_token_id']}`")
                st.write(f"• **End of Sequence (EOS):** `{active_step_data['is_eos']}`")
                
                st.markdown("##### 📝 Cumulative Text at this Step:")
                st.info(f"{st.session_state.current_prompt} **{active_step_data['cumulative_text']}**")

            with g_c2:
                st.plotly_chart(plot_generation_step_candidates(active_step_data), use_container_width=True)

            st.markdown("---")
            st.markdown("#### 📜 Complete Auto-Regressive Rollout Log:")
            rollout_rows = []
            for s in gen_steps:
                rollout_rows.append({
                    "Step": s["step"],
                    "Generated Token": repr(s["chosen_token"]),
                    "Token ID": s["chosen_token_id"],
                    "Cumulative Response": s["cumulative_text"]
                })
            st.dataframe(pd.DataFrame(rollout_rows), use_container_width=True, hide_index=True)

else:
    # Initial landing screen before generation
    st.info("👈 Enter a prompt above and click **'⚡ Run LLM X-Ray Forward Pass & Generation'** to observe inside the LLM!")
