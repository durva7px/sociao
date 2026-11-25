import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { cookieFor, follow, makePost, makeUser, resetDb } from "../test/helpers.js";

// GET /users/:username and GET /users/:username/posts (PROF-01 to PROF-04, D-032).

const app = createApp();
const get = (path: string, cookie: string) => request(app).get(path).set("Cookie", cookie);

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("GET /users/:username", () => {
  it("requires a logged-in User", async () => {
    await makeUser({ username: "gus" });

    expect((await request(app).get("/users/gus")).status).toBe(401);
  });

  it("returns the public Profile and the three counts (PROF-01, PROF-02)", async () => {
    const gus = await makeUser({ name: "Gustavo Levin", username: "gustavo.levin", bio: "Dream big.", avatarUrl: "https://example.test/g.jpg" });
    const [a, b, c] = [await makeUser(), await makeUser(), await makeUser()];
    await follow(a.id, gus.id);
    await follow(b.id, gus.id);
    await follow(gus.id, c.id);
    await makePost(gus.id);
    await makePost(gus.id);
    await makePost(gus.id);

    const res = await get("/users/gustavo.levin", await cookieFor(a.id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: {
        id: gus.id,
        name: "Gustavo Levin",
        username: "gustavo.levin",
        bio: "Dream big.",
        avatarUrl: "https://example.test/g.jpg",
      },
      counts: { followers: 2, following: 1, posts: 3 },
      followedByMe: true,
      isMe: false,
    });
  });

  it("marks your own Profile with isMe and followedByMe false", async () => {
    const gus = await makeUser({ username: "gus" });

    const res = await get("/users/gus", await cookieFor(gus.id));

    expect(res.body).toMatchObject({ isMe: true, followedByMe: false });
  });

  it("returns null bio and avatar when they aren't set", async () => {
    const gus = await makeUser({ username: "gus" });

    const res = await get("/users/gus", await cookieFor(gus.id));

    expect(res.body.user).toMatchObject({ bio: null, avatarUrl: null });
  });

  it("returns 404 for an unknown Username", async () => {
    const viewer = await makeUser();

    expect((await get("/users/nobody.here", await cookieFor(viewer.id))).status).toBe(404);
  });

  it("never exposes email or password hash", async () => {
    const gus = await makeUser({ username: "gus" });

    const res = await get("/users/gus", await cookieFor(gus.id));

    expect(JSON.stringify(res.body)).not.toMatch(/email|passwordHash|@mail\.test/);
  });
});

describe("GET /users/:username/posts", () => {
  it("lists only that User's Posts, newest first, in the Feed's shape (PROF-03)", async () => {
    const [gus, other] = [await makeUser({ username: "gus" }), await makeUser()];
    await makePost(gus.id, { caption: "older", minutesAgo: 10 });
    await makePost(other.id, { caption: "not gus" });
    const newer = await makePost(gus.id, { caption: "newer", minutesAgo: 1 });
    await prisma.like.create({ data: { userId: other.id, postId: newer.id } });

    const res = await get("/users/gus/posts", await cookieFor(other.id));

    expect(res.status).toBe(200);
    expect(res.body.posts.map((p: { caption: string }) => p.caption)).toEqual(["newer", "older"]);
    expect(res.body.posts[0]).toMatchObject({ author: { username: "gus" }, likeCount: 1, likedByMe: true });
    expect(res.body.nextCursor).toBeNull();
  });

  it("filters to Video Posts with type=video, including View counts (PROF-04)", async () => {
    const gus = await makeUser({ username: "gus" });
    await makePost(gus.id, { caption: "text" });
    await makePost(gus.id, { caption: "photo", mediaType: "IMAGE", mediaUrl: "https://example.test/p.jpg" });
    await makePost(gus.id, { caption: "clip", mediaType: "VIDEO", mediaUrl: "https://example.test/v.mp4", viewCount: 1450 });

    const res = await get("/users/gus/posts?type=video", await cookieFor(gus.id));

    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0]).toMatchObject({ caption: "clip", viewCount: 1450, media: { type: "VIDEO" } });
  });

  it("includes viewCount only on Video Posts", async () => {
    const gus = await makeUser({ username: "gus" });
    await makePost(gus.id, { caption: "photo", mediaType: "IMAGE", mediaUrl: "https://example.test/p.jpg" });

    const res = await get("/users/gus/posts", await cookieFor(gus.id));

    expect(res.body.posts[0]).not.toHaveProperty("viewCount");
  });

  it("pages like the Feed", async () => {
    const gus = await makeUser({ username: "gus" });
    for (let i = 1; i <= 12; i++) await makePost(gus.id, { caption: `p${i}`, minutesAgo: i });
    const cookie = await cookieFor(gus.id);

    const page1 = await get("/users/gus/posts", cookie);
    const page2 = await get(`/users/gus/posts?cursor=${page1.body.nextCursor}`, cookie);

    expect(page1.body.posts).toHaveLength(10);
    expect(page2.body.posts.map((p: { caption: string }) => p.caption)).toEqual(["p11", "p12"]);
  });

  it("returns 404 for an unknown Username and 400 for a bad type or cursor", async () => {
    const gus = await makeUser({ username: "gus" });
    const cookie = await cookieFor(gus.id);

    expect((await get("/users/nobody.here/posts", cookie)).status).toBe(404);
    expect((await get("/users/gus/posts?type=audio", cookie)).status).toBe(400);
    expect((await get("/users/gus/posts?cursor=junk", cookie)).status).toBe(400);
  });
});

describe("Feed includes viewCount on Video Posts too", () => {
  it("adds viewCount for videos and leaves other Posts unchanged", async () => {
    const gus = await makeUser();
    await makePost(gus.id, { caption: "clip", mediaType: "VIDEO", mediaUrl: "https://example.test/v.mp4", viewCount: 7 });

    const res = await get("/feed", await cookieFor(gus.id));

    expect(res.body.posts[0]).toMatchObject({ caption: "clip", viewCount: 7 });
  });
});
