/**
 * Centralized synthetic demo data for Nestwatch.
 * Mirrors the backend dashboard response sections so it can later be replaced by
 * fetch("/demo/maya-dashboard.json") without touching components.
 */

export type PatternStatus = "normal" | "watch" | "change_to_review" | "insufficient_data";
export type Coverage = "available" | "partial" | "insufficient" | "stale";
export type Direction = "up" | "down" | "stable" | "unknown";

export interface DailyPoint {
  date: string; // ISO date
  value: number | null;
}
export interface BPPoint {
  date: string;
  sys: number | null;
  dia: number | null;
}

// Deterministic pseudo-random for stable demo visuals
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DAYS = 30;
const END = new Date("2026-10-10T00:00:00Z");
const dayIso = (i: number) => {
  const d = new Date(END);
  d.setUTCDate(d.getUTCDate() - (DAYS - 1 - i));
  return d.toISOString().slice(0, 10);
};
export const REFERENCE_SPLIT = 15; // first 15 days = reference, last 15 = recent

function series(seed: number, ref: number, recent: number, noise: number, decimals = 0, gaps: number[] = []) {
  const r = rng(seed);
  return Array.from({ length: DAYS }, (_, i): DailyPoint => {
    const t = i < REFERENCE_SPLIT ? 0 : Math.min(1, (i - REFERENCE_SPLIT + 3) / 9);
    const base = ref + (recent - ref) * t;
    const v = base + (r() - 0.5) * 2 * noise;
    const f = 10 ** decimals;
    return { date: dayIso(i), value: gaps.includes(i) ? null : Math.round(v * f) / f };
  });
}

const glucoseDaily = series(7, 103, 128, 4);
const hrDaily = series(11, 59, 65.5, 1.2);
const hrvDaily = series(19, 50.7, 50.4, 2.2, 1);
const sleepDaily = series(23, 7.1, 6.8, 0.5, 1, [17, 18, 21, 24, 25, 26, 28]);
const tempDaily = series(29, 36.6, 36.62, 0.08, 2);
const weightDaily: DailyPoint[] = Array.from({ length: DAYS }, (_, i) => ({
  date: dayIso(i),
  value: [2, 13, 27].includes(i) ? [71.2, 71.4, 71.6][[2, 13, 27].indexOf(i)] : null,
}));
const bpDaily: BPPoint[] = (() => {
  const s = series(31, 119, 122.5, 3);
  const d = series(37, 78, 72.5, 2.5);
  return s.map((p, i) => ({ date: p.date, sys: p.value, dia: d[i].value }));
})();

// 24h glucose forecast at 5-minute cadence
const glucoseIntraday = (() => {
  const r = rng(41);
  const start = new Date("2026-10-10T08:00:00Z").getTime();
  const pts: { t: number; observed: number | null; forecast: number | null; lower: number | null; upper: number | null }[] = [];
  const meal = (h: number) =>
    [8.5, 13, 19].reduce((acc, m) => acc + 32 * Math.exp(-((h - m - 0.9) ** 2) / 0.9), 0);
  for (let k = 0; k < 288 * 2; k++) {
    const t = start + k * 5 * 60 * 1000;
    const hour = ((8 + (k * 5) / 60) % 24 + 24) % 24;
    const base = 114 + meal(hour) - 8 * Math.exp(-((hour - 4) ** 2) / 6);
    const isObs = k < 288;
    const v = Math.round(base + (isObs ? (r() - 0.5) * 8 : 0));
    const spread = isObs ? 0 : 6 + ((k - 288) / 288) * 16;
    pts.push({
      t,
      observed: isObs ? v : k === 288 ? null : null,
      forecast: isObs ? (k === 287 ? v : null) : v,
      lower: isObs ? (k === 287 ? v : null) : Math.round(v - spread),
      upper: isObs ? (k === 287 ? v : null) : Math.round(v + spread),
    });
  }
  return pts;
})();

export const demoData = {
  synthetic: true,
  prototype: true,
  validated: false,
  as_of: "2026-10-10",

  patient: {
    name: "Maya",
    gestational_weeks: 10,
    trimester: "First trimester",
    pregnancy_as_of: "Oct 1, 2026",
    condition: "Type 2 diabetes",
    diabetes_since: 2021,
    last_glp1_dose: "Sep 15, 2026",
    transition_date: "Sep 22, 2026",
    current_treatment: "Insulin-based treatment + glucose monitoring",
    symptoms: [
      { label: "Mild nausea", date: "Oct 2" },
      { label: "Mild fatigue", date: "Oct 6" },
    ],
  },

  latest_measurements: {
    glucose: { value: "126", unit: "mg/dL", context: "↑ from recent baseline", direction: "up" as Direction, updated: "12 min ago", source: "CGM" },
    bp: { value: "122 / 73", unit: "mmHg", context: "Modest change", direction: "stable" as Direction, updated: "This morning", source: "Home cuff" },
    resting_hr: { value: "65", unit: "bpm", context: "↑ ~6 bpm", direction: "up" as Direction, updated: "Overnight", source: "Wearable" },
    hrv: { value: "50", unit: "ms", context: "Stable", direction: "stable" as Direction, updated: "Overnight", source: "Wearable" },
    sleep: { value: "6.8", unit: "h avg", context: "Partial recent coverage", direction: "unknown" as Direction, updated: "2 nights ago", source: "Wearable" },
    weight: { value: "71.6", unit: "kg", context: "Insufficient trend data", direction: "unknown" as Direction, updated: "Oct 7", source: "Scale" },
  },

  series: {
    glucose: glucoseDaily,
    resting_hr: hrDaily,
    hrv: hrvDaily,
    sleep: sleepDaily,
    temperature: tempDaily,
    weight: weightDaily,
    bp: bpDaily,
  },

  observed_change: {
    reference_period: "Sep 11 – Sep 25",
    recent_period: "Sep 26 – Oct 10",
    rows: [
      { key: "glucose", label: "Glucose", unit: "mg/dL", reference: "103", recent: "126", change: "+22%", direction: "up" as Direction, contributing: true },
      { key: "resting_hr", label: "Resting HR", unit: "bpm", reference: "59", recent: "65", change: "+6 bpm", direction: "up" as Direction, contributing: true },
      { key: "bp", label: "Blood pressure", unit: "mmHg", reference: "119/78", recent: "122/73", change: "Modest", direction: "stable" as Direction, contributing: false },
      { key: "hrv", label: "HRV (SDNN)", unit: "ms", reference: "50.7", recent: "50.4", change: "Stable", direction: "stable" as Direction, contributing: false },
      { key: "temperature", label: "Temperature", unit: "°C", reference: "36.6", recent: "36.6", change: "Stable", direction: "stable" as Direction, contributing: false },
      { key: "weight", label: "Weight", unit: "kg", reference: null, recent: null, change: "Insufficient data", direction: "unknown" as Direction, contributing: false },
    ],
  },

  pattern_status: {
    status: "watch" as PatternStatus,
    headline: "Several signals have shifted from Maya's recent baseline.",
    summary: "Nestwatch is monitoring these changes together for persistence and additional context.",
    signals: [
      { label: "Glucose", note: "Trending higher", contributing: true },
      { label: "Resting HR", note: "Increased", contributing: true },
      { label: "Blood pressure", note: "Modest change", contributing: false },
      { label: "HRV", note: "Stable", contributing: false },
    ],
    contributing: [
      { label: "Glucose", detail: "Recent levels are higher than Maya's reference period." },
      { label: "Resting heart rate", detail: "Recent resting HR is elevated relative to baseline." },
    ],
    context: [
      { label: "Blood pressure", detail: "Only a modest recent shift." },
      { label: "HRV", detail: "Approximately stable." },
      { label: "Temperature", detail: "No meaningful recent shift." },
    ],
    interpretation:
      "Several moderate changes are occurring together, but the current pattern does not meet the prototype threshold for “Change to Review.”",
  },

  glucose_forecast: {
    horizon: "24-hour horizon",
    cadence: "5-minute cadence",
    points: glucoseIntraday,
  },

  bp_forecast: {
    // Demo placeholder: will be replaced by the prototype model output from the backend JSON.
    probability: 0.14 as number | null,
    horizon_days: 7,
    features: [
      { label: "Recent systolic level", value: "122 mmHg" },
      { label: "Recent diastolic level", value: "73 mmHg" },
      { label: "Recent BP slope", value: "+0.2 mmHg/day" },
      { label: "BP variability", value: "Low" },
    ],
  },

  sleep_summary: {
    avg_hours: 6.8,
    nights_recorded: 8,
    nights_expected: 15,
  },

  data_quality: [
    { metric: "Glucose", status: "available" as Coverage, note: "Continuous" },
    { metric: "Blood pressure", status: "available" as Coverage, note: "Daily readings" },
    { metric: "Wearable", status: "available" as Coverage, note: "HR, HRV, temperature" },
    { metric: "Sleep", status: "partial" as Coverage, note: "Partial recent coverage" },
    { metric: "Weight", status: "insufficient" as Coverage, note: "Limited samples" },
  ],

  timeline: [
    { date: "Oct 10", time: "08:00", category: "measurement", title: "Recent glucose measurements", description: "CGM average 126 mg/dL over the past 24 hours." },
    { date: "Oct 9", time: "07:40", category: "measurement", title: "Blood pressure reading", description: "122 / 73 mmHg, seated, home cuff." },
    { date: "Oct 8", time: "23:10", category: "sleep", title: "Sleep session", description: "6 h 42 min recorded. Two nights since without data." },
    { date: "Oct 6", time: "14:20", category: "symptom", title: "Mild fatigue reported", description: "Patient-reported via check-in." },
    { date: "Oct 2", time: "09:05", category: "symptom", title: "Mild nausea reported", description: "Patient-reported via check-in." },
    { date: "Oct 1", time: "—", category: "pregnancy", title: "Pregnancy context snapshot", description: "10 weeks gestation, first trimester." },
    { date: "Sep 26", time: "—", category: "measurement", title: "Recent period begins", description: "Observed-change comparison window starts." },
    { date: "Sep 22", time: "—", category: "medication", title: "Treatment transition", description: "Moved to insulin-based treatment with glucose monitoring." },
    { date: "Sep 15", time: "—", category: "medication", title: "Last GLP-1 dose", description: "Final GLP-1 administration before transition." },
  ] as { date: string; time: string; category: "measurement" | "sleep" | "symptom" | "medication" | "pregnancy"; title: string; description: string }[],
};

export type DemoData = typeof demoData;
export const getDashboard = (): DemoData => demoData;
