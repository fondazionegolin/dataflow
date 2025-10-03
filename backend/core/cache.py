"""Caching system for node execution results."""

import hashlib
import json
import pickle
import os
from pathlib import Path
from typing import Any, Optional, Dict
import pandas as pd
import pyarrow as pa
import pyarrow.feather as feather
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """Manages caching of node execution results."""
    
    def __init__(self, cache_dir: str = ".cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._memory_cache: Dict[str, Any] = {}
    
    def compute_hash(self, node_id: str, node_type: str, params: Dict[str, Any], 
                     input_hashes: Dict[str, str]) -> str:
        """Compute cache key for a node execution."""
        # Create deterministic representation
        cache_data = {
            "node_id": node_id,
            "node_type": node_type,
            "params": self._serialize_params(params),
            "input_hashes": input_hashes
        }
        
        # Compute hash
        data_str = json.dumps(cache_data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]
    
    def _serialize_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Serialize parameters for hashing."""
        serialized = {}
        for key, value in params.items():
            if isinstance(value, (str, int, float, bool, type(None))):
                serialized[key] = value
            elif isinstance(value, (list, tuple)):
                serialized[key] = [self._serialize_value(v) for v in value]
            elif isinstance(value, dict):
                serialized[key] = self._serialize_params(value)
            else:
                serialized[key] = str(value)
        return serialized
    
    def _serialize_value(self, value: Any) -> Any:
        """Serialize a single value."""
        if isinstance(value, (str, int, float, bool, type(None))):
            return value
        return str(value)
    
    def get(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached result."""
        # Check memory cache first
        if cache_key in self._memory_cache:
            logger.debug(f"Cache hit (memory): {cache_key}")
            return self._memory_cache[cache_key]
        
        # Check disk cache
        cache_path = self.cache_dir / f"{cache_key}.cache"
        if cache_path.exists():
            try:
                with open(cache_path, 'rb') as f:
                    result = pickle.load(f)
                
                # Load any table data from feather
                if 'outputs' in result:
                    for key, value in result['outputs'].items():
                        if isinstance(value, str) and value.startswith("__table__:"):
                            table_path = self.cache_dir / value.replace("__table__:", "")
                            if table_path.exists():
                                result['outputs'][key] = feather.read_feather(table_path)
                
                self._memory_cache[cache_key] = result
                logger.debug(f"Cache hit (disk): {cache_key}")
                return result
            except Exception as e:
                logger.warning(f"Failed to load cache {cache_key}: {e}")
                return None
        
        logger.debug(f"Cache miss: {cache_key}")
        return None
    
    def set(self, cache_key: str, result: Dict[str, Any]):
        """Store result in cache."""
        try:
            # Prepare result for caching
            cached_result = {
                'outputs': {},
                'metadata': result.get('metadata', {}),
                'preview': result.get('preview'),
                'execution_time': result.get('execution_time', 0.0)
            }
            
            # Handle table data separately
            for key, value in result.get('outputs', {}).items():
                if isinstance(value, pd.DataFrame):
                    # Save table to feather format
                    table_filename = f"{cache_key}_{key}.feather"
                    table_path = self.cache_dir / table_filename
                    feather.write_feather(value, table_path)
                    cached_result['outputs'][key] = f"__table__:{table_filename}"
                else:
                    cached_result['outputs'][key] = value
            
            # Save to disk
            cache_path = self.cache_dir / f"{cache_key}.cache"
            with open(cache_path, 'wb') as f:
                pickle.dump(cached_result, f)
            
            # Store in memory
            self._memory_cache[cache_key] = result
            
            logger.debug(f"Cached result: {cache_key}")
        except Exception as e:
            logger.error(f"Failed to cache result {cache_key}: {e}")
    
    def invalidate(self, cache_key: str):
        """Invalidate a cached result."""
        # Remove from memory
        if cache_key in self._memory_cache:
            del self._memory_cache[cache_key]
        
        # Remove from disk
        cache_path = self.cache_dir / f"{cache_key}.cache"
        if cache_path.exists():
            cache_path.unlink()
        
        # Remove associated table files
        for file in self.cache_dir.glob(f"{cache_key}_*.feather"):
            file.unlink()
        
        logger.debug(f"Invalidated cache: {cache_key}")
    
    def clear(self):
        """Clear all cached results."""
        self._memory_cache.clear()
        for file in self.cache_dir.glob("*.cache"):
            file.unlink()
        for file in self.cache_dir.glob("*.feather"):
            file.unlink()
        logger.info("Cleared all cache")
    
    def get_size(self) -> int:
        """Get total cache size in bytes."""
        total = 0
        for file in self.cache_dir.glob("*"):
            if file.is_file():
                total += file.stat().st_size
        return total
