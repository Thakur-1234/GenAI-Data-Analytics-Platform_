"""
Configuration and settings for GenAI Data Assistant
"""
import os
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
UPLOADS_DIR = ASSETS_DIR / "uploads"
CSS_DIR = ASSETS_DIR / "css"

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
CSS_DIR.mkdir(parents=True, exist_ok=True)

# Groq API Configuration
GROQ_MODEL = "mixtral-8x7b-32768"  # Faster, capable model
GROQ_TEMPERATURE = 0.7
GROQ_MAX_TOKENS = 2000

# YouTube Configuration
YOUTUBE_CHUNK_SIZE = 1000  # Characters per chunk
YOUTUBE_OVERLAP = 100  # Overlap between chunks

# FAISS Configuration
FAISS_EMBEDDING_DIM = 384  # Using sentence-transformers
FAISS_METRIC = "L2"

# EDA Configuration
EDA_SAMPLE_SIZE = 5000  # Max rows for analysis
EDA_CORRELATION_THRESHOLD = 0.7

# Data upload limits
MAX_FILE_SIZE_MB = 100
ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.json', '.parquet'}

# Visualization Configuration
PLOTLY_COLORS = {
    'primary': '#1f77b4',
    'secondary': '#ff7f0e',
    'success': '#2ca02c',
    'danger': '#d62728'
}

# Caching Configuration
CACHE_TTL = 3600  # 1 hour

# Prompt Templates
PROMPTS = {
    'youtube_qa': """You are a helpful assistant answering questions about a YouTube video.
Based on the following transcript context, answer the user's question accurately and concisely.

Context:
{context}

Question: {question}

Answer:""",
    
    'eda_code_generation': """You are a Python data analyst. Generate complete Python code for exploratory data analysis (EDA).

Dataset Info:
- Columns: {columns}
- Shape: {shape}
- Data types: {dtypes}
- Missing values: {missing}

Requirements:
1. Load data and perform cleaning
2. Handle missing values appropriately
3. Generate 4 visualizations:
   - Histogram for numerical columns
   - Scatter plot for correlation
   - Heatmap for correlation matrix
   - Bar chart for categorical data
4. Provide statistical summaries
5. Use plotly for interactive charts

Generate complete, executable Python code that:
- Imports all necessary libraries
- Loads the CSV file from '{file_path}'
- Performs all analysis
- Saves figures to a dictionary called 'figures' with keys: 'histogram', 'scatter', 'heatmap', 'bar'

Code:""",
    
    'data_chat': """You are a helpful data analyst assistant.
Based on the following dataset information, answer the user's question.

Dataset Summary:
{dataset_summary}

User Question: {question}

Provide insights, recommendations, and relevant analysis. Be specific and actionable.

Answer:""",
}
