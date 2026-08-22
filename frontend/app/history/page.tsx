"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChangeHistory, useHistoryStats } from "@/lib/queries";
import { useHistoryStore, ChangeRecord } from "@/stores/historyStore";
import { formatDistanceToNow, format } from "date-fns";
import { Archive, Trash2, Edit2, Plus, RotateCcw, Clock, Download, X, Search, ChevronRight, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";

const ENTITY_TYPES = ["segment", "train", "incident", "work_order", "drone"];
const ACTIONS = ["created", "updated", "archived", "deleted", "restored"];

const ACTION_COLORS: Record<string, string> = {
  created: "text-signal-normal",
  updated: "text-signal-rerouted",
  archived: "text-signal-warning",
  deleted: "text-signal-critical",
  restored: "text-purple-400",
};

export default function ChangeHistoryPage() {
  const { data: stats } = useHistoryStats();
  
  const { 
    selectedEntityType, setEntityTypeFilter,
    selectedAction, setActionFilter,
    selectedRecord, selectRecord,
    showDiffViewer, toggleDiffViewer,
    showSnapshotViewer, toggleSnapshotViewer,
    clearFilters
  } = useHistoryStore();

  const { data: historyData, isLoading } = useChangeHistory({
    entity_type: selectedEntityType || undefined,
    action: selectedAction || undefined,
  });

  const exportCsv = () => {
    if (!historyData?.records) return;
    const csvLines = [
      "ID,Entity Type,Entity ID,Action,Changed By,Reason,Timestamp",
      ...historyData.records.map(r => 
        `"${r.id}","${r.entity_type}","${r.entity_id}","${r.action}","${r.changed_by}","${r.change_reason || ""}","${r.created_at}"`
      )
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `change_history_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-[1400px] mx-auto w-full gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 flex-none">
        <div className="glass p-4 rounded-xl flex flex-col justify-between">
          <div className="text-gray-400 text-sm font-medium">Total Changes</div>
          <div className="text-3xl font-bold text-white mt-2">{stats?.total_changes || 0}</div>
        </div>
        <div className="glass p-4 rounded-xl flex flex-col justify-between">
          <div className="text-signal-warning text-sm font-medium flex items-center gap-2"><Archive className="w-4 h-4"/> Archived</div>
          <div className="text-3xl font-bold text-white mt-2">{stats?.archives || 0}</div>
        </div>
        <div className="glass p-4 rounded-xl flex flex-col justify-between">
          <div className="text-signal-critical text-sm font-medium flex items-center gap-2"><Trash2 className="w-4 h-4"/> Deleted</div>
          <div className="text-3xl font-bold text-white mt-2">{stats?.deletions || 0}</div>
        </div>
        <div className="glass p-4 rounded-xl flex flex-col justify-between">
          <div className="text-purple-400 text-sm font-medium flex items-center gap-2"><RotateCcw className="w-4 h-4"/> Restored</div>
          <div className="text-3xl font-bold text-white mt-2">{stats?.restorations || 0}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-3 rounded-xl flex items-center justify-between flex-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-1.5 border border-white/10">
            <span className="text-xs text-gray-400 font-medium">Entity:</span>
            <select 
              className="bg-transparent text-sm text-white focus:outline-none capitalize"
              value={selectedEntityType || ""}
              onChange={(e) => setEntityTypeFilter(e.target.value || null)}
            >
              <option value="" className="bg-[#121214]">All Entities</option>
              {ENTITY_TYPES.map(t => <option key={t} value={t} className="bg-[#121214]">{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-1.5 border border-white/10">
            <span className="text-xs text-gray-400 font-medium">Action:</span>
            <select 
              className="bg-transparent text-sm text-white focus:outline-none capitalize"
              value={selectedAction || ""}
              onChange={(e) => setActionFilter(e.target.value || null)}
            >
              <option value="" className="bg-[#121214]">All Actions</option>
              {ACTIONS.map(t => <option key={t} value={t} className="bg-[#121214]">{t}</option>)}
            </select>
          </div>
          {(selectedEntityType || selectedAction) && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-sm px-4 py-1.5 rounded-lg transition-colors border border-white/10">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-4 flex-1 min-h-0">
        
        {/* Timeline Panel */}
        <div className="glass rounded-xl w-[400px] flex flex-col flex-none overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/20 flex-none">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Change Timeline
            </h2>
            <div className="text-xs text-gray-400 mt-1">{historyData?.total || 0} records found</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {isLoading ? (
              <div className="text-sm text-gray-500 animate-pulse text-center mt-10">Loading timeline...</div>
            ) : historyData?.records?.length === 0 ? (
              <div className="text-sm text-gray-500 text-center mt-10">No records match filters.</div>
            ) : (
              historyData?.records?.map((record: any, idx: number) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={record.id}
                  onClick={() => selectRecord(record)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedRecord?.id === record.id 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-black/40 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-white capitalize">
                      {record.entity_type.replace("_", " ")}
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider", 
                        record.action === 'created' ? "bg-signal-normal/20 text-signal-normal" :
                        record.action === 'updated' ? "bg-signal-rerouted/20 text-signal-rerouted" :
                        record.action === 'archived' ? "bg-signal-warning/20 text-signal-warning" :
                        record.action === 'deleted' ? "bg-signal-critical/20 text-signal-critical" :
                        "bg-purple-500/20 text-purple-400"
                      )}>
                        {record.action}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{format(new Date(record.created_at), "HH:mm")}</span>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-1 font-mono">
                    ID: {record.entity_id.slice(0, 13)}...
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>By: <span className="text-gray-300">{record.changed_by}</span></span>
                    <span className="text-[10px] uppercase">{formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="glass rounded-xl flex-1 flex flex-col overflow-hidden relative bg-black/20">
          {!selectedRecord ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a record from the timeline to view details</p>
            </div>
          ) : (
            <motion.div 
              key={selectedRecord.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-white/10 flex-none flex justify-between items-start bg-black/40">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400 capitalize mb-1">
                    {selectedRecord.entity_type.replace("_", " ")} Record
                    <ChevronRight className="w-4 h-4" />
                    <span className={cn(ACTION_COLORS[selectedRecord.action])}>{selectedRecord.action}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white font-mono">{selectedRecord.entity_id}</h2>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">{format(new Date(selectedRecord.created_at), "PPP 'at' p")}</div>
                  <div className="text-sm font-medium text-gray-300 mt-1">By {selectedRecord.changed_by}</div>
                </div>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                
                {selectedRecord.change_reason && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Reason</h3>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-lg text-sm text-gray-200 italic">
                      "{selectedRecord.change_reason}"
                    </div>
                  </div>
                )}

                {selectedRecord.changes && Object.keys(selectedRecord.changes).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Field Changes</h3>
                    </div>
                    <div className="bg-[#0a0a0c] border border-white/10 rounded-lg overflow-hidden font-mono text-sm">
                      {Object.entries(selectedRecord.changes).map(([field, diff]: [string, any]) => (
                        <div key={field} className="border-b border-white/5 last:border-0">
                          <div className="bg-white/5 px-4 py-2 text-gray-300 font-semibold">{field}</div>
                          <div className="flex">
                            <div className="w-1/2 p-4 border-r border-white/5 bg-red-500/5 text-signal-critical/90 break-words">
                              <span className="opacity-50 select-none mr-2">-</span>
                              {JSON.stringify(diff.old, null, 2)}
                            </div>
                            <div className="w-1/2 p-4 bg-green-500/5 text-signal-normal/90 break-words">
                              <span className="opacity-50 select-none mr-2">+</span>
                              {JSON.stringify(diff.new, null, 2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRecord.snapshot && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Entity Snapshot</h3>
                      <button 
                        onClick={toggleSnapshotViewer}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <FileJson className="w-3 h-3" /> {showSnapshotViewer ? "Hide JSON" : "Show JSON"}
                      </button>
                    </div>
                    {showSnapshotViewer && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-[#0a0a0c] border border-white/10 p-4 rounded-lg overflow-hidden"
                      >
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                          {JSON.stringify(selectedRecord.snapshot, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </div>
                )}
                
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
