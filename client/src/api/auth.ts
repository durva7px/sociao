// The client's only door to the auth API. Screens call these functions, never fetch directly,
// so tests can replace this whole module with fakes.
//
// Expected outcomes (wrong password, field errors) come back as { ok: false, ... }.
// Anything unexpected (server down, 500) throws, and screens show a generic error.

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

export type FieldErrors = Partial<Record<"name" | "email" | "password" | "username", string>>;

export type LoginResult = { ok: true; user: User } | { ok: false; error: string };
export type CheckResult = { ok: true } | { ok: false; errors: FieldErrors };
export type SignupResult =
  | { ok: true; user: User }
  | { ok: false; errors: FieldErrors; suggestions?: string[] };

export interface CreateAccountDetails {
  name: string;
  email: string;
  password: string;
}

// Vite forwards /api to the server in development, so the Session cookie stays same-origin.
const BASE = "/api";

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const post = (path: string, body?: unknown) =>
  request(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

function unexpected(res: Response): never {
  throw new Error(`Unexpected response ${res.status} from the server`);
}

export async function login(details: { email: string; password: string }): Promise<LoginResult> {
  const res = await post("/auth/login", details);
  if (res.ok) return { ok: true, user: (await res.json()).user };
  if (res.status === 401) return { ok: false, error: (await res.json()).error };
  return unexpected(res);
}

export async function checkCreateAccount(details: CreateAccountDetails): Promise<CheckResult> {
  const res = await post("/auth/signup/check", details);
  if (res.ok) return { ok: true };
  if (res.status === 400) return { ok: false, errors: (await res.json()).errors };
  return unexpected(res);
}

export async function getUsernameSuggestions(name: string): Promise<string[]> {
  const res = await request(`/auth/username-suggestions?name=${encodeURIComponent(name)}`);
  if (res.ok) return (await res.json()).suggestions;
  return unexpected(res);
}

export async function signup(details: CreateAccountDetails & { username: string }): Promise<SignupResult> {
  const res = await post("/auth/signup", details);
  if (res.status === 201) return { ok: true, user: (await res.json()).user };
  if (res.status === 400) {
    const body = await res.json();
    return { ok: false, errors: body.errors, suggestions: body.suggestions };
  }
  return unexpected(res);
}

export async function logout(): Promise<void> {
  const res = await post("/auth/logout");
  if (!res.ok) unexpected(res);
}

/** The logged-in User, or null if there's no valid Session. */
export async function getMe(): Promise<User | null> {
  const res = await request("/auth/me");
  if (res.ok) return (await res.json()).user;
  if (res.status === 401) return null;
  return unexpected(res);
}
