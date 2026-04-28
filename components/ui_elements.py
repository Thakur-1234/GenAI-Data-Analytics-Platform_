"""
UI components and utilities
"""
import streamlit as st
import plotly.graph_objects as go
from typing import Optional, List


def render_header(title: str, description: str = ""):
    """
    Render page header
    
    Args:
        title: Page title
        description: Optional description
    """
    st.title(title)
    if description:
        st.markdown(description)
    st.divider()


def render_loading_state(message: str = "Loading..."):
    """Render loading state"""
    with st.spinner(message):
        pass


def render_error(message: str):
    """Render error message"""
    st.error(f"❌ {message}")


def render_success(message: str):
    """Render success message"""
    st.success(f"✅ {message}")


def render_info(message: str):
    """Render info message"""
    st.info(f"ℹ️ {message}")


def render_warning(message: str):
    """Render warning message"""
    st.warning(f"⚠️ {message}")


def render_code_block(code: str, language: str = "python"):
    """
    Render code block
    
    Args:
        code: Code content
        language: Programming language
    """
    st.code(code, language=language)


def render_tabs(tabs_dict: dict):
    """
    Render tabs UI
    
    Args:
        tabs_dict: Dictionary with tab_name: content pairs
    """
    tabs = st.tabs(list(tabs_dict.keys()))
    for tab, (tab_name, content) in zip(tabs, tabs_dict.items()):
        with tab:
            content()


def render_metrics(metrics: dict):
    """
    Render metrics in columns
    
    Args:
        metrics: Dictionary with metric_name: value pairs
    """
    cols = st.columns(len(metrics))
    for col, (name, value) in zip(cols, metrics.items()):
        with col:
            st.metric(name, value)


def render_dataframe_preview(df, max_rows: int = 10):
    """
    Render DataFrame preview
    
    Args:
        df: Pandas DataFrame
        max_rows: Maximum rows to display
    """
    st.subheader("📋 Data Preview")
    st.dataframe(df.head(max_rows), use_container_width=True)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Rows", len(df))
    with col2:
        st.metric("Columns", len(df.columns))
    with col3:
        st.metric("Missing Values", df.isnull().sum().sum())


def render_chat_interface():
    """Render chat-like interface"""
    if 'chat_messages' not in st.session_state:
        st.session_state.chat_messages = []


def render_plotly_chart(fig, key: Optional[str] = None, use_container_width: bool = True):
    """
    Render Plotly chart
    
    Args:
        fig: Plotly figure
        key: Optional key for state management
        use_container_width: Whether to use full width
    """
    if fig:
        st.plotly_chart(fig, key=key, use_container_width=use_container_width)


def render_filter_controls(columns: List[str], df=None):
    """
    Render filter controls for data
    
    Args:
        columns: List of column names
        df: Optional DataFrame for value extraction
        
    Returns:
        Dictionary with selected filters
    """
    filters = {}
    
    cols = st.columns(len(columns) if len(columns) <= 3 else 3)
    
    for idx, col_name in enumerate(columns[:3]):
        with cols[idx % len(cols)]:
            if df is not None and col_name in df.columns:
                dtype = df[col_name].dtype
                
                if dtype == 'object':
                    unique_vals = df[col_name].unique().tolist()
                    filters[col_name] = st.multiselect(
                        f"Filter: {col_name}",
                        options=unique_vals,
                        default=unique_vals[:3] if len(unique_vals) > 3 else unique_vals
                    )
                elif dtype in ['int64', 'float64']:
                    min_val, max_val = df[col_name].min(), df[col_name].max()
                    filters[col_name] = st.slider(
                        f"Filter: {col_name}",
                        min_value=float(min_val),
                        max_value=float(max_val),
                        value=(float(min_val), float(max_val))
                    )
    
    return filters


def render_transcript_display(transcript: str, max_chars: int = 5000):
    """
    Render transcript with truncation
    
    Args:
        transcript: Full transcript text
        max_chars: Maximum characters to display
    """
    st.subheader("📄 Transcript Preview")
    
    if len(transcript) > max_chars:
        with st.expander(f"View full transcript ({len(transcript)} characters)"):
            st.text_area("", transcript, height=300, disabled=True)
        st.text_area("", transcript[:max_chars] + "...", height=200, disabled=True)
    else:
        st.text_area("", transcript, height=300, disabled=True)


def render_file_info(file_info: dict):
    """
    Render file information panel
    
    Args:
        file_info: Dictionary with file information
    """
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric("Rows", file_info.get('rows', 0))
        st.metric("Numeric Columns", file_info.get('numeric_columns', 0))
        st.metric("Memory Usage (MB)", f"{file_info.get('memory_mb', 0):.2f}")
    
    with col2:
        st.metric("Columns", file_info.get('columns', 0))
        st.metric("Categorical Columns", file_info.get('categorical_columns', 0))
        st.metric("Duplicate Rows", file_info.get('duplicates', 0))
    
    if file_info.get('missing_values'):
        st.subheader("Missing Values by Column")
        missing_df = st.dataframe(
            {
                'Column': list(file_info['missing_values'].keys()),
                'Missing Count': list(file_info['missing_values'].values())
            },
            use_container_width=True
        )
