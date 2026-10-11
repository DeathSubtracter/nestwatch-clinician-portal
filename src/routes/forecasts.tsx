import { createFileRoute } from "@tanstack/react-router";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, SectionHeading } from "@/components/nestwatch/AppShell";
import { ChartTooltip, axisProps } from "@/components/nestwatch/primitives";
import { getDashboard, type DemoData } from "@/data/demoData";

export const Route = createFileRoute("/forecasts")({
  head: () => ({
    meta: [
      { title: "Forecasts — Nestwatch" },
      { name: "description", content: "Prototype 24-hour glucose outlook and 7-day blood pressure outlook for Maya." },
      { property: "og:title", content: "Forecasts — Nestwatch" },
      { property: "og:description", content: "Prototype forecasts on synthetic data, not clinically validated." },
    ],
  }),
  component: Forecasts,
});

const fmtTime = (t: number | string) =>
  new Date(Number(t)).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const fmtTick = (t: number | string) =>
  new Date(Number(t)).toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" });

function GlucoseForecastChart({ fc }: { fc: DemoData["glucose_forecast"] }) {
  const pts = fc.points.map((p) => ({ ...p, band: p.lower != null && p.upper != null ? [p.lower, p.upper] : null }));
  const now = pts[287].t;
  const end = pts.at(-1)!.t;
  return (
    <section className="surface p-6 sm:p-8 animate-rise">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[21px] font-semibold tracking-tight">24-hour glucose outlook</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">Recent observed glucose with the next 24 hours projected.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px] text-muted-foreground">
          {[fc.horizon, fc.cadence, "Prototype forecast"].map((t) => (
            <span key={t} className="rounded-md bg-muted px-2 py-1">{t}</span>
          ))}
        </div>
      </div>
      <div className="mt-6 flex gap-5 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-glucose" /> Observed</span>
        <span className="flex items-center gap-2"><span className="h-0 w-5 border-t-2 border-dashed border-glucose" /> Forecast</span>
        <span className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm bg-glucose/15" /> Forecast range</span>
      </div>
      <div className="mt-4 h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={pts} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <ReferenceArea x1={now} x2={end} fill="var(--primary-soft)" fillOpacity={0.55} />
            <CartesianGrid vertical={false} stroke="var(--hairline)" />
            <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={fmtTick} tickCount={9} {...axisProps} />
            <YAxis domain={[70, 200]} width={48} {...axisProps} />
            <ReferenceLine x={now} stroke="var(--subtle)" strokeDasharray="2 4" label={{ value: "Now", position: "insideTopLeft", fill: "var(--muted-foreground)", fontSize: 11 }} />
            <Tooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltip format={fmtTime} unit="mg/dL" />} />
            <Area dataKey="band" stroke="none" fill="var(--c-glucose)" fillOpacity={0.12} isAnimationActive={false} />
            <Line name="Observed" dataKey="observed" stroke="var(--c-glucose)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
            <Line name="Forecast" dataKey="forecast" stroke="var(--c-glucose)" strokeOpacity={0.75} strokeWidth={1.75} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function BPForecastCard({ fc }: { fc: DemoData["bp_forecast"] }) {
  const pct = fc.probability == null ? null : Math.round(fc.probability * 100);
  return (
    <section className="mt-12">
      <SectionHeading title="7-day blood pressure outlook" subtitle="Whether a future BP measurement may meet the configured review event definition." />
      <div className="surface grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="text-[13px] text-muted-foreground">Estimated likelihood of a BP review event within the next {fc.horizon_days} days</div>
          {pct == null ? (
            <div className="mt-4 text-[20px] text-muted-foreground">Unavailable</div>
          ) : (
            <>
              <div className="num mt-3 text-[56px] font-semibold leading-none tracking-[-0.04em]">
                {pct}
                <span className="text-[24px] text-muted-foreground">%</span>
              </div>
              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pct} percent`}>
                <div className="h-full rounded-full bg-sys transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </div>
            </>
          )}
          <span className="mt-5 inline-block rounded-md bg-muted px-2 py-1 text-[12px] text-muted-foreground">Prototype forecast</span>
        </div>
        <div>
          <div className="text-[13px] text-muted-foreground">Inputs considered</div>
          <ul className="mt-3 divide-y divide-hairline">
            {fc.features.map((f) => (
              <li key={f.label} className="flex justify-between py-3 text-[14px]">
                <span>{f.label}</span>
                <span className="num font-medium">{f.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-subtle">Inputs describe what the model uses; they do not imply causation.</p>
        </div>
      </div>
    </section>
  );
}

function Forecasts() {
  const data = getDashboard();
  return (
    <>
      <PageHeader
        eyebrow="Maya"
        title="Forecasts"
        subtitle={<span className="text-[13px]">Prototype forecasts • Synthetic data • Not clinically validated</span>}
      />
      <GlucoseForecastChart fc={data.glucose_forecast} />
      <BPForecastCard fc={data.bp_forecast} />
    </>
  );
}
