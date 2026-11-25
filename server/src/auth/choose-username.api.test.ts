import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { checkUsername } from "./username.rules.js";
import { verifyPassword } from "./password.js";

// Choose Username = Sign up step 2 (D-011).
// The client sends everything from step 1 plus the Username in ONE request.
// Only now is the User created, and they are logged in straight away (AUTH-11).

const app = createApp();
const SESSION_COOKIE = "sociao_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const valid = {
  name: "Gustavo Levin",
  email: "gus@mail.com",
  password: "Sunset#2024",
  username: "gustavo.levin",
};

const signup = (body: object) => request(app).post("/auth/signup").send(body);
const suggest = (name: string) => request(app).get("/auth/username-suggestions").query({ name });

/** Creates a User directly, bypassing the API, to set up "already taken" cases. */
const existingUser = (data: { email: string; username: string }) =>
  prisma.user.create({ data: { name: "Existing", passwordHash: "x", ...data } });

/** Pulls our Session cookie out of the Set-Cookie headers. */
function sessionCookie(res: request.Response): string | undefined {
  const raw = res.headers["set-cookie"] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
}

beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /auth/username-suggestions (AUTH-10)", () => {
  it("returns 3 suggestions in the agreed order when all are free", async () => {
    const res = await suggest("Gustavo Levin");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ suggestions: ["gustavo.levin", "gustavo_levin", "gustavolevin"] });
  });

  it("skips Usernames that are already taken", async () => {
    await existingUser({ email: "a@mail.com", username: "gustavo.levin" });
    await existingUser({ email: "b@mail.com", username: "gustavolevin" });

    const res = await suggest("Gustavo Levin");

    expect(res.body.suggestions).toEqual(["gustavo_levin", "glevin", expect.stringMatching(/^gustavo\.levin\d{2}$/)]);
  });

  it("always returns 3 valid, distinct, free Usernames, even for awkward Names", async () => {
    for (const name of ["Al", "Ö", "!!!"]) {
      const res = await suggest(name);

      expect(res.status, name).toBe(200);
      expect(res.body.suggestions, name).toHaveLength(3);
      expect(new Set(res.body.suggestions).size, name).toBe(3);
      for (const s of res.body.suggestions) expect(checkUsername(s), `${name} -> ${s}`).toEqual([]);
    }
  });

  it("returns 400 when no Name is given", async () => {
    const res = await request(app).get("/auth/username-suggestions");

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/signup: success (AUTH-01, AUTH-11)", () => {
  it("creates the User and returns 201 with their public details only", async () => {
    const res = await signup(valid);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      user: { id: expect.any(String), name: "Gustavo Levin", email: "gus@mail.com", username: "gustavo.levin" },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it("stores the email normalised and the Name trimmed (D-014)", async () => {
    await signup({ ...valid, name: "  Gustavo Levin ", email: "  GUS@Mail.com " });

    const user = await prisma.user.findUniqueOrThrow({ where: { username: "gustavo.levin" } });
    expect(user.email).toBe("gus@mail.com");
    expect(user.name).toBe("Gustavo Levin");
  });

  it("stores only a hash of the password (AUTH-06)", async () => {
    await signup(valid);

    const user = await prisma.user.findUniqueOrThrow({ where: { username: "gustavo.levin" } });
    expect(user.passwordHash).not.toBe(valid.password);
    expect(await verifyPassword(valid.password, user.passwordHash)).toBe(true);
  });

  it("logs the User in: creates a Session lasting 7 days (D-016)", async () => {
    const before = Date.now();
    await signup(valid);

    const sessions = await prisma.session.findMany({ include: { user: true } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].user.username).toBe("gustavo.levin");

    const expiresIn = sessions[0].expiresAt.getTime() - before;
    expect(expiresIn).toBeGreaterThan(SEVEN_DAYS_MS - 60_000);
    expect(expiresIn).toBeLessThan(SEVEN_DAYS_MS + 60_000);
  });

  it("sets an httpOnly Session cookie holding the Session id (D-005)", async () => {
    const res = await signup(valid);

    const cookie = sessionCookie(res);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);

    const session = await prisma.session.findFirstOrThrow();
    expect(cookie).toContain(`${SESSION_COOKIE}=${session.id};`);
  });

  it("uses a long, random Session id", async () => {
    await signup(valid);

    const session = await prisma.session.findFirstOrThrow();
    expect(session.id.length).toBeGreaterThanOrEqual(32);
  });
});

describe("POST /auth/signup: rejected (nothing is stored)", () => {
  async function expectNothingStored() {
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.session.count()).toBe(0);
  }

  it("requires a Username: without one, no account exists (AUTH-01a, AUTH-07)", async () => {
    const { username: _omitted, ...withoutUsername } = valid;

    const res = await signup(withoutUsername);

    expect(res.status).toBe(400);
    expect(res.body.errors.username).toBeDefined();
    await expectNothingStored();
  });

  it("rejects an invalid Username (AUTH-08)", async () => {
    const res = await signup({ ...valid, username: "Gus..Levin" });

    expect(res.status).toBe(400);
    expect(res.body.errors.username).toBeDefined();
    await expectNothingStored();
  });

  it("re-checks the step 1 fields: a client could skip step 1 (D-011)", async () => {
    const res = await signup({ ...valid, email: "nope", password: "weak" });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors).sort()).toEqual(["email", "password"]);
    await expectNothingStored();
  });

  it("rejects a password containing the chosen Username (AUTH-05)", async () => {
    const res = await signup({ ...valid, username: "sunset", password: "Sunset#2024" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual({ password: "Password can't contain your username" });
    await expectNothingStored();
  });

  it("rejects a taken Username and offers fresh suggestions (AUTH-09)", async () => {
    await existingUser({ email: "other@mail.com", username: "gustavo.levin" });

    const res = await signup(valid);

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual({ username: "That username is taken" });
    expect(res.body.suggestions).toHaveLength(3);
    expect(res.body.suggestions).not.toContain("gustavo.levin");
    expect(await prisma.user.count()).toBe(1);
  });

  it("rejects an email taken since step 1 (AUTH-03)", async () => {
    await existingUser({ email: "gus@mail.com", username: "someone" });

    const res = await signup(valid);

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual({ email: "An account with this email already exists" });
    expect(await prisma.user.count()).toBe(1);
  });

  it("handles two simultaneous sign-ups for the same Username: one wins, the other gets a clean 400", async () => {
    const [a, b] = await Promise.all([
      signup(valid),
      signup({ ...valid, email: "other@mail.com" }),
    ]);

    expect([a.status, b.status].sort()).toEqual([201, 400]);
    const loser = a.status === 400 ? a : b;
    expect(loser.body.errors).toEqual({ username: "That username is taken" });
    expect(await prisma.user.count()).toBe(1);
  });
});
