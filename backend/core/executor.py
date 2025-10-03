"""Workflow execution engine with DAG scheduling and caching."""

import asyncio
import time
from typing import Dict, List, Set, Optional, Any
from collections import defaultdict, deque
import logging

from .types import (
    Workflow, NodeInstance, Edge, NodeContext, NodeResult, 
    NodeStatus, CachePolicy
)
from .registry import registry
from .cache import CacheManager

logger = logging.getLogger(__name__)


class ExecutionEngine:
    """Executes workflows with intelligent caching and incremental updates."""
    
    def __init__(self, cache_dir: str = ".cache"):
        self.cache_manager = CacheManager(cache_dir)
        self._execution_results: Dict[str, Dict[str, Any]] = {}
        self._node_hashes: Dict[str, str] = {}
    
    def build_dag(self, workflow: Workflow) -> Dict[str, List[str]]:
        """Build adjacency list representation of the DAG."""
        graph: Dict[str, List[str]] = defaultdict(list)
        
        # Initialize all nodes
        for node in workflow.nodes:
            if node.id not in graph:
                graph[node.id] = []
        
        # Add edges
        for edge in workflow.edges:
            graph[edge.source_node].append(edge.target_node)
        
        return dict(graph)
    
    def topological_sort(self, workflow: Workflow) -> List[str]:
        """Return topologically sorted list of node IDs."""
        graph = self.build_dag(workflow)
        
        # Calculate in-degrees
        in_degree: Dict[str, int] = {node.id: 0 for node in workflow.nodes}
        for source, targets in graph.items():
            for target in targets:
                in_degree[target] += 1
        
        # Queue nodes with no dependencies
        queue = deque([node_id for node_id, degree in in_degree.items() if degree == 0])
        sorted_nodes = []
        
        while queue:
            node_id = queue.popleft()
            sorted_nodes.append(node_id)
            
            # Reduce in-degree for neighbors
            for neighbor in graph.get(node_id, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        # Check for cycles
        if len(sorted_nodes) != len(workflow.nodes):
            raise ValueError("Workflow contains cycles")
        
        return sorted_nodes
    
    def get_node_inputs(self, node_id: str, workflow: Workflow) -> Dict[str, str]:
        """Get mapping of input port names to source node IDs and ports."""
        inputs = {}
        for edge in workflow.edges:
            if edge.target_node == node_id:
                inputs[edge.target_port] = {
                    'node_id': edge.source_node,
                    'port': edge.source_port
                }
        return inputs
    
    def get_downstream_nodes(self, node_id: str, workflow: Workflow) -> Set[str]:
        """Get all nodes downstream from the given node."""
        graph = self.build_dag(workflow)
        downstream = set()
        queue = deque([node_id])
        
        while queue:
            current = queue.popleft()
            for neighbor in graph.get(current, []):
                if neighbor not in downstream:
                    downstream.add(neighbor)
                    queue.append(neighbor)
        
        return downstream
    
    async def execute_node(self, node: NodeInstance, workflow: Workflow, 
                          force_recompute: bool = False) -> NodeResult:
        """Execute a single node."""
        start_time = time.time()
        
        try:
            # Get executor
            executor = registry.get_executor(node.type)
            if not executor:
                raise ValueError(f"Unknown node type: {node.type}")
            
            # Prepare inputs
            input_mapping = self.get_node_inputs(node.id, workflow)
            inputs = {}
            input_hashes = {}
            
            for port_name, source_info in input_mapping.items():
                source_node_id = source_info['node_id']
                source_port = source_info['port']
                
                if source_node_id not in self._execution_results:
                    raise ValueError(f"Source node {source_node_id} has not been executed")
                
                source_result = self._execution_results[source_node_id]
                if source_port not in source_result.get('outputs', {}):
                    raise ValueError(f"Source port {source_port} not found in node {source_node_id}")
                
                inputs[port_name] = source_result['outputs'][source_port]
                input_hashes[port_name] = self._node_hashes.get(source_node_id, "")
            
            # Create context
            context = NodeContext(
                node_id=node.id,
                inputs=inputs,
                params=node.params,
                cache_dir=str(self.cache_manager.cache_dir),
                global_seed=workflow.seed
            )
            
            # Validate
            input_errors = executor.validate_inputs(context)
            param_errors = executor.validate_params(context)
            if input_errors or param_errors:
                errors = input_errors + param_errors
                raise ValueError("; ".join(errors))
            
            # Check cache
            spec = executor.spec
            cache_key = None
            
            if not force_recompute and spec.cache_policy == CachePolicy.AUTO:
                cache_key = self.cache_manager.compute_hash(
                    node.id, node.type, node.params, input_hashes
                )
                cached_result = self.cache_manager.get(cache_key)
                
                if cached_result:
                    logger.info(f"Using cached result for node {node.id}")
                    node.status = NodeStatus.CACHED
                    node.cache_key = cache_key
                    self._execution_results[node.id] = cached_result
                    self._node_hashes[node.id] = cache_key
                    return NodeResult(**cached_result)
            
            # Execute node
            logger.info(f"Executing node {node.id} ({node.type})")
            node.status = NodeStatus.RUNNING
            
            result = await executor.run(context)
            result.execution_time = time.time() - start_time
            
            # Store result
            result_dict = result.model_dump()
            self._execution_results[node.id] = result_dict
            
            # Cache result
            if spec.cache_policy == CachePolicy.AUTO and cache_key:
                self.cache_manager.set(cache_key, result_dict)
                self._node_hashes[node.id] = cache_key
                node.cache_key = cache_key
            
            node.status = NodeStatus.SUCCESS
            node.execution_time = result.execution_time
            node.error = None
            
            logger.info(f"Node {node.id} completed in {result.execution_time:.2f}s")
            return result
            
        except Exception as e:
            node.status = NodeStatus.ERROR
            node.error = str(e)
            node.execution_time = time.time() - start_time
            logger.error(f"Node {node.id} failed: {e}", exc_info=True)
            
            return NodeResult(
                error=str(e),
                execution_time=time.time() - start_time
            )
    
    async def execute_workflow(self, workflow: Workflow, 
                               changed_nodes: Optional[Set[str]] = None) -> Dict[str, NodeResult]:
        """Execute entire workflow or incrementally update changed nodes."""
        results = {}
        
        try:
            # Get execution order
            sorted_nodes = self.topological_sort(workflow)
            
            # Determine which nodes need recomputation
            nodes_to_execute = set()
            
            if changed_nodes:
                # Incremental execution: only changed nodes and downstream
                for node_id in changed_nodes:
                    nodes_to_execute.add(node_id)
                    nodes_to_execute.update(self.get_downstream_nodes(node_id, workflow))
                
                # Invalidate cache for these nodes
                for node_id in nodes_to_execute:
                    node = next((n for n in workflow.nodes if n.id == node_id), None)
                    if node and node.cache_key:
                        self.cache_manager.invalidate(node.cache_key)
            else:
                # Full execution
                nodes_to_execute = set(sorted_nodes)
            
            # Execute nodes in topological order
            for node_id in sorted_nodes:
                node = next((n for n in workflow.nodes if n.id == node_id), None)
                if not node:
                    continue
                
                force_recompute = node_id in nodes_to_execute
                result = await self.execute_node(node, workflow, force_recompute)
                results[node_id] = result
            
            return results
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}", exc_info=True)
            raise
    
    def get_node_result(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Get the execution result for a node."""
        return self._execution_results.get(node_id)
    
    def clear_results(self):
        """Clear all execution results."""
        self._execution_results.clear()
        self._node_hashes.clear()
    
    def invalidate_node(self, node_id: str):
        """Invalidate a node's cached result."""
        if node_id in self._node_hashes:
            cache_key = self._node_hashes[node_id]
            self.cache_manager.invalidate(cache_key)
        
        if node_id in self._execution_results:
            del self._execution_results[node_id]
        
        if node_id in self._node_hashes:
            del self._node_hashes[node_id]
