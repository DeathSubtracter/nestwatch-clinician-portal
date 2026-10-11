import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { DashboardBoundary, DashboardProvider } from "@/data/DashboardProvider";
import {
  CurrentMetrics,
  ObservedChangeSection,
  MultisignalExplanation,
} from "@/components/nestwatch/overview";
import { BPForecastCard } from "@/routes/patients.$patientId.forecasts";
import { Timeline } from "@/routes/patients.$patientId.timeline";
import { Trends } from "@/routes/patients.$patientId.trends";
import { adaptDashboard } from "@/data/demoData";
import { dashboard, snapshot, snapshotJson } from "./dashboardFixture";

// Layout is verified in the browser; avoid ResizeObserver requirements in jsdom.
vi.mock("recharts", () => {
  const Container = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  const Chart = ({ children }: { children: ReactNode }) => <svg>{children}</svg>;
  return {
    ResponsiveContainer: Container,
    AreaChart: Chart,
    ComposedChart: Chart,
    Area: () => null,
    Line: () => null,
    ReferenceArea: () => null,
    ReferenceLine: () => null,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function renderWithDashboard(children: ReactNode, loaded = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (loaded) client.setQueryData(["dashboard", "exported-snapshot"], dashboard);
  return render(
    <QueryClientProvider client={client}>
      <DashboardProvider>
        <DashboardBoundary>{children}</DashboardBoundary>
      </DashboardProvider>
    </QueryClientProvider>,
  );
}

describe("snapshot presentation", () => {
  it("renders missing measurements as unavailable and identifies stale data", () => {
    const changed = structuredClone(snapshot);
    delete changed.latest_measurements["blood_glucose"];
    render(<CurrentMetrics data={adaptDashboard(changed)} />);
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.queryByText("126")).not.toBeInTheDocument();
  });
  it("renders actual comparison values and the absence of contributing signals", () => {
    render(
      <>
        <ObservedChangeSection data={dashboard} />
        <MultisignalExplanation status={dashboard.pattern_status} />
      </>,
    );
    expect(screen.getByText("103.29")).toBeInTheDocument();
    expect(screen.getByText("126.29")).toBeInTheDocument();
    expect(screen.getByText("+23 mg/dL (+22.27%)")).toBeInTheDocument();
    expect(screen.getByText(/No signals meet the contributing criteria/)).toBeInTheDocument();
    expect(screen.getAllByText("Insufficient data").length).toBeGreaterThan(0);
  });
  it("renders the actual BP event probability and definition", () => {
    render(<BPForecastCard fc={dashboard.bp_forecast} />);
    expect(screen.getByRole("img", { name: "2.4829 percent" })).toBeInTheDocument();
    expect(screen.getByText(snapshot.bp_forecast.event_definition)).toBeInTheDocument();
    expect(screen.queryByText("14")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Prototype · Synthetic data · Not clinically validated/),
    ).toBeInTheDocument();
  });
  it("keeps timeline category filters tied to the real entries", () => {
    renderWithDashboard(<Timeline />);
    fireEvent.click(screen.getByRole("tab", { name: "Symptoms" }));
    expect(screen.getByText("nausea reported")).toBeInTheDocument();
    expect(screen.getByText("fatigue reported")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(screen.getByRole("tab", { name: "Medication" }));
    expect(screen.getByText("No events in this category.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Sleep" }));
    expect(screen.getByText("No events in this category.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Measurements" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(100);
    expect(screen.getByText("Show more events (100 of 2778)")).toBeInTheDocument();
  });
  it("keeps metric selection usable for unsupported sleep and sparse weight", () => {
    renderWithDashboard(<Trends />);
    fireEvent.click(screen.getByRole("tab", { name: "Sleep" }));
    expect(screen.getByText("Insufficient data to chart sleep.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Weight" }));
    expect(screen.getByText("Insufficient data to chart weight.")).toBeInTheDocument();
  });
  it("shows a polished loading state until the export resolves", async () => {
    let resolve!: (value: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      ),
    );
    renderWithDashboard(<div>Loaded snapshot</div>, false);
    expect(screen.getByRole("status", { name: "Loading dashboard" })).toBeInTheDocument();
    resolve({ ok: true, json: async () => snapshotJson });
    expect(await screen.findByText("Loaded snapshot")).toBeInTheDocument();
  });
  it("shows a restrained load failure and supports retry", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"))
      .mockResolvedValue({ ok: true, json: async () => snapshotJson });
    vi.stubGlobal("fetch", fetcher);
    renderWithDashboard(<div>Loaded snapshot</div>, false);
    expect(await screen.findByRole("alert")).toHaveTextContent("Dashboard unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Loaded snapshot")).toBeInTheDocument();
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
