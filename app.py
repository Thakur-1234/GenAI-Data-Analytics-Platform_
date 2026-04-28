"""
GenAI Multi-Modal Data Assistant - Main Application
Complete production-ready Streamlit application
"""
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path

# Configure Streamlit
st.set_page_config(
    page_title="GenAI Data Assistant",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Import modules
from components.sidebar import render_sidebar, render_api_status
from components.ui_elements import (
    render_header, render_error, render_success, render_warning,
    render_info, render_dataframe_preview, render_file_info,
    render_transcript_display, render_plotly_chart, render_filter_controls,
    render_metrics, render_tabs
)
from modules.youtube_module import initialize_youtube_system
from modules.data_upload_module import DataUploadModule
from modules.data_chat_module import initialize_data_chat
from modules.eda_generator import EDAGenerator
from utils.groq_client import get_groq_client
from config.settings import PROMPTS
from utils.helpers import chunk_text, get_dataframe_summary


# Initialize session state
def init_session_state():
    """Initialize all session state variables"""
    if 'groq_api_key' not in st.session_state:
        st.session_state.groq_api_key = None
    if 'groq_client' not in st.session_state:
        st.session_state.groq_client = None
    if 'current_df' not in st.session_state:
        st.session_state.current_df = None
    if 'current_file_path' not in st.session_state:
        st.session_state.current_file_path = None
    if 'chat_messages' not in st.session_state:
        st.session_state.chat_messages = []


# PAGE: Home
def page_home():
    """Render home page"""
    render_header(
        "🏠 Welcome to GenAI Data Assistant",
        "Your AI-powered companion for YouTube analysis, data exploration, and natural language data querying"
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### 🎯 Features
        
        #### 🎥 YouTube Q&A System
        - Extract transcripts from YouTube videos
        - Ask questions about video content
        - Get answers powered by RAG (Retrieval-Augmented Generation)
        
        #### 📊 Auto EDA Generation
        - Upload any dataset (CSV, Excel, JSON, Parquet)
        - Automatically generate exploratory analysis code
        - Create interactive visualizations with one click
        """)
    
    with col2:
        st.markdown("""
        #### 💬 Chat with Your Data
        - Ask natural language questions about your dataset
        - Get AI-powered insights and recommendations
        - Explore data without writing SQL or Python
        
        #### ⚙️ Easy Configuration
        - Simple API key setup
        - No complex installation required
        - Fully secure and local execution
        """)
    
    st.divider()
    
    # Quick start
    st.markdown("### 🚀 Quick Start")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        **Step 1: Configure API**
        1. Get your [Groq API key](https://console.groq.com/keys)
        2. Enter it in the sidebar
        3. Click confirm
        """)
    
    with col2:
        st.markdown("""
        **Step 2: Choose Feature**
        - 🎥 Analyze YouTube videos
        - 📊 Upload and analyze datasets
        - 💬 Chat with your data
        """)
    
    with col3:
        st.markdown("""
        **Step 3: Get Insights**
        - Ask questions
        - Explore visualizations
        - Export results
        """)
    
    # Status
    st.divider()
    st.markdown("### 📊 System Status")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if 'groq_api_key' in st.session_state and st.session_state.groq_api_key:
            st.success("✅ API Configured")
        else:
            st.warning("⚠️ API Not Configured")
    
    with col2:
        if st.session_state.current_df is not None:
            st.success(f"✅ Dataset Loaded ({len(st.session_state.current_df)} rows)")
        else:
            st.info("ℹ️ No dataset loaded")
    
    with col3:
        st.info("ℹ️ Ready to assist!")


# PAGE: YouTube Q&A
def page_youtube_qa():
    """Render YouTube Q&A page"""
    render_header(
        "🎥 YouTube Q&A System",
        "Extract transcripts and ask questions about YouTube videos using RAG"
    )
    
    if not render_api_status():
        return
    
    youtube_system = initialize_youtube_system()
    
    # Video URL input
    st.subheader("📹 Load YouTube Video")
    col1, col2 = st.columns([3, 1])
    
    with col1:
        youtube_url = st.text_input(
            "Enter YouTube URL",
            placeholder="https://www.youtube.com/watch?v=...",
            label_visibility="collapsed"
        )
    
    with col2:
        load_button = st.button("📥 Load Video", use_container_width=True)
    
    # Load transcript
    if load_button and youtube_url:
        with st.spinner("Extracting transcript..."):
            result = youtube_system.get_transcript(youtube_url)
            
            if result['success']:
                st.session_state.youtube_transcript = result['transcript']
                st.session_state.youtube_video_id = result['video_id']
                
                # Setup RAG
                with st.spinner("Setting up RAG system..."):
                    if youtube_system.setup_rag():
                        st.success("✅ Transcript loaded and RAG system ready!")
                        render_transcript_display(result['transcript'], max_chars=2000)
                    else:
                        render_error("Failed to setup RAG system")
            else:
                render_error(result['error'])
    
    # Q&A interface
    if 'youtube_transcript' in st.session_state:
        st.divider()
        st.subheader("❓ Ask Questions")
        
        col1, col2 = st.columns([4, 1])
        with col1:
            question = st.text_input(
                "Ask a question about the video:",
                placeholder="What is this video about?",
                label_visibility="collapsed"
            )
        
        with col2:
            ask_button = st.button("🔍 Ask", use_container_width=True)
        
        if ask_button and question:
            with st.spinner("Generating answer..."):
                response = youtube_system.answer_question(question)
                
                if response['success']:
                    st.success("✅ Answer generated")
                    
                    col1, col2 = st.columns([2, 1])
                    with col1:
                        st.markdown("### 💡 Answer")
                        st.markdown(response['answer'])
                    
                    with col2:
                        st.markdown("### 📚 Context")
                        for i, context in enumerate(response['context'], 1):
                            with st.expander(f"Source {i}"):
                                st.text(context[:500] + "...")
                else:
                    render_error(response['error'])


# PAGE: Upload Dataset
def page_upload_dataset():
    """Render data upload page"""
    render_header(
        "📊 Upload & Analyze Dataset",
        "Upload your dataset and auto-generate exploratory data analysis"
    )
    
    if not render_api_status():
        return
    
    upload_module = DataUploadModule()
    
    # File upload
    st.subheader("📁 Upload Data File")
    uploaded_file = st.file_uploader(
        "Choose a file (CSV, Excel, JSON, Parquet)",
        type=list(upload_module.SUPPORTED_FORMATS.keys()),
        help="Max 100MB"
    )
    
    if uploaded_file:
        # Save and load file
        with st.spinner("Processing file..."):
            success, msg, filepath = upload_module.save_uploaded_file(uploaded_file)
            
            if success:
                st.success(msg)
                
                # Load DataFrame
                success, msg, df = upload_module.load_dataframe(filepath)
                
                if success:
                    st.session_state.current_df = df
                    st.session_state.current_file_path = filepath
                    
                    # Display file info
                    file_info = upload_module.get_file_info(df)
                    render_file_info(file_info)
                    
                    # Data preview
                    render_dataframe_preview(df)
                    
                    st.divider()
                    
                    # EDA Generation
                    st.subheader("🔬 Generate EDA Code")
                    
                    col1, col2 = st.columns([3, 1])
                    with col1:
                        st.info("Click button to auto-generate exploratory data analysis code and visualizations")
                    with col2:
                        generate_eda_button = st.button("🚀 Generate EDA", use_container_width=True)
                    
                    if generate_eda_button:
                        with st.spinner("Generating EDA code using Groq..."):
                            eda_result = EDAGenerator.generate_eda_code(df, filepath)
                            
                            if eda_result['success']:
                                st.success("✅ EDA code generated!")
                                
                                # Display generated code
                                with st.expander("View Generated Code"):
                                    st.code(eda_result['code'], language='python')
                                
                                # Execute code
                                with st.spinner("Executing analysis code..."):
                                    exec_result = EDAGenerator.execute_eda_code(eda_result['code'], filepath)
                                    
                                    if exec_result['success']:
                                        st.success("✅ Analysis executed successfully!")
                                        st.info("Note: To view interactive charts, the generated code will create Plotly visualizations")
                                        
                                        # Display output
                                        if exec_result['stdout']:
                                            st.subheader("📊 Analysis Output")
                                            st.text(exec_result['stdout'])
                                    else:
                                        render_warning(f"Analysis completed with warnings:\n{exec_result['stderr']}")
                                        st.text_area("Output:", exec_result['stdout'], height=200)
                            else:
                                render_error(eda_result['error'])
                else:
                    render_error(msg)
            else:
                render_error(msg)
    else:
        st.info("👆 Upload a file to get started")


# PAGE: Data Chat
def page_data_chat():
    """Render data chat page"""
    render_header(
        "💬 Chat with Your Data",
        "Ask natural language questions about your dataset"
    )
    
    if not render_api_status():
        return
    
    if st.session_state.current_df is None:
        st.warning("📊 Please upload a dataset first in the 'Upload Dataset' section")
        return
    
    data_chat = initialize_data_chat()
    
    # Set dataframe if not already set
    if data_chat.df is None:
        data_chat.set_dataframe(st.session_state.current_df)
    
    # Display dataset info
    st.subheader("📈 Dataset Information")
    col1, col2, col3 = st.columns(3)
    
    stats = data_chat.get_statistics()
    with col1:
        st.metric("Rows", stats.get('rows', 0))
    with col2:
        st.metric("Columns", stats.get('columns', 0))
    with col3:
        st.metric("Memory (MB)", f"{stats.get('memory_mb', 0):.1f}")
    
    st.divider()
    
    # Chat interface
    st.subheader("💬 Ask Questions")
    
    # Display chat history
    if st.session_state.chat_messages:
        for msg in st.session_state.chat_messages:
            with st.chat_message("user"):
                st.write(msg['user'])
            with st.chat_message("assistant"):
                st.write(msg['assistant'])
    
    # Input
    col1, col2 = st.columns([4, 1])
    with col1:
        user_question = st.text_input(
            "Ask a question about your data:",
            placeholder="What are the top performing categories?",
            label_visibility="collapsed"
        )
    
    with col2:
        ask_button = st.button("Send", use_container_width=True)
    
    if ask_button and user_question:
        with st.spinner("Analyzing..."):
            response = data_chat.answer_question(user_question)
            
            if response['success']:
                # Display answer
                with st.chat_message("user"):
                    st.write(user_question)
                
                with st.chat_message("assistant"):
                    st.write(response['answer'])
                    
                    if response['insights']:
                        with st.expander("📌 Key Insights"):
                            for insight in response['insights']:
                                st.markdown(f"• {insight}")
                
                # Update chat history in session
                st.session_state.chat_messages.append({
                    'user': user_question,
                    'assistant': response['answer']
                })
            else:
                render_error(response['error'])


# PAGE: Settings
def page_settings():
    """Render settings page"""
    render_header(
        "⚙️ Settings & Configuration",
        "Configure your GenAI Data Assistant"
    )
    
    # API Configuration
    st.subheader("🔑 API Configuration")
    
    with st.expander("Groq API Setup", expanded=True):
        st.markdown("""
        1. Visit [Groq Console](https://console.groq.com/keys)
        2. Create or copy your API key
        3. Paste it below
        """)
        
        api_key = st.text_input(
            "Groq API Key",
            type="password",
            help="Your API key is secure and never stored on our servers"
        )
        
        if api_key and st.button("✅ Save API Key"):
            st.session_state.groq_api_key = api_key
            st.success("API key configured!")
    
    st.divider()
    
    # System Info
    st.subheader("ℹ️ System Information")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric("Python Version", "3.8+")
        st.metric("Streamlit Version", st.__version__)
    
    with col2:
        st.metric("API Status", "✅ Configured" if 'groq_api_key' in st.session_state else "⚠️ Not Configured")
        st.metric("Dataset Status", "✅ Loaded" if st.session_state.current_df is not None else "ⓘ Not Loaded")
    
    st.divider()
    
    # Cache Info
    st.subheader("💾 Cache & Storage")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🗑️ Clear Chat History"):
            st.session_state.chat_messages = []
            st.success("Chat history cleared!")
    
    with col2:
        if st.button("🔄 Reset All Settings"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.success("All settings reset!")
    
    st.divider()
    
    # Documentation
    st.subheader("📚 Documentation")
    
    with st.expander("Feature Guide"):
        st.markdown("""
        ### 🎥 YouTube Q&A
        - Paste any YouTube URL
        - System extracts transcript
        - Ask questions about video content
        - Powered by RAG for context-aware answers
        
        ### 📊 Dataset Analysis
        - Upload CSV, Excel, JSON, or Parquet files
        - Automatic schema analysis
        - AI-generated EDA code with 4+ visualizations
        - Interactive Plotly charts
        
        ### 💬 Data Chat
        - Natural language querying
        - No SQL/Python knowledge required
        - Get insights and recommendations
        - Chat history maintained
        """)


# Main Application
def main():
    """Main application entry point"""
    # Initialize session state
    init_session_state()
    
    # Render sidebar and get selected page
    page = render_sidebar()
    
    # Route to appropriate page
    if "🏠 Home" in page:
        page_home()
    elif "🎥 YouTube" in page:
        page_youtube_qa()
    elif "📊 Upload" in page:
        page_upload_dataset()
    elif "💬 Chat" in page:
        page_data_chat()
    elif "⚙️ Settings" in page:
        page_settings()
    else:
        page_home()


if __name__ == "__main__":
    main()
