import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";

// One page of Posts in the shape every list uses: the Feed and a Profile's Post and Video tabs (D-028, D-032).
// likeCount, likedByMe and savedByMe are worked out from the Like and Save rows for the viewer (D-026, D-033).

export const PAGE_SIZE = 10;

// ---------- Cursor: an opaque "older than this Post" marker ----------

interface Cursor {
  createdAt: Date;
  id: string;
}

function encodeCursor(post: { createdAt: Date; id: string }): string {
  return Buffer.from(JSON.stringify({ c: post.createdAt.toISOString(), i: post.id })).toString("base64url");
}

/** null when the cursor is malformed, so the route can answer 400. */
function decodeCursor(raw: string): Cursor | null {
  try {
    const { c, i } = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const createdAt = new Date(c);
    if (typeof i !== "string" || typeof c !== "string" || Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id: i };
  } catch {
    return null;
  }
}

export class InvalidCursorError extends Error {}

/**
 * Posts matching `where`, newest first, one page at a time. The id breaks ties,
 * so Posts with the same timestamp are never repeated or skipped.
 * Throws InvalidCursorError for a malformed cursor.
 */
export async function postPage(opts: { viewerId: string; where?: Prisma.PostWhereInput; cursor?: unknown }) {
  let cursor: Cursor | null = null;
  if (typeof opts.cursor === "string") {
    cursor = decodeCursor(opts.cursor);
    if (!cursor) throw new InvalidCursorError("Invalid cursor");
  }

  const posts = await prisma.post.findMany({
    where: {
      AND: [
        opts.where ?? {},
        cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1, // one extra tells us whether another page exists
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true } }, // -> likeCount
      likes: { where: { userId: opts.viewerId }, select: { userId: true } }, // -> likedByMe
      saves: { where: { userId: opts.viewerId }, select: { userId: true } }, // -> savedByMe (private, D-033)
    },
  });

  const page = posts.slice(0, PAGE_SIZE);
  const hasMore = posts.length > PAGE_SIZE;

  return {
    posts: page.map((post) => ({
      id: post.id,
      caption: post.caption,
      createdAt: post.createdAt.toISOString(),
      media: post.mediaType && post.mediaUrl ? { type: post.mediaType, url: post.mediaUrl } : null,
      author: post.author,
      likeCount: post._count.likes,
      likedByMe: post.likes.length > 0,
      savedByMe: post.saves.length > 0,
      // View counts only mean something for videos (D-031).
      ...(post.mediaType === "VIDEO" ? { viewCount: post.viewCount } : {}),
    })),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  };
}
