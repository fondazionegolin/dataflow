/**
 * Floating widget that attaches to nodes and shows data/results
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import Plot from 'react-plotly.js';

interface FloatingWidgetProps {
  nodeId: string;
  nodePosition: { x: number; y: number };
  nodeLabel: string;
  type: 'data' | 'plot' | 'metrics';
  data?: any;
  onClose: () => void;
  zoomLevel: number;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  nodeId,
  nodePosition,
  nodeLabel,
  type,
  data,
  onClose,
  zoomLevel,
}) => {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Calculate initial position below the node
  useEffect(() => {
    const offsetY = 150; // Distance below node
    setPosition({
      x: nodePosition.x * zoomLevel,
      y: (nodePosition.y + offsetY) * zoomLevel,
    });
  }, [nodePosition, zoomLevel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.widget-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      return 'small';
    });
  };

  const sizeClasses = {
    small: 'w-64 h-48',
    medium: 'w-96 h-64',
    large: 'w-[600px] h-[400px]',
  };

  const renderContent = () => {
    if (!data) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          No data available
        </div>
      );
    }

    switch (type) {
      case 'data':
        return renderDataTable();
      case 'plot':
        return renderPlot();
      case 'metrics':
        return renderMetrics();
      default:
        return null;
    }
  };

  const renderDataTable = () => {
    if (!data.head || data.head.length === 0) {
      return <div className="p-4 text-gray-500 text-sm">No data</div>;
    }

    const columns = Object.keys(data.head[0]);
    const rows = data.head.slice(0, size === 'small' ? 5 : size === 'medium' ? 10 : 20);

    return (
      <div className="overflow-auto h-full">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-1 text-left text-xs font-medium text-gray-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-2 py-1 text-gray-500">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="px-2 py-1 text-gray-900">
                    {typeof row[col] === 'number'
                      ? row[col].toFixed(3)
                      : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.shape && (
          <div className="px-2 py-1 bg-gray-50 text-xs text-gray-600 border-t">
            Total: {data.shape[0]} rows × {data.shape[1]} columns
          </div>
        )}
      </div>
    );
  };

  const renderPlot = () => {
    if (!data.plot_json) {
      return <div className="p-4 text-gray-500 text-sm">No plot data</div>;
    }

    try {
      const plotData = JSON.parse(data.plot_json);
      return (
        <div className="w-full h-full p-2">
          <Plot
            data={plotData.data}
            layout={{
              ...plotData.layout,
              autosize: true,
              margin: { l: 40, r: 20, t: 30, b: 40 },
            }}
            config={{
              responsive: true,
              displayModeBar: false,
              displaylogo: false,
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      );
    } catch (e) {
      return <div className="p-4 text-red-500 text-sm">Error rendering plot</div>;
    }
  };

  const renderMetrics = () => {
    if (!data || typeof data !== 'object') {
      return <div className="p-4 text-gray-500 text-sm">No metrics</div>;
    }

    const metrics = Object.entries(data).filter(
      ([key, value]) => typeof value !== 'object'
    );

    return (
      <div className="p-3 space-y-2 overflow-auto h-full">
        {metrics.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center py-1 border-b border-gray-100"
          >
            <span className="text-xs text-gray-600 uppercase">{key}</span>
            <span className="text-sm font-bold text-gray-900">
              {typeof value === 'number' ? value.toFixed(4) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={widgetRef}
      className={`absolute ${sizeClasses[size]} bg-white rounded-lg shadow-2xl border-2 border-primary/20 flex flex-col overflow-hidden transition-all ${
        isDragging ? 'cursor-move' : ''
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="widget-header flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary to-primary/80 text-white cursor-move">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          <span className="text-sm font-medium truncate">{nodeLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={size === 'small' ? 'Expand' : size === 'medium' ? 'Maximize' : 'Minimize'}
          >
            {size === 'large' ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white">{renderContent()}</div>

      {/* Footer with type indicator */}
      <div className="px-3 py-1 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        {type === 'data' && '📊 Data Preview'}
        {type === 'plot' && '📈 Visualization'}
        {type === 'metrics' && '📊 Metrics'}
      </div>
    </div>
  );
};
