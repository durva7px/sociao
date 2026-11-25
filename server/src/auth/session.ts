import { randomBytes } from "node:crypto";
import type { CookieOptions, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";

// Sessions (D-005, D-016, D-023): a database row whose random id travels in an httpOnly cookie.

export const SESSION_COOKIE = "sociao_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 256 random bits, URL-safe: 43 characters that can't be guessed. */
function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Creates a Session for a User. Takes a transaction client so a new User
 * and their first Session are saved together, or not at all.
 */
export function createSession(db: Prisma.TransactionClient, userId: string) {
  return db.session.create({
    data: { id: newSessionId(), userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_TTL_MS,
  secure: process.env.NODE_ENV === "production",
};

export function setSessionCookie(res: Response, sessionId: string) {
  res.cookie(SESSION_COOKIE, sessionId, cookieOptions);
}
