import type { FeedPage } from "./feed";

// The client's door to Profiles and Follows (D-032). Screens never call fetch directly.

export interface ProfileUser {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface ProfileCounts {
  followers: number;
  following: number;
  posts: number;
}

export interface Profile {
  user: ProfileUser;
  counts: ProfileCounts;
  followedByMe: boolean;
  isMe: boolean;
}

export interface FollowState {
  counts: ProfileCounts;
  followedByMe: boolean;
}

const BASE = "/api";
const path = (username: string) => `${BASE}/users/${encodeURIComponent(username)}`;

async function json<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin", ...init });
  if (!res.ok) throw new Error(`Request to ${url} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

/** The Profile, or null if no User has that Username. */
export async function getProfile(username: string): Promise<Profile | null> {
  const res = await fetch(path(username), { credentials: "same-origin" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Profile request failed with ${res.status}`);
  return res.json();
}

/** One page of a User's Posts: all of them, or only videos. */
export function getUserPosts(username: string, type: "all" | "video", cursor?: string): Promise<FeedPage> {
  const query = new URLSearchParams({ type, ...(cursor ? { cursor } : {}) });
  return json(`${path(username)}/posts?${query}`);
}

export function followUser(username: string): Promise<FollowState> {
  return json(`${path(username)}/follow`, { method: "PUT" });
}

export function unfollowUser(username: string): Promise<FollowState> {
  return json(`${path(username)}/follow`, { method: "DELETE" });
}
