import { afterEach, describe, expect, it, vi } from "vitest";
import { adaptDashboard, filterTimeline, getDashboard } from "@/data/demoData";
import { backendDashboardSchema } from "@/data/backendSchema";
import { dashboard, snapshot, snapshotJson } from "./dashboardFixture";

afterEach(() => vi.unstubAllGlobals());

describe("exported dashboard adapter", () => {
  it("fetches and validates the public export through getDashboard", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => snapshotJson });
    vi.stubGlobal("fetch", fetcher);
    expect(await getDashboard()).toEqual(dashboard);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith("/demo/maya-dashboard.json");
  });
  it("rejects load errors and invalid contracts without falling back to mocks", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(getDashboard()).rejects.toThrow("404");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ patient: {} }) }),
    );
    await expect(getDashboard()).rejects.toThrow();
  });
  it("derives latest values, dates and actual source provenance", () => {
    expect(dashboard.latest_measurements.glucose.value).toBe("91");
    expect(dashboard.latest_measurements.glucose.unit).toBe("mg/dL");
    expect(dashboard.latest_measurements.glucose.source).toContain("oura");
    expect(dashboard.latest_measurements.bp.source).toContain("Apple Watch Series 6");
    expect(dashboard.as_of).toBe(snapshot.latest_measurements["blood_glucose"]?.timestamp);
    expect(dashboard.patient.last_glp1_dose).toBe("Sep 15, 2026");
    expect(dashboard.patient.pregnancy_as_of).toBe("Oct 1, 2026");
  });
  it("preserves every observed mean, absolute/percent change, sufficiency and window", () => {
    snapshot.observed_change.metrics.forEach((raw, i) => {
      const row = dashboard.observed_change.rows[i];
      expect(row?.referenceMean).toBe(raw.reference_mean);
      expect(row?.recentMean).toBe(raw.recent_mean);
      expect(row?.absoluteChange).toBe(raw.absolute_change);
      expect(row?.percentChange).toBe(raw.percent_change);
      expect(row?.enoughData).toBe(raw.enough_data);
      expect(row?.status).toBe(raw.status);
    });
    expect(dashboard.observed_change.referenceWindow).toEqual(
      snapshot.observed_change.reference_window,
    );
    expect(dashboard.observed_change.recentWindow).toEqual(snapshot.observed_change.recent_window);
    expect(dashboard.observed_change.rows.find((r) => r.key === "weight")?.change).toBe(
      "Insufficient data",
    );
  });
  it("uses the backend BP probability, never the old 14% placeholder", () => {
    expect(dashboard.bp_forecast.probabilityPercent).toBeCloseTo(
      snapshot.bp_forecast.probability! * 100,
    );
    expect(dashboard.bp_forecast.probabilityPercent).toBeCloseTo(2.4829);
    const changed = structuredClone(snapshot);
    changed.bp_forecast.probability = 0.321;
    expect(adaptDashboard(changed).bp_forecast.probabilityPercent).toBe(32.1);
    changed.bp_forecast.status = "insufficient_data";
    expect(adaptDashboard(changed).bp_forecast.probability).toBeNull();
  });
  it("preserves all 288 forecast points and their separate origin without a fabricated band", () => {
    expect(dashboard.glucose_forecast.points).toHaveLength(288);
    expect(dashboard.glucose_forecast.points).toEqual(
      snapshot.glucose_forecast.forecast_points.map((p) => ({
        t: Date.parse(p.timestamp),
        forecast: p.glucose_mg_dl,
      })),
    );
    expect(dashboard.glucose_forecast.origin).toContain("Oct 15, 2026");
    expect(dashboard.glucose_forecast.points[0]).not.toHaveProperty("lower");
    expect(dashboard.glucose_forecast.points[0]).not.toHaveProperty("observed");
  });
  it("does not reinterpret a changed signal as contributing", () => {
    expect(dashboard.pattern_status.status).toBe(snapshot.pattern_status.status);
    expect(dashboard.pattern_status.contributing).toHaveLength(0);
    expect(dashboard.latest_measurements.glucose.contributing).toBe(false);
    expect(dashboard.pattern_status.interpretation).toBe(snapshot.pattern_status.explanation);
  });
  it("keeps missing sleep and stale weight distinct from normal measurements", () => {
    expect(dashboard.latest_measurements.sleep.value).toBe("Unavailable");
    expect(dashboard.latest_measurements.sleep.status).toBe("missing");
    expect(dashboard.series.sleep).toEqual([]);
    expect(dashboard.trendMeta.sleep.enoughData).toBe(false);
    expect(dashboard.latest_measurements.weight.value).toBe("82");
    expect(dashboard.latest_measurements.weight.status).toBe("stale");
    expect(dashboard.series.weight).toHaveLength(1);
    expect(dashboard.trendMeta.weight.enoughData).toBe(false);
    const changed = structuredClone(snapshot);
    delete changed.latest_measurements["blood_glucose"];
    expect(adaptDashboard(changed).latest_measurements.glucose.value).toBe("Unavailable");
    expect(adaptDashboard(changed).latest_measurements.glucose.status).toBe("missing");
  });
  it("charts only actual chronological measurement points", () => {
    for (const [seriesKey, backendKey] of [
      ["glucose", "blood_glucose"],
      ["resting_hr", "resting_heart_rate"],
      ["hrv", "heart_rate_variability_sdnn"],
      ["weight", "weight"],
    ] as const) {
      const expected = snapshot.timeline.entries
        .filter((e) => e.kind === "measurement" && e.metric_type === backendKey)
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      expect(dashboard.series[seriesKey].map((p) => [p.t, p.value])).toEqual(
        expected.map((p) => [Date.parse(p.timestamp), p.value]),
      );
    }
    expect(dashboard.series.bp).toHaveLength(8);
    const changed = structuredClone(snapshot);
    changed.timeline.entries.reverse();
    expect(adaptDashboard(changed).series).toEqual(dashboard.series);
  });
  it("does not combine BP samples from different timestamps", () => {
    const changed = structuredClone(snapshot);
    const entry = changed.timeline.entries.find(
      (e) => e.metric_type === "blood_pressure_diastolic",
    )!;
    entry.timestamp = "2026-10-01T01:00:01Z";
    expect(adaptDashboard(changed).series.bp).toHaveLength(9);
    expect(
      adaptDashboard(changed).series.bp.find((p) => p.t === Date.parse(entry.timestamp))?.sys,
    ).toBeNull();
  });
  it("filters actual timeline entries without invented medication or sleep events", () => {
    expect(dashboard.timeline).toHaveLength(snapshot.timeline.entries.length);
    expect(filterTimeline(dashboard.timeline, "measurement")).toHaveLength(2778);
    expect(filterTimeline(dashboard.timeline, "symptom")).toHaveLength(2);
    expect(filterTimeline(dashboard.timeline, "medication")).toHaveLength(0);
    expect(filterTimeline(dashboard.timeline, "sleep")).toHaveLength(0);
    expect(
      dashboard.timeline.every((e) => Date.parse(e.timestamp) < Date.parse("2026-10-09")),
    ).toBe(true);
  });
  it("preserves flags separately for the dashboard and forecast sections", () => {
    expect([dashboard.synthetic, dashboard.prototype, dashboard.validated]).toEqual([
      true,
      true,
      false,
    ]);
    for (const key of ["glucose_forecast", "bp_forecast"] as const) {
      expect([
        dashboard[key].synthetic,
        dashboard[key].prototype,
        dashboard[key].validated,
      ]).toEqual([true, true, false]);
    }
    const changed = structuredClone(snapshot);
    changed.glucose_forecast.synthetic = false;
    expect(adaptDashboard(changed).glucose_forecast.synthetic).toBe(false);
    expect(adaptDashboard(changed).synthetic).toBe(true);
  });
  it("validates probabilities instead of presenting invalid numbers", () => {
    expect(
      backendDashboardSchema.safeParse({
        ...snapshot,
        bp_forecast: { ...snapshot.bp_forecast, probability: 14 },
      }).success,
    ).toBe(false);
  });
});
