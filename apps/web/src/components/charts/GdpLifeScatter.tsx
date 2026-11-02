"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/lib/chart-theme";
import { formatCompact, formatIndicatorValue } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { GDP_PER_CAPITA, LIFE_EXPECTANCY, type ScatterPoint } from "@/lib/dashboard";

type Props = {
  points: ScatterPoint[];
  /** When set, countries in this region are highlighted and the rest are muted. */
  highlightRegion: string | null;
};

/**
 * One dot per country. With seven regions, hue alone can't carry identity, so the
 * chart uses a single series colour and lets the user highlight one region at a time.
 */
export function GdpLifeScatter({ points, highlightRegion }: Props) {
  const theme = useChartTheme();
  const highlighted = highlightRegion ? points.filter((p) => p.region === highlightRegion) : points;
  const rest = highlightRegion ? points.filter((p) => p.region !== highlightRegion) : [];

  const tooltip = (
    <Tooltip
      cursor={{ stroke: theme.axis, strokeDasharray: "3 3" }}
      content={({ active, payload }) => {
        const p = payload?.[0]?.payload as ScatterPoint | undefined;
        return active && p ? (
          <ChartTooltip
            theme={theme}
            title={p.name}
            rows={[
              { label: "Region", value: p.region },
              { label: "GDP per capita", value: formatIndicatorValue(GDP_PER_CAPITA, p.gdp) },
              { label: "Life expectancy", value: formatIndicatorValue(LIFE_EXPECTANCY, p.life) },
              ...(p.population != null ? [{ label: "Population", value: formatCompact(p.population) }] : []),
            ]}
          />
        ) : null;
      }}
    />
  );

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke={theme.grid} />
        <XAxis
          type="number"
          dataKey="gdp"
          scale="log"
          domain={["auto", "auto"]}
          name="GDP per capita"
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={{ stroke: theme.axis }}
          tickLine={false}
          tickFormatter={(v: number) => `$${formatCompact(v)}`}
          label={{ value: "GDP per capita (US$, log scale)", position: "insideBottom", offset: -4, fill: theme.textMuted, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="life"
          name="Life expectancy"
          domain={["auto", "auto"]}
          width={48}
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{ value: "Life expectancy (years)", angle: -90, position: "insideLeft", fill: theme.textMuted, fontSize: 11 }}
        />
        {tooltip}
        {rest.length > 0 && (
          <Scatter data={rest} fill={theme.muted} stroke={theme.surface} strokeWidth={1} isAnimationActive={false} />
        )}
        <Scatter data={highlighted} fill={theme.series[0]} stroke={theme.surface} strokeWidth={1} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
