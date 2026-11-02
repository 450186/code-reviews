# code-reviews

A small full-stack TypeScript application used for the **Application Support Engineer** technical test.

| Layer    | Tech                                              | Where              |
|----------|---------------------------------------------------|--------------------|
| Frontend | [Next.js](https://nextjs.org/) 16 (App Router), React 19, Tailwind 4 | `apps/web` |
| API      | [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) on Node.js | `apps/api` |
| Database | SQLite via [Prisma](https://www.prisma.io/) ORM   | `apps/api/prisma`  |
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

The API container runs `prisma migrate deploy` and seeds the database on start-up. The SQLite file lives in the `sqlite-data` volume at `/data/app.db`. To wipe it:

```bash
docker compose down -v
```

## Quick start without Docker

```bash
npm install                      # installs both workspaces
npm run db:migrate               # creates apps/api/prisma/dev.db and applies migrations
npm run db:seed                  # inserts a few greetings (safe to re-run)
npm run dev                      # starts API (:4000) and web (:3000) together
```

Environment files are already provided with sensible local defaults:

- `apps/api/.env` – `DATABASE_URL`, `PORT`, `CORS_ORIGIN`
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
| `npm run db:seed`    | Seed the database                                              |
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
│   │       └── db.ts        # Prisma client
│   └── web/                 # Next.js frontend
│       └── src/
│           ├── app/page.tsx # Hello world page, queries the API
│           └── lib/graphql.ts
├── docker/api-entrypoint.sh # migrate + seed, then start API
├── Dockerfile               # targets: api, web
├── docker-compose.yml
└── package.json             # npm workspaces root
```

## GraphQL schema

```graphql
type Greeting {
  id: Int!
  message: String!
  createdAt: String!
}

type Query {
  hello: String!
  greetings: [Greeting!]!
}

type Mutation {
  addGreeting(message: String!): Greeting!
}
```

Try it in GraphiQL at http://localhost:4000/graphql, or with curl:

```bash
curl -s http://localhost:4000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ hello greetings { id message createdAt } }"}'
```
