"""
Sidebar component for navigation and settings
"""
import streamlit as st
from utils.validators import validate_api_key


def render_sidebar():
    """Render sidebar with navigation and settings"""
    with st.sidebar:
        # st.image(None)  # Placeholder for logo
        st.title("🤖 GenAI Data Assistant")
        st.divider()
        
        # Navigation
        st.subheader("📍 Navigation")
        page = st.radio(
            "Select a feature",
            options=[
                "🏠 Home",
                "🎥 YouTube Q&A",
                "📊 Upload Dataset",
                "💬 Chat with Data",
                "⚙️ Settings"
            ],
            label_visibility="collapsed"
        )
        
        st.divider()
        
        # API Key Configuration
        st.subheader("🔑 API Configuration")
        
        with st.expander("Groq API Key", expanded=False):
            api_key = st.text_input(
                "Enter your Groq API key",
                type="password",
                key="api_key_input"
            )
            
            if api_key:
                is_valid, msg = validate_api_key(api_key)
                
                if is_valid:
                    st.session_state.groq_api_key = api_key
                    st.success("✅ API Key configured")
                else:
                    st.warning(f"⚠️ {msg}")
            
            if 'groq_api_key' in st.session_state:
                st.info("✓ API Key is set (hidden)")
            else:
                st.warning("⚠️ API Key not configured")
            
            st.markdown(
                "[Get Groq API Key](https://console.groq.com/keys)",
                unsafe_allow_html=True
            )
        
        st.divider()
        
        # Quick Stats
        if 'data_chat' in st.session_state:
            stats = st.session_state.data_chat.get_statistics()
            if stats:
                st.subheader("📈 Data Stats")
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Rows", stats.get('rows', 0))
                    st.metric("Columns", stats.get('columns', 0))
                with col2:
                    st.metric("Memory", f"{stats.get('memory_mb', 0):.1f}MB")
                    st.metric("Missing", stats.get('missing_values', 0))
        
        st.divider()
        
        # About
        st.subheader("ℹ️ About")
        st.markdown(
            """
            **GenAI Multi-Modal Data Assistant**
            
            - YouTube Q&A with RAG
            - Auto EDA generation
            - Interactive data chat
            - Powered by Groq LLM
            
            [GitHub](https://github.com) | [Docs](https://docs.groq.com)
            """
        )
    
    return page


def render_api_status():
    """Render API status indicator"""
    if 'groq_api_key' in st.session_state:
        st.success("✅ Groq API Connected")
        return True
    else:
        st.warning("⚠️ Configure Groq API in sidebar to get started")
        return False
