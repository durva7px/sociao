import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../db.js";
import { follow, makePost, makeUser, resetDb } from "../test/helpers.js";

// Database rules for Follow, bio and viewCount (D-031), enforced even if the API is bypassed.

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("Follow constraints", () => {
  it("rejects following the same User twice", async () => {
    const [a, b] = [await makeUser(), await makeUser()];
    await follow(a.id, b.id);

    await expect(follow(a.id, b.id)).rejects.toThrow();
  });

  it("allows following back (two separate Follows)", async () => {
    const [a, b] = [await makeUser(), await makeUser()];

    await follow(a.id, b.id);
    await follow(b.id, a.id);

    expect(await prisma.follow.count()).toBe(2);
  });

  it("rejects a User following themselves", async () => {
    const a = await makeUser();

    await expect(follow(a.id, a.id)).rejects.toThrow();
  });

  it("deletes a User's Follows, in both directions, along with the User", async () => {
    const [a, b, c] = [await makeUser(), await makeUser(), await makeUser()];
    await follow(a.id, b.id);
    await follow(c.id, a.id);

    await prisma.user.delete({ where: { id: a.id } });

    expect(await prisma.follow.count()).toBe(0);
  });
});

describe("bio and viewCount", () => {
  it("accepts a 150-character bio and rejects 151", async () => {
    await expect(makeUser({ bio: "b".repeat(150) })).resolves.toBeDefined();
    await expect(makeUser({ bio: "b".repeat(151) })).rejects.toThrow();
  });

  it("starts viewCount at 0 and rejects a negative count", async () => {
    const a = await makeUser();
    const post = await makePost(a.id, { mediaType: "VIDEO", mediaUrl: "https://example.test/v.mp4" });

    expect(post.viewCount).toBe(0);
    await expect(makePost(a.id, { viewCount: -1 })).rejects.toThrow();
  });
});
