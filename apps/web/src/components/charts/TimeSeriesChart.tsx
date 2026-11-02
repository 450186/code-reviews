"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/lib/chart-theme";
import { formatAxisValue, formatIndicatorValue } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import type { Observation } from "@/lib/dashboard";

type Props = {
  indicatorCode: string;
  /** Country codes in display order; colour slot follows this order. */
  countries: { code: string; name: string }[];
  observations: Observation[];
};

type Row = { year: number } & Record<string, number | undefined>;

/** Pivot long observations into one row per year with a column per country. */
function pivot(observations: Observation[]): Row[] {
  const byYear = new Map<number, Row>();
  for (const o of observations) {
    const row = byYear.get(o.year) ?? { year: o.year };
    row[o.countryCode] = o.value;
    byYear.set(o.year, row);
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

export function TimeSeriesChart({ indicatorCode, countries, observations }: Props) {
  const theme = useChartTheme();
  const data = pivot(observations);
  const nameOf = Object.fromEntries(countries.map((c) => [c.code, c.name]));
  const order = countries.map((c) => c.code);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={{ stroke: theme.axis }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
          tickFormatter={(v: number) => formatAxisValue(indicatorCode, v)}
        />
        <Tooltip
          cursor={{ stroke: theme.axis, strokeDasharray: "3 3" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                theme={theme}
                title={String(label)}
                rows={[...payload]
                  .filter((p) => typeof p.value === "number")
                  .sort((a, b) => order.indexOf(String(a.dataKey)) - order.indexOf(String(b.dataKey)))
                  .map((p) => ({
                    label: nameOf[String(p.dataKey)] ?? String(p.dataKey),
                    value: formatIndicatorValue(indicatorCode, p.value as number),
                    color: String(p.stroke),
                  }))}
              />
            ) : null
          }
        />
        <Legend
          itemSorter={null}
          iconType="plainline"
          wrapperStyle={{ fontSize: 12, color: theme.textSecondary }}
          formatter={(code: string) => nameOf[code] ?? code}
        />
        {countries.map((c, i) => (
          <Line
            key={c.code}
            type="monotone"
            dataKey={c.code}
            stroke={theme.series[i]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: theme.surface }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
