"""Mathematical equation nodes for function analysis and visualization."""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List
import json
import sympy as sp
from sympy import symbols, sympify, lambdify, diff, integrate, solve, limit, oo
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType, 
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class EquationNode(NodeExecutor):
    """Define and manipulate mathematical equations with visual input."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.equation",
            label="Equation",
            category="mathematics",
            description="Define mathematical equations with visual symbol input. Supports f(x), derivatives, integrals, etc.",
            icon="📐",
            color="#FF6B6B",
            inputs=[],
            outputs=[
                PortSpec(name="equation", type=PortType.PARAMS, label="Equation"),
                PortSpec(name="function", type=PortType.ANY, label="Function")
            ],
            params=[
                ParamSpec(
                    name="equation_str",
                    type=ParamType.STRING,
                    label="Equation",
                    default="x**2 + 2*x + 1",
                    description="Enter equation (use x as variable). Examples: x**2, sin(x), exp(x), sqrt(x)"
                ),
                ParamSpec(
                    name="variable",
                    type=ParamType.STRING,
                    label="Variable",
                    default="x",
                    description="Independent variable (usually x)"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Parse and validate equation."""
        try:
            equation_str = context.params.get("equation_str", "x**2")
            var_name = context.params.get("variable", "x")
            
            # Parse equation with sympy
            x = symbols(var_name)
            
            # Try to parse with implicit multiplication
            transformations = standard_transformations + (implicit_multiplication_application,)
            try:
                expr = parse_expr(equation_str, transformations=transformations)
            except:
                expr = sympify(equation_str)
            
            # Create lambda function for numerical evaluation
            func = lambdify(x, expr, modules=['numpy'])
            
            # Test evaluation
            test_val = func(1.0)
            
            equation_data = {
                "expression": str(expr),
                "variable": var_name,
                "equation_str": equation_str,
                "latex": sp.latex(expr),
                "expr_str": str(expr)  # Store as string for serialization
            }
            
            # Store function data with serializable format
            function_data = {
                "expr_str": str(expr),
                "var_name": var_name,
                "latex": sp.latex(expr)
            }
            
            return NodeResult(
                outputs={
                    "equation": equation_data,
                    "function": function_data
                },
                metadata={
                    "equation": str(expr),
                    "variable": var_name,
                    "latex": sp.latex(expr)
                },
                preview={
                    "type": "equation",
                    "equation": str(expr),
                    "latex": f"$${sp.latex(expr)}$$",
                    "test_value": f"f(1) = {test_val:.4f}"
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Invalid equation: {str(e)}")


@register_node
class PlotEquationNode(NodeExecutor):
    """Plot mathematical equation as a graph."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.plot_equation",
            label="Plot Equation",
            category="mathematics",
            description="Visualize mathematical equation as 2D graph",
            icon="📈",
            color="#4ECDC4",
            inputs=[
                PortSpec(name="equation", type=PortType.ANY, label="Equation")
            ],
            outputs=[
                PortSpec(name="plot", type=PortType.PARAMS, label="Plot"),
                PortSpec(name="points", type=PortType.TABLE, label="Points")
            ],
            params=[
                ParamSpec(
                    name="x_min",
                    type=ParamType.NUMBER,
                    label="X Min",
                    default=-10,
                    description="Minimum x value"
                ),
                ParamSpec(
                    name="x_max",
                    type=ParamType.NUMBER,
                    label="X Max",
                    default=10,
                    description="Maximum x value"
                ),
                ParamSpec(
                    name="num_points",
                    type=ParamType.INTEGER,
                    label="Number of Points",
                    default=200,
                    min=50,
                    max=1000,
                    description="Resolution of the plot"
                ),
                ParamSpec(
                    name="title",
                    type=ParamType.STRING,
                    label="Title",
                    default="",
                    description="Plot title (optional)"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Plot equation."""
        try:
            import plotly.graph_objects as go
            
            equation_data = context.inputs.get("equation")
            if isinstance(equation_data, dict) and "expr_str" in equation_data:
                # Reconstruct expression from string
                expr_str = equation_data["expr_str"]
                var_name = equation_data.get("var_name", "x")
                x = symbols(var_name)
                expr = sympify(expr_str)
                func = lambdify(x, expr, modules=['numpy'])
                equation_str = str(expr)
            else:
                return NodeResult(error="Invalid equation input. Connect an Equation node.")
            
            x_min = context.params.get("x_min", -10)
            x_max = context.params.get("x_max", 10)
            num_points = context.params.get("num_points", 200)
            title = context.params.get("title", "")
            
            # Generate points
            x_vals = np.linspace(x_min, x_max, num_points)
            y_vals = func(x_vals)
            
            # Handle inf/nan
            y_vals = np.where(np.isinf(y_vals), np.nan, y_vals)
            
            # Create plot
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=x_vals,
                y=y_vals,
                mode='lines',
                name=equation_str,
                line=dict(color='#FF6B6B', width=3)
            ))
            
            fig.update_layout(
                title=title or f"y = {equation_str}",
                xaxis_title="x",
                yaxis_title="y",
                template='plotly_white',
                hovermode='x unified'
            )
            
            # Create dataframe
            df = pd.DataFrame({'x': x_vals, 'y': y_vals})
            
            return NodeResult(
                outputs={
                    "plot": json.dumps(fig.to_dict()),
                    "points": df
                },
                metadata={
                    "equation": equation_str,
                    "x_range": [x_min, x_max],
                    "num_points": num_points
                },
                preview={
                    "plot_json": json.dumps(fig.to_dict())
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to plot equation: {str(e)}")


@register_node
class EvaluateEquationNode(NodeExecutor):
    """Evaluate equation at specific x values."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.evaluate",
            label="Evaluate Equation",
            category="mathematics",
            description="Calculate f(x) for given x values",
            icon="🎯",
            color="#95E1D3",
            inputs=[
                PortSpec(name="equation", type=PortType.ANY, label="Equation"),
                PortSpec(name="x_values", type=PortType.ANY, label="X Values", required=False)
            ],
            outputs=[
                PortSpec(name="result", type=PortType.TABLE, label="Results")
            ],
            params=[
                ParamSpec(
                    name="x_input",
                    type=ParamType.STRING,
                    label="X Values",
                    default="0, 1, 2, 3, 4, 5",
                    description="Comma-separated x values (if no input connected)"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Evaluate equation at x values."""
        try:
            equation_data = context.inputs.get("equation")
            if isinstance(equation_data, dict) and "expr_str" in equation_data:
                # Reconstruct expression from string
                expr_str = equation_data["expr_str"]
                var_name = equation_data.get("var_name", "x")
                x = symbols(var_name)
                expr = sympify(expr_str)
                func = lambdify(x, expr, modules=['numpy'])
                equation_str = str(expr)
            else:
                return NodeResult(error="Invalid equation input. Connect an Equation node.")
            
            # Get x values
            if "x_values" in context.inputs:
                x_input = context.inputs["x_values"]
                if isinstance(x_input, pd.DataFrame):
                    # Use first numeric column
                    numeric_cols = x_input.select_dtypes(include=[np.number]).columns
                    if len(numeric_cols) > 0:
                        x_vals = x_input[numeric_cols[0]].values
                    else:
                        return NodeResult(error="No numeric column found in input")
                elif isinstance(x_input, (list, np.ndarray)):
                    x_vals = np.array(x_input)
                else:
                    x_vals = np.array([float(x_input)])
            else:
                # Parse from parameter
                x_str = context.params.get("x_input", "0, 1, 2, 3, 4, 5")
                x_vals = np.array([float(x.strip()) for x in x_str.split(",")])
            
            # Evaluate
            y_vals = func(x_vals)
            
            # Create result dataframe
            df = pd.DataFrame({
                'x': x_vals,
                'f(x)': y_vals
            })
            
            return NodeResult(
                outputs={"result": df},
                metadata={
                    "equation": equation_str,
                    "n_points": len(x_vals)
                },
                preview={
                    "head": df.head(20).to_dict(orient="records"),
                    "shape": df.shape
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to evaluate equation: {str(e)}")


@register_node
class FunctionAnalysisNode(NodeExecutor):
    """Perform complete function analysis: derivatives, integrals, critical points, etc."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.function_analysis",
            label="Function Analysis",
            category="mathematics",
            description="Complete function study: domain, derivatives, integrals, critical points, asymptotes",
            icon="🔬",
            color="#F38181",
            inputs=[
                PortSpec(name="equation", type=PortType.ANY, label="Equation")
            ],
            outputs=[
                PortSpec(name="analysis", type=PortType.PARAMS, label="Analysis"),
                PortSpec(name="derivative", type=PortType.ANY, label="Derivative"),
                PortSpec(name="integral", type=PortType.ANY, label="Integral")
            ],
            params=[
                ParamSpec(
                    name="compute_derivative",
                    type=ParamType.BOOLEAN,
                    label="Compute Derivative",
                    default=True
                ),
                ParamSpec(
                    name="compute_integral",
                    type=ParamType.BOOLEAN,
                    label="Compute Integral",
                    default=True
                ),
                ParamSpec(
                    name="find_critical_points",
                    type=ParamType.BOOLEAN,
                    label="Find Critical Points",
                    default=True
                ),
                ParamSpec(
                    name="find_zeros",
                    type=ParamType.BOOLEAN,
                    label="Find Zeros (Roots)",
                    default=True
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Analyze function."""
        try:
            equation_data = context.inputs.get("equation")
            if not isinstance(equation_data, dict) or "expr_str" not in equation_data:
                return NodeResult(error="Invalid equation input. Connect an Equation node.")
            
            # Reconstruct expression from string
            expr_str = equation_data["expr_str"]
            var_name = equation_data.get("var_name", "x")
            x = symbols(var_name)
            expr = sympify(expr_str)
            
            analysis = {
                "original": str(expr),
                "latex": sp.latex(expr)
            }
            
            derivative_func = None
            integral_func = None
            
            # Derivative
            if context.params.get("compute_derivative", True):
                derivative = diff(expr, x)
                analysis["derivative"] = str(derivative)
                analysis["derivative_latex"] = sp.latex(derivative)
                derivative_func = {
                    "expr_str": str(derivative),
                    "var_name": var_name,
                    "latex": sp.latex(derivative)
                }
            
            # Integral
            if context.params.get("compute_integral", True):
                try:
                    integral = integrate(expr, x)
                    analysis["integral"] = str(integral)
                    analysis["integral_latex"] = sp.latex(integral)
                    integral_func = {
                        "expr_str": str(integral),
                        "var_name": var_name,
                        "latex": sp.latex(integral)
                    }
                except:
                    analysis["integral"] = "Cannot compute (complex expression)"
            
            # Critical points (where derivative = 0)
            if context.params.get("find_critical_points", True) and derivative_func:
                try:
                    critical_points = solve(derivative, x)
                    analysis["critical_points"] = [str(cp) for cp in critical_points]
                except:
                    analysis["critical_points"] = ["Cannot solve analytically"]
            
            # Zeros (roots)
            if context.params.get("find_zeros", True):
                try:
                    zeros = solve(expr, x)
                    analysis["zeros"] = [str(z) for z in zeros]
                except:
                    analysis["zeros"] = ["Cannot solve analytically"]
            
            return NodeResult(
                outputs={
                    "analysis": analysis,
                    "derivative": derivative_func,
                    "integral": integral_func
                },
                metadata=analysis,
                preview={
                    "type": "analysis",
                    "data": analysis
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Analysis failed: {str(e)}")


@register_node
class RegressionToEquationNode(NodeExecutor):
    """Convert regression line to equation format."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="math.regression_to_equation",
            label="Regression to Equation",
            category="mathematics",
            description="Convert regression coefficients to equation format",
            icon="📉",
            color="#A8E6CF",
            inputs=[
                PortSpec(name="coefficients", type=PortType.PARAMS, label="Coefficients")
            ],
            outputs=[
                PortSpec(name="equation", type=PortType.ANY, label="Equation"),
                PortSpec(name="equation_string", type=PortType.PARAMS, label="Equation String")
            ],
            params=[
                ParamSpec(
                    name="regression_type",
                    type=ParamType.SELECT,
                    label="Regression Type",
                    default="linear",
                    options=["linear", "polynomial", "exponential"]
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Convert regression to equation."""
        try:
            coeffs = context.inputs.get("coefficients", {})
            reg_type = context.params.get("regression_type", "linear")
            
            x = symbols('x')
            
            if reg_type == "linear":
                # y = mx + b
                m = coeffs.get("slope", coeffs.get("m", 1))
                b = coeffs.get("intercept", coeffs.get("b", 0))
                expr = m * x + b
                equation_str = f"{m:.4f}*x + {b:.4f}"
                
            elif reg_type == "polynomial":
                # y = ax² + bx + c
                a = coeffs.get("a", 1)
                b = coeffs.get("b", 0)
                c = coeffs.get("c", 0)
                expr = a * x**2 + b * x + c
                equation_str = f"{a:.4f}*x**2 + {b:.4f}*x + {c:.4f}"
                
            elif reg_type == "exponential":
                # y = a * e^(bx)
                a = coeffs.get("a", 1)
                b = coeffs.get("b", 1)
                expr = a * sp.exp(b * x)
                equation_str = f"{a:.4f}*exp({b:.4f}*x)"
            
            func = lambdify(x, expr, modules=['numpy'])
            
            equation_data = {
                "expression": str(expr),
                "variable": "x",
                "equation_str": equation_str,
                "latex": sp.latex(expr)
            }
            
            return NodeResult(
                outputs={
                    "equation": {
                        "expr_str": str(expr),
                        "var_name": "x",
                        "latex": sp.latex(expr)
                    },
                    "equation_string": equation_data
                },
                metadata={
                    "equation": str(expr),
                    "type": reg_type
                },
                preview={
                    "type": "equation",
                    "equation": str(expr),
                    "latex": f"$${sp.latex(expr)}$$"
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Conversion failed: {str(e)}")
