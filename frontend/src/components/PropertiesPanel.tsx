/**
 * Properties panel for editing node parameters
 */

import React, { useState } from 'react';
import { Node } from 'reactflow';
import { NodeData, ParamType } from '@/types';
import { useWorkflowStore } from '@/store/workflowStore';
import { X, Table2 } from 'lucide-react';
import { DataPreviewModal } from './DataPreviewModal';

interface PropertiesPanelProps {
  node: Node<NodeData> | null;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ node, onClose }) => {
  const updateNodeParams = useWorkflowStore((state) => state.updateNodeParams);
  const { edges } = useWorkflowStore();
  const [showDataPreview, setShowDataPreview] = useState(false);

  if (!node) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center text-gray-500">
        Select a node to edit properties
      </div>
    );
  }

  const { spec, params } = node.data;
  
  // Check if this is a transformation node that needs data preview
  const isTransformNode = ['data.select', 'data.transform', 'data.filter'].includes(spec.type);
  
  // Find input node
  const inputEdge = edges.find((e) => e.target === node.id);
  const inputNodeId = inputEdge?.source;

  const handleParamChange = (paramName: string, value: any) => {
    updateNodeParams(node.id, { [paramName]: value });
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

      case ParamType.MULTI_SELECT:
        return (
          <select
            multiple
            value={value || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              handleParamChange(param.name, selected);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            size={Math.min(param.options?.length || 5, 5)}
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

      case ParamType.COLOR:
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        );

      case ParamType.CODE:
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
            placeholder={param.description}
          />
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

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{node.data.label}</h2>
          <p className="text-xs text-gray-500">{spec.type}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Description */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-700">{spec.description}</p>
      </div>

      {/* Visual Column Selector for Transform Nodes */}
      {isTransformNode && inputNodeId && (
        <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
          <button
            onClick={() => setShowDataPreview(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Table2 className="w-4 h-4" />
            Select Columns Visually
          </button>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Click to see data and select columns interactively
          </p>
        </div>
      )}

      {/* Parameters */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {spec.params.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
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

      {/* Node Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Inputs:</span>
            <span className="font-medium">{spec.inputs.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Outputs:</span>
            <span className="font-medium">{spec.outputs.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{spec.category}</span>
          </div>
        </div>
      </div>

      {/* Data Preview Modal */}
      {showDataPreview && (
        <DataPreviewModal
          isOpen={showDataPreview}
          onClose={() => setShowDataPreview(false)}
          nodeId={node.id}
          nodeType={spec.type}
          nodeLabel={node.data.label}
          inputNodeId={inputNodeId}
          currentParams={params}
          onParamsChange={(newParams) => {
            updateNodeParams(node.id, newParams);
            setShowDataPreview(false);
          }}
        />
      )}
    </div>
  );
};
