"""Mathematical operation nodes for numeric computations."""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any
import json

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType, 
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


def clean_for_json(obj: Any) -> Any:
    """Recursively clean object for JSON serialization by replacing inf/nan with None."""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
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


@register_node
class MathOperationNode(NodeExecutor):
    """Perform mathematical operations on numeric inputs."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.operation",
            label="Math Operation",
            category="mathematics",
            description="Perform mathematical operations: addition, subtraction, multiplication, division, power, root, percentage, etc.",
            icon="🔢",
            color="#FF6B6B",
            inputs=[
                PortSpec(name="input_a", type=PortType.ANY, label="Input A"),
                PortSpec(name="input_b", type=PortType.ANY, label="Input B", required=False)
            ],
            outputs=[
                PortSpec(name="result", type=PortType.ANY, label="Result")
            ],
            params=[
                ParamSpec(
                    name="operation",
                    type=ParamType.SELECT,
                    label="Operation",
                    default="add",
                    options=[
                        {"value": "add", "label": "Addition (+)"},
                        {"value": "subtract", "label": "Subtraction (-)"},
                        {"value": "multiply", "label": "Multiplication (×)"},
                        {"value": "divide", "label": "Division (÷)"},
                        {"value": "power", "label": "Power (^)"},
                        {"value": "root", "label": "Root (√)"},
                        {"value": "modulo", "label": "Modulo (%)"},
                        {"value": "percentage", "label": "Percentage"},
                        {"value": "absolute", "label": "Absolute Value"},
                        {"value": "negate", "label": "Negate"},
                        {"value": "reciprocal", "label": "Reciprocal (1/x)"},
                        {"value": "square", "label": "Square (x²)"},
                        {"value": "cube", "label": "Cube (x³)"},
                        {"value": "sqrt", "label": "Square Root"},
                        {"value": "exp", "label": "Exponential (e^x)"},
                        {"value": "log", "label": "Natural Log (ln)"},
                        {"value": "log10", "label": "Log Base 10"},
                        {"value": "sin", "label": "Sine"},
                        {"value": "cos", "label": "Cosine"},
                        {"value": "tan", "label": "Tangent"},
                        {"value": "floor", "label": "Floor"},
                        {"value": "ceil", "label": "Ceiling"},
                        {"value": "round", "label": "Round"}
                    ],
                    required=True
                ),
                ParamSpec(
                    name="decimal_places",
                    type=ParamType.INTEGER,
                    label="Decimal Places",
                    default=2,
                    min=0,
                    max=10,
                    description="Number of decimal places for rounding"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Execute mathematical operation."""
        try:
            operation = context.params.get("operation", "add")
            decimal_places = context.params.get("decimal_places", 2)
            
            # Get inputs
            input_a = context.inputs.get("input_a")
            input_b = context.inputs.get("input_b")
            
            if input_a is None:
                return NodeResult(error="Input A is required")
            
            # Convert inputs to numeric values
            def to_numeric(val):
                """Convert various input types to numeric."""
                if isinstance(val, (int, float)):
                    return val
                elif isinstance(val, pd.DataFrame):
                    # If DataFrame, try to extract single value or use first numeric column
                    if val.shape == (1, 1):
                        return float(val.iloc[0, 0])
                    else:
                        # Use first numeric column
                        numeric_cols = val.select_dtypes(include=[np.number]).columns
                        if len(numeric_cols) > 0:
                            return val[numeric_cols[0]]
                        return val.iloc[:, 0]
                elif isinstance(val, pd.Series):
                    return val
                elif isinstance(val, np.ndarray):
                    return val
                elif isinstance(val, str):
                    try:
                        return float(val)
                    except:
                        return None
                return val
            
            a = to_numeric(input_a)
            b = to_numeric(input_b) if input_b is not None else None
            
            if a is None:
                return NodeResult(error="Could not convert Input A to numeric value")
            
            # Perform operation
            result = None
            
            # Binary operations (require both inputs)
            if operation in ["add", "subtract", "multiply", "divide", "power", "root", "modulo", "percentage"]:
                if b is None:
                    return NodeResult(error=f"Operation '{operation}' requires Input B")
                
                if operation == "add":
                    result = a + b
                elif operation == "subtract":
                    result = a - b
                elif operation == "multiply":
                    result = a * b
                elif operation == "divide":
                    if isinstance(b, (pd.Series, np.ndarray)):
                        result = a / np.where(b == 0, np.nan, b)
                    else:
                        if b == 0:
                            return NodeResult(error="Division by zero")
                        result = a / b
                elif operation == "power":
                    result = np.power(a, b)
                elif operation == "root":
                    result = np.power(a, 1.0 / b)
                elif operation == "modulo":
                    result = np.mod(a, b)
                elif operation == "percentage":
                    result = (a / b) * 100
            
            # Unary operations (only need input A)
            else:
                if operation == "absolute":
                    result = np.abs(a)
                elif operation == "negate":
                    result = -a
                elif operation == "reciprocal":
                    if isinstance(a, (pd.Series, np.ndarray)):
                        result = 1.0 / np.where(a == 0, np.nan, a)
                    else:
                        if a == 0:
                            return NodeResult(error="Division by zero (reciprocal of 0)")
                        result = 1.0 / a
                elif operation == "square":
                    result = np.power(a, 2)
                elif operation == "cube":
                    result = np.power(a, 3)
                elif operation == "sqrt":
                    result = np.sqrt(a)
                elif operation == "exp":
                    result = np.exp(a)
                elif operation == "log":
                    result = np.log(a)
                elif operation == "log10":
                    result = np.log10(a)
                elif operation == "sin":
                    result = np.sin(a)
                elif operation == "cos":
                    result = np.cos(a)
                elif operation == "tan":
                    result = np.tan(a)
                elif operation == "floor":
                    result = np.floor(a)
                elif operation == "ceil":
                    result = np.ceil(a)
                elif operation == "round":
                    result = np.round(a, decimal_places)
            
            if result is None:
                return NodeResult(error=f"Unknown operation: {operation}")
            
            # Round result if it's a scalar and handle inf/nan
            if isinstance(result, (int, float, np.integer, np.floating)):
                result_float = float(result)
                # Check for inf or nan
                if np.isinf(result_float) or np.isnan(result_float):
                    return NodeResult(error=f"Operation produced invalid value: {result_float}")
                result = round(result_float, decimal_places)
            
            # Handle inf/nan in arrays/series
            if isinstance(result, (pd.Series, pd.DataFrame, np.ndarray)):
                # Replace inf and nan with None
                if isinstance(result, pd.DataFrame):
                    result = result.replace([np.inf, -np.inf], np.nan)
                elif isinstance(result, pd.Series):
                    result = result.replace([np.inf, -np.inf], np.nan)
                elif isinstance(result, np.ndarray):
                    result = np.where(np.isinf(result), np.nan, result)
            
            # Prepare output based on result type
            if isinstance(result, (int, float, np.integer, np.floating)):
                # Scalar result - create a simple DataFrame
                result_df = pd.DataFrame({"result": [result]})
                preview = {
                    "type": "scalar",
                    "value": result,
                    "operation": operation,
                    "head": [{"result": result}]
                }
            elif isinstance(result, pd.Series):
                # Series result - convert to DataFrame
                result_df = result.to_frame(name="result")
                # Replace NaN with None for JSON serialization
                preview_df = result_df.head(10).fillna(value=None)
                preview = {
                    "type": "series",
                    "head": preview_df.to_dict(orient="records"),
                    "shape": result_df.shape,
                    "operation": operation
                }
            elif isinstance(result, pd.DataFrame):
                result_df = result
                # Replace NaN with None for JSON serialization
                preview_df = result_df.head(10).fillna(value=None)
                preview = {
                    "type": "dataframe",
                    "head": preview_df.to_dict(orient="records"),
                    "shape": result_df.shape,
                    "operation": operation
                }
            else:
                # Array or other - convert to DataFrame
                result_df = pd.DataFrame({"result": result})
                # Replace NaN with None for JSON serialization
                preview_df = result_df.head(10).fillna(value=None)
                preview = {
                    "type": "array",
                    "head": preview_df.to_dict(orient="records"),
                    "shape": result_df.shape,
                    "operation": operation
                }
            
            # Clean metadata and preview from inf/nan
            metadata = clean_for_json({
                "operation": operation,
                "result_type": type(result).__name__,
                "shape": result_df.shape if hasattr(result_df, 'shape') else None
            })
            
            return NodeResult(
                outputs={"result": result_df},
                metadata=metadata,
                preview=clean_for_json(preview)
            )
            
        except Exception as e:
            return NodeResult(error=f"Math operation failed: {str(e)}")


@register_node
class NumericInputNode(NodeExecutor):
    """Simple numeric input node for entering numbers."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.numeric_input",
            label="Numeric Input",
            category="mathematics",
            description="Enter a numeric value to use in calculations",
            icon="🔢",
            color="#4ECDC4",
            inputs=[],
            outputs=[
                PortSpec(name="value", type=PortType.ANY, label="Value")
            ],
            params=[
                ParamSpec(
                    name="value",
                    type=ParamType.NUMBER,
                    label="Value",
                    default=0,
                    description="Numeric value to output"
                ),
                ParamSpec(
                    name="label",
                    type=ParamType.STRING,
                    label="Label",
                    default="",
                    description="Optional label for this value"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Output the numeric value."""
        try:
            value = context.params.get("value", 0)
            label = context.params.get("label", "")
            
            # Convert to float
            try:
                numeric_value = float(value)
            except:
                return NodeResult(error=f"Invalid numeric value: {value}")
            
            # Check for invalid values
            if np.isinf(numeric_value) or np.isnan(numeric_value):
                return NodeResult(error=f"Invalid numeric value: {numeric_value}")
            
            # Create DataFrame with single value
            column_name = label if label else "value"
            df = pd.DataFrame({column_name: [numeric_value]})
            
            preview = {
                "type": "scalar",
                "value": numeric_value,
                "label": label,
                "head": [{column_name: numeric_value}]
            }
            
            return NodeResult(
                outputs={"value": df},
                metadata=clean_for_json({
                    "value": numeric_value,
                    "label": label,
                    "type": "numeric_input"
                }),
                preview=clean_for_json(preview)
            )
            
        except Exception as e:
            return NodeResult(error=f"Numeric input failed: {str(e)}")


@register_node
class MathResultNode(NodeExecutor):
    """Extract and display result values from calculations."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.result",
            label="Math Result",
            category="mathematics",
            description="Extract and display numeric results from calculations",
            icon="📊",
            color="#95E1D3",
            inputs=[
                PortSpec(name="input", type=PortType.ANY, label="Input")
            ],
            outputs=[
                PortSpec(name="value", type=PortType.ANY, label="Value"),
                PortSpec(name="table", type=PortType.TABLE, label="Table", required=False)
            ],
            params=[
                ParamSpec(
                    name="extract_mode",
                    type=ParamType.SELECT,
                    label="Extract Mode",
                    default="first",
                    options=[
                        {"value": "first", "label": "First Value"},
                        {"value": "last", "label": "Last Value"},
                        {"value": "mean", "label": "Mean"},
                        {"value": "sum", "label": "Sum"},
                        {"value": "min", "label": "Minimum"},
                        {"value": "max", "label": "Maximum"},
                        {"value": "median", "label": "Median"},
                        {"value": "std", "label": "Standard Deviation"},
                        {"value": "all", "label": "All Values"}
                    ]
                ),
                ParamSpec(
                    name="column",
                    type=ParamType.STRING,
                    label="Column",
                    default="",
                    description="Column to extract (leave empty for auto-detect)"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Extract result value."""
        try:
            input_data = context.inputs.get("input")
            extract_mode = context.params.get("extract_mode", "first")
            column = context.params.get("column", "")
            
            if input_data is None:
                return NodeResult(error="Input is required")
            
            # Convert input to DataFrame if needed
            if isinstance(input_data, pd.DataFrame):
                df = input_data
            elif isinstance(input_data, pd.Series):
                df = input_data.to_frame()
            elif isinstance(input_data, (int, float)):
                df = pd.DataFrame({"value": [input_data]})
            elif isinstance(input_data, np.ndarray):
                df = pd.DataFrame({"value": input_data.flatten()})
            else:
                return NodeResult(error=f"Unsupported input type: {type(input_data)}")
            
            # Select column
            if column and column in df.columns:
                series = df[column]
            else:
                # Auto-detect: use first numeric column
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) == 0:
                    return NodeResult(error="No numeric columns found")
                series = df[numeric_cols[0]]
            
            # Extract value based on mode
            if extract_mode == "first":
                result_value = float(series.iloc[0])
            elif extract_mode == "last":
                result_value = float(series.iloc[-1])
            elif extract_mode == "mean":
                result_value = float(series.mean())
            elif extract_mode == "sum":
                result_value = float(series.sum())
            elif extract_mode == "min":
                result_value = float(series.min())
            elif extract_mode == "max":
                result_value = float(series.max())
            elif extract_mode == "median":
                result_value = float(series.median())
            elif extract_mode == "std":
                result_value = float(series.std())
            elif extract_mode == "all":
                result_value = series.tolist()
            else:
                return NodeResult(error=f"Unknown extract mode: {extract_mode}")
            
            # Create output DataFrame
            if extract_mode == "all":
                result_df = pd.DataFrame({"value": result_value})
                display_value = f"{len(result_value)} values"
            else:
                result_df = pd.DataFrame({"value": [result_value]})
                display_value = result_value
            
            # Replace NaN/inf with None for JSON serialization
            preview_df = result_df.head(10).fillna(value=None)
            
            # Calculate statistics safely
            stats = {
                "count": len(series)
            }
            if extract_mode != "all":
                mean_val = float(series.mean())
                min_val = float(series.min())
                max_val = float(series.max())
                stats["mean"] = None if (np.isnan(mean_val) or np.isinf(mean_val)) else mean_val
                stats["min"] = None if (np.isnan(min_val) or np.isinf(min_val)) else min_val
                stats["max"] = None if (np.isnan(max_val) or np.isinf(max_val)) else max_val
            
            preview = {
                "type": "result",
                "extract_mode": extract_mode,
                "value": display_value if not (isinstance(display_value, float) and (np.isnan(display_value) or np.isinf(display_value))) else None,
                "head": preview_df.to_dict(orient="records"),
                "statistics": stats
            }
            
            return NodeResult(
                outputs={"value": result_df, "table": result_df},
                metadata=clean_for_json({
                    "extract_mode": extract_mode,
                    "value": display_value,
                    "source_column": series.name
                }),
                preview=clean_for_json(preview)
            )
            
        except Exception as e:
            return NodeResult(error=f"Result extraction failed: {str(e)}")


@register_node
class MathAggregateNode(NodeExecutor):
    """Aggregate multiple numeric inputs into statistical summaries."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.aggregate",
            label="Math Aggregate",
            category="mathematics",
            description="Combine multiple numeric inputs and compute statistics",
            icon="📈",
            color="#F38181",
            inputs=[
                PortSpec(name="input_a", type=PortType.ANY, label="Input A"),
                PortSpec(name="input_b", type=PortType.ANY, label="Input B", required=False),
                PortSpec(name="input_c", type=PortType.ANY, label="Input C", required=False)
            ],
            outputs=[
                PortSpec(name="result", type=PortType.TABLE, label="Result"),
                PortSpec(name="statistics", type=PortType.PARAMS, label="Statistics")
            ],
            params=[
                ParamSpec(
                    name="combine_mode",
                    type=ParamType.SELECT,
                    label="Combine Mode",
                    default="concatenate",
                    options=[
                        {"value": "concatenate", "label": "Concatenate (Stack)"},
                        {"value": "side_by_side", "label": "Side by Side (Columns)"}
                    ]
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Aggregate inputs."""
        try:
            combine_mode = context.params.get("combine_mode", "concatenate")
            
            # Collect all inputs
            inputs = []
            for key in ["input_a", "input_b", "input_c"]:
                val = context.inputs.get(key)
                if val is not None:
                    # Convert to DataFrame
                    if isinstance(val, pd.DataFrame):
                        inputs.append(val)
                    elif isinstance(val, pd.Series):
                        inputs.append(val.to_frame())
                    elif isinstance(val, (int, float)):
                        inputs.append(pd.DataFrame({"value": [val]}))
                    elif isinstance(val, np.ndarray):
                        inputs.append(pd.DataFrame({"value": val.flatten()}))
            
            if len(inputs) == 0:
                return NodeResult(error="At least one input is required")
            
            # Combine inputs
            if combine_mode == "concatenate":
                result_df = pd.concat(inputs, axis=0, ignore_index=True)
            else:  # side_by_side
                result_df = pd.concat(inputs, axis=1)
                # Rename columns to avoid conflicts
                result_df.columns = [f"input_{i+1}" for i in range(len(result_df.columns))]
            
            # Compute statistics safely
            numeric_cols = result_df.select_dtypes(include=[np.number])
            
            def safe_stat_dict(series_dict):
                """Convert stat dict, replacing inf/nan with None"""
                return {k: (None if (np.isnan(v) or np.isinf(v)) else v) for k, v in series_dict.items()}
            
            statistics = {
                "count": int(len(result_df)),
                "columns": len(result_df.columns),
                "mean": safe_stat_dict(numeric_cols.mean().to_dict()) if len(numeric_cols.columns) > 0 else {},
                "sum": safe_stat_dict(numeric_cols.sum().to_dict()) if len(numeric_cols.columns) > 0 else {},
                "min": safe_stat_dict(numeric_cols.min().to_dict()) if len(numeric_cols.columns) > 0 else {},
                "max": safe_stat_dict(numeric_cols.max().to_dict()) if len(numeric_cols.columns) > 0 else {},
                "std": safe_stat_dict(numeric_cols.std().to_dict()) if len(numeric_cols.columns) > 0 else {}
            }
            
            # Replace NaN/inf with None for JSON serialization
            preview_df = result_df.head(10).fillna(value=None)
            
            preview = {
                "type": "aggregate",
                "head": preview_df.to_dict(orient="records"),
                "shape": result_df.shape,
                "statistics": statistics
            }
            
            return NodeResult(
                outputs={"result": result_df, "statistics": statistics},
                metadata=clean_for_json({
                    "combine_mode": combine_mode,
                    "n_inputs": len(inputs),
                    "shape": result_df.shape
                }),
                preview=clean_for_json(preview)
            )
            
        except Exception as e:
            return NodeResult(error=f"Aggregation failed: {str(e)}")
