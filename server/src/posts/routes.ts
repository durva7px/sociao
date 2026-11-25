import { Router, type Response } from "express";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";
import { requireUser, type AuthedLocals } from "../auth/require-user.js";
import { InvalidCursorError, postPage } from "./post-page.js";

// The Feed and Likes (FEED-01 to FEED-06, D-026, D-028). Every route here needs a logged-in User.

// requireUser is applied per route, so unknown paths still get a normal 404.
export const postsRouter = Router();

type Res = Response<unknown, AuthedLocals>;

// ---------- GET /feed ----------

// Every User's Posts for now (D-009).
postsRouter.get("/feed", requireUser, async (req, res: Res) => {
  try {
    res.json(await postPage({ viewerId: res.locals.user.id, cursor: req.query.cursor }));
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      res.status(400).json({ error: "Invalid cursor" });
      return;
    }
    throw error;
  }
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

// ---------- PUT / DELETE /posts/:id/save (FEED-07, D-033) ----------

async function savedByMe(postId: string, userId: string) {
  return { savedByMe: (await prisma.save.count({ where: { postId, userId } })) > 0 };
}

postsRouter.put("/posts/:id/save", requireUser, async (req, res: Res) => {
  const postId = String(req.params.id); // Express 5 types params as string | string[]
  const userId = res.locals.user.id;

  if (!(await postExists(postId))) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  try {
    // skipDuplicates makes this idempotent: an existing Save is left alone.
    await prisma.save.createMany({ data: [{ userId, postId }], skipDuplicates: true });
  } catch (error) {
    // The Post was deleted between the check and the insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    throw error;
  }

  res.json(await savedByMe(postId, userId));
});

postsRouter.delete("/posts/:id/save", requireUser, async (req, res: Res) => {
  const postId = String(req.params.id); // Express 5 types params as string | string[]
  const userId = res.locals.user.id;

  if (!(await postExists(postId))) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  // deleteMany: removing a Save that isn't there is not an error (idempotent).
  await prisma.save.deleteMany({ where: { userId, postId } });
  res.json(await savedByMe(postId, userId));
});
