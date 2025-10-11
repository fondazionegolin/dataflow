"""Data transformation nodes: filtering, selection, transformation, splitting."""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from typing import List, Optional

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class SelectColumnsNode(NodeExecutor):
    """Select specific columns from a table."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="data.select",
            label="Select Columns",
            category="transform",
            description="Select or exclude specific columns from a table",
            icon="🔍",
            color="#2196F3",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Output Table")
            ],
            params=[
                ParamSpec(
                    name="mode",
                    type=ParamType.SELECT,
                    label="Mode",
                    default="include",
                    options=["include", "exclude"]
                ),
                ParamSpec(
                    name="columns",
                    type=ParamType.MULTI_SELECT,
                    label="Columns",
                    default=[],
                    description="Columns to include or exclude"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Select columns."""
        df = context.inputs.get("table")
        mode = context.params.get("mode", "include")
        columns = context.params.get("columns", [])
        
        try:
            if mode == "include":
                result_df = df[columns]
            else:  # exclude
                result_df = df.drop(columns=columns)
            
            preview = {
                "shape": result_df.shape,
                "columns": result_df.columns.tolist(),
                "head": result_df.head(10).to_dict(orient="records")
            }
            
            return NodeResult(
                outputs={"table": result_df},
                metadata={"rows": len(result_df), "columns": len(result_df.columns)},
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to select columns: {str(e)}")


@register_node
class FilterRowsNode(NodeExecutor):
    """Filter rows based on expressions."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="data.filter",
            label="Filter Rows",
            category="transform",
            description="Filter rows using pandas query expressions",
            icon="⚡",
            color="#FF9800",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Filtered Table")
            ],
            params=[
                ParamSpec(
                    name="expression",
                    type=ParamType.CODE,
                    label="Filter Expression",
                    default="",
                    language="python",
                    description="e.g., 'age > 25 & city == \"NYC\"'"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Filter rows."""
        df = context.inputs.get("table")
        expression = context.params.get("expression", "")
        
        if not expression or expression.strip() == "":
            return NodeResult(
                outputs={"table": df},
                metadata={"rows": len(df), "filtered": 0}
            )
        
        try:
            result_df = df.query(expression)
            filtered_count = len(df) - len(result_df)
            
            preview = {
                "shape": result_df.shape,
                "head": result_df.head(10).to_dict(orient="records"),
                "filtered_count": filtered_count
            }
            
            return NodeResult(
                outputs={"table": result_df},
                metadata={
                    "rows": len(result_df),
                    "filtered": filtered_count,
                    "expression": expression
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to filter rows: {str(e)}")


@register_node
class TransformColumnsNode(NodeExecutor):
    """Transform columns with various operations."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="data.transform",
            label="Transform Columns",
            category="transform",
            description="Apply transformations to columns (scaling, encoding, etc.)",
            icon="🔧",
            color="#00BCD4",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Transformed Table")
            ],
            params=[
                ParamSpec(
                    name="operation",
                    type=ParamType.SELECT,
                    label="Operation",
                    default="standardize",
                    options=["standardize", "minmax", "robust", "log", "sqrt", "fillna"]
                ),
                ParamSpec(
                    name="columns",
                    type=ParamType.MULTI_SELECT,
                    label="Target Columns",
                    default=[]
                ),
                ParamSpec(
                    name="fill_value",
                    type=ParamType.STRING,
                    label="Fill Value (for fillna)",
                    default="mean",
                    description="mean, median, mode, or a specific value"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Transform columns."""
        df = context.inputs.get("table").copy()
        operation = context.params.get("operation", "standardize")
        columns = context.params.get("columns", [])
        fill_value = context.params.get("fill_value", "mean")
        
        if not columns:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        try:
            if operation == "standardize":
                scaler = StandardScaler()
                df[columns] = scaler.fit_transform(df[columns])
                
            elif operation == "minmax":
                scaler = MinMaxScaler()
                df[columns] = scaler.fit_transform(df[columns])
                
            elif operation == "robust":
                scaler = RobustScaler()
                df[columns] = scaler.fit_transform(df[columns])
                
            elif operation == "log":
                for col in columns:
                    df[col] = np.log1p(df[col])
                    
            elif operation == "sqrt":
                for col in columns:
                    df[col] = np.sqrt(np.abs(df[col]))
                    
            elif operation == "fillna":
                for col in columns:
                    if fill_value == "mean":
                        df[col].fillna(df[col].mean(), inplace=True)
                    elif fill_value == "median":
                        df[col].fillna(df[col].median(), inplace=True)
                    elif fill_value == "mode":
                        df[col].fillna(df[col].mode()[0] if len(df[col].mode()) > 0 else 0, inplace=True)
                    else:
                        df[col].fillna(float(fill_value), inplace=True)
            
            preview = {
                "shape": df.shape,
                "head": df.head(10).to_dict(orient="records"),
                "transformed_columns": columns
            }
            
            return NodeResult(
                outputs={"table": df},
                metadata={
                    "operation": operation,
                    "columns": columns
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to transform columns: {str(e)}")


@register_node
class TrainTestSplitNode(NodeExecutor):
    """Split data into training and testing sets."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="data.split",
            label="Train/Test Split",
            category="transform",
            description="Split dataset into training and testing sets",
            icon="✂️",
            color="#E91E63",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="train", type=PortType.TABLE, label="Training Set"),
                PortSpec(name="test", type=PortType.TABLE, label="Testing Set")
            ],
            params=[
                ParamSpec(
                    name="test_size",
                    type=ParamType.SLIDER,
                    label="Test Size Ratio",
                    default=0.2,
                    min=0.1,
                    max=0.5,
                    step=0.05
                ),
                ParamSpec(
                    name="stratify_column",
                    type=ParamType.STRING,
                    label="Stratify by Column (optional)",
                    default="",
                    description="Column name for stratified split"
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
        """Split data."""
        df = context.inputs.get("table")
        test_size = context.params.get("test_size", 0.2)
        stratify_column = context.params.get("stratify_column", "")
        seed = context.params.get("seed", context.global_seed or 42)
        
        try:
            stratify = None
            if stratify_column and stratify_column in df.columns:
                stratify = df[stratify_column]
            
            train_df, test_df = train_test_split(
                df,
                test_size=test_size,
                random_state=seed,
                stratify=stratify
            )
            
            preview = {
                "train_shape": train_df.shape,
                "test_shape": test_df.shape,
                "train_head": train_df.head(5).to_dict(orient="records"),
                "test_head": test_df.head(5).to_dict(orient="records"),
                "columns": train_df.columns.tolist()  # Add columns for downstream nodes
            }
            
            return NodeResult(
                outputs={"train": train_df, "test": test_df},
                metadata={
                    "train_rows": len(train_df),
                    "test_rows": len(test_df),
                    "test_ratio": test_size
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to split data: {str(e)}")


@register_node
class DropNANode(NodeExecutor):
    """Drop rows or columns with missing values."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="data.dropna",
            label="Drop Missing Values",
            category="transform",
            description="Remove rows or columns with missing values",
            icon="🗑️",
            color="#795548",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Cleaned Table")
            ],
            params=[
                ParamSpec(
                    name="axis",
                    type=ParamType.SELECT,
                    label="Drop",
                    default="rows",
                    options=["rows", "columns"]
                ),
                ParamSpec(
                    name="how",
                    type=ParamType.SELECT,
                    label="How",
                    default="any",
                    options=["any", "all"],
                    description="'any': drop if any NA, 'all': drop if all NA"
                ),
                ParamSpec(
                    name="threshold",
                    type=ParamType.INTEGER,
                    label="Threshold (optional)",
                    default=0,
                    min=0,
                    description="Minimum non-NA values required (0 = use 'how')"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Drop missing values."""
        df = context.inputs.get("table")
        axis = 0 if context.params.get("axis", "rows") == "rows" else 1
        how = context.params.get("how", "any")
        threshold = context.params.get("threshold", 0)
        
        try:
            original_shape = df.shape
            
            if threshold > 0:
                result_df = df.dropna(axis=axis, thresh=threshold)
            else:
                result_df = df.dropna(axis=axis, how=how)
            
            dropped = original_shape[axis] - result_df.shape[axis]
            
            preview = {
                "original_shape": original_shape,
                "new_shape": result_df.shape,
                "dropped": dropped,
                "head": result_df.head(10).to_dict(orient="records")
            }
            
            return NodeResult(
                outputs={"table": result_df},
                metadata={
                    "dropped": dropped,
                    "axis": "rows" if axis == 0 else "columns"
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to drop NA: {str(e)}")


@register_node
class SliceRowsNode(NodeExecutor):
    """Select a range of rows by index."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="data.slice",
            label="Slice Rows",
            category="transform",
            description="Select rows by index range (e.g., rows 10-20)",
            icon="✂️",
            color="#9C27B0",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Sliced Table")
            ],
            params=[
                ParamSpec(
                    name="start",
                    type=ParamType.INTEGER,
                    label="Start Row",
                    default=0,
                    min=0,
                    description="First row to include (0-indexed)"
                ),
                ParamSpec(
                    name="end",
                    type=ParamType.INTEGER,
                    label="End Row",
                    default=10,
                    min=1,
                    description="Last row to include (exclusive, like Python slicing)"
                ),
                ParamSpec(
                    name="step",
                    type=ParamType.INTEGER,
                    label="Step",
                    default=1,
                    min=1,
                    description="Take every Nth row (1 = all rows)"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Slice rows by index."""
        df = context.inputs.get("table")
        start = context.params.get("start", 0)
        end = context.params.get("end", 10)
        step = context.params.get("step", 1)
        
        try:
            # Validate parameters
            if start < 0:
                start = 0
            if end > len(df):
                end = len(df)
            if start >= end:
                return NodeResult(error=f"Start row ({start}) must be less than end row ({end})")
            
            # Slice the dataframe
            result_df = df.iloc[start:end:step].copy()
            
            print(f"\n✂️ Sliced Rows:")
            print(f"   Original rows: {len(df)}")
            print(f"   Range: {start} to {end} (step {step})")
            print(f"   Selected rows: {len(result_df)}")
            
            preview = {
                "shape": result_df.shape,
                "head": result_df.head(10).to_dict(orient="records"),
                "original_rows": len(df),
                "selected_rows": len(result_df)
            }
            
            return NodeResult(
                outputs={"table": result_df},
                metadata={
                    "original_rows": len(df),
                    "selected_rows": len(result_df),
                    "start": start,
                    "end": end,
                    "step": step
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to slice rows: {str(e)}")


@register_node
class SortColumnsNode(NodeExecutor):
    """Reorder table columns with drag & drop interface."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="data.sort_columns",
            label="Sort Columns",
            category="transform",
            description="Reorder table columns by dragging them in the desired order",
            icon="↔️",
            color="#9C27B0",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Output Table")
            ],
            params=[
                ParamSpec(
                    name="column_order",
                    type=ParamType.MULTI_SELECT,
                    label="Column Order",
                    default=[],
                    description="Drag columns to reorder them (order from top to bottom)"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Reorder columns based on specified order."""
        try:
            df = context.inputs.get("table")
            if df is None or df.empty:
                return NodeResult(error="No input table provided")
            
            column_order = context.params.get("column_order", [])
            
            # If no order specified, return original
            if not column_order:
                column_order = df.columns.tolist()
            
            # Validate all columns exist
            missing_cols = set(column_order) - set(df.columns)
            if missing_cols:
                return NodeResult(error=f"Columns not found in input: {missing_cols}")
            
            # Add any columns not in the order list at the end
            remaining_cols = [col for col in df.columns if col not in column_order]
            final_order = column_order + remaining_cols
            
            # Reorder columns
            result_df = df[final_order]
            
            preview = {
                "head": result_df.head(10).to_dict(orient="records"),
                "shape": result_df.shape,
                "columns": result_df.columns.tolist(),
                "dtypes": {col: str(dtype) for col, dtype in result_df.dtypes.items()}
            }
            
            return NodeResult(
                outputs={"table": result_df},
                metadata={
                    "original_order": df.columns.tolist(),
                    "new_order": final_order,
                    "columns_reordered": len(column_order)
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to sort columns: {str(e)}")
