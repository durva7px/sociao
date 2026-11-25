import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { cookieFor, makePost, makeUser, resetDb } from "../test/helpers.js";

// GET /feed (FEED-01 to FEED-03, D-028): every Post, newest first, 10 per page.

const app = createApp();
const feed = (cookie: string, cursor?: string) =>
  request(app).get("/feed").query(cursor ? { cursor } : {}).set("Cookie", cookie);

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("GET /feed", () => {
  it("requires a logged-in User (GEN-06)", async () => {
    const res = await request(app).get("/feed");

    expect(res.status).toBe(401);
  });

  it("returns an empty page when there are no Posts", async () => {
    const viewer = await makeUser();

    const res = await feed(await cookieFor(viewer.id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ posts: [], nextCursor: null });
  });

  it("returns each Post with its Author, media and counts (FEED-01, FEED-02)", async () => {
    const author = await makeUser({ name: "Marilyn Torff", username: "marilyn.torff", avatarUrl: "https://example.test/m.jpg" });
    const post = await makePost(author.id, {
      caption: "Sunset",
      mediaType: "IMAGE",
      mediaUrl: "https://example.test/sunset.jpg",
    });

    const res = await feed(await cookieFor(author.id));

    expect(res.body.posts).toEqual([
      {
        id: post.id,
        caption: "Sunset",
        createdAt: post.createdAt.toISOString(),
        media: { type: "IMAGE", url: "https://example.test/sunset.jpg" },
        author: {
          id: author.id,
          name: "Marilyn Torff",
          username: "marilyn.torff",
          avatarUrl: "https://example.test/m.jpg",
        },
        likeCount: 0,
        likedByMe: false,
        savedByMe: false,
      },
    ]);
  });

  it("gives text-only Posts media: null, and video Posts type VIDEO", async () => {
    const author = await makeUser();
    await makePost(author.id, { caption: "text", minutesAgo: 2 });
    await makePost(author.id, { caption: "clip", minutesAgo: 1, mediaType: "VIDEO", mediaUrl: "https://example.test/v.mp4" });

    const res = await feed(await cookieFor(author.id));

    const byCaption = Object.fromEntries(res.body.posts.map((p: { caption: string }) => [p.caption, p]));
    expect(byCaption.text.media).toBeNull();
    expect(byCaption.clip.media).toEqual({ type: "VIDEO", url: "https://example.test/v.mp4" });
  });

  it("orders Posts newest first, from every User (FEED-03, D-009)", async () => {
    const [a, b] = [await makeUser(), await makeUser()];
    await makePost(a.id, { caption: "oldest", minutesAgo: 30 });
    await makePost(b.id, { caption: "newest", minutesAgo: 1 });
    await makePost(a.id, { caption: "middle", minutesAgo: 10 });

    const res = await feed(await cookieFor(a.id));

    expect(res.body.posts.map((p: { caption: string }) => p.caption)).toEqual(["newest", "middle", "oldest"]);
  });

  it("counts Likes and tells each viewer whether they liked it (FEED-04, FEED-05)", async () => {
    const [author, fan, other] = [await makeUser(), await makeUser(), await makeUser()];
    const post = await makePost(author.id);
    await prisma.like.createMany({
      data: [
        { userId: fan.id, postId: post.id },
        { userId: other.id, postId: post.id },
      ],
    });

    const asFan = await feed(await cookieFor(fan.id));
    const asAuthor = await feed(await cookieFor(author.id));

    expect(asFan.body.posts[0]).toMatchObject({ likeCount: 2, likedByMe: true });
    expect(asAuthor.body.posts[0]).toMatchObject({ likeCount: 2, likedByMe: false });
  });

  it("never exposes an Author's email or password hash", async () => {
    const author = await makeUser();
    await makePost(author.id);

    const res = await feed(await cookieFor(author.id));

    expect(JSON.stringify(res.body)).not.toMatch(/email|passwordHash|@mail\.test/);
  });
});

describe("GET /feed paging (D-028)", () => {
  it("returns 10 Posts and a cursor, then the rest and null", async () => {
    const author = await makeUser();
    for (let i = 1; i <= 12; i++) await makePost(author.id, { caption: `post ${i}`, minutesAgo: i });
    const cookie = await cookieFor(author.id);

    const page1 = await feed(cookie);
    expect(page1.body.posts).toHaveLength(10);
    expect(page1.body.nextCursor).toEqual(expect.any(String));

    const page2 = await feed(cookie, page1.body.nextCursor);
    expect(page2.body.posts.map((p: { caption: string }) => p.caption)).toEqual(["post 11", "post 12"]);
    expect(page2.body.nextCursor).toBeNull();
  });

  it("never repeats or skips a Post when several share the same timestamp", async () => {
    const author = await makeUser();
    const sameMoment = new Date();
    for (let i = 0; i < 15; i++) {
      await prisma.post.create({ data: { authorId: author.id, caption: `same ${i}`, createdAt: sameMoment } });
    }
    const cookie = await cookieFor(author.id);

    const page1 = await feed(cookie);
    const page2 = await feed(cookie, page1.body.nextCursor);
    const ids = [...page1.body.posts, ...page2.body.posts].map((p: { id: string }) => p.id);

    expect(ids).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
  });

  it("returns exactly one page with a null cursor when there are exactly 10 Posts", async () => {
    const author = await makeUser();
    for (let i = 1; i <= 10; i++) await makePost(author.id, { minutesAgo: i });

    const res = await feed(await cookieFor(author.id));

    expect(res.body.posts).toHaveLength(10);
    expect(res.body.nextCursor).toBeNull();
  });

  it("rejects a malformed cursor with 400", async () => {
    const viewer = await makeUser();

    const res = await feed(await cookieFor(viewer.id), "not-a-cursor");

    expect(res.status).toBe(400);
  });
});
