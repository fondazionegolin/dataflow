"""Data source nodes: CSV loading and synthetic data generation."""

import pandas as pd
import numpy as np
from sklearn.datasets import make_classification, make_regression, make_blobs, make_moons, make_circles
from typing import Optional
import time

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType, 
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class CSVLoadNode(NodeExecutor):
    """Load data from CSV files."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="csv.load",
            label="Load CSV",
            category="sources",
            description="Load data from a CSV file with configurable parsing options",
            icon="📁",
            color="#4CAF50",
            inputs=[],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Table"),
                PortSpec(name="metadata", type=PortType.PARAMS, label="Metadata", required=False)
            ],
            params=[
                ParamSpec(
                    name="path",
                    type=ParamType.FILE,
                    label="File Path",
                    required=True,
                    accept=".csv,.tsv,.txt"
                ),
                ParamSpec(
                    name="separator",
                    type=ParamType.SELECT,
                    label="Separator",
                    default=",",
                    options=[",", ";", "\t", "|", " "]
                ),
                ParamSpec(
                    name="encoding",
                    type=ParamType.SELECT,
                    label="Encoding",
                    default="utf-8",
                    options=["utf-8", "latin-1", "iso-8859-1", "cp1252"]
                ),
                ParamSpec(
                    name="header",
                    type=ParamType.BOOLEAN,
                    label="Has Header Row",
                    default=True
                ),
                ParamSpec(
                    name="infer_types",
                    type=ParamType.BOOLEAN,
                    label="Infer Data Types",
                    default=True
                ),
                ParamSpec(
                    name="limit_rows",
                    type=ParamType.INTEGER,
                    label="Limit Rows (0 = all)",
                    default=0,
                    min=0
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Load CSV file."""
        params = context.params
        path = params.get("path")
        separator = params.get("separator", ",")
        encoding = params.get("encoding", "utf-8")
        has_header = params.get("header", True)
        infer_types = params.get("infer_types", True)
        limit_rows = params.get("limit_rows", 0)
        
        try:
            # Read CSV
            read_kwargs = {
                "sep": separator,
                "encoding": encoding,
                "header": 0 if has_header else None,
                "nrows": limit_rows if limit_rows > 0 else None
            }
            
            if not infer_types:
                read_kwargs["dtype"] = str
            
            df = pd.read_csv(path, **read_kwargs)
            
            # Generate metadata
            metadata = {
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "null_counts": df.isnull().sum().to_dict(),
                "memory_usage": df.memory_usage(deep=True).sum()
            }
            
            # Generate preview
            preview = {
                "head": df.head(10).to_dict(orient="records"),
                "shape": df.shape,
                "columns": [
                    {
                        "name": col,
                        "dtype": str(df[col].dtype),
                        "null_count": int(df[col].isnull().sum()),
                        "unique_count": int(df[col].nunique())
                    }
                    for col in df.columns
                ]
            }
            
            return NodeResult(
                outputs={"table": df, "metadata": metadata},
                metadata=metadata,
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to load CSV: {str(e)}")


@register_node
class SyntheticDataNode(NodeExecutor):
    """Generate synthetic datasets for testing and education."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="csv.synthetic",
            label="Generate Synthetic Data",
            category="sources",
            description="Generate synthetic datasets with various distributions and patterns",
            icon="🎲",
            color="#9C27B0",
            inputs=[],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Table"),
                PortSpec(name="metadata", type=PortType.PARAMS, label="Metadata", required=False)
            ],
            params=[
                ParamSpec(
                    name="mode",
                    type=ParamType.SELECT,
                    label="Generation Mode",
                    default="classification",
                    options=["classification", "regression", "blobs", "moons", "circles", "custom"]
                ),
                ParamSpec(
                    name="n_samples",
                    type=ParamType.INTEGER,
                    label="Number of Samples",
                    default=1000,
                    min=10,
                    max=1000000
                ),
                ParamSpec(
                    name="n_features",
                    type=ParamType.INTEGER,
                    label="Number of Features",
                    default=5,
                    min=1,
                    max=100
                ),
                ParamSpec(
                    name="n_classes",
                    type=ParamType.INTEGER,
                    label="Number of Classes (classification)",
                    default=2,
                    min=2,
                    max=10
                ),
                ParamSpec(
                    name="n_informative",
                    type=ParamType.INTEGER,
                    label="Informative Features",
                    default=3,
                    min=1,
                    max=100
                ),
                ParamSpec(
                    name="n_redundant",
                    type=ParamType.INTEGER,
                    label="Redundant Features",
                    default=1,
                    min=0,
                    max=50
                ),
                ParamSpec(
                    name="noise",
                    type=ParamType.SLIDER,
                    label="Noise Level",
                    default=0.1,
                    min=0.0,
                    max=1.0,
                    step=0.05
                ),
                ParamSpec(
                    name="class_sep",
                    type=ParamType.SLIDER,
                    label="Class Separation",
                    default=1.0,
                    min=0.1,
                    max=5.0,
                    step=0.1
                ),
                ParamSpec(
                    name="nan_ratio",
                    type=ParamType.SLIDER,
                    label="Missing Value Ratio",
                    default=0.0,
                    min=0.0,
                    max=0.5,
                    step=0.05
                ),
                ParamSpec(
                    name="seed",
                    type=ParamType.INTEGER,
                    label="Random Seed",
                    default=42,
                    min=0
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Generate synthetic data."""
        params = context.params
        mode = params.get("mode", "classification")
        n_samples = params.get("n_samples", 1000)
        n_features = params.get("n_features", 5)
        n_classes = params.get("n_classes", 2)
        n_informative = min(params.get("n_informative", 3), n_features)
        n_redundant = min(params.get("n_redundant", 1), n_features - n_informative)
        noise = params.get("noise", 0.1)
        class_sep = params.get("class_sep", 1.0)
        nan_ratio = params.get("nan_ratio", 0.0)
        seed = params.get("seed", context.global_seed or 42)
        
        try:
            np.random.seed(seed)
            
            # Generate data based on mode
            if mode == "classification":
                X, y = make_classification(
                    n_samples=n_samples,
                    n_features=n_features,
                    n_informative=n_informative,
                    n_redundant=n_redundant,
                    n_classes=n_classes,
                    class_sep=class_sep,
                    random_state=seed,
                    flip_y=noise
                )
                
            elif mode == "regression":
                X, y = make_regression(
                    n_samples=n_samples,
                    n_features=n_features,
                    n_informative=n_informative,
                    noise=noise * 100,
                    random_state=seed
                )
                
            elif mode == "blobs":
                X, y = make_blobs(
                    n_samples=n_samples,
                    n_features=n_features,
                    centers=n_classes,
                    cluster_std=noise * 5,
                    random_state=seed
                )
                
            elif mode == "moons":
                X, y = make_moons(
                    n_samples=n_samples,
                    noise=noise,
                    random_state=seed
                )
                
            elif mode == "circles":
                X, y = make_circles(
                    n_samples=n_samples,
                    noise=noise,
                    factor=0.5,
                    random_state=seed
                )
                
            else:
                return NodeResult(error=f"Unknown mode: {mode}")
            
            # Create DataFrame
            feature_names = [f"feature_{i}" for i in range(X.shape[1])]
            df = pd.DataFrame(X, columns=feature_names)
            df["target"] = y
            
            # Add missing values if requested
            if nan_ratio > 0:
                mask = np.random.random(df.shape) < nan_ratio
                df = df.mask(mask)
            
            # Generate metadata
            metadata = {
                "mode": mode,
                "rows": len(df),
                "columns": len(df.columns),
                "n_features": n_features,
                "n_classes": n_classes if mode in ["classification", "blobs"] else None,
                "seed": seed,
                "noise": noise,
                "nan_ratio": nan_ratio
            }
            
            # Generate preview
            preview = {
                "head": df.head(10).to_dict(orient="records"),
                "shape": df.shape,
                "target_distribution": df["target"].value_counts().to_dict() if mode in ["classification", "blobs", "moons", "circles"] else None
            }
            
            return NodeResult(
                outputs={"table": df, "metadata": metadata},
                metadata=metadata,
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to generate synthetic data: {str(e)}")


@register_node
class CustomInputNode(NodeExecutor):
    """Create custom table data manually with visual editor."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="data.custom_input",
            label="Custom Table",
            category="sources",
            description="Create table data visually - click 'Edit Table' to start. Numeric inputs are written to the first available columns (Input 1 → Column 1, Input 2 → Column 2, etc.). Each execution adds a new row.",
            icon="✏️",
            color="#FF9800",
            inputs=[
                PortSpec(name="input_1", type=PortType.ANY, label="Input 1", required=False),
                PortSpec(name="input_2", type=PortType.ANY, label="Input 2", required=False),
                PortSpec(name="input_3", type=PortType.ANY, label="Input 3", required=False),
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Table")
            ],
            params=[
                ParamSpec(
                    name="table_data",
                    type=ParamType.STRING,
                    label="Table Data (Internal)",
                    default='{"columns":["Column1","Column2","Column3"],"data":[]}',
                    description="Internal storage for table data"
                ),
                ParamSpec(
                    name="reset_on_execute",
                    type=ParamType.BOOLEAN,
                    label="Reset on Execute",
                    default=False,
                    description="Clear accumulated data when workflow is executed"
                )
            ],
            cache_policy=CachePolicy.NEVER
        ))
        self.accumulated_data = {}  # Store accumulated data per node instance
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Create custom table from stored data and optional inputs."""
        try:
            import json
            
            node_id = id(self)  # Use object id as key
            table_data_str = context.params.get("table_data", '{"columns":["Column1","Column2","Column3"],"data":[]}')
            reset_on_execute = context.params.get("reset_on_execute", False)
            
            # Parse stored data
            table_data = json.loads(table_data_str)
            columns = table_data.get("columns", ["Column1", "Column2", "Column3"])
            base_data = table_data.get("data", [])
            
            # Initialize or reset accumulated data
            if node_id not in self.accumulated_data or reset_on_execute:
                # Start with base data from table_data parameter
                self.accumulated_data[node_id] = base_data.copy() if base_data else []
            
            # Process input connections - extract numeric values
            input_values = []
            for input_key in ["input_1", "input_2", "input_3"]:
                if input_key in context.inputs:
                    input_data = context.inputs[input_key]
                    # Extract value from input
                    if isinstance(input_data, pd.DataFrame):
                        # Get first value from first numeric column
                        numeric_cols = input_data.select_dtypes(include=[np.number]).columns
                        if len(numeric_cols) > 0:
                            value = float(input_data[numeric_cols[0]].iloc[0])
                            # Replace inf/nan with None
                            if np.isinf(value) or np.isnan(value):
                                value = None
                            input_values.append(value)
                    elif isinstance(input_data, (int, float)):
                        value = float(input_data)
                        # Replace inf/nan with None
                        if np.isinf(value) or np.isnan(value):
                            value = None
                        input_values.append(value)
            
            # Add input values as a new row to accumulated data
            if input_values:
                # Use the first N columns for the N input values
                target_columns = columns[:len(input_values)]
                
                # Create a new row with input values in the first N columns
                new_row = {}
                for i, value in enumerate(input_values):
                    if i < len(target_columns):
                        new_row[target_columns[i]] = value
                
                # Fill remaining columns with empty values
                for col in columns:
                    if col not in new_row:
                        new_row[col] = ""
                
                # Add to accumulated data
                self.accumulated_data[node_id].append(new_row)
            
            # Create DataFrame from accumulated data
            if not self.accumulated_data[node_id] or len(self.accumulated_data[node_id]) == 0:
                # Create empty DataFrame with one row for editing
                df = pd.DataFrame([{col: "" for col in columns}], columns=columns)
            else:
                df = pd.DataFrame(self.accumulated_data[node_id], columns=columns)
            
            # Auto-convert numeric types
            for col in df.columns:
                try:
                    # Try to convert to numeric, keep original if fails
                    converted = pd.to_numeric(df[col], errors='coerce')
                    if not converted.isna().all():
                        df[col] = pd.to_numeric(df[col], errors='ignore')
                except:
                    pass
            
            # Preview - replace NaN/inf with None for JSON
            preview_df = df.head(100).replace([np.inf, -np.inf], np.nan).fillna(value=None)
            preview = {
                "type": "table",
                "columns": list(df.columns),
                "head": preview_df.to_dict(orient="records"),
                "shape": df.shape,
                "editable": True,  # Flag to show edit button
                "message": "Click 'Edit Table' button to create/modify data"
            }
            
            return NodeResult(
                outputs={"table": df},
                metadata={
                    "n_rows": len(df),
                    "n_cols": len(df.columns),
                    "columns": list(df.columns),
                    "editable": True
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to create custom table: {str(e)}")
