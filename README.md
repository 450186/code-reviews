# code-reviews

A small full-stack TypeScript application used for the **Application Support Engineer** technical test.

| Layer    | Tech                                              | Where              |
|----------|---------------------------------------------------|--------------------|
| Frontend | [Next.js](https://nextjs.org/) 16 (App Router), React 19, Tailwind 4 | `apps/web` |
| API      | [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) on Node.js | `apps/api` |
| Database | SQLite via [Prisma](https://www.prisma.io/) ORM   | `apps/api/prisma`  |
| Data     | [World Bank Indicators API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392) (no key needed) | `apps/api/src/ingest` |
| Infra    | Multi-stage `Dockerfile` + `docker-compose.yml`   | repo root          |

Request flow: **browser → Next.js (server component) → GraphQL API → Prisma → SQLite**.

## Prerequisites

Pick one:

- **Docker** (Docker Desktop or compatible) – nothing else required, or
- **Node.js 24+** and npm 11+ (an `.nvmrc` is provided; `nvm use`)

## Quick start with Docker

```bash
docker compose up --build
```

- Web app: http://localhost:3000
- GraphQL API + GraphiQL playground: http://localhost:4000/graphql
- API health check: http://localhost:4000/health

The API container runs `prisma migrate deploy`, seeds the database and ingests the World Bank dataset on start-up (the ingest is skipped if data is already present). The SQLite file lives in the `sqlite-data` volume at `/data/app.db`. To wipe it:

```bash
docker compose down -v
```

## Quick start without Docker

```bash
npm install                      # installs both workspaces
npm run db:migrate               # creates apps/api/prisma/dev.db and applies migrations
npm run db:seed                  # inserts a few greetings (safe to re-run)
npm run db:ingest                # pulls ~75k rows from the World Bank API (~10s, safe to re-run)
npm run dev                      # starts API (:4000) and web (:3000) together
```

Environment files are already provided with sensible local defaults:

- `apps/api/.env` – `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `WORLD_BANK_API_URL`
- `apps/web/.env.local` – `GRAPHQL_URL` (server-side) and `NEXT_PUBLIC_GRAPHQL_URL` (browser)

If they are missing, copy the matching `.env.example`.

## Useful scripts

Run from the repo root:

| Script               | What it does                                                   |
|----------------------|----------------------------------------------------------------|
| `npm run dev`        | Start API and web in watch mode                                |
| `npm run build`      | Build both apps                                                |
| `npm run start`      | Run both production builds                                     |
| `npm run typecheck`  | `tsc --noEmit` across both apps                                |
| `npm run lint`       | ESLint for the web app                                         |
| `npm run db:migrate` | `prisma migrate dev` (create/apply migrations locally)         |
| `npm run db:seed`    | Seed the database with greetings                               |
| `npm run db:ingest`  | Fetch World Bank data into SQLite (`-- --force` to re-fetch)   |
| `npm run db:studio`  | Open Prisma Studio to browse the SQLite data                   |

Workspace-specific scripts can be run with `npm run <script> -w apps/api` or `-w apps/web`.

## Project layout

```
.
├── apps/
│   ├── api/                 # Node.js GraphQL API
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts     # HTTP server, CORS, health check
│   │       ├── schema.ts    # GraphQL typeDefs + resolvers
│   │       ├── db.ts        # Prisma client
│   │       └── ingest/
│   │           └── worldbank.ts  # Pulls countries + indicators from the World Bank API
│   └── web/                 # Next.js frontend
│       └── src/
│           ├── app/page.tsx # Hello world page, queries the API
│           └── lib/graphql.ts
├── docker/api-entrypoint.sh # migrate + seed, then start API
├── Dockerfile               # targets: api, web
├── docker-compose.yml
└── package.json             # npm workspaces root
```

## The data

`npm run db:ingest` pulls three things from the World Bank API into SQLite:

| Table         | Rows    | What it holds                                                      |
|---------------|---------|--------------------------------------------------------------------|
| `Country`     | 217     | ISO codes, name, region, income level, capital, lat/long. Aggregates such as "World" or "Euro area" are excluded. |
| `Indicator`   | 7       | Code, name and description of each series (see list below)        |
| `Observation` | ~75,000 | One `value` per country × indicator × year (1960 → present). Null values from the API are not stored. |

Indicators ingested (edit `INDICATOR_CODES` in `apps/api/src/ingest/worldbank.ts` to change):

| Code                   | Name                                                  |
|------------------------|-------------------------------------------------------|
| `NY.GDP.PCAP.CD`       | GDP per capita (current US$)                          |
| `NY.GDP.MKTP.KD.ZG`    | GDP growth (annual %)                                 |
| `SP.POP.TOTL`          | Population, total                                     |
| `SP.DYN.LE00.IN`       | Life expectancy at birth, total (years)               |
| `EN.GHG.CO2.PC.CE.AR5` | CO2 emissions per capita (t CO2e)                     |
| `IT.NET.USER.ZS`       | Individuals using the Internet (% of population)      |
| `SL.UEM.TOTL.ZS`       | Unemployment, total (% of labour force)               |

Run `npm run db:studio` to browse the tables in Prisma Studio.

## GraphQL API

Explore interactively in GraphiQL at http://localhost:4000/graphql. The main queries:

```graphql
type Query {
  dataSummary: DataSummary!                                  # row counts, regions, income levels, last ingest time
  countries(region: String, incomeLevel: String): [Country!]!
  country(code: String!): Country                            # ISO3, e.g. "GBR"
  indicators: [Indicator!]!
  indicator(code: String!): Indicator
  observations(indicatorCode: String!, countryCodes: [String!], fromYear: Int, toYear: Int): [Observation!]!
  ranking(indicatorCode: String!, year: Int!, limit: Int = 10, order: SortOrder = DESC): [Observation!]!
  hello: String!
  greetings: [Greeting!]!
}
```

`Country.observations(indicatorCode, fromYear, toYear)` and `Observation.country` / `Observation.indicator` let you walk the graph in either direction.

Examples:

```graphql
# UK GDP per capita since 2015
{
  country(code: "GBR") {
    name
    observations(indicatorCode: "NY.GDP.PCAP.CD", fromYear: 2015) {
      year
      value
    }
  }
}

# Ten countries with the highest life expectancy in 2022
{
  ranking(indicatorCode: "SP.DYN.LE00.IN", year: 2022, limit: 10) {
    value
    country { name region }
  }
}
```

With curl:

```bash
curl -s http://localhost:4000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ dataSummary { countries indicators observations } }"}'
```
