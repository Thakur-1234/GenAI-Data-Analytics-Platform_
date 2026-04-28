"""
Embeddings module for storing and retrieving semantic information
"""
import numpy as np
import pickle
from pathlib import Path
from typing import List, Tuple, Optional
import streamlit as st

try:
    import faiss
    from sentence_transformers import SentenceTransformer
except ImportError:
    faiss = None
    SentenceTransformer = None


class EmbeddingsManager:
    """Manage embeddings using FAISS and sentence-transformers"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", embedding_dim: int = 384):
        """
        Initialize embeddings manager
        
        Args:
            model_name: Sentence transformer model name
            embedding_dim: Embedding dimension
        """
        if SentenceTransformer is None or faiss is None:
            raise ImportError("Install required packages: sentence-transformers, faiss-cpu")
        
        self.model_name = model_name
        self.embedding_dim = embedding_dim
        self.model = SentenceTransformer(model_name)
        
        # Initialize FAISS index
        self.index = None
        self.data = []
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize FAISS index"""
        self.index = faiss.IndexFlatL2(self.embedding_dim)
    
    def add_texts(self, texts: List[str]) -> None:
        """
        Add texts to the index
        
        Args:
            texts: List of text strings
        """
        if not texts:
            return
        
        # Generate embeddings
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        
        # Convert to float32 for FAISS
        embeddings = np.array(embeddings).astype('float32')
        
        # Add to index
        self.index.add(embeddings)
        
        # Store original texts
        self.data.extend(texts)
    
    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Search for similar texts
        
        Args:
            query: Query text
            top_k: Number of top results to return
            
        Returns:
            List of (text, distance) tuples
        """
        if self.index.ntotal == 0:
            return []
        
        # Encode query
        query_embedding = self.model.encode([query], normalize_embeddings=True)
        query_embedding = np.array(query_embedding).astype('float32')
        
        # Search
        distances, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))
        
        # Return results
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(self.data):
                results.append((self.data[idx], float(distance)))
        
        return results
    
    def save(self, filepath: str) -> bool:
        """
        Save index and data to file
        
        Args:
            filepath: Path to save file
            
        Returns:
            Success status
        """
        try:
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)
            
            # Save FAISS index
            index_path = filepath.replace('.pkl', '_index.faiss')
            faiss.write_index(self.index, index_path)
            
            # Save metadata
            metadata = {
                'model_name': self.model_name,
                'embedding_dim': self.embedding_dim,
                'data': self.data,
                'index_path': index_path
            }
            
            with open(filepath, 'wb') as f:
                pickle.dump(metadata, f)
            
            return True
        except Exception as e:
            print(f"Error saving embeddings: {str(e)}")
            return False
    
    @classmethod
    def load(cls, filepath: str) -> Optional['EmbeddingsManager']:
        """
        Load index and data from file
        
        Args:
            filepath: Path to saved file
            
        Returns:
            EmbeddingsManager instance or None if failed
        """
        try:
            # Load metadata
            with open(filepath, 'rb') as f:
                metadata = pickle.load(f)
            
            # Create instance
            instance = cls(
                model_name=metadata['model_name'],
                embedding_dim=metadata['embedding_dim']
            )
            
            # Load FAISS index
            index_path = metadata['index_path']
            instance.index = faiss.read_index(index_path)
            instance.data = metadata['data']
            
            return instance
        except Exception as e:
            print(f"Error loading embeddings: {str(e)}")
            return None


@st.cache_resource
def get_embeddings_manager():
    """Get or create embeddings manager (cached)"""
    return EmbeddingsManager()
