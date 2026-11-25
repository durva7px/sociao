import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { cookieFor, follow, makeUser, resetDb } from "../test/helpers.js";

// PUT / DELETE /users/:username/follow (D-031, D-032). Both are idempotent.

const app = createApp();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function setup() {
  const me = await makeUser({ username: "me" });
  const gus = await makeUser({ username: "gus" });
  return { me, gus, cookie: await cookieFor(me.id) };
}

const followGus = (cookie: string) => request(app).put("/users/gus/follow").set("Cookie", cookie);
const unfollowGus = (cookie: string) => request(app).delete("/users/gus/follow").set("Cookie", cookie);

describe("PUT /users/:username/follow", () => {
  it("follows the User and returns their new counts", async () => {
    const { cookie } = await setup();

    const res = await followGus(cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ counts: { followers: 1, following: 0, posts: 0 }, followedByMe: true });
  });

  it("is idempotent: following twice still counts once", async () => {
    const { cookie } = await setup();

    await followGus(cookie);
    const res = await followGus(cookie);

    expect(res.body.counts.followers).toBe(1);
    expect(await prisma.follow.count()).toBe(1);
  });

  it("survives a double-tap: simultaneous follows count once", async () => {
    const { cookie } = await setup();

    const results = await Promise.all([followGus(cookie), followGus(cookie), followGus(cookie)]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(await prisma.follow.count()).toBe(1);
  });

  it("rejects following yourself with 400", async () => {
    const { cookie } = await setup();

    const res = await request(app).put("/users/me/follow").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(await prisma.follow.count()).toBe(0);
  });

  it("returns 404 for an unknown Username", async () => {
    const { cookie } = await setup();

    expect((await request(app).put("/users/nobody.here/follow").set("Cookie", cookie)).status).toBe(404);
  });

  it("requires a logged-in User", async () => {
    await setup();

    expect((await request(app).put("/users/gus/follow")).status).toBe(401);
  });
});

describe("DELETE /users/:username/follow", () => {
  it("unfollows the User", async () => {
    const { me, gus, cookie } = await setup();
    await follow(me.id, gus.id);

    const res = await unfollowGus(cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ counts: { followers: 0, following: 0, posts: 0 }, followedByMe: false });
  });

  it("is idempotent: unfollowing someone you don't follow is fine", async () => {
    const { cookie } = await setup();

    const res = await unfollowGus(cookie);

    expect(res.status).toBe(200);
    expect(res.body.followedByMe).toBe(false);
  });

  it("only removes your own Follow", async () => {
    const { gus, cookie } = await setup();
    const other = await makeUser();
    await follow(other.id, gus.id);

    const res = await unfollowGus(cookie);

    expect(res.body.counts.followers).toBe(1);
  });

  it("returns 404 for an unknown Username, and requires a logged-in User", async () => {
    const { cookie } = await setup();

    expect((await request(app).delete("/users/nobody.here/follow").set("Cookie", cookie)).status).toBe(404);
    expect((await request(app).delete("/users/gus/follow")).status).toBe(401);
  });
});

describe("Follows show up on the Profile", () => {
  it("the Profile reflects a Follow straight away", async () => {
    const { cookie } = await setup();
    await followGus(cookie);

    const res = await request(app).get("/users/gus").set("Cookie", cookie);

    expect(res.body).toMatchObject({ counts: { followers: 1 }, followedByMe: true });
  });
});
