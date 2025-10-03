/**
 * Top toolbar with workflow controls
 */

import React from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { FolderOpen, Trash2, Download, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ItalyFlag, UKFlag } from './FlatFlags';

export const Toolbar: React.FC = () => {
  const {
    workflowName,
    clearWorkflow,
    exportWorkflow,
  } = useWorkflowStore();
  
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleExport = () => {
    const workflow = exportWorkflow();
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_')}.flow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
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
        } catch (error) {
          console.error('Failed to import workflow:', error);
          alert('Failed to import workflow. Check file format.');
        }
      }
    };
    input.click();
  };

  const handleClear = () => {
    if (confirm(t('toolbar.clearConfirm'))) {
      clearWorkflow();
    }
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left: Workflow Name */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">{t('app.title')}</h1>
        <div className="text-sm text-gray-600">
          {workflowName}
        </div>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500 italic">
          {t('toolbar.hint')}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={handleImport}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
          title={t('toolbar.open')}
        >
          <FolderOpen className="w-4 h-4" />
          {t('toolbar.open')}
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
          title={t('toolbar.export')}
        >
          <Download className="w-4 h-4" />
          {t('toolbar.export')}
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
          title={t('toolbar.clear')}
        >
          <Trash2 className="w-4 h-4" />
          {t('toolbar.clear')}
        </button>
      </div>

      {/* Right: Language + Settings */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => changeLanguage('it')}
            className={`px-2 py-1.5 rounded-xl transition-all ${
              i18n.language === 'it' ? 'bg-blue-500/10 ring-2 ring-blue-400/30' : 'hover:bg-gray-100/80'
            }`}
            title="Italiano"
          >
            <ItalyFlag />
          </button>
          <button
            onClick={() => changeLanguage('en')}
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
  );
};
