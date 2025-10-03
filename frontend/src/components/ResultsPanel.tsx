/**
 * Results panel for displaying node outputs (plots, tables, metrics)
 */

import React, { useState } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { X, Table2, BarChart3, Info } from 'lucide-react';
import Plot from 'react-plotly.js';

export const ResultsPanel: React.FC = () => {
  const { selectedNodeId, nodes, executionResults } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'outputs' | 'metadata'>('preview');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const result = selectedNodeId ? executionResults[selectedNodeId] : null;

  if (!selectedNode || !result) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 flex items-center justify-center text-gray-500">
        <div className="text-center p-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">Execute a workflow to see results</p>
        </div>
      </div>
    );
  }

  const renderPreview = () => {
    if (!result.preview) {
      return (
        <div className="text-center text-gray-500 py-8">
          No preview available
        </div>
      );
    }

    // Check if there's a plot
    if (result.preview.plot_json) {
      try {
        const plotData = JSON.parse(result.preview.plot_json);
        return (
          <div className="w-full h-full">
            <Plot
              data={plotData.data}
              layout={{
                ...plotData.layout,
                autosize: true,
                margin: { l: 50, r: 50, t: 50, b: 50 },
              }}
              config={{ responsive: true }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        );
      } catch (e) {
        console.error('Failed to parse plot:', e);
      }
    }

    // Check if there's a table preview
    if (result.preview.head) {
      const data = result.preview.head;
      if (data.length === 0) return <div className="text-gray-500 p-4">No data</div>;

      const columns = Object.keys(data[0]);

      return (
        <div className="overflow-auto h-full">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {typeof row[col] === 'number'
                        ? row[col].toFixed(4)
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Show other preview data
    return (
      <div className="p-4 space-y-2 text-sm">
        {Object.entries(result.preview).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium text-gray-700">{key}:</span>{' '}
            <span className="text-gray-900">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderOutputs = () => {
    if (!result.outputs) {
      return <div className="text-gray-500 p-4">No outputs</div>;
    }

    return (
      <div className="p-4 space-y-3 text-sm">
        {Object.entries(result.outputs).map(([key, value]) => (
          <div key={key} className="border border-gray-200 rounded p-3">
            <div className="font-medium text-gray-700 mb-1">{key}</div>
            <div className="text-gray-600 text-xs">
              {typeof value === 'object' ? (
                <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                String(value)
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!result.metadata) {
      return <div className="text-gray-500 p-4">No metadata</div>;
    }

    return (
      <div className="p-4 space-y-2 text-sm">
        {Object.entries(result.metadata).map(([key, value]) => (
          <div key={key} className="flex justify-between py-1 border-b border-gray-100">
            <span className="font-medium text-gray-700">{key}:</span>
            <span className="text-gray-900">
              {typeof value === 'number' && !Number.isInteger(value)
                ? value.toFixed(4)
                : typeof value === 'object'
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
        {result.execution_time && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="font-medium text-gray-700">Execution Time:</span>
            <span className="text-gray-900">{result.execution_time.toFixed(3)}s</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <button
            onClick={() => useWorkflowStore.getState().setSelectedNodeId(null)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-gray-600">{selectedNode.data.label}</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" />
          Preview
        </button>
        <button
          onClick={() => setActiveTab('outputs')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'outputs'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Table2 className="w-4 h-4 inline mr-1" />
          Outputs
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'metadata'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Info className="w-4 h-4 inline mr-1" />
          Info
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'preview' && renderPreview()}
        {activeTab === 'outputs' && renderOutputs()}
        {activeTab === 'metadata' && renderMetadata()}
      </div>
    </div>
  );
};
