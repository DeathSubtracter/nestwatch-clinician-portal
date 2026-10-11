import { readFileSync } from "node:fs";
import { backendDashboardSchema } from "@/data/backendSchema";
import { adaptDashboard } from "@/data/demoData";

export const snapshotJson: unknown = JSON.parse(
  readFileSync(`${process.cwd()}/public/demo/maya-dashboard.json`, "utf8"),
);
export const snapshot = backendDashboardSchema.parse(snapshotJson);
export const dashboard = adaptDashboard(snapshot);
