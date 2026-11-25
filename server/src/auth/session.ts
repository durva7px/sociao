import { randomBytes } from "node:crypto";
import type { CookieOptions, Response } from "express";
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";

// Sessions (D-005, D-016, D-023, D-024): a database row whose random id travels in an httpOnly cookie.

export const SESSION_COOKIE = "sociao_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 256 random bits, URL-safe: 43 characters that can't be guessed. */
function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Creates a Session for a User. Accepts a transaction client so a new User
 * and their first Session can be saved together, or not at all.
 */
export function createSession(db: Prisma.TransactionClient, userId: string) {
  return db.session.create({
    data: { id: newSessionId(), userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
}

/**
 * The User behind a Session id, or null if there's no such Session or it has expired.
 * An expired Session is deleted on sight (D-024).
 */
export async function findSessionUser(sessionId: string | undefined) {
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
    return null;
  }
  return session.user;
}

/** Ends one Session. deleteMany so an unknown or already-deleted id is not an error. */
export async function deleteSession(sessionId: string | undefined) {
  if (sessionId) await prisma.session.deleteMany({ where: { id: sessionId } });
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export function setSessionCookie(res: Response, sessionId: string) {
  res.cookie(SESSION_COOKIE, sessionId, { ...cookieOptions, maxAge: SESSION_TTL_MS });
}

/** Tells the browser to drop the cookie. Options must match the ones it was set with. */
export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}
