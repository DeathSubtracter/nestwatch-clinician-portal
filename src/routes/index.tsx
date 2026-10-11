import { createFileRoute } from "@tanstack/react-router";
import { getDashboard } from "@/data/demoData";
import {
  CurrentMetrics,
  DataQuality,
  MultisignalExplanation,
  ObservedChangeSection,
  PatientContext,
  PatientHeader,
  StatusSummary,
} from "@/components/nestwatch/overview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Nestwatch" },
      { name: "description", content: "Multisignal maternal-health overview for Maya: current status, what changed, and patient context." },
      { property: "og:title", content: "Overview — Nestwatch" },
      { property: "og:description", content: "Clinician overview combining glucose, blood pressure, wearable and pregnancy context." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const data = getDashboard();
  return (
    <>
      <PatientHeader patient={data.patient} />
      <StatusSummary status={data.pattern_status} />
      <CurrentMetrics data={data} />
      <div className="grid gap-x-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <ObservedChangeSection data={data} />
          <MultisignalExplanation status={data.pattern_status} />
        </div>
        <aside className="mt-14 space-y-4 lg:pt-[60px]">
          <PatientContext patient={data.patient} />
          <DataQuality items={data.data_quality} />
        </aside>
      </div>
    </>
  );
}
