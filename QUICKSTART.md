# 🚀 Quick Start Guide for GenAI Data Assistant

## 5-Minute Setup

### Step 1: Install Python (if not already installed)
- Download from [python.org](https://www.python.org/downloads/)
- Python 3.8 or higher required
- Verify installation:
  ```
  python --version
  ```

### Step 2: Clone/Download Project
```bash
# Navigate to your desired directory
cd path/to/projects

# Clone or extract the GenAI_DataAssistant folder
```

### Step 3: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 5: Get Groq API Key
1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Create a free account (if needed)
3. Click "Create API Key"
4. Copy the key to clipboard

### Step 6: Run Application
```bash
streamlit run app.py
```

The app will open automatically in your browser at `http://localhost:8501`

### Step 7: Configure API Key
1. In the sidebar, click "Settings" or expand "Groq API Key"
2. Paste your API key
3. Click "Save API Key"
4. See "✅ API Configured" message

## ✅ You're Ready!

Choose a feature from the sidebar:
- 🎥 **YouTube Q&A**: Analyze YouTube videos
- 📊 **Upload Dataset**: Generate EDA automatically
- 💬 **Chat with Data**: Ask questions about your data
- ⚙️ **Settings**: Configure and manage app

---

## Troubleshooting Installation

### Issue: "python: command not found"
**Solution**: Python not installed or not in PATH
- Download Python from [python.org](https://www.python.org/)
- During installation, check "Add Python to PATH"
- Restart terminal after installation

### Issue: "pip: command not found"
**Solution**: Usually comes with Python, but try:
```bash
python -m pip --version
python -m pip install -r requirements.txt
```

### Issue: "Module not found" errors
**Solution**: Make sure virtual environment is activated
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### Issue: "streamlit: command not found"
**Solution**: Reinstall dependencies
```bash
pip install streamlit
```

### Issue: Import errors related to "faiss"
**Solution**: Install with specific version
```bash
pip install faiss-cpu==1.7.4
```

---

## Next Steps

1. **Explore Features**: Try each feature with sample data
2. **Read README.md**: Full documentation
3. **Check Code**: Review modular architecture
4. **Customize**: Modify prompts, models, or UI
5. **Deploy**: Use Streamlit Cloud or Docker

---

## Common Commands

```bash
# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (macOS/Linux)
source venv/bin/activate

# Run application
streamlit run app.py

# Deactivate virtual environment
deactivate

# Install/upgrade dependencies
pip install -r requirements.txt --upgrade

# Clear Streamlit cache
streamlit cache clear

# Run with debug logging
streamlit run app.py --logger.level=debug
```

---

## Tips for Best Experience

✅ Use datasets with 100-100,000 rows for best performance
✅ YouTube videos with captions enabled work best
✅ Keep API key private - never share or commit to version control
✅ Use Chrome or Firefox for best UI experience
✅ For large datasets, the system automatically samples to 5000 rows

---

## Help & Support

- **Groq API Issues**: Check [console.groq.com](https://console.groq.com) status
- **Streamlit Issues**: See [docs.streamlit.io](https://docs.streamlit.io)
- **YouTube Issues**: Ensure video has captions enabled
- **Code Issues**: Check error messages in terminal

---

Happy data analyzing! 🎉
