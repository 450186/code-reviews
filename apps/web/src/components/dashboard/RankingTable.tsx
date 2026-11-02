import { formatIndicatorValue } from "@/lib/format";
import type { RankedObservation } from "@/lib/dashboard";

export function RankingTable({ indicatorCode, rows }: { indicatorCode: string; rows: RankedObservation[] }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No data for this indicator and year.</p>;
  }
  return (
    <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
        <tr>
          <th className="pb-2 pr-2 font-medium">#</th>
          <th className="pb-2 font-medium">Country</th>
          <th className="hidden pb-2 font-medium sm:table-cell">Region</th>
          <th className="pb-2 text-right font-medium">Value</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {rows.map((r, i) => (
          <tr key={r.country.code}>
            <td className="py-2 pr-2 tabular-nums text-zinc-500">{i + 1}</td>
            <td className="py-2">{r.country.name}</td>
            <td className="hidden py-2 text-zinc-500 sm:table-cell">{r.country.region}</td>
            <td className="whitespace-nowrap py-2 text-right tabular-nums">{formatIndicatorValue(indicatorCode, r.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
