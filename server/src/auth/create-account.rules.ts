// Pure validation rules for Sign up. No database, no HTTP: easy to test and to reuse in step 2.
// Each check returns failure codes; an empty array means the value passes.

export type NameFailure = "name_required" | "name_too_long";
export type EmailFailure = "invalid_email";
export type PasswordFailure =
  | "too_short"
  | "missing_uppercase"
  | "missing_lowercase"
  | "missing_digit"
  | "missing_special"
  | "contains_name"
  | "contains_username"
  | "matches_email";

const NAME_MAX = 50;
const PASSWORD_MIN = 8;
const NAME_WORD_MIN = 3; // shorter Name words ("Al", "Li") are ignored by the password check (D-013)

// local@domain.tld: no spaces, exactly one @, and a dot in the domain (D-014).
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed and lowercased: the only form in which emails are stored or compared (D-014). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function checkEmail(email: string): EmailFailure[] {
  return EMAIL_FORMAT.test(normalizeEmail(email)) ? [] : ["invalid_email"];
}

export function checkName(name: string): NameFailure[] {
  const trimmed = name.trim();
  if (trimmed.length === 0) return ["name_required"];
  if (trimmed.length > NAME_MAX) return ["name_too_long"];
  return [];
}

export interface PasswordOwner {
  name: string;
  email: string;
  /** Known only in Sign up step 2 (Choose Username). */
  username?: string;
}

export function checkPassword(password: string, owner: PasswordOwner): PasswordFailure[] {
  const failures: PasswordFailure[] = [];

  // Character rules (AUTH-04, D-006). "Special" = not a letter, digit or whitespace (D-013).
  if (password.length < PASSWORD_MIN) failures.push("too_short");
  if (!/\p{Lu}/u.test(password)) failures.push("missing_uppercase");
  if (!/\p{Ll}/u.test(password)) failures.push("missing_lowercase");
  if (!/\p{Nd}/u.test(password)) failures.push("missing_digit");
  if (!/[^\p{L}\p{Nd}\s]/u.test(password)) failures.push("missing_special");

  // Identity rules (AUTH-05, D-013, D-019). All comparisons ignore case.
  const lower = password.toLowerCase();

  const nameWords = owner.name.toLowerCase().split(/\s+/).filter((w) => w.length >= NAME_WORD_MIN);
  if (nameWords.some((word) => lower.includes(word))) failures.push("contains_name");

  if (owner.username && lower.includes(owner.username.toLowerCase())) failures.push("contains_username");

  if (normalizeEmail(password) === normalizeEmail(owner.email)) failures.push("matches_email");

  return failures;
}
