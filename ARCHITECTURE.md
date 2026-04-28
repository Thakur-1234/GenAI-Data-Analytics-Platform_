# 🏗️ Architecture & Technical Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                       │
│                    (Streamlit Frontend)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Sidebar Nav │  │  YouTube QA  │  │ Data Upload  │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ Settings     │  │ Data Chat    │  │ Visualize    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Components Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  sidebar.py          UI Elements          helpers.py     │  │
│  │  - Navigation        - Metrics            - Chunking     │  │
│  │  - API Config        - Filters            - Formatting   │  │
│  │  - Status Display    - Chat Interface     - Validation   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                           │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │YouTube Module  │  │Data Chat Mod.  │  │EDA Generator     │  │
│  ├────────────────┤  ├────────────────┤  ├──────────────────┤  │
│  │ Transcript     │  │ Q&A Engine     │  │ Code Generation  │  │
│  │ RAG Setup      │  │ Context Mgmt   │  │ Code Execution   │  │
│  │ Question Match │  │ Insights       │  │ Visualization    │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │Embeddings Mgr    │  │Groq LLM Client   │  │Subprocess    │  │
│  ├──────────────────┤  ├──────────────────┤  │Executor      │  │
│  │ FAISS Index      │  │ Text Generation  │  ├──────────────┤  │
│  │ Semantic Search  │  │ Code Generation  │  │ Safe Exec    │  │
│  │ Chunk Storage    │  │ Chat Completion  │  │ Validation   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │Groq API      │  │YouTube API   │  │File Storage  │           │
│  │- Mixtral     │  │- Transcripts │  │- Local Disk  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### YouTube Q&A Flow
```
User Input URL
    ↓
Extract Video ID
    ↓
Fetch Transcript (youtube-transcript-api)
    ↓
Chunk Text (1000 chars, 100 overlap)
    ↓
Generate Embeddings (sentence-transformers)
    ↓
Add to FAISS Index
    ↓
[Ready for Questions]
    ↓
User Question
    ↓
Generate Question Embedding
    ↓
FAISS Semantic Search (top 5 matches)
    ↓
Prompt: Context + Question
    ↓
Groq LLM (Mixtral-8x7b)
    ↓
Return Answer + Source Context
```

### EDA Generation Flow
```
User Uploads File
    ↓
Validate File Type & Size
    ↓
Load into Pandas DataFrame
    ↓
Extract Schema Info
    ↓
Build Prompt with Dataset Info
    ↓
Groq LLM Generates EDA Code
    ↓
[Extract Python Code]
    ↓
Execute in Subprocess
    ↓
Capture Output & Visualizations
    ↓
Display in Streamlit
```

### Data Chat Flow
```
Dataset Loaded
    ↓
Generate Summary Statistics
    ↓
User Question
    ↓
Build Prompt (Summary + Question)
    ↓
Add Conversation History
    ↓
Groq LLM Response
    ↓
Extract Insights
    ↓
Add to Chat History
    ↓
Display Answer + Insights
```

---

## Module Dependencies

```
app.py (Main Entry Point)
  ├── components.sidebar
  │   └── utils.validators
  ├── components.ui_elements
  ├── modules.youtube_module
  │   ├── modules.embeddings_module
  │   └── utils.groq_client
  ├── modules.data_upload_module
  │   └── utils.validators
  ├── modules.eda_generator
  │   ├── utils.groq_client
  │   └── modules.subprocess_executor
  ├── modules.data_chat_module
  │   ├── utils.groq_client
  │   └── utils.helpers
  └── config.settings
```

---

## Class Diagram

```
┌─────────────────────────────────┐
│      GroqClient                 │
├─────────────────────────────────┤
│ - api_key: str                  │
│ - client: Groq                  │
├─────────────────────────────────┤
│ + generate_text()               │
│ + generate_code()               │
│ + chat_completion()             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   EmbeddingsManager             │
├─────────────────────────────────┤
│ - model_name: str               │
│ - index: FAISS                  │
│ - data: List[str]               │
├─────────────────────────────────┤
│ + add_texts()                   │
│ + search()                      │
│ + save()/load()                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│    YouTubeQASystem              │
├─────────────────────────────────┤
│ - embeddings_manager            │
│ - transcript_data: dict         │
├─────────────────────────────────┤
│ + get_transcript()              │
│ + setup_rag()                   │
│ + answer_question()             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│    DataChatModule               │
├─────────────────────────────────┤
│ - df: DataFrame                 │
│ - summary: str                  │
│ - conversation_history: list    │
├─────────────────────────────────┤
│ + set_dataframe()               │
│ + answer_question()             │
│ + get_statistics()              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│    EDAGenerator                 │
├─────────────────────────────────┤
│ (static methods)                │
├─────────────────────────────────┤
│ + generate_eda_code()           │
│ + execute_eda_code()            │
│ + get_dataset_info()            │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  SubprocessExecutor             │
├─────────────────────────────────┤
│ (static methods)                │
├─────────────────────────────────┤
│ + validate_code()               │
│ + execute_code()                │
│ + execute_with_context()        │
└─────────────────────────────────┘
```

---

## State Management

### Session State Variables
```python
{
    'groq_api_key': str,              # API key for Groq
    'groq_client': GroqClient,        # Cached Groq client
    'current_df': DataFrame,          # Current dataset
    'current_file_path': str,         # Path to uploaded file
    'youtube_system': YouTubeQASystem, # YouTube QA engine
    'youtube_transcript': str,        # Last loaded transcript
    'youtube_video_id': str,          # Last video ID
    'data_chat': DataChatModule,      # Data chat engine
    'chat_messages': list,            # Chat history
    'eda_generator': EDAGenerator,    # EDA generator
}
```

---

## Caching Strategy

### Streamlit Cache Resources (Process Level)
- `GroqClient` instance
- `EmbeddingsManager` models
- `SentenceTransformer` model
- FAISS index

### Streamlit Cache Data (Session Level)
- DataFrame loading results
- Text embeddings
- Generated visualizations
- Processed dataset summaries

### Session State (Manual)
- API key
- Conversation history
- Current dataset reference
- YouTube transcript data

---

## Performance Characteristics

### Time Complexity
| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Add embeddings | O(n) | n = number of chunks |
| Search (FAISS) | O(log n) | Approximate nearest neighbor |
| Generate embedding | O(m) | m = text length |
| LLM generation | O(1) | Constant API call |
| DataFrame load | O(n) | n = file size |

### Space Complexity
| Component | Complexity | Size |
|-----------|-----------|------|
| FAISS Index | O(n * d) | n=chunks, d=384 dims |
| Transcript store | O(n) | n = transcript length |
| DataFrame | O(n * m) | n=rows, m=columns |
| Embeddings cache | O(n * d) | Per-session |

---

## Security Architecture

```
User Input
    ↓
┌──────────────────────────────┐
│   Input Validation Layer      │
│ - URL validation              │
│ - File type/size validation   │
│ - API key validation          │
│ - Query length validation     │
└──────────────────────────────┘
    ↓
┌──────────────────────────────┐
│   Authentication Layer         │
│ - API key verification        │
│ - Session-based access        │
└──────────────────────────────┘
    ↓
┌──────────────────────────────┐
│   Authorization Layer          │
│ - Resource access control      │
│ - File read/write checks       │
└──────────────────────────────┘
    ↓
┌──────────────────────────────┐
│   Execution Layer              │
│ - Subprocess sandboxing        │
│ - Code validation              │
│ - Resource limits              │
└──────────────────────────────┘
    ↓
Secure Execution
```

---

## API Rate Limiting (Recommended)

```python
# Add to groq_client.py for production
from functools import wraps
import time

def rate_limit(calls_per_minute=30):
    min_interval = 60.0 / calls_per_minute
    last_called = [0.0]
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_called[0]
            wait_time = min_interval - elapsed
            
            if wait_time > 0:
                time.sleep(wait_time)
            
            result = func(*args, **kwargs)
            last_called[0] = time.time()
            return result
        
        return wrapper
    return decorator
```

---

## Error Handling Strategy

### Error Levels
```
USER ERRORS (Handled)
├── Invalid file format
├── Invalid YouTube URL
├── Invalid API key
└── Query too long

SYSTEM ERRORS (Logged & Reported)
├── API timeouts
├── File read errors
├── Embedding failures
└── Code execution errors

CRITICAL ERRORS (Stop Execution)
├── Out of memory
├── Missing dependencies
└── Configuration errors
```

---

## Scalability Considerations

### Current Limits
- Max file size: 100MB
- Max rows for analysis: 5000 (sampled)
- Concurrent users: Limited by Streamlit
- API rate: Groq limits

### Scaling Strategies
1. **Add caching layer** (Redis)
2. **Use job queue** (Celery)
3. **Horizontal scaling** (Docker Swarm/K8s)
4. **Database** (PostgreSQL for persistence)
5. **CDN** (For static assets)

---

## Testing Strategy

### Unit Tests
```python
# tests/test_validators.py
def test_validate_youtube_url():
    assert validate_youtube_url("https://youtube.com/watch?v=123")
    assert not validate_youtube_url("invalid")

# tests/test_helpers.py
def test_chunk_text():
    text = "A" * 5000
    chunks = chunk_text(text, 1000, 100)
    assert len(chunks) > 0
```

### Integration Tests
```python
# tests/test_youtube_module.py
def test_get_transcript():
    system = YouTubeQASystem()
    result = system.get_transcript("https://youtube.com/...")
    assert result['success']
```

---

## Monitoring & Observability

### Key Metrics
- API call count
- Average response time
- Error rate
- Cache hit rate
- User count

### Logging Strategy
```python
import logging

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)
```

---

## Future Enhancements

### Phase 2
- [ ] Database persistence (PostgreSQL)
- [ ] User authentication
- [ ] Multi-user collaboration
- [ ] Advanced analytics dashboard
- [ ] Export to PDF/Excel

### Phase 3
- [ ] Real-time collaborative editing
- [ ] Advanced visualization library
- [ ] ML model fine-tuning
- [ ] Data versioning
- [ ] Audit logging

### Phase 4
- [ ] Mobile app
- [ ] REST API
- [ ] Webhook support
- [ ] Plugin system
- [ ] Advanced security (OAuth2, SAML)

---

## Conclusion

The architecture is designed for:
✅ **Modularity**: Each component is independent
✅ **Scalability**: Can handle growth
✅ **Security**: Multiple validation layers
✅ **Performance**: Optimized with caching
✅ **Maintainability**: Clean code, well-documented
✅ **Extensibility**: Easy to add new features

Perfect for production deployment and future enhancements!
