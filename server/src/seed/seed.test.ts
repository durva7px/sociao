import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { DEMO_PASSWORD, seed } from "./seed.js";

// GEN-03: the seed script loads at least 5 Users and 10 Posts covering text, image and video.

beforeAll(async () => {
  await seed(prisma);
}, 60_000);
afterAll(() => prisma.$disconnect());

describe("seed (GEN-03, D-027)", () => {
  it("loads at least 5 Users and 10 Posts", async () => {
    expect(await prisma.user.count()).toBeGreaterThanOrEqual(5);
    expect(await prisma.post.count()).toBeGreaterThanOrEqual(10);
  });

  it("includes text-only, image and video Posts", async () => {
    expect(await prisma.post.count({ where: { mediaType: null } })).toBeGreaterThan(0);
    expect(await prisma.post.count({ where: { mediaType: "IMAGE" } })).toBeGreaterThan(0);
    expect(await prisma.post.count({ where: { mediaType: "VIDEO" } })).toBeGreaterThan(0);
  });

  it("gives Posts different Like counts, including some liked by gustavo.levin", async () => {
    const counts = await prisma.post.findMany({ select: { _count: { select: { likes: true } } } });
    expect(new Set(counts.map((c) => c._count.likes)).size).toBeGreaterThan(1);

    const gustavo = await prisma.user.findUniqueOrThrow({ where: { username: "gustavo.levin" } });
    expect(await prisma.like.count({ where: { userId: gustavo.id } })).toBeGreaterThan(0);
  });

  it("creates Users who can log in with the documented demo password", async () => {
    const res = await request(createApp())
      .post("/auth/login")
      .send({ email: "gustavo.levin@sociao.test", password: DEMO_PASSWORD });

    expect(res.status).toBe(200);
  });

  it("is repeatable: seeding again gives the same totals, not duplicates", async () => {
    const before = { users: await prisma.user.count(), posts: await prisma.post.count(), likes: await prisma.like.count() };

    await seed(prisma);

    expect({ users: await prisma.user.count(), posts: await prisma.post.count(), likes: await prisma.like.count() }).toEqual(before);
  }, 60_000);
});
