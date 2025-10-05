/**
 * Zustand store for workflow state management
 */

import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { NodeSpec, NodeStatus, Workflow, ExecuteWorkflowResponse } from '@/types';
import { api } from '@/api';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

interface WorkflowState {
  // Workflow metadata
  workflowName: string;
  workflowDescription: string;
  globalSeed: number;
  
  // React Flow state
  nodes: Node[];
  edges: Edge[];
  
  // Node specifications
  nodeSpecs: NodeSpec[];
  nodeSpecsLoaded: boolean;
  
  // Execution state
  isExecuting: boolean;
  executionResults: Record<string, any>;
  
  // UI state
  selectedNodeId: string | null;
  
  // Logs
  logs: LogEntry[];
  currentTip: string | null;
  
  // Actions
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  setGlobalSeed: (seed: number) => void;
  
  // Node/Edge management
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  
  addNode: (nodeType: string, position: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeParams: (nodeId: string, params: Record<string, any>) => void;
  
  // Node specs
  loadNodeSpecs: () => Promise<void>;
  
  // Execution
  executeWorkflow: () => Promise<ExecuteWorkflowResponse>;
  executeNode: (nodeId: string) => Promise<void>;
  updateExecutionResult: (nodeId: string, result: any) => void;
  
  // Selection
  setSelectedNodeId: (nodeId: string | null) => void;
  
  // Workflow I/O
  exportWorkflow: () => Workflow;
  importWorkflow: (workflow: Workflow) => void;
  clearWorkflow: () => void;
  
  // Logs
  addLog: (level: LogLevel, message: string, details?: string) => void;
  clearLogs: () => void;
  setTip: (tip: string | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  workflowName: 'Untitled Workflow',
  workflowDescription: '',
  globalSeed: 42,
  nodes: [],
  edges: [],
  nodeSpecs: [],
  nodeSpecsLoaded: false,
  isExecuting: false,
  executionResults: {},
  selectedNodeId: null,
  logs: [],
  currentTip: null,

  // Workflow metadata actions
  setWorkflowName: (name) => set({ workflowName: name }),
  setWorkflowDescription: (description) => set({ workflowDescription: description }),
  setGlobalSeed: (seed) => set({ globalSeed: seed }),

  // Node/Edge management
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => {
    // Apply category classes to edges
    const nodesMap = get().nodes;
    const updatedEdges = edges.map(edge => {
      const targetNode = nodesMap.find(n => n.id === edge.target);
      const targetCategory = targetNode?.data.spec.category || 'default';
      return {
        ...edge,
        data: { ...edge.data, targetCategory },
        className: `edge-${targetCategory}`,
      };
    });
    set({ edges: updatedEdges });
  },
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection) => {
    const sourceNode = get().nodes.find(n => n.id === connection.source);
    const targetNode = get().nodes.find(n => n.id === connection.target);
    
    // Determine edge color based on target node category
    const targetCategory = targetNode?.data.spec.category || 'default';
    
    set({
      edges: addEdge(
        {
          ...connection,
          id: `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
          data: { targetCategory },
          className: `edge-${targetCategory}`,
        },
        get().edges
      ),
    });
    
    get().addLog(
      'info',
      `Connected: ${sourceNode?.data.label || 'Node'} → ${targetNode?.data.label || 'Node'}`,
      `${connection.sourceHandle} to ${connection.targetHandle}`
    );
  },

  addNode: (nodeType, position) => {
    const specs = get().nodeSpecs;
    const spec = specs.find((s) => s.type === nodeType);
    
    if (!spec) {
      console.error(`Node spec not found for type: ${nodeType}`);
      get().addLog('error', 'Failed to add node', `Node type '${nodeType}' not found`);
      return;
    }

    const nodeId = `${nodeType}-${Date.now()}`;
    
    // Initialize params with defaults
    const params: Record<string, any> = {};
    spec.params.forEach((param) => {
      if (param.default !== undefined) {
        params[param.name] = param.default;
      }
    });

    const newNode: Node = {
      id: nodeId,
      type: 'customNode',
      position,
      data: {
        type: nodeType,
        label: spec.label,
        spec,
        params,
        status: NodeStatus.IDLE,
      },
    };

    set({ nodes: [...get().nodes, newNode] });
    get().addLog('success', `Added node: ${spec.label}`, `Type: ${nodeType}`);
    
    // Set contextual tip based on node type
    if (spec.category === 'sources') {
      get().setTip('Great! Now configure your data source and connect it to a transform or visualization node.');
    } else if (spec.category === 'transform') {
      get().setTip('Configure the transformation parameters and connect it to see the results.');
    } else if (spec.category === 'visualization') {
      get().setTip('Connect a data source to this visualization node to see your data plotted.');
    }
  },

  deleteNode: (nodeId) => {
    const node = get().nodes.find(n => n.id === nodeId);
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
    if (node) {
      get().addLog('warning', `Deleted node: ${node.data.label}`, `ID: ${nodeId}`);
    }
  },

  updateNodeParams: (nodeId, params) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, params: { ...node.data.params, ...params } } }
          : node
      ),
    });
  },

  // Load node specifications
  loadNodeSpecs: async () => {
    try {
      const specs = await api.getNodeSpecs();
      set({ nodeSpecs: specs, nodeSpecsLoaded: true });
    } catch (error) {
      console.error('Failed to load node specs:', error);
    }
  },

  // Execute workflow
  executeWorkflow: async () => {
    set({ isExecuting: true });
    get().addLog('info', 'Executing workflow...', `${get().nodes.length} nodes to process`);
    
    try {
      const workflow = get().exportWorkflow();
      const response = await api.executeWorkflow(workflow);
      
      // Count successes and errors
      const successCount = Object.keys(response.results).length;
      const errorCount = Object.keys(response.errors).length;
      
      // Update node statuses based on results
      const updatedNodes = get().nodes.map((node) => {
        const result = response.results[node.id];
        const error = response.errors[node.id];
        
        // Log individual node errors
        if (error) {
          get().addLog(
            'error',
            `❌ ${node.data.label} failed`,
            error
          );
        } else if (result) {
          get().addLog(
            'success',
            `✓ ${node.data.label} completed`,
            result.execution_time ? `Executed in ${result.execution_time.toFixed(2)}s` : undefined
          );
        }
        
        return {
          ...node,
          data: {
            ...node.data,
            status: error ? NodeStatus.ERROR : NodeStatus.SUCCESS,
            error: error || undefined,
            executionTime: result?.execution_time,
          },
        };
      });
      
      set({
        nodes: updatedNodes,
        executionResults: response.results,
        isExecuting: false,
      });
      
      if (errorCount > 0) {
        get().addLog('error', `Workflow completed with errors`, `${successCount} succeeded, ${errorCount} failed`);
        
        // Provide specific tips based on common errors
        const errorMessages = Object.values(response.errors).join(' ');
        if (errorMessages.includes('not connected') || errorMessages.includes('missing input')) {
          get().setTip('💡 Missing connections: Make sure all required inputs are connected. Check the red nodes for specific error messages.');
        } else if (errorMessages.includes('column') || errorMessages.includes('feature')) {
          get().setTip('💡 Column/Feature error: Check that the column names in your configuration match the actual data columns.');
        } else if (errorMessages.includes('target') || errorMessages.includes('label')) {
          get().setTip('💡 Target/Label error: For ML nodes, make sure you specify a valid target column that exists in your data.');
        } else {
          get().setTip('💡 Check the log panel below for detailed error messages. Click on each red node to see what went wrong.');
        }
      } else {
        get().addLog('success', 'Workflow executed successfully', `All ${successCount} nodes completed`);
        get().setTip('Great! Your workflow executed successfully. You can now view the results in each node.');
      }
      
      return response;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      get().addLog('error', 'Workflow execution failed', error instanceof Error ? error.message : 'Unknown error');
      set({ isExecuting: false });
      throw error;
    }
  },

  // Execute single node
  executeNode: async (nodeId: string) => {
    const state = get();
    
    // Set node to running state
    set({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, status: NodeStatus.RUNNING } }
          : node
      ),
    });

    try {
      // Execute the entire workflow (backend will handle dependencies)
      await get().executeWorkflow();
    } catch (error) {
      // Set node to error state
      set({
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, status: NodeStatus.ERROR } }
            : node
        ),
      });
      throw error;
    }
  },

  // Update execution result for a specific node
  updateExecutionResult: (nodeId: string, result: any) => {
    set((state) => ({
      executionResults: {
        ...state.executionResults,
        [nodeId]: result
      }
    }));
  },

  // Selection
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  // Workflow I/O
  exportWorkflow: () => {
    const state = get();
    
    const workflow: Workflow = {
      version: '0.1.0',
      name: state.workflowName,
      description: state.workflowDescription,
      seed: state.globalSeed,
      nodes: state.nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        params: node.data.params,
        position: node.position,
        status: node.data.status,
      })),
      edges: state.edges.map((edge) => ({
        id: edge.id,
        source_node: edge.source,
        source_port: edge.sourceHandle || '',
        target_node: edge.target,
        target_port: edge.targetHandle || '',
      })),
      metadata: {},
    };
    
    return workflow;
  },

  importWorkflow: (workflow) => {
    const specs = get().nodeSpecs;
    
    const nodes: Node[] = workflow.nodes.map((node) => {
      const spec = specs.find((s) => s.type === node.type);
      
      return {
        id: node.id,
        type: 'customNode',
        position: node.position,
        data: {
          type: node.type,
          label: node.label || spec?.label || node.type,
          spec: spec!,
          params: node.params,
          status: node.status || NodeStatus.IDLE,
        },
      };
    });
    
    const edges: Edge[] = workflow.edges.map((edge) => {
      const targetNode = nodes.find(n => n.id === edge.target_node);
      const targetCategory = targetNode?.data.spec.category || 'default';
      
      return {
        id: edge.id,
        source: edge.source_node,
        target: edge.target_node,
        sourceHandle: edge.source_port,
        targetHandle: edge.target_port,
        data: { targetCategory },
        className: `edge-${targetCategory}`,
      };
    });
    
    set({
      workflowName: workflow.name,
      workflowDescription: workflow.description || '',
      globalSeed: workflow.seed || 42,
      nodes,
      edges,
    });
  },

  clearWorkflow: () => {
    set({
      workflowName: 'Untitled Workflow',
      workflowDescription: '',
      globalSeed: 42,
      nodes: [],
      edges: [],
      executionResults: {},
      selectedNodeId: null,
      logs: [],
      currentTip: null,
    });
  },

  // Logs management
  addLog: (level, message, details) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      message,
      details,
    };
    set((state) => ({
      logs: [...state.logs, newLog].slice(-50), // Keep last 50 logs
    }));
  },

  clearLogs: () => set({ logs: [] }),
  
  setTip: (tip) => set({ currentTip: tip }),
}));
