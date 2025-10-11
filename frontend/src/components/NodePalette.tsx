/**
 * Node palette for adding new nodes to the workflow
 */

import React, { useState } from 'react';
import { NodeSpec } from '@/types';
import { Search, ChevronDown, ChevronRight, Database, Shuffle, BarChart2, Brain, Sparkles, Image, MessageSquare, GitBranch, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NodePaletteProps {
  nodeSpecs: NodeSpec[];
  darkMode?: boolean;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ nodeSpecs, darkMode = false }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set() // Start with all categories collapsed
  );

  // Group nodes by category
  const nodesByCategory = nodeSpecs.reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = [];
    }
    acc[spec.category].push(spec);
    return acc;
  }, {} as Record<string, NodeSpec[]>);

  // Filter nodes based on search - include Italian translations
  const filteredCategories = Object.entries(nodesByCategory).reduce((acc, [category, nodes]) => {
    const filtered = nodes.filter(
      (node) => {
        const query = searchQuery.toLowerCase();
        const label = node.label.toLowerCase();
        const description = node.description.toLowerCase();
        const type = node.type.toLowerCase();
        const translatedLabel = t(`nodes.${node.type}.label`, node.label).toLowerCase();
        const translatedDesc = t(`nodes.${node.type}.description`, node.description).toLowerCase();
        
        return label.includes(query) ||
               description.includes(query) ||
               type.includes(query) ||
               translatedLabel.includes(query) ||
               translatedDesc.includes(query);
      }
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

  const categoryIcons: Record<string, React.ComponentType<any>> = {
    sources: Database,
    ai_sources: Sparkles,
    transform: Shuffle,
    visualization: BarChart2,
    machine_learning: Brain,
    nlp: MessageSquare,
    clustering: GitBranch,
    images: Image,
    mathematics: Calculator,
  };

  const categoryColors: Record<string, { bg: string; text: string }> = {
    sources: { bg: 'bg-gradient-to-br from-green-500 to-green-600', text: 'text-white' },
    ai_sources: { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', text: 'text-white' },
    transform: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-white' },
    visualization: { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', text: 'text-white' },
    machine_learning: { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-white' },
    nlp: { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', text: 'text-white' },
    clustering: { bg: 'bg-gradient-to-br from-teal-500 to-teal-600', text: 'text-white' },
    images: { bg: 'bg-gradient-to-br from-rose-500 to-rose-600', text: 'text-white' },
    mathematics: { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-500', text: 'text-black/80' },
  };

  const getNodeLabel = (spec: NodeSpec) => {
    return t(`nodes.${spec.type}.label`, spec.label);
  };

  const getNodeDescription = (spec: NodeSpec) => {
    return t(`nodes.${spec.type}.description`, spec.description);
  };

  return (
    <div className={`w-64 border-r flex flex-col h-full ${
      darkMode 
        ? 'border-gray-700' 
        : 'bg-white border-gray-200'
    }`} style={darkMode ? { backgroundColor: '#2d2d2d' } : {}}>
      {/* Header */}
      <div className={`p-4 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-3 ${
          darkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>{t('palette.title')}</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder={t('palette.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all ${
              darkMode 
                ? 'text-gray-100 placeholder-gray-400' 
                : 'bg-gray-100 text-gray-900'
            }`}
            style={darkMode ? { backgroundColor: '#3d3d3d' } : {}}
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
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                darkMode 
                  ? 'hover:bg-[#3d3d3d] text-gray-200' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {React.createElement(categoryIcons[category] || Database, { 
                  className: `w-4 h-4 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }` 
                })}
                <span>{getCategoryLabel(category)}</span>
              </div>
              {expandedCategories.has(category) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Category Nodes */}
            {expandedCategories.has(category) && (
              <div className="mt-1 space-y-1.5">
                {nodes.map((spec) => {
                  const colors = categoryColors[category] || { bg: 'bg-gray-500', text: 'text-white' };
                  const IconComponent = categoryIcons[category] || Database;
                  const hasInputs = spec.inputs && spec.inputs.length > 0;
                  const hasOutputs = spec.outputs && spec.outputs.length > 0;
                  
                  return (
                    <div
                      key={spec.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, spec.type)}
                      className={`group relative px-3 py-2.5 backdrop-blur-sm border rounded-lg cursor-move shadow-sm transition-all hover:shadow-md ${
                        darkMode 
                          ? 'bg-white/10 border-white/20' 
                          : 'bg-gray-100/80 border-gray-200'
                      }`}
                      style={{
                        aspectRatio: '2.5 / 1',
                      }}
                      title={getNodeDescription(spec)}
                    >
                      {/* Color overlay - subtle by default, full on hover */}
                      <div 
                        className={`absolute inset-0 ${colors.bg} opacity-20 group-hover:opacity-100 transition-opacity rounded-lg`}
                        style={{ zIndex: -1 }}
                      />
                      
                      <div className="relative h-full flex items-center gap-2.5">
                        {/* Input indicator */}
                        <div className="flex flex-col gap-1">
                          {hasInputs && (
                            <div className={`w-2 h-2 rounded-full transition-colors ${
                              darkMode 
                                ? 'bg-white/40 group-hover:bg-white/80' 
                                : 'bg-gray-400 group-hover:bg-white/90'
                            }`} />
                          )}
                        </div>
                        
                        {/* Icon */}
                        <div className={`w-7 h-7 flex items-center justify-center rounded-md backdrop-blur-sm transition-colors flex-shrink-0 ${
                          darkMode 
                            ? 'bg-white/20 group-hover:bg-white/30' 
                            : 'bg-gray-300/50 group-hover:bg-white/40'
                        }`}>
                          <IconComponent className={`w-4 h-4 ${
                            darkMode ? 'text-white' : 'text-gray-700 group-hover:text-white'
                          }`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-semibold line-clamp-1 ${
                            darkMode ? 'text-white' : 'text-gray-800 group-hover:text-white'
                          }`}>
                            {getNodeLabel(spec)}
                          </div>
                          <div className={`text-[10px] line-clamp-2 leading-tight mt-0.5 ${
                            darkMode ? 'text-white/70' : 'text-gray-600 group-hover:text-white/90'
                          }`}>
                            {getNodeDescription(spec)}
                          </div>
                        </div>
                        
                        {/* Output indicator */}
                        <div className="flex flex-col gap-1">
                          {hasOutputs && (
                            <div className={`w-2 h-2 rounded-full transition-colors ${
                              darkMode 
                                ? 'bg-white/40 group-hover:bg-white/80' 
                                : 'bg-gray-400 group-hover:bg-white/90'
                            }`} />
                          )}
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
          <div className={`text-center text-sm mt-8 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {t('palette.noResults')}
          </div>
        )}
      </div>
    </div>
  );
};
