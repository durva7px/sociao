import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { cookieFor, makePost, makeUser, resetDb } from "../test/helpers.js";

// Save / bookmark (FEED-07, D-033). Same shape as Like: one row per User per Post, idempotent endpoints.

const app = createApp();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function setup() {
  const author = await makeUser();
  const viewer = await makeUser();
  const post = await makePost(author.id);
  return { author, viewer, post, cookie: await cookieFor(viewer.id) };
}

const save = (postId: string, cookie: string) => request(app).put(`/posts/${postId}/save`).set("Cookie", cookie);
const unsave = (postId: string, cookie: string) => request(app).delete(`/posts/${postId}/save`).set("Cookie", cookie);

describe("Save table", () => {
  it("rejects a second Save by the same User on the same Post", async () => {
    const { viewer, post } = await setup();
    await prisma.save.create({ data: { userId: viewer.id, postId: post.id } });

    await expect(prisma.save.create({ data: { userId: viewer.id, postId: post.id } })).rejects.toThrow();
  });

  it("deletes a Post's Saves along with the Post", async () => {
    const { viewer, post } = await setup();
    await prisma.save.create({ data: { userId: viewer.id, postId: post.id } });

    await prisma.post.delete({ where: { id: post.id } });

    expect(await prisma.save.count()).toBe(0);
  });
});

describe("PUT /posts/:id/save", () => {
  it("saves the Post", async () => {
    const { post, cookie, viewer } = await setup();

    const res = await save(post.id, cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ savedByMe: true });
    expect(await prisma.save.count({ where: { userId: viewer.id, postId: post.id } })).toBe(1);
  });

  it("is idempotent, including simultaneous taps", async () => {
    const { post, cookie } = await setup();

    const results = await Promise.all([save(post.id, cookie), save(post.id, cookie), save(post.id, cookie)]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(await prisma.save.count()).toBe(1);
  });

  it("returns 404 for a Post that doesn't exist, and 401 when logged out", async () => {
    const { post, cookie } = await setup();

    expect((await save("no-such-post", cookie)).status).toBe(404);
    expect((await request(app).put(`/posts/${post.id}/save`)).status).toBe(401);
  });
});

describe("DELETE /posts/:id/save", () => {
  it("removes the viewer's Save", async () => {
    const { post, cookie } = await setup();
    await save(post.id, cookie);

    const res = await unsave(post.id, cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ savedByMe: false });
    expect(await prisma.save.count()).toBe(0);
  });

  it("is idempotent, and only removes the viewer's own Save", async () => {
    const { post, cookie, author } = await setup();
    await prisma.save.create({ data: { userId: author.id, postId: post.id } });

    const res = await unsave(post.id, cookie);

    expect(res.body).toEqual({ savedByMe: false });
    expect(await prisma.save.count()).toBe(1);
  });

  it("returns 404 for a Post that doesn't exist, and 401 when logged out", async () => {
    const { post, cookie } = await setup();

    expect((await unsave("no-such-post", cookie)).status).toBe(404);
    expect((await request(app).delete(`/posts/${post.id}/save`)).status).toBe(401);
  });
});

describe("savedByMe in Post lists", () => {
  it("is true only for the User who saved it (Saves are private)", async () => {
    const { post, cookie, author } = await setup();
    await save(post.id, cookie);

    const asSaver = await request(app).get("/feed").set("Cookie", cookie);
    const asAuthor = await request(app).get("/feed").set("Cookie", await cookieFor(author.id));

    expect(asSaver.body.posts[0]).toMatchObject({ id: post.id, savedByMe: true });
    expect(asAuthor.body.posts[0]).toMatchObject({ id: post.id, savedByMe: false });
    expect(asSaver.body.posts[0]).not.toHaveProperty("saveCount");
  });

  it("appears on Profile Post lists too", async () => {
    const { post, cookie, author } = await setup();
    await save(post.id, cookie);

    const res = await request(app).get(`/users/${author.username}/posts`).set("Cookie", cookie);

    expect(res.body.posts[0]).toMatchObject({ id: post.id, savedByMe: true });
  });
});
