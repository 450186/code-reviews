# Technical test: Application Support Engineer

Thanks for taking the time to do this. The test is based on a small but complete
application: a Next.js frontend, a GraphQL API on Node.js, and a SQLite database
managed with Prisma, all in TypeScript. It's populated with public World Bank data
and has a dashboard that charts it.

You may use AI tools as much or as little as you like.

## Before you start

1. Clone the repository and get it running. The [README](./README.md) covers both
   Docker and local setups, the project layout, and the GraphQL API.
2. Have a look around. The home page at http://localhost:3000 shows what's in the
   database, the dashboard is at http://localhost:3000/dashboard, and GraphiQL at
   http://localhost:4000/graphql lets you explore the API.

Work on a branch and raise a pull request against `main` when you're done.

## The task: saved views

The dashboard is configured entirely through its URL: which indicator is shown, the
year, the countries on the line chart, the ranking order and the highlighted region.
Users have asked to be able to **save a configuration they've set up and come back
to it later**, rather than bookmarking long URLs.

Build this feature end to end. There are no designs; use your judgement to make it
fit the existing look of the app.

### What it should do

- **Save.** From the dashboard, a user can save the current configuration under a
  name of their choosing.
- **List and open.** The dashboard shows the saved views. Opening one restores
  exactly the configuration that was saved.
- **Delete.** A user can remove a saved view they no longer need.
- **Know where you are.** When the dashboard is showing a saved view, it says so,
  including the view's name.
- **Home page.** The home page shows the saved views (or at least the most recent
  few) with links that open them.

### Requirements

- Saved views are stored in the SQLite database and survive a restart of the app,
  including `docker compose down` and `up` (the `sqlite-data` volume persists).
- Saved views are available through the GraphQL API, for both reading and writing,
  and the new parts of the schema carry descriptions like the existing ones.
- A fresh install has something to show: seed two or three example views alongside
  the existing greetings.
- Names are required, are trimmed of surrounding whitespace, are at most 60
  characters, and no two views can share a name. Breaking any of these rules gives
  the user a clear message, not a crash or a silent failure.
- A saved view stores everything needed to recreate the dashboard URL, including
  the list of countries and the highlighted region (if any).
- Deleting a view asks for confirmation first.
- Opening a view that can no longer be shown, for example because the indicator it
  refers to is no longer in the database, fails gracefully with a message rather
  than an error page.
- `docker compose up --build` works on a clean machine with no manual steps.
- `npm run typecheck` and `npm run lint` pass.

### Out of scope

- User accounts or permissions. Saved views are shared by everyone using the app.
- Editing a saved view in place. Deleting and saving again is fine.
- Any change to how the World Bank data is ingested.

## Questions

If something in the brief is ambiguous, make a sensible decision and note it. If
you're blocked on something in the setup, get in touch.
