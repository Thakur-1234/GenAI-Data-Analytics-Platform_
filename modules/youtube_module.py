"""
YouTube video processing module with RAG
"""
import re
from typing import List, Dict, Optional
import streamlit as st

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    YouTubeTranscriptApi = None

from utils.helpers import chunk_text, get_dataframe_summary
from utils.validators import validate_youtube_url
from modules.embeddings_module import EmbeddingsManager
from utils.groq_client import get_groq_client
from config.settings import YOUTUBE_CHUNK_SIZE, YOUTUBE_OVERLAP, PROMPTS


class YouTubeQASystem:
    """RAG-based QA system for YouTube videos"""
    
    def __init__(self):
        """Initialize YouTube QA system"""
        if YouTubeTranscriptApi is None:
            raise ImportError("Install: youtube-transcript-api")
        
        self.embeddings_manager = None
        self.transcript_data = {}
    
    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """
        Extract video ID from YouTube URL
        
        Args:
            url: YouTube URL
            
        Returns:
            Video ID or None
        """
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
            r'youtube\.com\/embed\/([^&\n?#]+)',
            r'youtube\.co[^/]*\/watch\?v=([^&\n?#]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    def get_transcript(self, url: str) -> Dict[str, any]:
        """
        Get transcript from YouTube video
        
        Args:
            url: YouTube URL
            
        Returns:
            Dictionary with transcript data
        """
        is_valid, msg = validate_youtube_url(url)
        if not is_valid:
            return {'success': False, 'error': msg, 'transcript': None}
        
        try:
            video_id = self.extract_video_id(url)
            if not video_id:
                return {'success': False, 'error': 'Could not extract video ID', 'transcript': None}
            
            # Fetch transcript
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            
            # Combine text
            full_text = ' '.join([item['text'] for item in transcript])
            
            self.transcript_data = {
                'video_id': video_id,
                'url': url,
                'full_text': full_text,
                'chunks': chunk_text(full_text, YOUTUBE_CHUNK_SIZE, YOUTUBE_OVERLAP)
            }
            
            return {
                'success': True,
                'transcript': full_text,
                'video_id': video_id,
                'error': None
            }
        
        except Exception as e:
            return {'success': False, 'error': f"Error fetching transcript: {str(e)}", 'transcript': None}
    
    def setup_rag(self, chunks: List[str] = None) -> bool:
        """
        Setup RAG system with transcript chunks
        
        Args:
            chunks: List of text chunks (uses stored chunks if None)
            
        Returns:
            Success status
        """
        try:
            if chunks is None:
                chunks = self.transcript_data.get('chunks', [])
            
            if not chunks:
                return False
            
            # Create embeddings manager
            self.embeddings_manager = EmbeddingsManager()
            
            # Add chunks to embeddings
            self.embeddings_manager.add_texts(chunks)
            
            return True
        except Exception as e:
            print(f"Error setting up RAG: {str(e)}")
            return False
    
    def answer_question(self, question: str, top_k: int = 3) -> Dict[str, any]:
        """
        Answer question about video using RAG
        
        Args:
            question: User question
            top_k: Number of context chunks to retrieve
            
        Returns:
            Dictionary with answer and context
        """
        if not self.embeddings_manager:
            return {
                'success': False,
                'answer': None,
                'context': [],
                'error': 'RAG system not initialized. Please load a video first.'
            }
        
        try:
            # Get Groq client
            client = get_groq_client()
            if not client:
                return {
                    'success': False,
                    'answer': None,
                    'context': [],
                    'error': 'Groq API not configured. Please enter your API key.'
                }
            
            # Retrieve relevant context
            results = self.embeddings_manager.search(question, top_k=top_k)
            
            if not results:
                return {
                    'success': False,
                    'answer': None,
                    'context': [],
                    'error': 'No relevant context found in video transcript.'
                }
            
            context_texts = [text for text, _ in results]
            context = '\n\n'.join(context_texts)
            
            # Generate prompt
            prompt = PROMPTS['youtube_qa'].format(
                context=context,
                question=question
            )
            
            # Generate answer
            response = client.generate_text(prompt)
            
            if not response['success']:
                return {
                    'success': False,
                    'answer': None,
                    'context': context_texts,
                    'error': response['error']
                }
            
            return {
                'success': True,
                'answer': response['content'],
                'context': context_texts,
                'error': None
            }
        
        except Exception as e:
            return {
                'success': False,
                'answer': None,
                'context': [],
                'error': f"Error generating answer: {str(e)}"
            }


def initialize_youtube_system() -> YouTubeQASystem:
    """Initialize YouTube QA system (with caching)"""
    if 'youtube_system' not in st.session_state:
        st.session_state.youtube_system = YouTubeQASystem()
    return st.session_state.youtube_system
