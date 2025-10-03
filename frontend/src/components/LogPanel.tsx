import React, { useState, useEffect } from 'react';
import { AlertCircle, Info, CheckCircle, XCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

interface LogPanelProps {
  logs: LogEntry[];
  currentTip?: string;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, currentTip }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTips, setShowTips] = useState(true);

  const getIcon = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            System Logs
            {logs.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                {logs.length}
              </span>
            )}
          </button>
          
          {currentTip && (
            <button
              onClick={() => setShowTips(!showTips)}
              className={`flex items-center gap-2 text-sm px-3 py-1 rounded-lg transition-all ${
                showTips ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Tips
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          {logs.length > 0 && `Last update: ${formatTime(logs[logs.length - 1].timestamp)}`}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto">
          {/* Tips Section */}
          {currentTip && showTips && (
            <div className="p-3 bg-yellow-50 border-b border-yellow-200 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-900 mb-1">💡 Tip</div>
                <div className="text-sm text-yellow-800">{currentTip}</div>
              </div>
              <button
                onClick={() => setShowTips(false)}
                className="text-yellow-600 hover:text-yellow-800 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Logs */}
          {logs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No logs yet. Start building your workflow!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className={`p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-l-4 ${getLogColor(log.level)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className="text-sm text-gray-900">{log.message}</span>
                    </div>
                    {log.details && (
                      <div className="mt-1 text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
