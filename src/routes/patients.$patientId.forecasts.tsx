import { useDashboard } from "@/data/dashboardContext";
import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, SectionHeading } from "@/components/nestwatch/AppShell";
import { ChartTooltip, axisProps } from "@/components/nestwatch/primitives";
import { type DemoData } from "@/data/demoData";

export const Route = createFileRoute("/patients/$patientId/forecasts")({
  head: () => ({
    meta: [
      { title: "Forecasts — Nestwatch" },
      {
        name: "description",
        content: "Prototype 24-hour glucose outlook and 7-day blood pressure outlook for Maya.",
      },
      { property: "og:title", content: "Forecasts — Nestwatch" },
      {
        property: "og:description",
        content: "Prototype forecasts on synthetic data, not clinically validated.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Forecasts,
});

const fmtTime = (t: number | string) =>
  new Date(Number(t)).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
const fmtTick = (t: number | string) =>
  new Date(Number(t)).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    timeZone: "UTC",
  });

export function GlucoseForecastChart({ fc }: { fc: DemoData["glucose_forecast"] }) {
  const pts = fc.points;
  const origin = pts[0]?.t;
  const end = pts.at(-1)?.t;
  const start = pts[0]?.t;
  if (origin == null || end == null || start == null) return <p>Glucose outlook unavailable.</p>;
  return (
    <section className="surface p-6 sm:p-8 animate-rise">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[21px] font-semibold tracking-tight">
            {fc.horizon_hours}-hour glucose outlook
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Forecast from the separate synthetic forecasting dataset.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px] text-muted-foreground">
          {[fc.horizon, fc.cadence, fc.flagsLabel].map((t) => (
            <span key={t} className="rounded-md bg-muted px-2 py-1">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6 flex gap-5 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-0 w-5 border-t-2 border-dashed border-glucose" /> Forecast
        </span>
        <span>
          Origin: {fc.origin} · {pts.length} points · UTC
        </span>
      </div>
      <div className="mt-4 h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={pts} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <ReferenceArea x1={origin} x2={end} fill="var(--primary-soft)" fillOpacity={0.55} />
            <CartesianGrid vertical={false} stroke="var(--hairline)" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={fmtTick}
              ticks={Array.from({ length: 5 }, (_, i) => start + (i * (end - start)) / 4)}
              minTickGap={32}
              {...axisProps}
            />
            <YAxis domain={[70, 200]} width={48} {...axisProps} />
            <ReferenceLine
              x={origin}
              stroke="var(--subtle)"
              strokeDasharray="2 4"
              label={{
                value: "Forecast origin",
                position: "insideTopLeft",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              content={<ChartTooltip format={fmtTime} unit={fc.unit} />}
            />
            <Line
              name="Forecast"
              dataKey="forecast"
              stroke="var(--c-glucose)"
              strokeOpacity={0.75}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function BPForecastCard({ fc }: { fc: DemoData["bp_forecast"] }) {
  const pct = fc.probabilityPercent == null ? null : Number(fc.probabilityPercent.toFixed(4));
  return (
    <section className="mt-8">
      <SectionHeading
        title={`${fc.horizon_days}-day blood pressure outlook`}
        subtitle="Whether a future BP measurement may meet the configured review event definition."
      />
      <div className="surface grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="text-[13px] text-muted-foreground">
            Estimated likelihood of a BP review event within the next {fc.horizon_days} days
          </div>
          {pct == null ? (
            <div className="mt-4 text-[20px] text-muted-foreground">Unavailable</div>
          ) : (
            <>
              <div className="num mt-3 text-[56px] font-semibold leading-none tracking-[-0.04em]">
                {pct}
                <span className="text-[24px] text-muted-foreground">%</span>
              </div>
              <div
                className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`${pct} percent`}
              >
                <div
                  className="h-full rounded-full bg-sys transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          )}
          <span className="mt-5 inline-block rounded-md bg-muted px-2 py-1 text-[12px] text-muted-foreground">
            {fc.flagsLabel}
          </span>
          <p className="mt-3 text-[12px] text-subtle">
            {fc.status} · Origin: {fc.origin}
          </p>
          <p className="mt-3 text-[13px] text-muted-foreground">{fc.event_definition}</p>
          <p className="mt-2 text-[12px] text-subtle">Window ends: {fc.event_window_end}</p>
          {fc.reasons && <p className="mt-2 text-[12px] text-subtle">{fc.reasons}</p>}
        </div>
        <div>
          <div className="text-[13px] text-muted-foreground">Main contributing model features</div>
          <ul className="mt-3 divide-y divide-hairline">
            {fc.features.map((f) => (
              <li key={f.label} className="flex justify-between py-3 text-[14px]">
                <span>{f.label}</span>
                <span className="num font-medium">{f.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-subtle">
            Inputs describe what the model uses; they do not imply causation.
          </p>
        </div>
      </div>
    </section>
  );
}

function Forecasts() {
  const data = useDashboard();
  return (
    <>
      <PageHeader
        eyebrow={data.patient.name}
        title="Forecasts"
        subtitle={<span className="text-[13px]">{data.flagsLabel}</span>}
      />
      <GlucoseForecastChart fc={data.glucose_forecast} />
      <BPForecastCard fc={data.bp_forecast} />
    </>
  );
}
