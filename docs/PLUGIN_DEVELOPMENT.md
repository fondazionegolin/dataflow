# Plugin Development Guide

## Creating Custom Nodes

DataFlow Platform supports custom nodes through a plugin system. This guide shows you how to create your own nodes.

## Basic Node Structure

```python
from backend.core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from backend.core.registry import NodeExecutor, register_node

@register_node
class MyCustomNode(NodeExecutor):
    """My custom node description."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="custom.my_node",
            label="My Custom Node",
            category="custom",
            description="Does something amazing",
            icon="⭐",
            color="#FF6B6B",
            inputs=[
                PortSpec(
                    name="input_data",
                    type=PortType.TABLE,
                    label="Input Data",
                    required=True
                )
            ],
            outputs=[
                PortSpec(
                    name="output_data",
                    type=PortType.TABLE,
                    label="Output Data"
                )
            ],
            params=[
                ParamSpec(
                    name="threshold",
                    type=ParamType.SLIDER,
                    label="Threshold",
                    default=0.5,
                    min=0.0,
                    max=1.0,
                    step=0.1
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Execute the node logic."""
        # Get inputs
        df = context.inputs.get("input_data")
        threshold = context.params.get("threshold", 0.5)
        
        try:
            # Your custom logic here
            result_df = df[df['value'] > threshold]
            
            # Return result
            return NodeResult(
                outputs={"output_data": result_df},
                metadata={"rows_filtered": len(df) - len(result_df)},
                preview={"head": result_df.head(10).to_dict(orient="records")}
            )
        except Exception as e:
            return NodeResult(error=f"Failed to process: {str(e)}")
```

## Node Specification Components

### 1. Node Type and Metadata

```python
type="category.node_name"  # Unique identifier
label="Display Name"        # Shown in UI
category="category_name"    # Groups nodes in palette
description="What it does"  # Tooltip text
icon="🎯"                   # Emoji or icon
color="#FF6B6B"            # Hex color for node
```

### 2. Input Ports

Define what data the node accepts:

```python
inputs=[
    PortSpec(
        name="table",           # Port identifier
        type=PortType.TABLE,    # Data type
        label="Input Table",    # Display name
        required=True,          # Is it required?
        description="..."       # Help text
    )
]
```

Available port types:
- `PortType.TABLE` - pandas DataFrame
- `PortType.SERIES` - 1D array
- `PortType.MODEL` - ML model
- `PortType.METRICS` - Dictionary
- `PortType.PARAMS` - Parameters
- `PortType.ARRAY_3D` - 3D array
- `PortType.ANY` - Any type

### 3. Output Ports

Define what data the node produces:

```python
outputs=[
    PortSpec(
        name="result",
        type=PortType.TABLE,
        label="Result Table"
    )
]
```

### 4. Parameters

Configure node behavior:

```python
params=[
    # Text input
    ParamSpec(
        name="text_param",
        type=ParamType.STRING,
        label="Text Input",
        default="default value"
    ),
    
    # Number input
    ParamSpec(
        name="number_param",
        type=ParamType.NUMBER,
        label="Number",
        default=1.0,
        min=0.0,
        max=10.0
    ),
    
    # Slider
    ParamSpec(
        name="slider_param",
        type=ParamType.SLIDER,
        label="Slider",
        default=0.5,
        min=0.0,
        max=1.0,
        step=0.1
    ),
    
    # Dropdown
    ParamSpec(
        name="select_param",
        type=ParamType.SELECT,
        label="Choose One",
        default="option1",
        options=["option1", "option2", "option3"]
    ),
    
    # Boolean toggle
    ParamSpec(
        name="bool_param",
        type=ParamType.BOOLEAN,
        label="Enable Feature",
        default=True
    ),
    
    # Code editor
    ParamSpec(
        name="code_param",
        type=ParamType.CODE,
        label="Custom Code",
        language="python",
        default="# Your code here"
    )
]
```

### 5. Cache Policy

Control caching behavior:

```python
cache_policy=CachePolicy.AUTO    # Cache automatically (default)
cache_policy=CachePolicy.NEVER   # Never cache (e.g., for plots)
cache_policy=CachePolicy.MANUAL  # User controls caching
```

## Implementing Node Logic

### The `run` Method

```python
async def run(self, context: NodeContext) -> NodeResult:
    """
    Execute node logic.
    
    Args:
        context: Contains inputs, params, and execution context
        
    Returns:
        NodeResult with outputs, metadata, and optional preview
    """
    # 1. Extract inputs
    input_data = context.inputs.get("input_name")
    
    # 2. Extract parameters
    param_value = context.params.get("param_name", default_value)
    
    # 3. Access global seed if needed
    seed = context.global_seed
    
    # 4. Perform computation
    try:
        result = process_data(input_data, param_value)
        
        # 5. Return result
        return NodeResult(
            outputs={
                "output_name": result
            },
            metadata={
                "computation_info": "..."
            },
            preview={
                "summary": "...",
                "visualization": "..."
            }
        )
    except Exception as e:
        # 6. Handle errors
        return NodeResult(error=str(e))
```

### Context Object

```python
context.node_id          # Current node ID
context.inputs           # Dict of input data
context.params           # Dict of parameters
context.cache_dir        # Cache directory path
context.global_seed      # Global random seed
```

### Result Object

```python
NodeResult(
    outputs={...},           # Output data (required)
    metadata={...},          # Execution metadata
    preview={...},           # Preview for UI (optional)
    error="error message"    # Error if failed (optional)
)
```

## Example: Statistical Summary Node

```python
@register_node
class StatisticalSummaryNode(NodeExecutor):
    """Generate statistical summary of data."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="stats.summary",
            label="Statistical Summary",
            category="transform",
            description="Generate descriptive statistics",
            icon="📊",
            color="#4CAF50",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Data")
            ],
            outputs=[
                PortSpec(name="summary", type=PortType.TABLE, label="Summary"),
                PortSpec(name="metrics", type=PortType.METRICS, label="Metrics")
            ],
            params=[
                ParamSpec(
                    name="percentiles",
                    type=ParamType.MULTI_SELECT,
                    label="Percentiles",
                    default=[0.25, 0.5, 0.75],
                    options=[0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
                )
            ]
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        df = context.inputs.get("table")
        percentiles = context.params.get("percentiles", [0.25, 0.5, 0.75])
        
        try:
            # Generate summary
            summary = df.describe(percentiles=percentiles)
            
            # Calculate additional metrics
            metrics = {
                "n_rows": len(df),
                "n_columns": len(df.columns),
                "missing_values": df.isnull().sum().sum(),
                "memory_usage_mb": df.memory_usage(deep=True).sum() / 1024**2
            }
            
            return NodeResult(
                outputs={
                    "summary": summary,
                    "metrics": metrics
                },
                metadata=metrics,
                preview={
                    "summary_table": summary.to_dict(),
                    "metrics": metrics
                }
            )
        except Exception as e:
            return NodeResult(error=f"Failed to generate summary: {str(e)}")
```

## Loading Custom Nodes

### Option 1: Add to `backend/nodes/`

Create a new file in `backend/nodes/` and import it in `backend/main.py`:

```python
# backend/nodes/my_nodes.py
from backend.core.registry import register_node
# ... your node definitions

# backend/main.py
import nodes.my_nodes  # Add this line
```

### Option 2: Plugin Package

Create a separate package:

```
my_plugin/
├── __init__.py
├── nodes.py
└── setup.py
```

```python
# my_plugin/nodes.py
from backend.core.registry import register_node
# ... your nodes

# Load in main.py
import my_plugin.nodes
```

## Best Practices

1. **Error Handling**: Always wrap logic in try-except and return meaningful errors
2. **Type Validation**: Validate input types and parameter values
3. **Documentation**: Add clear descriptions and parameter help text
4. **Performance**: Use caching for expensive operations
5. **Testing**: Test nodes with various inputs and edge cases
6. **Previews**: Provide useful previews for debugging
7. **Metadata**: Include execution metrics (time, rows processed, etc.)

## Testing Custom Nodes

```python
import asyncio
from backend.core.types import NodeContext

# Create test context
context = NodeContext(
    node_id="test-1",
    inputs={"table": test_dataframe},
    params={"threshold": 0.5}
)

# Run node
node = MyCustomNode()
result = asyncio.run(node.run(context))

# Check result
assert result.error is None
assert "output_data" in result.outputs
```

## Advanced Features

### Custom Validation

```python
def validate_inputs(self, context: NodeContext) -> List[str]:
    errors = super().validate_inputs(context)
    
    # Custom validation
    if "table" in context.inputs:
        df = context.inputs["table"]
        if len(df) < 10:
            errors.append("Table must have at least 10 rows")
    
    return errors
```

### Progress Reporting

For long-running operations, consider adding progress callbacks (future feature).

### Custom Port Colors

Extend `PortType` enum for custom data types with unique colors in the UI.

## Support

For questions about plugin development:
- Check existing nodes in `backend/nodes/`
- Review the core types in `backend/core/types.py`
- Open an issue on GitHub
