"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import {
  LayoutDashboard,
  Train,
  HeartPulse,
  Brain,
  Activity,
  AlertTriangle,
  Plane,
  ScrollText,
  Wrench,
  FileBarChart,
  Radio,
  Globe,
  ChevronLeft,
  LogOut,
  History,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Train, HeartPulse, Brain, Activity,
  AlertTriangle, Plane, ScrollText, Wrench, FileBarChart, Globe, History,
};

const NAV = [
  { href: "/", label: "Overview", icon: "LayoutDashboard" },
  { href: "/trains", label: "Trains", icon: "Train" },
  { href: "/health", label: "Track Health", icon: "HeartPulse" },
  { href: "/agents", label: "Agents", icon: "Brain" },
  { href: "/acoustic", label: "Acoustic", icon: "Activity" },
  { href: "/alerts", label: "Alerts", icon: "AlertTriangle", badge: 3 },
  { href: "/drones", label: "Drones", icon: "Plane" },
  { href: "/audit", label: "Audit", icon: "ScrollText" },
  { href: "/maintenance", label: "Maintenance", icon: "Wrench" },
  { href: "/reports", label: "Reports", icon: "FileBarChart" },
  { href: "/history", label: "Change History", icon: "History" },
  { href: "/social", label: "Crisis Radar", icon: "Globe" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { userRole, setUserRole } = useUiStore();

  const filteredNav = NAV.filter(item => {
    if (userRole === "admin") return true;
    if (userRole === "maintenance") {
      return ["Overview", "Track Health", "Maintenance", "Alerts"].includes(item.label);
    }
    if (userRole === "drone_op") {
      return ["Overview", "Drones", "Alerts", "Crisis Radar"].includes(item.label);
    }
    return false;
  });

  return (
    <aside
      className={cn(
        "flex flex-col m-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-300",
        collapsed ? "w-[75px]" : "w-[230px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            {/* <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0a84ff] to-[#7c4dff] shadow-lg">
              <Radio className="h-4 w-4 text-white" />
            </div> */}
            <div>
              <h1 className="text-lg ml-10 font-bold text-white tracking-tight">
                RailMind
              </h1>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 text-white transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-2">
        {filteredNav.map((item) => {
          const Icon = iconMap[item.icon];
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative"
            >
              {/* Active Glow Line */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-[#0a84ff] to-[#7c4dff] shadow-[0_0_10px_#0a84ff]" />
              )}

              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300",
                  active
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    active
                      ? "text-[#0a84ff] scale-110"
                      : "group-hover:scale-105"
                  )}
                />

                {!collapsed && (
                  <span className="text-sm tracking-tight">
                    {item.label}
                  </span>
                )}

                {!collapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-2 text-xs text-white shadow">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip */}
                {collapsed && (
                  <span className="absolute left-full ml-3 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Status */}
      <div className="px-4 py-4 mt-auto border-t border-white/5 space-y-4">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            AI Agents Active
          </div>
        )}
        <button
          onClick={() => setUserRole(null)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm">Disconnect</span>}
        </button>
      </div>
    </aside>
  );
}