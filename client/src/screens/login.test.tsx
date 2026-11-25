import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api/auth";
import { gustavo, renderApp } from "../test/render-app";

// Screen 1: Log in (AUTH-20 to AUTH-24).
vi.mock("../api/auth");

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getMe).mockResolvedValue(null); // logged out
});

const emailInput = () => screen.getByLabelText("Email");
const passwordInput = () => screen.getByLabelText("Password");
const loginButton = () => screen.getByRole("button", { name: "Login" });

describe("Log in screen", () => {
  it("shows the welcome heading", async () => {
    renderApp("/login");

    expect(await screen.findByRole("heading", { name: "Welcome Back!" })).toBeInTheDocument();
  });

  describe("Login button (AUTH-21, D-015)", () => {
    it("is disabled while the fields are empty", async () => {
      renderApp("/login");
      await screen.findByRole("heading", { name: "Welcome Back!" });

      expect(loginButton()).toBeDisabled();
    });

    it("stays disabled with an invalid email, even with a password", async () => {
      const { user } = renderApp("/login");
      await screen.findByRole("heading", { name: "Welcome Back!" });

      await user.type(emailInput(), "gus@mail");
      await user.type(passwordInput(), "anything");

      expect(loginButton()).toBeDisabled();
    });

    it("stays disabled with a valid email but no password", async () => {
      const { user } = renderApp("/login");
      await screen.findByRole("heading", { name: "Welcome Back!" });

      await user.type(emailInput(), "gus@mail.com");

      expect(loginButton()).toBeDisabled();
    });

    it("turns on with a valid email and any non-empty password", async () => {
      const { user } = renderApp("/login");
      await screen.findByRole("heading", { name: "Welcome Back!" });

      await user.type(emailInput(), "gus@mail.com");
      await user.type(passwordInput(), "x");

      expect(loginButton()).toBeEnabled();
    });
  });

  it("toggles the password between hidden and shown (AUTH-22)", async () => {
    const { user } = renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back!" });

    expect(passwordInput()).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput()).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput()).toHaveAttribute("type", "password");
  });

  it("links to Create Account (AUTH-23)", async () => {
    const { user } = renderApp("/login");

    await user.click(await screen.findByRole("link", { name: "Create Account" }));

    expect(await screen.findByLabelText("Full Name")).toBeInTheDocument();
  });

  it("logs in and goes to Home (AUTH-20)", async () => {
    vi.mocked(api.login).mockResolvedValue({ ok: true, user: gustavo });
    const { user } = renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back!" });

    await user.type(emailInput(), "gus@mail.com");
    await user.type(passwordInput(), "Sunset#2024");
    await user.click(loginButton());

    expect(api.login).toHaveBeenCalledWith({ email: "gus@mail.com", password: "Sunset#2024" });
    expect(await screen.findByRole("heading", { name: "Social" })).toBeInTheDocument();
  });

  it("shows a clear error on wrong credentials and stays on Log in (AUTH-24)", async () => {
    vi.mocked(api.login).mockResolvedValue({ ok: false, error: "Incorrect email or password" });
    const { user } = renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back!" });

    await user.type(emailInput(), "gus@mail.com");
    await user.type(passwordInput(), "wrong");
    await user.click(loginButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password");
    expect(screen.getByRole("heading", { name: "Welcome Back!" })).toBeInTheDocument();
  });

  it("clears the error once the User edits a field", async () => {
    vi.mocked(api.login).mockResolvedValue({ ok: false, error: "Incorrect email or password" });
    const { user } = renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back!" });

    await user.type(emailInput(), "gus@mail.com");
    await user.type(passwordInput(), "wrong");
    await user.click(loginButton());
    await screen.findByRole("alert");

    await user.type(passwordInput(), "!");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables the button while logging in, so it can't be sent twice (GEN-04)", async () => {
    let finish!: (value: Awaited<ReturnType<typeof api.login>>) => void;
    vi.mocked(api.login).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { user } = renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back!" });

    await user.type(emailInput(), "gus@mail.com");
    await user.type(passwordInput(), "Sunset#2024");
    await user.click(loginButton());

    expect(screen.getByRole("button", { name: "Logging in…" })).toBeDisabled();
    finish({ ok: true, user: gustavo });
    expect(await screen.findByRole("heading", { name: "Social" })).toBeInTheDocument();
  });

  it("shows a friendly error if the server can't be reached (GEN-04)", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("network down"));
    const { user } = renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back!" });

    await user.type(emailInput(), "gus@mail.com");
    await user.type(passwordInput(), "Sunset#2024");
    await user.click(loginButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
  });
});
