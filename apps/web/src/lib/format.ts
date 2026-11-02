/** Number formatting helpers shared by the dashboard widgets. */

const compact = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const oneDp = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const twoDp = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export function formatCompact(value: number): string {
  return compact.format(value);
}

/** Format an indicator value for display, choosing units from the indicator code. */
export function formatIndicatorValue(indicatorCode: string, value: number, opts: { compact?: boolean } = {}): string {
  switch (indicatorCode) {
    case "NY.GDP.PCAP.CD":
      return `$${opts.compact ? compact.format(value) : integer.format(value)}`;
    case "SP.POP.TOTL":
      return opts.compact ? compact.format(value) : integer.format(value);
    case "SP.DYN.LE00.IN":
      return `${oneDp.format(value)} yrs`;
    case "EN.GHG.CO2.PC.CE.AR5":
      return `${twoDp.format(value)} t`;
    case "NY.GDP.MKTP.KD.ZG":
    case "IT.NET.USER.ZS":
    case "SL.UEM.TOTL.ZS":
      return `${oneDp.format(value)}%`;
    default:
      return opts.compact ? compact.format(value) : oneDp.format(value);
  }
}

/** A short axis-friendly version of the value (no units beyond a currency sign). */
export function formatAxisValue(indicatorCode: string, value: number): string {
  switch (indicatorCode) {
    case "NY.GDP.PCAP.CD":
      return `$${compact.format(value)}`;
    case "NY.GDP.MKTP.KD.ZG":
    case "IT.NET.USER.ZS":
    case "SL.UEM.TOTL.ZS":
      return `${oneDp.format(value)}%`;
    default:
      return compact.format(value);
  }
}

/** Shorter indicator names for chart titles and dropdowns. */
export function shortIndicatorName(code: string, fallback: string): string {
  const names: Record<string, string> = {
    "NY.GDP.PCAP.CD": "GDP per capita (US$)",
    "NY.GDP.MKTP.KD.ZG": "GDP growth (%)",
    "SP.POP.TOTL": "Population",
    "SP.DYN.LE00.IN": "Life expectancy (years)",
    "EN.GHG.CO2.PC.CE.AR5": "CO2 emissions per capita (t)",
    "IT.NET.USER.ZS": "Internet users (%)",
    "SL.UEM.TOTL.ZS": "Unemployment (%)",
  };
  return names[code] ?? fallback;
}
