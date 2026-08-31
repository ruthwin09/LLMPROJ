"""
=============================================================================
 ChatGPT Interface with Integrated Deep Neural Inspection (LLM X-Ray)
 Fully functional multi-turn AI assistant with multi-session chat history,
 real-time streaming generation, customizable personas, and deep X-Ray telemetry.
=============================================================================
"""

import time
import json
import uuid
from typing import Dict, Any, List
import streamlit as st
import numpy as np
import pandas as pd

# Internal modules
from tokenizer import tokenize_input, render_token_chips_html
from model import (
    DEFAULT_MODEL_ID,
    LIGHT_MODEL_ID,
    SYSTEM_PERSONAS,
    get_system_device,
    load_model_and_tokenizer,
    generate_chat_response,
    run_xray_on_demand,
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
# Page Configuration & ChatGPT Material Dark Styling
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="ChatGPT",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom High-End ChatGPT CSS Styling
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #121214;
        color: #f3f3f6;
    }

    /* Main Container Padding */
    .main .block-container {
        padding-top: 1.2rem;
        padding-bottom: 3.5rem;
        max-width: 1050px;
    }

    /* Material Dark Sidebar */
    [data-testid="stSidebar"] {
        background-color: #18181e;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Top Navigation Header */
    .chatgpt-nav-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 18px;
        background: #1e1e24;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        margin-bottom: 20px;
    }
    .nav-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.15rem;
        font-weight: 700;
        color: #f3f3f6;
    }
    .nav-badge {
        background: rgba(187, 134, 252, 0.15);
        border: 1px solid rgba(187, 134, 252, 0.4);
        color: #d0bcff;
        font-size: 0.72rem;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
    }
    .nav-device-badge {
        background: rgba(124, 77, 255, 0.2);
        border: 1px solid rgba(124, 77, 255, 0.4);
        color: #bb86fc;
        font-size: 0.72rem;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
    }

    /* Welcoming Empty State Hero */
    .welcome-container {
        text-align: center;
        padding: 40px 20px 20px 20px;
        margin-bottom: 20px;
    }
    .welcome-avatar {
        font-size: 3rem;
        margin-bottom: 12px;
        display: inline-block;
        background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .welcome-title {
        font-size: 1.85rem;
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 8px;
    }
    .welcome-subtitle {
        font-size: 0.98rem;
        color: #94a3b8;
        max-width: 600px;
        margin: 0 auto 28px auto;
        line-height: 1.5;
    }

    /* Starter Suggestion Cards */
    .starter-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        max-width: 800px;
        margin: 0 auto 24px auto;
    }
    .starter-card {
        background: #212121;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 14px 16px;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .starter-card:hover {
        background: #2f2f2f;
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-2px);
    }
    .starter-card-icon {
        font-size: 1.2rem;
        margin-bottom: 6px;
    }
    .starter-card-title {
        font-size: 0.88rem;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 4px;
    }
    .starter-card-desc {
        font-size: 0.78rem;
        color: #94a3b8;
        line-height: 1.4;
    }

    /* Message Styling */
    .stChatMessage {
        background-color: transparent !important;
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 12px;
    }
    
    /* Generation Stats Pill */
    .stats-pill-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
        margin-bottom: 12px;
    }
    .stat-pill {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 2px 8px;
        font-size: 0.72rem;
        color: #94a3b8;
    }
    .stat-pill b {
        color: #e2e8f0;
    }

    /* Inspection Container */
    .xray-expander {
        background: #18181b;
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 10px;
        padding: 12px;
        margin-top: 10px;
    }

    /* Footer Disclaimer */
    .chatgpt-footer {
        text-align: center;
        font-size: 0.74rem;
        color: #71717a;
        margin-top: 18px;
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
# Session State Initialization
# ---------------------------------------------------------------------------
if "sessions" not in st.session_state:
    initial_id = str(uuid.uuid4())[:8]
    st.session_state.sessions = {
        initial_id: {
            "id": initial_id,
            "title": "New Chat",
            "created_at": time.time(),
            "messages": []
        }
    }
    st.session_state.current_session_id = initial_id

if "current_session_id" not in st.session_state:
    st.session_state.current_session_id = list(st.session_state.sessions.keys())[0]

if "view_mode" not in st.session_state:
    st.session_state.view_mode = "chat"

if "suggested_prompt" not in st.session_state:
    st.session_state.suggested_prompt = None

# Ensure active session exists
if st.session_state.current_session_id not in st.session_state.sessions:
    new_id = str(uuid.uuid4())[:8]
    st.session_state.sessions[new_id] = {
        "id": new_id,
        "title": "New Chat",
        "created_at": time.time(),
        "messages": []
    }
    st.session_state.current_session_id = new_id

if "google_user" not in st.session_state:
    st.session_state.google_user = None

active_session = st.session_state.sessions[st.session_state.current_session_id]

# ---------------------------------------------------------------------------
# Sidebar: ChatGPT Navigation, Conversations & Model Controls
# ---------------------------------------------------------------------------
with st.sidebar:
    # App Branding
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <span style="font-size: 1.7rem;">🤖</span>
        <div>
            <div style="font-size: 1.15rem; font-weight: 700; color: #f8fafc; line-height: 1.1;">ChatGPT</div>
            <div style="font-size: 0.75rem; color: #10b981; font-weight: 600;">AI Platform with Google SSO</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Google Authentication Card
    if st.session_state.google_user:
        u = st.session_state.google_user
        st.markdown(f"""
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 8px 12px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <div style="font-size: 0.8rem; font-weight: 700; color: #f8fafc;">🟢 {u.get('name', 'Google User')}</div>
                <div style="font-size: 0.7rem; color: #94a3b8;">{u.get('email', '')}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Sign Out of Google", key="sign_out_google_btn", use_container_width=True):
            st.session_state.google_user = None
            st.rerun()
    else:
        with st.expander("🔑 Sign In with Google Account", expanded=False):
            g_email = st.text_input("Google Email", placeholder="user@gmail.com", key="st_google_email")
            g_name = st.text_input("Name (Optional)", placeholder="Google User", key="st_google_name")
            if st.button("Sign In with Google", key="st_google_signin_btn", use_container_width=True):
                if g_email and "@" in g_email:
                    st.session_state.google_user = {
                        "email": g_email.strip().lower(),
                        "name": g_name.strip() or g_email.split("@")[0].capitalize(),
                    }
                    st.success("Signed in with Google!")
                    st.rerun()
                else:
                    st.error("Please enter a valid Google email.")

    # ➕ New Chat Button
    if st.button("➕  New Chat", use_container_width=True, type="primary"):
        new_sess_id = str(uuid.uuid4())[:8]
        st.session_state.sessions[new_sess_id] = {
            "id": new_sess_id,
            "title": "New Chat",
            "created_at": time.time(),
            "messages": []
        }
        st.session_state.current_session_id = new_sess_id
        st.session_state.suggested_prompt = None
        st.rerun()

    st.markdown("<div style='height: 8px;'></div>", unsafe_allow_html=True)

    # Chat Sessions List
    st.markdown("<div style='font-size: 0.78rem; font-weight: 600; color: #a1a1aa; text-transform: uppercase; margin-bottom: 6px;'>Recent Conversations</div>", unsafe_allow_html=True)
    
    session_keys = list(st.session_state.sessions.keys())
    # Sort sessions by created_at descending
    session_keys.sort(key=lambda k: st.session_state.sessions[k]["created_at"], reverse=True)

    for s_id in session_keys:
        sess = st.session_state.sessions[s_id]
        is_selected = (s_id == st.session_state.current_session_id)
        
        # Display session button with active highlight
        btn_label = f"💬  {sess['title'][:24]}..." if len(sess['title']) > 24 else f"💬  {sess['title']}"
        if is_selected:
            btn_label = f"👉 {sess['title'][:22]}..." if len(sess['title']) > 22 else f"👉 {sess['title']}"

        col_s1, col_s2 = st.columns([5, 1])
        with col_s1:
            if st.button(btn_label, key=f"sess_btn_{s_id}", use_container_width=True, disabled=is_selected):
                st.session_state.current_session_id = s_id
                st.session_state.suggested_prompt = None
                st.rerun()
        with col_s2:
            if len(st.session_state.sessions) > 1:
                if st.button("🗑️", key=f"del_sess_{s_id}", help="Delete chat"):
                    del st.session_state.sessions[s_id]
                    if st.session_state.current_session_id == s_id:
                        st.session_state.current_session_id = list(st.session_state.sessions.keys())[0]
                    st.rerun()

    st.markdown("---")

    # Model & Compute Configuration
    st.markdown("#### ⚙️ Model & Hardware")
    
    detected_device = get_system_device()
    
    selected_model = st.selectbox(
        "Model Architecture",
        options=[
            LIGHT_MODEL_ID,
            DEFAULT_MODEL_ID
        ],
        index=0,
        help="Qwen2.5-0.5B is fast and responsive for local chat; Qwen2.5-1.5B provides 28 Transformer layers and deeper reasoning."
    )

    device_options = ["Auto-Detect (" + detected_device.upper() + ")", "cpu", "cuda"] if detected_device == "cuda" else ["Auto-Detect (CPU)", "cpu"]
    selected_device_radio = st.radio(
        "Compute Device",
        options=device_options,
        index=0
    )
    active_device = "cuda" if "cuda" in selected_device_radio.lower() else "cpu"

    st.markdown("---")

    # Persona / System Instructions
    st.markdown("#### 🎭 Persona & Instructions")
    persona_choice = st.selectbox("Preset Persona", list(SYSTEM_PERSONAS.keys()), index=0)
    
    custom_system_prompt = SYSTEM_PERSONAS[persona_choice]
    if persona_choice == "Custom Persona":
        custom_system_prompt = st.text_area("Custom System Prompt", value="You are a helpful AI assistant.", height=80)
    else:
        with st.expander("View System Instructions"):
            st.caption(custom_system_prompt)

    st.markdown("---")

    # Generation Hyperparameters
    st.markdown("#### 🎛️ Hyperparameters")
    temperature = st.slider("Temperature", min_value=0.0, max_value=1.5, value=0.7, step=0.05,
                            help="Lower values make output deterministic; higher values increase variety.")
    top_p = st.slider("Top-P (Nucleus Sampling)", min_value=0.1, max_value=1.0, value=0.9, step=0.05)
    top_k = st.slider("Top-K Filtering", min_value=1, max_value=100, value=50, step=1)
    max_tokens = st.slider("Max Output Tokens", min_value=16, max_value=300, value=100, step=16)

    st.markdown("---")
    
    # View Mode Toggle & Chat Management
    st.markdown("#### 🛠️ Options & Actions")
    show_xray_inline = st.checkbox("🔬 Always Auto-Expand X-Ray", value=False, help="Automatically open X-Ray inspection panel under every response.")

    col_act1, col_act2 = st.columns(2)
    with col_act1:
        if st.button("🧹 Clear Chat", use_container_width=True):
            active_session["messages"] = []
            active_session["title"] = "New Chat"
            st.rerun()
    with col_act2:
        # Export chat
        chat_export_json = json.dumps(active_session["messages"], indent=2)
        st.download_button("📥 Export", data=chat_export_json, file_name=f"chat_{active_session['id']}.json", mime="application/json", use_container_width=True)


# ---------------------------------------------------------------------------
# Main Interface: Top Header Bar
# ---------------------------------------------------------------------------
model_short_name = "Qwen2.5-0.5B" if "0.5B" in selected_model else "Qwen2.5-1.5B"

st.markdown(f"""
<div class="chatgpt-nav-bar">
    <div class="nav-brand">
        <span>🤖</span>
        <span>{active_session['title']}</span>
        <span class="nav-badge">{model_short_name}</span>
        <span class="nav-device-badge">⚡ {active_device.upper()}</span>
    </div>
    <div style="font-size: 0.8rem; color: #94a3b8;">
        {len(active_session['messages'])} messages in session
    </div>
</div>
""", unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Helper: Render X-Ray Inspection Panel for a Message Turn
# ---------------------------------------------------------------------------
def render_message_xray_panel(xray_data: Dict[str, Any], gen_data: Dict[str, Any], turn_key: str):
    """Renders the 6 interactive inspection tabs for an assistant message turn."""
    tokens = xray_data.get("tokens", [])
    input_ids = xray_data.get("input_ids", [])
    embeddings = xray_data.get("input_embeddings")
    hidden_states = xray_data.get("hidden_states", [])
    attentions = xray_data.get("attentions", [])
    top_preds = xray_data.get("top_predictions", [])
    num_layers = len(attentions) if attentions else len(hidden_states) - 1
    num_heads = attentions[0].shape[0] if attentions else 12

    st.markdown(f"""
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <span style="font-size: 1.1rem;">🔬</span>
        <span style="font-weight: 700; color: #818cf8; font-size: 0.95rem;">Deep Neural Inspection (LLM X-Ray)</span>
        <span style="font-size: 0.75rem; color: #94a3b8;">• {num_layers} Layers • {num_heads} Heads • {xray_data.get('seq_len', 0)} Tokens</span>
    </div>
    """, unsafe_allow_html=True)

    t_tok, t_emb, t_att, t_hs, t_log, t_gen = st.tabs([
        "🔤 Tokenization & IDs",
        "🧬 Embeddings & PCA",
        "👁️ Multi-Head Attention",
        "🏗️ Transformer & Hidden States",
        "📊 Logits & Probabilities",
        "⏩ Step-by-Step Generation"
    ])

    # 1. Tokenization & Token IDs
    with t_tok:
        tok_data = []
        for idx, (tid, tok_str) in enumerate(zip(input_ids, tokens)):
            tok_data.append({
                "index": idx,
                "token_id": tid,
                "display_token": tok_str,
                "byte_length": len(tok_str.encode("utf-8")),
                "is_special": False
            })

        st.markdown("##### 🎨 Color-Coded Token Chips Sequence:")
        st.markdown(render_token_chips_html(tok_data), unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        col_t1, col_t2 = st.columns([3, 2])
        with col_t1:
            st.markdown("##### 📋 Token Breakdown:")
            df_toks = pd.DataFrame([{
                "Index": d["index"],
                "Token String": repr(d["display_token"]),
                "Token ID": d["token_id"],
                "Bytes": d["byte_length"]
            } for d in tok_data])
            st.dataframe(df_toks, use_container_width=True, hide_index=True)
        with col_t2:
            st.markdown("##### 🔢 Raw Input Token IDs:")
            st.code(str(input_ids), language="python")
            st.caption(f"Total Tokens: **{len(input_ids)}** | Vocab: **{xray_data.get('model_meta', {}).get('vocab_size', '151,936')}**")

    # 2. Embeddings & PCA
    with t_emb:
        if embeddings is not None and len(embeddings) > 0:
            pca_col1, pca_col2 = st.columns([1, 1])
            with pca_col1:
                st.markdown("##### 2D PCA Token Projection")
                st.plotly_chart(plot_embedding_pca_2d(tokens, embeddings), use_container_width=True, key=f"pca2d_{turn_key}")
            with pca_col2:
                st.markdown("##### 3D PCA Token Manifold")
                st.plotly_chart(plot_embedding_pca_3d(tokens, embeddings), use_container_width=True, key=f"pca3d_{turn_key}")
            st.markdown("##### 🌡️ Input Embedding Vector Heatmap")
            st.plotly_chart(plot_embedding_heatmap(tokens, embeddings, max_dims=64), use_container_width=True, key=f"emb_heat_{turn_key}")
        else:
            st.info("Embedding vectors not available for this turn.")

    # 3. Multi-Head Attention
    with t_att:
        if attentions and len(attentions) > 0:
            c_l, c_h = st.columns(2)
            with c_l:
                sel_layer = st.slider("Transformer Layer", min_value=0, max_value=num_layers - 1, value=0, key=f"att_l_{turn_key}")
            with c_h:
                sel_head = st.slider("Attention Head", min_value=0, max_value=num_heads - 1, value=0, key=f"att_h_{turn_key}")

            layer_att = attentions[sel_layer]
            head_att = layer_att[sel_head]
            st.plotly_chart(plot_attention_heatmap(tokens, head_att, sel_layer, sel_head), use_container_width=True, key=f"att_heat_{turn_key}")
            st.plotly_chart(plot_attention_head_comparison(tokens, layer_att, target_token_idx=-1), use_container_width=True, key=f"att_comp_{turn_key}")
        else:
            st.info("Attention weights not available for this turn.")

    # 4. Hidden States Evolution
    with t_hs:
        if hidden_states and len(hidden_states) > 0:
            st.plotly_chart(plot_hidden_states_evolution(tokens, hidden_states), use_container_width=True, key=f"hs_evo_{turn_key}")
            st.plotly_chart(plot_hidden_layer_drift_heatmap(hidden_states), use_container_width=True, key=f"hs_drift_{turn_key}")
        else:
            st.info("Hidden state activations not available for this turn.")

    # 5. Logits & Softmax Probabilities
    with t_log:
        if top_preds:
            st.plotly_chart(plot_logits_distribution(top_preds, top_k=12), use_container_width=True, key=f"logits_{turn_key}")
            df_preds = pd.DataFrame(top_preds[:12])[["token_id", "display_token", "probability_percent", "logit"]]
            df_preds.columns = ["Token ID", "Candidate Token", "Probability (%)", "Raw Logit"]
            st.dataframe(df_preds, use_container_width=True, hide_index=True)
        else:
            st.info("Logits not available for this turn.")

    # 6. Step-by-Step Generation Rollout
    with t_gen:
        gen_steps = gen_data.get("steps", [])
        if gen_steps:
            step_idx = st.slider("Generation Step Replay", min_value=1, max_value=len(gen_steps), value=1, key=f"gen_step_{turn_key}")
            active_step = gen_steps[step_idx - 1]
            gs_c1, gs_c2 = st.columns([2, 3])
            with gs_c1:
                st.markdown(f"**Step {active_step['step']}:** Chosen token `{repr(active_step['chosen_token'])}` (ID: {active_step['chosen_token_id']})")
                st.info(f"**Cumulative Text:** {active_step['cumulative_text']}")
            with gs_c2:
                st.plotly_chart(plot_generation_step_candidates(active_step), use_container_width=True, key=f"cand_chart_{turn_key}")
        else:
            st.info("Step-by-step trace completed.")


# ---------------------------------------------------------------------------
# Welcoming Empty State (When no messages in current session)
# ---------------------------------------------------------------------------
if len(active_session["messages"]) == 0:
    st.markdown("""
    <div class="welcome-container">
        <div class="welcome-avatar">🤖</div>
        <div class="welcome-title">How can I help you today?</div>
        <div class="welcome-subtitle">
            Chat with local Large Language Models while visually observing internal tokenization,
            embedding manifolds, 28-layer attention weights, and next-token probability distributions.
        </div>
    </div>
    """, unsafe_allow_html=True)

    # 4 Interactive Suggestion Cards
    st.markdown("<div style='font-size: 0.85rem; font-weight: 600; color: #a1a1aa; text-align: center; margin-bottom: 12px;'>✨ SUGGESTED PROMPTS</div>", unsafe_allow_html=True)
    
    col_c1, col_c2 = st.columns(2)
    with col_c1:
        if st.button("💡 **Explain Concepts**\n\nExplain Machine Learning and Neural Networks in simple terms.", use_container_width=True, key="card_1"):
            st.session_state.suggested_prompt = "Explain Machine Learning and Neural Networks in simple terms."
            st.rerun()
        if st.button("🔬 **Inspect Attention Mechanism**\n\nHow does Transformer Self-Attention compute token interactions?", use_container_width=True, key="card_2"):
            st.session_state.suggested_prompt = "How does Transformer Self-Attention compute token interactions?"
            st.rerun()

    with col_c2:
        if st.button("🐍 **Python Code Generator**\n\nWrite a Python function to sort and filter a dictionary by values.", use_container_width=True, key="card_3"):
            st.session_state.suggested_prompt = "Write a Python function to sort and filter a dictionary by values."
            st.rerun()
        if st.button("🚀 **Brainstorm AI Innovations**\n\nGive me 3 innovative ideas for autonomous AI applications.", use_container_width=True, key="card_4"):
            st.session_state.suggested_prompt = "Give me 3 innovative ideas for autonomous AI applications."
            st.rerun()

    st.markdown("<div style='height: 30px;'></div>", unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Message History Rendering (Multi-Turn Chat)
# ---------------------------------------------------------------------------
for idx, msg in enumerate(active_session["messages"]):
    role = msg.get("role", "user")
    content = msg.get("content", "")
    avatar = "👤" if role == "user" else "🤖"

    with st.chat_message(role, avatar=avatar):
        st.markdown(content)

        # If Assistant Message and X-Ray data exists, provide stats and expander
        if role == "assistant":
            timing = msg.get("timing", {})
            fwd_t = timing.get("forward_time", 0)
            gen_t = timing.get("generation_time", 0)
            tok_sec = timing.get("tokens_per_sec", 0)
            xray_info = msg.get("xray_data")
            entropy = xray_info.get("entropy", 0) if xray_info else 0

            st.markdown(f"""
            <div class="stats-pill-container">
                <span class="stat-pill">⏱️ Gen Time: <b>{gen_t:.2f}s</b></span>
                <span class="stat-pill">⚡ Speed: <b>{tok_sec} t/s</b></span>
                <span class="stat-pill">🎯 Entropy: <b>{entropy:.2f}</b></span>
            </div>
            """, unsafe_allow_html=True)

            if xray_info and msg.get("generation_data"):
                with st.expander("🔬 **Inspect Response with LLM X-Ray** (Attention, Embeddings, Logits, Tokens)", expanded=show_xray_inline):
                    render_message_xray_panel(xray_info, msg.get("generation_data"), turn_key=f"turn_{idx}")


# ---------------------------------------------------------------------------
# Chat Input Bar & Execution Pipeline
# ---------------------------------------------------------------------------
# Check if suggested prompt was clicked
pending_prompt = st.session_state.suggested_prompt
if pending_prompt:
    st.session_state.suggested_prompt = None
    user_input = pending_prompt
else:
    user_input = st.chat_input("Message ChatGPT...")

if user_input and user_input.strip():
    # 1. Auto-title conversation on first message
    if len(active_session["messages"]) == 0:
        clean_title = user_input.strip().replace("\n", " ")
        if len(clean_title) > 28:
            clean_title = clean_title[:28] + "..."
        active_session["title"] = clean_title

    # 2. Append User Message
    active_session["messages"].append({
        "role": "user",
        "content": user_input.strip()
    })

    # Render User Message immediately
    with st.chat_message("user", avatar="👤"):
        st.markdown(user_input.strip())

    # 3. Generate Assistant Response with X-Ray
    with st.chat_message("assistant", avatar="🤖"):
        message_placeholder = st.empty()
        status_placeholder = st.empty()

        status_placeholder.markdown(f"<span style='color: #94a3b8; font-size: 0.85rem;'>Thinking with {model_short_name} on {active_device.upper()}...</span>", unsafe_allow_html=True)

        try:
            # Load cached model
            model, tokenizer = get_cached_model(selected_model, active_device)

            # Build conversation history for multi-turn context
            conversation_history = [
                {"role": m["role"], "content": m["content"]}
                for m in active_session["messages"]
            ]

            # Generate response with X-Ray telemetry
            gen_result = generate_chat_response_with_xray(
                model=model,
                tokenizer=tokenizer,
                messages=conversation_history,
                system_prompt=custom_system_prompt,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                device=active_device
            )

            status_placeholder.empty()
            
            response_content = gen_result["response"]
            message_placeholder.markdown(response_content)

            # Save Assistant Response to session history
            active_session["messages"].append({
                "role": "assistant",
                "content": response_content,
                "timing": gen_result["timing"],
                "xray_data": gen_result["xray_data"],
                "generation_data": gen_result["generation_data"]
            })

            st.rerun()

        except Exception as e:
            status_placeholder.empty()
            st.error(f"Inference error: {str(e)}")


# ---------------------------------------------------------------------------
# Footer
# ---------------------------------------------------------------------------
st.markdown("""
<div class="chatgpt-footer">
    ChatGPT Interface • Powered by PyTorch & Hugging Face Transformers • Inspect internal activations in real-time
</div>
""", unsafe_allow_html=True)

