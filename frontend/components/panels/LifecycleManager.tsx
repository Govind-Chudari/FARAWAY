import React, { useState } from "react";
import { useArchiveEntity, useDeleteEntity, useRestoreEntity } from "@/lib/queries";
import { Archive, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  entityType: string;
  entityId: string;
  entityLabel: string;
  currentStatus: "active" | "archived" | "deleted";
}

export function LifecycleManager({ entityType, entityId, entityLabel, currentStatus }: Props) {
  const { mutateAsync: archiveEntity } = useArchiveEntity();
  const { mutateAsync: deleteEntity } = useDeleteEntity();
  const { mutateAsync: restoreEntity } = useRestoreEntity();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"archive" | "delete" | "restore" | null>(null);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleActionClick = (action: "archive" | "delete" | "restore") => {
    setModalAction(action);
    setReason("");
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!modalAction) return;
    setIsLoading(true);
    try {
      if (modalAction === "archive") {
        await archiveEntity({ entityType, entityId, reason, operator: "operator:admin" } as any);
        toast.success(`Archived ${entityLabel}`);
      } else if (modalAction === "delete") {
        await deleteEntity({ entityType, entityId, reason, operator: "operator:admin" } as any);
        toast.success(`Deleted ${entityLabel}`);
      } else if (modalAction === "restore") {
        await restoreEntity({ entityType, entityId, reason, operator: "operator:admin" } as any);
        toast.success(`Restored ${entityLabel}`);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${modalAction}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {currentStatus === "active" && (
          <button
            onClick={() => handleActionClick("archive")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white/5 text-signal-warning hover:bg-white/10 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive
          </button>
        )}
        
        {(currentStatus === "archived" || currentStatus === "deleted") && (
          <button
            onClick={() => handleActionClick("restore")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white/5 text-signal-normal hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore
          </button>
        )}

        {currentStatus !== "deleted" && (
          <button
            onClick={() => handleActionClick("delete")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white/5 text-signal-critical hover:bg-white/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AnimatePresence>
          {isModalOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#121214] border border-white/10 rounded-xl shadow-2xl p-6 outline-none"
                >
                  <Dialog.Title className="text-lg font-semibold text-white mb-2 capitalize flex items-center gap-2">
                    {modalAction === "delete" && <AlertTriangle className="w-5 h-5 text-signal-critical" />}
                    Confirm {modalAction}
                  </Dialog.Title>
                  
                  <Dialog.Description className="text-sm text-gray-400 mb-4">
                    Are you sure you want to {modalAction} <strong className="text-white">{entityLabel}</strong>? 
                    {modalAction === "delete" ? " This entity will be soft-deleted and removed from active views." : 
                     modalAction === "archive" ? " This entity will be archived for data retention." : 
                     " This entity will be restored to active status."}
                  </Dialog.Description>

                  <div className="mb-6">
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Reason (Optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={`Enter reason for ${modalAction}...`}
                      className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Dialog.Close asChild>
                      <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50",
                        modalAction === "delete" ? "bg-signal-critical hover:bg-signal-critical/80" : 
                        modalAction === "archive" ? "bg-signal-warning text-black hover:bg-signal-warning/80" : 
                        "bg-primary hover:bg-primary/80"
                      )}
                    >
                      {isLoading ? "Processing..." : `Confirm ${modalAction}`}
                    </button>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
