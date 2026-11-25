import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";

// Create Account = Sign up step 1 (D-011).
// POST /auth/signup/check validates Name, email and password and STORES NOTHING.
// Runs against the separate test database (sociao_test).

const app = createApp();
const check = (body: object) => request(app).post("/auth/signup/check").send(body);

const valid = { name: "Gustavo Levin", email: "gus@mail.com", password: "Sunset#2024" };

beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /auth/signup/check", () => {
  it("accepts valid details with 200 { ok: true }", async () => {
    const res = await check(valid);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("stores nothing, even when the details are valid (AUTH-01a)", async () => {
    await check(valid);

    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.session.count()).toBe(0);
  });

  it("does not set a Session cookie (the User isn't logged in until step 2)", async () => {
    const res = await check(valid);

    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("returns 400 with one message per invalid field", async () => {
    const res = await check({ name: "", email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      errors: {
        name: expect.any(String),
        email: expect.any(String),
        password: expect.any(String),
      },
    });
  });

  it("only reports the fields that are invalid", async () => {
    const res = await check({ ...valid, password: "sunset#2024" });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(["password"]);
  });

  it("treats missing fields as invalid rather than crashing", async () => {
    const res = await check({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors).sort()).toEqual(["email", "name", "password"]);
  });

  it("rejects a password containing the User's Name (AUTH-05)", async () => {
    const res = await check({ ...valid, password: "Levin#2024a" });

    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBeDefined();
  });

  it("rejects an email that already has an account (AUTH-03)", async () => {
    await prisma.user.create({
      data: { name: "Existing", email: "gus@mail.com", username: "existing", passwordHash: "x" },
    });

    const res = await check(valid);

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual({ email: "An account with this email already exists" });
  });

  it("matches existing emails regardless of case and spaces (D-014)", async () => {
    await prisma.user.create({
      data: { name: "Existing", email: "gus@mail.com", username: "existing", passwordHash: "x" },
    });

    const res = await check({ ...valid, email: "  GUS@Mail.com " });

    expect(res.body.errors?.email).toBe("An account with this email already exists");
  });

  it("never echoes the password back", async () => {
    const res = await check({ ...valid, password: "Zq9!x" });

    expect(JSON.stringify(res.body)).not.toContain("Zq9!x");
  });
});
