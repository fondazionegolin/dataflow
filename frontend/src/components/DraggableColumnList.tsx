import React, { useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface DraggableColumnListProps {
  columns: string[];
  value: string[];
  onChange: (newOrder: string[]) => void;
}

export const DraggableColumnList: React.FC<DraggableColumnListProps> = ({
  columns,
  value,
  onChange
}) => {
  const [orderedColumns, setOrderedColumns] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialize ordered columns
  useEffect(() => {
    if (value && value.length > 0) {
      setOrderedColumns(value);
    } else if (columns && columns.length > 0) {
      setOrderedColumns(columns);
    }
  }, [columns, value]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...orderedColumns];
    const draggedItem = newOrder[draggedIndex];
    
    // Remove from old position
    newOrder.splice(draggedIndex, 1);
    
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setOrderedColumns(newOrder);
    onChange(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-1 nodrag">
      {orderedColumns.map((column, index) => (
        <div
          key={column}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            flex items-center gap-2 px-3 py-2 bg-white border rounded-md
            cursor-move transition-all nodrag
            ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
            ${dragOverIndex === index && draggedIndex !== index ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            hover:border-gray-400 hover:shadow-sm
          `}
        >
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 flex-1">{column}</span>
          <span className="text-xs text-gray-400">#{index + 1}</span>
        </div>
      ))}
      {orderedColumns.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          No columns available
        </div>
      )}
    </div>
  );
};
