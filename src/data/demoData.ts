/** Centralized adapter for the immutable FastAPI dashboard export. No fallback mock data. */
import {
  backendDashboardSchema,
  type BackendDashboard,
  type BackendMeasurement,
  type BackendComparison,
  type BackendTimelineEntry,
} from "./backendSchema";

export type PatternStatus = BackendDashboard["pattern_status"]["status"];
export type Coverage = "available" | "partial" | "insufficient" | "stale" | "missing";
export type Direction = "up" | "down" | "stable" | "unknown";
export interface DailyPoint {
  date: string;
  t: number;
  value: number | null;
}
export interface BPPoint {
  date: string;
  t: number;
  sys: number | null;
  dia: number | null;
}
export type Metric = "glucose" | "bp" | "resting_hr" | "hrv" | "sleep" | "weight";
export type TimelineCategory =
  "measurement" | "sleep" | "symptom" | "medication" | "pregnancy" | "context";
export interface TimelineEvent {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  category: TimelineCategory;
  title: string;
  description: string;
  origin: string;
}
export const statusLabel: Record<PatternStatus, string> = {
  normal: "Normal",
  watch: "Watch",
  change_to_review: "Change to review",
  insufficient_data: "Insufficient data",
};
export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
export const formatTimestamp = (value: string) =>
  `${formatDate(value)} ${new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })} UTC`;
export const formatWindow = (window: { start_date: string; end_date: string }) =>
  `${formatDate(window.start_date)} – ${formatDate(window.end_date)}`;
export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const signed = (value: number) => `${value > 0 ? "+" : ""}${formatNumber(value)}`;
const humanize = (value: string) => value.replaceAll("_", " ");
const units: Record<string, string> = {
  mg_dl: "mg/dL",
  celsius: "°C",
  mmHg: "mmHg",
  bpm: "bpm",
  ms: "ms",
  kg: "kg",
  h: "h",
  hours: "h",
  minutes: "min",
  seconds: "s",
};
export const displayUnit = (value: string | null) =>
  value ? (units[value] ?? humanize(value)) : "";
const metricKeys = {
  glucose: "blood_glucose",
  resting_hr: "resting_heart_rate",
  hrv: "heart_rate_variability_sdnn",
  weight: "weight",
  sleep: "sleep_duration",
  systolic: "blood_pressure_systolic",
  diastolic: "blood_pressure_diastolic",
  skin_temperature: "skin_temperature",
  body_temperature: "body_temperature",
} as const;
const metricNames: Record<string, string> = {
  blood_glucose: "Blood glucose",
  blood_pressure_systolic: "Systolic BP",
  blood_pressure_diastolic: "Diastolic BP",
  resting_heart_rate: "Resting HR",
  heart_rate_variability_sdnn: "HRV (SDNN)",
  pregnancy_stage: "Pregnancy context",
  diabetes_context: "Diabetes context",
  treatment_context: "Treatment context",
};
const metricName = (key: string) =>
  metricNames[key] ?? humanize(key).replace(/^./, (c) => c.toUpperCase());
const coverage = (status: string | undefined): Coverage =>
  status === "insufficient_data"
    ? "insufficient"
    : ["available", "partial", "stale", "missing"].includes(status ?? "")
      ? (status as Coverage)
      : "missing";
const coverageText: Record<Coverage, string> = {
  available: "Available",
  partial: "Partial coverage",
  stale: "Stale",
  missing: "Unavailable",
  insufficient: "Insufficient data",
};
const reasonText: Record<string, string> = {
  change_not_persistent_at_window_end: "Change is not persistent at the window end",
  below_directional_change_threshold: "Below the configured directional change threshold",
  context_only_not_used_for_escalation: "Context only; not used for escalation",
  changes_do_not_meet_concurrent_persistence_rule:
    "Changes do not meet the concurrent persistence rule",
  partial_signal_coverage_or_provenance: "Partial signal coverage or provenance",
};
const explainReasons = (values: string[]) =>
  values.map((r) => reasonText[r] ?? humanize(r)).join("; ");
const provenance = (value: {
  provider: string | null;
  source: string | null;
  device: string | null;
  device_type: string | null;
}) =>
  [
    ...new Set([value.provider, value.source, value.device, value.device_type].filter(Boolean)),
  ].join(" · ") || "Source unavailable";
export function flagsLabel(flags: { synthetic: boolean; prototype: boolean; validated: boolean }) {
  return [
    flags.prototype ? "Prototype" : null,
    flags.synthetic ? "Synthetic data" : null,
    flags.validated ? "Validated" : "Not clinically validated",
  ]
    .filter(Boolean)
    .join(" · ");
}
const comparisonDirection = (row: BackendComparison | undefined): Direction =>
  !row?.enough_data || row.absolute_change == null
    ? "unknown"
    : row.absolute_change > 0
      ? "up"
      : row.absolute_change < 0
        ? "down"
        : "stable";
const changeText = (row: BackendComparison) =>
  !row.enough_data
    ? "Insufficient data"
    : row.absolute_change == null
      ? "Unavailable"
      : `${signed(row.absolute_change)} ${displayUnit(row.unit)}${row.percent_change == null ? "" : ` (${signed(row.percent_change)}%)`}`;

export function timelineCategory(entry: BackendTimelineEntry): TimelineCategory {
  if (entry.kind === "symptom") return "symptom";
  if (entry.kind === "sleep" || entry.metric_type.startsWith("sleep")) return "sleep";
  if (entry.kind === "medication" || /medication|glp1/.test(entry.metric_type)) return "medication";
  if (entry.metric_type === "pregnancy_stage") return "pregnancy";
  return entry.kind === "measurement" ? "measurement" : "context";
}
function timelineDescription(entry: BackendTimelineEntry) {
  const value =
    typeof entry.value === "number"
      ? `${formatNumber(entry.value)} ${displayUnit(entry.unit)}`
      : typeof entry.value === "string"
        ? entry.value
        : entry.value && "weeks" in entry.value
          ? `${entry.value["weeks"]} weeks, ${entry.value["days"]} days · ${humanize(String(entry.value["stage"]))}`
          : "Unavailable";
  const notes = typeof entry.details["notes"] === "string" ? entry.details["notes"] : "";
  const severity = typeof entry.details["severity"] === "string" ? entry.details["severity"] : "";
  return [value, severity, notes, provenance(entry), `Origin: ${humanize(entry.origin)}`]
    .filter(Boolean)
    .join(" · ");
}
export function filterTimeline(events: TimelineEvent[], filter: "all" | TimelineCategory) {
  return events.filter((e) => filter === "all" || e.category === filter);
}

function bpFeatureLabel(feature: string) {
  const labels: Record<string, string> = {
    last_diastolic_mm_hg: "Last diastolic BP",
    last_systolic_mm_hg: "Last systolic BP",
    systolic_mean_7d_mm_hg: "7-day mean systolic BP",
    diastolic_mean_7d_mm_hg: "7-day mean diastolic BP",
    systolic_slope_7d_mm_hg_per_day: "7-day systolic slope",
    diastolic_slope_7d_mm_hg_per_day: "7-day diastolic slope",
    systolic_std_7d_mm_hg: "7-day systolic standard deviation",
    diastolic_std_7d_mm_hg: "7-day diastolic standard deviation",
  };
  return labels[feature] ?? humanize(feature);
}

export function adaptDashboard(raw: BackendDashboard) {
  const comparisons = new Map(raw.observed_change.metrics.map((row) => [row.metric_type, row]));
  const pattern = raw.pattern_status;
  const contributes = (key: string) =>
    pattern.contributing_signals.includes(key) &&
    pattern.signals.some((s) => s.metric_type === key && s.contributing);
  const measurements = raw.timeline.entries
    .filter((e) => e.kind === "measurement" && typeof e.value === "number")
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const buildSeries = (key: string, unit: string | null): DailyPoint[] =>
    measurements
      .filter((e) => e.metric_type === key && e.unit === unit)
      .map((e) => ({ date: e.timestamp, t: Date.parse(e.timestamp), value: e.value as number }));
  const seriesFor = (key: string) =>
    buildSeries(key, raw.latest_measurements[key]?.unit ?? comparisons.get(key)?.unit ?? null);
  const systolic = seriesFor(metricKeys.systolic);
  const diastolic = seriesFor(metricKeys.diastolic);
  // Join only measurements with the same actual timestamp. Never invent paired readings.
  const bpMap = new Map<number, BPPoint>();
  for (const [points, field] of [
    [systolic, "sys"],
    [diastolic, "dia"],
  ] as const) {
    for (const point of points) {
      const row = bpMap.get(point.t) ?? { date: point.date, t: point.t, sys: null, dia: null };
      row[field] = point.value;
      bpMap.set(point.t, row);
    }
  }
  const series = {
    glucose: seriesFor(metricKeys.glucose),
    resting_hr: seriesFor(metricKeys.resting_hr),
    hrv: seriesFor(metricKeys.hrv),
    weight: seriesFor(metricKeys.weight),
    sleep: seriesFor(metricKeys.sleep),
    skin_temperature: seriesFor("skin_temperature"),
    body_temperature: seriesFor("body_temperature"),
    systolic,
    diastolic,
    bp: [...bpMap.values()].sort((a, b) => a.t - b.t),
  };
  const latest = (key: string) => {
    const value = raw.latest_measurements[key];
    const status = raw.data_quality.missing_measurements.includes(key)
      ? "missing"
      : raw.data_quality.stale_measurements.includes(key)
        ? "stale"
        : coverage(value?.status);
    const comparison = comparisons.get(key);
    return {
      value:
        value?.value != null && status !== "missing" && status !== "insufficient"
          ? formatNumber(value.value)
          : "Unavailable",
      unit: displayUnit(value?.unit ?? null),
      status,
      context: [coverageText[status], explainReasons(value?.reasons ?? [])]
        .filter(Boolean)
        .join(" · "),
      direction: comparisonDirection(comparison),
      source: value ? provenance(value) : "Source unavailable",
      updated: value?.timestamp ? formatTimestamp(value.timestamp) : "Timestamp unavailable",
      timestamp: value?.timestamp ?? null,
      contributing: contributes(key),
    };
  };
  const sys = latest(metricKeys.systolic),
    dia = latest(metricKeys.diastolic);
  const paired = sys.timestamp != null && sys.timestamp === dia.timestamp && sys.unit === dia.unit;
  const bpStatus: Coverage =
    sys.status === "missing" && dia.status === "missing"
      ? "missing"
      : sys.status === "stale" || dia.status === "stale"
        ? "stale"
        : sys.status === "available" && dia.status === "available"
          ? "available"
          : "partial";
  const sleepStatus = coverage(raw.sleep_summary.status);
  const latest_measurements = {
    glucose: latest(metricKeys.glucose),
    resting_hr: latest(metricKeys.resting_hr),
    hrv: latest(metricKeys.hrv),
    weight: latest(metricKeys.weight),
    bp: {
      ...sys,
      value: paired
        ? `${sys.value} / ${dia.value}`
        : `Sys ${sys.value} ${sys.unit} · Dia ${dia.value} ${dia.unit}`,
      status: bpStatus,
      unit: paired ? sys.unit : "",
      direction: "unknown" as Direction,
      context: coverageText[bpStatus],
      source: sys.source === dia.source ? sys.source : `Sys: ${sys.source}; Dia: ${dia.source}`,
      updated: paired ? sys.updated : `Sys: ${sys.updated}; Dia: ${dia.updated}`,
      contributing: contributes(metricKeys.systolic) || contributes(metricKeys.diastolic),
    },
    sleep: {
      value: "Unavailable",
      unit: "",
      status: sleepStatus,
      context: `${coverageText[sleepStatus]} · ${raw.sleep_summary.session_count} recent sessions`,
      direction: "unknown" as Direction,
      source: "Sleep summary",
      updated: formatWindow(raw.sleep_summary.window),
      timestamp: null,
      contributing: contributes(metricKeys.sleep),
    },
  };
  const wearableMeasurements = [
    latest_measurements.resting_hr,
    latest_measurements.hrv,
    latest("skin_temperature"),
    latest("body_temperature"),
  ];
  const wearableStatus: Coverage = wearableMeasurements.every((m) => m.status === "available")
    ? "available"
    : wearableMeasurements.every((m) => m.status === "missing")
      ? "missing"
      : "partial";
  const timestamps = Object.values(raw.latest_measurements)
    .map((v) => v.timestamp)
    .filter((v): v is string => v != null)
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  const as_of = timestamps.at(-1) ?? raw.timeline.end_date;
  const signals = pattern.signals.map((s) => {
    const note = !s.usable
      ? "Insufficient data"
      : s.changed
        ? "Observed change"
        : "Below change threshold";
    return {
      label: s.metric_name,
      note,
      contributing: contributes(s.metric_type),
      detail: `${note}. ${explainReasons(s.reasons)}. Persistence: ${s.persistence.latest_consecutive_days}/${s.persistence.required_consecutive_days} required consecutive days at window end.`,
    };
  });
  const referenceWindow = raw.observed_change.reference_window,
    recentWindow = raw.observed_change.recent_window;
  const gestation = raw.patient.gestational_age;
  const rows = raw.observed_change.metrics.map((row) => ({
    key:
      Object.entries(metricKeys).find(([, key]) => key === row.metric_type)?.[0] ?? row.metric_type,
    label: row.metric_name,
    unit: displayUnit(row.unit),
    reference: row.reference_mean == null ? null : formatNumber(row.reference_mean),
    recent: row.recent_mean == null ? null : formatNumber(row.recent_mean),
    referenceMean: row.reference_mean,
    recentMean: row.recent_mean,
    absoluteChange: row.absolute_change,
    percentChange: row.percent_change,
    change: changeText(row),
    direction: comparisonDirection(row),
    contributing: contributes(row.metric_type),
    enoughData: row.enough_data,
    status: row.status,
    note: [
      humanize(row.status),
      `${row.reference_sample_count} reference / ${row.recent_sample_count} recent samples`,
      explainReasons(row.reasons),
    ]
      .filter(Boolean)
      .join(" · "),
  }));
  const trend = (key: Metric) => {
    const backendKey = key === "bp" ? metricKeys.systolic : metricKeys[key];
    const unit = displayUnit(
      raw.latest_measurements[backendKey]?.unit ?? comparisons.get(backendKey)?.unit ?? null,
    );
    const count = key === "bp" ? Math.max(systolic.length, diastolic.length) : series[key].length;
    const hasReferencePoints = measurements.some(
      (e) =>
        e.metric_type === backendKey &&
        e.timestamp.slice(0, 10) >= referenceWindow.start_date &&
        e.timestamp.slice(0, 10) <= referenceWindow.end_date,
    );
    return {
      unit,
      enoughData: count >= 2,
      note: `${count} returned measurement points · ${key === "sleep" ? coverageText[sleepStatus] : coverageText[latest_measurements[key].status]} · ${comparisons.get(backendKey)?.metric_definition ?? "No supported measurement series"}${hasReferencePoints ? "" : " · No reference-window points in the returned timeline."}`,
    };
  };
  const timeline: TimelineEvent[] = raw.timeline.entries
    .map((entry, i) => ({
      id: `${entry.timestamp}-${entry.metric_type}-${i}`,
      timestamp: entry.timestamp,
      date: new Date(entry.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      time: new Date(entry.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }),
      category: timelineCategory(entry),
      title: entry.kind === "symptom" ? `${entry.value} reported` : metricName(entry.metric_type),
      description: timelineDescription(entry),
      origin: entry.origin,
    }))
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return {
    synthetic: raw.synthetic,
    prototype: raw.prototype,
    validated: raw.validated,
    flagsLabel: flagsLabel(raw),
    as_of,
    patient: {
      id: raw.patient.patient_id,
      name: raw.patient.display_name,
      synthetic: raw.patient.synthetic,
      gestational_weeks: gestation.weeks,
      gestational_age: `${gestation.weeks} weeks, ${gestation.days} days`,
      trimester: `As of ${formatDate(gestation.as_of_date)}`,
      pregnancy_as_of: formatDate(gestation.as_of_date),
      condition:
        raw.patient.diabetes.type === "type_2"
          ? "Type 2 diabetes"
          : humanize(raw.patient.diabetes.type),
      diabetes_context: raw.patient.diabetes.context,
      diabetes_since: raw.patient.diabetes.since_date
        ? formatDate(raw.patient.diabetes.since_date)
        : "Unavailable",
      last_glp1_dose: raw.patient.glp1_last_dose_date
        ? formatDate(raw.patient.glp1_last_dose_date)
        : "Unavailable",
      transition_date: raw.patient.medication_transition_date
        ? formatDate(raw.patient.medication_transition_date)
        : "Unavailable",
      current_treatment: raw.patient.current_treatment_text,
      symptoms: raw.patient.symptoms.map((s) => ({
        label: `${s.severity} ${s.name}`,
        date: formatTimestamp(s.timestamp),
        notes: s.notes,
      })),
    },
    latest_measurements,
    series,
    trendMeta: {
      glucose: trend("glucose"),
      bp: trend("bp"),
      resting_hr: trend("resting_hr"),
      hrv: trend("hrv"),
      sleep: trend("sleep"),
      weight: trend("weight"),
    },
    observed_change: {
      reference_period: formatWindow(referenceWindow),
      recent_period: formatWindow(recentWindow),
      referenceWindow,
      recentWindow,
      rows,
      synthetic: raw.observed_change.synthetic,
    },
    pattern_status: {
      synthetic: pattern.synthetic,
      prototype: pattern.prototype,
      validated: pattern.validated,
      status: pattern.status,
      headline: pattern.explanation,
      summary: `Signal coverage: ${coverageText[coverage(pattern.data_quality.coverage)]}. ${explainReasons(pattern.reasons)}.`,
      signals,
      contributing: signals.filter((s) => s.contributing),
      context: signals.filter((s) => !s.contributing),
      interpretation: pattern.explanation,
      flagsLabel: flagsLabel(pattern),
    },
    glucose_forecast: {
      horizon_hours: raw.glucose_forecast.horizon_hours,
      horizon: `${raw.glucose_forecast.horizon_hours}-hour horizon`,
      cadence: `${raw.glucose_forecast.cadence_minutes}-minute cadence`,
      origin: formatTimestamp(raw.glucose_forecast.forecast_origin),
      flagsLabel: flagsLabel(raw.glucose_forecast),
      points: raw.glucose_forecast.forecast_points
        .map((p) => ({ t: Date.parse(p.timestamp), forecast: p.glucose_mg_dl }))
        .sort((a, b) => a.t - b.t),
      unit: raw.glucose_forecast.unit,
      synthetic: raw.glucose_forecast.synthetic,
      prototype: raw.glucose_forecast.prototype,
      validated: raw.glucose_forecast.validated,
    },
    bp_forecast: {
      probability:
        raw.bp_forecast.status === "forecast_available" ? raw.bp_forecast.probability : null,
      probabilityPercent:
        raw.bp_forecast.status === "forecast_available" && raw.bp_forecast.probability != null
          ? raw.bp_forecast.probability * 100
          : null,
      horizon_days: raw.bp_forecast.horizon_days,
      status: humanize(raw.bp_forecast.status),
      event_definition: raw.bp_forecast.event_definition,
      origin: formatTimestamp(raw.bp_forecast.forecast_origin),
      event_window_end: formatTimestamp(raw.bp_forecast.event_window_end),
      flagsLabel: flagsLabel(raw.bp_forecast),
      synthetic: raw.bp_forecast.synthetic,
      prototype: raw.bp_forecast.prototype,
      validated: raw.bp_forecast.validated,
      features: raw.bp_forecast.main_contributing_features.map((f) => ({
        label: bpFeatureLabel(f.feature),
        value: `${formatNumber(f.value)}${f.feature.includes("mm_hg_per_day") ? " mmHg/day" : f.feature.includes("mm_hg") ? " mmHg" : ""}`,
        contribution: f.standardized_log_odds_contribution,
      })),
      reasons: explainReasons(raw.bp_forecast.reasons),
    },
    sleep_summary: {
      status: sleepStatus,
      session_count: raw.sleep_summary.session_count,
      window: formatWindow(raw.sleep_summary.window),
      reasons: explainReasons(raw.sleep_summary.reasons),
    },
    data_quality: [
      {
        metric: "Glucose",
        status: latest_measurements.glucose.status,
        note: latest_measurements.glucose.context,
      },
      { metric: "Blood pressure", status: bpStatus, note: latest_measurements.bp.context },
      {
        metric: "Wearable",
        status: wearableStatus,
        note:
          "Resting HR, HRV SDNN, skin and body temperature · " +
          wearableMeasurements
            .map((m) => m.context)
            .filter((v) => v !== "Available")
            .join("; "),
      },
      {
        metric: "Sleep",
        status: sleepStatus,
        note: `${raw.sleep_summary.session_count} recent sessions · ${explainReasons(raw.sleep_summary.reasons)}`,
      },
      {
        metric: "Weight",
        status: latest_measurements.weight.status,
        note: `${coverageText[latest_measurements.weight.status]} measurement · ${rows.find((r) => r.key === "weight")?.change ?? "Comparison unavailable"}`,
      },
    ],
    data_quality_sections: Object.entries(raw.data_quality.sections).map(([key, section]) => ({
      metric: humanize(key),
      status: coverage(section.status),
      note: explainReasons([
        ...new Set([...section.reasons, ...Object.values(section.metric_reasons).flat()]),
      ]),
    })),
    data_quality_status: coverageText[coverage(raw.data_quality.status)],
    timeline,
    timeline_window: formatWindow({
      start_date: raw.timeline.start_date,
      end_date: raw.timeline.end_date,
    }),
  };
}
export type DemoData = ReturnType<typeof adaptDashboard>;

export async function getDashboard(): Promise<DemoData> {
  const response = await fetch("/demo/maya-dashboard.json");
  if (!response.ok) throw new Error(`Dashboard snapshot could not be loaded (${response.status})`);
  const raw = backendDashboardSchema.parse(await response.json());
  return adaptDashboard(raw);
}
