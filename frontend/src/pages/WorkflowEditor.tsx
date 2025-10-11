import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../store/workflowStore';
import { ExpandableNode } from '../components/ExpandableNode';
import { NodePalette } from '../components/NodePalette';
import { LogPanel } from '../components/LogPanel';
import { ChatPanel } from '../components/ChatPanel';
import { ItalyFlag, UKFlag } from '../components/FlatFlags';
import { ArrowLeft, Save, Check, FolderOpen, Download, Trash2, Settings, BookOpen, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

const nodeTypes = {
  customNode: ExpandableNode,
};

const WorkflowEditorContent: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { darkMode, setDarkMode } = useTheme();
  
  const {
    nodes,
    edges,
    nodeSpecs,
    nodeSpecsLoaded,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setNodes,
    setEdges,
    executionResults,
    workflowName,
    setWorkflowName,
    loadNodeSpecs,
    clearWorkflow,
    logs,
    currentTip,
    addLog,
    setTip,
  } = useWorkflowStore();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
  
  const PROXIMITY_RADIUS = 50; // pixels

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    return () => document.body.classList.remove('dark-mode');
  }, [darkMode]);

  // Load node specs on mount
  useEffect(() => {
    if (!nodeSpecsLoaded) {
      loadNodeSpecs();
    }
  }, [nodeSpecsLoaded, loadNodeSpecs]);

  // Auto-open chat if workflow has chatbot nodes
  useEffect(() => {
    const hasChatbotNodes = nodes.some(node => 
      node.type?.startsWith('chatbot.')
    );
    if (hasChatbotNodes && !isChatOpen) {
      setIsChatOpen(true);
      addLog('info', 'Chat panel opened', 'Chatbot nodes detected');
    }
  }, [nodes, isChatOpen, addLog]);

  const [isLoaded, setIsLoaded] = useState(false);

  // Global proximity detection for all handles
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const handles = document.querySelectorAll('.react-flow__handle');
      
      handles.forEach((handle) => {
        const rect = handle.getBoundingClientRect();
        const handleCenterX = rect.left + rect.width / 2;
        const handleCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(e.clientX - handleCenterX, 2) + 
          Math.pow(e.clientY - handleCenterY, 2)
        );
        
        if (distance < PROXIMITY_RADIUS) {
          handle.classList.add('handle-active');
        } else {
          handle.classList.remove('handle-active');
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        console.log('No sessionId, skipping load');
        setIsLoaded(true);
        return;
      }

      // Clear previous workflow state before loading new session
      console.log('🧹 Clearing previous workflow state');
      clearWorkflow();
      addLog('info', 'Loading workflow session...', `Session ID: ${sessionId}`);

      try {
        console.log('Loading session:', sessionId);
        const response = await fetch(`http://127.0.0.1:8765/api/sessions/${sessionId}`);
        
        if (!response.ok) {
          console.error('Failed to load session, status:', response.status);
          addLog('error', 'Failed to load session', `HTTP ${response.status}`);
          setIsLoaded(true);
          return;
        }
        
        const session = await response.json();
        console.log('Loaded session:', session);
        addLog('success', 'Workflow loaded successfully', `${session.workflow?.nodes?.length || 0} nodes`);
        
        if (session.workflow) {
          console.log('Restoring workflow:', session.workflow);
          
          // Restore workflow name - check both locations
          const name = session.workflow.name || session.name || 'New Workflow';
          console.log('Restoring name:', name);
          setWorkflowName(name);
          
          if (session.workflow.nodes && session.workflow.nodes.length > 0) {
            console.log('Restoring nodes:', session.workflow.nodes.length);
            setNodes(session.workflow.nodes);
          }
          if (session.workflow.edges && session.workflow.edges.length > 0) {
            console.log('Restoring edges:', session.workflow.edges.length);
            setEdges(session.workflow.edges);
          }
        } else {
          console.log('No workflow data in session - starting with empty workflow');
          setTip('Start by dragging nodes from the palette on the left. Connect them to create your data pipeline!');
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load session:', error);
        addLog('error', 'Error loading session', error instanceof Error ? error.message : 'Unknown error');
        setIsLoaded(true);
      }
    };

    loadSession();
  }, [sessionId, setNodes, setEdges, setWorkflowName, clearWorkflow, addLog, setTip]);

  // Manual save function
  const saveWorkflow = useCallback(async () => {
    if (!sessionId) return;
    
    setIsSaving(true);
    try {
      const workflowData = {
        name: workflowName,
        nodes: nodes.map(node => ({
          ...node,
          position: node.position,
        })),
        edges,
        executionResults,
      };

      console.log('💾 Saving workflow:', workflowData.name, '| Nodes:', workflowData.nodes.length);

      const response = await fetch(`http://127.0.0.1:8765/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (response.ok) {
        setLastSaved(new Date());
        console.log('✅ Saved successfully');
      }
    } catch (error) {
      console.error('❌ Failed to save:', error);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [sessionId, workflowName, nodes, edges, executionResults]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!sessionId || !isLoaded) return;
    
    // Save after 5 seconds of inactivity
    const timer = setTimeout(() => {
      saveWorkflow();
    }, 5000);

    return () => clearTimeout(timer);
  }, [sessionId, isLoaded, nodes, edges, workflowName, saveWorkflow]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(nodeType, position);
    },
    [reactFlowInstance, addNode]
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Unified Top Bar */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        darkMode 
          ? 'border-gray-700' 
          : 'bg-white border-gray-200'
      }`} style={darkMode ? { backgroundColor: '#2d2d2d' } : {}}>
        {/* Left: Logo, Title and Workflow Name */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="url(#gradient)" />
              <path d="M12 20L18 14L24 20L30 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="14" r="2.5" fill="white"/>
              <circle cx="24" cy="20" r="2.5" fill="white"/>
              <circle cx="30" cy="14" r="2.5" fill="white"/>
              <circle cx="12" cy="20" r="2.5" fill="white"/>
              <path d="M12 26H30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6"/>
                  <stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
            <h1 className={`text-xl font-bold ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>{t('app.title')}</h1>
          </div>
          
          <div className={`w-px h-6 ${
            darkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`} />
          
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className={`text-lg font-semibold bg-transparent border rounded-full px-4 py-2 focus:outline-none focus:ring-2 min-w-[200px] transition-all ${
              darkMode 
                ? 'text-gray-100 border-gray-600/30 focus:ring-blue-500/30' 
                : 'text-gray-800 border-gray-300/40 focus:ring-blue-400/30'
            }`}
            placeholder="Workflow Name"
          />
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              darkMode 
                ? 'text-gray-300 hover:bg-[#3d3d3d]' 
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>

          <button
            onClick={() => navigate('/wiki')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              darkMode 
                ? 'text-gray-300 hover:bg-[#3d3d3d]' 
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Wiki
          </button>

          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json,.flow.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  try {
                    const text = await file.text();
                    const workflow = JSON.parse(text);
                    useWorkflowStore.getState().importWorkflow(workflow);
                    addLog('success', 'Workflow imported', file.name);
                  } catch (error) {
                    console.error('Failed to import workflow:', error);
                    addLog('error', 'Failed to import workflow', 'Check file format');
                    alert('Failed to import workflow. Check file format.');
                  }
                }
              };
              input.click();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              darkMode 
                ? 'text-gray-300 hover:bg-[#3d3d3d]' 
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            {t('toolbar.open')}
          </button>

          <button
            onClick={() => {
              const workflow = useWorkflowStore.getState().exportWorkflow();
              const blob = new Blob([JSON.stringify(workflow, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${workflowName.replace(/\s+/g, '_')}.flow.json`;
              a.click();
              URL.revokeObjectURL(url);
              addLog('success', 'Workflow exported', `${workflowName}.flow.json`);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              darkMode 
                ? 'text-gray-300 hover:bg-[#3d3d3d]' 
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            <Download className="w-4 h-4" />
            {t('toolbar.export')}
          </button>

          <button
            onClick={() => {
              if (confirm(t('toolbar.clearConfirm'))) {
                clearWorkflow();
                addLog('warning', 'Workflow cleared', 'All nodes removed');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              darkMode 
                ? 'text-gray-300 hover:bg-[#3d3d3d]' 
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {t('toolbar.clear')}
          </button>

          <div className={`w-px h-6 ${
            darkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`} />

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              isChatOpen
                ? 'bg-blue-500 text-white'
                : darkMode 
                  ? 'text-gray-300 hover:bg-[#3d3d3d]' 
                  : 'text-gray-600 hover:bg-gray-100/80'
            }`}
            title="Open Chat"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>

        {/* Right: Language + Settings + Save Status */}
        <div className="flex items-center gap-3">
          {/* Save Indicator */}
          {isSaving ? (
            <div className={`flex items-center gap-2 text-sm ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <Save className="w-4 h-4 animate-pulse" />
              <span>{t('workflow.saving')}</span>
            </div>
          ) : lastSaved ? (
            <div className={`flex items-center gap-2 text-sm ${
              darkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              <Check className="w-4 h-4" />
              <span>{t('workflow.saved')}</span>
            </div>
          ) : null}
          
          <div className={`w-px h-6 ${
            darkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`} />
          
          {/* Language Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => i18n.changeLanguage('it')}
              className={`px-2 py-1.5 rounded-xl transition-all ${
                i18n.language === 'it' 
                  ? 'bg-blue-500/10 ring-2 ring-blue-400/30' 
                  : darkMode 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-100/80'
              }`}
              title="Italiano"
            >
              <ItalyFlag />
            </button>
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`px-2 py-1.5 rounded-xl transition-all ${
                i18n.language === 'en' 
                  ? 'bg-blue-500/10 ring-2 ring-blue-400/30' 
                  : darkMode 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-100/80'
              }`}
              title="English"
            >
              <UKFlag />
            </button>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl transition-all ${
              darkMode 
                ? 'bg-[#3d3d3d] text-gray-100 hover:bg-[#4d4d4d]' 
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <NodePalette nodeSpecs={nodeSpecs} darkMode={darkMode} />

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            snapToGrid={true}
            snapGrid={[24, 24]}
            style={{
              backgroundColor: darkMode ? '#1a1a1a' : '#ffffff'
            }}
          >
            <Background 
              gap={24} 
              size={2} 
              color={darkMode ? '#404040' : '#94a3b8'}
              style={{
                backgroundColor: darkMode ? '#1a1a1a' : '#ffffff'
              }}
            />
            <Controls />
            <MiniMap 
              style={{
                backgroundColor: darkMode ? '#2a2a2a' : '#ffffff'
              }}
              maskColor={darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.1)'}
            />
          </ReactFlow>
          
          {/* Log Panel */}
          <LogPanel logs={logs} currentTip={currentTip || undefined} />
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onNodeExecuting={(nodeId) => {
          setExecutingNodeId(nodeId);
          // Center node in view
          if (reactFlowInstance) {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              reactFlowInstance.setCenter(node.position.x + 150, node.position.y + 75, {
                zoom: 1,
                duration: 500
              });
            }
          }
          // Highlight node
          setNodes(nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              isExecuting: n.id === nodeId
            }
          })));
        }}
        onNodeCompleted={(nodeId) => {
          setExecutingNodeId(null);
          // Remove highlight
          setNodes(nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              isExecuting: false
            }
          })));
        }}
      />
    </div>
  );
};

export const WorkflowEditor: React.FC = () => (
  <ThemeProvider>
    <WorkflowEditorContent />
  </ThemeProvider>
);

export const WorkflowEditorWithProvider: React.FC = () => (
  <ReactFlowProvider>
    <WorkflowEditor />
  </ReactFlowProvider>
);
