import { Router } from "express";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  checkEmail,
  checkName,
  checkPassword,
  normalizeEmail,
  type EmailFailure,
  type NameFailure,
  type PasswordFailure,
} from "./create-account.rules.js";
import { hashPassword, verifyPassword } from "./password.js";
import { requireUser, type AuthedLocals } from "./require-user.js";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  deleteSession,
  setSessionCookie,
} from "./session.js";
import { suggestUsernames } from "./suggestions.js";
import { checkUsername, type UsernameFailure } from "./username.rules.js";

// User-facing wording for each failure code. Tests assert codes; the UI shows these.
const MESSAGES: Record<NameFailure | EmailFailure | PasswordFailure | UsernameFailure, string> = {
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
  username_too_short: "Username must be at least 3 characters",
  username_too_long: "Username must be 30 characters or fewer",
  username_invalid_chars: "Username can only use lowercase letters, numbers, _ and .",
  username_bad_start: "Username must start with a letter or number",
  username_trailing_dot: "Username can't end with a dot",
  username_double_dot: "Username can't contain two dots in a row",
};

const EMAIL_TAKEN = "An account with this email already exists";
const USERNAME_TAKEN = "That username is taken";

type Field = "name" | "email" | "password" | "username";
type FieldErrors = Partial<Record<Field, string>>;

/** Non-string or missing values become "" so they fail validation instead of crashing. */
const text = (value: unknown) => (typeof value === "string" ? value : "");

/** The only User fields ever sent to the client: never the password hash. */
const publicUser = (user: { id: string; name: string; email: string; username: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
});

interface SignupInput {
  name: string;
  email: string;
  password: string;
  username?: string;
}

/**
 * Format rules for every field present, then the uniqueness checks that need the database.
 * One message per field: the first rule that fails. Step 1 passes no Username.
 */
async function validateSignup(input: SignupInput): Promise<FieldErrors> {
  const errors: FieldErrors = {};

  const [nameFailure] = checkName(input.name);
  if (nameFailure) errors.name = MESSAGES[nameFailure];

  const [emailFailure] = checkEmail(input.email);
  if (emailFailure) errors.email = MESSAGES[emailFailure];

  if (input.username !== undefined) {
    const [usernameFailure] = checkUsername(input.username);
    if (usernameFailure) errors.username = MESSAGES[usernameFailure];
  }

  const [passwordFailure] = checkPassword(input.password, input);
  if (passwordFailure) errors.password = MESSAGES[passwordFailure];

  if (!errors.email && (await emailTaken(input.email))) errors.email = EMAIL_TAKEN;
  if (input.username !== undefined && !errors.username && (await usernameTaken(input.username))) {
    errors.username = USERNAME_TAKEN;
  }

  return errors;
}

async function emailTaken(email: string) {
  return (await prisma.user.count({ where: { email: normalizeEmail(email) } })) > 0;
}

async function usernameTaken(username: string) {
  return (await prisma.user.count({ where: { username } })) > 0;
}

/** Sends 400 with the field errors, plus fresh suggestions if the Username was taken. */
async function rejectSignup(res: import("express").Response, errors: FieldErrors, input: SignupInput) {
  const body: { errors: FieldErrors; suggestions?: string[] } = { errors };
  if (errors.username === USERNAME_TAKEN) {
    body.suggestions = await suggestUsernames(input.name, input.username ? [input.username] : []);
  }
  res.status(400).json(body);
}

export const authRouter = Router();

// Sign up step 1, "Create Account" (D-011): validate only. Nothing is stored and no Session is created.
authRouter.post("/signup/check", async (req, res) => {
  const input = {
    name: text(req.body?.name),
    email: text(req.body?.email),
    password: text(req.body?.password),
  };

  const errors = await validateSignup(input);
  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors });
    return;
  }
  res.json({ ok: true });
});

// Choose Username helper: 3 free Usernames built from the Name (AUTH-10).
authRouter.get("/username-suggestions", async (req, res) => {
  const name = text(req.query.name).trim();
  if (!name) {
    res.status(400).json({ errors: { name: MESSAGES.name_required } });
    return;
  }
  res.json({ suggestions: await suggestUsernames(name) });
});

// Sign up step 2, "Choose Username" (D-011): re-check everything, then create the User
// and their first Session together, and log them in (AUTH-01, AUTH-11).
authRouter.post("/signup", async (req, res) => {
  const input = {
    name: text(req.body?.name),
    email: text(req.body?.email),
    password: text(req.body?.password),
    username: text(req.body?.username),
  };

  const errors = await validateSignup(input);
  if (Object.keys(errors).length > 0) {
    await rejectSignup(res, errors, input);
    return;
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const { user, session } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email: normalizeEmail(input.email),
          username: input.username,
          passwordHash,
        },
      });
      const session = await createSession(tx, user.id);
      return { user, session };
    });

    setSessionCookie(res, session.id);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    // Someone else took the email or Username between our check and the insert.
    // The database's unique constraint caught it; report it like any other "taken".
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raceErrors: FieldErrors = {};
      if (await emailTaken(input.email)) raceErrors.email = EMAIL_TAKEN;
      if (await usernameTaken(input.username)) raceErrors.username = USERNAME_TAKEN;
      await rejectSignup(res, raceErrors, input);
      return;
    }
    throw error;
  }
});

const INCORRECT_LOGIN = { error: "Incorrect email or password" };

// Compared against when the email is unknown, so a miss takes as long as a real check
// and response time can't reveal which emails have accounts (D-024). Created once, lazily.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password"));

// Log in (AUTH-20, AUTH-24, AUTH-25): every failure gets the same 401.
authRouter.post("/login", async (req, res) => {
  const email = normalizeEmail(text(req.body?.email));
  const password = text(req.body?.password);

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !password || !passwordOk) {
    res.status(401).json(INCORRECT_LOGIN);
    return;
  }

  const session = await createSession(prisma, user.id);
  setSessionCookie(res, session.id);
  res.json({ user: publicUser(user) });
});

// Log out (AUTH-26): ends only this Session. Harmless when already logged out.
authRouter.post("/logout", async (req, res) => {
  await deleteSession(req.cookies?.[SESSION_COOKIE]);
  clearSessionCookie(res);
  res.status(204).end();
});

// Who is logged in? 401 if nobody (GEN-06 building block).
authRouter.get("/me", requireUser, (_req, res: import("express").Response<unknown, AuthedLocals>) => {
  res.json({ user: publicUser(res.locals.user) });
});
