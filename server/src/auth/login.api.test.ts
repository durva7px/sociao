import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { hashPassword } from "./password.js";

// Log in, Log out and "who am I" (AUTH-20, AUTH-24, AUTH-25, AUTH-26, GEN-06).

const app = createApp();
const SESSION_COOKIE = "sociao_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const INCORRECT = { error: "Incorrect email or password" };

const PASSWORD = "Sunset#2024";
let passwordHash: string;

/** Pulls our Session cookie out of the Set-Cookie headers. */
function sessionCookie(res: request.Response): string | undefined {
  const raw = res.headers["set-cookie"] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
}

beforeAll(async () => {
  // bcrypt is deliberately slow, so hash once and reuse.
  passwordHash = await hashPassword(PASSWORD);
});

beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.create({
    data: { name: "Gustavo Levin", email: "gus@mail.com", username: "gustavo.levin", passwordHash },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

const login = (body: object) => request(app).post("/auth/login").send(body);

describe("POST /auth/login: success (AUTH-20, AUTH-25)", () => {
  it("returns 200 with the User's public details", async () => {
    const res = await login({ email: "gus@mail.com", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: { id: expect.any(String), name: "Gustavo Levin", email: "gus@mail.com", username: "gustavo.levin" },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it("matches the email regardless of case and spaces (D-014)", async () => {
    const res = await login({ email: "  GUS@Mail.com ", password: PASSWORD });

    expect(res.status).toBe(200);
  });

  it("creates a 7-day Session and sets the httpOnly cookie to its id", async () => {
    const before = Date.now();
    const res = await login({ email: "gus@mail.com", password: PASSWORD });

    const session = await prisma.session.findFirstOrThrow();
    const expiresIn = session.expiresAt.getTime() - before;
    expect(expiresIn).toBeGreaterThan(SEVEN_DAYS_MS - 60_000);
    expect(expiresIn).toBeLessThan(SEVEN_DAYS_MS + 60_000);

    const cookie = sessionCookie(res);
    expect(cookie).toContain(`${SESSION_COOKIE}=${session.id};`);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("allows several Sessions at once (e.g. phone and laptop)", async () => {
    await login({ email: "gus@mail.com", password: PASSWORD });
    await login({ email: "gus@mail.com", password: PASSWORD });

    expect(await prisma.session.count()).toBe(2);
  });
});

describe("POST /auth/login: rejected (AUTH-24, D-015)", () => {
  it("rejects a wrong password with the generic message", async () => {
    const res = await login({ email: "gus@mail.com", password: "Sunset#2025" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INCORRECT);
  });

  it("gives an unknown email exactly the same response as a wrong password", async () => {
    const res = await login({ email: "nobody@mail.com", password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INCORRECT);
  });

  it("is case-sensitive for the password", async () => {
    const res = await login({ email: "gus@mail.com", password: PASSWORD.toLowerCase() });

    expect(res.status).toBe(401);
  });

  it("treats missing or non-text fields as incorrect rather than crashing", async () => {
    for (const body of [{}, { email: "gus@mail.com" }, { email: 42, password: ["x"] }]) {
      const res = await login(body);
      expect(res.status, JSON.stringify(body)).toBe(401);
      expect(res.body).toEqual(INCORRECT);
    }
  });

  it("creates no Session and sets no cookie when rejected", async () => {
    const res = await login({ email: "gus@mail.com", password: "wrong" });

    expect(sessionCookie(res)).toBeUndefined();
    expect(await prisma.session.count()).toBe(0);
  });
});

describe("GET /auth/me (GEN-06 building block)", () => {
  it("returns the logged-in User", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/login").send({ email: "gus@mail.com", password: PASSWORD });

    const res = await agent.get("/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: "Gustavo Levin", username: "gustavo.levin" });
  });

  it("returns 401 with no cookie", async () => {
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
  });

  it("returns 401 for a Session id that doesn't exist", async () => {
    const res = await request(app).get("/auth/me").set("Cookie", `${SESSION_COOKIE}=made-up-id`);

    expect(res.status).toBe(401);
  });

  it("returns 401 for an expired Session and deletes it (D-016)", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "gus@mail.com" } });
    await prisma.session.create({
      data: { id: "expired-session", userId: user.id, expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app).get("/auth/me").set("Cookie", `${SESSION_COOKIE}=expired-session`);

    expect(res.status).toBe(401);
    expect(await prisma.session.count()).toBe(0);
  });
});

describe("POST /auth/logout (AUTH-26)", () => {
  it("deletes the current Session, so the cookie no longer works", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/login").send({ email: "gus@mail.com", password: PASSWORD });

    const res = await agent.post("/auth/logout");

    expect(res.status).toBe(204);
    expect(await prisma.session.count()).toBe(0);
    expect((await agent.get("/auth/me")).status).toBe(401);
  });

  it("clears the cookie in the browser", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/login").send({ email: "gus@mail.com", password: PASSWORD });

    const res = await agent.post("/auth/logout");

    const cookie = sessionCookie(res);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it("only ends this Session; other devices stay logged in", async () => {
    const phone = request.agent(app);
    const laptop = request.agent(app);
    await phone.post("/auth/login").send({ email: "gus@mail.com", password: PASSWORD });
    await laptop.post("/auth/login").send({ email: "gus@mail.com", password: PASSWORD });

    await phone.post("/auth/logout");

    expect((await laptop.get("/auth/me")).status).toBe(200);
    expect(await prisma.session.count()).toBe(1);
  });

  it("succeeds even when not logged in (logging out twice is harmless)", async () => {
    const res = await request(app).post("/auth/logout");

    expect(res.status).toBe(204);
  });
});
