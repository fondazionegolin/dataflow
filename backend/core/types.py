"""Core type definitions for the node system."""

from enum import Enum
from typing import Any, Dict, List, Optional, Union, Callable
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np


class PortType(str, Enum):
    """Types of data that can flow between nodes."""
    TABLE = "table"  # pandas DataFrame / Arrow Table
    SERIES = "series"  # 1D numeric/categorical
    ARRAY_3D = "array3d"  # 3D array for 3D scatter
    MODEL = "model"  # sklearn model object
    METRICS = "metrics"  # dict of metrics
    PARAMS = "params"  # dict of parameters
    ANY = "any"  # accepts any type


class ParamType(str, Enum):
    """Types of parameters for node configuration."""
    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    SLIDER = "slider"
    COLOR = "color"
    FILE = "file"
    CODE = "code"
    COLUMN = "column"  # column selector
    COLUMNS = "columns"  # multiple column selector


class CachePolicy(str, Enum):
    """Cache behavior for node execution."""
    AUTO = "auto"  # cache based on input/param hash
    NEVER = "never"  # always recompute
    MANUAL = "manual"  # user controls


class NodeStatus(str, Enum):
    """Execution status of a node."""
    IDLE = "idle"
    RUNNING = "running"
    CACHED = "cached"
    SUCCESS = "success"
    ERROR = "error"


class PortSpec(BaseModel):
    """Specification for a node port (input or output)."""
    name: str
    type: PortType
    label: str
    required: bool = True
    description: Optional[str] = None


class ParamSpec(BaseModel):
    """Specification for a node parameter."""
    name: str
    type: ParamType
    label: str
    default: Any = None
    required: bool = False
    description: Optional[str] = None
    # Type-specific options
    options: Optional[List[Any]] = None  # for SELECT/MULTI_SELECT
    min: Optional[float] = None  # for NUMBER/SLIDER
    max: Optional[float] = None
    step: Optional[float] = None
    accept: Optional[str] = None  # for FILE (e.g., ".csv,.xlsx")
    language: Optional[str] = None  # for CODE (e.g., "python")


class NodeResult(BaseModel):
    """Result of node execution."""
    outputs: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    preview: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: float = 0.0


class NodeContext(BaseModel):
    """Execution context passed to node run method."""
    node_id: str
    inputs: Dict[str, Any] = Field(default_factory=dict)
    params: Dict[str, Any] = Field(default_factory=dict)
    cache_dir: Optional[str] = None
    global_seed: Optional[int] = None

    class Config:
        arbitrary_types_allowed = True


class NodeSpec(BaseModel):
    """Complete specification of a node type."""
    type: str  # e.g., "csv.load", "data.clean"
    label: str
    category: str  # e.g., "sources", "transform", "plot", "ml"
    description: str
    inputs: List[PortSpec] = Field(default_factory=list)
    outputs: List[PortSpec] = Field(default_factory=list)
    params: List[ParamSpec] = Field(default_factory=list)
    cache_policy: CachePolicy = CachePolicy.AUTO
    icon: Optional[str] = None  # emoji or icon name
    color: Optional[str] = None  # hex color for UI
    
    class Config:
        arbitrary_types_allowed = True


class NodeInstance(BaseModel):
    """Instance of a node in a workflow."""
    id: str
    type: str
    label: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=dict)
    position: Dict[str, float] = Field(default_factory=dict)  # x, y for UI
    status: NodeStatus = NodeStatus.IDLE
    cache_key: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    
    class Config:
        arbitrary_types_allowed = True


class Edge(BaseModel):
    """Connection between two nodes."""
    id: str
    source_node: str
    source_port: str
    target_node: str
    target_port: str


class Workflow(BaseModel):
    """Complete workflow definition."""
    version: str = "0.1.0"
    name: str = "Untitled Workflow"
    description: Optional[str] = None
    seed: Optional[int] = None
    nodes: List[NodeInstance] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        arbitrary_types_allowed = True


# Type aliases for common data structures
TableData = pd.DataFrame
SeriesData = Union[pd.Series, np.ndarray]
Array3DData = np.ndarray
ModelData = Any  # sklearn model or similar
MetricsData = Dict[str, Any]
ParamsData = Dict[str, Any]
