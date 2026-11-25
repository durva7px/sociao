import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api/auth";
import { gustavo, renderApp } from "../test/render-app";

// Screen 2 (Create Account) and Choose Username: the two steps of Sign up (D-011).
vi.mock("../api/auth");

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getMe).mockResolvedValue(null); // logged out
  vi.mocked(api.checkCreateAccount).mockResolvedValue({ ok: true });
  vi.mocked(api.getUsernameSuggestions).mockResolvedValue(["gustavo.levin", "gustavo_levin", "gustavolevin"]);
});

const step1 = { name: "Gustavo Levin", email: "gus@mail.com", password: "Sunset#2024" };

/** Fills Create Account and continues to Choose Username. */
async function completeStep1(user: ReturnType<typeof renderApp>["user"]) {
  await user.type(await screen.findByLabelText("Full Name"), step1.name);
  await user.type(screen.getByLabelText("Email"), step1.email);
  await user.type(screen.getByLabelText("Create Password"), step1.password);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByRole("heading", { name: "Choose a username" });
}

describe("Create Account (step 1)", () => {
  it("shows the heading and the three fields", async () => {
    renderApp("/signup");

    expect(await screen.findByRole("heading", { name: "Create Account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Create Password")).toBeInTheDocument();
  });

  it("keeps Continue disabled until all three fields are filled", async () => {
    const { user } = renderApp("/signup");

    await user.type(await screen.findByLabelText("Full Name"), step1.name);
    await user.type(screen.getByLabelText("Email"), step1.email);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.type(screen.getByLabelText("Create Password"), step1.password);
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("toggles the password between hidden and shown (AUTH-12)", async () => {
    const { user } = renderApp("/signup");
    const password = await screen.findByLabelText("Create Password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");
  });

  it("lists the password rules so the User knows them up front (AUTH-04)", async () => {
    renderApp("/signup");

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("sends the details to the server check and moves to Choose Username", async () => {
    const { user } = renderApp("/signup");

    await completeStep1(user);

    expect(api.checkCreateAccount).toHaveBeenCalledWith(step1);
  });

  it("shows each field's error from the server and stays on step 1", async () => {
    vi.mocked(api.checkCreateAccount).mockResolvedValue({
      ok: false,
      errors: { email: "An account with this email already exists", password: "Password needs a number" },
    });
    const { user } = renderApp("/signup");

    await user.type(await screen.findByLabelText("Full Name"), step1.name);
    await user.type(screen.getByLabelText("Email"), step1.email);
    await user.type(screen.getByLabelText("Create Password"), "Sunset#abcd");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("An account with this email already exists")).toBeInTheDocument();
    expect(screen.getByText("Password needs a number")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("heading", { name: "Create Account" })).toBeInTheDocument();
  });

  it("clears a field's error once the User edits that field", async () => {
    vi.mocked(api.checkCreateAccount).mockResolvedValue({
      ok: false,
      errors: { email: "An account with this email already exists", password: "Password needs a number" },
    });
    const { user } = renderApp("/signup");

    await user.type(await screen.findByLabelText("Full Name"), step1.name);
    await user.type(screen.getByLabelText("Email"), step1.email);
    await user.type(screen.getByLabelText("Create Password"), "Sunset#abcd");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByText("Password needs a number");

    await user.type(screen.getByLabelText("Create Password"), "1");

    expect(screen.queryByText("Password needs a number")).not.toBeInTheDocument();
    expect(screen.getByText("An account with this email already exists")).toBeInTheDocument();
  });

  it("links to Log in (AUTH-13)", async () => {
    const { user } = renderApp("/signup");

    await user.click(await screen.findByRole("link", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Welcome Back!" })).toBeInTheDocument();
  });
});

describe("Choose Username (step 2)", () => {
  it("can't be opened directly: without step 1 it sends the User back (D-011)", async () => {
    renderApp("/signup/username");

    expect(await screen.findByRole("heading", { name: "Create Account" })).toBeInTheDocument();
  });

  it("shows 3 suggestions built from the Name (AUTH-10)", async () => {
    const { user } = renderApp("/signup");
    await completeStep1(user);

    expect(api.getUsernameSuggestions).toHaveBeenCalledWith("Gustavo Levin");
    for (const s of ["gustavo.levin", "gustavo_levin", "gustavolevin"]) {
      expect(await screen.findByRole("button", { name: `@${s}` })).toBeInTheDocument();
    }
  });

  it("fills the Username field when a suggestion is tapped", async () => {
    const { user } = renderApp("/signup");
    await completeStep1(user);

    await user.click(await screen.findByRole("button", { name: "@gustavo_levin" }));

    expect(screen.getByLabelText("Username")).toHaveValue("gustavo_levin");
  });

  it("lowercases what the User types, since Usernames are lowercase only (AUTH-08)", async () => {
    const { user } = renderApp("/signup");
    await completeStep1(user);

    await user.type(screen.getByLabelText("Username"), "Gus.Levin");

    expect(screen.getByLabelText("Username")).toHaveValue("gus.levin");
  });

  it("keeps Create Account disabled until a Username is entered (AUTH-07)", async () => {
    const { user } = renderApp("/signup");
    await completeStep1(user);

    expect(screen.getByRole("button", { name: "Create Account" })).toBeDisabled();
    await user.type(screen.getByLabelText("Username"), "gus");
    expect(screen.getByRole("button", { name: "Create Account" })).toBeEnabled();
  });

  it("creates the account with all four fields and goes to Home logged in (AUTH-11)", async () => {
    vi.mocked(api.signup).mockResolvedValue({ ok: true, user: gustavo });
    const { user } = renderApp("/signup");
    await completeStep1(user);

    await user.click(await screen.findByRole("button", { name: "@gustavo.levin" }));
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(api.signup).toHaveBeenCalledWith({ ...step1, username: "gustavo.levin" });
    expect(await screen.findByRole("heading", { name: "Social" })).toBeInTheDocument();
  });

  it("shows 'taken' and replaces the suggestions with fresh ones (AUTH-09)", async () => {
    vi.mocked(api.signup).mockResolvedValue({
      ok: false,
      errors: { username: "That username is taken" },
      suggestions: ["gustavo.levin07", "gustavo_levin", "glevin"],
    });
    const { user } = renderApp("/signup");
    await completeStep1(user);

    await user.type(screen.getByLabelText("Username"), "gustavo.levin");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("That username is taken")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "@gustavo.levin07" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "@gustavolevin" })).not.toBeInTheDocument();
  });

  it("explains a password problem and offers a way back to change it (D-011)", async () => {
    vi.mocked(api.signup).mockResolvedValue({
      ok: false,
      errors: { password: "Password can't contain your username" },
    });
    const { user } = renderApp("/signup");
    await completeStep1(user);

    await user.type(screen.getByLabelText("Username"), "sunset");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Password can't contain your username")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("heading", { name: "Create Account" })).toBeInTheDocument();
  });

  it("keeps the step 1 values when going Back, so the User only fixes what's wrong", async () => {
    const { user } = renderApp("/signup");
    await completeStep1(user);

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(await screen.findByLabelText("Full Name")).toHaveValue(step1.name);
    expect(screen.getByLabelText("Email")).toHaveValue(step1.email);
  });

  it("never stores the password in the browser's storage (D-011)", async () => {
    const { user } = renderApp("/signup");
    await completeStep1(user);

    await waitFor(() => expect(api.getUsernameSuggestions).toHaveBeenCalled());
    const stored = JSON.stringify({ ...localStorage, ...sessionStorage, history: window.history.state });
    expect(stored).not.toContain(step1.password);
  });
});
