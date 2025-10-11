/**
 * Modern, professional table editor with clean UI
 * Inspired by modern data table designs
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Download, Plus, Trash2, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TableEditorProps {
  data: any[];
  columns: string[];
  onClose: () => void;
  onSave?: (data: any[], columns: string[]) => void;
  title?: string;
  nodeId?: string;
  sessionId?: string;
  darkMode?: boolean;
}

export const TableEditor: React.FC<TableEditorProps> = ({
  data: initialData,
  columns: initialColumns,
  onClose,
  onSave,
  title = 'Table Editor',
  nodeId,
  sessionId,
  darkMode = false
}) => {
  const [data, setData] = useState(initialData);
  const [columns, setColumns] = useState(initialColumns);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Load full data from backend when nodeId is provided
  useEffect(() => {
    if (nodeId) {
      setLoading(true);
      console.log('[TableEditor] Loading full data for node:', nodeId);
      fetch(`http://127.0.0.1:8765/api/workflow/result/${encodeURIComponent(nodeId)}`)
        .then(res => res.json())
        .then(result => {
          console.log('[TableEditor] Received result:', result);
          console.log('[TableEditor] result.outputs:', result.outputs);
          console.log('[TableEditor] result.outputs keys:', result.outputs ? Object.keys(result.outputs) : 'no outputs');
          
          // Try different possible data locations
          let fullData = null;
          
          // Check all possible output keys
          if (result.outputs) {
            const outputKeys = Object.keys(result.outputs);
            console.log('[TableEditor] Available output keys:', outputKeys);
            
            // Try common keys
            for (const key of ['table', 'data', 'df', 'dataframe', 'output']) {
              if (result.outputs[key]) {
                const rawData = result.outputs[key];
                console.log(`[TableEditor] Found outputs.${key}:`, rawData);
                console.log(`[TableEditor] Type:`, typeof rawData, 'isArray:', Array.isArray(rawData));
                
                // Check if it's a serialized DataFrame (object with columns and data)
                if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
                  console.log(`[TableEditor] Keys in ${key}:`, Object.keys(rawData));
                  
                  // Try different DataFrame formats
                  if (rawData.data && Array.isArray(rawData.data)) {
                    fullData = rawData.data;
                    console.log(`[TableEditor] Using ${key}.data:`, fullData.length, 'rows');
                  } else if (rawData.values && Array.isArray(rawData.values)) {
                    fullData = rawData.values;
                    console.log(`[TableEditor] Using ${key}.values:`, fullData.length, 'rows');
                  } else {
                    // Check if it's column-oriented format (pandas default)
                    const cols = Object.keys(rawData);
                    if (cols.length > 0) {
                      const firstCol = rawData[cols[0]];
                      if (firstCol && typeof firstCol === 'object') {
                        // Column-oriented: {col1: {0: val, 1: val}, col2: {0: val, 1: val}}
                        const rowIndices = Object.keys(firstCol);
                        console.log(`[TableEditor] Column-oriented format detected, ${rowIndices.length} rows`);
                        
                        fullData = rowIndices.map(rowIdx => {
                          const row: any = {};
                          cols.forEach(col => {
                            row[col] = rawData[col][rowIdx];
                          });
                          return row;
                        });
                        console.log(`[TableEditor] Converted to row-oriented:`, fullData.length, 'rows');
                      }
                    }
                  }
                } else if (Array.isArray(rawData)) {
                  fullData = rawData;
                  console.log(`[TableEditor] Using ${key} as array:`, fullData.length, 'rows');
                }
                
                if (fullData) break;
              }
            }
            
            // If not found, try the first key
            if (!fullData && outputKeys.length > 0) {
              fullData = result.outputs[outputKeys[0]];
              console.log(`[TableEditor] Using first output key '${outputKeys[0]}':`, fullData?.length, 'rows');
            }
          }
          
          if (!fullData && result.preview?.head) {
            fullData = result.preview.head;
            console.log('[TableEditor] Found data in preview.head:', fullData?.length, 'rows');
          } else if (!fullData && Array.isArray(result)) {
            fullData = result;
            console.log('[TableEditor] Result is array:', fullData?.length, 'rows');
          }
          
          if (fullData && Array.isArray(fullData) && fullData.length > 0) {
            setData(fullData);
            setColumns(Object.keys(fullData[0]));
            console.log('[TableEditor] Set data with', fullData.length, 'rows');
          } else {
            console.warn('[TableEditor] No valid data found in result');
          }
        })
        .catch(err => console.error('Failed to load full data:', err))
        .finally(() => setLoading(false));
    }
  }, [nodeId]);

  const handleCellChange = (rowIndex: number, column: string, value: any) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [column]: value };
    setData(newData);
  };

  const handleSave = async () => {
    if (onSave) {
      onSave(data, columns);
    }
    
    // Auto-save to backend if nodeId and sessionId are provided
    if (nodeId && sessionId) {
      try {
        await fetch(`http://127.0.0.1:8765/api/sessions/${sessionId}/nodes/${nodeId}/update_table`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, columns })
        });
      } catch (error) {
        console.error('Failed to save table to backend:', error);
      }
    }
    
    onClose();
  };
  
  const handleDeleteRows = () => {
    if (selectedRows.size === 0) return;
    const newData = data.filter((_, index) => !selectedRows.has(index));
    setData(newData);
    setSelectedRows(new Set());
  };
  
  const handleDeleteColumns = () => {
    if (selectedColumns.size === 0) return;
    const newColumns = columns.filter(col => !selectedColumns.has(col));
    const newData = data.map(row => {
      const newRow: any = {};
      newColumns.forEach(col => {
        newRow[col] = row[col];
      });
      return newRow;
    });
    setColumns(newColumns);
    setData(newData);
    setSelectedColumns(new Set());
  };
  
  const toggleRowSelection = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };
  
  const toggleColumnSelection = (column: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(column)) {
      newSelected.delete(column);
    } else {
      newSelected.add(column);
    }
    setSelectedColumns(newSelected);
  };
  
  const selectAllRows = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)));
    }
  };
  
  const handleAddRow = () => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    setData([...data, newRow]);
  };
  
  const handleAddColumn = () => {
    const newColumnName = prompt('Nome della nuova colonna:', `Column${columns.length + 1}`);
    if (newColumnName && !columns.includes(newColumnName)) {
      setColumns([...columns, newColumnName]);
      const newData = data.map(row => ({ ...row, [newColumnName]: '' }));
      setData(newData);
    }
  };
  
  const handleRenameColumn = (oldName: string, newName: string) => {
    if (!newName || newName === oldName || columns.includes(newName)) return;
    
    const newColumns = columns.map(col => col === oldName ? newName : col);
    const newData = data.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        newRow[key === oldName ? newName : key] = row[key];
      });
      return newRow;
    });
    
    setColumns(newColumns);
    setData(newData);
    setEditingColumn(null);
  };

  const handleExport = () => {
    // Export as CSV
    const headers = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        /* LARGE SCROLLBARS - Always visible and easy to grab */
        .table-scroll-container::-webkit-scrollbar {
          width: 30px;
          height: 30px;
        }
        
        .table-scroll-container::-webkit-scrollbar-track {
          background: ${darkMode ? '#0d0d0d' : '#d5d5d5'};
          border-radius: 15px;
          margin: 4px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#505050' : '#808080'};
          border-radius: 15px;
          border: 6px solid ${darkMode ? '#0d0d0d' : '#d5d5d5'};
          min-height: 60px;
          min-width: 60px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#707070' : '#606060'};
          border-width: 4px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb:active {
          background: ${darkMode ? '#909090' : '#404040'};
          border-width: 3px;
        }
        
        .table-scroll-container::-webkit-scrollbar-corner {
          background: ${darkMode ? '#0d0d0d' : '#d5d5d5'};
          border-radius: 15px;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-[#2d2d2d]' : 'bg-white'
        }`} style={{ minWidth: '800px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Caricamento...' : `${data.length} ${t('preview.rows')} × ${columns.length} ${t('preview.columns')}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl transition-all"
              title="Aggiungi Riga"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Riga</span>
            </button>
            <button
              onClick={handleAddColumn}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl transition-all"
              title="Aggiungi Colonna"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="text-sm">Colonna</span>
            </button>
            <div className="w-px h-6 bg-gray-300" />
            {selectedRows.size > 0 && (
              <button
                onClick={handleDeleteRows}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title={`Delete ${selectedRows.size} row(s)`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">{selectedRows.size} row(s)</span>
              </button>
            )}
            {selectedColumns.size > 0 && (
              <button
                onClick={handleDeleteColumns}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title={`Delete ${selectedColumns.size} column(s)`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">{selectedColumns.size} col(s)</span>
              </button>
            )}
            <div className="w-px h-6 bg-gray-300" />
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">CSV</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-xl transition-all"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">{t('table.save')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div 
          className="flex-1 overflow-auto p-6 table-scroll-container"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: darkMode ? '#666 #1a1a1a' : '#777 #d0d0d0'
          }}
        >
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="px-2 py-3 text-center border-b-2 border-gray-200 bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={selectAllRows}
                    className="rounded"
                    title="Select all rows"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 border-b-2 border-gray-200 bg-gray-50">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left border-b-2 border-gray-200 bg-gray-50 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(col)}
                        onChange={() => toggleColumnSelection(col)}
                        className="rounded"
                        title={`Select column ${col}`}
                      />
                      {editingColumn === col ? (
                        <input
                          type="text"
                          defaultValue={col}
                          onBlur={(e) => handleRenameColumn(col, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameColumn(col, e.currentTarget.value);
                            }
                            if (e.key === 'Escape') {
                              setEditingColumn(null);
                            }
                          }}
                          autoFocus
                          className="text-xs font-semibold text-gray-600 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <span 
                          className="text-xs font-semibold text-gray-600 cursor-pointer hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                          onDoubleClick={() => setEditingColumn(col)}
                          title="Doppio click per rinominare"
                        >
                          {col}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-blue-50/50 transition-colors ${selectedRows.has(rowIndex) ? 'bg-blue-100/50' : ''}`}
                >
                  <td className="px-2 py-2 text-center border-b border-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => toggleRowSelection(rowIndex)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 font-mono">
                    {rowIndex + 1}
                  </td>
                  {columns.map((col) => {
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === col;
                    const value = row[col];

                    return (
                      <td
                        key={col}
                        className="px-4 py-2 border-b border-gray-100"
                        onDoubleClick={() => setEditingCell({ row: rowIndex, col })}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={value ?? ''}
                            onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingCell(null);
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                                setData(initialData);
                              }
                            }}
                            autoFocus
                            className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        ) : (
                          <div className="text-sm text-gray-700 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
                            {value !== null && value !== undefined ? String(value) : '-'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
          💡 {t('table.hint')}
        </div>
        </div>
      </div>
    </>
  );
};
