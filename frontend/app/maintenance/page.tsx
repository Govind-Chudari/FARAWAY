"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkOrders, useCrews } from "@/lib/queries";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import {
  Wrench,
  Users,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
} from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { ...spring, duration: 0.55 } },
};


const priorityConfig: Record<string, { color: string; bg: string; ring: string }> = {
  P0: { color: "text-[#ff453a]", bg: "bg-[#ff453a]/[0.08]", ring: "ring-[#ff453a]/10" },
  P1: { color: "text-[#ffd60a]", bg: "bg-[#ffd60a]/[0.08]", ring: "ring-[#ffd60a]/10" },
  P2: { color: "text-[#0a84ff]", bg: "bg-[#0a84ff]/[0.08]", ring: "ring-[#0a84ff]/10" },
};

const statusConfig: Record<string, { color: string; bg: string; ring: string; label: string }> = {
  dispatched: { color: "text-[#ffd60a]", bg: "bg-[#ffd60a]/[0.08]", ring: "ring-[#ffd60a]/10", label: "Dispatched" },
  in_progress: { color: "text-[#0a84ff]", bg: "bg-[#0a84ff]/[0.08]", ring: "ring-[#0a84ff]/10", label: "In Progress" },
  pending: { color: "text-white/40", bg: "bg-white/[0.04]", ring: "ring-white/[0.04]", label: "Pending" },
  completed: { color: "text-[#30d158]", bg: "bg-[#30d158]/[0.08]", ring: "ring-[#30d158]/10", label: "Completed" },
};

const crewStatusConfig: Record<string, { color: string; bg: string; ring: string }> = {
  deployed: { color: "text-[#ffd60a]", bg: "bg-[#ffd60a]/[0.08]", ring: "ring-[#ffd60a]/10" },
  on_site: { color: "text-[#0a84ff]", bg: "bg-[#0a84ff]/[0.08]", ring: "ring-[#0a84ff]/10" },
  available: { color: "text-[#30d158]", bg: "bg-[#30d158]/[0.08]", ring: "ring-[#30d158]/10" },
};

export default function MaintenancePage() {
  const { data } = useWorkOrders();
  const { data: crewsData } = useCrews();

  const workOrders = (data?.work_orders ?? []).map((wo: any) => ({
    id: wo.id,
    segment: wo.segment_code || (typeof wo.segment === 'object' && wo.segment !== null ? wo.segment.name : wo.segment) || "—",
    priority: wo.priority || "P2",
    type: (typeof wo.type === 'object' && wo.type !== null ? wo.type.name : wo.type) || wo.description || "General",
    crew: wo.crew_name || (typeof wo.crew === 'object' && wo.crew !== null ? wo.crew.name : wo.crew) || "Unassigned",
    status: wo.status || "pending",
    eta: wo.eta_minutes ? `${wo.eta_minutes} min` : "—",
    createdAt: wo.created_at?.slice(11, 16) || "—",
  }));

  const crews = crewsData?.crews ?? [];

  const activeCount = workOrders.filter((wo: any) => wo.status !== "completed").length;
  const completedCount = workOrders.filter((wo: any) => wo.status === "completed").length;
  const urgentCount = workOrders.filter((wo: any) => wo.priority === "P0" || wo.priority === "P1").length;

  const stats = [
    { label: "Active Orders", value: String(activeCount), icon: Wrench, gradient: "from-[#ffd60a]/10 to-[#ff9f0a]/10", iconColor: "#ffd60a", change: `${urgentCount} urgent`, up: false },
    { label: "Crews Available", value: `${crews.length}`, icon: Users, gradient: "from-[#30d158]/10 to-[#34c759]/10", iconColor: "#30d158", change: "—", up: true },
    { label: "Completed Today", value: String(completedCount), icon: CheckCircle2, gradient: "from-[#0a84ff]/10 to-[#5e5ce6]/10", iconColor: "#0a84ff", change: `+${completedCount}`, up: true },
    { label: "Avg Response", value: "—", icon: Timer, gradient: "from-[#bf5af2]/10 to-[#af52de]/10", iconColor: "#bf5af2", change: "—", up: true },
  ];

  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderPriority, setOrderPriority] = useState("P1");
  const [orderSegment, setOrderSegment] = useState("");
  const [orderType, setOrderType] = useState("Rail Replacement");
  const [orderDesc, setOrderDesc] = useState("");
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em]">
            Maintenance Center
          </h1>
          <p className="mt-0.5 text-[13px] text-white/30">
            AI-orchestrated crew dispatch & work order management
          </p>
        </div>
        <button onClick={() => setNewOrderOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-[#0a84ff] px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-300 hover:bg-[#0a84ff]/80">
          <Plus className="h-3.5 w-3.5" />
          New Work Order
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3, transition: spring }}
            className="glass glass-hover rounded-2xl p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-white/25 uppercase">
                  {s.label}
                </p>
                <p className="mt-1.5 font-display text-[26px] font-semibold tracking-[-0.03em] text-white">
                  {s.value}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {s.up ? (
                    <ArrowUpRight className="h-3 w-3 text-[#30d158]" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-[#ff453a]" />
                  )}
                  <span className={`text-[11px] font-medium ${s.up ? "text-[#30d158]/70" : "text-[#ff453a]/70"}`}>
                    {s.change}
                  </span>
                </div>
              </div>
              <div className={`rounded-xl bg-gradient-to-br ${s.gradient} p-2.5`}>
                <s.icon className="h-[18px] w-[18px]" style={{ color: s.iconColor }} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-12 gap-3">
        <motion.div variants={fadeUp} className="col-span-8 glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[13px] font-medium text-white/60">Work Orders</span>
            <span className="font-mono text-[10px] text-white/15">{workOrders.length} orders</span>
          </div>
          <div className="divider" />
          <div>
            {workOrders.map((wo, i) => {
              const pc = priorityConfig[wo.priority] || priorityConfig["P2"];
              const sc = statusConfig[wo.status] || statusConfig["pending"];
              return (
                <React.Fragment key={wo.id}>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06, ...spring }}
                  onClick={() => setExpandedOrder(expandedOrder === wo.id ? null : wo.id)}
                  className="flex items-center gap-4 px-5 py-3.5 transition-all duration-300 hover:bg-white/[0.02] cursor-pointer"
                >
                  <span className={`pill text-[10px] font-bold ${pc.bg} ${pc.color} ring-1 ${pc.ring}`}>
                    {wo.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-white/50">{wo.type}</span>
                      <span className="font-mono text-[11px] text-white/20">{wo.segment}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-white/20">
                      <span className="flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        {wo.crew}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {wo.createdAt}
                      </span>
                    </div>
                  </div>
                  <span className={`pill text-[10px] ring-1 ${sc.bg} ${sc.color} ${sc.ring}`}>
                    {sc.label}
                  </span>
                  {wo.eta !== "—" && (
                    <span className="font-mono text-[11px] text-white/20">ETA: {wo.eta}</span>
                  )}
                </motion.div>
                <AnimatePresence>
                  {expandedOrder === wo.id && (
                    <motion.div
                      key={`${wo.id}-detail`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 pb-3"
                    >
                      <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.04]">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] text-white/25 uppercase">Work Order ID</p>
                            <p className="mt-1 font-mono text-[13px] text-white/50">{wo.id}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/25 uppercase">Assigned Crew</p>
                            <p className="mt-1 text-[13px] text-white/50">{wo.crew}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/25 uppercase">ETA</p>
                            <p className="mt-1 font-mono text-[13px] text-white/50">{wo.eta}</p>
                          </div>
                        </div>
                        {wo.status !== "completed" && !completedOrders.has(wo.id) && (
                          <button onClick={(e) => { e.stopPropagation(); setCompletedOrders(prev => new Set(prev).add(wo.id)); toast.success(`Work order ${wo.id} marked complete`); }}
                            className="mt-3 rounded-xl bg-[#30d158]/10 px-4 py-2 text-[12px] font-medium text-[#30d158] ring-1 ring-[#30d158]/10 hover:bg-[#30d158]/20 transition-colors">
                            Mark Complete
                          </button>
                        )}
                        {completedOrders.has(wo.id) && (
                          <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#30d158]/60">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="col-span-4 glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[13px] font-medium text-white/60">Crew Status</span>
            <span className="font-mono text-[10px] text-white/15">{crews.length} crews</span>
          </div>
          <div className="divider" />
          <div className="p-3 space-y-2">
            {crews.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-[13px] text-white/20">
                No crew data available
              </div>
            ) : crews.map((crew, i) => {
              const cs = crewStatusConfig[crew.status] || crewStatusConfig["available"];
              return (
                <motion.div
                  key={crew.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06, ...spring }}
                  className="rounded-xl bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.03] transition-all duration-300 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-white/50">{crew.name}</span>
                    <span className={`pill text-[10px] ring-1 ${cs.bg} ${cs.color} ${cs.ring}`}>
                      {crew.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/20">
                    <span>{crew.members} members</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {crew.location}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <Modal open={newOrderOpen} onOpenChange={setNewOrderOpen} title="New Work Order">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-white/25 uppercase">Segment Code</label>
            <input value={orderSegment} onChange={(e) => setOrderSegment(e.target.value)} className="mt-1 w-full rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/50 ring-1 ring-white/[0.04] focus:outline-none focus:ring-[#0a84ff]/40" placeholder="e.g. MUM-DEL-KM402" />
          </div>
          <div>
            <label className="text-[11px] text-white/25 uppercase">Type</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="mt-1 w-full rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/50 ring-1 ring-white/[0.04] focus:outline-none focus:ring-[#0a84ff]/40">
              <option>Rail Replacement</option>
              <option>Welding</option>
              <option>Alignment</option>
              <option>Ballast</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-white/25 uppercase">Priority</label>
            <div className="mt-1 flex gap-2">
              {["P0", "P1", "P2"].map((p) => (
                <button key={p} onClick={() => setOrderPriority(p)} className={`flex-1 rounded-xl py-2 text-[12px] ring-1 transition-colors ${orderPriority === p ? "bg-[#0a84ff]/20 text-[#0a84ff] ring-[#0a84ff]/30" : "bg-white/[0.04] text-white/40 ring-white/[0.04] hover:bg-white/[0.06]"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/25 uppercase">Description</label>
            <textarea value={orderDesc} onChange={(e) => setOrderDesc(e.target.value)} className="mt-1 w-full rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/50 ring-1 ring-white/[0.04] focus:outline-none focus:ring-[#0a84ff]/40 resize-none h-20" placeholder="Work order details..." />
          </div>
          <button onClick={() => { if (!orderSegment.trim()) { toast.error("Enter a segment code"); return; } setNewOrderOpen(false); toast.success(`Work order created: ${orderType} at ${orderSegment} (${orderPriority})`); setOrderSegment(""); setOrderType("Rail Replacement"); setOrderPriority("P1"); setOrderDesc(""); }}
            className="w-full rounded-xl bg-[#0a84ff] py-2.5 text-[13px] font-semibold text-white hover:bg-[#0a84ff]/80 transition-colors">
            Create Work Order
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
