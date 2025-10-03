/**
 * Modal for displaying node results (plots, tables, metrics)
 */

import React, { useState } from 'react';
import { X, Maximize2, Table2, BarChart3, Info } from 'lucide-react';
import Plot from 'react-plotly.js';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeLabel: string;
  nodeType: string;
  result: any;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  nodeLabel,
  nodeType,
  result,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'data' | 'info'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !result) return null;

  const renderPreview = () => {
    if (!result.preview) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No preview available</p>
          </div>
        </div>
      );
    }

    // Render plot
    if (result.preview.plot_json) {
      try {
        const plotData = JSON.parse(result.preview.plot_json);
        return (
          <div className="w-full h-full p-4">
            <Plot
              data={plotData.data}
              layout={{
                ...plotData.layout,
                autosize: true,
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        );
      } catch (e) {
        console.error('Failed to parse plot:', e);
        return <div className="text-red-500 p-4">Error rendering plot</div>;
      }
    }

    // Render table
    if (result.preview.head && Array.isArray(result.preview.head)) {
      const data = result.preview.head;
      if (data.length === 0) {
        return <div className="text-gray-500 p-8 text-center">No data to display</div>;
      }

      const columns = Object.keys(data[0]);

      return (
        <div className="overflow-auto h-full p-4">
          <div className="mb-4 text-sm text-gray-600">
            Showing first {data.length} rows
            {result.preview.shape && ` of ${result.preview.shape[0]} total`}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
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
        </div>
      );
    }

    // Render confusion matrix or other visualizations
    if (result.preview.confusion_matrix_plot) {
      try {
        const plotData = JSON.parse(result.preview.confusion_matrix_plot);
        return (
          <div className="w-full h-full p-4">
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
        console.error('Failed to parse confusion matrix:', e);
      }
    }

    // Fallback: show preview data as JSON
    return (
      <div className="p-6 overflow-auto h-full">
        <pre className="bg-gray-50 p-4 rounded-lg text-sm">
          {JSON.stringify(result.preview, null, 2)}
        </pre>
      </div>
    );
  };

  const renderData = () => {
    if (!result.outputs) {
      return <div className="text-gray-500 p-8 text-center">No output data</div>;
    }

    return (
      <div className="p-6 space-y-4 overflow-auto h-full">
        {Object.entries(result.outputs).map(([key, value]) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{key}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {typeof value}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              {typeof value === 'object' ? (
                <pre className="bg-gray-50 p-3 rounded overflow-auto max-h-60 text-xs">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <div className="bg-gray-50 p-3 rounded">{String(value)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderInfo = () => {
    const metadata = result.metadata || {};
    const hasMetrics = Object.keys(metadata).length > 0;

    return (
      <div className="p-6 overflow-auto h-full">
        {/* Metrics */}
        {hasMetrics && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(metadata).map(([key, value]) => {
                // Skip confusion matrix and other large objects
                if (typeof value === 'object') return null;
                
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {typeof value === 'number'
                        ? value.toFixed(4)
                        : String(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Execution Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Node Type</span>
              <span className="font-medium text-gray-900">{nodeType}</span>
            </div>
            {result.execution_time && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Execution Time</span>
                <span className="font-medium text-gray-900">
                  {result.execution_time.toFixed(3)}s
                </span>
              </div>
            )}
            {result.preview?.shape && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Data Shape</span>
                <span className="font-medium text-gray-900">
                  {result.preview.shape[0]} × {result.preview.shape[1]}
                </span>
              </div>
            )}
            {result.preview?.n_points && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Points</span>
                <span className="font-medium text-gray-900">
                  {result.preview.n_points.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const modalSize = isFullscreen
    ? 'w-screen h-screen'
    : 'w-[90vw] h-[85vh] max-w-7xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${modalSize} transition-all`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{nodeLabel}</h2>
            <p className="text-sm text-gray-500">{nodeType}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Table2 className="w-4 h-4" />
            Data
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Info className="w-4 h-4" />
            Info
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'preview' && renderPreview()}
          {activeTab === 'data' && renderData()}
          {activeTab === 'info' && renderInfo()}
        </div>
      </div>
    </div>
  );
};
