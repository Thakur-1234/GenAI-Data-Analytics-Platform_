"""
Validation utilities for input data and file handling
"""
import os
from pathlib import Path
from config.settings import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB


def validate_file_upload(file_obj) -> tuple[bool, str]:
    """
    Validate uploaded file
    
    Args:
        file_obj: Streamlit UploadedFile object
        
    Returns:
        tuple: (is_valid, message)
    """
    if file_obj is None:
        return False, "No file selected"
    
    # Check file extension
    file_ext = Path(file_obj.name).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check file size
    file_size_mb = len(file_obj.getvalue()) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        return False, f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
    
    return True, "File valid"


def validate_youtube_url(url: str) -> tuple[bool, str]:
    """
    Validate YouTube URL
    
    Args:
        url: YouTube URL
        
    Returns:
        tuple: (is_valid, message)
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string"
    
    url = url.strip()
    
    # Check for common YouTube URL patterns
    youtube_patterns = [
        'youtube.com',
        'youtu.be',
        'youtube.co'
    ]
    
    is_valid = any(pattern in url.lower() for pattern in youtube_patterns)
    
    if not is_valid:
        return False, "Invalid YouTube URL"
    
    return True, "URL valid"


def validate_api_key(api_key: str) -> tuple[bool, str]:
    """
    Validate API key format (basic check)
    
    Args:
        api_key: API key string
        
    Returns:
        tuple: (is_valid, message)
    """
    if not api_key or not isinstance(api_key, str):
        return False, "API key must be a non-empty string"
    
    api_key = api_key.strip()
    
    if len(api_key) < 10:
        return False, "API key seems too short"
    
    return True, "API key format valid"


def validate_query(query: str, min_length: int = 3, max_length: int = 1000) -> tuple[bool, str]:
    """
    Validate user query
    
    Args:
        query: User query string
        min_length: Minimum query length
        max_length: Maximum query length
        
    Returns:
        tuple: (is_valid, message)
    """
    if not query or not isinstance(query, str):
        return False, "Query must be a non-empty string"
    
    query = query.strip()
    
    if len(query) < min_length:
        return False, f"Query too short. Minimum {min_length} characters"
    
    if len(query) > max_length:
        return False, f"Query too long. Maximum {max_length} characters"
    
    return True, "Query valid"
