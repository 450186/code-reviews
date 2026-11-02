import type { ReactNode } from "react";

/**
 * Wraps a chart with a title, optional subtitle and a collapsible table view so
 * the data is always available without relying on colour.
 */
export function ChartCard({
  title,
  subtitle,
  children,
  table,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  table?: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-base font-medium">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      </header>
      <div className="min-w-0">{children}</div>
      {table && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            View as table
          </summary>
          <div className="mt-3 max-h-72 overflow-auto">{table}</div>
        </details>
      )}
    </section>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-zinc-200 text-sm text-zinc-500 dark:border-zinc-800">
      {message}
    </div>
  );
}
