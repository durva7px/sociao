import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Every test run uses the separate test database from .env.test.
// override: true so a DATABASE_URL from .env (dev data) can never leak into tests.
config({ path: ".env.test", override: true, quiet: true });

export default defineConfig({
  test: {
    globalSetup: ["./src/test/global-setup.ts"],
    // API tests share one database, so test files run one at a time.
    fileParallelism: false,
  },
});
