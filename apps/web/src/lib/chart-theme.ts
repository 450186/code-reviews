"use client";

import { useEffect, useState } from "react";

/**
 * Chart colour tokens. Categorical slots are assigned in this fixed order and
 * never cycled, so a given series keeps its colour when others are added or
 * removed. Light and dark values are separately tuned for their surfaces.
 */
export type ChartTheme = {
  mode: "light" | "dark";
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  grid: string;
  axis: string;
  /** Muted fill for de-emphasised marks (e.g. unselected scatter dots). */
  muted: string;
  /** Fixed categorical order: blue, orange, aqua, yellow, magenta, green, violet, red. */
  series: readonly string[];
};

export const LIGHT_THEME: ChartTheme = {
  mode: "light",
  surface: "#fcfcfb",
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  textMuted: "#898781",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#c3c2b7",
  series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
};

export const DARK_THEME: ChartTheme = {
  mode: "dark",
  surface: "#1a1a19",
  textPrimary: "#f0efec",
  textSecondary: "#c3c2b7",
  textMuted: "#898781",
  grid: "#2c2c2a",
  axis: "#383835",
  muted: "#4a4a47",
  series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

/** Maximum number of categorical series a single chart may show. */
export const MAX_SERIES = LIGHT_THEME.series.length;

/** Returns the theme matching the OS colour scheme and updates when it changes. */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(LIGHT_THEME);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setTheme(mq.matches ? DARK_THEME : LIGHT_THEME);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return theme;
}
