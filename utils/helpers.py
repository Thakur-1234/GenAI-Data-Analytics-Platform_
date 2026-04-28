"""
Helper utilities for common operations
"""
import json
import pandas as pd
from pathlib import Path
from typing import Any, Dict, List


def safe_json_loads(json_str: str, default: Any = None) -> Any:
    """
    Safely parse JSON string
    
    Args:
        json_str: JSON string to parse
        default: Default value if parsing fails
        
    Returns:
        Parsed JSON or default value
    """
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping chunks
    
    Args:
        text: Text to chunk
        chunk_size: Size of each chunk
        overlap: Overlap between chunks
        
    Returns:
        List of text chunks
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    
    return chunks


def dataframe_to_dict(df: pd.DataFrame) -> Dict:
    """
    Convert DataFrame to dictionary summary
    
    Args:
        df: Pandas DataFrame
        
    Returns:
        Dictionary with DataFrame information
    """
    return {
        'shape': df.shape,
        'columns': df.columns.tolist(),
        'dtypes': df.dtypes.astype(str).to_dict(),
        'missing_values': df.isnull().sum().to_dict(),
        'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024**2,
        'head': df.head(5).to_dict('records')
    }


def get_dataframe_summary(df: pd.DataFrame) -> str:
    """
    Generate a text summary of DataFrame
    
    Args:
        df: Pandas DataFrame
        
    Returns:
        String summary
    """
    summary = f"""
Dataset Summary:
- Shape: {df.shape[0]} rows, {df.shape[1]} columns
- Columns: {', '.join(df.columns.tolist())}
- Data Types: {df.dtypes.to_dict()}
- Missing Values: {df.isnull().sum().to_dict()}
- Memory Usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB
- Numeric Columns: {df.select_dtypes(include=['number']).columns.tolist()}
- Categorical Columns: {df.select_dtypes(include=['object']).columns.tolist()}
"""
    return summary.strip()


def format_file_size(size_bytes: int) -> str:
    """
    Format bytes to human-readable size
    
    Args:
        size_bytes: Size in bytes
        
    Returns:
        Formatted size string
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} TB"


def safe_file_write(filepath: str, content: str) -> tuple[bool, str]:
    """
    Safely write content to file
    
    Args:
        filepath: Path to file
        content: Content to write
        
    Returns:
        tuple: (success, message)
    """
    try:
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, f"File saved successfully"
    except Exception as e:
        return False, f"Error writing file: {str(e)}"


def safe_file_read(filepath: str) -> tuple[bool, str, str]:
    """
    Safely read file content
    
    Args:
        filepath: Path to file
        
    Returns:
        tuple: (success, content, message)
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        return True, content, "File read successfully"
    except Exception as e:
        return False, "", f"Error reading file: {str(e)}"
