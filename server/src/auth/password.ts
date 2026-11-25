import bcrypt from "bcryptjs";

// The only place that knows how passwords are hashed (AUTH-06, D-021).
// bcrypt stores the salt and cost inside the hash string, so nothing else needs saving.

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
