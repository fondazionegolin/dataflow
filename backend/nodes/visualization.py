"""Visualization nodes: 2D and 3D plots."""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from typing import Optional

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class Plot2DNode(NodeExecutor):
    """Create interactive 2D scatter plots."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="plot.2d",
            label="2D Scatter Plot",
            category="visualization",
            description="Create interactive 2D scatter plot with color and size mapping",
            icon="📊",
            color="#FF5722",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Data Table")
            ],
            outputs=[
                PortSpec(name="plot", type=PortType.PARAMS, label="Plot Config")
            ],
            params=[
                ParamSpec(
                    name="x_column",
                    type=ParamType.COLUMN,
                    label="X Axis",
                    required=True
                ),
                ParamSpec(
                    name="y_column",
                    type=ParamType.COLUMN,
                    label="Y Axis",
                    required=True
                ),
                ParamSpec(
                    name="color_column",
                    type=ParamType.COLUMN,
                    label="Color By (optional)",
                    default=""
                ),
                ParamSpec(
                    name="size_column",
                    type=ParamType.COLUMN,
                    label="Size By (optional)",
                    default=""
                ),
                ParamSpec(
                    name="title",
                    type=ParamType.STRING,
                    label="Plot Title",
                    default="2D Scatter Plot"
                ),
                ParamSpec(
                    name="opacity",
                    type=ParamType.SLIDER,
                    label="Opacity",
                    default=0.7,
                    min=0.1,
                    max=1.0,
                    step=0.1
                ),
                ParamSpec(
                    name="marker_size",
                    type=ParamType.SLIDER,
                    label="Marker Size",
                    default=5,
                    min=1,
                    max=20,
                    step=1
                )
            ],
            cache_policy=CachePolicy.NEVER  # Always regenerate plots
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Create 2D plot."""
        df = context.inputs.get("table")
        x_col = context.params.get("x_column")
        y_col = context.params.get("y_column")
        color_col = context.params.get("color_column", "")
        size_col = context.params.get("size_column", "")
        title = context.params.get("title", "2D Scatter Plot")
        opacity = float(context.params.get("opacity", 0.7))
        marker_size = float(context.params.get("marker_size", 5))
        
        try:
            # Prepare plot arguments
            plot_kwargs = {
                "data_frame": df,
                "x": x_col,
                "y": y_col,
                "title": title,
                "opacity": opacity
            }
            
            if color_col and color_col in df.columns:
                plot_kwargs["color"] = color_col
            
            if size_col and size_col in df.columns:
                plot_kwargs["size"] = size_col
                plot_kwargs["size_max"] = marker_size * 2  # Scale max size
            
            # Create plot
            fig = px.scatter(**plot_kwargs)
            
            # Update marker size if no size column is specified
            if not size_col or size_col not in df.columns:
                fig.update_traces(marker={'size': marker_size})
            
            # Update layout for better interactivity
            fig.update_layout(
                hovermode='closest',
                dragmode='pan',
                template='plotly_white'
            )
            
            # Convert to JSON for frontend (without compression for regression support)
            # Use plotly's to_dict() and manually serialize to avoid compression
            import json
            fig_dict = fig.to_dict()
            plot_json = json.dumps(fig_dict)
            
            preview = {
                "plot_type": "scatter_2d",
                "x_column": x_col,
                "y_column": y_col,
                "n_points": len(df),
                "plot_json": plot_json
            }
            
            return NodeResult(
                outputs={"plot": {"type": "plotly", "data": plot_json}},
                metadata={
                    "x_column": x_col,
                    "y_column": y_col,
                    "n_points": len(df)
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to create 2D plot: {str(e)}")


@register_node
class Plot3DNode(NodeExecutor):
    """Create interactive 3D scatter plots."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="plot.3d",
            label="3D Scatter Plot",
            category="visualization",
            description="Create interactive 3D scatter plot with rotation and zoom",
            icon="🎯",
            color="#F44336",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Data Table")
            ],
            outputs=[
                PortSpec(name="plot", type=PortType.PARAMS, label="Plot Config")
            ],
            params=[
                ParamSpec(
                    name="x_column",
                    type=ParamType.COLUMN,
                    label="X Axis",
                    required=True
                ),
                ParamSpec(
                    name="y_column",
                    type=ParamType.COLUMN,
                    label="Y Axis",
                    required=True
                ),
                ParamSpec(
                    name="z_column",
                    type=ParamType.COLUMN,
                    label="Z Axis",
                    required=True
                ),
                ParamSpec(
                    name="color_column",
                    type=ParamType.COLUMN,
                    label="Color By (optional)",
                    default=""
                ),
                ParamSpec(
                    name="size_column",
                    type=ParamType.COLUMN,
                    label="Size By (optional)",
                    default=""
                ),
                ParamSpec(
                    name="title",
                    type=ParamType.STRING,
                    label="Plot Title",
                    default="3D Scatter Plot"
                ),
                ParamSpec(
                    name="opacity",
                    type=ParamType.SLIDER,
                    label="Opacity",
                    default=0.7,
                    min=0.1,
                    max=1.0,
                    step=0.1
                ),
                ParamSpec(
                    name="marker_size",
                    type=ParamType.SLIDER,
                    label="Marker Size",
                    default=3,
                    min=1,
                    max=15,
                    step=1
                )
            ],
            cache_policy=CachePolicy.NEVER
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Create 3D plot."""
        df = context.inputs.get("table")
        x_col = context.params.get("x_column")
        y_col = context.params.get("y_column")
        z_col = context.params.get("z_column")
        color_col = context.params.get("color_column", "")
        size_col = context.params.get("size_column", "")
        title = context.params.get("title", "3D Scatter Plot")
        opacity = float(context.params.get("opacity", 0.7))
        marker_size = float(context.params.get("marker_size", 3))
        
        try:
            # Prepare plot arguments
            plot_kwargs = {
                "data_frame": df,
                "x": x_col,
                "y": y_col,
                "z": z_col,
                "title": title,
                "opacity": opacity
            }
            
            if color_col and color_col in df.columns:
                plot_kwargs["color"] = color_col
            
            if size_col and size_col in df.columns:
                plot_kwargs["size"] = size_col
                plot_kwargs["size_max"] = marker_size * 2  # Scale max size
            
            # Create plot
            fig = px.scatter_3d(**plot_kwargs)
            
            # Update marker size if no size column is specified
            if not size_col or size_col not in df.columns:
                fig.update_traces(marker={'size': marker_size})
            
            # Update layout
            fig.update_layout(
                scene=dict(
                    xaxis_title=x_col,
                    yaxis_title=y_col,
                    zaxis_title=z_col
                ),
                template='plotly_white'
            )
            
            # Convert to JSON
            plot_json = fig.to_json()
            
            preview = {
                "plot_type": "scatter_3d",
                "x_column": x_col,
                "y_column": y_col,
                "z_column": z_col,
                "n_points": len(df),
                "plot_json": plot_json
            }
            
            return NodeResult(
                outputs={"plot": {"type": "plotly", "data": plot_json}},
                metadata={
                    "x_column": x_col,
                    "y_column": y_col,
                    "z_column": z_col,
                    "n_points": len(df)
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to create 3D plot: {str(e)}")


@register_node
class HistogramNode(NodeExecutor):
    """Create histogram plots."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="plot.histogram",
            label="Histogram",
            category="visualization",
            description="Create histogram for data distribution analysis",
            icon="📈",
            color="#FF6F00",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Data Table")
            ],
            outputs=[
                PortSpec(name="plot", type=PortType.PARAMS, label="Plot Config")
            ],
            params=[
                ParamSpec(
                    name="column",
                    type=ParamType.COLUMN,
                    label="Column",
                    required=True
                ),
                ParamSpec(
                    name="bins",
                    type=ParamType.INTEGER,
                    label="Number of Bins",
                    default=30,
                    min=5,
                    max=200
                ),
                ParamSpec(
                    name="title",
                    type=ParamType.STRING,
                    label="Plot Title",
                    default="Histogram"
                ),
                ParamSpec(
                    name="color",
                    type=ParamType.COLOR,
                    label="Bar Color",
                    default="#3F51B5"
                )
            ],
            cache_policy=CachePolicy.NEVER
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Create histogram."""
        df = context.inputs.get("table")
        column = context.params.get("column")
        bins = context.params.get("bins", 30)
        title = context.params.get("title", "Histogram")
        color = context.params.get("color", "#3F51B5")
        
        try:
            fig = px.histogram(
                df,
                x=column,
                nbins=bins,
                title=title,
                color_discrete_sequence=[color]
            )
            
            fig.update_layout(
                template='plotly_white',
                showlegend=False
            )
            
            plot_json = fig.to_json()
            
            preview = {
                "plot_type": "histogram",
                "column": column,
                "bins": bins,
                "plot_json": plot_json
            }
            
            return NodeResult(
                outputs={"plot": {"type": "plotly", "data": plot_json}},
                metadata={"column": column, "bins": bins},
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to create histogram: {str(e)}")
