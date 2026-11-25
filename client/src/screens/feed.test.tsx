import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as auth from "../api/auth";
import * as feedApi from "../api/feed";
import type { FeedPost } from "../api/feed";
import { gustavo, renderApp } from "../test/render-app";

// Screen 3: Home Feed (FEED-01 to FEED-07, GEN-04, D-028).
vi.mock("../api/auth");
vi.mock("../api/feed");

const marilyn = { id: "u2", name: "Marilyn Torff", username: "marilyn.torff", avatarUrl: "https://example.test/m.jpg" };
const lindsey = { id: "u3", name: "Lindsey Septimus", username: "lindsey.septimus", avatarUrl: null };

function post(overrides: Partial<FeedPost> & { id: string }): FeedPost {
  return {
    caption: "A caption",
    createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    media: null,
    author: marilyn,
    likeCount: 0,
    likedByMe: false,
    savedByMe: false,
    ...overrides,
  };
}

const imagePost = post({
  id: "p1",
  caption: "Golden hour from the balcony",
  media: { type: "IMAGE", url: "https://example.test/sunset.jpg" },
  likeCount: 1450,
});
const textPost = post({ id: "p2", caption: "Pasta from scratch", author: lindsey, likeCount: 3, likedByMe: true });
const videoPost = post({ id: "p3", caption: "Trail run", media: { type: "VIDEO", url: "https://example.test/run.mp4" } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(auth.getMe).mockResolvedValue(gustavo);
  vi.mocked(feedApi.getFeed).mockResolvedValue({ posts: [imagePost, textPost, videoPost], nextCursor: null });
});

/** The <article> for a Post, found by its Author's Username. */
const card = (caption: string) => screen.getByText(caption).closest("article") as HTMLElement;

describe("Feed: loading, empty and error states (GEN-04)", () => {
  it("shows a loading state while the Feed loads", async () => {
    vi.mocked(feedApi.getFeed).mockReturnValue(new Promise(() => {}));
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Social" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/loading posts/i);
  });

  it("shows an empty state when there are no Posts", async () => {
    vi.mocked(feedApi.getFeed).mockResolvedValue({ posts: [], nextCursor: null });
    renderApp("/");

    expect(await screen.findByText(/no posts yet/i)).toBeInTheDocument();
  });

  it("shows an error with a retry that loads the Feed again", async () => {
    vi.mocked(feedApi.getFeed).mockRejectedValueOnce(new Error("network down"));
    const { user } = renderApp("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load/i);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Golden hour from the balcony")).toBeInTheDocument();
  });
});

describe("Feed: Post cards (FEED-01, FEED-02)", () => {
  it("loads Posts from the API and shows them in order", async () => {
    renderApp("/");

    await screen.findByText("Golden hour from the balcony");
    const captions = screen.getAllByRole("article").map((a) => within(a).getByTestId("caption").textContent);
    expect(captions).toEqual(["Golden hour from the balcony", "Pasta from scratch", "Trail run"]);
    expect(feedApi.getFeed).toHaveBeenCalledWith(undefined);
  });

  it("shows the Author's Username, avatar and how long ago they posted", async () => {
    renderApp("/");
    await screen.findByText("Golden hour from the balcony");

    const c = card("Golden hour from the balcony");
    expect(within(c).getByText("marilyn.torff")).toBeInTheDocument();
    expect(within(c).getByRole("img", { name: "marilyn.torff" })).toHaveAttribute("src", marilyn.avatarUrl);
    expect(within(c).getByText("2m ago")).toBeInTheDocument();
  });

  it("shows initials when an Author has no avatar", async () => {
    renderApp("/");
    await screen.findByText("Pasta from scratch");

    expect(within(card("Pasta from scratch")).getByText("LS")).toBeInTheDocument();
  });

  it("renders text-only, image and video Posts", async () => {
    renderApp("/");
    await screen.findByText("Golden hour from the balcony");

    expect(within(card("Golden hour from the balcony")).getByRole("img", { name: /photo/i })).toHaveAttribute(
      "src",
      "https://example.test/sunset.jpg",
    );
    expect(within(card("Pasta from scratch")).queryByRole("img", { name: /photo/i })).not.toBeInTheDocument();
    expect(card("Trail run").querySelector("video")).toHaveAttribute("src", "https://example.test/run.mp4");
  });

  it("formats large Like counts with separators, as in the mockups", async () => {
    renderApp("/");
    await screen.findByText("Golden hour from the balcony");

    expect(within(card("Golden hour from the balcony")).getByText("1,450")).toBeInTheDocument();
  });

  it("shows Comment, Share and the menu as not yet available (D-028)", async () => {
    renderApp("/");
    await screen.findByText("Golden hour from the balcony");
    const c = card("Golden hour from the balcony");

    for (const name of ["Comment", "Share", "More options"]) {
      expect(within(c).getByRole("button", { name })).toBeDisabled();
    }
  });
});

describe("Feed: Like toggle (FEED-04, FEED-05, D-028)", () => {
  it("likes a Post: the heart and count change at once, then match the server", async () => {
    let finish!: (v: { likeCount: number; likedByMe: boolean }) => void;
    vi.mocked(feedApi.likePost).mockReturnValue(new Promise((r) => (finish = r)));
    const { user } = renderApp("/");
    await screen.findByText("Trail run");
    const c = card("Trail run");

    await user.click(within(c).getByRole("button", { name: "Like" }));

    // Instant update, before the server answers
    expect(within(c).getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "true");
    expect(within(c).getByText("1")).toBeInTheDocument();
    expect(feedApi.likePost).toHaveBeenCalledWith("p3");

    // The server's count wins (someone else liked it meanwhile)
    finish({ likeCount: 5, likedByMe: true });
    expect(await within(c).findByText("5")).toBeInTheDocument();
  });

  it("unlikes a Post the User already liked", async () => {
    vi.mocked(feedApi.unlikePost).mockResolvedValue({ likeCount: 2, likedByMe: false });
    const { user } = renderApp("/");
    await screen.findByText("Pasta from scratch");
    const c = card("Pasta from scratch");

    expect(within(c).getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(c).getByRole("button", { name: "Like" }));

    expect(feedApi.unlikePost).toHaveBeenCalledWith("p2");
    expect(within(c).getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "false");
    expect(await within(c).findByText("2")).toBeInTheDocument();
  });

  it("rolls back if the server can't save the Like", async () => {
    vi.mocked(feedApi.likePost).mockRejectedValue(new Error("network down"));
    const { user } = renderApp("/");
    await screen.findByText("Trail run");
    const c = card("Trail run");

    await user.click(within(c).getByRole("button", { name: "Like" }));

    await waitFor(() =>
      expect(within(c).getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "false"),
    );
    expect(within(c).getByText("0")).toBeInTheDocument();
    expect(within(c).getByRole("alert")).toHaveTextContent(/couldn't update/i);
  });

  it("ignores extra taps while a Like is still being saved", async () => {
    vi.mocked(feedApi.likePost).mockReturnValue(new Promise(() => {}));
    const { user } = renderApp("/");
    await screen.findByText("Trail run");
    const c = card("Trail run");

    await user.click(within(c).getByRole("button", { name: "Like" }));
    await user.click(within(c).getByRole("button", { name: "Like" }));

    expect(feedApi.likePost).toHaveBeenCalledTimes(1);
    expect(feedApi.unlikePost).not.toHaveBeenCalled();
  });
});

describe("Feed: Save toggle (FEED-07, D-033)", () => {
  it("saves a Post: the bookmark fills at once, with no count shown", async () => {
    let finish!: (v: { savedByMe: boolean }) => void;
    vi.mocked(feedApi.savePost).mockReturnValue(new Promise((r) => (finish = r)));
    const { user } = renderApp("/");
    await screen.findByText("Trail run");
    const c = card("Trail run");

    expect(within(c).getByRole("button", { name: "Save" })).toHaveAttribute("aria-pressed", "false");
    await user.click(within(c).getByRole("button", { name: "Save" }));

    expect(within(c).getByRole("button", { name: "Save" })).toHaveAttribute("aria-pressed", "true");
    expect(feedApi.savePost).toHaveBeenCalledWith("p3");
    expect(within(c).getByRole("button", { name: "Save" })).toHaveTextContent("");

    finish({ savedByMe: true });
    await waitFor(() => expect(within(c).getByRole("button", { name: "Save" })).toHaveAttribute("aria-pressed", "true"));
  });

  it("unsaves a Post that's already saved", async () => {
    vi.mocked(feedApi.getFeed).mockResolvedValue({ posts: [{ ...videoPost, savedByMe: true }], nextCursor: null });
    vi.mocked(feedApi.unsavePost).mockResolvedValue({ savedByMe: false });
    const { user } = renderApp("/");
    await screen.findByText("Trail run");
    const c = card("Trail run");

    await user.click(within(c).getByRole("button", { name: "Save" }));

    expect(feedApi.unsavePost).toHaveBeenCalledWith("p3");
    expect(within(c).getByRole("button", { name: "Save" })).toHaveAttribute("aria-pressed", "false");
  });

  it("rolls back if the Save can't be stored", async () => {
    vi.mocked(feedApi.savePost).mockRejectedValue(new Error("network down"));
    const { user } = renderApp("/");
    await screen.findByText("Trail run");
    const c = card("Trail run");

    await user.click(within(c).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(within(c).getByRole("button", { name: "Save" })).toHaveAttribute("aria-pressed", "false"));
    expect(within(c).getByRole("alert")).toHaveTextContent(/couldn't save/i);
  });

  it("ignores extra taps while a Save is still being stored, and leaves Like alone", async () => {
    vi.mocked(feedApi.savePost).mockReturnValue(new Promise(() => {}));
    const { user } = renderApp("/");
    await screen.findByText("Trail run");
    const c = card("Trail run");

    await user.click(within(c).getByRole("button", { name: "Save" }));
    await user.click(within(c).getByRole("button", { name: "Save" }));

    expect(feedApi.savePost).toHaveBeenCalledTimes(1);
    expect(feedApi.unsavePost).not.toHaveBeenCalled();
    expect(within(c).getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("Feed: paging (D-028)", () => {
  it("loads the next page and adds it below", async () => {
    vi.mocked(feedApi.getFeed)
      .mockResolvedValueOnce({ posts: [imagePost], nextCursor: "c1" })
      .mockResolvedValueOnce({ posts: [textPost], nextCursor: null });
    const { user } = renderApp("/");
    await screen.findByText("Golden hour from the balcony");

    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Pasta from scratch")).toBeInTheDocument();
    expect(screen.getByText("Golden hour from the balcony")).toBeInTheDocument();
    expect(feedApi.getFeed).toHaveBeenLastCalledWith("c1");
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("has no Load more button on the last page", async () => {
    renderApp("/");
    await screen.findByText("Golden hour from the balcony");

    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });
});
