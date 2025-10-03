/**
 * Type definitions for the DataFlow Platform frontend
 */

export enum PortType {
  TABLE = "table",
  SERIES = "series",
  ARRAY_3D = "array3d",
  MODEL = "model",
  METRICS = "metrics",
  PARAMS = "params",
  ANY = "any"
}

export enum ParamType {
  STRING = "string",
  NUMBER = "number",
  INTEGER = "integer",
  BOOLEAN = "boolean",
  SELECT = "select",
  MULTI_SELECT = "multi_select",
  SLIDER = "slider",
  COLOR = "color",
  FILE = "file",
  CODE = "code",
  COLUMN = "column",
  COLUMNS = "columns"
}

export enum NodeStatus {
  IDLE = "idle",
  RUNNING = "running",
  CACHED = "cached",
  SUCCESS = "success",
  ERROR = "error"
}

export interface PortSpec {
  name: string;
  type: PortType;
  label: string;
  required?: boolean;
  description?: string;
}

export interface ParamSpec {
  name: string;
  type: ParamType;
  label: string;
  default?: any;
  required?: boolean;
  description?: string;
  options?: any[];
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
  language?: string;
}

export interface NodeSpec {
  type: string;
  label: string;
  category: string;
  description: string;
  inputs: PortSpec[];
  outputs: PortSpec[];
  params: ParamSpec[];
  cache_policy?: string;
  icon?: string;
  color?: string;
}

export interface NodeData {
  type: string;
  label: string;
  spec: NodeSpec;
  params: Record<string, any>;
  status: NodeStatus;
  error?: string;
  executionTime?: number;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface Workflow {
  version: string;
  name: string;
  description?: string;
  seed?: number;
  nodes: Array<{
    id: string;
    type: string;
    label?: string;
    params: Record<string, any>;
    position: { x: number; y: number };
    status?: NodeStatus;
  }>;
  edges: Array<{
    id: string;
    source_node: string;
    source_port: string;
    target_node: string;
    target_port: string;
  }>;
  metadata?: Record<string, any>;
}

export interface NodeResult {
  outputs: Record<string, any>;
  metadata: Record<string, any>;
  preview?: any;
  error?: string;
  execution_time?: number;
}

export interface ExecuteWorkflowResponse {
  success: boolean;
  results: Record<string, NodeResult>;
  errors: Record<string, string>;
}
