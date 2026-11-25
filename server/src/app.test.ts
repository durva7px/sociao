import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

// Smoke test: proves the test runner, TypeScript and Express are wired together.
describe("GET /health", () => {
  it("responds with status ok", async () => {
    const res = await request(createApp()).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
