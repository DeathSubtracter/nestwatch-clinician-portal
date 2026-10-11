import { createContext, useContext } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { DemoData } from "./demoData";

export const DashboardContext = createContext<UseQueryResult<DemoData, Error> | null>(null);
export function useDashboardQuery() {
  const query = useContext(DashboardContext);
  if (!query) throw new Error("DashboardProvider is required");
  return query;
}
export function useDashboard() {
  const { data } = useDashboardQuery();
  if (!data) throw new Error("Dashboard has not loaded");
  return data;
}
