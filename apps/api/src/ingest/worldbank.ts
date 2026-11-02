/**
 * Populate the SQLite database from the World Bank Indicators API.
 *
 *   npm run db:ingest -w apps/api            # skips if data already present
 *   npm run db:ingest -w apps/api -- --force # re-fetch everything
 *
 * Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 * No API key is required.
 */
import { prisma } from "../db.js";

const API_BASE = process.env.WORLD_BANK_API_URL ?? "https://api.worldbank.org/v2";
const FROM_YEAR = 1960;
const TO_YEAR = new Date().getUTCFullYear();

/** Indicators pulled into the database. Add a code here to ingest another series. */
export const INDICATOR_CODES = [
  "NY.GDP.PCAP.CD", // GDP per capita (current US$)
  "NY.GDP.MKTP.KD.ZG", // GDP growth (annual %)
  "SP.POP.TOTL", // Population, total
  "SP.DYN.LE00.IN", // Life expectancy at birth, total (years)
  "EN.GHG.CO2.PC.CE.AR5", // CO2 emissions per capita (t CO2e)
  "IT.NET.USER.ZS", // Individuals using the Internet (% of population)
  "SL.UEM.TOTL.ZS", // Unemployment (% of labour force)
] as const;

// ---------------------------------------------------------------------------
// World Bank response shapes (only the fields we use)
// ---------------------------------------------------------------------------

type WbPage = {
  page: number;
  pages: number;
  per_page: number | string;
  total: number;
};

type WbCountry = {
  id: string;
  iso2Code: string;
  name: string;
  region: { id: string; value: string };
  incomeLevel: { id: string; value: string };
  capitalCity: string;
  longitude: string;
  latitude: string;
};

type WbIndicator = {
  id: string;
  name: string;
  sourceNote: string;
  sourceOrganization: string;
};

type WbObservation = {
  countryiso3code: string;
  date: string;
  value: number | null;
};

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string, attempt = 1): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    if (attempt < 3 && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      return fetchJson<T>(url, attempt + 1);
    }
    throw new Error(`World Bank API ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

/** Walk every page of a paginated World Bank endpoint and concatenate the rows. */
async function fetchAllPages<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  let pages = 1;
  do {
    const qs = new URLSearchParams({ format: "json", per_page: "20000", page: String(page), ...params });
    const body = await fetchJson<[WbPage, T[] | null]>(`${API_BASE}/${path}?${qs}`);
    const [meta, data] = body;
    if (!Array.isArray(data)) break;
    rows.push(...data);
    pages = Number(meta.pages);
    page += 1;
  } while (page <= pages);
  return rows;
}

// ---------------------------------------------------------------------------
// Ingest steps
// ---------------------------------------------------------------------------

async function ingestCountries(): Promise<Set<string>> {
  const all = await fetchAllPages<WbCountry>("country");
  // Region id "NA" marks aggregates such as "World" or "Euro area".
  const countries = all.filter((c) => c.region.id !== "NA");

  await prisma.$transaction(
    countries.map((c) =>
      prisma.country.upsert({
        where: { code: c.id },
        create: toCountryRecord(c),
        update: toCountryRecord(c),
      }),
    ),
  );

  console.log(`Countries: ${countries.length} stored (${all.length - countries.length} aggregates skipped)`);
  return new Set(countries.map((c) => c.id));
}

function toCountryRecord(c: WbCountry) {
  return {
    code: c.id,
    iso2Code: c.iso2Code,
    name: c.name,
    region: c.region.value.trim(),
    regionCode: c.region.id,
    incomeLevel: c.incomeLevel.value.trim(),
    incomeLevelCode: c.incomeLevel.id,
    capitalCity: c.capitalCity || null,
    latitude: c.latitude ? Number(c.latitude) : null,
    longitude: c.longitude ? Number(c.longitude) : null,
  };
}

async function ingestIndicator(code: string, knownCountries: Set<string>): Promise<number> {
  const [meta] = await fetchAllPages<WbIndicator>(`indicator/${code}`);
  if (!meta) throw new Error(`Indicator ${code} not found`);

  await prisma.indicator.upsert({
    where: { code },
    create: {
      code,
      name: meta.name,
      sourceNote: meta.sourceNote || null,
      sourceOrganization: meta.sourceOrganization || null,
    },
    update: {
      name: meta.name,
      sourceNote: meta.sourceNote || null,
      sourceOrganization: meta.sourceOrganization || null,
    },
  });

  const raw = await fetchAllPages<WbObservation>(`country/all/indicator/${code}`, {
    date: `${FROM_YEAR}:${TO_YEAR}`,
  });

  const rows = raw
    .filter((o) => o.value !== null && knownCountries.has(o.countryiso3code))
    .map((o) => ({
      countryCode: o.countryiso3code,
      indicatorCode: code,
      year: Number(o.date),
      value: o.value as number,
    }));

  // Replace the series wholesale so re-running never leaves stale values behind.
  await prisma.$transaction(async (tx) => {
    await tx.observation.deleteMany({ where: { indicatorCode: code } });
    for (const chunk of chunked(rows, 2000)) {
      await tx.observation.createMany({ data: chunk });
    }
    await tx.indicator.update({ where: { code }, data: { lastFetchedAt: new Date() } });
  });

  console.log(`  ${code.padEnd(22)} ${meta.name} -> ${rows.length} observations`);
  return rows.length;
}

function* chunked<T>(items: T[], size: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += size) {
    yield items.slice(i, i + size);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function ingestWorldBank(opts: { force?: boolean } = {}): Promise<void> {
  const existing = await prisma.observation.count();
  if (existing > 0 && !opts.force) {
    console.log(`Database already contains ${existing} observations. Use --force to re-ingest.`);
    return;
  }

  console.log(`Fetching from ${API_BASE} (${FROM_YEAR}-${TO_YEAR})...`);
  const started = Date.now();

  const knownCountries = await ingestCountries();

  let total = 0;
  console.log(`Indicators (${INDICATOR_CODES.length}):`);
  for (const code of INDICATOR_CODES) {
    total += await ingestIndicator(code, knownCountries);
  }

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Done: ${total} observations across ${INDICATOR_CODES.length} indicators in ${secs}s`);
}

const isDirectRun = process.argv[1]?.endsWith("worldbank.ts") || process.argv[1]?.endsWith("worldbank.js");
if (isDirectRun) {
  ingestWorldBank({ force: process.argv.includes("--force") })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
