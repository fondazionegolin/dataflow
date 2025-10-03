"""Session storage for workflow persistence."""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import uuid

# Storage directory
STORAGE_DIR = Path(__file__).parent.parent / ".storage"
SESSIONS_DIR = STORAGE_DIR / "sessions"
DATASETS_DIR = STORAGE_DIR / "datasets"

# Create directories
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
DATASETS_DIR.mkdir(parents=True, exist_ok=True)


class SessionStorage:
    """Manage workflow sessions."""
    
    @staticmethod
    def save_session(session_id: str, workflow_data: dict) -> dict:
        """Save a workflow session."""
        session_file = SESSIONS_DIR / f"{session_id}.json"
        
        # Load existing session to preserve created_at
        existing_session = None
        if session_file.exists():
            with open(session_file, 'r') as f:
                existing_session = json.load(f)
        
        # Extract name from workflow_data
        workflow_name = workflow_data.get("name", "Untitled Workflow")
        
        session = {
            "id": session_id,
            "name": workflow_name,  # Save name at session level
            "created_at": existing_session.get("created_at") if existing_session else datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "workflow": {
                **workflow_data,
                "name": workflow_name  # Ensure name is also in workflow data
            }
        }
        
        with open(session_file, 'w') as f:
            json.dump(session, f, indent=2)
        
        print(f"💾 Saved session {session_id}: '{workflow_name}'")
        
        return session
    
    @staticmethod
    def get_session(session_id: str) -> Optional[dict]:
        """Get a workflow session by ID."""
        session_file = SESSIONS_DIR / f"{session_id}.json"
        
        if not session_file.exists():
            return None
        
        with open(session_file, 'r') as f:
            return json.load(f)
    
    @staticmethod
    def list_sessions() -> List[dict]:
        """List all workflow sessions."""
        sessions = []
        
        for session_file in SESSIONS_DIR.glob("*.json"):
            try:
                with open(session_file, 'r') as f:
                    session = json.load(f)
                    # Return summary without full workflow data
                    sessions.append({
                        "id": session["id"],
                        "name": session["name"],
                        "created_at": session["created_at"],
                        "updated_at": session["updated_at"],
                        "node_count": len(session.get("workflow", {}).get("nodes", []))
                    })
            except Exception as e:
                print(f"Error loading session {session_file}: {e}")
                continue
        
        # Sort by updated_at descending
        sessions.sort(key=lambda x: x["updated_at"], reverse=True)
        return sessions
    
    @staticmethod
    def delete_session(session_id: str) -> bool:
        """Delete a workflow session."""
        session_file = SESSIONS_DIR / f"{session_id}.json"
        
        if session_file.exists():
            session_file.unlink()
            return True
        return False
    
    @staticmethod
    def create_new_session() -> dict:
        """Create a new empty session."""
        session_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        session = {
            "id": session_id,
            "name": f"New Workflow {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "created_at": now,
            "updated_at": now,
            "workflow": {
                "name": "New Workflow",
                "nodes": [],
                "edges": []
            }
        }
        
        session_file = SESSIONS_DIR / f"{session_id}.json"
        with open(session_file, 'w') as f:
            json.dump(session, f, indent=2)
        
        return session


class DatasetStorage:
    """Manage AI-generated datasets."""
    
    @staticmethod
    def save_dataset(name: str, data: dict, metadata: dict = None) -> dict:
        """Save an AI-generated dataset."""
        dataset_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        dataset = {
            "id": dataset_id,
            "name": name,
            "created_at": now,
            "metadata": metadata or {},
            "data": data
        }
        
        dataset_file = DATASETS_DIR / f"{dataset_id}.json"
        with open(dataset_file, 'w') as f:
            json.dump(dataset, f, indent=2)
        
        return {
            "id": dataset_id,
            "name": name,
            "created_at": now,
            "metadata": metadata
        }
    
    @staticmethod
    def get_dataset(dataset_id: str) -> Optional[dict]:
        """Get a dataset by ID."""
        dataset_file = DATASETS_DIR / f"{dataset_id}.json"
        
        if not dataset_file.exists():
            return None
        
        with open(dataset_file, 'r') as f:
            return json.load(f)
    
    @staticmethod
    def list_datasets() -> List[dict]:
        """List all saved datasets."""
        datasets = []
        
        for dataset_file in DATASETS_DIR.glob("*.json"):
            try:
                with open(dataset_file, 'r') as f:
                    dataset = json.load(f)
                    # Return summary without full data
                    datasets.append({
                        "id": dataset["id"],
                        "name": dataset["name"],
                        "created_at": dataset["created_at"],
                        "metadata": dataset.get("metadata", {})
                    })
            except Exception as e:
                print(f"Error loading dataset {dataset_file}: {e}")
                continue
        
        # Sort by created_at descending
        datasets.sort(key=lambda x: x["created_at"], reverse=True)
        return datasets
    
    @staticmethod
    def delete_dataset(dataset_id: str) -> bool:
        """Delete a dataset."""
        dataset_file = DATASETS_DIR / f"{dataset_id}.json"
        
        if dataset_file.exists():
            dataset_file.unlink()
            return True
        return False
