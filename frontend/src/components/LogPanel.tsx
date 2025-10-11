import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Info, CheckCircle, XCircle, ChevronDown, Lightbulb, Wifi, WifiOff } from 'lucide-react';

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

interface LogPanelProps {
  logs?: LogEntry[];
  currentTip?: string;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs: externalLogs, currentTip }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [realtimeLogs, setRealtimeLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Combine external logs with realtime logs
  const logs = [...(externalLogs || []), ...realtimeLogs];
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current && isHovered) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isHovered]);
  
  // Connect to WebSocket for realtime logs
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://127.0.0.1:8765/ws/logs');
        
        ws.onopen = () => {
          console.log('[LogPanel] WebSocket connected');
          setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Skip ping messages
            if (data.level === 'ping') return;
            
            // Add new log entry
            const logEntry: LogEntry = {
              id: `ws-${Date.now()}-${Math.random()}`,
              timestamp: new Date(data.timestamp),
              level: data.level as LogLevel,
              message: data.message
            };
            
            setRealtimeLogs(prev => {
              // Keep only last 100 logs
              const newLogs = [...prev, logEntry];
              return newLogs.slice(-100);
            });
          } catch (error) {
            console.error('[LogPanel] Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('[LogPanel] WebSocket error:', error);
        };
        
        ws.onclose = () => {
          console.log('[LogPanel] WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[LogPanel] Attempting to reconnect...');
            connectWebSocket();
          }, 3000);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('[LogPanel] Failed to connect WebSocket:', error);
      }
    };
    
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const getIcon = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500 dark:text-orange-400" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    }
  };

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <div 
      className="log-panel absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-10 transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Minimized single line view */}
      {!isHovered && lastLog && (
        <div className="px-4 py-2 flex items-center gap-3 cursor-pointer">
          <div className="flex-shrink-0">{getIcon(lastLog.level)}</div>
          <span className="log-panel-text-muted text-xs font-mono">
            {formatTime(lastLog.timestamp)}
          </span>
          <span className="log-panel-text text-sm truncate flex-1">
            {lastLog.message}
          </span>
          {logs.length > 1 && (
            <span className="log-panel-badge px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full flex-shrink-0">
              +{logs.length - 1} more
            </span>
          )}
        </div>
      )}

      {/* No logs minimized view */}
      {!isHovered && !lastLog && (
        <div className="log-panel-text-muted px-4 py-2 text-center text-sm cursor-pointer">
          No logs yet. Hover to see details.
        </div>
      )}

      {/* Expanded view on hover */}
      {isHovered && (
        <div 
          ref={logContainerRef}
          className="max-h-64 overflow-y-auto"
          onScroll={(e) => {
            // Disable auto-scroll if user scrolls up
            const target = e.currentTarget;
            const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
            setAutoScroll(isAtBottom);
          }}
        >
          {/* Header */}
          <div className="log-panel-header flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="log-panel-text-secondary flex items-center gap-2 text-sm font-semibold">
                <ChevronDown className="w-4 h-4" />
                System Logs
                {logs.length > 0 && (
                  <span className="log-panel-badge ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                    {logs.length}
                  </span>
                )}
                {/* Connection status indicator */}
                <span title={isConnected ? "Connected to log stream" : "Disconnected from log stream"}>
                  {isConnected ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              </div>
              
              {currentTip && (
                <button
                  onClick={() => setShowTips(!showTips)}
                  className={`flex items-center gap-2 text-sm px-3 py-1 rounded-lg transition-all ${
                    showTips 
                      ? 'log-panel-tip text-yellow-800' 
                      : 'log-panel-badge bg-gray-200 text-gray-600'
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  Tips
                </button>
              )}
            </div>
            
            <div className="log-panel-text-muted text-xs">
              {logs.length > 0 && `Last update: ${formatTime(logs[logs.length - 1].timestamp)}`}
            </div>
          </div>

          {/* Tips Section */}
          {currentTip && showTips && (
            <div className="log-panel-tip p-3 bg-yellow-50 border-b border-yellow-200 flex items-start gap-3">
              <Lightbulb className="log-panel-tip-icon w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="log-panel-tip-title text-sm font-medium text-yellow-900 mb-1">💡 Tip</div>
                <div className="log-panel-tip-text text-sm text-yellow-800">{currentTip}</div>
              </div>
              <button
                onClick={() => setShowTips(false)}
                className="log-panel-tip-icon text-yellow-600 hover:text-yellow-800 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Logs */}
          {logs.length === 0 ? (
            <div className="log-panel-text-muted p-4 text-center text-sm">
              No logs yet. Start building your workflow!
            </div>
          ) : (
            <div className="log-panel-divider divide-y divide-gray-100">
              {logs.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className={`log-panel-hover p-3 flex items-start gap-3 transition-colors border-l-4 ${getLogColor(log.level)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="log-panel-text-muted text-xs font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className="log-panel-text text-sm">{log.message}</span>
                    </div>
                    {log.details && (
                      <div className="log-panel-details mt-1 text-xs font-mono bg-gray-100 p-2 rounded">
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
