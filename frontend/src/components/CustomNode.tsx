/**
 * Custom node component for React Flow
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData, NodeStatus, PortType } from '@/types';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

const getPortColor = (portType: PortType): string => {
  switch (portType) {
    case PortType.TABLE:
      return 'bg-blue-500';
    case PortType.SERIES:
      return 'bg-green-500';
    case PortType.MODEL:
      return 'bg-purple-500';
    case PortType.METRICS:
      return 'bg-orange-500';
    case PortType.PARAMS:
      return 'bg-yellow-500';
    case PortType.ARRAY_3D:
      return 'bg-pink-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: NodeStatus) => {
  switch (status) {
    case NodeStatus.RUNNING:
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case NodeStatus.SUCCESS:
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case NodeStatus.ERROR:
      return <XCircle className="w-4 h-4 text-red-500" />;
    case NodeStatus.CACHED:
      return <Clock className="w-4 h-4 text-purple-500" />;
    default:
      return null;
  }
};

export const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  const { spec, status, error, executionTime } = data;
  
  const getBorderColor = () => {
    if (status === NodeStatus.ERROR) return '#ef4444';
    return spec.color || '#666';
  };
  
  return (
    <div className="relative min-w-[200px] rounded-lg">
      {/* Thick draggable border overlay */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          border: `12px solid ${getBorderColor()}`,
        }}
      />
      
      {/* Draggable border areas - only these areas allow dragging */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-auto cursor-move"
        style={{
          padding: '12px',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 12px 12px, 12px calc(100% - 12px), calc(100% - 12px) calc(100% - 12px), calc(100% - 12px) 12px, 12px 12px)'
        }}
      />
      
      {/* Main content area */}
      <div
        className={`
          relative bg-white rounded-lg shadow-lg
          ${selected ? 'ring-2 ring-primary/20' : ''}
        `}
        style={{ 
          borderWidth: '12px',
          borderStyle: 'solid',
          borderColor: getBorderColor(),
          pointerEvents: 'auto'
        }}
      >
        {/* Input Handles */}
        {spec.inputs.map((input, index) => (
          <Handle
            key={`input-${input.name}`}
            type="target"
            position={Position.Left}
            id={input.name}
            className={`${getPortColor(input.type)} !w-3 !h-3`}
            style={{
              top: `${((index + 1) * 100) / (spec.inputs.length + 1)}%`,
            }}
            title={input.label}
          />
        ))}

        {/* Output Handles */}
        {spec.outputs.map((output, index) => (
          <Handle
            key={`output-${output.name}`}
            type="source"
            position={Position.Right}
            id={output.name}
            className={`${getPortColor(output.type)} !w-3 !h-3`}
            style={{
              top: `${((index + 1) * 100) / (spec.outputs.length + 1)}%`,
            }}
            title={output.label}
          />
        ))}

        {/* Header */}
        <div
          className="px-4 py-2 rounded-t-lg text-white font-semibold flex items-center justify-between"
          style={{ backgroundColor: spec.color || '#666' }}
        >
          <div className="flex items-center gap-2">
            {spec.icon && <span className="text-lg">{spec.icon}</span>}
            <span className="text-sm">{data.label}</span>
          </div>
          {getStatusIcon(status)}
        </div>

        {/* Body - Prevent dragging from body */}
        <div 
          className="px-4 py-3 text-xs text-gray-600"
          onMouseDown={(e) => {
            // Prevent dragging when clicking on body content
            e.stopPropagation();
          }}
        >
          <div className="mb-1">{spec.category}</div>
          {executionTime !== undefined && (
            <div className="text-gray-500">
              {executionTime.toFixed(2)}s
            </div>
          )}
          {error && (
            <div className="mt-2 text-red-600 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
