import React from "react";
import { motion } from "framer-motion";
import { useEntityHistory } from "@/lib/queries";
import { formatDistanceToNow } from "date-fns";
import { Clock, Archive, Trash2, Edit2, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  entityType: string;
  entityId: string;
}

const ACTION_COLORS: Record<string, string> = {
  created: "text-signal-normal",
  updated: "text-signal-rerouted",
  archived: "text-signal-warning",
  deleted: "text-signal-critical",
  restored: "text-purple-400",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <Plus className="w-4 h-4" />,
  updated: <Edit2 className="w-4 h-4" />,
  archived: <Archive className="w-4 h-4" />,
  deleted: <Trash2 className="w-4 h-4" />,
  restored: <RotateCcw className="w-4 h-4" />,
};

export function ChangeHistoryPanel({ entityType, entityId }: Props) {
  const { data: history, isLoading } = useEntityHistory(entityType, entityId);

  if (isLoading) {
    return <div className="p-4 text-gray-400 animate-pulse text-sm">Loading history...</div>;
  }

  if (!history || history.length === 0) {
    return <div className="p-4 text-gray-500 text-sm italic">No change history recorded.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Change History
      </h3>
      <div className="relative pl-4 border-l border-white/10 flex flex-col gap-6">
        {history.slice(0, 10).map((record: any, idx: number) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={record.id}
            className="relative"
          >
            {/* Timeline dot */}
            <div className={cn("absolute -left-[21px] w-2.5 h-2.5 rounded-full border border-[#0a0a0c] bg-current", ACTION_COLORS[record.action] || "text-gray-400")} />
            
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-200 capitalize">
                <span className={cn(ACTION_COLORS[record.action] || "text-gray-400")}>
                  {ACTION_ICONS[record.action] || <Clock className="w-4 h-4" />}
                </span>
                {record.action}
              </div>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <div className="text-xs text-gray-400 mb-2">
              By: <span className="text-gray-300 font-mono">{record.changed_by}</span>
            </div>

            {record.change_reason && (
              <div className="text-xs text-gray-400 italic mb-2 border-l-2 border-white/10 pl-2">
                "{record.change_reason}"
              </div>
            )}

            {record.changes && Object.keys(record.changes).length > 0 && (
              <div className="bg-white/5 rounded p-2 text-xs font-mono overflow-hidden">
                {Object.entries(record.changes).map(([field, diff]: [string, any]) => (
                  <div key={field} className="mb-1 last:mb-0">
                    <span className="text-gray-400 block mb-0.5">{field}:</span>
                    <div className="flex flex-col pl-2">
                      <span className="text-signal-critical line-through decoration-red-500/50">
                        - {JSON.stringify(diff.old)}
                      </span>
                      <span className="text-signal-normal">
                        + {JSON.stringify(diff.new)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
      {history.length > 10 && (
        <div className="text-xs text-center text-primary mt-2 cursor-pointer hover:underline">
          View all {history.length} changes
        </div>
      )}
    </div>
  );
}
