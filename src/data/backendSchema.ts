import { z } from "zod";

const timestamp = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid timestamp");
const windowSchema = z.object({ start_date: timestamp, end_date: timestamp });
const flags = { synthetic: z.boolean(), prototype: z.boolean(), validated: z.boolean() };
const provenance = {
  provider: z.string().nullable(),
  source: z.string().nullable(),
  device: z.string().nullable(),
  device_type: z.string().nullable(),
};
const coverage = z.enum(["available", "partial", "stale", "missing", "insufficient_data"]);
const reasons = z.array(z.string());
const comparisonSchema = z
  .object({
    metric_type: z.string(),
    metric_name: z.string(),
    metric_definition: z.string(),
    unit: z.string().nullable(),
    reference_mean: z.number().nullable(),
    recent_mean: z.number().nullable(),
    absolute_change: z.number().nullable(),
    percent_change: z.number().nullable(),
    percent_change_unavailable_reason: z.string().nullable(),
    reference_sample_count: z.number(),
    recent_sample_count: z.number(),
    enough_data: z.boolean(),
    status: z.string(),
    reasons,
  })
  .passthrough();
const measurementSchema = z.object({
  metric_type: z.string(),
  metric_definition: z.string(),
  status: coverage,
  value: z.number().nullable(),
  unit: z.string().nullable(),
  timestamp: timestamp.nullable(),
  ...provenance,
  reasons,
});
const timelineEntrySchema = z.object({
  timestamp,
  kind: z.string(),
  origin: z.string(),
  metric_type: z.string(),
  metric_definition: z.string(),
  value: z.union([z.number(), z.string(), z.record(z.unknown()), z.null()]),
  unit: z.string().nullable(),
  ...provenance,
  details: z.record(z.unknown()),
});
const qualitySection = z.object({ status: coverage, reasons, metric_reasons: z.record(reasons) });

/** Runtime validation and TypeScript definitions share the same backend contract.
 * Unknown metadata is retained; absent measurements are handled by the adapter.
 */
export const backendDashboardSchema = z
  .object({
    ...flags,
    patient: z.object({
      patient_id: z.string(),
      display_name: z.string(),
      synthetic: z.boolean(),
      gestational_age: z.object({ weeks: z.number(), days: z.number(), as_of_date: timestamp }),
      glp1_last_dose_date: timestamp.nullable(),
      medication_transition_date: timestamp.nullable(),
      diabetes: z.object({
        type: z.string(),
        since_date: timestamp.nullable(),
        context: z.string(),
      }),
      current_treatment_text: z.string(),
      symptoms: z.array(
        z.object({ timestamp, name: z.string(), severity: z.string(), notes: z.string() }),
      ),
    }),
    latest_measurements: z.record(measurementSchema),
    timeline: z.object({
      patient_id: z.string(),
      synthetic: z.boolean(),
      start_date: timestamp,
      end_date: timestamp,
      timezone: z.string(),
      count: z.number(),
      entries: z.array(timelineEntrySchema),
    }),
    observed_change: z.object({
      patient_id: z.string(),
      synthetic: z.boolean(),
      timezone: z.string(),
      reference_window: windowSchema,
      recent_window: windowSchema,
      metrics: z.array(comparisonSchema),
    }),
    pattern_status: z.object({
      ...flags,
      status: z.enum(["normal", "watch", "change_to_review", "insufficient_data"]),
      explanation: z.string(),
      reasons,
      contributing_signals: z.array(z.string()),
      non_contributing_signals: z.array(z.string()),
      signals: z.array(
        z
          .object({
            metric_type: z.string(),
            metric_name: z.string(),
            group: z.string(),
            role: z.string(),
            contributing: z.boolean(),
            changed: z.boolean().nullable(),
            usable: z.boolean(),
            comparison: comparisonSchema,
            reasons,
            persistence: z
              .object({
                latest_consecutive_days: z.number(),
                longest_consecutive_days: z.number(),
                required_consecutive_days: z.number(),
                meets_persistence: z.boolean(),
              })
              .passthrough(),
          })
          .passthrough(),
      ),
      data_quality: z.object({ coverage, reasons_by_signal: z.record(reasons) }).passthrough(),
    }),
    glucose_forecast: z
      .object({
        ...flags,
        forecast_origin: timestamp,
        last_observation_timestamp: timestamp,
        horizon_hours: z.number(),
        cadence_minutes: z.number(),
        unit: z.string(),
        forecast_points: z.array(z.object({ timestamp, glucose_mg_dl: z.number().finite() })),
      })
      .passthrough(),
    bp_forecast: z
      .object({
        ...flags,
        forecast_origin: timestamp,
        last_observation_timestamp: timestamp,
        horizon_days: z.number(),
        event_definition: z.string(),
        event_window_end: timestamp,
        probability: z.number().min(0).max(1).nullable(),
        status: z.string(),
        reasons,
        thresholds: z.object({
          systolic_mm_hg: z.number(),
          diastolic_mm_hg: z.number(),
          comparison: z.string(),
          combine: z.string(),
        }),
        feature_values: z.record(z.number()),
        main_contributing_features: z.array(
          z.object({
            feature: z.string(),
            value: z.number(),
            standardized_log_odds_contribution: z.number(),
          }),
        ),
      })
      .passthrough(),
    sleep_summary: z
      .object({
        window: windowSchema,
        status: coverage,
        latest_session: z.record(z.unknown()).nullable(),
        session_count: z.number(),
        reasons,
      })
      .passthrough(),
    data_quality: z.object({
      status: coverage,
      max_staleness_days: z.number(),
      freshness_relative_to: z.string(),
      missing_measurements: z.array(z.string()),
      stale_measurements: z.array(z.string()),
      sections: z.record(qualitySection),
      unavailable_sections: z.record(reasons),
    }),
  })
  .passthrough();

export type BackendDashboard = z.infer<typeof backendDashboardSchema>;
export type BackendMeasurement = z.infer<typeof measurementSchema>;
export type BackendComparison = z.infer<typeof comparisonSchema>;
export type BackendTimelineEntry = z.infer<typeof timelineEntrySchema>;
