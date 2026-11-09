"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { gqlFetch } from "@/lib/graphql";
import { MAX_COUNTRIES, type CountryMeta, type IndicatorMeta, type SortOrder } from "@/lib/dashboard";
import { shortIndicatorName } from "@/lib/format";

export type SavedView = {
  id: number;
  name: string;
  indicatorCode: string;
  year: number;
  countryCodes: string[];
  sortOrder: SortOrder;
  region: string | null;
};

type Props = {
  savedViews: SavedView[] | null;
  indicators: IndicatorMeta[];
  countries: CountryMeta[];
  regions: string[];
  selected: {
    indicator: string;
    year: number;
    countries: string[];
    order: SortOrder;
    region: string | null;
  };
  yearOptions: number[];
};

const selectClass =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/**
 * Every control writes to the URL query string; the server component re-renders
 * with the new parameters. The save form uses the rendered selection.
 */
export function Controls({ indicators, countries, regions, selected, yearOptions, savedViews }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filterName, setFilterName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [openError, setOpenError] = useState("");

  async function saveFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveMessage("");
    setSaveError("");
    try {
      const { saveView } = await gqlFetch<{ saveView: { name: string } }>(
        `mutation SaveView($input: SaveViewInput!) {
          saveView(input: $input) { name }
        }`,
        {
          input: {
            name: filterName,
            indicatorCode: selected.indicator,
            year: selected.year,
            countryCodes: selected.countries,
            sortOrder: selected.order,
            region: selected.region,
          },
        },
      );
      setFilterName("");
      setSaveMessage(`Saved “${saveView.name}”.`);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the filter.");
    } finally {
      setSaving(false);
    }
  }

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("savedView");
      setOpenError("");
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  function openSavedView(id: string) {
    const view = savedViews?.find((entry) => String(entry.id) === id);
    if (!view) return;

    if (!indicators.some((indicator) => indicator.code === view.indicatorCode) ||
        view.countryCodes.some((code) => !countries.some((country) => country.code === code)) ||
        (view.region !== null && !regions.includes(view.region))) {
      setOpenError(`“${view.name}” uses data that is no longer available.`);
      return;
    }

    update({
      savedView: id,
      indicator: view.indicatorCode,
      year: String(view.year),
      countries: view.countryCodes.join(","),
      order: view.sortOrder,
      region: view.region,
    });
  }

  const activeView = savedViews?.find((view) =>
    String(view.id) === searchParams.get("savedView") &&
    view.indicatorCode === selected.indicator &&
    view.year === selected.year &&
    view.countryCodes.join(",") === selected.countries.join(",") &&
    view.sortOrder === selected.order &&
    view.region === selected.region
  );

  const countryName = (code: string) => countries.find((c) => c.code === code)?.name ?? code;
  const addable = countries.filter((c) => !selected.countries.includes(c.code));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Indicator
          <select
            className={selectClass}
            value={selected.indicator}
            // Changing indicator clears the year so the indicator's latest year is used.
            onChange={(e) => update({ indicator: e.target.value, year: null })}
          >
            {indicators.map((i) => (
              <option key={i.code} value={i.code}>
                {shortIndicatorName(i.code, i.name)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Year
          <select className={selectClass} value={selected.year} onChange={(e) => update({ year: e.target.value })}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Ranking
          <select className={selectClass} value={selected.order} onChange={(e) => update({ order: e.target.value })}>
            <option value="DESC">Highest first</option>
            <option value="ASC">Lowest first</option>
          </select>
        </label>

        <label className="flex min-w-0 max-w-full flex-col gap-1 text-xs text-zinc-500">
          Highlight region
          <select
            className={`${selectClass} max-w-full`}
            value={selected.region ?? ""}
            onChange={(e) => update({ region: e.target.value || null })}
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">Countries</span>
        {selected.countries.map((code) => (
          <span
            key={code}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs dark:border-zinc-700"
          >
            {countryName(code)}
            <button
              type="button"
              aria-label={`Remove ${countryName(code)}`}
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              onClick={() => update({ countries: selected.countries.filter((c) => c !== code).join(",") })}
            >
              ×
            </button>
          </span>
        ))}
        {selected.countries.length < MAX_COUNTRIES && (
          <select
            className={`${selectClass} py-0.5 text-xs`}
            value=""
            aria-label="Add country"
            onChange={(e) => e.target.value && update({ countries: [...selected.countries, e.target.value].join(",") })}
          >
            <option value="">+ Add country…</option>
            {addable.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {selected.countries.length >= MAX_COUNTRIES && (
          <span className="text-xs text-zinc-400">Maximum of {MAX_COUNTRIES} countries</span>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <label className="flex max-w-xs flex-col gap-1 text-xs text-zinc-500">
          Saved filters
          <select
            className={selectClass}
            value={activeView?.id ?? ""}
            onChange={(event) => openSavedView(event.target.value)}
            disabled={!savedViews?.length}
          >
            <option value="" disabled>
              {savedViews === null ? "Could not load saved filters" : savedViews.length ? "Choose a saved filter" : "No saved filters yet"}
            </option>
            {savedViews?.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
          </select>
        </label>
        {openError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{openError}</p>}
      </div>

      <form onSubmit={saveFilter} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Filter name
          <input
            className={selectClass}
            value={filterName}
            onChange={(event) => setFilterName(event.target.value)}
            required
            maxLength={60}
            disabled={saving}
          />
        </label>
        <button
          type="submit"
          className={`${selectClass} font-medium disabled:opacity-50`}
          disabled={saving || !filterName.trim()}
        >
          {saving ? "Saving…" : "Save filter"}
        </button>
      </form>
      {saveMessage && <p role="status" className="text-sm">{saveMessage}</p>}
      {saveError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{saveError}</p>}
    </div>
  );
}
