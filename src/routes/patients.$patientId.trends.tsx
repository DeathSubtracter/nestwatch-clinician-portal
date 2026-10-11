import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/nestwatch/AppShell";
import { ChartTooltip, SegmentedControl, axisProps, fmtDay } from "@/components/nestwatch/primitives";
import { REFERENCE_SPLIT, getDashboard } from "@/data/demoData";

export const Route = createFileRoute("/patients/$patientId/trends")({
  head: () => ({
    meta: [
      { title: "Trends — Nestwatch" },
      { name: "description", content: "Longitudinal glucose, blood pressure, heart rate, HRV, sleep and weight trends for Maya." },
      { property: "og:title", content: "Trends — Nestwatch" },
      { property: "og:description", content: "Inspect 30-day longitudinal measurements against the reference period." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trends,
});

type Metric = "glucose" | "bp" | "resting_hr" | "hrv" | "sleep" | "weight";
const meta: Record<Metric, { label: string; unit: string; color: string; note: string }> = {
  glucose: { label: "Glucose", unit: "mg/dL", color: "var(--c-glucose)", note: "Daily mean from continuous monitoring. Recent levels are higher than the reference period." },
  bp: { label: "Blood pressure", unit: "mmHg", color: "var(--c-sys)", note: "Systolic and diastolic home readings. Only a modest recent shift." },
  resting_hr: { label: "Resting HR", unit: "bpm", color: "var(--c-hr)", note: "Overnight resting heart rate from wearable. Elevated ~6 bpm relative to baseline." },
  hrv: { label: "HRV", unit: "ms", color: "var(--c-hrv)", note: "Overnight SDNN. Approximately stable." },
  sleep: { label: "Sleep", unit: "h", color: "var(--c-sleep)", note: "Partial recent coverage — gaps are shown as missing, not zero." },
  weight: { label: "Weight", unit: "kg", color: "var(--c-weight)", note: "Limited samples — insufficient for a reliable trend comparison." },
};

function Trends() {
  const data = getDashboard(Route.useParams().patientId);
  const [metric, setMetric] = useState<Metric>("glucose");
  const m = meta[metric];
  const rows =
    metric === "bp"
      ? data.series.bp
      : data.series[metric].map((p) => ({ date: p.date, value: p.value }));
  const refStart = data.series.glucose[0]?.date;
  const refEnd = data.series.glucose[REFERENCE_SPLIT - 1]?.date;
  const recEnd = data.series.glucose.at(-1)?.date;
  if (!refStart || !refEnd || !recEnd) return <p>No measurements available.</p>;

  return (
    <>
      <PageHeader eyebrow="Maya · Last 30 days" title="Trends" subtitle="Longitudinal measurements compared with Maya's own reference period." />
      <SegmentedControl
        label="Metric"
        value={metric}
        onChange={setMetric}
        options={(Object.keys(meta) as Metric[]).map((k) => ({ value: k, label: meta[k].label }))}
      />
      <section className="surface mt-6 p-6 sm:p-8 animate-rise" key={metric}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[21px] font-semibold tracking-tight">{m.label}</h2>
            <p className="mt-1 max-w-[60ch] text-[14px] text-muted-foreground">{m.note}</p>
          </div>
          <div className="flex items-center gap-5 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm bg-muted" /> Reference</span>
            <span className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm bg-primary-soft" /> Recent</span>
            {metric === "bp" && (
              <>
                <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-sys" /> Systolic</span>
                <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-dia" /> Diastolic</span>
              </>
            )}
          </div>
        </div>
        <div className="mt-8 h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={m.color} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceArea x1={refStart} x2={refEnd} fill="var(--muted)" fillOpacity={0.7} />
              <ReferenceArea x1={refEnd} x2={recEnd} fill="var(--primary-soft)" fillOpacity={0.6} />
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={40} {...axisProps} />
              <YAxis domain={["auto", "auto"]} width={48} {...axisProps} />
              <Tooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltip format={fmtDay} unit={m.unit} />} />
              {metric === "bp" ? (
                <>
                  <Line name="Systolic" dataKey="sys" stroke="var(--c-sys)" strokeWidth={2} dot={false} type="monotone" activeDot={{ r: 4 }} />
                  <Line name="Diastolic" dataKey="dia" stroke="var(--c-dia)" strokeWidth={2} dot={false} type="monotone" activeDot={{ r: 4 }} />
                </>
              ) : (
                <Area
                  name={m.label}
                  dataKey="value"
                  type="monotone"
                  stroke={m.color}
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  dot={metric === "weight" ? { r: 4, fill: m.color, strokeWidth: 0 } : false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
