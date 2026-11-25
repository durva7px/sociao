import { execSync } from "node:child_process";

// Runs once before the test suite: brings the test database up to the latest migration.
export default function setup() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("sociao_test")) {
    throw new Error(`Refusing to run tests against a non-test database: ${url || "(unset)"}`);
  }
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
}
