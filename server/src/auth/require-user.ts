import type { NextFunction, Request, Response } from "express";
import type { User } from "../generated/prisma/client.js";
import { SESSION_COOKIE, findSessionUser } from "./session.js";

/** The logged-in User, put on res.locals by requireUser. */
export type AuthedLocals = { user: User };

/**
 * Guard for logged-in-only routes (GEN-06): 401 unless the request carries a valid Session.
 * On success the User is available as res.locals.user.
 */
export async function requireUser(req: Request, res: Response<unknown, AuthedLocals>, next: NextFunction) {
  const user = await findSessionUser(req.cookies?.[SESSION_COOKIE]);
  if (!user) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  res.locals.user = user;
  next();
}
