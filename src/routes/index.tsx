import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/nestwatch/AppShell";
import { getPatients, searchPatients, statusLabel, type PatientSummary } from "@/data/patients";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Patients — Nestwatch" },
      { name: "description", content: "Monitor and review patients currently connected to Nestwatch." },
      { property: "og:title", content: "Patients — Nestwatch" },
      { property: "og:description", content: "Clinician patient directory for Nestwatch maternal-health monitoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientsPage,
});

export function StatusPill({ status }: { status: PatientSummary["status"] }) {
  const tone = status === "watch" ? "bg-watch-soft text-watch" : "bg-accent text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

function PatientsPage() {
  const all = getPatients();
  const [query, setQuery] = useState("");
  const results = searchPatients(all, query);
  return (
    <div className="mx-auto max-w-[920px]">
      <PageHeader title="Patients" subtitle="Monitor and review patients currently connected to Nestwatch." />
      <div className="mb-4 flex items-center justify-between gap-4 animate-rise">
        <label className="relative w-full max-w-[360px]">
          <span className="sr-only">Search patients</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients..."
            className="h-10 w-full rounded-xl border border-hairline bg-surface pl-10 pr-3 text-[14px] shadow-soft outline-none transition placeholder:text-subtle focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <span className="text-[13px] text-muted-foreground">
          {results.length} {results.length === 1 ? "patient" : "patients"}
        </span>
      </div>

      <div className="surface overflow-hidden animate-rise">
        <div className="hidden grid-cols-[minmax(0,1.3fr)_120px_minmax(0,1.6fr)_24px] gap-6 border-b border-hairline px-6 py-3 md:grid">
          <span className="eyebrow">Patient</span><span className="eyebrow">Status</span><span className="eyebrow">Signals</span><span />
        </div>
        {results.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="text-[15px] font-medium">No patients found</div>
            <div className="mt-1 text-[13.5px] text-muted-foreground">Try another name or search term.</div>
          </div>
        ) : (
          results.map((p) => (
            <Link
              key={p.id}
              to="/patients/$patientId"
              params={{ patientId: p.id }}
              aria-label={`Open patient ${p.name}`}
              className="group grid grid-cols-1 gap-3 border-b border-hairline px-6 py-5 transition-colors last:border-b-0 hover:bg-accent/60 md:grid-cols-[minmax(0,1.3fr)_120px_minmax(0,1.6fr)_24px] md:items-center md:gap-6"
            >
              <div className="min-w-0">
                <div className="text-[17px] font-semibold tracking-tight">{p.name}</div>
                <div className="text-[13px] text-muted-foreground">{p.gestationalShort} · {p.context}</div>
              </div>
              <div><StatusPill status={p.status} /></div>
              <div className="min-w-0">
                <div className="text-[14px]">{p.summary.join(" · ")}</div>
                <div className="text-[12px] text-subtle">{p.freshness}</div>
              </div>
              <ChevronRight className="hidden h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-foreground md:block" />
            </Link>
          ))
        )}
      </div>
      <p className="mt-4 text-[12px] text-subtle">Synthetic demo directory · Select a patient to open their workspace.</p>
    </div>
  );
}
