import { Router } from "express";
import { prisma } from "../db.js";
import {
  checkEmail,
  checkName,
  checkPassword,
  normalizeEmail,
  type EmailFailure,
  type NameFailure,
  type PasswordFailure,
} from "./create-account.rules.js";

// User-facing wording for each failure code. Tests assert codes; the UI shows these.
const MESSAGES: Record<NameFailure | EmailFailure | PasswordFailure, string> = {
  name_required: "Name is required",
  name_too_long: "Name must be 50 characters or fewer",
  invalid_email: "Enter a valid email address",
  too_short: "Password must be at least 8 characters",
  missing_uppercase: "Password needs an uppercase letter",
  missing_lowercase: "Password needs a lowercase letter",
  missing_digit: "Password needs a number",
  missing_special: "Password needs a special character",
  contains_name: "Password can't contain your name",
  contains_username: "Password can't contain your username",
  matches_email: "Password can't be your email",
};

const EMAIL_TAKEN = "An account with this email already exists";

type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

/** Non-string or missing values become "" so they fail validation instead of crashing. */
const text = (value: unknown) => (typeof value === "string" ? value : "");

export const authRouter = Router();

// Sign up step 1, "Create Account" (D-011): validate only. Nothing is stored and no Session is created.
authRouter.post("/signup/check", async (req, res) => {
  const name = text(req.body?.name);
  const email = text(req.body?.email);
  const password = text(req.body?.password);

  const errors: FieldErrors = {};

  const [nameFailure] = checkName(name);
  if (nameFailure) errors.name = MESSAGES[nameFailure];

  const [emailFailure] = checkEmail(email);
  if (emailFailure) {
    errors.email = MESSAGES[emailFailure];
  } else {
    const existing = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (existing) errors.email = EMAIL_TAKEN;
  }

  // One message per field: the first rule that fails. The UI shows the full checklist itself.
  const [passwordFailure] = checkPassword(password, { name, email });
  if (passwordFailure) errors.password = MESSAGES[passwordFailure];

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors });
    return;
  }
  res.json({ ok: true });
});
