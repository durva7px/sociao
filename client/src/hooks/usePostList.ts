import { useCallback, useEffect, useRef, useState } from "react";
import { likePost, unlikePost, type FeedPage, type FeedPost } from "../api/feed";

export type LoadState = "loading" | "error" | "ready";

const LIKE_ERROR = "Couldn't update your like. Please try again.";

/**
 * A paged list of Posts with Likes: used by the Feed and by a Profile's Post and Video tabs.
 * `fetchPage` loads one page; it's called again from scratch whenever `key` changes.
 */
export function usePostList(fetchPage: (cursor?: string) => Promise<FeedPage>, key: string) {
  const [state, setState] = useState<LoadState>("loading");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [likeErrors, setLikeErrors] = useState<Record<string, string>>({});
  const pendingLikes = useRef(new Set<string>()); // Posts whose Like is still being saved

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

  /** Updates one Post's Like fields in place. */
  const setLike = (id: string, likeCount: number, likedByMe: boolean) =>
    setPosts((current) => current.map((p) => (p.id === id ? { ...p, likeCount, likedByMe } : p)));

  // Instant update, then the server's numbers; rolled back if the request fails (D-028).
  async function toggleLike(post: FeedPost) {
    if (pendingLikes.current.has(post.id)) return; // ignore extra taps until this one is saved
    pendingLikes.current.add(post.id);

    const before = { likeCount: post.likeCount, likedByMe: post.likedByMe };
    const liking = !post.likedByMe;
    setLike(post.id, before.likeCount + (liking ? 1 : -1), liking);
    setLikeErrors(({ [post.id]: _cleared, ...rest }) => rest);

    try {
      const saved = liking ? await likePost(post.id) : await unlikePost(post.id);
      setLike(post.id, saved.likeCount, saved.likedByMe);
    } catch {
      setLike(post.id, before.likeCount, before.likedByMe);
      setLikeErrors((errors) => ({ ...errors, [post.id]: LIKE_ERROR }));
    } finally {
      pendingLikes.current.delete(post.id);
    }
  }

  return { state, posts, nextCursor, loadingMore, moreError, likeErrors, reload, loadMore, toggleLike };
}

export type PostList = ReturnType<typeof usePostList>;
