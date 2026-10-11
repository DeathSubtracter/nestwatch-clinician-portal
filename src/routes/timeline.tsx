import { createFileRoute } from "@tanstack/react-router";
import { Activity, Baby, Moon, Pill, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/nestwatch/AppShell";
import { SegmentedControl } from "@/components/nestwatch/primitives";
import { getDashboard } from "@/data/demoData";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Nestwatch" },
      { name: "description", content: "Unified timeline of measurements, sleep, symptoms, medication and pregnancy context for Maya." },
      { property: "og:title", content: "Timeline — Nestwatch" },
      { property: "og:description", content: "Fragmented maternal-health information brought together in one longitudinal view." },
    ],
  }),
  component: Timeline,
});

type Filter = "all" | "measurement" | "symptom" | "medication" | "sleep";
const icons = { measurement: Activity, sleep: Moon, symptom: MessageCircle, medication: Pill, pregnancy: Baby };
const catLabel = { measurement: "Measurement", sleep: "Sleep", symptom: "Symptom", medication: "Medication", pregnancy: "Pregnancy context" };

function Timeline() {
  const { timeline } = getDashboard();
  const [filter, setFilter] = useState<Filter>("all");
  const events = timeline.filter((e) => filter === "all" || e.category === filter);
  return (
    <>
      <PageHeader eyebrow="Maya · Sep 15 – Oct 10" title="Timeline" subtitle="Measurements, symptoms, medication and pregnancy context in one place." />
      <SegmentedControl
        label="Filter events"
        value={filter}
        onChange={setFilter}
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
            <li key={e.title} className="relative grid grid-cols-[72px_32px_1fr] gap-4 py-5 animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="pt-1 text-right">
                <div className="num text-[14px] font-medium">{e.date}</div>
                <div className="num text-[12px] text-subtle">{e.time}</div>
              </div>
              <div className="relative flex justify-center">
                {i < events.length - 1 && <span className="absolute top-9 -bottom-5 w-px bg-hairline" aria-hidden />}
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
        {!events.length && <li className="py-10 text-center text-[14px] text-muted-foreground">No events in this category.</li>}
      </ol>
    </>
  );
}
