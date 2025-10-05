/**
 * Custom node component for React Flow
 */

import React, { useEffect, useRef, useState } from 'react';
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
  const nodeRef = useRef<HTMLDivElement>(null);
  const [activeHandles, setActiveHandles] = useState<Set<string>>(new Set());
  const PROXIMITY_RADIUS = 50; // pixels
  
  const getBorderColor = () => {
    if (status === NodeStatus.ERROR) return '#ef4444';
    return spec.color || '#666';
  };

  // Track mouse position and update handle states
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!nodeRef.current) return;

      const handles = nodeRef.current.querySelectorAll('.react-flow__handle');
      const newActiveHandles = new Set<string>();

      handles.forEach((handle) => {
        const rect = handle.getBoundingClientRect();
        const handleCenterX = rect.left + rect.width / 2;
        const handleCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(e.clientX - handleCenterX, 2) + 
          Math.pow(e.clientY - handleCenterY, 2)
        );

        const handleId = handle.getAttribute('data-handleid') || '';
        
        if (distance < PROXIMITY_RADIUS) {
          newActiveHandles.add(handleId);
          handle.classList.add('handle-active');
        } else {
          handle.classList.remove('handle-active');
        }
      });

      setActiveHandles(newActiveHandles);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <div ref={nodeRef} className="relative min-w-[200px] rounded-lg">
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
            data-handleid={`input-${input.name}`}
            className={`${getPortColor(input.type)}`}
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
            data-handleid={`output-${output.name}`}
            className={`${getPortColor(output.type)}`}
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
