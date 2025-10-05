import { ExecuteWorkflowResponse, NodeSpec, Workflow } from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8765";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  async getNodeSpecs(): Promise<NodeSpec[]> {
    return http<NodeSpec[]>("/api/nodes");
  },

  async executeWorkflow(workflow: Workflow): Promise<ExecuteWorkflowResponse> {
    return http<ExecuteWorkflowResponse>("/api/workflow/execute", {
      method: "POST",
      body: JSON.stringify({ workflow }),
    });
  },

  async getNodeResult(nodeId: string): Promise<any> {
    return http<any>(`/api/workflow/result/${encodeURIComponent(nodeId)}`);
  },
};

export type ApiClient = typeof api;
