"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { LifecycleManager } from "@/components/panels/LifecycleManager";
import { ChangeHistoryPanel } from "@/components/panels/ChangeHistoryPanel";
import { useTracks } from "@/lib/queries";
import {
  HeartPulse,
  TrendingDown,
  AlertTriangle,
  Wrench,
  CloudRain,
  Sun,
  Thermometer,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
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

function scoreColor(status: string) {
  return status === "critical" ? "#ff453a" : status === "warning" ? "#ffd60a" : "#30d158";
}

export default function TrackHealthPage() {
  const { data } = useTracks();
  const segments = (data?.segments ?? []).map((s: any) => ({
    id: s.id || s.code,
    code: s.code || s.id,
    route: s.route || `${s.from_station || ''} → ${s.to_station || ''}`,
    score: s.health_index ?? 0,
    trend: 0,
    weather: "Clear",
    lastInspect: s.last_inspected || "—",
    incidents: 0,
    status: s.status || "normal",
  }));

  const critical = segments.filter((s) => s.status === "critical").length;
  const warning = segments.filter((s) => s.status === "warning").length;
  const avgScore = segments.length ? Math.round(segments.reduce((a, s) => a + s.score, 0) / segments.length) : 0;

  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [dispatchSegment, setDispatchSegment] = useState<string | null>(null);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);
  const [inspectPriority, setInspectPriority] = useState("P1");
  const [inspectSegment, setInspectSegment] = useState("");

  const stats = [
    { label: "Avg Health Score", value: avgScore.toString(), icon: HeartPulse, gradient: avgScore > 70 ? "from-[#30d158]/10 to-[#34c759]/10" : "from-[#ffd60a]/10 to-[#ff9f0a]/10", iconColor: avgScore > 70 ? "#30d158" : "#ffd60a", change: "-2.1", up: false },
    { label: "Critical Segments", value: critical.toString(), icon: AlertTriangle, gradient: "from-[#ff453a]/10 to-[#ff6961]/10", iconColor: "#ff453a", change: `${critical} active`, up: false },
    { label: "Warning Segments", value: warning.toString(), icon: TrendingDown, gradient: "from-[#ffd60a]/10 to-[#ff9f0a]/10", iconColor: "#ffd60a", change: "Monitoring", up: false },
    { label: "Next Inspection", value: "2h 30m", icon: Wrench, gradient: "from-[#0a84ff]/10 to-[#5e5ce6]/10", iconColor: "#0a84ff", change: "Scheduled", up: true },
  ];

  const maxBarHeight = 140;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em]">
            Track Health Index
          </h1>
          <p className="mt-0.5 text-[13px] text-white/30">
            Predictive maintenance scores across monitored segments
          </p>
        </div>
        <button onClick={() => setInspectModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-[#ffd60a]/[0.08] px-4 py-2.5 text-[13px] font-medium text-[#ffd60a]/80 ring-1 ring-[#ffd60a]/10 transition-all duration-300 hover:bg-[#ffd60a]/[0.12]">
          <Calendar className="h-3.5 w-3.5" />
          Schedule Inspection
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

      <motion.div variants={fadeUp} className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[13px] font-medium text-white/60">Health Score Distribution</span>
          <span className="font-mono text-[10px] text-white/15">{segments.length} segments</span>
        </div>
        <div className="divider" />
        <div className="px-5 py-6">
          <div className="flex items-end justify-between gap-3" style={{ height: maxBarHeight + 30 }}>
            {segments.map((seg, i) => (
              <div key={seg.id} onClick={() => { setSelectedBar(seg.id); setExpandedSegment(seg.id); }} className="flex flex-1 flex-col items-center gap-2 cursor-pointer">
                <span className="font-mono text-[10px] font-medium" style={{ color: scoreColor(seg.status) }}>
                  {seg.score}
                </span>
                <motion.div
                  className={`w-full rounded-t-lg ${selectedBar === seg.id ? "ring-2 ring-[#0a84ff]" : ""}`}
                  style={{ backgroundColor: scoreColor(seg.status), opacity: 0.6 }}
                  initial={{ height: 0 }}
                  animate={{ height: (seg.score / 100) * maxBarHeight }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                />
                <span className="font-mono text-[9px] text-white/20 text-center leading-tight">
                  {seg.id.split("-").slice(0, 2).join("-")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[13px] font-medium text-white/60">Segment Details</span>
        </div>
        <div className="divider" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-5 py-3 text-[10px] font-medium tracking-wide text-white/25 uppercase">Segment</th>
                <th className="px-5 py-3 text-[10px] font-medium tracking-wide text-white/25 uppercase">Score</th>
                <th className="px-5 py-3 text-[10px] font-medium tracking-wide text-white/25 uppercase">7d Trend</th>
                <th className="px-5 py-3 text-[10px] font-medium tracking-wide text-white/25 uppercase">Weather</th>
                <th className="px-5 py-3 text-[10px] font-medium tracking-wide text-white/25 uppercase">Last Inspect</th>
                <th className="px-5 py-3 text-[10px] font-medium tracking-wide text-white/25 uppercase">Incidents</th>
                <th className="px-5 py-3 text-[10px] font-medium tracking-wide text-white/25 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, i) => (
                <React.Fragment key={seg.id}>
                <motion.tr
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.06, ...spring }}
                  onClick={() => setExpandedSegment(expandedSegment === seg.id ? null : seg.id)}
                  className="cursor-pointer transition-all duration-300 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3">
                    <div>
                      <span className="font-mono text-[13px] font-medium text-white/50">{seg.id}</span>
                      <p className="text-[11px] text-white/25">{seg.route}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: scoreColor(seg.status) }}>
                        {seg.score}
                      </span>
                      <div className="h-[3px] w-20 rounded-full bg-white/[0.04]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: scoreColor(seg.status) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${seg.score}%` }}
                          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-mono text-[13px] ${seg.trend < 0 ? "text-[#ff453a]" : seg.trend > 0 ? "text-[#30d158]" : "text-white/25"}`}>
                      {seg.trend > 0 ? `+${seg.trend}` : seg.trend}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-white/40">
                      {seg.weather.includes("Rain") ? (
                        <CloudRain className="h-3.5 w-3.5 text-[#0a84ff]" />
                      ) : seg.weather === "Hot" ? (
                        <Thermometer className="h-3.5 w-3.5 text-[#ff9f0a]" />
                      ) : (
                        <Sun className="h-3.5 w-3.5 text-[#ffd60a]/50" />
                      )}
                      <span className="text-[11px]">{seg.weather}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[13px] text-white/25">{seg.lastInspect}</td>
                  <td className="px-5 py-3 font-mono text-[13px] text-white/50">{seg.incidents}</td>
                  <td className="px-5 py-3">
                    {seg.status !== "normal" && (
                      <button onClick={(e) => { e.stopPropagation(); setDispatchSegment(seg.id); }} className="rounded-xl bg-[#ffd60a]/[0.08] px-3 py-1.5 text-[11px] font-medium text-[#ffd60a]/80 ring-1 ring-[#ffd60a]/10 transition-all duration-300 hover:bg-[#ffd60a]/[0.14]">
                        Dispatch Crew
                      </button>
                    )}
                  </td>
                </motion.tr>
                <AnimatePresence>
                  {expandedSegment === seg.id && (
                    <motion.tr key={`${seg.id}-detail`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                      <td colSpan={7} className="px-5 pb-4">
                        <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.04]">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] text-white/25 uppercase">Segment Code</p>
                              <p className="mt-1 font-mono text-[13px] text-white/50">{seg.id}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/25 uppercase">Route</p>
                              <p className="mt-1 text-[13px] text-white/50">{seg.route}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/25 uppercase">Health Score</p>
                              <p className="mt-1 font-mono text-[13px] font-bold" style={{ color: scoreColor(seg.status) }}>{seg.score}/100</p>
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-4 border-t border-white/5 flex gap-6">
                            <div className="flex-1">
                              <ChangeHistoryPanel entityType="segment" entityId={seg.id} />
                            </div>
                            <div className="w-64 flex-none border-l border-white/5 pl-6">
                              <h3 className="text-[10px] text-white/25 uppercase mb-3">Lifecycle Actions</h3>
                              <LifecycleManager entityType="segment" entityId={seg.id} entityLabel={`Segment ${seg.id}`} currentStatus="active" />
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <Modal open={inspectModalOpen} onOpenChange={setInspectModalOpen} title="Schedule Inspection">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-white/25 uppercase">Segment</label>
            <select value={inspectSegment} onChange={(e) => setInspectSegment(e.target.value)} className="mt-1 w-full rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/50 ring-1 ring-white/[0.04] focus:outline-none focus:ring-[#0a84ff]/40">
              {segments.map((s) => <option key={s.id} value={s.id}>{s.id} — {s.route}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-white/25 uppercase">Priority</label>
            <div className="mt-1 flex gap-2">
              {["P0", "P1", "P2"].map((p) => (
                <button key={p} onClick={() => setInspectPriority(p)} className={`flex-1 rounded-xl py-2 text-[12px] ring-1 transition-colors ${inspectPriority === p ? "bg-[#ffd60a]/20 text-[#ffd60a] ring-[#ffd60a]/30" : "bg-white/[0.04] text-white/40 ring-white/[0.04] hover:bg-white/[0.06]"}`}>{p}</button>
              ))}
            </div>
          </div>
          <button onClick={() => { setInspectModalOpen(false); toast.success(`Inspection scheduled for ${inspectSegment || segments[0]?.id || "segment"} (${inspectPriority})`); setInspectPriority("P1"); }}
            className="w-full rounded-xl bg-[#ffd60a] py-2.5 text-[13px] font-semibold text-black transition-all hover:bg-[#ffd60a]/80">
            Schedule Inspection
          </button>
        </div>
      </Modal>

      <Modal open={!!dispatchSegment} onOpenChange={() => setDispatchSegment(null)} title="Dispatch Crew">
        <div className="space-y-4">
          <p className="text-[13px] text-white/40">Dispatch maintenance crew to segment <span className="font-mono text-white/60">{dispatchSegment}</span>?</p>
          <div className="flex gap-2">
            <button onClick={() => setDispatchSegment(null)}
              className="flex-1 rounded-xl bg-white/[0.04] py-2.5 text-[13px] text-white/40 ring-1 ring-white/[0.04] hover:bg-white/[0.06] transition-colors">
              Cancel
            </button>
            <button onClick={() => { toast.success(`Crew dispatched to ${dispatchSegment}`); setDispatchSegment(null); }}
              className="flex-1 rounded-xl bg-[#ffd60a] py-2.5 text-[13px] font-semibold text-black hover:bg-[#ffd60a]/80 transition-colors">
              Confirm Dispatch
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
