"""
Data upload module for handling file uploads and data loading
"""
from pathlib import Path
from typing import Dict, Tuple, Optional
import pandas as pd
import streamlit as st

from utils.validators import validate_file_upload
from config.settings import UPLOADS_DIR


class DataUploadModule:
    """Handle data uploads and loading"""
    
    SUPPORTED_FORMATS = {
        '.csv': 'CSV File',
        '.xlsx': 'Excel File',
        '.xls': 'Excel File',
        '.json': 'JSON File',
        '.parquet': 'Parquet File'
    }
    
    @staticmethod
    def save_uploaded_file(uploaded_file) -> Tuple[bool, str, Optional[str]]:
        """
        Save uploaded file to disk
        
        Args:
            uploaded_file: Streamlit UploadedFile object
            
        Returns:
            tuple: (success, message, filepath)
        """
        # Validate file
        is_valid, msg = validate_file_upload(uploaded_file)
        if not is_valid:
            return False, msg, None
        
        try:
            # Create safe filename
            filename = uploaded_file.name
            filepath = UPLOADS_DIR / filename
            
            # Save file
            with open(filepath, 'wb') as f:
                f.write(uploaded_file.getbuffer())
            
            return True, f"File saved successfully: {filename}", str(filepath)
        
        except Exception as e:
            return False, f"Error saving file: {str(e)}", None
    
    @staticmethod
    def load_dataframe(filepath: str) -> Tuple[bool, str, Optional[pd.DataFrame]]:
        """
        Load DataFrame from file
        
        Args:
            filepath: Path to file
            
        Returns:
            tuple: (success, message, dataframe)
        """
        try:
            filepath = Path(filepath)
            extension = filepath.suffix.lower()
            
            if extension == '.csv':
                df = pd.read_csv(filepath)
            elif extension in ['.xlsx', '.xls']:
                df = pd.read_excel(filepath)
            elif extension == '.json':
                df = pd.read_json(filepath)
            elif extension == '.parquet':
                df = pd.read_parquet(filepath)
            else:
                return False, f"Unsupported file format: {extension}", None
            
            # Validate dataframe
            if df.empty:
                return False, "DataFrame is empty", None
            
            return True, f"Loaded {len(df)} rows and {len(df.columns)} columns", df
        
        except Exception as e:
            return False, f"Error loading file: {str(e)}", None
    
    @staticmethod
    def get_file_info(df: pd.DataFrame) -> Dict:
        """
        Get information about loaded file
        
        Args:
            df: Pandas DataFrame
            
        Returns:
            Dictionary with file information
        """
        return {
            'rows': len(df),
            'columns': len(df.columns),
            'column_names': list(df.columns),
            'dtypes': df.dtypes.to_dict(),
            'memory_mb': df.memory_usage(deep=True).sum() / 1024**2,
            'missing_values': df.isnull().sum().to_dict(),
            'numeric_columns': list(df.select_dtypes(include=['number']).columns),
            'categorical_columns': list(df.select_dtypes(include=['object']).columns),
            'duplicates': len(df[df.duplicated()])
        }


def initialize_data_upload() -> DataUploadModule:
    """Initialize data upload module"""
    return DataUploadModule()
