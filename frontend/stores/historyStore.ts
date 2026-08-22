import { create } from "zustand";

export interface ChangeRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: Record<string, { old: any; new: any }> | null;
  snapshot?: any;
  changed_by: string;
  change_reason: string | null;
  created_at: string;
}

interface HistoryState {
  // Filters
  selectedEntityType: string | null;
  selectedAction: string | null;
  dateRange: { from: string | null; to: string | null };
  
  // Selected record for detail view
  selectedRecord: ChangeRecord | null;
  showDiffViewer: boolean;
  showSnapshotViewer: boolean;
  
  // Actions
  setEntityTypeFilter: (type: string | null) => void;
  setActionFilter: (action: string | null) => void;
  setDateRange: (range: { from: string | null; to: string | null }) => void;
  selectRecord: (record: ChangeRecord | null) => void;
  toggleDiffViewer: () => void;
  toggleSnapshotViewer: () => void;
  clearFilters: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  selectedEntityType: null,
  selectedAction: null,
  dateRange: { from: null, to: null },
  selectedRecord: null,
  showDiffViewer: true,
  showSnapshotViewer: false,

  setEntityTypeFilter: (type) => set({ selectedEntityType: type }),
  setActionFilter: (action) => set({ selectedAction: action }),
  setDateRange: (range) => set({ dateRange: range }),
  selectRecord: (record) => set({ selectedRecord: record, showDiffViewer: !!record, showSnapshotViewer: false }),
  toggleDiffViewer: () => set((state) => ({ showDiffViewer: !state.showDiffViewer, showSnapshotViewer: state.showSnapshotViewer ? false : state.showSnapshotViewer })),
  toggleSnapshotViewer: () => set((state) => ({ showSnapshotViewer: !state.showSnapshotViewer, showDiffViewer: state.showDiffViewer ? false : state.showDiffViewer })),
  clearFilters: () => set({ selectedEntityType: null, selectedAction: null, dateRange: { from: null, to: null } }),
}));
