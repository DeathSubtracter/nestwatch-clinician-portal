import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "./demoData";
import { Button } from "@/components/ui/button";

import { DashboardContext, useDashboardQuery } from "./dashboardContext";

export function DashboardProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["dashboard", "exported-snapshot"],
    queryFn: getDashboard,
    enabled: typeof window !== "undefined",
    staleTime: Infinity,
    retry: false,
  });
  return <DashboardContext.Provider value={query}>{children}</DashboardContext.Provider>;
}
export function DashboardBoundary({ children }: { children: ReactNode }) {
  const query = useDashboardQuery();
  if (query.isError)
    return (
      <section role="alert" className="surface mx-auto max-w-[920px] p-8">
        <h1 className="text-[22px] font-semibold tracking-tight">Dashboard unavailable</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          The exported dashboard could not be loaded. Try again to retrieve the snapshot.
        </p>
        <Button className="mt-5" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </section>
    );
  if (!query.data)
    return (
      <section
        role="status"
        aria-label="Loading dashboard"
        className="mx-auto max-w-[920px] space-y-5"
      >
        <div className="text-[22px] font-semibold tracking-tight">Loading dashboard</div>
        <p className="text-[14px] text-muted-foreground">
          Retrieving the exported Nestwatch snapshot…
        </p>
        <div className="surface h-44 animate-pulse motion-reduce:animate-none bg-muted" />
        <div className="surface h-64 animate-pulse motion-reduce:animate-none bg-muted" />
      </section>
    );
  return children;
}
