#!/usr/bin/env node
// One-shot local setup: copy env files if missing, migrate, seed and ingest.
// Run with: npm run setup
import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const envFiles = [
  ["apps/api/.env.example", "apps/api/.env"],
  ["apps/web/.env.example", "apps/web/.env.local"],
];

for (const [from, to] of envFiles) {
  if (existsSync(to)) {
    console.log(`✓ ${to} already exists`);
  } else {
    copyFileSync(from, to);
    console.log(`✓ created ${to} from ${from}`);
  }
}

const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

run("npm run db:deploy -w apps/api");          // apply committed migrations (non-interactive)
run("npm exec -w apps/api -- prisma generate");
run("npm run db:seed -w apps/api");
run("npm run db:ingest -w apps/api");

console.log("\nDone. Start the app with: npm run dev");
