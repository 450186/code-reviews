export function StatTile({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="truncate text-3xl font-semibold">{value}</span>
      {caption && <span className="text-xs text-zinc-500">{caption}</span>}
    </div>
  );
}
