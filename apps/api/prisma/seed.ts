import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

// Load apps/api/.env when running locally; ignored when absent (Docker sets the variables directly).
try {
  process.loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
} catch {
  // rely on the process environment
}

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.greeting.count();
  if (count > 0) {
    console.log(`Database already seeded (${count} greetings). Skipping.`);
    return;
  }

  await prisma.greeting.createMany({
    data: [
      { message: "Hello, World!" },
      { message: "Hello from SQLite via Prisma" },
      { message: "Hello from the GraphQL API" },
    ],
  });

  console.log("Seeded 3 greetings.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
