import { useCallback, useEffect, useRef, useState } from "react";
import { likePost, savePost, unlikePost, unsavePost, type FeedPage, type FeedPost } from "../api/feed";

export type LoadState = "loading" | "error" | "ready";

const LIKE_ERROR = "Couldn't update your like. Please try again.";
const SAVE_ERROR = "Couldn't save this post. Please try again.";

/**
 * A paged list of Posts with Likes and Saves: used by the Feed and by a Profile's Post and Video tabs.
 * `fetchPage` loads one page; it's called again from scratch whenever `key` changes.
 */
export function usePostList(fetchPage: (cursor?: string) => Promise<FeedPage>, key: string) {
  const [state, setState] = useState<LoadState>("loading");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); // last failed Like or Save, per Post
  const pending = useRef(new Set<string>()); // "like:<id>" / "save:<id>" requests still in flight

  // Always call the latest fetchPage without making it a dependency (callers pass inline functions).
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const reload = useCallback(async () => {
    setState("loading");
    try {
      const page = await fetchRef.current(undefined);
      setPosts(page.posts);
      setNextCursor(page.nextCursor);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, key]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await fetchRef.current(nextCursor);
      // Skip any Post already on screen, in case one arrived twice.
      setPosts((current) => {
        const seen = new Set(current.map((p) => p.id));
        return [...current, ...page.posts.filter((p) => !seen.has(p.id))];
      });
      setNextCursor(page.nextCursor);
    } catch {
      setMoreError(true);
    }
    setLoadingMore(false);
  }, [nextCursor, loadingMore]);

  /** Updates some fields of one Post in place. */
  const patch = (id: string, fields: Partial<FeedPost>) =>
    setPosts((current) => current.map((p) => (p.id === id ? { ...p, ...fields } : p)));

  /**
   * Instant update, then the server's answer; rolled back if the request fails (D-028, D-033).
   * Extra taps are ignored until the first request finishes.
   */
  async function optimistic(
    key: string,
    id: string,
    next: Partial<FeedPost>,
    before: Partial<FeedPost>,
    request: () => Promise<Partial<FeedPost>>,
    errorMessage: string,
  ) {
    if (pending.current.has(key)) return;
    pending.current.add(key);
    patch(id, next);
    setErrors(({ [id]: _cleared, ...rest }) => rest);
    try {
      patch(id, await request());
    } catch {
      patch(id, before);
      setErrors((current) => ({ ...current, [id]: errorMessage }));
    } finally {
      pending.current.delete(key);
    }
  }

  function toggleLike(post: FeedPost) {
    const liking = !post.likedByMe;
    return optimistic(
      `like:${post.id}`,
      post.id,
      { likedByMe: liking, likeCount: post.likeCount + (liking ? 1 : -1) },
      { likedByMe: post.likedByMe, likeCount: post.likeCount },
      () => (liking ? likePost(post.id) : unlikePost(post.id)),
      LIKE_ERROR,
    );
  }

  function toggleSave(post: FeedPost) {
    const saving = !post.savedByMe;
    return optimistic(
      `save:${post.id}`,
      post.id,
      { savedByMe: saving },
      { savedByMe: post.savedByMe },
      () => (saving ? savePost(post.id) : unsavePost(post.id)),
      SAVE_ERROR,
    );
  }

  return { state, posts, nextCursor, loadingMore, moreError, errors, reload, loadMore, toggleLike, toggleSave };
}

export type PostList = ReturnType<typeof usePostList>;
