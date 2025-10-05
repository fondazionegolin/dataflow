"""FastAPI backend for DataFlow Platform."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import uvicorn
import numpy as np
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()
print(f"[Startup] Loaded .env file, OPENAI_API_KEY present: {'OPENAI_API_KEY' in os.environ}")

from core.types import Workflow, NodeInstance, NodeSpec
from core.registry import registry
from core.executor import ExecutionEngine
from storage.sessions import SessionStorage, DatasetStorage


def clean_for_json(obj: Any) -> Any:
    """Recursively clean object for JSON serialization by replacing inf/nan with None."""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(clean_for_json(item) for item in obj)
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    elif isinstance(obj, (np.floating, np.integer)):
        val = float(obj)
        if np.isnan(val) or np.isinf(val):
            return None
        return val
    return obj

# Import all node modules to register them
import nodes.sources
import nodes.ai_sources  # AI-powered data generation
import nodes.transform
import nodes.visualization
import nodes.ml
import nodes.nlp  # NLP and sentiment analysis
import nodes.clustering  # Clustering algorithms
import nodes.llm  # Large Language Models
import nodes.images  # Image generation
import nodes.math  # Mathematical operations
import nodes.control_flow  # Control flow and logic

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DataFlow Platform API",
    description="Backend API for node-based data science workflows",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global execution engine
execution_engine = ExecutionEngine()


# Request/Response models
class ExecuteWorkflowRequest(BaseModel):
    workflow: Workflow
    changed_nodes: Optional[List[str]] = None


class ExecuteWorkflowResponse(BaseModel):
    success: bool
    results: Dict[str, Any]
    errors: Dict[str, str]


class NodeResultResponse(BaseModel):
    node_id: str
    outputs: Dict[str, Any]
    metadata: Dict[str, Any]
    preview: Optional[Dict[str, Any]]
    error: Optional[str]


# API Routes

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "DataFlow Platform API",
        "version": "0.1.0"
    }


@app.get("/api/nodes", response_model=List[NodeSpec])
async def get_node_specs():
    """Get all available node specifications."""
    try:
        specs = registry.get_all_specs()
        
        # Populate dataset options for Load AI Dataset node
        for spec in specs:
            if spec.type == "ai.load_dataset":
                datasets = DatasetStorage.list_datasets()
                # Update options with dataset list
                for param in spec.params:
                    if param.name == "dataset_id":
                        param.options = [
                            {"value": ds["id"], "label": f"{ds['name']} ({ds['metadata'].get('rows', 0)} rows)"}
                            for ds in datasets
                        ]
        
        return specs
    except Exception as e:
        logger.error(f"Failed to get node specs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nodes/categories")
async def get_categories():
    """Get all node categories."""
    try:
        categories = registry.list_categories()
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nodes/{node_type}", response_model=NodeSpec)
async def get_node_spec(node_type: str):
    """Get specification for a specific node type."""
    try:
        spec = registry.get_spec(node_type)
        if not spec:
            raise HTTPException(status_code=404, detail=f"Node type '{node_type}' not found")
        return spec
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get node spec: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nodes/{node_id}/full-data")
async def get_node_full_data(node_id: str):
    """Get full data from a node (not just preview)."""
    try:
        result = execution_engine._execution_results.get(node_id)
        if not result:
            raise HTTPException(status_code=404, detail="Node not executed or not found")
        
        # Get the table output (try multiple common names)
        outputs = result.get('outputs', {})
        table_data = outputs.get('table') or outputs.get('generated') or outputs.get('predictions') or outputs.get('dataset')
        
        if table_data is None:
            raise HTTPException(status_code=404, detail="No table data available")
        
        # Convert DataFrame to dict
        import pandas as pd
        if isinstance(table_data, pd.DataFrame):
            # Replace inf/nan before converting
            clean_df = table_data.replace([np.inf, -np.inf], np.nan).fillna(value=None)
            full_data = clean_df.to_dict(orient='records')
            columns = table_data.columns.tolist()
        elif isinstance(table_data, list):
            full_data = table_data
            columns = list(table_data[0].keys()) if table_data and len(table_data) > 0 else []
        elif isinstance(table_data, dict):
            # Single row as dict
            full_data = [table_data]
            columns = list(table_data.keys())
        else:
            raise HTTPException(status_code=500, detail=f"Unsupported data type: {type(table_data)}")
        
        return clean_for_json({
            "data": full_data,
            "columns": columns,
            "rows": len(full_data)
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get full data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/nodes/{node_id}/update-data")
async def update_node_data(node_id: str, request: dict):
    """Update data for a node."""
    try:
        result = execution_engine._execution_results.get(node_id)
        if not result:
            raise HTTPException(status_code=404, detail="Node not executed or not found")
        
        # Get new data
        new_data = request.get('data', [])
        
        # Convert to DataFrame
        import pandas as pd
        new_df = pd.DataFrame(new_data)
        
        # Update the outputs
        result['outputs']['table'] = new_df
        
        # Update preview
        result['preview']['head'] = new_df.head(10).to_dict(orient='records')
        result['preview']['columns'] = new_df.columns.tolist()
        
        logger.info(f"Updated data for node {node_id}: {len(new_df)} rows")
        
        return {
            "success": True,
            "rows": len(new_df),
            "message": "Data updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflow/execute")
async def execute_workflow(request: ExecuteWorkflowRequest):
    """Execute a workflow."""
    try:
        logger.info(f"Executing workflow: {request.workflow.name}")
        
        # Execute workflow
        results = await execution_engine.execute_workflow(
            request.workflow,
            set(request.changed_nodes) if request.changed_nodes else None
        )
        
        # Prepare response
        response_results = {}
        errors = {}
        
        for node_id, result in results.items():
            if result.error:
                errors[node_id] = result.error
            else:
                # Convert outputs to serializable format
                serialized_outputs = {}
                for key, value in result.outputs.items():
                    if hasattr(value, 'to_dict'):
                        serialized_outputs[key] = value.to_dict()
                    elif isinstance(value, dict):
                        serialized_outputs[key] = value
                    else:
                        serialized_outputs[key] = str(type(value))
                
                response_results[node_id] = {
                    "outputs": serialized_outputs,
                    "metadata": clean_for_json(result.metadata),
                    "preview": clean_for_json(result.preview),
                    "execution_time": result.execution_time
                }
        
        return {
            "success": len(errors) == 0,
            "results": clean_for_json(response_results),
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflow/validate")
async def validate_workflow(workflow: Workflow):
    """Validate a workflow without executing it."""
    try:
        # Check for cycles
        sorted_nodes = execution_engine.topological_sort(workflow)
        
        # Validate node types exist
        invalid_nodes = []
        for node in workflow.nodes:
            if not registry.get_spec(node.type):
                invalid_nodes.append(node.id)
        
        return {
            "valid": len(invalid_nodes) == 0,
            "invalid_nodes": invalid_nodes,
            "execution_order": sorted_nodes
        }
        
    except ValueError as e:
        return {
            "valid": False,
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Workflow validation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workflow/result/{node_id}")
async def get_node_result(node_id: str):
    """Get the execution result for a specific node."""
    try:
        result = execution_engine.get_node_result(node_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"No result found for node '{node_id}'")
        
        # Serialize outputs
        serialized_outputs = {}
        for key, value in result.get('outputs', {}).items():
            if hasattr(value, 'to_dict'):
                serialized_outputs[key] = value.to_dict()
            elif isinstance(value, dict):
                serialized_outputs[key] = value
            else:
                serialized_outputs[key] = str(type(value))
        
        return {
            "node_id": node_id,
            "outputs": serialized_outputs,
            "metadata": result.get('metadata', {}),
            "preview": result.get('preview'),
            "execution_time": result.get('execution_time', 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get node result: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cache/clear")
async def clear_cache():
    """Clear all cached results."""
    try:
        execution_engine.cache_manager.clear()
        execution_engine.clear_results()
        return {"success": True, "message": "Cache cleared"}
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cache/size")
async def get_cache_size():
    """Get total cache size."""
    try:
        size = execution_engine.cache_manager.get_size()
        return {
            "size_bytes": size,
            "size_mb": round(size / (1024 * 1024), 2)
        }
    except Exception as e:
        logger.error(f"Failed to get cache size: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cache/invalidate/{node_id}")
async def invalidate_node_cache(node_id: str):
    """Invalidate cache for a specific node."""
    try:
        execution_engine.invalidate_node(node_id)
        return {"success": True, "message": f"Cache invalidated for node {node_id}"}
    except Exception as e:
        logger.error(f"Failed to invalidate cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Session Management Endpoints
# ============================================================================

@app.get("/api/sessions")
async def list_sessions():
    """List all workflow sessions."""
    try:
        sessions = SessionStorage.list_sessions()
        return {"sessions": sessions}
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sessions")
async def create_session():
    """Create a new workflow session."""
    try:
        session = SessionStorage.create_new_session()
        return session
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get a workflow session by ID."""
    try:
        session = SessionStorage.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/sessions/{session_id}")
async def save_session(session_id: str, workflow_data: dict):
    """Save/update a workflow session."""
    try:
        session = SessionStorage.save_session(session_id, workflow_data)
        return session
    except Exception as e:
        logger.error(f"Failed to save session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a workflow session."""
    try:
        success = SessionStorage.delete_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Dataset Management Endpoints
# ============================================================================

@app.get("/api/datasets")
async def list_datasets():
    """List all saved AI datasets."""
    try:
        datasets = DatasetStorage.list_datasets()
        return {"datasets": datasets}
    except Exception as e:
        logger.error(f"Failed to list datasets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/datasets")
async def save_dataset(request: dict):
    """Save an AI-generated dataset."""
    try:
        name = request.get("name", "Untitled Dataset")
        data = request.get("data", {})
        metadata = request.get("metadata", {})
        
        dataset = DatasetStorage.save_dataset(name, data, metadata)
        return dataset
    except Exception as e:
        logger.error(f"Failed to save dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get a dataset by ID."""
    try:
        dataset = DatasetStorage.get_dataset(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return dataset
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset."""
    try:
        success = DatasetStorage.delete_dataset(dataset_id)
        if not success:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8765,
        reload=True,
        log_level="info"
    )
