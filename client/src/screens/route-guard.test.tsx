import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api/auth";
import { gustavo, renderApp } from "../test/render-app";

// GEN-06: logged-out Users only reach Log in and Sign up. Plus Log out (AUTH-26).
vi.mock("../api/auth");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Who can see what (GEN-06)", () => {
  it("sends a logged-out User from Home to Log in", async () => {
    vi.mocked(api.getMe).mockResolvedValue(null);

    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Welcome Back!" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Social" })).not.toBeInTheDocument();
  });

  it("shows Home to a logged-in User", async () => {
    vi.mocked(api.getMe).mockResolvedValue(gustavo);

    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Social" })).toBeInTheDocument();
  });

  it("sends a logged-in User away from Log in and Sign up to Home", async () => {
    vi.mocked(api.getMe).mockResolvedValue(gustavo);

    renderApp("/login");

    expect(await screen.findByRole("heading", { name: "Social" })).toBeInTheDocument();
  });

  it("shows a loading state while checking the Session, not a flash of the wrong screen (GEN-04)", async () => {
    vi.mocked(api.getMe).mockReturnValue(new Promise(() => {})); // never answers

    renderApp("/");

    expect(await screen.findByRole("status")).toHaveTextContent(/loading/i);
    expect(screen.queryByRole("heading", { name: "Welcome Back!" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Social" })).not.toBeInTheDocument();
  });

  it("treats a failed Session check as logged out", async () => {
    vi.mocked(api.getMe).mockRejectedValue(new Error("network down"));

    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Welcome Back!" })).toBeInTheDocument();
  });
});

describe("Log out (AUTH-26)", () => {
  it("ends the Session and returns to Log in", async () => {
    vi.mocked(api.getMe).mockResolvedValue(gustavo);
    vi.mocked(api.logout).mockResolvedValue(undefined);
    const { user } = renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Log out" }));

    expect(api.logout).toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "Welcome Back!" })).toBeInTheDocument();
  });
});
