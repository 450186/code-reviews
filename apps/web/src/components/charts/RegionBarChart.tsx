"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/lib/chart-theme";
import { formatAxisValue, formatIndicatorValue } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import type { RegionAverage } from "@/lib/dashboard";

type Props = {
  indicatorCode: string;
  data: RegionAverage[];
};

/** Single-series horizontal bars: one hue, 4px rounded data end, 2px gap between bars. */
export function RegionBarChart({ indicatorCode, data }: Props) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }} barCategoryGap={2}>
        <CartesianGrid stroke={theme.grid} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={{ stroke: theme.axis }}
          tickLine={false}
          tickFormatter={(v: number) => formatAxisValue(indicatorCode, v)}
        />
        <YAxis
          type="category"
          dataKey="region"
          width={170}
          tick={{ fill: theme.textSecondary, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: theme.grid, opacity: 0.5 }}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as RegionAverage | undefined;
            return active && row ? (
              <ChartTooltip
                theme={theme}
                title={row.region}
                rows={[
                  { label: "Average", value: formatIndicatorValue(indicatorCode, row.average) },
                  { label: "Countries", value: String(row.countryCount) },
                ]}
              />
            ) : null;
          }}
        />
        <Bar dataKey="average" fill={theme.series[0]} radius={[0, 4, 4, 0]} maxBarSize={28} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
