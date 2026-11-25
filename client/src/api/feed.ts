// The client's door to the Feed and Like API (D-028). Screens never call fetch directly,
// so tests can replace this module. Any non-success response throws.

export interface FeedAuthor {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export interface FeedPost {
  id: string;
  caption: string;
  createdAt: string; // ISO timestamp
  media: { type: "IMAGE" | "VIDEO"; url: string } | null;
  author: FeedAuthor;
  likeCount: number;
  likedByMe: boolean;
}

export interface FeedPage {
  posts: FeedPost[];
  nextCursor: string | null;
}

export interface LikeState {
  likeCount: number;
  likedByMe: boolean;
}

const BASE = "/api";

async function json<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "same-origin", ...init });
  if (!res.ok) throw new Error(`Request to ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

/** One page of the Feed. Pass the previous page's nextCursor to get the next one. */
export function getFeed(cursor?: string): Promise<FeedPage> {
  return json(cursor ? `/feed?cursor=${encodeURIComponent(cursor)}` : "/feed");
}

export function likePost(postId: string): Promise<LikeState> {
  return json(`/posts/${encodeURIComponent(postId)}/like`, { method: "PUT" });
}

export function unlikePost(postId: string): Promise<LikeState> {
  return json(`/posts/${encodeURIComponent(postId)}/like`, { method: "DELETE" });
}
