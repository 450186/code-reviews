/** A plain table used for the "view as table" fallback under each chart. */
export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white text-left uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
        <tr>
          {columns.map((c, i) => (
            <th key={c} className={`pb-2 font-medium ${i > 0 ? "text-right" : ""}`}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {rows.map((r, ri) => (
          <tr key={ri}>
            {r.map((cell, ci) => (
              <td key={ci} className={`py-1 ${ci > 0 ? "text-right tabular-nums" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
