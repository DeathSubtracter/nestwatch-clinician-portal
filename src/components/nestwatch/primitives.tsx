import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { Coverage, DailyPoint, Direction } from "@/data/demoData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DirectionGlyph({
  direction,
  tone = "muted",
}: {
  direction: Direction;
  tone?: "watch" | "muted";
}) {
  const cls = cn("h-3.5 w-3.5", tone === "watch" ? "text-watch-ink" : "text-muted-foreground");
  if (direction === "up")
    return <ArrowUpRight className={cls} strokeWidth={2} aria-label="Higher" />;
  if (direction === "down")
    return <ArrowDownRight className={cls} strokeWidth={2} aria-label="Lower" />;
  if (direction === "stable") return <Minus className={cls} strokeWidth={2} aria-label="Stable" />;
  return null;
}

export function Sparkline({
  data,
  color,
  height = 32,
}: {
  data: DailyPoint[];
  color: string;
  height?: number;
}) {
  const id = `sp-${color.replace(/[^a-z]/gi, "")}`;
  const vals = data.map((d) => d.value).filter((v): v is number => v != null);
  if (vals.length < 2) return <span className="text-[12px] text-subtle">Insufficient data</span>;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.15 || 1;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[min - pad, max + pad]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            connectNulls={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const coverageStyle: Record<Coverage, { label: string; dot: string }> = {
  available: { label: "Available", dot: "bg-stable" },
  missing: { label: "Unavailable", dot: "bg-subtle" },
  partial: { label: "Partial coverage", dot: "bg-watch" },
  insufficient: { label: "Insufficient data", dot: "bg-subtle" },
  stale: { label: "Stale", dot: "bg-subtle" },
};

export function CoverageTag({ status }: { status: Coverage }) {
  const s = coverageStyle[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1"
    >
      {options.map((o) => (
        <Button
          variant="ghost"
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[9px] px-3.5 py-1.5 text-[13px] transition-all duration-200",
            value === o.value
              ? "bg-surface font-medium text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  format,
  unit,
}: {
  active?: boolean;
  payload?: { name: string; value: number | null; color: string; dataKey: string }[];
  label?: string | number;
  format?: (l: string | number) => string;
  unit?: string;
}) {
  const rows = (payload ?? []).filter(
    (p) => p.value != null && !["lower", "upper", "band"].includes(p.dataKey),
  );
  if (!active || !rows.length) return null;
  return (
    <div className="rounded-xl border border-hairline bg-popover px-3 py-2 shadow-float animate-in fade-in-0 duration-150">
      <div className="mb-1 text-[11.5px] text-muted-foreground">
        {format && label != null ? format(label) : label}
      </div>
      {rows.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[13px]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="num ml-auto pl-3 font-medium">
            {p.value}
            {unit && <span className="ml-0.5 text-muted-foreground"> {unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--subtle)", fontSize: 11.5 },
} as const;

export const fmtDay = (d: string | number) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
