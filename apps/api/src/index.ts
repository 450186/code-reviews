import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema.js";
import { prisma } from "./db.js";

const port = Number(process.env.PORT ?? 4000);
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  cors: {
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  },
  // GraphiQL is handy for candidates exploring the API in the browser.
  graphiql: true,
});

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  return yoga(req, res);
});

server.listen(port, () => {
  console.log(`🚀 GraphQL API ready at http://localhost:${port}${yoga.graphqlEndpoint}`);
  console.log(`   Health check at http://localhost:${port}/health`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
