import { ArrowDown, Baby, Droplet, Pill, Stethoscope } from "lucide-react";
import type { DemoData } from "@/data/demoData";
import { cn } from "@/lib/utils";
import { CoverageTag, DirectionGlyph, Sparkline } from "./primitives";
import { SectionHeading } from "./AppShell";

export function PatientHeader({ patient }: { patient: DemoData["patient"] }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6 animate-rise">
      <div>
        <div className="mb-3 inline-flex items-center rounded-md border border-hairline px-2 py-0.5 text-[11.5px] text-muted-foreground">
          Synthetic demo patient
        </div>
        <h1 className="text-[40px] font-semibold leading-none tracking-[-0.035em]">{patient.name}</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {patient.gestational_weeks} weeks pregnant <span className="text-subtle">•</span> {patient.trimester}{" "}
          <span className="text-subtle">•</span> {patient.condition}
        </p>
      </div>
      <dl className="flex gap-10 text-[13px]">
        <div>
          <dt className="text-muted-foreground">Last GLP-1 dose</dt>
          <dd className="num mt-1 font-medium">{patient.last_glp1_dose}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Current treatment</dt>
          <dd className="mt-1 max-w-[260px] font-medium">{patient.current_treatment}</dd>
        </div>
      </dl>
    </header>
  );
}

export function StatusSummary({ status }: { status: DemoData["pattern_status"] }) {
  return (
    <section
      aria-label="Current Nestwatch status"
      className="relative overflow-hidden rounded-[22px] border border-watch/25 bg-watch-soft p-7 animate-rise sm:p-9"
    >
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-watch opacity-40 motion-safe:animate-ping [animation-duration:2.4s]" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-watch" />
            </span>
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-watch-ink">Watch</span>
            <span className="text-[13px] text-watch-ink/70">· Multisignal status</span>
          </div>
          <h2 className="mt-5 max-w-[30ch] text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] sm:text-[28px]">
            {status.headline}
          </h2>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">{status.summary}</p>
          <a
            href="#what-changed"
            className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-watch-ink transition-opacity hover:opacity-75"
          >
            View what changed <ArrowDown className="h-3.5 w-3.5" />
          </a>
        </div>
        <ul className="divide-y divide-watch/15 self-center">
          {status.signals.map((s) => (
            <li key={s.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-[15px] font-medium">{s.label}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[13px]",
                  s.contributing ? "font-medium text-watch-ink" : "text-muted-foreground",
                )}
              >
                {s.note}
                <span className="sr-only">{s.contributing ? "(contributing)" : "(context)"}</span>
                <span
                  aria-hidden
                  className={cn("rounded px-1.5 py-px text-[10.5px] uppercase tracking-wider", s.contributing ? "bg-watch/15" : "bg-foreground/5")}
                >
                  {s.contributing ? "Contributing" : "Context"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const metricOrder = [
  { key: "glucose", label: "Glucose", color: "var(--c-glucose)", series: "glucose" },
  { key: "bp", label: "Blood pressure", color: "var(--c-sys)", series: null },
  { key: "resting_hr", label: "Resting HR", color: "var(--c-hr)", series: "resting_hr" },
  { key: "hrv", label: "HRV", color: "var(--c-hrv)", series: "hrv" },
  { key: "sleep", label: "Sleep", color: "var(--c-sleep)", series: "sleep" },
  { key: "weight", label: "Weight", color: "var(--c-weight)", series: null },
] as const;

export function CurrentMetrics({ data }: { data: DemoData }) {
  return (
    <section className="mt-12">
      <SectionHeading title="Current measurements" subtitle={`Latest available values · as of Oct 10, 2026`} />
      <div className="surface grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-6">
        {metricOrder.map((m, i) => {
          const v = data.latest_measurements[m.key];
          const contributing = m.key === "glucose" || m.key === "resting_hr";
          const limited = v.direction === "unknown";
          const s = m.series ? data.series[m.series] : m.key === "bp" ? data.series.bp.map((p) => ({ date: p.date, value: p.sys })) : null;
          return (
            <div
              key={m.key}
              className={cn(
                "flex flex-col justify-between gap-4 border-hairline p-5 transition-colors duration-200 hover:bg-background/60",
                i % 2 === 0 && "border-r md:border-r-0",
                "border-b xl:border-b-0",
                "md:[&:not(:nth-child(3n))]:border-r xl:[&:not(:last-child)]:border-r",
              )}
            >
              <div>
                <div className="text-[13px] text-muted-foreground">{m.label}</div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                  <span className={cn("num whitespace-nowrap text-[28px] font-semibold leading-none", limited && "text-muted-foreground")}>{v.value}</span>
                  <span className="text-[12px] text-muted-foreground">{v.unit}</span>
                </div>
                <div className={cn("mt-2 flex items-center gap-1 text-[12.5px]", contributing ? "text-watch-ink" : "text-muted-foreground")}>
                  {v.context}
                </div>
              </div>
              {s && !limited ? <Sparkline data={s} color={m.color} height={28} /> : <div className="h-7 rounded-md border border-dashed border-border" aria-hidden />}
              <div className="text-[11px] text-subtle">
                {v.source} · {v.updated}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ObservedChangeSection({ data }: { data: DemoData }) {
  const oc = data.observed_change;
  const seriesFor = (key: string) =>
    key === "bp"
      ? data.series.bp.map((p) => ({ date: p.date, value: p.sys }))
      : (data.series as unknown as Record<string, { date: string; value: number | null }[]>)[key];
  const color: Record<string, string> = {
    glucose: "var(--c-glucose)",
    resting_hr: "var(--c-hr)",
    bp: "var(--c-sys)",
    hrv: "var(--c-hrv)",
    temperature: "var(--c-weight)",
    weight: "var(--c-weight)",
  };
  return (
    <section className="mt-14">
      <SectionHeading id="what-changed" title="What changed" subtitle="Reference period compared with recent measurements" />
      <div className="surface overflow-hidden">
        <div className="hidden grid-cols-[1.1fr_1.6fr_1fr_1.2fr] gap-6 border-b border-hairline px-6 py-3 text-[12px] text-muted-foreground md:grid">
          <div>Metric</div>
          <div>
            Reference <span className="text-subtle">{oc.reference_period}</span> → Recent{" "}
            <span className="text-subtle">{oc.recent_period}</span>
          </div>
          <div>Change</div>
          <div>30-day shape</div>
        </div>
        <ul>
          {oc.rows.map((r) => {
            const s = seriesFor(r.key);
            const hasData = r.reference != null;
            return (
              <li
                key={r.key}
                className="grid grid-cols-2 items-center gap-x-6 gap-y-3 border-b border-hairline px-6 py-5 last:border-b-0 md:grid-cols-[1.1fr_1.6fr_1fr_1.2fr]"
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn("h-6 w-[3px] rounded-full", r.contributing ? "bg-watch" : "bg-border")} aria-hidden />
                  <div>
                    <div className="text-[15px] font-medium">{r.label}</div>
                    <div className="text-[11.5px] text-subtle">{r.contributing ? "Contributing" : "Context"}</div>
                  </div>
                </div>
                <div className="num text-[17px]">
                  {hasData ? (
                    <>
                      <span className="text-muted-foreground">{r.reference}</span>
                      <span className="mx-2 text-subtle">→</span>
                      <span className="font-semibold">{r.recent}</span>
                      <span className="ml-1.5 text-[12px] text-muted-foreground">{r.unit}</span>
                    </>
                  ) : (
                    <span className="text-[14px] text-muted-foreground">Unavailable</span>
                  )}
                </div>
                <div className={cn("flex items-center gap-1.5 text-[14px]", r.contributing ? "font-medium text-watch-ink" : "text-muted-foreground")}>
                  <DirectionGlyph direction={r.direction} tone={r.contributing ? "watch" : "muted"} />
                  {r.change}
                </div>
                <div>{hasData && s ? <Sparkline data={s} color={color[r.key] ?? "var(--c-weight)"} height={30} /> : <span className="text-[12px] text-subtle">Limited samples</span>}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function MultisignalExplanation({ status }: { status: DemoData["pattern_status"] }) {
  return (
    <section className="mt-14">
      <SectionHeading title="Why Nestwatch is watching" subtitle="Nestwatch considers several changes together rather than relying on a single measurement threshold." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="surface p-6">
          <div className="eyebrow flex items-center gap-2 !text-watch-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-watch" /> Contributing
          </div>
          <ul className="mt-5 space-y-5">
            {status.contributing.map((c) => (
              <li key={c.label}>
                <div className="text-[15px] font-medium">{c.label}</div>
                <p className="mt-1 text-[14px] text-muted-foreground">{c.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="surface p-6">
          <div className="eyebrow flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-stable" /> Context / Stable
          </div>
          <ul className="mt-5 space-y-5">
            {status.context.map((c) => (
              <li key={c.label}>
                <div className="text-[15px] font-medium">{c.label}</div>
                <p className="mt-1 text-[14px] text-muted-foreground">{c.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 rounded-[18px] border border-hairline bg-muted/60 px-6 py-5">
        <div className="eyebrow">Current interpretation</div>
        <p className="mt-2 max-w-[75ch] text-[15px] leading-relaxed">{status.interpretation}</p>
      </div>
    </section>
  );
}

export function PatientContext({ patient }: { patient: DemoData["patient"] }) {
  const items = [
    { icon: Baby, label: "Pregnancy", value: `${patient.gestational_weeks} weeks`, sub: patient.trimester },
    { icon: Droplet, label: "Diabetes", value: "Type 2", sub: `Since ${patient.diabetes_since}` },
    { icon: Pill, label: "Medication transition", value: `Last GLP-1: ${patient.last_glp1_dose}`, sub: `Transition: ${patient.transition_date}` },
    { icon: Stethoscope, label: "Current treatment", value: patient.current_treatment, sub: null },
  ];
  return (
    <div className="surface p-6">
      <h3 className="text-[16px] font-semibold tracking-tight">Patient context</h3>
      <ul className="mt-5 space-y-5">
        {items.map(({ icon: Icon, label, value, sub }) => (
          <li key={label} className="flex gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" strokeWidth={1.75} />
            <div>
              <div className="text-[12px] text-muted-foreground">{label}</div>
              <div className="text-[14px] font-medium">{value}</div>
              {sub && <div className="text-[12.5px] text-muted-foreground">{sub}</div>}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 border-t border-hairline pt-5">
        <div className="text-[12px] text-muted-foreground">Recent symptoms</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {patient.symptoms.map((s) => (
            <span key={s.label} className="rounded-lg bg-muted px-2.5 py-1 text-[13px]">
              {s.label} <span className="text-subtle">· {s.date}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DataQuality({ items }: { items: DemoData["data_quality"] }) {
  return (
    <div className="surface p-6">
      <h3 className="text-[16px] font-semibold tracking-tight">Data coverage</h3>
      <ul className="mt-4 divide-y divide-hairline">
        {items.map((d) => (
          <li key={d.metric} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <div className="text-[14px]">{d.metric}</div>
              {d.status !== "available" && <div className="text-[12px] text-muted-foreground">{d.note}</div>}
            </div>
            <CoverageTag status={d.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
