import { useDashboard } from "@/data/dashboardContext";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Baby, Moon, Pill, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/nestwatch/AppShell";
import { SegmentedControl } from "@/components/nestwatch/primitives";
import { filterTimeline } from "@/data/demoData";

export const Route = createFileRoute("/patients/$patientId/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Nestwatch" },
      {
        name: "description",
        content:
          "Unified timeline of measurements, sleep, symptoms, medication and pregnancy context for Maya.",
      },
      { property: "og:title", content: "Timeline — Nestwatch" },
      {
        property: "og:description",
        content:
          "Fragmented maternal-health information brought together in one longitudinal view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Timeline,
});

type Filter = "all" | "measurement" | "symptom" | "medication" | "sleep";
const icons = {
  measurement: Activity,
  sleep: Moon,
  symptom: MessageCircle,
  medication: Pill,
  pregnancy: Baby,
  context: Activity,
};
const catLabel = {
  measurement: "Measurement",
  sleep: "Sleep",
  symptom: "Symptom",
  medication: "Medication",
  pregnancy: "Pregnancy context",
  context: "Context",
};

export function Timeline() {
  const data = useDashboard();
  const { timeline } = data;
  const [filter, setFilter] = useState<Filter>("all");
  const [visibleCount, setVisibleCount] = useState(100);
  const filtered = filterTimeline(timeline, filter);
  const events = filtered.slice(0, visibleCount);
  return (
    <>
      <PageHeader
        eyebrow={`${data.patient.name} · ${data.timeline_window} · UTC`}
        title="Timeline"
        subtitle="Measurements, symptoms, medication and pregnancy context in one place."
      />
      <SegmentedControl
        label="Filter events"
        value={filter}
        onChange={(next) => {
          setFilter(next);
          setVisibleCount(100);
        }}
        options={[
          { value: "all", label: "All" },
          { value: "measurement", label: "Measurements" },
          { value: "symptom", label: "Symptoms" },
          { value: "medication", label: "Medication" },
          { value: "sleep", label: "Sleep" },
        ]}
      />
      <ol className="surface mt-6 max-w-[820px] px-6 py-4 sm:px-8">
        {events.map((e, i) => {
          const Icon = icons[e.category];
          return (
            <li
              key={e.id}
              className="relative grid grid-cols-[56px_24px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[72px_32px_minmax(0,1fr)] sm:gap-4 animate-rise"
              style={{ animationDelay: `${Math.min(i, 9) * 30}ms` }}
            >
              <div className="pt-1 text-right">
                <div className="num text-[14px] font-medium">{e.date}</div>
                <div className="num text-[12px] text-subtle">{e.time}</div>
              </div>
              <div className="relative flex justify-center">
                {i < events.length - 1 && (
                  <span className="absolute top-9 -bottom-5 w-px bg-hairline" aria-hidden />
                )}
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-background">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                </span>
              </div>
              <div className="pt-0.5">
                <div className="text-[11.5px] text-subtle">{catLabel[e.category]}</div>
                <div className="text-[15px] font-medium">{e.title}</div>
                <p className="mt-0.5 text-[14px] text-muted-foreground">{e.description}</p>
              </div>
            </li>
          );
        })}
        {!events.length && (
          <li className="py-10 text-center text-[14px] text-muted-foreground">
            No events in this category.
          </li>
        )}
      </ol>
      {filtered.length > visibleCount && (
        <button
          className="mt-4 rounded-lg border border-hairline bg-surface px-4 py-2 text-[14px]"
          onClick={() => setVisibleCount((count) => count + 100)}
        >
          Show more events ({events.length} of {filtered.length})
        </button>
      )}
    </>
  );
}
