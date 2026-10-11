import { useDashboard } from "@/data/dashboardContext";
import { createFileRoute } from "@tanstack/react-router";

import {
  CurrentMetrics,
  DataQuality,
  MultisignalExplanation,
  ObservedChangeSection,
  PatientContext,
  PatientHeader,
  StatusSummary,
} from "@/components/nestwatch/overview";

export const Route = createFileRoute("/patients/$patientId/")({
  head: () => ({
    meta: [
      { title: "Overview — Nestwatch" },
      {
        name: "description",
        content:
          "Multisignal maternal-health overview for Maya: current status, what changed, and patient context.",
      },
      { property: "og:title", content: "Overview — Nestwatch" },
      {
        property: "og:description",
        content:
          "Clinician overview combining glucose, blood pressure, wearable and pregnancy context.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const data = useDashboard();
  return (
    <>
      <PatientHeader patient={data.patient} />
      <StatusSummary status={data.pattern_status} />
      <CurrentMetrics data={data} />
      <ObservedChangeSection data={data} />
      <MultisignalExplanation status={data.pattern_status} />
      <PatientContext patient={data.patient} />
      <DataQuality items={data.data_quality} status={data.data_quality_status} />
    </>
  );
}
