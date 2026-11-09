import { fileURLToPath } from "node:url";

/**
 * Load apps/api/.env for local development. Variables already set in the
 * environment (as in Docker) take precedence, and a missing file is ignored.
 */
try {
  process.loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
} catch {
  // no .env file; rely on the process environment
}
