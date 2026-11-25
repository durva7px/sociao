import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as auth from "../api/auth";
import * as feedApi from "../api/feed";
import type { FeedPost } from "../api/feed";
import * as usersApi from "../api/users";
import type { Profile } from "../api/users";
import { gustavo, renderApp } from "../test/render-app";

// Screens 7 and 8: Profile (PROF-01 to PROF-05), other Users' Profiles with Follow, and bottom navigation.
vi.mock("../api/auth");
vi.mock("../api/feed");
vi.mock("../api/users");

const gustavoProfile: Profile = {
  user: { id: gustavo.id, name: "Gustavo Levin", username: "gustavo.levin", bio: "Dream big.", avatarUrl: null },
  counts: { followers: 12_800, following: 490, posts: 24 },
  followedByMe: false,
  isMe: true,
};

const marilynProfile: Profile = {
  user: { id: "u2", name: "Marilyn Torff", username: "marilyn.torff", bio: null, avatarUrl: "https://example.test/m.jpg" },
  counts: { followers: 10, following: 3, posts: 2 },
  followedByMe: false,
  isMe: false,
};

const gusAuthor = { id: gustavo.id, name: "Gustavo Levin", username: "gustavo.levin", avatarUrl: null };

function post(overrides: Partial<FeedPost> & { id: string }): FeedPost {
  return {
    caption: "A caption",
    createdAt: new Date().toISOString(),
    media: null,
    author: gusAuthor,
    likeCount: 0,
    likedByMe: false,
    ...overrides,
  };
}

const textPost = post({ id: "p1", caption: "Happiness is a cooked meal" });
const video1 = post({ id: "v1", caption: "Desk tour", media: { type: "VIDEO", url: "https://example.test/1.mp4" }, viewCount: 1450 });
const video2 = post({ id: "v2", caption: "Plants", media: { type: "VIDEO", url: "https://example.test/2.mp4" }, viewCount: 8450 });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(auth.getMe).mockResolvedValue(gustavo);
  vi.mocked(feedApi.getFeed).mockResolvedValue({ posts: [], nextCursor: null });
  vi.mocked(usersApi.getProfile).mockImplementation(async (username) => {
    if (username === "gustavo.levin") return gustavoProfile;
    if (username === "marilyn.torff") return marilynProfile;
    return null;
  });
  vi.mocked(usersApi.getUserPosts).mockImplementation(async (_username, type) =>
    type === "video" ? { posts: [video1, video2], nextCursor: null } : { posts: [textPost], nextCursor: null },
  );
});

describe("Bottom navigation (GEN-05, D-032)", () => {
  it("goes from Home to your own Profile", async () => {
    const { user } = renderApp("/");
    await screen.findByRole("heading", { name: "Social" });

    await user.click(screen.getByRole("link", { name: "Profile" }));

    expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(usersApi.getProfile).toHaveBeenCalledWith("gustavo.levin");
  });

  it("goes back Home from Profile", async () => {
    const { user } = renderApp("/profile");
    await screen.findByRole("heading", { name: "Profile" });

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(await screen.findByRole("heading", { name: "Social" })).toBeInTheDocument();
  });

  it("marks the current tab, and shows the unbuilt ones as disabled", async () => {
    renderApp("/profile");
    await screen.findByRole("heading", { name: "Profile" });
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(within(nav).getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "page");
    for (const name of ["Video", "Create Post", "Inbox"]) {
      expect(within(nav).getByRole("button", { name })).toBeDisabled();
    }
  });
});

describe("Your own Profile (PROF-01, PROF-02)", () => {
  it("shows Name, Username, bio and the three counts", async () => {
    renderApp("/profile");

    expect(await screen.findByText("Gustavo Levin")).toBeInTheDocument();
    expect(screen.getByText("@gustavo.levin")).toBeInTheDocument();
    expect(screen.getByText("Dream big.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "490 Following" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "12.8k Followers" })).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("has no Follow button on your own Profile", async () => {
    renderApp("/profile");
    await screen.findByText("Gustavo Levin");

    expect(screen.queryByRole("button", { name: /^follow/i })).not.toBeInTheDocument();
  });

  it("shows Settings and the Follower / Following lists as not yet available (D-032)", async () => {
    renderApp("/profile");
    await screen.findByText("Gustavo Levin");

    expect(screen.getByRole("button", { name: "Settings" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "490 Following" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "12.8k Followers" })).toBeDisabled();
  });

  it("opening your own /u/ address shows the same Profile, without Follow", async () => {
    renderApp("/u/gustavo.levin");

    expect(await screen.findByText("@gustavo.levin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^follow/i })).not.toBeInTheDocument();
  });
});

describe("Profile tabs (PROF-03 to PROF-05)", () => {
  it("starts on the Post tab, listing the User's Posts", async () => {
    renderApp("/profile");

    expect(await screen.findByText("Happiness is a cooked meal")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Post" })).toHaveAttribute("aria-selected", "true");
    expect(usersApi.getUserPosts).toHaveBeenCalledWith("gustavo.levin", "all", undefined);
  });

  it("lets you Like Posts on the Post tab, as in the Feed", async () => {
    vi.mocked(feedApi.likePost).mockResolvedValue({ likeCount: 1, likedByMe: true });
    const { user } = renderApp("/profile");
    const caption = await screen.findByText("Happiness is a cooked meal");
    const card = caption.closest("article") as HTMLElement;

    await user.click(within(card).getByRole("button", { name: "Like" }));

    expect(feedApi.likePost).toHaveBeenCalledWith("p1");
    expect(within(card).getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a two-column grid of videos with View counts on the Video tab", async () => {
    const { user } = renderApp("/profile");
    await screen.findByText("Happiness is a cooked meal");

    await user.click(screen.getByRole("tab", { name: "Video" }));

    const grid = await screen.findByRole("list", { name: "Videos" });
    expect(usersApi.getUserPosts).toHaveBeenCalledWith("gustavo.levin", "video", undefined);
    expect(within(grid).getAllByRole("listitem")).toHaveLength(2);
    expect(within(grid).getByText("1,450")).toBeInTheDocument();
    expect(within(grid).getByText("8,450")).toBeInTheDocument();
  });

  it("shows an empty state when there are no videos", async () => {
    vi.mocked(usersApi.getUserPosts).mockResolvedValue({ posts: [], nextCursor: null });
    const { user } = renderApp("/profile");
    await screen.findByText("Gustavo Levin");

    await user.click(screen.getByRole("tab", { name: "Video" }));

    expect(await screen.findByText(/no videos yet/i)).toBeInTheDocument();
  });

  it("shows an empty state on the Tag tab", async () => {
    const { user } = renderApp("/profile");
    await screen.findByText("Gustavo Levin");

    await user.click(screen.getByRole("tab", { name: "Tag" }));

    expect(await screen.findByText(/no tagged posts yet/i)).toBeInTheDocument();
  });

  it("shows an empty state when the User has no Posts", async () => {
    vi.mocked(usersApi.getUserPosts).mockResolvedValue({ posts: [], nextCursor: null });
    renderApp("/profile");

    expect(await screen.findByText(/no posts yet/i)).toBeInTheDocument();
  });
});

describe("Someone else's Profile and Follow (D-031, D-032)", () => {
  it("opens from an Author's name in the Feed", async () => {
    vi.mocked(feedApi.getFeed).mockResolvedValue({
      posts: [post({ id: "f1", caption: "Sunset", author: { ...marilynProfile.user, avatarUrl: null } })],
      nextCursor: null,
    });
    const { user } = renderApp("/");
    await screen.findByText("Sunset");

    await user.click(screen.getByRole("link", { name: "marilyn.torff" }));

    expect(await screen.findByText("@marilyn.torff")).toBeInTheDocument();
    expect(usersApi.getProfile).toHaveBeenCalledWith("marilyn.torff");
  });

  it("follows: the button and Follower count change at once, then match the server", async () => {
    let finish!: (v: Awaited<ReturnType<typeof usersApi.followUser>>) => void;
    vi.mocked(usersApi.followUser).mockReturnValue(new Promise((r) => (finish = r)));
    const { user } = renderApp("/u/marilyn.torff");
    await screen.findByText("@marilyn.torff");

    await user.click(screen.getByRole("button", { name: "Follow" }));

    expect(screen.getByRole("button", { name: "Following" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "11 Followers" })).toBeInTheDocument();
    expect(usersApi.followUser).toHaveBeenCalledWith("marilyn.torff");

    finish({ counts: { followers: 15, following: 3, posts: 2 }, followedByMe: true });
    expect(await screen.findByRole("button", { name: "15 Followers" })).toBeInTheDocument();
  });

  it("unfollows a User you already follow", async () => {
    vi.mocked(usersApi.getProfile).mockResolvedValue({ ...marilynProfile, followedByMe: true });
    vi.mocked(usersApi.unfollowUser).mockResolvedValue({ counts: { followers: 9, following: 3, posts: 2 }, followedByMe: false });
    const { user } = renderApp("/u/marilyn.torff");
    await screen.findByText("@marilyn.torff");

    await user.click(screen.getByRole("button", { name: "Following" }));

    expect(usersApi.unfollowUser).toHaveBeenCalledWith("marilyn.torff");
    expect(await screen.findByRole("button", { name: "9 Followers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute("aria-pressed", "false");
  });

  it("rolls back if the Follow can't be saved", async () => {
    vi.mocked(usersApi.followUser).mockRejectedValue(new Error("network down"));
    const { user } = renderApp("/u/marilyn.torff");
    await screen.findByText("@marilyn.torff");

    await user.click(screen.getByRole("button", { name: "Follow" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute("aria-pressed", "false"));
    expect(screen.getByRole("button", { name: "10 Followers" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't update/i);
  });

  it("shows the avatar when there is one, and no bio line when there isn't", async () => {
    renderApp("/u/marilyn.torff");
    await screen.findByText("@marilyn.torff");

    expect(screen.getAllByRole("img", { name: "marilyn.torff" })[0]).toHaveAttribute("src", "https://example.test/m.jpg");
    expect(screen.queryByTestId("bio")).not.toBeInTheDocument();
  });
});

describe("Profile loading, missing and error states (GEN-04)", () => {
  it("shows a loading state", async () => {
    vi.mocked(usersApi.getProfile).mockReturnValue(new Promise(() => {}));
    renderApp("/profile");

    expect(await screen.findByText(/loading profile/i)).toHaveAttribute("role", "status");
  });

  it("says so when the Username doesn't exist", async () => {
    renderApp("/u/nobody.here");

    expect(await screen.findByText(/user not found/i)).toBeInTheDocument();
  });

  it("shows an error with a retry", async () => {
    vi.mocked(usersApi.getProfile).mockRejectedValueOnce(new Error("network down"));
    const { user } = renderApp("/profile");

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load/i);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("@gustavo.levin")).toBeInTheDocument();
  });
});
