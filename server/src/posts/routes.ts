import { Router, type Response } from "express";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";
import { requireUser, type AuthedLocals } from "../auth/require-user.js";

// The Feed and Likes (FEED-01 to FEED-06, D-026, D-028). Every route here needs a logged-in User.

const PAGE_SIZE = 10;

// requireUser is applied per route, so unknown paths still get a normal 404.
export const postsRouter = Router();

type Res = Response<unknown, AuthedLocals>;

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

// ---------- GET /feed ----------

postsRouter.get("/feed", requireUser, async (req, res: Res) => {
  const me = res.locals.user;

  let cursor: Cursor | null = null;
  if (typeof req.query.cursor === "string") {
    cursor = decodeCursor(req.query.cursor);
    if (!cursor) {
      res.status(400).json({ error: "Invalid cursor" });
      return;
    }
  }

  // Newest first; id breaks ties so Posts with the same timestamp are never repeated or skipped.
  const posts = await prisma.post.findMany({
    where: cursor
      ? {
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { lt: cursor.id } },
          ],
        }
      : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1, // one extra tells us whether another page exists
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true } }, // -> likeCount
      likes: { where: { userId: me.id }, select: { userId: true } }, // -> likedByMe
    },
  });

  const page = posts.slice(0, PAGE_SIZE);
  const hasMore = posts.length > PAGE_SIZE;

  res.json({
    posts: page.map((post) => ({
      id: post.id,
      caption: post.caption,
      createdAt: post.createdAt.toISOString(),
      media: post.mediaType && post.mediaUrl ? { type: post.mediaType, url: post.mediaUrl } : null,
      author: post.author,
      likeCount: post._count.likes,
      likedByMe: post.likes.length > 0,
    })),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  });
});

// ---------- PUT / DELETE /posts/:id/like ----------

/** The Like state after a change, worked out from the Like rows (D-026). */
async function likeState(postId: string, userId: string) {
  const [likeCount, mine] = await Promise.all([
    prisma.like.count({ where: { postId } }),
    prisma.like.count({ where: { postId, userId } }),
  ]);
  return { likeCount, likedByMe: mine > 0 };
}

async function postExists(postId: string) {
  return (await prisma.post.count({ where: { id: postId } })) > 0;
}

postsRouter.put("/posts/:id/like", requireUser, async (req, res: Res) => {
  const postId = String(req.params.id); // Express 5 types params as string | string[]
  const userId = res.locals.user.id;

  if (!(await postExists(postId))) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  try {
    // skipDuplicates makes this idempotent: an existing Like is left alone (FEED-06).
    await prisma.like.createMany({ data: [{ userId, postId }], skipDuplicates: true });
  } catch (error) {
    // The Post was deleted between the check and the insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    throw error;
  }

  res.json(await likeState(postId, userId));
});

postsRouter.delete("/posts/:id/like", requireUser, async (req, res: Res) => {
  const postId = String(req.params.id); // Express 5 types params as string | string[]
  const userId = res.locals.user.id;

  if (!(await postExists(postId))) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  // deleteMany: removing a Like that isn't there is not an error (idempotent).
  await prisma.like.deleteMany({ where: { userId, postId } });
  res.json(await likeState(postId, userId));
});
