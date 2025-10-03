/**
 * Unified modal for node configuration, data preview, and results
 */

import React, { useState, useEffect } from 'react';
import { X, Settings, Table2, BarChart3, Check, Search, Maximize2 } from 'lucide-react';
import { Node } from 'reactflow';
import { NodeData, ParamType } from '@/types';
import { useWorkflowStore } from '@/store/workflowStore';
import { api } from '@/lib/api';
import Plot from 'react-plotly.js';

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<NodeData>;
}

export const NodeModal: React.FC<NodeModalProps> = ({ isOpen, onClose, node }) => {
  const { edges, executionResults, updateNodeParams } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'config' | 'data' | 'results'>('config');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Data preview state
  const [previewData, setPreviewData] = useState<any>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    node.data.params.columns || node.data.params.include_columns || []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const { spec, params, status } = node.data;
  const result = executionResults[node.id];
  
  // Check if this is a transformation node
  const isTransformNode = ['data.select', 'data.transform', 'data.filter'].includes(spec.type);
  
  // Find input node
  const inputEdge = edges.find((e) => e.target === node.id);
  const inputNodeId = inputEdge?.source;

  // Load preview data when data tab is opened
  useEffect(() => {
    if (activeTab === 'data' && inputNodeId && !previewData) {
      loadPreviewData();
    }
  }, [activeTab, inputNodeId]);

  const loadPreviewData = async () => {
    if (!inputNodeId) return;
    
    setLoading(true);
    try {
      const result = await api.getNodeResult(inputNodeId);
      if (result && result.preview && result.preview.head) {
        setPreviewData(result.preview.head);
        const cols = Object.keys(result.preview.head[0] || {});
        setColumns(cols);
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (paramName: string, value: any) => {
    updateNodeParams(node.id, { [paramName]: value });
  };

  const toggleColumn = (column: string) => {
    const newSelected = selectedColumns.includes(column)
      ? selectedColumns.filter((c) => c !== column)
      : [...selectedColumns, column];
    setSelectedColumns(newSelected);
  };

  const applyColumnSelection = () => {
    if (spec.type === 'data.select') {
      updateNodeParams(node.id, {
        ...params,
        columns: selectedColumns,
        mode: 'include',
      });
    } else if (spec.type === 'data.transform') {
      updateNodeParams(node.id, {
        ...params,
        columns: selectedColumns,
      });
    }
  };

  const renderParamInput = (param: any) => {
    const value = params[param.name] ?? param.default;

    switch (param.type) {
      case ParamType.STRING:
      case ParamType.FILE:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={param.description}
          />
        );

      case ParamType.NUMBER:
      case ParamType.INTEGER:
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => {
              const val = param.type === ParamType.INTEGER
                ? parseInt(e.target.value)
                : parseFloat(e.target.value);
              handleParamChange(param.name, isNaN(val) ? param.default : val);
            }}
            min={param.min}
            max={param.max}
            step={param.step || (param.type === ParamType.INTEGER ? 1 : 0.1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );

      case ParamType.BOOLEAN:
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleParamChange(param.name, e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-700">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case ParamType.SELECT:
        return (
          <select
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {param.options?.map((option: any) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case ParamType.SLIDER:
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={value ?? param.default}
              onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
              min={param.min}
              max={param.max}
              step={param.step || 0.01}
              className="w-full"
            />
            <div className="text-sm text-gray-600 text-center">
              {value?.toFixed(2) ?? param.default}
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );
    }
  };

  const renderConfigTab = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {spec.params.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No parameters to configure
          </div>
        ) : (
          spec.params.map((param) => (
            <div key={param.name} className="space-y-2">
              <label className="block">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {param.label}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
                {param.description && (
                  <div className="text-xs text-gray-500 mb-2">
                    {param.description}
                  </div>
                )}
                {renderParamInput(param)}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderDataTab = () => {
    const filteredColumns = columns.filter((col) =>
      col.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex-1 flex overflow-hidden">
        {/* Column Selector */}
        {isTransformNode && (
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Select Columns</h3>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedColumns([...columns])}
                  className="flex-1 px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90"
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedColumns([])}
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  onClick={applyColumnSelection}
                  className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : filteredColumns.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No columns</div>
              ) : (
                <div className="space-y-2">
                  {filteredColumns.map((column) => {
                    const isSelected = selectedColumns.includes(column);
                    return (
                      <button
                        key={column}
                        onClick={() => toggleColumn(column)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-medium text-sm truncate">{column}</span>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
              Selected: <span className="font-bold">{selectedColumns.length}</span> / {columns.length}
            </div>
          </div>
        )}

        {/* Data Preview */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading preview...
            </div>
          ) : !previewData || previewData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Table2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No data available</p>
                <p className="text-xs mt-1">Execute the workflow first</p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    {columns.map((col) => {
                      const isSelected = selectedColumns.includes(col);
                      return (
                        <th
                          key={col}
                          className={`px-4 py-3 text-left text-xs font-medium uppercase transition-colors ${
                            isSelected ? 'bg-primary/10 text-primary' : 'text-gray-500'
                          }`}
                        >
                          {col}
                          {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 20).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      {columns.map((col) => {
                        const isSelected = selectedColumns.includes(col);
                        return (
                          <td
                            key={col}
                            className={`px-4 py-3 whitespace-nowrap text-sm transition-colors ${
                              isSelected ? 'bg-primary/5 text-gray-900 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {typeof row[col] === 'number' ? row[col].toFixed(4) : String(row[col])}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResultsTab = () => {
    if (!result) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No results yet</p>
            <p className="text-xs mt-1">Execute the workflow to see results</p>
          </div>
        </div>
      );
    }

    // Render plot
    if (result.preview?.plot_json) {
      try {
        const plotData = JSON.parse(result.preview.plot_json);
        return (
          <div className="flex-1 p-4">
            <Plot
              data={plotData.data}
              layout={{
                ...plotData.layout,
                autosize: true,
              }}
              config={{ responsive: true, displaylogo: false }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        );
      } catch (e) {
        console.error('Failed to parse plot:', e);
      }
    }

    // Render metrics
    if (result.metadata && Object.keys(result.metadata).length > 0) {
      return (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(result.metadata).map(([key, value]) => {
                if (typeof value === 'object') return null;
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {typeof value === 'number' ? value.toFixed(4) : String(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No visualization available
      </div>
    );
  };

  if (!isOpen) return null;

  const modalSize = isFullscreen ? 'w-screen h-screen' : 'w-[90vw] h-[85vh] max-w-7xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${modalSize} transition-all`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{node.data.label}</h2>
            <p className="text-sm text-gray-500">{spec.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configuration
          </button>
          {(isTransformNode || inputNodeId) && (
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'data'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Table2 className="w-4 h-4" />
              Data & Selection
            </button>
          )}
          {status === 'success' && result && (
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'results'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Results
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'config' && renderConfigTab()}
          {activeTab === 'data' && renderDataTab()}
          {activeTab === 'results' && renderResultsTab()}
        </div>
      </div>
    </div>
  );
};
