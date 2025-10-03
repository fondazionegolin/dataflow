"""Node registry for managing available node types."""

from typing import Dict, List, Callable, Optional, Type
from .types import NodeSpec, NodeContext, NodeResult
import logging

logger = logging.getLogger(__name__)


class NodeExecutor:
    """Base class for node execution logic."""
    
    def __init__(self, spec: NodeSpec):
        self.spec = spec
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Execute the node logic. Override in subclasses."""
        raise NotImplementedError(f"Node {self.spec.type} does not implement run()")
    
    def validate_inputs(self, context: NodeContext) -> List[str]:
        """Validate inputs match spec. Returns list of errors."""
        errors = []
        for port_spec in self.spec.inputs:
            if port_spec.required and port_spec.name not in context.inputs:
                errors.append(f"Required input '{port_spec.name}' is missing")
        return errors
    
    def validate_params(self, context: NodeContext) -> List[str]:
        """Validate parameters match spec. Returns list of errors."""
        errors = []
        for param_spec in self.spec.params:
            if param_spec.required and param_spec.name not in context.params:
                errors.append(f"Required parameter '{param_spec.name}' is missing")
        return errors


class NodeRegistry:
    """Central registry for all available node types."""
    
    def __init__(self):
        self._nodes: Dict[str, NodeExecutor] = {}
        self._specs: Dict[str, NodeSpec] = {}
    
    def register(self, executor_class: Type[NodeExecutor]):
        """Register a node executor class."""
        executor = executor_class()
        node_type = executor.spec.type
        
        if node_type in self._nodes:
            logger.warning(f"Node type '{node_type}' is already registered. Overwriting.")
        
        self._nodes[node_type] = executor
        self._specs[node_type] = executor.spec
        logger.info(f"Registered node: {node_type}")
    
    def get_executor(self, node_type: str) -> Optional[NodeExecutor]:
        """Get executor for a node type."""
        return self._nodes.get(node_type)
    
    def get_spec(self, node_type: str) -> Optional[NodeSpec]:
        """Get specification for a node type."""
        return self._specs.get(node_type)
    
    def get_all_specs(self) -> List[NodeSpec]:
        """Get all registered node specifications."""
        return list(self._specs.values())
    
    def get_specs_by_category(self, category: str) -> List[NodeSpec]:
        """Get all node specs in a category."""
        return [spec for spec in self._specs.values() if spec.category == category]
    
    def list_types(self) -> List[str]:
        """List all registered node types."""
        return list(self._nodes.keys())
    
    def list_categories(self) -> List[str]:
        """List all unique categories."""
        categories = set(spec.category for spec in self._specs.values())
        return sorted(categories)


# Global registry instance
registry = NodeRegistry()


def register_node(executor_class: Type[NodeExecutor]):
    """Decorator to register a node executor."""
    registry.register(executor_class)
    return executor_class
