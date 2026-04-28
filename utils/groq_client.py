"""
Groq API client wrapper for LLM interactions
"""
import os
from typing import Optional
import streamlit as st

try:
    from groq import Groq
except ImportError:
    Groq = None


class GroqClient:
    """Wrapper for Groq API client"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Groq client
        
        Args:
            api_key: Groq API key (if None, uses session state)
        """
        self.api_key = api_key
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Groq client"""
        if Groq is None:
            raise ImportError("Groq library not installed. Install with: pip install groq")
        
        key = self.api_key
        if not key:
            if 'groq_api_key' in st.session_state:
                key = st.session_state.groq_api_key
            else:
                raise ValueError("No API key provided or stored in session")
        
        self.client = Groq(api_key=key)
    
    def set_api_key(self, api_key: str):
        """Update API key and reinitialize client"""
        self.api_key = api_key
        st.session_state.groq_api_key = api_key
        self._initialize_client()
    
    def generate_text(
        self,
        prompt: str,
        model: str = "mixtral-8x7b-32768",
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> dict:
        """
        Generate text using Groq API
        
        Args:
            prompt: Input prompt
            model: Model name
            temperature: Temperature for generation
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            message = self.client.chat.completions.create(
                messages=[
                    {"role": "user", "content": prompt}
                ],
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            return {
                'success': True,
                'content': message.choices[0].message.content,
                'tokens_used': message.usage.total_tokens,
                'model': model,
                'error': None
            }
        except Exception as e:
            return {
                'success': False,
                'content': None,
                'tokens_used': 0,
                'model': model,
                'error': str(e)
            }
    
    def generate_code(
        self,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> dict:
        """
        Generate Python code using Groq API
        
        Args:
            prompt: Code generation prompt
            temperature: Lower temperature for more deterministic code
            max_tokens: Maximum tokens
            
        Returns:
            Dictionary with code and metadata
        """
        return self.generate_text(
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    def chat_completion(
        self,
        messages: list,
        model: str = "mixtral-8x7b-32768",
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> dict:
        """
        Generate chat completion
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model name
            temperature: Temperature
            max_tokens: Maximum tokens
            
        Returns:
            Dictionary with response
        """
        try:
            message = self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            return {
                'success': True,
                'content': message.choices[0].message.content,
                'tokens_used': message.usage.total_tokens,
                'error': None
            }
        except Exception as e:
            return {
                'success': False,
                'content': None,
                'tokens_used': 0,
                'error': str(e)
            }


def get_groq_client() -> Optional[GroqClient]:
    """
    Get or create Groq client from session state
    
    Returns:
        GroqClient instance or None if no API key
    """
    if 'groq_client' not in st.session_state:
        if 'groq_api_key' not in st.session_state:
            return None
        try:
            st.session_state.groq_client = GroqClient(st.session_state.groq_api_key)
        except Exception:
            return None
    return st.session_state.groq_client
