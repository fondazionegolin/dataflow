/**
 * Interactive data preview modal for transformation nodes
 * Allows visual column selection and data inspection
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Search, Filter, Eye } from 'lucide-react';
import { api } from '@/api';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  inputNodeId?: string;
  currentParams: Record<string, any>;
  onParamsChange: (params: Record<string, any>) => void;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  nodeType,
  nodeLabel,
  inputNodeId,
  currentParams,
  onParamsChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    currentParams.columns || currentParams.include_columns || []
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && inputNodeId) {
      loadPreviewData();
    }
  }, [isOpen, inputNodeId]);

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

  const toggleColumn = (column: string) => {
    const newSelected = selectedColumns.includes(column)
      ? selectedColumns.filter((c) => c !== column)
      : [...selectedColumns, column];
    setSelectedColumns(newSelected);
  };

  const selectAll = () => {
    setSelectedColumns([...columns]);
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

  const handleApply = () => {
    // Update params based on node type
    if (nodeType === 'data.select') {
      onParamsChange({
        ...currentParams,
        columns: selectedColumns,
        mode: 'include',
      });
    } else if (nodeType === 'data.transform') {
      onParamsChange({
        ...currentParams,
        columns: selectedColumns,
      });
    }
    onClose();
  };

  const filteredColumns = columns.filter((col) =>
    col.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-[90vw] h-[85vh] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{nodeLabel}</h2>
            <p className="text-sm text-gray-500">Select columns to process</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Column Selector */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
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
                  onClick={selectAll}
                  className="flex-1 px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading columns...</div>
              ) : filteredColumns.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No columns found</div>
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

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">
                Selected: <span className="font-bold">{selectedColumns.length}</span> /{' '}
                {columns.length} columns
              </div>
            </div>
          </div>

          {/* Right: Data Preview */}
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span>Data Preview (first 10 rows)</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading preview...</div>
                </div>
              ) : !previewData || previewData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <Filter className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No data available</p>
                    <p className="text-xs mt-1">Connect an input node first</p>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        {columns.map((col) => {
                          const isSelected = selectedColumns.includes(col);
                          return (
                            <th
                              key={col}
                              className={`px-4 py-3 text-left text-xs font-medium uppercase transition-colors ${
                                isSelected
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-gray-500'
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                {col}
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 10).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                          {columns.map((col) => {
                            const isSelected = selectedColumns.includes(col);
                            return (
                              <td
                                key={col}
                                className={`px-4 py-3 whitespace-nowrap text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-primary/5 text-gray-900 font-medium'
                                    : 'text-gray-700'
                                }`}
                              >
                                {typeof row[col] === 'number'
                                  ? row[col].toFixed(4)
                                  : String(row[col])}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedColumns.length > 0 ? (
              <span>
                <span className="font-bold">{selectedColumns.length}</span> column
                {selectedColumns.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span className="text-orange-600">⚠️ No columns selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selectedColumns.length === 0}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
