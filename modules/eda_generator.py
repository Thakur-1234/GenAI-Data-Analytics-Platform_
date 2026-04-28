"""
EDA (Exploratory Data Analysis) code generation module
"""
import io
import sys
from typing import Dict, Optional, List
import pandas as pd
import streamlit as st

from utils.groq_client import get_groq_client
from modules.subprocess_executor import SubprocessExecutor
from utils.helpers import chunk_text, get_dataframe_summary
from config.settings import PROMPTS, EDA_SAMPLE_SIZE


class EDAGenerator:
    """Generate and execute EDA code using Groq LLM"""
    
    @staticmethod
    def get_dataset_info(df: pd.DataFrame) -> Dict:
        """
        Extract dataset information for prompt
        
        Args:
            df: Pandas DataFrame
            
        Returns:
            Dictionary with dataset information
        """
        return {
            'shape': df.shape,
            'columns': list(df.columns),
            'dtypes': df.dtypes.to_dict(),
            'missing': df.isnull().sum().to_dict(),
            'numeric_cols': list(df.select_dtypes(include=['number']).columns),
            'categorical_cols': list(df.select_dtypes(include=['object']).columns),
            'head': df.head(3).to_dict('records')
        }
    
    @staticmethod
    def generate_eda_code(df: pd.DataFrame, file_path: str) -> Dict[str, any]:
        """
        Generate EDA code using Groq LLM
        
        Args:
            df: Pandas DataFrame
            file_path: Path to CSV file
            
        Returns:
            Dictionary with generated code and metadata
        """
        try:
            # Get Groq client
            client = get_groq_client()
            if not client:
                return {
                    'success': False,
                    'code': None,
                    'error': 'Groq API not configured'
                }
            
            # Get dataset info
            info = EDAGenerator.get_dataset_info(df)
            
            # Build prompt
            prompt = PROMPTS['eda_code_generation'].format(
                columns=', '.join(info['columns']),
                shape=info['shape'],
                dtypes=str(info['dtypes']),
                missing=str(info['missing']),
                file_path=file_path
            )
            
            # Generate code
            response = client.generate_code(prompt)
            
            if not response['success']:
                return {
                    'success': False,
                    'code': None,
                    'error': response['error']
                }
            
            # Extract code from response
            code = response['content']
            
            # Clean up code (remove markdown formatting if present)
            if '```python' in code:
                code = code.split('```python')[1].split('```')[0]
            elif '```' in code:
                code = code.split('```')[1].split('```')[0]
            
            return {
                'success': True,
                'code': code.strip(),
                'error': None,
                'tokens_used': response['tokens_used']
            }
        
        except Exception as e:
            return {
                'success': False,
                'code': None,
                'error': f"Error generating code: {str(e)}"
            }
    
    @staticmethod
    def execute_eda_code(code: str, file_path: str) -> Dict[str, any]:
        """
        Execute generated EDA code
        
        Args:
            code: Python code to execute
            file_path: Path to CSV file
            
        Returns:
            Dictionary with execution results
        """
        try:
            # Prepare execution code
            execution_code = f"""
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json

# Load data
file_path = r'{file_path}'
df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)

# Sample large datasets
if len(df) > {EDA_SAMPLE_SIZE}:
    df = df.sample(n={EDA_SAMPLE_SIZE}, random_state=42)

# Initialize figures dictionary
figures = {{}}

# User provided code
{code}

# Verify figures exist
if 'figures' in locals():
    print("FIGURES_GENERATED")
    for key, fig in figures.items():
        print(f"Figure: {{key}}")
else:
    print("NO_FIGURES")
"""
            
            # Execute code
            result = SubprocessExecutor.execute_code(execution_code, timeout=120)
            
            if not result['success']:
                return {
                    'success': False,
                    'figures': None,
                    'error': result['error'],
                    'stdout': result['stdout'],
                    'stderr': result['stderr']
                }
            
            # Check if figures were generated
            if 'FIGURES_GENERATED' not in result['stdout']:
                return {
                    'success': False,
                    'figures': None,
                    'error': 'Code executed but no figures were generated. Ensure figures dict is created.',
                    'stdout': result['stdout'],
                    'stderr': result['stderr']
                }
            
            return {
                'success': True,
                'figures': {},  # Will be populated from code execution
                'error': None,
                'stdout': result['stdout'],
                'stderr': result['stderr']
            }
        
        except Exception as e:
            return {
                'success': False,
                'figures': None,
                'error': f"Execution error: {str(e)}",
                'stdout': '',
                'stderr': str(e)
            }


def initialize_eda_generator() -> EDAGenerator:
    """Initialize EDA generator (with caching)"""
    if 'eda_generator' not in st.session_state:
        st.session_state.eda_generator = EDAGenerator()
    return st.session_state.eda_generator
