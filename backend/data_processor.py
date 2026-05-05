"""
Data Processor Module
Handles file loading and data extraction for the visualization app
"""

import pandas as pd
import io
import os
from pathlib import Path
from typing import Dict, Any, Optional, Union


class DataProcessor:
    """Handles loading and processing of various file formats"""
    
    @staticmethod
    def load_data(file_content: Union[bytes, str, Path], file_name: str) -> Optional[pd.DataFrame]:
        """
        Load data from raw bytes or a file path.
        
        Args:
            file_content: Raw file bytes, or a path to a file
            file_name: Name of the file (used for extension detection)
            
        Returns:
            pandas DataFrame or None if loading fails
        """
        try:
            file_name = file_name.lower()
            
            # If a file path is provided, read directly from disk
            if isinstance(file_content, (str, Path)):
                file_path = str(file_content)
                if file_name.endswith('.csv'):
                    return pd.read_csv(file_path)
                elif file_name.endswith(('.xlsx', '.xls')):
                    return pd.read_excel(file_path)
                elif file_name.endswith('.json'):
                    return pd.read_json(file_path)
                elif file_name.endswith('.parquet'):
                    return pd.read_parquet(file_path)
                elif file_name.endswith('.pkl') or file_name.endswith('.pickle'):
                    return pd.read_pickle(file_path)
                elif file_name.endswith('.tsv'):
                    return pd.read_csv(file_path, sep='\t')
                else:
                    return None

            # Otherwise assume raw bytes
            if file_name.endswith('.csv'):
                return pd.read_csv(io.BytesIO(file_content))
            elif file_name.endswith(('.xlsx', '.xls')):
                return pd.read_excel(io.BytesIO(file_content))
            elif file_name.endswith('.json'):
                return pd.read_json(io.BytesIO(file_content))
            elif file_name.endswith('.parquet'):
                return pd.read_parquet(io.BytesIO(file_content))
            elif file_name.endswith('.pkl') or file_name.endswith('.pickle'):
                return pd.read_pickle(io.BytesIO(file_content))
            elif file_name.endswith('.tsv'):
                return pd.read_csv(io.BytesIO(file_content), sep='\t')
            else:
                return None
                
        except Exception as e:
            print(f"Error loading file: {str(e)}")
            return None
    
    @staticmethod
    def extract_attributes(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Extract attributes from dataframe for LLM context
        
        Args:
            df: pandas DataFrame
            
        Returns:
            Dictionary containing column info and sample data
        """
        attributes = {
            "columns": [],
            "dtypes": {},
            "sample_data": [],
            "numeric_columns": [],
            "categorical_columns": [],
            "datetime_columns": [],
            "shape": df.shape
        }
        
        for col in df.columns:
            col_info = {
                "name": col,
                "dtype": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
                "sample_values": [str(v) for v in df[col].head(3).tolist()]
            }
            
            # Classify column type
            if pd.api.types.is_numeric_dtype(df[col]):
                col_info["semantic_type"] = "numeric"
                attributes["numeric_columns"].append(col)
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_info["semantic_type"] = "datetime"
                attributes["datetime_columns"].append(col)
            else:
                col_info["semantic_type"] = "categorical"
                attributes["categorical_columns"].append(col)
            
            attributes["columns"].append(col_info)
            attributes["dtypes"][col] = str(df[col].dtype)
        
        # Get 3 sample rows
        attributes["sample_data"] = df.head(3).where(df.head(3).notna(), None).to_dict(orient='records')
        
        return attributes
    
    @staticmethod
    def get_context_for_llm(attributes: Dict[str, Any]) -> str:
        """
        Generate context string for LLM from attributes
        
        Args:
            attributes: Dictionary from extract_attributes
            
        Returns:
            Formatted context string
        """
        context = f"""Dataset Shape: {attributes['shape'][0]} rows, {attributes['shape'][1]} columns

Column Details:
"""
        for col in attributes['columns']:
            context += f"""
- Column: {col['name']}
  - Data Type: {col['dtype']}
  - Semantic Type: {col['semantic_type']}
  - Null Count: {col['null_count']}
  - Unique Values: {col['unique_count']}
  - Sample Values: {col['sample_values']}
"""

        context += f"""
Numeric Columns: {', '.join(attributes['numeric_columns']) if attributes['numeric_columns'] else 'None'}
Categorical Columns: {', '.join(attributes['categorical_columns']) if attributes['categorical_columns'] else 'None'}
DateTime Columns: {', '.join(attributes['datetime_columns']) if attributes['datetime_columns'] else 'None'}

Sample Data (3 rows):
{attributes['sample_data']}
"""
        return context
    
    @staticmethod
    def get_data_summary(df: pd.DataFrame) -> Dict[str, Any]:
        summary = {
            "total_rows": int(df.shape[0]),
            "total_columns": int(df.shape[1]),
            "numeric_columns": df.select_dtypes(include=['number']).columns.tolist(),
            "categorical_columns": df.select_dtypes(include=['object', 'category']).columns.tolist(),
            "datetime_columns": df.select_dtypes(include=['datetime']).columns.tolist(),
            "missing_values": df.isnull().sum().to_dict(),
            "basic_stats": {}
        }
        
        for col in summary["numeric_columns"]:
            summary["basic_stats"][col] = {
                "mean": float(df[col].mean()) if not df[col].isnull().all() else None,
                "median": float(df[col].median()) if not df[col].isnull().all() else None,
                "std": float(df[col].std()) if not df[col].isnull().all() else None,
                "min": float(df[col].min()) if not df[col].isnull().all() else None,
                "max": float(df[col].max()) if not df[col].isnull().all() else None,
            }
        
        return summary
