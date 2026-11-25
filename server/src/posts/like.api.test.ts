import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { cookieFor, makePost, makeUser, resetDb } from "../test/helpers.js";

// PUT / DELETE /posts/:id/like (FEED-04 to FEED-06, D-028). Both are idempotent.

const app = createApp();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function setup() {
  const author = await makeUser();
  const viewer = await makeUser();
  const post = await makePost(author.id);
  return { author, viewer, post, cookie: await cookieFor(viewer.id) };
}

const like = (postId: string, cookie: string) => request(app).put(`/posts/${postId}/like`).set("Cookie", cookie);
const unlike = (postId: string, cookie: string) => request(app).delete(`/posts/${postId}/like`).set("Cookie", cookie);

describe("PUT /posts/:id/like", () => {
  it("likes the Post and returns the new count", async () => {
    const { post, cookie, viewer } = await setup();

    const res = await like(post.id, cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ likeCount: 1, likedByMe: true });
    expect(await prisma.like.findUnique({ where: { userId_postId: { userId: viewer.id, postId: post.id } } })).not.toBeNull();
  });

  it("is idempotent: liking twice still counts once (FEED-06)", async () => {
    const { post, cookie } = await setup();

    await like(post.id, cookie);
    const res = await like(post.id, cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ likeCount: 1, likedByMe: true });
    expect(await prisma.like.count()).toBe(1);
  });

  it("survives a double-tap: simultaneous likes still count once", async () => {
    const { post, cookie } = await setup();

    const results = await Promise.all([like(post.id, cookie), like(post.id, cookie), like(post.id, cookie)]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(await prisma.like.count()).toBe(1);
  });

  it("includes other Users' Likes in the count", async () => {
    const { post, cookie, author } = await setup();
    await prisma.like.create({ data: { userId: author.id, postId: post.id } });

    const res = await like(post.id, cookie);

    expect(res.body).toEqual({ likeCount: 2, likedByMe: true });
  });

  it("returns 404 for a Post that doesn't exist", async () => {
    const { cookie } = await setup();

    const res = await like("no-such-post", cookie);

    expect(res.status).toBe(404);
  });

  it("requires a logged-in User", async () => {
    const { post } = await setup();

    const res = await request(app).put(`/posts/${post.id}/like`);

    expect(res.status).toBe(401);
    expect(await prisma.like.count()).toBe(0);
  });
});

describe("DELETE /posts/:id/like", () => {
  it("removes the viewer's Like", async () => {
    const { post, cookie } = await setup();
    await like(post.id, cookie);

    const res = await unlike(post.id, cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ likeCount: 0, likedByMe: false });
    expect(await prisma.like.count()).toBe(0);
  });

  it("is idempotent: unliking a Post that isn't liked is fine", async () => {
    const { post, cookie } = await setup();

    const res = await unlike(post.id, cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ likeCount: 0, likedByMe: false });
  });

  it("only removes the viewer's own Like", async () => {
    const { post, cookie, author } = await setup();
    await prisma.like.create({ data: { userId: author.id, postId: post.id } });
    await like(post.id, cookie);

    const res = await unlike(post.id, cookie);

    expect(res.body).toEqual({ likeCount: 1, likedByMe: false });
  });

  it("returns 404 for a Post that doesn't exist", async () => {
    const { cookie } = await setup();

    expect((await unlike("no-such-post", cookie)).status).toBe(404);
  });

  it("requires a logged-in User", async () => {
    const { post } = await setup();

    expect((await request(app).delete(`/posts/${post.id}/like`)).status).toBe(401);
  });
});

describe("Likes persist (FEED-05)", () => {
  it("the Feed shows the same count after the like, as after a refresh", async () => {
    const { post, cookie } = await setup();
    await like(post.id, cookie);

    const res = await request(app).get("/feed").set("Cookie", cookie);

    expect(res.body.posts[0]).toMatchObject({ id: post.id, likeCount: 1, likedByMe: true });
  });
});
