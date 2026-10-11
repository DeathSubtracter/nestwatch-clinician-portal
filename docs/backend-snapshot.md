# Exported backend snapshot integration

The browser fetches `/demo/maya-dashboard.json` through `getDashboard()` in
`src/data/demoData.ts`. `backendSchema.ts` validates the response at runtime and
provides its TypeScript types. The adapter builds frontend objects; routes and
components consume the shared React Query result through `DashboardProvider`
and `dashboardContext`. The snapshot is cached for the page session. Reloading
retrieves it again. No FastAPI calls, authentication, or backend changes are required.

The shared navigation shell stays mounted during loading, errors, and route
changes. Fetch, JSON parsing, and schema errors show a restrained failure panel
with a retry button. There is no mock-data fallback.

## Mapping and unsupported content

- Maya is the only directory entry. Her ID, name, dated gestational context,
  diabetes context, medication dates, treatment, and symptoms come from `patient`.
- Current measurements preserve actual units, timestamps, source/device details,
  and missing/stale states. Their as-of time is the latest timestamp in
  `latest_measurements`, independent of the forecast origins.
- All comparison rows use `observed_change`: Sep 15–21 versus Oct 2–8, 2026.
  Means, absolute changes, and available percent changes are rounded only for
  display. Weight's returned means remain visible with an insufficient-data
  status; no change or direction is calculated for that row.
- The Watch explanation, signal roles, and persistence information come from
  `pattern_status`. This snapshot has **no contributing signals**. Changed
  glucose and resting HR are not relabeled as contributing.
- Trends use actual chronological measurement timestamps from `timeline.entries`.
  BP values are joined only at identical timestamps. The timeline covers Oct 1–8;
  it supplies no reference-window points. The reference region therefore remains
  empty rather than being filled with mock values.
- Recent sleep is missing (zero sessions). There is no supported sleep average or
  nightly trend. Weight is stale at 82 kg and has only one timeline point, so its
  trend also shows insufficient data.
- All 2,783 timeline entries remain accessible, displayed 100 at a time. There
  are 2,778 measurements, two symptoms, and three context snapshots. Medication
  and Sleep filters are empty because the returned entries contain no such
  events; medication dates remain in patient context.
- Glucose uses the separate synthetic forecasting dataset: 288 actual forecast
  points at five-minute cadence, a 24-hour horizon, and an Oct 15 origin. There
  are no returned observed forecasting samples or confidence intervals to plot.
- BP displays `0.024829 * 100 = 2.4829%`, its actual seven-day horizon, status,
  origin, event definition, and main model features. The event is a synthetic BP
  measurement reaching systolic ≥140 **or** diastolic ≥90 mmHg; it is not a
  disease diagnosis or disease-risk estimate.
- Synthetic, prototype, and validated flags remain separate for the dashboard,
  pattern, and forecasts. The patient synthetic flag is preserved separately.
  No model-performance panel is added.

## Manual verification

1. Run `npm run dev`; open the Local URL printed by Vite. The default port is
   8080; it can advance when occupied (8081 during verification).
2. At `/`, confirm **1 patient**, Maya. Search `maya` and `diabetes` (one result),
   then `zzz` (no results). Clear the search and click **Maya**.
3. At `/patients/maya`, confirm 10 weeks, 0 days **as of Oct 1, 2026**, last GLP-1
   dose Sep 15, and transition Sep 22. Check glucose **91 mg/dL**, BP **112 / 74
   mmHg**, resting HR **54 bpm**, HRV **64 ms**, Sleep **Unavailable**, and Weight
   **82 kg / Stale**. The as-of time is **Oct 8, 2026 14:50 UTC**. Source details
   should name the returned Oura/Apple providers and Apple Watch devices.
4. Click **View what changed**. Confirm the actual comparison windows and glucose
   **103.29 → 126.29 mg/dL**, **+23 mg/dL (+22.27%)**. Weight shows insufficient
   comparison data. Under the Watch explanation, confirm no signals meet the
   contributing criteria. Missing sleep must not appear normal or stable.
5. Open **Trends**. Select Glucose, Blood pressure, Resting HR, and HRV; inspect
   the actual points and tooltips. The reference region has no plotted values.
   Select Sleep and Weight; each should show an insufficient-data message while
   the metric selector remains usable.
6. Open **Timeline**. All shows actual Oct 1–8 events; **Show more events** adds
   100 entries without replacing the existing ones. Measurements uses real
   measurements; Symptoms shows fatigue on Oct 6 at 18:30 UTC and nausea on Oct
   2 at 08:00 UTC. Medication and Sleep each show **No events in this category**.
7. Open **Forecasts**. Confirm **288 points**, **24-hour horizon**, **5-minute
   cadence**, and glucose origin **Oct 15, 2026 00:00 UTC**. Only the dashed
   forecast is plotted. BP shows **2.4829%**, the review-event definition, origin
   **Oct 15, 2026 08:00 UTC**, and window end **Oct 22, 2026 08:00 UTC**. Synthetic,
   prototype, and not-clinically-validated labels should remain visible.
8. Open the patient switcher. Confirm it contains only Maya; choose **View all
   patients** and confirm return to `/`. Reopen Maya. Below 1024px, open the menu,
   navigate to Trends, and confirm the sheet dismisses. Reopen it and press Escape
   to check dismissal. Repeat at a narrow phone width and desktop width.
9. In browser developer tools, block `/demo/maya-dashboard.json` and reload.
   Confirm **Dashboard unavailable** appears inside the navigation shell.
   Remove the block and press **Try again**; the directory/workspace should load.
   With network throttling enabled, reload and confirm the loading skeleton.
   Do not edit or rename the JSON file to simulate failures.
10. Open `/patients/unknown`; confirm **Patient not found** and **View all patients**.

## Automated checks

Run `npm test`, `npm run build`, `npm run lint`, and
`./node_modules/.bin/tsc --noEmit` from the project root. Tests cover the actual
export, directory/search, comparisons, BP probability, forecast points, absent
and stale metrics, chronology and BP pairing, flags, timeline filters, and
loading/error/retry presentation. Build warnings about bundle size and existing
Vite/Nitro configuration do not affect the output; lint retains existing Fast
Refresh warnings in shared primitive/UI modules.
