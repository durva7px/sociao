import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../db.js";
import { makePost, makeUser, resetDb } from "../test/helpers.js";

// The database itself enforces the Post and Like rules (D-026), even if the API is bypassed.

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("Post constraints (POST-01, POST-02)", () => {
  it("accepts a text-only Post and a Post with media", async () => {
    const author = await makeUser();

    await expect(makePost(author.id)).resolves.toBeDefined();
    await expect(
      makePost(author.id, { mediaType: "IMAGE", mediaUrl: "https://example.test/a.jpg" }),
    ).resolves.toBeDefined();
  });

  it("rejects an empty Caption", async () => {
    const author = await makeUser();

    await expect(makePost(author.id, { caption: "" })).rejects.toThrow();
  });

  it("accepts a 1000-character Caption and rejects 1001", async () => {
    const author = await makeUser();

    await expect(makePost(author.id, { caption: "a".repeat(1000) })).resolves.toBeDefined();
    await expect(makePost(author.id, { caption: "a".repeat(1001) })).rejects.toThrow();
  });

  it("rejects a media type without a URL, and a URL without a type", async () => {
    const author = await makeUser();

    await expect(makePost(author.id, { mediaType: "VIDEO" })).rejects.toThrow();
    await expect(makePost(author.id, { mediaUrl: "https://example.test/a.jpg" })).rejects.toThrow();
  });

  it("deletes a User's Posts along with the User", async () => {
    const author = await makeUser();
    await makePost(author.id);

    await prisma.user.delete({ where: { id: author.id } });

    expect(await prisma.post.count()).toBe(0);
  });
});

describe("Like constraints (FEED-06)", () => {
  it("rejects a second Like by the same User on the same Post", async () => {
    const user = await makeUser();
    const post = await makePost(user.id);
    await prisma.like.create({ data: { userId: user.id, postId: post.id } });

    await expect(prisma.like.create({ data: { userId: user.id, postId: post.id } })).rejects.toThrow();
  });

  it("allows different Users to like the same Post", async () => {
    const [a, b] = [await makeUser(), await makeUser()];
    const post = await makePost(a.id);

    await prisma.like.create({ data: { userId: a.id, postId: post.id } });
    await prisma.like.create({ data: { userId: b.id, postId: post.id } });

    expect(await prisma.like.count({ where: { postId: post.id } })).toBe(2);
  });

  it("deletes a Post's Likes along with the Post", async () => {
    const user = await makeUser();
    const post = await makePost(user.id);
    await prisma.like.create({ data: { userId: user.id, postId: post.id } });

    await prisma.post.delete({ where: { id: post.id } });

    expect(await prisma.like.count()).toBe(0);
  });
});
