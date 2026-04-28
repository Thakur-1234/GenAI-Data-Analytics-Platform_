"""
Data chat module for natural language data querying
"""
from typing import Dict, Optional
import pandas as pd
import streamlit as st

from utils.groq_client import get_groq_client
from utils.helpers import get_dataframe_summary
from config.settings import PROMPTS


class DataChatModule:
    """Natural language data querying module"""
    
    def __init__(self):
        """Initialize data chat module"""
        self.df = None
        self.summary = None
        self.conversation_history = []
    
    def set_dataframe(self, df: pd.DataFrame) -> bool:
        """
        Set the current DataFrame for querying
        
        Args:
            df: Pandas DataFrame
            
        Returns:
            Success status
        """
        try:
            self.df = df
            self.summary = get_dataframe_summary(df)
            self.conversation_history = []
            return True
        except Exception as e:
            print(f"Error setting dataframe: {str(e)}")
            return False
    
    def answer_question(self, question: str) -> Dict[str, any]:
        """
        Answer question about the dataset
        
        Args:
            question: User question
            
        Returns:
            Dictionary with answer and context
        """
        if self.df is None or self.summary is None:
            return {
                'success': False,
                'answer': None,
                'error': 'No dataset loaded. Please upload a dataset first.'
            }
        
        try:
            # Get Groq client
            client = get_groq_client()
            if not client:
                return {
                    'success': False,
                    'answer': None,
                    'error': 'Groq API not configured'
                }
            
            # Build conversation context
            conversation_context = '\n'.join([
                f"Q: {msg['user']}\nA: {msg['assistant']}" 
                for msg in self.conversation_history[-5:]  # Last 5 exchanges
            ])
            
            # Prepare prompt
            prompt = PROMPTS['data_chat'].format(
                dataset_summary=self.summary,
                question=question
            )
            
            if conversation_context:
                prompt = f"Previous conversation:\n{conversation_context}\n\n{prompt}"
            
            # Generate answer
            response = client.generate_text(prompt, max_tokens=1500)
            
            if not response['success']:
                return {
                    'success': False,
                    'answer': None,
                    'error': response['error']
                }
            
            answer = response['content']
            
            # Add to conversation history
            self.conversation_history.append({
                'user': question,
                'assistant': answer
            })
            
            # Extract insights if available
            insights = self._extract_insights(answer)
            
            return {
                'success': True,
                'answer': answer,
                'insights': insights,
                'error': None
            }
        
        except Exception as e:
            return {
                'success': False,
                'answer': None,
                'error': f"Error answering question: {str(e)}"
            }
    
    def _extract_insights(self, text: str) -> list:
        """
        Extract key insights from answer
        
        Args:
            text: Answer text
            
        Returns:
            List of insights
        """
        insights = []
        
        # Look for common insight patterns
        lines = text.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in 
                   ['key', 'insight', 'important', 'significant', 'notable', 'finding']):
                insights.append(line.strip())
        
        return insights[:5]  # Return top 5 insights
    
    def get_statistics(self) -> Dict:
        """
        Get basic statistics about current dataset
        
        Args:
            Returns: Dictionary with statistics
        """
        if self.df is None:
            return {}
        
        try:
            stats = {
                'rows': len(self.df),
                'columns': len(self.df.columns),
                'memory_mb': self.df.memory_usage(deep=True).sum() / 1024**2,
                'missing_values': self.df.isnull().sum().sum(),
                'numeric_cols': len(self.df.select_dtypes(include=['number']).columns),
                'categorical_cols': len(self.df.select_dtypes(include=['object']).columns),
            }
            return stats
        except Exception as e:
            print(f"Error calculating statistics: {str(e)}")
            return {}


def initialize_data_chat() -> DataChatModule:
    """Initialize data chat module (with caching)"""
    if 'data_chat' not in st.session_state:
        st.session_state.data_chat = DataChatModule()
    return st.session_state.data_chat
