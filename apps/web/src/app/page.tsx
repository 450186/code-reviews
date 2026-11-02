import { gqlFetch, getGraphqlUrl } from "@/lib/graphql";

// Always render on request so the page reflects the current DB contents.
export const dynamic = "force-dynamic";

type Greeting = {
  id: number;
  message: string;
  createdAt: string;
};

type HomeData = {
  hello: string;
  greetings: Greeting[];
};

const HOME_QUERY = /* GraphQL */ `
  query Home {
    hello
    greetings {
      id
      message
      createdAt
    }
  }
`;

async function loadHome(): Promise<
  { ok: true; data: HomeData } | { ok: false; error: string }
> {
  try {
    const data = await gqlFetch<HomeData>(HOME_QUERY);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function Home() {
  const result = await loadHome();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Code Reviews
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          {result.ok ? result.data.hello : "Hello, World!"}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Next.js frontend → GraphQL API → Node backend → SQLite via Prisma.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium">Greetings from the database</h2>

        {result.ok ? (
          result.data.greetings.length === 0 ? (
            <p className="text-zinc-500">
              No greetings yet. Run <code className="font-mono">npm run db:seed</code>.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {result.data.greetings.map((g) => (
                <li key={g.id} className="flex items-baseline justify-between gap-4 py-2">
                  <span>{g.message}</span>
                  <time
                    dateTime={g.createdAt}
                    className="shrink-0 font-mono text-xs text-zinc-500"
                  >
                    {new Date(g.createdAt).toLocaleString("en-GB")}
                  </time>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <p className="font-medium">Could not reach the GraphQL API.</p>
            <p className="mt-1 font-mono text-xs">{result.error}</p>
            <p className="mt-2">
              Expected it at <code className="font-mono">{getGraphqlUrl()}</code>. Is the API
              running?
            </p>
          </div>
        )}
      </section>

      <footer className="text-sm text-zinc-500">
        GraphiQL playground:{" "}
        <a
          className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
          href="http://localhost:4000/graphql"
          target="_blank"
          rel="noreferrer"
        >
          http://localhost:4000/graphql
        </a>
      </footer>
    </main>
  );
}
