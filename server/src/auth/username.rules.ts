// Pure Username rules for Choose Username (Sign up step 2). No database.

export type UsernameFailure =
  | "username_too_short"
  | "username_too_long"
  | "username_invalid_chars"
  | "username_bad_start"
  | "username_trailing_dot"
  | "username_double_dot";

const MIN = 3;
const MAX = 30;

/** Rules from AUTH-08 / D-012. Returns every failure; empty means valid. */
export function checkUsername(username: string): UsernameFailure[] {
  const failures: UsernameFailure[] = [];
  if (username.length < MIN) failures.push("username_too_short");
  if (username.length > MAX) failures.push("username_too_long");
  if (/[^a-z0-9_.]/.test(username)) failures.push("username_invalid_chars");
  if (/^[._]/.test(username)) failures.push("username_bad_start");
  if (username.endsWith(".")) failures.push("username_trailing_dot");
  if (username.includes("..")) failures.push("username_double_dot");
  return failures;
}

/** Lowercase ASCII letters and digits only: "Núñez" -> "nunez", "O'Brien" -> "obrien". */
function slug(word: string): string {
  return word
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // strip accents left over after decomposition
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Username ideas built from a Name, best first (D-012, D-022). Not checked against the database.
 * `digits` supplies the random digits, so tests can pass a fixed value.
 * Words are shortened so every candidate fits within MAX, even with digits added.
 */
export function usernameCandidates(name: string, digits: () => string): string[] {
  const words = name.trim().split(/\s+/).map(slug).filter(Boolean);

  let candidates: string[];
  if (words.length >= 2) {
    const first = words[0].slice(0, 13);
    const last = words[words.length - 1].slice(0, 13);
    candidates = [
      `${first}.${last}`,
      `${first}_${last}`,
      `${first}${last}`,
      `${first[0]}${last}`,
      `${first}.${last}${digits()}`,
    ];
  } else {
    const stem = (words[0] ?? "user").slice(0, 26);
    candidates = [stem, `${stem}_${digits()}`, `${stem}.${digits()}`, `${stem}${digits()}`];
  }

  const valid = candidates.filter((c) => checkUsername(c).length === 0);
  return [...new Set(valid)];
}
