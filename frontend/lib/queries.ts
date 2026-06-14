"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

// ─── Trains ───
export function useTrains(status?: string) {
  return useQuery({
    queryKey: ["trains", status],
    queryFn: async () => {
      const { data } = await api.get("/trains", { params: status ? { status } : undefined });
      return data as { trains: any[]; total: number };
    },
    refetchInterval: 5000,
  });
}

export function useTrain(trainId: string) {
  return useQuery({
    queryKey: ["train", trainId],
    queryFn: async () => {
      const { data } = await api.get(`/trains/${trainId}`);
      return data;
    },
    enabled: !!trainId,
  });
}

// ─── Tracks ───
export function useTracks(status?: string) {
  return useQuery({
    queryKey: ["tracks", status],
    queryFn: async () => {
      const { data } = await api.get("/tracks", { params: status ? { status } : undefined });
      return data as { segments: any[]; total: number };
    },
    refetchInterval: 10000,
  });
}

export function useTrackHistory(segmentId: string) {
  return useQuery({
    queryKey: ["trackHistory", segmentId],
    queryFn: async () => {
      const { data } = await api.get(`/tracks/${segmentId}/history`);
      return data;
    },
    enabled: !!segmentId,
  });
}

// ─── Agents ───
export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data } = await api.get("/agents/status");
      return data as { agents: any[]; total_active: number };
    },
    refetchInterval: 5000,
  });
}

export function useAuditLog(agent?: string, limit = 50) {
  return useQuery({
    queryKey: ["audit", agent, limit],
    queryFn: async () => {
      const params: Record<string, any> = { limit };
      if (agent) params.agent = agent;
      const { data } = await api.get("/agents/audit", { params });
      return data as { entries: any[]; total: number };
    },
  });
}

// ─── Acoustic ───
export function useAcousticEvents(limit = 20) {
  return useQuery({
    queryKey: ["acoustic", limit],
    queryFn: async () => {
      const { data } = await api.get("/acoustic/recent", { params: { limit } });
      return data as { events: any[]; total: number };
    },
    refetchInterval: 5000,
  });
}

// ─── Drones ───
export function useDrones(status?: string) {
  return useQuery({
    queryKey: ["drones", status],
    queryFn: async () => {
      const { data } = await api.get("/drones", { params: status ? { status } : undefined });
      return data as { drones: any[]; total: number };
    },
    refetchInterval: 5000,
  });
}

// ─── Maintenance ───
export function useWorkOrders(status?: string, priority?: string) {
  return useQuery({
    queryKey: ["workorders", status, priority],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      const { data } = await api.get("/maintenance/workorders", { params });
      return data as { work_orders: any[]; total: number };
    },
    refetchInterval: 10000,
  });
}

export function useCrews() {
  return useQuery({
    queryKey: ["crews"],
    queryFn: async () => {
      const { data } = await api.get("/maintenance/crews");
      return data as { crews: any[]; total: number };
    },
    refetchInterval: 10000,
  });
}

// ─── Weather ───
export function useWeather(routeId: string) {
  return useQuery({
    queryKey: ["weather", routeId],
    queryFn: async () => {
      const { data } = await api.get(`/weather/route/${routeId}`);
      return data;
    },
    enabled: !!routeId,
  });
}

// ─── Reports / Incidents ───
export function useIncident(incidentId: string) {
  return useQuery({
    queryKey: ["incident", incidentId],
    queryFn: async () => {
      const { data } = await api.get(`/reports/incident/${incidentId}`);
      return data;
    },
    enabled: !!incidentId,
  });
}
