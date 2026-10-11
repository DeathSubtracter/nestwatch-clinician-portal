/** The directory is derived from the single exported dashboard's patient object. */
import { formatTimestamp, statusLabel, type DemoData, type PatternStatus } from "./demoData";
export { statusLabel };
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
export const getPatients = (data: DemoData | undefined): PatientSummary[] =>
  data
    ? [
        {
          id: data.patient.id,
          name: data.patient.name,
          gestationalAge: data.patient.gestational_age,
          gestationalShort: data.patient.gestational_age,
          trimester: data.patient.trimester,
          context: data.patient.condition,
          status: data.pattern_status.status,
          summary: [data.pattern_status.headline],
          freshness: `Data as of ${formatTimestamp(data.as_of)}`,
        },
      ]
    : [];
export const getPatient = (data: DemoData | undefined, id: string) =>
  getPatients(data).find((p) => p.id === id);
export function searchPatients(list: PatientSummary[], query: string): PatientSummary[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return list;
  return list.filter((p) => {
    const hay = [
      p.name,
      p.gestationalAge,
      p.trimester,
      p.context,
      statusLabel[p.status],
      ...p.summary,
      "pregnant",
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
