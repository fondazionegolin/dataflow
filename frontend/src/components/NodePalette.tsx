/**
 * Node palette for adding new nodes to the workflow
 */

import React, { useState } from 'react';
import { NodeSpec } from '@/types';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NodePaletteProps {
  nodeSpecs: NodeSpec[];
}

export const NodePalette: React.FC<NodePaletteProps> = ({ nodeSpecs }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['sources', 'transform'])
  );

  // Group nodes by category
  const nodesByCategory = nodeSpecs.reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = [];
    }
    acc[spec.category].push(spec);
    return acc;
  }, {} as Record<string, NodeSpec[]>);

  // Filter nodes based on search
  const filteredCategories = Object.entries(nodesByCategory).reduce((acc, [category, nodes]) => {
    const filtered = nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, NodeSpec[]>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getCategoryLabel = (category: string) => {
    return t(`palette.categories.${category}`, category);
  };

  const categoryColors: Record<string, { bg: string; text: string; icon: string }> = {
    sources: { bg: 'bg-gradient-to-br from-green-500 to-green-600', text: 'text-white', icon: '◉' },
    transform: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-white', icon: '◈' },
    visualization: { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', text: 'text-white', icon: '◐' },
    machine_learning: { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-white', icon: '◆' },
  };

  const getNodeLabel = (spec: NodeSpec) => {
    return t(`nodes.${spec.type}.label`, spec.label);
  };

  const getNodeDescription = (spec: NodeSpec) => {
    return t(`nodes.${spec.type}.description`, spec.description);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-3">{t('palette.title')}</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('palette.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border-0 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
          />
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(filteredCategories).map(([category, nodes]) => (
          <div key={category} className="mb-2">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded text-sm font-medium text-gray-700"
            >
              <span>{getCategoryLabel(category)}</span>
              {expandedCategories.has(category) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Category Nodes */}
            {expandedCategories.has(category) && (
              <div className="mt-1 space-y-1">
                {nodes.map((spec) => {
                  const colors = categoryColors[category] || { bg: 'bg-gray-500', text: 'text-white', icon: '📦' };
                  return (
                    <div
                      key={spec.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, spec.type)}
                      className={`px-4 py-3 ${colors.bg} hover:scale-105 rounded-xl cursor-move shadow-md transition-all hover:shadow-lg backdrop-blur-sm`}
                      title={spec.description}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg backdrop-blur-sm">
                          <span className="text-white text-xl font-light">{colors.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${colors.text} truncate`}>
                            {getNodeLabel(spec)}
                          </div>
                          <div className={`text-xs ${colors.text} opacity-75 truncate`}>
                            {getNodeDescription(spec)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-8">
            {t('palette.noResults')}
          </div>
        )}
      </div>
    </div>
  );
};
