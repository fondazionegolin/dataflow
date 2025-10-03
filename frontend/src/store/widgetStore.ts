/**
 * Store for managing floating widgets
 */

import { create } from 'zustand';

interface Widget {
  id: string;
  nodeId: string;
  type: 'data' | 'plot' | 'metrics';
  visible: boolean;
}

interface WidgetState {
  widgets: Widget[];
  
  // Actions
  addWidget: (nodeId: string, type: 'data' | 'plot' | 'metrics') => void;
  removeWidget: (nodeId: string) => void;
  toggleWidget: (nodeId: string) => void;
  clearWidgets: () => void;
  updateWidgetType: (nodeId: string, type: 'data' | 'plot' | 'metrics') => void;
}

export const useWidgetStore = create<WidgetState>((set, get) => ({
  widgets: [],

  addWidget: (nodeId, type) => {
    const existing = get().widgets.find((w) => w.nodeId === nodeId);
    if (existing) {
      // Update existing widget
      set({
        widgets: get().widgets.map((w) =>
          w.nodeId === nodeId ? { ...w, type, visible: true } : w
        ),
      });
    } else {
      // Add new widget
      set({
        widgets: [
          ...get().widgets,
          {
            id: `widget-${nodeId}`,
            nodeId,
            type,
            visible: true,
          },
        ],
      });
    }
  },

  removeWidget: (nodeId) => {
    set({
      widgets: get().widgets.filter((w) => w.nodeId !== nodeId),
    });
  },

  toggleWidget: (nodeId) => {
    set({
      widgets: get().widgets.map((w) =>
        w.nodeId === nodeId ? { ...w, visible: !w.visible } : w
      ),
    });
  },

  clearWidgets: () => {
    set({ widgets: [] });
  },

  updateWidgetType: (nodeId, type) => {
    set({
      widgets: get().widgets.map((w) =>
        w.nodeId === nodeId ? { ...w, type } : w
      ),
    });
  },
}));
