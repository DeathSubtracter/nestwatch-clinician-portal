import { Link, useParams, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  CalendarRange,
  Check,
  ChevronsUpDown,
  LayoutGrid,
  LineChart,
  Menu,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getPatient,
  getPatients,
  searchPatients,
  statusLabel,
  type PatientSummary,
} from "@/data/patients";

import { useDashboardQuery } from "@/data/dashboardContext";

const workspaceNav = [
  { to: "/patients/$patientId", label: "Overview", icon: LayoutGrid },
  { to: "/patients/$patientId/trends", label: "Trends", icon: LineChart },
  { to: "/patients/$patientId/timeline", label: "Timeline", icon: CalendarRange },
  { to: "/patients/$patientId/forecasts", label: "Forecasts", icon: Activity },
] as const;

const linkCls =
  "group flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground data-[status=active]:bg-surface data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:shadow-soft";

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="text-primary">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M6.5 13.5c1.6-3 3.4-4.5 5.5-4.5s3.9 1.5 5.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="15" r="1.6" fill="currentColor" />
      </svg>
      <span className="text-[17px] font-semibold tracking-tight">Nestwatch</span>
    </div>
  );
}

function useCurrentPatient() {
  const params = useParams({ strict: false }) as { patientId?: string };
  const { data } = useDashboardQuery();
  return params.patientId ? getPatient(data, params.patientId) : undefined;
}

function PatientSwitcher({
  current,
  onNavigate,
}: {
  current: PatientSummary;
  onNavigate?: (() => void) | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data } = useDashboardQuery();
  const results = searchPatients(getPatients(data), query);
  const close = () => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Current patient ${current.name}. Switch patient`}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-hairline bg-surface px-3 py-2.5 text-left shadow-soft transition-colors hover:bg-accent/60"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-medium">{current.name}</span>
            <span className="block text-[12px] text-muted-foreground">
              {current.gestationalShort} · {current.context}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-subtle" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-2">
        <label className="relative block">
          <span className="sr-only">Search patients</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients..."
            className="h-8 w-full rounded-lg border border-hairline bg-background pl-8 pr-2 text-[13px] outline-none placeholder:text-subtle focus:border-primary/50"
          />
        </label>
        <div className="mt-1.5">
          {results.length === 0 ? (
            <div className="px-2.5 py-3 text-[12.5px] text-muted-foreground">No patients found</div>
          ) : (
            results.map((p) => (
              <Link
                key={p.id}
                to="/patients/$patientId"
                params={{ patientId: p.id }}
                onClick={close}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-accent"
              >
                <span>
                  <span className="block text-[13.5px] font-medium">{p.name}</span>
                  <span className="block text-[12px] text-muted-foreground">
                    {p.gestationalShort} · {statusLabel[p.status]}
                  </span>
                </span>
                {p.id === current.id && <Check className="h-4 w-4 text-primary" />}
              </Link>
            ))
          )}
        </div>
        <div className="mt-1 border-t border-hairline pt-1">
          <Link
            to="/"
            onClick={close}
            className="block rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            View all patients
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const current = useCurrentPatient();
  return (
    <div className="space-y-6">
      <nav className="flex flex-col gap-0.5">
        <Link to="/" onClick={onNavigate} activeOptions={{ exact: true }} className={linkCls}>
          <Users
            className="h-4 w-4 transition-colors group-data-[status=active]:text-primary"
            strokeWidth={1.75}
          />
          Patients
        </Link>
      </nav>
      {current && (
        <div className="space-y-2">
          <div className="eyebrow px-3">Patient workspace</div>
          <PatientSwitcher current={current} onNavigate={onNavigate} />
          <nav className="flex flex-col gap-0.5 pt-1">
            {workspaceNav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                params={{ patientId: current.id }}
                onClick={onNavigate}
                activeOptions={{ exact: true }}
                className={linkCls}
              >
                <Icon
                  className="h-4 w-4 transition-colors group-data-[status=active]:text-primary"
                  strokeWidth={1.75}
                />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

export function PrototypeLabel() {
  const { data } = useDashboardQuery();
  return (
    <p className="text-[11.5px] leading-relaxed text-subtle">
      {data?.flagsLabel ?? "Nestwatch"}. Nestwatch does not provide diagnosis, treatment
      recommendations, or validated risk scores.
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-[236px] flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div className="space-y-8">
          <div className="px-2">
            <Wordmark />
          </div>
          <NavLinks />
        </div>
        <div className="px-1">
          <PrototypeLabel />
        </div>
      </aside>

      <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-hairline bg-background/90 px-5 py-3 backdrop-blur lg:hidden">
        <Wordmark />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              title="Open menu"
              className="shrink-0 text-muted-foreground"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            aria-describedby={undefined}
            className="flex w-[280px] max-w-[85vw] flex-col bg-sidebar px-4 py-6"
          >
            <SheetTitle className="px-2">
              <Wordmark />
            </SheetTitle>
            <div className="mt-6">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-auto">
              <PrototypeLabel />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="lg:pl-[236px]">
        <div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-8 lg:px-8 lg:py-7 xl:px-10">
          {children}
        </div>
        <footer className="mx-auto max-w-[1180px] px-5 pb-10 sm:px-8 lg:hidden">
          <PrototypeLabel />
        </footer>
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-7 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between animate-rise">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.03em]">{title}</h1>
        {subtitle && <div className="mt-2 text-[15px] text-muted-foreground">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  id,
  right,
}: {
  title: string;
  subtitle?: string;
  id?: string;
  right?: ReactNode;
}) {
  return (
    <div
      id={id}
      className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] scroll-mt-24 items-end gap-3 sm:flex sm:justify-between lg:scroll-mt-6"
    >
      <div className="min-w-0">
        <h2 className="text-[21px] font-semibold tracking-[-0.02em]">{title}</h2>
        {subtitle && <p className="mt-1 text-[14px] text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
