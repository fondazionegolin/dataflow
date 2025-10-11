/**
 * Modern, professional table editor with clean UI
 * Inspired by modern data table designs
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Download, Plus, Trash2, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TableEditorV2Props {
  data: any[];
  columns: string[];
  onClose: () => void;
  onSave?: (data: any[], columns: string[]) => void;
  title?: string;
  nodeId?: string;
  sessionId?: string;
  darkMode?: boolean;
}

export const TableEditorV2: React.FC<TableEditorV2Props> = ({
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

  // Load full data from backend
  useEffect(() => {
    if (nodeId) {
      setLoading(true);
      fetch(`http://127.0.0.1:8765/api/workflow/result/${encodeURIComponent(nodeId)}`)
        .then(res => res.json())
        .then(result => {
          if (result.outputs) {
            const outputKeys = Object.keys(result.outputs);
            for (const key of ['table', 'data', 'df', 'dataframe', 'output']) {
              if (result.outputs[key]) {
                const rawData = result.outputs[key];
                let fullData = null;
                
                if (Array.isArray(rawData)) {
                  fullData = rawData;
                } else if (rawData && typeof rawData === 'object') {
                  // Column-oriented format
                  const cols = Object.keys(rawData);
                  if (cols.length > 0 && typeof rawData[cols[0]] === 'object') {
                    const rowIndices = Object.keys(rawData[cols[0]]);
                    fullData = rowIndices.map(rowIdx => {
                      const row: any = {};
                      cols.forEach(col => {
                        row[col] = rawData[col][rowIdx];
                      });
                      return row;
                    });
                  }
                }
                
                if (fullData) {
                  setData(fullData);
                  if (fullData.length > 0) {
                    setColumns(Object.keys(fullData[0]));
                  }
                  break;
                }
              }
            }
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load full data:', err);
          setLoading(false);
        });
    }
  }, [nodeId]);

  const handleCellEdit = (rowIndex: number, column: string, value: any) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [column]: value };
    setData(newData);
  };

  const handleColumnRename = (oldName: string, newName: string) => {
    if (!newName || newName === oldName) return;
    
    const newColumns = columns.map(col => col === oldName ? newName : col);
    const newData = data.map(row => {
      const newRow = { ...row };
      newRow[newName] = row[oldName];
      delete newRow[oldName];
      return newRow;
    });
    
    setColumns(newColumns);
    setData(newData);
    setEditingColumn(null);
  };

  const addRow = () => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    setData([...data, newRow]);
  };

  const addColumn = () => {
    const newColName = `Column${columns.length + 1}`;
    setColumns([...columns, newColName]);
    const newData = data.map(row => ({ ...row, [newColName]: '' }));
    setData(newData);
  };

  const deleteSelectedRows = () => {
    const newData = data.filter((_, idx) => !selectedRows.has(idx));
    setData(newData);
    setSelectedRows(new Set());
  };

  const deleteSelectedColumns = () => {
    const newColumns = columns.filter(col => !selectedColumns.has(col));
    const newData = data.map(row => {
      const newRow = { ...row };
      selectedColumns.forEach(col => delete newRow[col]);
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
      setSelectedRows(new Set(data.map((_, idx) => idx)));
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(data, columns);
    }
    onClose();
  };

  const exportCSV = () => {
    const csv = [
      columns.join(','),
      ...data.map(row => columns.map(col => {
        const val = row[col];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${
        darkMode ? 'bg-[#2d2d2d]' : 'bg-white'
      }`} style={{ width: 'min(95vw, 1200px)', minWidth: '800px' }}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {title}
            </h2>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {data.length} {data.length === 1 ? 'riga' : 'righe'} × {columns.length} {columns.length === 1 ? 'colonna' : 'colonne'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className={`px-6 py-3 border-b flex items-center gap-2 flex-wrap ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Riga
          </button>
          
          <button
            onClick={addColumn}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            Colonna
          </button>

          {selectedRows.size > 0 && (
            <button
              onClick={deleteSelectedRows}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Elimina {selectedRows.size} {selectedRows.size === 1 ? 'riga' : 'righe'}
            </button>
          )}

          {selectedColumns.size > 0 && (
            <button
              onClick={deleteSelectedColumns}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Elimina {selectedColumns.size} {selectedColumns.size === 1 ? 'colonna' : 'colonne'}
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={exportCSV}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              darkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            CSV
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            Salva
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Caricamento dati...</div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  {/* Select all checkbox */}
                  <th className={`sticky top-0 px-4 py-3 text-left border-b ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === data.length && data.length > 0}
                      onChange={selectAllRows}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </th>
                  
                  <th className={`sticky top-0 px-4 py-3 text-left border-b font-semibold text-sm ${
                    darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}>
                    #
                  </th>
                  
                  {columns.map((col) => (
                    <th
                      key={col}
                      className={`sticky top-0 px-4 py-3 text-left border-b font-semibold text-sm ${
                        darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                      } ${selectedColumns.has(col) ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedColumns.has(col)}
                          onChange={() => toggleColumnSelection(col)}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                        {editingColumn === col ? (
                          <input
                            type="text"
                            defaultValue={col}
                            autoFocus
                            onBlur={(e) => handleColumnRename(col, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleColumnRename(col, e.currentTarget.value);
                              } else if (e.key === 'Escape') {
                                setEditingColumn(null);
                              }
                            }}
                            className={`px-2 py-1 rounded border-2 border-blue-500 ${
                              darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'
                            }`}
                          />
                        ) : (
                          <span
                            onDoubleClick={() => setEditingColumn(col)}
                            className="cursor-pointer hover:text-blue-500"
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
                    className={`border-b transition-colors ${
                      selectedRows.has(rowIndex)
                        ? darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                        : darkMode 
                          ? 'hover:bg-gray-800/50' 
                          : 'hover:bg-gray-50'
                    } ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    {/* Row checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => toggleRowSelection(rowIndex)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
                    
                    {/* Row number */}
                    <td className={`px-4 py-3 text-sm font-medium ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {rowIndex + 1}
                    </td>
                    
                    {/* Data cells */}
                    {columns.map((col) => (
                      <td
                        key={col}
                        className={`px-4 py-3 ${
                          selectedColumns.has(col) 
                            ? darkMode ? 'bg-blue-900/10' : 'bg-blue-50/50' 
                            : ''
                        }`}
                      >
                        {editingCell?.row === rowIndex && editingCell?.col === col ? (
                          <input
                            type="text"
                            defaultValue={row[col]}
                            autoFocus
                            onBlur={(e) => {
                              handleCellEdit(rowIndex, col, e.target.value);
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellEdit(rowIndex, col, e.currentTarget.value);
                                setEditingCell(null);
                              } else if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                            className={`w-full px-2 py-1 rounded border-2 border-blue-500 ${
                              darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'
                            }`}
                          />
                        ) : (
                          <div
                            onDoubleClick={() => setEditingCell({ row: rowIndex, col })}
                            className={`cursor-pointer min-h-[24px] ${
                              darkMode ? 'text-gray-200' : 'text-gray-900'
                            }`}
                          >
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer hint */}
        <div className={`px-6 py-3 border-t text-xs ${
          darkMode 
            ? 'border-gray-700 text-gray-400' 
            : 'border-gray-200 text-gray-600'
        }`}>
          💡 Doppio click su una cella per modificarla • Enter per salvare • Esc per annullare
        </div>
      </div>
    </div>
  );
};
