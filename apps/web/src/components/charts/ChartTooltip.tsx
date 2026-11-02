"use client";

import type { ChartTheme } from "@/lib/chart-theme";

export type TooltipRow = { label: string; value: string; color?: string };

/** Shared tooltip body so every chart's hover layer looks the same. */
export function ChartTooltip({ theme, title, rows }: { theme: ChartTheme; title: string; rows: TooltipRow[] }) {
  return (
    <div
      className="rounded-md border px-3 py-2 text-xs shadow-md"
      style={{ background: theme.surface, borderColor: theme.axis, color: theme.textPrimary }}
    >
      <div className="mb-1 font-medium">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: theme.textSecondary }}>
            {r.color && <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
