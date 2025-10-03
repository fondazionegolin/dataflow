import React, { useState } from 'react';
import { X, Save, Download, Trash2, Columns as ColumnsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Version 2.0 - With multi-select and delete features

interface TableEditorProps {
  data: any[];
  columns: string[];
  onClose: () => void;
  onSave?: (data: any[], columns: string[]) => void;
  title?: string;
  nodeId?: string;
  sessionId?: string;
}

export const TableEditor: React.FC<TableEditorProps> = ({
  data: initialData,
  columns: initialColumns,
  onClose,
  onSave,
  title = 'Table Editor',
  nodeId,
  sessionId
}) => {
  const [data, setData] = useState(initialData);
  const [columns, setColumns] = useState(initialColumns);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const { t } = useTranslation();
  
  console.log('TableEditor rendered with selection features');

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {data.length} {t('preview.rows')} × {columns.length} {t('preview.columns')}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
                <ColumnsIcon className="w-4 h-4" />
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
        <div className="flex-1 overflow-auto p-6">
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
                      <span className="text-xs font-semibold text-gray-600">{col}</span>
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
  );
};
