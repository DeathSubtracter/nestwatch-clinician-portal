/**
 * Centralized patient directory. Mirrors a future `GET /patients` response;
 * each record's dashboard is resolved via getDashboard(id) (future `GET /patients/{id}/dashboard`).
 */
import { demoData, type PatternStatus } from "./demoData";

export interface PatientSummary {
  id: string;
  name: string;
  gestationalAge: string;
  gestationalShort: string;
  trimester: string;
  context: string;
  status: PatternStatus;
  summary: string[];
  freshness: string;
}

const maya = demoData.patient;

export const patients: PatientSummary[] = [
  {
    id: "maya",
    name: maya.name,
    gestationalAge: `${maya.gestational_weeks} weeks`,
    gestationalShort: `${maya.gestational_weeks} wks`,
    trimester: maya.trimester,
    context: maya.condition,
    status: demoData.pattern_status.status,
    summary: demoData.pattern_status.signals.filter((s) => s.contributing).map((s) => `${s.label} ${s.note.toLowerCase()}`),
    freshness: `Data as of ${demoData.latest_measurements.glucose.updated}`,
  },
];

export const statusLabel: Record<PatternStatus, string> = {
  normal: "Normal",
  watch: "Watch",
  change_to_review: "Change to review",
  insufficient_data: "Insufficient data",
};

export const getPatients = (): PatientSummary[] => patients;
export const getPatient = (id: string) => patients.find((p) => p.id === id);

export function searchPatients(list: PatientSummary[], query: string): PatientSummary[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return list;
  return list.filter((p) => {
    const hay = [p.name, p.gestationalAge, p.trimester, p.context, statusLabel[p.status], ...p.summary, "pregnant"].join(" ").toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
