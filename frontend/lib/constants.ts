export const AGENTS = [
  { id: "acoustic", name: "Acoustic", icon: "Activity", color: "#00d4aa" },
  { id: "weather", name: "Weather", icon: "CloudRain", color: "#3b82f6" },
  { id: "routing", name: "Routing", icon: "Route", color: "#f59e0b" },
  { id: "emergency", name: "Emergency", icon: "AlertTriangle", color: "#ef4444" },
  { id: "reporter", name: "Reporter", icon: "FileText", color: "#8b5cf6" },
  { id: "supervisor", name: "Supervisor", icon: "Shield", color: "#6366f1" },
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Network Overview", icon: "LayoutDashboard" },
  { href: "/trains", label: "Train Fleet", icon: "Train" },
  { href: "/health", label: "Track Health", icon: "HeartPulse" },
  { href: "/agents", label: "Agent Brain", icon: "Brain" },
  { href: "/acoustic", label: "Acoustic Monitor", icon: "Activity" },
  { href: "/alerts", label: "Red Alert", icon: "AlertTriangle" },
  { href: "/drones", label: "Drone Command", icon: "Plane" },
  { href: "/audit", label: "Audit Trail", icon: "ScrollText" },
  { href: "/maintenance", label: "Maintenance", icon: "Wrench" },
  { href: "/reports", label: "Reports", icon: "FileBarChart" },
  { href: "/history", label: "Change History", icon: "History" },
] as const;

export const MOCK_STATS = {
  activeTrains: 13000,
  networkKm: 68000,
  passengersToday: 23_400_000,
  alerts: 3,
  healthScore: 87,
  agentsOnline: 6,
};

export const SEVERITY_COLORS = {
  normal: "text-signal-normal",
  warning: "text-signal-warning",
  critical: "text-signal-critical",
  rerouted: "text-signal-rerouted",
  offline: "text-signal-offline",
} as const;
