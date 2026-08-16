# 🔬 LLM X-Ray: Interactive Visualization of LLM Inference

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.14-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-ee4c2c.svg)](https://pytorch.org/)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Transformers-yellow.svg)](https://huggingface.co/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.35+-FF4B4B.svg)](https://streamlit.io/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

> **PROJECT PHASE 1 — LLM X-RAY**  
> An interactive, high-precision visual inspection tool for local Large Language Model inference built with **PyTorch**, **Hugging Face Transformers**, **Streamlit**, and **Plotly**.

---

## 📖 Project Overview

Large Language Models (LLMs) are often treated as black boxes. **LLM X-Ray** makes the internal inference lifecycle observable, interpretable, and visually intuitive in real-time on a personal laptop without requiring external APIs or paid services.

### 🔄 Core Inference Lifecycle

```
Input Prompt ➔ Tokenization ➔ Token IDs ➔ Embeddings ➔ Transformer Layers (28) ➔ Multi-Head Attention ➔ Hidden States ➔ LM Head Logits ➔ Softmax Probabilities ➔ Next Token Generation ➔ Final Response
```

---

## 🎯 Target Model

- **Model:** `Qwen/Qwen2.5-1.5B-Instruct` (with fast option for `Qwen2.5-0.5B-Instruct`)
- **Parameters:** 1.54 Billion
- **Transformer Layers:** 28 Layers
- **Attention Heads:** 12 Query Heads (Grouped Query Attention)
- **Hidden Dimension:** 1536
- **Vocabulary Size:** 151,936
- **License:** Apache 2.0

---

## 🏗️ Architecture & Features

| Step | Component | Description & Visualizations |
|---|---|---|
| **Step 1** | **Setup & Environment** | Modular Python architecture with requirements management. |
| **Step 2** | **Model & Hooks** | PyTorch + HF pipeline capturing attention weights & hidden activations. |
| **Step 3** | **Interactive Chat Interface** | Modern UI with temperature, top-p, top-k, and max token controls. |
| **Step 4** | **Tokenization & IDs** | Color-coded token chips, token IDs tensor, compression ratio, byte lengths. |
| **Step 5** | **Input Embeddings & PCA** | 2D & 3D PCA token manifold projections, embedding heatmaps, vector statistics. |
| **Step 6 & 8** | **Transformer & Hidden States** | Hidden state vector magnitude trajectory across 28 layers and layer drift matrix. |
| **Step 7** | **Multi-Head Attention** | Interactive $N \times N$ attention heatmaps with layer & head sliders. |
| **Step 9** | **Logits & Probabilities** | LM head logit distribution bar chart, top-K Softmax candidate rankings, entropy. |
| **Step 10** | **Step-by-Step Rollout** | Auto-regressive generation stepper with per-step candidate decisions. |

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/ruthwin09/LLMPROJ.git
cd LLMPROJ
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Streamlit Application
```bash
streamlit run app.py
```

Open your browser at `http://localhost:8501`.

---

## 📂 Project Directory Structure

```
LLM-XRay/
├── app.py              # Main Streamlit web application & UI layout
├── model.py            # Model loader, forward pass hook extractor, and auto-regressive generation
├── tokenizer.py        # Tokenizer analysis and HTML chip visualizer
├── visualization.py    # Plotly interactive charting engine (PCA, Attention, Logits, Hidden States)
├── requirements.txt    # Project dependencies
├── .gitignore          # Git ignore configuration
└── README.md           # Documentation
```

---

## 🛠️ Technology Stack

- **Python 3.10+**
- **PyTorch**: Local tensor computation and neural network execution
- **Hugging Face Transformers**: Model architecture and tokenizer
- **Streamlit**: Web dashboard interface
- **Plotly**: Interactive 2D/3D graphs, heatmaps, and distributions
- **Scikit-Learn**: PCA dimensionality reduction
- **NumPy & Pandas**: High-performance data structures and matrix operations
