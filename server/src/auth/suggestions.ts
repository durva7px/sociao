import { randomInt } from "node:crypto";
import { prisma } from "../db.js";
import { usernameCandidates } from "./username.rules.js";

const WANTED = 3;
const MAX_ATTEMPTS = 10;

function randomDigits(length: number) {
  return () => String(randomInt(0, 10 ** length)).padStart(length, "0");
}

/**
 * Up to 3 Usernames built from the Name that no User has yet (AUTH-10, D-022).
 * The first pass uses 2 random digits; if collisions keep happening, later passes use more.
 * `exclude` drops Usernames the caller already knows are unwanted (e.g. one just rejected).
 */
export async function suggestUsernames(name: string, exclude: string[] = []): Promise<string[]> {
  const picked: string[] = [];
  const seen = new Set(exclude);

  for (let attempt = 0; attempt < MAX_ATTEMPTS && picked.length < WANTED; attempt++) {
    const digitCount = 2 + Math.floor(attempt / 3);
    const fresh = usernameCandidates(name, randomDigits(digitCount)).filter((c) => !seen.has(c));
    fresh.forEach((c) => seen.add(c));
    if (fresh.length === 0) continue;

    const taken = await prisma.user.findMany({
      where: { username: { in: fresh } },
      select: { username: true },
    });
    const takenSet = new Set(taken.map((u) => u.username));

    for (const candidate of fresh) {
      if (picked.length < WANTED && !takenSet.has(candidate)) picked.push(candidate);
    }
  }

  return picked;
}
