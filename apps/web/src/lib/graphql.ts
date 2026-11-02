/**
 * Minimal GraphQL fetch helper. No client library needed for a few queries.
 *
 * On the server (React Server Components, route handlers) we use GRAPHQL_URL,
 * which inside Docker Compose points at the `api` service. In the browser we
 * use NEXT_PUBLIC_GRAPHQL_URL, which must be reachable from the user's machine.
 */

export function getGraphqlUrl(): string {
  if (typeof window === "undefined") {
    return process.env.GRAPHQL_URL ?? "http://localhost:4000/graphql";
  }
  return process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
}

type GraphqlResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(getGraphqlUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    // Always hit the API; don't let Next cache the response.
    cache: "no-store",
    ...init,
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed with HTTP ${res.status}`);
  }

  const json = (await res.json()) as GraphqlResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new Error("GraphQL response contained no data");
  }
  return json.data;
}
