import React, { useState, useRef } from 'react';

interface OrbitGizmoProps {
  onRotate: (axis: 'x' | 'y' | 'z', direction: number) => void;
  onReset: () => void;
}

export const OrbitGizmo: React.FC<OrbitGizmoProps> = ({ onRotate, onReset }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const gizmoRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    // Horizontal drag = Y axis rotation
    if (Math.abs(deltaX) > 5) {
      onRotate('y', deltaX > 0 ? 1 : -1);
      setStartPos({ x: e.clientX, y: e.clientY });
    }

    // Vertical drag = X axis rotation
    if (Math.abs(deltaY) > 5) {
      onRotate('x', deltaY > 0 ? 1 : -1);
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startPos]);

  return (
    <div 
      className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border-2 border-gray-200"
      style={{ pointerEvents: 'auto' }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="text-xs font-bold text-gray-700 mb-3 text-center tracking-wide">3D ORBIT</div>
      
      {/* 3D Axis Gizmo - Draggable trackball */}
      <div 
        ref={gizmoRef}
        className={`relative w-32 h-32 mb-3 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
        onMouseDown={handleMouseDown}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full pointer-events-none">
          {/* Outer circle - trackball boundary */}
          <circle cx="60" cy="60" r="55" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Center sphere */}
          <circle cx="60" cy="60" r="15" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="2" />
          
          {/* X Axis (Red) - Horizontal */}
          <g style={{ opacity: 0.9 }}>
            <line x1="15" y1="60" x2="105" y2="60" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            <polygon points="105,60 98,57 98,63" fill="#ef4444" />
            <polygon points="15,60 22,57 22,63" fill="#ef4444" />
            <text x="108" y="65" fontSize="14" fontWeight="bold" fill="#ef4444">X</text>
          </g>
          
          {/* Y Axis (Green) - Vertical */}
          <g style={{ opacity: 0.9 }}>
            <line x1="60" y1="15" x2="60" y2="105" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <polygon points="60,15 57,22 63,22" fill="#10b981" />
            <polygon points="60,105 57,98 63,98" fill="#10b981" />
            <text x="65" y="15" fontSize="14" fontWeight="bold" fill="#10b981">Y</text>
          </g>
          
          {/* Z Axis (Blue) - Diagonal */}
          <g style={{ opacity: 0.9 }}>
            <line x1="25" y1="95" x2="95" y2="25" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
            <polygon points="95,25 90,30 92,23" fill="#3b82f6" />
            <polygon points="25,95 30,90 23,92" fill="#3b82f6" />
            <text x="10" y="105" fontSize="14" fontWeight="bold" fill="#3b82f6">Z</text>
          </g>
        </svg>
        
        {/* Drag hint */}
        {!isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-xs text-gray-400 font-medium bg-white/80 px-2 py-1 rounded">
              Drag
            </div>
          </div>
        )}
      </div>
      
      {/* Reset button */}
      <button
        onClick={onReset}
        className="w-full px-3 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all font-semibold shadow-sm"
        title="Reset camera to default view"
      >
        🏠 Reset View
      </button>
    </div>
  );
};
