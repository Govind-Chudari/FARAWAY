"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { LifecycleManager } from "@/components/panels/LifecycleManager";
import { ChangeHistoryPanel } from "@/components/panels/ChangeHistoryPanel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Battery,
  MapPin,
  Clock,
  Signal,
  Eye,
  Navigation,
  Zap,
  ChevronRight,
  Circle,
} from "lucide-react";
import { useDrones } from "@/lib/queries";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

function statusColor(status: string) {
  switch (status) {
    case "active": return "#30d158";
    case "standby": return "#0a84ff";
    case "returning": return "#ffd60a";
    case "charging": return "#bf5af2";
    default: return "#8e8e93";
  }
}

function batteryColor(level: number) {
  if (level > 70) return "#30d158";
  if (level > 30) return "#ffd60a";
  return "#ff453a";
}

export default function DroneCommandPage() {
  const { data } = useDrones();
  const drones = (data?.drones ?? []).map((d: any) => ({
    id: d.id,
    name: d.call_sign || d.id,
    status: d.status,
    battery: d.battery_pct ?? 0,
    location: d.mission || "—",
    mission: d.mission || d.status,
    altitude: d.altitude != null ? d.altitude + "m" : "0m",
    speed: d.speed_kmh ? d.speed_kmh + " km/h" : "0 km/h",
    eta: null,
    signal: 100,
    latitude: d.latitude,
    longitude: d.longitude,
  }));

  const activeCount = drones.filter((d: any) => d.status === "active").length;
  const standbyCount = drones.filter((d: any) => d.status === "standby").length;
  const returningCount = drones.filter((d: any) => d.status === "returning").length;
  const chargingCount = drones.filter((d: any) => d.status === "charging").length;
  const fleetStats = [
    { label: "Active", value: activeCount, color: "#30d158", icon: Circle },
    { label: "Standby", value: standbyCount, color: "#0a84ff", icon: Circle },
    { label: "Returning", value: returningCount, color: "#ffd60a", icon: Circle },
    { label: "Charging", value: chargingCount, color: "#bf5af2", icon: Circle },
  ];

  const [deployOpen, setDeployOpen] = useState(false);
  const [deployTarget, setDeployTarget] = useState("");
  const [deployMission, setDeployMission] = useState("Surveillance");
  const [deployPriority, setDeployPriority] = useState("P1");
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);

  const missionLog = drones.map((d: any) => ({
    time: "—",
    drone: d.name,
    action: d.mission || d.status,
    status: d.status,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen space-y-5 p-6"
      style={{ background: "#000000" }}
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={spring}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white/60">
            Drone Command
          </h1>
          <p className="mt-0.5 text-[13px] text-white/25">
            UAV fleet management — real-time tracking & deployment
          </p>
        </div>
        <motion.button
          onClick={() => setDeployOpen(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={spring}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white"
          style={{ background: "#0a84ff" }}
        >
          <Plane className="h-3.5 w-3.5" />
          Deploy New UAV
        </motion.button>
      </motion.div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-4 gap-3">
        {fleetStats.map((s, i) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ ...spring, delay: i * 0.06 }}
            whileHover={{ y: -3, scale: 1.02 }}
            className="glass glass-hover cursor-default rounded-2xl p-5 ring-1 ring-white/[0.03]"
            style={{
              background: "rgba(28,28,30,0.55)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-[11px] font-medium tracking-wide uppercase text-white/25">
                {s.label}
              </span>
            </div>
            <span
              className="font-mono text-3xl font-bold"
              style={{ color: s.color }}
            >
              {s.value}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Map View */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ ...spring, delay: 0.15 }}
          className="glass col-span-8 overflow-hidden rounded-2xl ring-1 ring-white/[0.03]"
          style={{
            background: "rgba(28,28,30,0.55)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
          }}
        >
          <div className="divider flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" style={{ color: "#0a84ff" }} />
              <span className="text-[13px] font-medium text-white/60">
                UAV Fleet Map
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "#30d158" }}
              />
              <span className="font-mono text-[11px] text-white/25">
                Tracking {drones.length} UAVs
              </span>
            </div>
          </div>
          <div
            className="relative h-[420px] overflow-hidden"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            <svg
              viewBox="0 0 600 420"
              className="absolute inset-0 h-full w-full"
            >
              {Array.from({ length: 15 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1="0"
                  y1={i * 30}
                  x2="600"
                  y2={i * 30}
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="0.5"
                />
              ))}
              {Array.from({ length: 20 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={i * 30}
                  y1="0"
                  x2={i * 30}
                  y2="420"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="0.5"
                />
              ))}
              <path
                d="M200,40 L260,50 L290,80 L310,100 L330,140 L340,180 L350,220 L340,260 L330,280 L310,310 L290,340 L270,360 L260,370 L250,380 L230,370 L210,350 L190,330 L170,310 L160,290 L150,270 L140,250 L150,220 L160,200 L170,180 L180,160 L190,140 L180,120 L190,100 L200,80 Z"
                fill="none"
                stroke="#0a84ff"
                strokeWidth="0.8"
                opacity="0.15"
              />
            </svg>

            {drones.map((drone: any, i: number) => {
              const x = drone.longitude
                ? ((drone.longitude - 68) / (97 - 68)) * 600
                : 100 + (i * 120) % 500;
              const y = drone.latitude
                ? ((35 - drone.latitude) / (35 - 8)) * 420
                : 80 + (i * 90) % 340;
              const color = statusColor(drone.status);
              return (
                <motion.div
                  key={drone.id}
                  className="absolute"
                  style={{
                    left: `${(x / 600) * 100}%`,
                    top: `${(y / 420) * 100}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...spring, delay: 0.3 + i * 0.08 }}
                >
                  <div className="relative">
                    {drone.status === "active" && (
                      <span
                        className="absolute -inset-3 animate-ping rounded-full"
                        style={{ background: `${color}15` }}
                      />
                    )}
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        border: `2px solid ${color}`,
                        background: `${color}20`,
                      }}
                    >
                      <Plane className="h-3 w-3" style={{ color }} />
                    </div>
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] text-white/25">
                      {drone.id}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Panel */}
        <div className="col-span-4 space-y-4">
          {/* Fleet Overview */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ ...spring, delay: 0.2 }}
            className="glass rounded-2xl p-5 ring-1 ring-white/[0.03]"
            style={{
              background: "rgba(28,28,30,0.55)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
          >
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium text-white/60">
              <Eye className="h-3.5 w-3.5" style={{ color: "#0a84ff" }} />
              Fleet Overview
            </h3>
            <div className="space-y-2">
              {[
                { label: "Total Fleet", value: `${drones.length} UAVs` },
                { label: "Coverage", value: "12,400 km\u00B2" },
                { label: "Missions Today", value: "14" },
                { label: "Avg Flight Time", value: "42 min" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 ring-1 ring-white/[0.03]"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <span className="text-[11px] text-white/25">
                    {item.label}
                  </span>
                  <span className="font-mono text-[12px] font-medium text-white/50">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mission Tracking */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ ...spring, delay: 0.28 }}
            className="glass rounded-2xl p-5 ring-1 ring-white/[0.03]"
            style={{
              background: "rgba(28,28,30,0.55)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
          >
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium text-white/60">
              <Navigation
                className="h-3.5 w-3.5"
                style={{ color: "#0a84ff" }}
              />
              Mission Tracking
            </h3>
            <div className="space-y-3">
              {drones
                .filter(
                  (d) => d.status === "active" || d.status === "returning"
                )
                .map((drone) => {
                  const color = statusColor(drone.status);
                  return (
                    <div
                      key={drone.id}
                      className="rounded-xl p-3.5 ring-1 ring-white/[0.03]"
                      style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-white/60">
                          {drone.name}
                        </span>
                        <span
                          className="pill rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider"
                          style={{
                            background: `${color}15`,
                            color,
                          }}
                        >
                          {drone.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-white/40">
                        <div className="flex items-center gap-1.5">
                          <Battery
                            className="h-2.5 w-2.5"
                            style={{ color: batteryColor(drone.battery) }}
                          />
                          <span className="font-mono text-white/50">
                            {drone.battery}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Signal className="h-2.5 w-2.5 text-white/25" />
                          <span className="font-mono text-white/50">
                            {drone.signal}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-2.5 w-2.5 text-white/25" />
                          <span className="font-mono text-white/50">
                            {drone.speed}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-2.5 w-2.5 text-white/25" />
                          <span className="font-mono text-white/50">
                            {drone.altitude}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-white/25">
                        {drone.mission}
                      </p>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mission Log */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ ...spring, delay: 0.35 }}
        className="glass rounded-2xl ring-1 ring-white/[0.03]"
        style={{
          background: "rgba(28,28,30,0.55)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      >
        <div className="divider flex items-center justify-between px-5 py-3">
          <h3 className="flex items-center gap-2 text-[13px] font-medium text-white/60">
            <Clock className="h-3.5 w-3.5" style={{ color: "#0a84ff" }} />
            Mission Log
          </h3>
        </div>
        <div>
          {missionLog.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.4 + i * 0.06 }}
              className="divider flex items-center gap-4 px-5 py-3 transition-colors"
              style={{
                borderBottom:
                  i < missionLog.length - 1
                    ? "1px solid rgba(255,255,255,0.03)"
                    : "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span className="w-12 shrink-0 font-mono text-[11px] text-white/25">
                {entry.time}
              </span>
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: statusColor(entry.status) }}
              />
              <span
                className="w-16 shrink-0 rounded-lg px-2 py-0.5 text-center font-mono text-[10px] font-medium text-white/50 ring-1 ring-white/[0.03]"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                {entry.drone}
              </span>
              <span className="flex-1 text-[12px] text-white/40">
                {entry.action}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* All Drones Table */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ ...spring, delay: 0.42 }}
        className="glass overflow-hidden rounded-2xl ring-1 ring-white/[0.03]"
        style={{
          background: "rgba(28,28,30,0.55)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      >
        <div className="divider px-5 py-3">
          <h3 className="flex items-center gap-2 text-[13px] font-medium text-white/60">
            <Plane className="h-3.5 w-3.5" style={{ color: "#0a84ff" }} />
            All Drones
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr
                className="text-left text-[10px] uppercase tracking-wider text-white/25"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
              >
                <th className="px-5 py-2.5 font-medium">ID</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Battery</th>
                <th className="px-5 py-2.5 font-medium">Location</th>
                <th className="px-5 py-2.5 font-medium">Mission</th>
                <th className="px-5 py-2.5 font-medium">Signal</th>
                <th className="px-5 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {drones.map((drone, i) => {
                const color = statusColor(drone.status);
                const batColor = batteryColor(drone.battery);
                return (
                  <tr
                    key={drone.id}
                    onClick={() => setSelectedDrone(selectedDrone === drone.id ? null : drone.id)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom:
                        i < drones.length - 1
                          ? "1px solid rgba(255,255,255,0.03)"
                          : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td className="px-5 py-3 font-mono font-medium text-white/50">
                      {drone.name}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold"
                        style={{
                          background: `${color}15`,
                          color,
                        }}
                      >
                        <Circle className="h-1.5 w-1.5 fill-current" />
                        {drone.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-[3px] w-14 overflow-hidden rounded-full"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: batColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${drone.battery}%` }}
                            transition={{ ...spring, delay: 0.5 + i * 0.08 }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-white/50">
                          {drone.battery}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-white/40">
                      {drone.location}
                    </td>
                    <td className="px-5 py-3 text-white/40">
                      {drone.mission}
                    </td>
                    <td className="px-5 py-3 font-mono text-white/50">
                      {drone.signal}%
                    </td>
                    <td className="px-5 py-3">
                      <ChevronRight className={`h-3.5 w-3.5 text-white/25 transition-transform ${selectedDrone === drone.id ? "rotate-90" : ""}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <AnimatePresence>
            {selectedDrone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/[0.02] border-t border-white/5 p-6"
              >
                <div className="flex gap-6">
                  <div className="flex-1">
                    <ChangeHistoryPanel entityType="drone" entityId={selectedDrone} />
                  </div>
                  <div className="w-64 flex-none border-l border-white/5 pl-6">
                    <h3 className="text-[10px] text-white/25 uppercase mb-3">Lifecycle Actions</h3>
                    <LifecycleManager entityType="drone" entityId={selectedDrone} entityLabel={`Drone ${drones.find((d: any) => d.id === selectedDrone)?.name}`} currentStatus="active" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <Modal open={deployOpen} onOpenChange={setDeployOpen} title="Deploy New UAV">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-white/25 uppercase">Target Segment</label>
            <input value={deployTarget} onChange={(e) => setDeployTarget(e.target.value)} className="mt-1 w-full rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/50 ring-1 ring-white/[0.04] focus:outline-none focus:ring-[#0a84ff]/40" placeholder="e.g. MUM-DEL-KM402" />
          </div>
          <div>
            <label className="text-[11px] text-white/25 uppercase">Mission Type</label>
            <select value={deployMission} onChange={(e) => setDeployMission(e.target.value)} className="mt-1 w-full rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/50 ring-1 ring-white/[0.04] focus:outline-none focus:ring-[#0a84ff]/40">
              <option>Surveillance</option>
              <option>Inspection</option>
              <option>Emergency Response</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-white/25 uppercase">Priority</label>
            <div className="mt-1 flex gap-2">
              {["P0", "P1", "P2"].map((p) => (
                <button key={p} onClick={() => setDeployPriority(p)} className={`flex-1 rounded-xl py-2 text-[12px] ring-1 transition-colors ${deployPriority === p ? "bg-[#0a84ff]/20 text-[#0a84ff] ring-[#0a84ff]/30" : "bg-white/[0.04] text-white/40 ring-white/[0.04] hover:bg-white/[0.06]"}`}>{p}</button>
              ))}
            </div>
          </div>
          <button onClick={() => { if (!deployTarget.trim()) { toast.error("Enter a target segment"); return; } setDeployOpen(false); toast.success(`UAV deployed to ${deployTarget} — ${deployMission} mission (${deployPriority})`); setDeployTarget(""); setDeployMission("Surveillance"); setDeployPriority("P1"); }}
            className="w-full rounded-xl bg-[#0a84ff] py-2.5 text-[13px] font-semibold text-white hover:bg-[#0a84ff]/80 transition-colors">
            Deploy UAV
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
