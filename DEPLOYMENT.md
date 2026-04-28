# 🚀 Deployment Guide for GenAI Data Assistant

This guide covers multiple deployment options for your production application.

---

## 🌐 Deployment Options

### 1. **Streamlit Cloud (Recommended - Easiest)**

**Pros**: 
- Free tier available
- Zero configuration
- Auto-deploy from GitHub
- Easy secret management

**Steps**:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Streamlit Cloud Account**
   - Visit [share.streamlit.io](https://share.streamlit.io)
   - Sign in with GitHub

3. **Deploy App**
   - Click "New app"
   - Select your repository
   - Select branch (main)
   - Set main file path: `app.py`
   - Click "Deploy"

4. **Add Secrets**
   - Go to app settings (gear icon)
   - Click "Secrets"
   - Add your secrets:
   ```toml
   groq_api_key = "gsk_xxxxxxxxxxxxx"
   ```

5. **App is Live!**
   - Your app will be at `https://your-username-projectname.streamlit.app`

---

### 2. **Docker Deployment**

**Best for**: Production, scalability, containerized environments

**Prerequisites**: Docker installed

**Steps**:

1. **Create Dockerfile**
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       build-essential \
       && rm -rf /var/lib/apt/lists/*
   
   # Copy files
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   
   # Set environment
   ENV GROQ_API_KEY=""
   
   # Expose port
   EXPOSE 8501
   
   # Health check
   HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health || exit 1
   
   # Run app
   CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
   ```

2. **Create .dockerignore**
   ```
   __pycache__
   .git
   .gitignore
   *.pyc
   venv/
   .env
   .streamlit/
   assets/uploads/*
   *.log
   ```

3. **Build Image**
   ```bash
   docker build -t genai-data-assistant:latest .
   ```

4. **Run Container**
   ```bash
   docker run -p 8501:8501 \
     -e GROQ_API_KEY="your_api_key_here" \
     genai-data-assistant:latest
   ```

5. **Access Application**
   - Open `http://localhost:8501`

---

### 3. **Docker Compose (Multi-Service)**

If you want to add PostgreSQL, Redis, etc.:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8501:8501"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - STREAMLIT_SERVER_PORT=8501
      - STREAMLIT_SERVER_ADDRESS=0.0.0.0
    volumes:
      - ./assets/uploads:/app/assets/uploads
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  uploads:
```

Run with:
```bash
docker-compose up
```

---

### 4. **AWS Elastic Beanstalk**

**Best for**: AWS ecosystem, scalability

**Steps**:

1. **Create requirements-eb.txt** (add WSGI server)
   ```
   -r requirements.txt
   streamlit==1.32.0
   ```

2. **Create .ebextensions/streamlit.config**
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:python:
       WSGIPath: app:app
   ```

3. **Deploy**
   ```bash
   eb init -p python-3.11 genai-app --region us-east-1
   eb create genai-env
   eb deploy
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv GROQ_API_KEY=your_key_here
   eb open
   ```

---

### 5. **Heroku Deployment**

**Steps**:

1. **Create Procfile**
   ```
   web: streamlit run app.py --server.port=$PORT
   ```

2. **Create runtime.txt**
   ```
   python-3.11.0
   ```

3. **Deploy**
   ```bash
   heroku create genai-data-assistant
   git push heroku main
   ```

4. **Set Secrets**
   ```bash
   heroku config:set GROQ_API_KEY="your_api_key_here"
   heroku open
   ```

---

### 6. **DigitalOcean App Platform**

**Best for**: Simplicity, affordable

**Steps**:

1. **Push to GitHub**

2. **Connect to DigitalOcean**
   - Create account at [digitalocean.com](https://digitalocean.com)
   - Create new App
   - Connect GitHub repository
   - Select branch

3. **Configure**
   - Build command: `pip install -r requirements.txt`
   - Run command: `streamlit run app.py --server.port=8080`
   - Port: 8080

4. **Add Environment Variables**
   - GROQ_API_KEY: your_api_key

5. **Deploy**
   - Click "Deploy"

---

### 7. **Google Cloud Run**

**Best for**: Serverless, pay-per-use

**Steps**:

1. **Install Google Cloud CLI**
   ```bash
   # Download from https://cloud.google.com/sdk/docs/install
   gcloud init
   gcloud auth login
   ```

2. **Deploy**
   ```bash
   gcloud run deploy genai-assistant \
     --source . \
     --platform managed \
     --region us-central1 \
     --memory 2Gi \
     --timeout 3600 \
     --allow-unauthenticated \
     --set-env-vars GROQ_API_KEY="your_api_key"
   ```

3. **Access URL**
   ```
   https://genai-assistant-xxxxx.run.app
   ```

---

### 8. **PythonAnywhere**

**Best for**: Simplicity, no Docker needed

**Steps**:

1. **Create Account** at [pythonanywhere.com](https://pythonanywhere.com)

2. **Upload Files**
   - Use "Files" tab
   - Upload your project

3. **Create Web App**
   - Click "Web" → "Add a new web app"
   - Choose "Streamlit" (or manual)

4. **Configure**
   - Set working directory
   - Install requirements via bash console:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run**
   - Streamlit app will run on pythonanywhere domain

---

## 📋 Pre-Deployment Checklist

- [ ] All code committed to Git
- [ ] No hardcoded API keys in code
- [ ] requirements.txt updated and tested
- [ ] Environment variables documented
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Database/storage connections tested
- [ ] Security headers configured
- [ ] Rate limiting considered
- [ ] Backup strategy planned

---

## 🔐 Security Best Practices

### API Key Management
```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GROQ_API_KEY')

if not api_key:
    raise ValueError("GROQ_API_KEY not set")
```

### Environment Variables
Never commit `.env` files. Always use:
- `.env.example` for reference
- `.gitignore` to exclude `.env`
- Platform-specific secrets management

### HTTPS Only
- Use HTTPS in production
- Enable SSL/TLS certificates
- Redirect HTTP to HTTPS

### Rate Limiting
Add to `streamlit_config.toml`:
```toml
[client]
maxUploadSize = 100
toolbarMode = "minimal"
```

### Input Validation
Already implemented in:
- `utils/validators.py`
- `modules/subprocess_executor.py`

---

## 📊 Monitoring & Logging

### Streamlit Metrics
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logger.info("Application started")
```

### Error Tracking
Consider services like:
- [Sentry](https://sentry.io)
- [Rollbar](https://rollbar.com)
- [DataDog](https://www.datadoghq.com)

---

## 📈 Performance Optimization for Production

### Caching Strategy
Already implemented:
- `@st.cache_resource` for models
- `@st.cache_data` for processed data
- Session state management

### CDN for Static Files
```python
# Serve assets from CDN
ASSET_URL = "https://cdn.example.com/assets"
```

### Load Balancing
For high traffic, use:
- Nginx as reverse proxy
- Multiple app instances
- Load balancer (AWS ELB, DigitalOcean LB)

---

## 💰 Cost Estimates

| Platform | Free Tier | Paid Starting |
|----------|-----------|---------------|
| Streamlit Cloud | Yes | $5/month |
| Docker (self-hosted) | Yes | $5-50/month |
| Heroku | No | $7/month |
| DigitalOcean | Partial | $5/month |
| AWS | 12 months free | $1+/month |
| Google Cloud Run | $2.50/month free | ~$0.24/hour |
| PythonAnywhere | Yes | $5/month |

---

## 🚨 Troubleshooting Deployment

### Issue: "Module not found" on deployment
**Solution**: Ensure all imports are in requirements.txt
```bash
pip freeze > requirements.txt
```

### Issue: API timeout on first load
**Solution**: Streamlit Cloud has cold starts, use prewarming

### Issue: Large file uploads fail
**Solution**: Increase upload limits in config:
```toml
[client]
maxUploadSize = 200
```

### Issue: Out of memory
**Solution**: 
- Reduce sample size
- Use streaming for large files
- Allocate more resources

---

## 📚 Additional Resources

- [Streamlit Deployment](https://docs.streamlit.io/deploy)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices)
- [Groq API Docs](https://console.groq.com/docs)
- [Security Best Practices](https://owasp.org/www-project-top-ten)

---

## 🎯 Recommended Deployment

For **most users**: **Streamlit Cloud**
- Easiest setup
- Free tier available
- Perfect for learning and prototyping
- Upgrade anytime

For **production**: **Docker + Cloud Provider**
- Maximum control
- Scalable
- Cost-effective
- Professional setup

---

## Need Help?

1. Check [Streamlit docs](https://docs.streamlit.io/deploy)
2. Review deployment provider documentation
3. Check application logs
4. Verify API key is set
5. Test locally first with `streamlit run app.py`

---

Happy deploying! 🚀
