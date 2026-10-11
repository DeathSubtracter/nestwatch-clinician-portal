import { ArrowDown, Baby, Droplet, Pill, Stethoscope } from "lucide-react";
import { formatTimestamp, statusLabel, type DemoData, type DailyPoint } from "@/data/demoData";
import { cn } from "@/lib/utils";
import { CoverageTag, DirectionGlyph, Sparkline } from "./primitives";
import { SectionHeading } from "./AppShell";
import { Button } from "@/components/ui/button";

export function PatientHeader({ patient }: { patient: DemoData["patient"] }) {
  return (
    <header className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-center animate-rise">
      <div className="min-w-0">
        <div className="mb-2 inline-flex items-center rounded-md border border-hairline px-2 py-0.5 text-[11.5px] text-muted-foreground">
          {patient.synthetic ? "Synthetic demo patient" : "Patient"}
        </div>
        <h1 className="text-[40px] font-semibold leading-none tracking-[-0.035em]">
          {patient.name}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {patient.gestational_age} pregnant <span className="text-subtle">•</span>{" "}
          {patient.trimester} <span className="text-subtle">•</span> {patient.condition}
        </p>
      </div>
      <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5 text-[13px]">
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
      className="relative overflow-hidden rounded-[22px] border border-watch/25 bg-watch-soft p-5 animate-rise sm:p-6 lg:px-7 lg:py-6"
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-watch opacity-40 motion-safe:animate-ping [animation-duration:2.4s]" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-watch" />
            </span>
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-watch-ink">
              {statusLabel[status.status]}
            </span>
            <span className="text-[13px] text-watch-ink/70">· Multisignal status</span>
          </div>
          <h2 className="mt-3 max-w-[30ch] text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] sm:text-[28px]">
            {status.headline}
          </h2>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
            {status.summary}
          </p>
          <Button
            variant="ghost"
            onClick={() =>
              document.getElementById("what-changed")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
                block: "start",
              })
            }
            className="mt-3 h-8 justify-start gap-1.5 px-0 text-[14px] font-medium text-watch-ink hover:bg-transparent hover:opacity-75"
          >
            View what changed <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ul className="divide-y divide-watch/15 self-center">
          {status.signals.map((s) => (
            <li
              key={s.label}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-[15px] font-medium">{s.label}</span>
              <span
                className={cn(
                  "flex flex-wrap items-center justify-end gap-1.5 text-[12px]",
                  s.contributing ? "font-medium text-watch-ink" : "text-muted-foreground",
                )}
              >
                {s.note}
                <span className="sr-only">{s.contributing ? "(contributing)" : "(context)"}</span>
                <span
                  aria-hidden
                  className={cn(
                    "rounded px-1.5 py-px text-[10.5px] uppercase tracking-wider",
                    s.contributing ? "bg-watch/15" : "bg-foreground/5",
                  )}
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
    <section className="mt-7">
      <SectionHeading
        title="Current measurements"
        subtitle={`Latest available values · as of ${formatTimestamp(data.as_of)}`}
      />
      <div className="surface grid grid-cols-1 overflow-hidden sm:grid-cols-2 xl:grid-cols-3">
        {metricOrder.map((m, i) => {
          const v = data.latest_measurements[m.key];
          const contributing = v.contributing;
          const limited = v.status !== "available";
          const s = m.series
            ? data.series[m.series]
            : m.key === "bp"
              ? data.series.bp.map((p) => ({ date: p.date, t: p.t, value: p.sys }))
              : null;
          return (
            <div
              key={m.key}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_88px] items-center gap-x-4 gap-y-2 border-hairline px-5 py-4 transition-colors duration-200 hover:bg-background/60",
                i < 5 && "border-b",
                "sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r xl:[&:nth-child(odd)]:border-r-0 xl:[&:not(:nth-child(3n))]:border-r xl:[&:nth-last-child(-n+3)]:border-b-0",
              )}
            >
              <div>
                <div className="text-[13px] text-muted-foreground">{m.label}</div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                  <span
                    className={cn(
                      "num text-[28px] font-semibold leading-none",
                      limited && "text-muted-foreground",
                    )}
                  >
                    {v.value}
                  </span>
                  <span className="text-[12px] text-muted-foreground">{v.unit}</span>
                </div>
                <div
                  className={cn(
                    "mt-2 flex items-center gap-1 text-[12.5px]",
                    contributing ? "text-watch-ink" : "text-muted-foreground",
                  )}
                >
                  <CoverageTag status={v.status} />
                </div>
              </div>
              {s && !limited ? (
                <Sparkline data={s} color={m.color} height={28} />
              ) : (
                <div className="h-7 rounded-md border border-dashed border-border" aria-hidden />
              )}
              <div className="col-span-2 text-[11px] text-subtle">
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
      ? data.series.bp.map((p) => ({ date: p.date, t: p.t, value: p.sys }))
      : (data.series as unknown as Record<string, DailyPoint[]>)[key];
  const color: Record<string, string> = {
    glucose: "var(--c-glucose)",
    resting_hr: "var(--c-hr)",
    bp: "var(--c-sys)",
    hrv: "var(--c-hrv)",
    temperature: "var(--c-weight)",
    weight: "var(--c-weight)",
  };
  return (
    <section className="mt-8">
      <SectionHeading
        id="what-changed"
        title="What changed"
        subtitle={`Reference ${oc.reference_period} → Recent ${oc.recent_period} · UTC`}
      />
      <div className="surface overflow-hidden">
        <div className="hidden grid-cols-[1.1fr_2fr_1fr_1fr] gap-4 border-b border-hairline px-5 py-3 text-[12px] text-muted-foreground md:grid">
          <div>Metric</div>
          <div>
            Reference <span className="text-subtle">{oc.reference_period}</span> → Recent{" "}
            <span className="text-subtle">{oc.recent_period}</span>
          </div>
          <div>Change</div>
          <div>Returned measurements</div>
        </div>
        <ul>
          {oc.rows.map((r) => {
            const s = seriesFor(r.key);
            const hasData = r.reference != null && r.recent != null;
            return (
              <li
                key={r.key}
                className="grid grid-cols-2 items-center gap-x-4 gap-y-3 border-b border-hairline px-5 py-3.5 last:border-b-0 md:grid-cols-[1.1fr_2fr_1fr_1fr]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "h-6 w-[3px] rounded-full",
                      r.contributing ? "bg-watch" : "bg-border",
                    )}
                    aria-hidden
                  />
                  <div>
                    <div className="text-[15px] font-medium">{r.label}</div>
                    <div className="text-[11.5px] text-subtle">
                      {r.contributing ? "Contributing" : "Context"}
                    </div>
                    <div className="mt-1 text-[11px] text-subtle">{r.note}</div>
                  </div>
                </div>
                <div className="num min-w-0 text-[16px]">
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
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-[14px]",
                    r.contributing ? "font-medium text-watch-ink" : "text-muted-foreground",
                  )}
                >
                  <DirectionGlyph
                    direction={r.direction}
                    tone={r.contributing ? "watch" : "muted"}
                  />
                  {r.change}
                </div>
                <div>
                  {hasData && s ? (
                    <Sparkline data={s} color={color[r.key] ?? "var(--c-weight)"} height={30} />
                  ) : (
                    <span className="text-[12px] text-subtle">Limited samples</span>
                  )}
                </div>
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
    <section className="mt-8">
      <SectionHeading
        title={
          status.status === "watch"
            ? "Why Nestwatch is watching"
            : "Why Nestwatch assigned this status"
        }
        subtitle="Nestwatch considers several changes together rather than relying on a single measurement threshold."
      />
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
        <div className="grid md:grid-cols-2">
          <div className="border-b border-hairline p-5 md:border-r md:border-b-0">
            <div className="eyebrow flex items-center gap-2 !text-watch-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-watch" /> Contributing
            </div>
            <ul className="mt-3 space-y-3">
              {!status.contributing.length && (
                <li className="text-[14px] text-muted-foreground">
                  No signals meet the contributing criteria in this response.
                </li>
              )}
              {status.contributing.map((c) => (
                <li key={c.label}>
                  <div className="text-[15px] font-medium">{c.label}</div>
                  <p className="mt-1 text-[14px] text-muted-foreground">{c.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5">
            <div className="eyebrow flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-stable" /> Context / Non-contributing
            </div>
            <ul className="mt-3 space-y-3">
              {status.context.map((c) => (
                <li key={c.label}>
                  <div className="text-[15px] font-medium">{c.label}</div>
                  <p className="mt-1 text-[14px] text-muted-foreground">{c.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-hairline bg-muted/60 px-5 py-4">
          <div className="eyebrow">Current interpretation</div>
          <p className="mt-2 max-w-[75ch] text-[15px] leading-relaxed">{status.interpretation}</p>
          <p className="mt-2 text-[12px] text-subtle">{status.flagsLabel}</p>
        </div>
      </div>
    </section>
  );
}

export function PatientContext({ patient }: { patient: DemoData["patient"] }) {
  const items = [
    { icon: Baby, label: "Pregnancy", value: patient.gestational_age, sub: patient.trimester },
    {
      icon: Droplet,
      label: "Diabetes",
      value: patient.condition.replace(" diabetes", ""),
      sub: `Since ${patient.diabetes_since} · ${patient.diabetes_context}`,
    },
    {
      icon: Pill,
      label: "Medication transition",
      value: `Last GLP-1: ${patient.last_glp1_dose}`,
      sub: `Transition: ${patient.transition_date}`,
    },
    { icon: Stethoscope, label: "Current treatment", value: patient.current_treatment, sub: null },
  ];
  return (
    <section className="mt-8 border-t border-hairline pt-5" aria-label="Patient context">
      <h3 className="text-[16px] font-semibold tracking-tight">Patient context</h3>
      <ul className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_1.5fr]">
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
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-3">
        <div className="text-[12px] text-muted-foreground">Recent symptoms</div>
        <div className="flex flex-wrap gap-2">
          {patient.symptoms.map((s) => (
            <span key={s.label} className="rounded-lg bg-muted px-2.5 py-1 text-[13px]">
              {s.label} <span className="text-subtle">· {s.date}</span>
            </span>
          ))}
          {!patient.symptoms.length && (
            <span className="text-[13px] text-muted-foreground">Unavailable</span>
          )}
        </div>
      </div>
    </section>
  );
}

export function DataQuality({
  items,
  status,
}: {
  items: DemoData["data_quality"];
  status: string;
}) {
  return (
    <section className="mt-6 border-t border-hairline pt-4" aria-label="Data coverage">
      <h3 className="text-[14px] font-medium text-muted-foreground">Data coverage · {status}</h3>
      <ul className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-3 xl:grid-cols-5">
        {items.map((d) => (
          <li key={d.metric} className="flex min-w-0 flex-col gap-1">
            <div>
              <div className="text-[14px]">{d.metric}</div>
              {d.status !== "available" && (
                <div className="text-[12px] text-muted-foreground">{d.note}</div>
              )}
            </div>
            <CoverageTag status={d.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
