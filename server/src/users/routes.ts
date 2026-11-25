import { Router, type Response } from "express";
import { prisma } from "../db.js";
import { requireUser, type AuthedLocals } from "../auth/require-user.js";
import { InvalidCursorError, postPage } from "../posts/post-page.js";

// Profiles and Follows (PROF-01 to PROF-05, D-031, D-032). Every route needs a logged-in User.

export const usersRouter = Router();

type Res = Response<unknown, AuthedLocals>;

const NOT_FOUND = { error: "User not found" };

/** Express 5 types route params as string | string[]. */
const param = (value: string | string[] | undefined) => String(value);

function findByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, bio: true, avatarUrl: true },
  });
}

/** Follower / Following / Post counts and whether the viewer follows this User, from the rows (D-031). */
async function profileState(userId: string, viewerId: string) {
  const [followers, following, posts, mine] = await Promise.all([
    prisma.follow.count({ where: { followeeId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.post.count({ where: { authorId: userId } }),
    prisma.follow.count({ where: { followeeId: userId, followerId: viewerId } }),
  ]);
  return { counts: { followers, following, posts }, followedByMe: mine > 0 };
}

// ---------- GET /users/:username ----------

usersRouter.get("/users/:username", requireUser, async (req, res: Res) => {
  const user = await findByUsername(param(req.params.username));
  if (!user) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const me = res.locals.user;
  res.json({ user, ...(await profileState(user.id, me.id)), isMe: user.id === me.id });
});

// ---------- GET /users/:username/posts?type=all|video&cursor= ----------

const TYPES = { all: {}, video: { mediaType: "VIDEO" as const } };

usersRouter.get("/users/:username/posts", requireUser, async (req, res: Res) => {
  const type = req.query.type ?? "all";
  if (type !== "all" && type !== "video") {
    res.status(400).json({ error: "type must be all or video" });
    return;
  }

  const user = await findByUsername(param(req.params.username));
  if (!user) {
    res.status(404).json(NOT_FOUND);
    return;
  }

  try {
    res.json(
      await postPage({
        viewerId: res.locals.user.id,
        where: { authorId: user.id, ...TYPES[type] },
        cursor: req.query.cursor,
      }),
    );
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      res.status(400).json({ error: "Invalid cursor" });
      return;
    }
    throw error;
  }
});

// ---------- PUT / DELETE /users/:username/follow ----------

usersRouter.put("/users/:username/follow", requireUser, async (req, res: Res) => {
  const user = await findByUsername(param(req.params.username));
  if (!user) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const me = res.locals.user;
  if (user.id === me.id) {
    res.status(400).json({ error: "You can't follow yourself" });
    return;
  }

  // skipDuplicates makes this idempotent: an existing Follow is left alone.
  await prisma.follow.createMany({ data: [{ followerId: me.id, followeeId: user.id }], skipDuplicates: true });
  res.json(await profileState(user.id, me.id));
});

usersRouter.delete("/users/:username/follow", requireUser, async (req, res: Res) => {
  const user = await findByUsername(param(req.params.username));
  if (!user) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const me = res.locals.user;

  // deleteMany: removing a Follow that isn't there is not an error (idempotent).
  await prisma.follow.deleteMany({ where: { followerId: me.id, followeeId: user.id } });
  res.json(await profileState(user.id, me.id));
});
