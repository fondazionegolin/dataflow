import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../store/workflowStore';
import { ExpandableNode } from '../components/ExpandableNode';
import { NodePalette } from '../components/NodePalette';
import { LogPanel } from '../components/LogPanel';
import { ItalyFlag, UKFlag } from '../components/FlatFlags';
import { ArrowLeft, Save, Check, FolderOpen, Download, Trash2, Settings, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const nodeTypes = {
  customNode: ExpandableNode,
};

export const WorkflowEditor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
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
  const [hasChanges, setHasChanges] = useState(false);

  // Load node specs on mount
  useEffect(() => {
    if (!nodeSpecsLoaded) {
      loadNodeSpecs();
    }
  }, [nodeSpecsLoaded, loadNodeSpecs]);

  const [isLoaded, setIsLoaded] = useState(false);

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
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Left: DataFlow + Workflow Name */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">{t('app.title')}</h1>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-0 min-w-[200px]"
            placeholder="Workflow Name"
          />
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>

          <button
            onClick={() => navigate('/wiki')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
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
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
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
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
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
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {t('toolbar.clear')}
          </button>
        </div>

        {/* Right: Language + Settings + Save Status */}
        <div className="flex items-center gap-3">
          {/* Save Indicator */}
          {isSaving ? (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Save className="w-4 h-4 animate-pulse" />
              <span>{t('workflow.saving')}</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" />
              <span>{t('workflow.saved')}</span>
            </div>
          ) : null}
          
          <div className="w-px h-6 bg-gray-300" />
          
          {/* Language Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => i18n.changeLanguage('it')}
              className={`px-2 py-1.5 rounded-xl transition-all ${
                i18n.language === 'it' ? 'bg-blue-500/10 ring-2 ring-blue-400/30' : 'hover:bg-gray-100/80'
              }`}
              title="Italiano"
            >
              <ItalyFlag />
            </button>
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`px-2 py-1.5 rounded-xl transition-all ${
                i18n.language === 'en' ? 'bg-blue-500/10 ring-2 ring-blue-400/30' : 'hover:bg-gray-100/80'
              }`}
              title="English"
            >
              <UKFlag />
            </button>
          </div>
          
          <button
            className="p-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
            title={t('toolbar.settings')}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <NodePalette nodeSpecs={nodeSpecs} />

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
          >
            <Background gap={24} size={2} color="#94a3b8" />
            <Controls />
            <MiniMap />
          </ReactFlow>
          
          {/* Log Panel */}
          <LogPanel logs={logs} currentTip={currentTip || undefined} />
        </div>
      </div>
    </div>
  );
};

export const WorkflowEditorWithProvider: React.FC = () => (
  <ReactFlowProvider>
    <WorkflowEditor />
  </ReactFlowProvider>
);
