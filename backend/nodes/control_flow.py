"""Control flow nodes for visual programming."""

import pandas as pd
from typing import Any, Dict, List

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class RepeatNode(NodeExecutor):
    """Repeat execution N times with iteration counter."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="control.repeat",
            label="Ripeti",
            category="control",
            description="Ripete l'esecuzione N volte, passando il contatore di iterazione",
            icon="🔁",
            color="#06B6D4",
            inputs=[
                PortSpec(name="input", type=PortType.ANY, label="Input", required=False)
            ],
            outputs=[
                PortSpec(name="output", type=PortType.ANY, label="Output"),
                PortSpec(name="iteration", type=PortType.PARAMS, label="Iterazione"),
                PortSpec(name="results", type=PortType.ANY, label="Tutti i Risultati")
            ],
            params=[
                ParamSpec(
                    name="iterations",
                    type=ParamType.INTEGER,
                    label="Numero Iterazioni",
                    default=10,
                    min=1,
                    max=10000,
                    description="Quante volte ripetere"
                ),
                ParamSpec(
                    name="collect_results",
                    type=ParamType.BOOLEAN,
                    label="Raccogli Risultati",
                    default=True,
                    description="Raccoglie tutti i risultati in una lista"
                )
            ],
            cache_policy=CachePolicy.NEVER  # Always execute
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Execute the loop."""
        iterations = int(context.params.get("iterations", 10))
        collect_results = context.params.get("collect_results", True)
        input_data = context.inputs.get("input")
        
        results = []
        
        for i in range(iterations):
            # Each iteration gets the input data and current iteration number
            iteration_data = {
                "iteration": i,
                "total": iterations,
                "input": input_data
            }
            
            if collect_results:
                results.append(iteration_data)
        
        # Return the last iteration data and all results
        return NodeResult(
            outputs={
                "output": input_data,
                "iteration": iterations - 1,
                "results": results if collect_results else None
            },
            metadata={
                "iterations": iterations,
                "collected": len(results) if collect_results else 0
            },
            preview={
                "type": "metrics",
                "data": {
                    "iterations": iterations,
                    "collected_results": len(results) if collect_results else 0
                },
                "message": f"🔁 Eseguito {iterations} iterazioni"
            }
        )


@register_node
class IfElseNode(NodeExecutor):
    """Conditional execution based on condition."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="control.if_else",
            label="Se Allora",
            category="control",
            description="Esegue branch diversi in base a una condizione",
            icon="🔀",
            color="#06B6D4",
            inputs=[
                PortSpec(name="condition", type=PortType.ANY, label="Condizione"),
                PortSpec(name="if_true", type=PortType.ANY, label="Se Vero", required=False),
                PortSpec(name="if_false", type=PortType.ANY, label="Se Falso", required=False)
            ],
            outputs=[
                PortSpec(name="output", type=PortType.ANY, label="Output"),
                PortSpec(name="condition_result", type=PortType.PARAMS, label="Risultato Condizione")
            ],
            params=[
                ParamSpec(
                    name="condition_type",
                    type=ParamType.SELECT,
                    label="Tipo Condizione",
                    default="boolean",
                    options=["boolean", "greater_than", "less_than", "equal", "not_equal", "contains"],
                    description="Come valutare la condizione"
                ),
                ParamSpec(
                    name="threshold",
                    type=ParamType.NUMBER,
                    label="Valore Soglia",
                    default=0,
                    description="Valore per confronto (se applicabile)"
                )
            ],
            cache_policy=CachePolicy.NEVER
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Execute conditional logic."""
        condition_input = context.inputs.get("condition")
        if_true_data = context.inputs.get("if_true")
        if_false_data = context.inputs.get("if_false")
        
        condition_type = context.params.get("condition_type", "boolean")
        threshold = float(context.params.get("threshold", 0))
        
        # Evaluate condition
        condition_result = False
        
        if condition_type == "boolean":
            condition_result = bool(condition_input)
        elif condition_type == "greater_than":
            try:
                condition_result = float(condition_input) > threshold
            except (TypeError, ValueError):
                condition_result = False
        elif condition_type == "less_than":
            try:
                condition_result = float(condition_input) < threshold
            except (TypeError, ValueError):
                condition_result = False
        elif condition_type == "equal":
            try:
                condition_result = float(condition_input) == threshold
            except (TypeError, ValueError):
                condition_result = str(condition_input) == str(threshold)
        elif condition_type == "not_equal":
            try:
                condition_result = float(condition_input) != threshold
            except (TypeError, ValueError):
                condition_result = str(condition_input) != str(threshold)
        elif condition_type == "contains":
            condition_result = str(threshold) in str(condition_input)
        
        # Select output based on condition
        output = if_true_data if condition_result else if_false_data
        
        return NodeResult(
            outputs={
                "output": output,
                "condition_result": condition_result
            },
            metadata={
                "condition": condition_result,
                "condition_type": condition_type,
                "input_value": str(condition_input)[:100]
            },
            preview={
                "type": "metrics",
                "data": {
                    "condition": "VERO ✓" if condition_result else "FALSO ✗",
                    "type": condition_type,
                    "input": str(condition_input)[:50]
                },
                "message": f"🔀 Condizione: {'VERO' if condition_result else 'FALSO'}"
            }
        )


@register_node
class CompareNode(NodeExecutor):
    """Compare two values."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="control.compare",
            label="Confronta",
            category="control",
            description="Confronta due valori e restituisce il risultato",
            icon="⚖️",
            color="#06B6D4",
            inputs=[
                PortSpec(name="value_a", type=PortType.ANY, label="Valore A"),
                PortSpec(name="value_b", type=PortType.ANY, label="Valore B")
            ],
            outputs=[
                PortSpec(name="result", type=PortType.PARAMS, label="Risultato"),
                PortSpec(name="equal", type=PortType.PARAMS, label="Uguale"),
                PortSpec(name="greater", type=PortType.PARAMS, label="A > B"),
                PortSpec(name="less", type=PortType.PARAMS, label="A < B")
            ],
            params=[
                ParamSpec(
                    name="comparison",
                    type=ParamType.SELECT,
                    label="Confronto",
                    default="equal",
                    options=["equal", "not_equal", "greater", "less", "greater_equal", "less_equal"],
                    description="Tipo di confronto"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Compare values."""
        value_a = context.inputs.get("value_a")
        value_b = context.inputs.get("value_b")
        comparison = context.params.get("comparison", "equal")
        
        # Try numeric comparison first
        try:
            a = float(value_a)
            b = float(value_b)
            
            equal = a == b
            greater = a > b
            less = a < b
            greater_equal = a >= b
            less_equal = a <= b
            not_equal = a != b
            
        except (TypeError, ValueError):
            # Fall back to string comparison
            a = str(value_a)
            b = str(value_b)
            
            equal = a == b
            greater = a > b
            less = a < b
            greater_equal = a >= b
            less_equal = a <= b
            not_equal = a != b
        
        # Select result based on comparison type
        results = {
            "equal": equal,
            "not_equal": not_equal,
            "greater": greater,
            "less": less,
            "greater_equal": greater_equal,
            "less_equal": less_equal
        }
        
        result = results.get(comparison, False)
        
        return NodeResult(
            outputs={
                "result": result,
                "equal": equal,
                "greater": greater,
                "less": less
            },
            metadata={
                "comparison": comparison,
                "result": result,
                "value_a": str(value_a)[:50],
                "value_b": str(value_b)[:50]
            },
            preview={
                "type": "metrics",
                "data": {
                    "A": str(value_a)[:30],
                    "B": str(value_b)[:30],
                    "comparison": comparison,
                    "result": "✓ VERO" if result else "✗ FALSO"
                },
                "message": f"⚖️ {comparison}: {result}"
            }
        )


@register_node
class CounterNode(NodeExecutor):
    """Counter that increments each execution."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="control.counter",
            label="Contatore",
            category="control",
            description="Contatore che si incrementa ad ogni esecuzione",
            icon="🔢",
            color="#06B6D4",
            inputs=[
                PortSpec(name="reset", type=PortType.ANY, label="Reset", required=False)
            ],
            outputs=[
                PortSpec(name="count", type=PortType.PARAMS, label="Conteggio"),
                PortSpec(name="is_first", type=PortType.PARAMS, label="È Primo"),
                PortSpec(name="is_multiple_of_10", type=PortType.PARAMS, label="Multiplo di 10")
            ],
            params=[
                ParamSpec(
                    name="start",
                    type=ParamType.INTEGER,
                    label="Valore Iniziale",
                    default=0,
                    description="Da dove iniziare a contare"
                ),
                ParamSpec(
                    name="step",
                    type=ParamType.INTEGER,
                    label="Incremento",
                    default=1,
                    description="Di quanto incrementare"
                )
            ],
            cache_policy=CachePolicy.NEVER
        ))
        self.counter = {}  # Store counter per node instance
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Increment counter."""
        node_id = id(self)  # Use object id as key
        start = int(context.params.get("start", 0))
        step = int(context.params.get("step", 1))
        reset = context.inputs.get("reset")
        
        # Reset if requested
        if reset is not None:
            self.counter[node_id] = start
        
        # Initialize if first run
        if node_id not in self.counter:
            self.counter[node_id] = start
        else:
            self.counter[node_id] += step
        
        count = self.counter[node_id]
        
        return NodeResult(
            outputs={
                "count": count,
                "is_first": count == start,
                "is_multiple_of_10": count % 10 == 0
            },
            metadata={
                "count": count,
                "start": start,
                "step": step
            },
            preview={
                "type": "metrics",
                "data": {
                    "count": count,
                    "start": start,
                    "step": step
                },
                "message": f"🔢 Conteggio: {count}"
            }
        )
