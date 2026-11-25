import { randomBytes } from "node:crypto";
import { prisma } from "../db.js";

// Shared set-up for API tests: make Users, log them in without bcrypt, wipe the database.

/** Deletes everything. Users cascade to their Posts, Likes, Follows and Sessions. */
export async function resetDb() {
  await prisma.follow.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

let counter = 0;

/** A User with a throwaway password hash; tests that need Log in hash a real one. */
export function makeUser(overrides: { name?: string; username?: string; avatarUrl?: string; bio?: string } = {}) {
  counter += 1;
  const username = overrides.username ?? `user${counter}`;
  return prisma.user.create({
    data: {
      name: overrides.name ?? `User ${counter}`,
      email: `${username}@mail.test`,
      username,
      passwordHash: "not-a-real-hash",
      avatarUrl: overrides.avatarUrl,
      bio: overrides.bio,
    },
  });
}

/** Logs a User in by creating a Session directly. Returns the Cookie header to send. */
export async function cookieFor(userId: string) {
  const session = await prisma.session.create({
    data: {
      id: randomBytes(32).toString("base64url"),
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return `sociao_session=${session.id}`;
}

/** A Post created `minutesAgo` minutes in the past, so ordering is predictable. */
export function makePost(
  authorId: string,
  data: { caption?: string; minutesAgo?: number; mediaType?: "IMAGE" | "VIDEO"; mediaUrl?: string; viewCount?: number } = {},
) {
  const { minutesAgo = 0, ...rest } = data;
  return prisma.post.create({
    data: {
      authorId,
      caption: rest.caption ?? "A caption",
      mediaType: rest.mediaType,
      mediaUrl: rest.mediaUrl,
      viewCount: rest.viewCount,
      createdAt: new Date(Date.now() - minutesAgo * 60_000),
    },
  });
}

/** Makes `follower` follow `followee`. */
export function follow(followerId: string, followeeId: string) {
  return prisma.follow.create({ data: { followerId, followeeId } });
}
