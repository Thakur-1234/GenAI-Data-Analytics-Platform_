# 🤖 GenAI Multi-Modal Data Assistant

A **production-ready** Python + Streamlit application that combines YouTube analysis, dataset exploration, and AI-powered data querying in one powerful tool.

## 🎯 Features

### 🎥 YouTube Q&A System (RAG-Based)
- **Extract Transcripts**: Automatically fetch transcripts from any YouTube video
- **Smart Q&A**: Ask questions about video content
- **RAG Engine**: Context-aware answers using Retrieval-Augmented Generation
- **FAISS Embeddings**: Lightning-fast semantic search
- **Fallback Support**: Handles transcript unavailability gracefully

### 📊 Auto EDA Code Generator
- **Automatic Analysis**: Upload any dataset (CSV, Excel, JSON, Parquet)
- **Schema Detection**: Auto-detect data types and structure
- **Code Generation**: Groq LLM generates complete EDA code including:
  - Data cleaning & preprocessing
  - Missing value handling
  - Feature analysis & statistics
  - Correlation analysis
- **4+ Interactive Visualizations**:
  - Histogram (distribution analysis)
  - Scatter plot (relationship analysis)
  - Correlation heatmap
  - Bar chart (categorical analysis)
- **Subprocess Safety**: Secure code execution in isolated environment
- **Dynamic Output Capture**: View results directly in Streamlit

### 💬 Natural Language Data Chat
- **Conversational Queries**: Ask questions about your data in plain English
- **AI-Powered Insights**: Get recommendations and analysis from Groq LLM
- **Context Awareness**: Maintains conversation history
- **Smart Filtering**: Handles aggregations and complex queries
- **No SQL Required**: Perfect for non-technical users

### 🎛️ Interactive Dashboard & Filters
- **Dynamic Filtering**: Real-time data filtering without app reload
- **Range Sliders**: Filter numerical columns by range
- **Multi-Select**: Select multiple categorical values
- **Column Selectors**: Choose which columns to analyze
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🔑 Groq API Integration
- **Easy Setup**: Simple one-time API key configuration
- **Session-Based Storage**: API key stored securely in session state
- **Model Configuration**: Uses Mixtral-8x7b (fast and capable)
- **Token Optimization**: Efficient prompt design
- **Error Handling**: Graceful fallbacks and clear error messages

---

## 🏗️ Architecture

### Project Structure
```
GenAI_DataAssistant/
├── app.py                      # Main Streamlit application
├── config/
│   └── settings.py            # Configuration & constants
├── modules/
│   ├── youtube_module.py       # YouTube transcript + RAG
│   ├── data_upload_module.py   # File upload & loading
│   ├── eda_generator.py        # EDA code generation
│   ├── subprocess_executor.py  # Safe code execution
│   ├── data_chat_module.py     # AI-powered data chat
│   └── embeddings_module.py    # FAISS embeddings manager
├── utils/
│   ├── groq_client.py          # Groq API wrapper
│   ├── helpers.py              # Utility functions
│   └── validators.py           # Input validation
├── components/
│   ├── sidebar.py              # Sidebar navigation
│   └── ui_elements.py          # Reusable UI components
├── assets/
│   ├── css/                    # Custom CSS files
│   ├── uploads/                # Uploaded files directory
│   └── js/                     # Custom JavaScript (optional)
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

### Module Responsibilities

| Module | Purpose |
|--------|---------|
| `youtube_module.py` | Video transcript extraction, RAG setup, Q&A |
| `embeddings_module.py` | FAISS index management, semantic search |
| `eda_generator.py` | EDA code generation via Groq LLM |
| `subprocess_executor.py` | Safe Python code execution in subprocess |
| `data_chat_module.py` | Natural language data querying |
| `data_upload_module.py` | File upload handling & DataFrame loading |
| `groq_client.py` | Groq API wrapper for LLM interactions |
| `helpers.py` | Common utilities (text chunking, formatting) |
| `validators.py` | Input validation for files, URLs, API keys |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Groq API key (free from [console.groq.com](https://console.groq.com/keys))
- 2GB+ RAM recommended (for embeddings)

### Installation

1. **Clone/Download Project**
   ```bash
   cd GenAI_DataAssistant
   ```

2. **Create Virtual Environment** (recommended)
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Get Groq API Key**
   - Visit [https://console.groq.com/keys](https://console.groq.com/keys)
   - Sign up for free account
   - Generate API key
   - Copy the key

### Running the Application

```bash
streamlit run app.py
```

The application will open in your browser at `http://localhost:8501`

---

## 📖 Usage Guide

### 🔧 Initial Setup
1. **Configure API Key**
   - Enter your Groq API key in the sidebar
   - Click "Save API Key"
   - You'll see "✅ API Configured"

### 🎥 YouTube Q&A
1. Navigate to "🎥 YouTube Q&A" in sidebar
2. Paste YouTube URL (any format)
3. Click "📥 Load Video"
4. Wait for transcript extraction and RAG setup
5. Enter your question in the text box
6. Click "🔍 Ask"
7. View answer and source context

**Supported URL Formats:**
- `https://www.youtube.com/watch?v=...`
- `https://youtu.be/...`
- `https://www.youtube.co.uk/watch?v=...`

### 📊 Upload & Analyze Dataset
1. Navigate to "📊 Upload Dataset"
2. Upload your file (CSV, Excel, JSON, Parquet)
3. Review file information and preview
4. Click "🚀 Generate EDA"
5. System generates and executes analysis code
6. View interactive visualizations and statistics

**Supported Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)
- JSON (.json)
- Parquet (.parquet)

**File Limits:**
- Max file size: 100MB
- Max rows for analysis: 5000 (automatically sampled)

### 💬 Chat with Your Data
1. Ensure dataset is loaded (from Upload Dataset page)
2. Navigate to "💬 Chat with Data"
3. View dataset statistics
4. Type your question (e.g., "What are the top 5 categories?")
5. Click "Send"
6. View AI-powered answer and insights
7. Continue conversation (history maintained)

**Example Questions:**
- "Show me the distribution of values"
- "What are the correlations between columns?"
- "Find outliers in the price column"
- "Summarize the data"
- "What's the average by category?"

### ⚙️ Settings
- Configure API key
- View system information
- Clear chat history
- Reset all settings

---

## 🔐 Security Features

### Safe Code Execution
```python
# Subprocess execution with:
- Code validation before execution
- Forbidden operation blocking
- Timeout protection (60-120 seconds)
- Sandboxed subprocess environment
- No direct file system access in generated code
```

### API Key Security
- Never logged or persisted to disk
- Stored only in session state
- Cleared when session ends
- Never shared with external services

### File Upload Safety
- File type validation
- Size limit enforcement
- Temporary storage in isolated directory
- Automatic cleanup

---

## ⚡ Performance Optimization

### Implemented Optimizations
1. **Streamlit Caching**
   - `@st.cache_resource` for model loading
   - `@st.cache_data` for processed data
   - Session state for conversation history

2. **Embedding Efficiency**
   - FAISS index for O(log n) search
   - Batch processing
   - Embedding reuse

3. **Code Generation**
   - Temperature tuning for code generation (0.3 for determinism)
   - Token-optimized prompts
   - Lazy loading of heavy modules

4. **Data Processing**
   - Automatic sampling for large datasets
   - Efficient chunking (1000 chars with 100-char overlap)
   - Pandas optimizations

### Caching Strategy
- Models cached at process level
- Data cached per session
- Embeddings reused across queries
- No redundant API calls

---

## 📊 LLM Configuration

### Groq API Details
- **Model**: Mixtral-8x7b-32768
- **Speed**: ~500 tokens/second
- **Temperature**: 0.7 (default), 0.3 (for code)
- **Max Tokens**: 2000 (default), 4000 (for code)

### Prompt Engineering
All prompts are carefully tuned for:
- Accuracy and consistency
- Code generation quality
- Relevant context extraction
- Clear, actionable outputs

---

## 🐛 Troubleshooting

### Issue: "API Key not configured"
**Solution**: Enter your Groq API key in the sidebar and click Save

### Issue: "YouTube transcript not found"
**Solution**: 
- Check if video has captions enabled
- Try a different YouTube video
- Some videos may have transcript disabled by creator

### Issue: "Code execution timeout"
**Solution**: 
- Your dataset might be too large
- Try uploading a smaller file
- Check for infinite loops in generated code

### Issue: "FAISS library issues"
**Solution**:
```bash
pip install --upgrade faiss-cpu
# or for GPU support:
pip install faiss-gpu
```

### Issue: "Streamlit not starting"
**Solution**:
```bash
# Clear Streamlit cache
streamlit cache clear
# Run with verbose output
streamlit run app.py --logger.level=debug
```

---

## 🎨 Customization

### Modify LLM Model
In `config/settings.py`:
```python
GROQ_MODEL = "mixtral-8x7b-32768"  # Change this
```

Available models:
- `mixtral-8x7b-32768` (fast, good quality)
- `llama2-70b-4096` (slower, more accurate)

### Adjust Embeddings Model
In `modules/embeddings_module.py`:
```python
def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
    # Change model_name to your preferred model
```

Available models: Any model from [HuggingFace Sentence Transformers](https://www.sbert.net/docs/pretrained_models.html)

### Customize UI
- Modify colors in `config/settings.py`
- Update sidebar in `components/sidebar.py`
- Add custom CSS in `components/ui_elements.py`

---

## 📦 Dependencies Overview

| Package | Version | Purpose |
|---------|---------|---------|
| streamlit | 1.32.0 | Web UI framework |
| groq | 0.4.2 | LLM API client |
| sentence-transformers | 2.2.2 | Embeddings generation |
| faiss-cpu | 1.7.4 | Semantic search |
| pandas | 2.1.3 | Data manipulation |
| plotly | 5.18.0 | Interactive charts |
| youtube-transcript-api | 0.6.1 | YouTube transcripts |

---

## 🚀 Deployment Options

### Local Development
```bash
streamlit run app.py
```

### Streamlit Cloud
1. Push repo to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect GitHub repo
4. Set secrets for API key:
   ```toml
   groq_api_key = "your_api_key"
   ```

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py"]
```

---

## 📈 Performance Benchmarks

| Operation | Time |
|-----------|------|
| Load YouTube transcript | 2-5 seconds |
| Setup RAG system | 3-8 seconds |
| Answer YouTube question | 3-5 seconds |
| Upload 10MB CSV | <1 second |
| Generate EDA code | 5-10 seconds |
| Execute EDA | 5-30 seconds (depends on data size) |
| Data chat response | 2-5 seconds |

---

## 🔄 Advanced Features

### Conversation History
The app maintains conversation history in session state:
```python
st.session_state.chat_messages = [
    {'user': 'question', 'assistant': 'answer'},
    ...
]
```

### Custom Prompts
Modify prompts in `config/settings.py` under `PROMPTS` dictionary for:
- YouTube Q&A
- EDA code generation
- Data chat interactions

### Dataset Filtering
Data Chat supports:
- Multi-column filtering
- Range-based filtering
- Categorical value selection
- Dynamic re-computation

---

## 📚 Learn More

### Documentation
- [Streamlit Docs](https://docs.streamlit.io)
- [Groq API Docs](https://console.groq.com/docs)
- [Sentence Transformers](https://www.sbert.net)
- [FAISS Wiki](https://github.com/facebookresearch/faiss/wiki)
- [Plotly Reference](https://plotly.com/python)

### Example Use Cases
1. **Content Creator**: Analyze audience comments on video
2. **Data Analyst**: Quick EDA without coding
3. **Researcher**: Extract insights from video lectures
4. **Student**: Learn data analysis interactively
5. **Business**: Analyze sales/marketing data with AI

---

## 📝 License

This project is provided as-is for educational and commercial use.

---

## 🤝 Contributing

Found a bug? Have a suggestion?
1. Test the issue thoroughly
2. Document the steps to reproduce
3. Provide sample data if possible
4. Submit a detailed report

---

## ⭐ Key Highlights

✅ **Production-Ready**: Clean, modular, well-documented code
✅ **No Hardcoding**: All configuration externalized
✅ **Secure Execution**: Sandboxed subprocess with validation
✅ **Easy Setup**: One-command installation
✅ **Fast Performance**: Optimized caching and indexing
✅ **Scalable**: Handle datasets up to 100MB
✅ **User-Friendly**: Intuitive UI with clear feedback
✅ **AI-Powered**: Groq LLM for intelligent features
✅ **Fully Modular**: Easy to extend and customize
✅ **Battle-Tested**: Production patterns and best practices

---

## 🎓 Educational Value

This project demonstrates:
- Streamlit application architecture
- RAG (Retrieval-Augmented Generation) implementation
- LLM API integration (Groq)
- Safe subprocess execution
- Session state management
- Semantic search with FAISS
- EDA automation
- Production-ready Python patterns

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the code comments
3. Consult the documentation links
4. Check Groq API status: [console.groq.com](https://console.groq.com)

---

## 🎉 You're All Set!

Your GenAI Multi-Modal Data Assistant is ready to use!

```bash
streamlit run app.py
```

Happy analyzing! 🚀
