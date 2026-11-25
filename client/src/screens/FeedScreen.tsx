import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { logout } from "../api/auth";
import { getFeed, likePost, unlikePost, type FeedPost } from "../api/feed";
import { useAuth } from "../auth/AuthContext";
import { BellIcon, ChatIcon, LogoutIcon } from "../components/icons";
import { PostCard } from "../components/PostCard";
import form from "../components/Form.module.css";
import styles from "./Feed.module.css";

type LoadState = "loading" | "error" | "ready";

const LIKE_ERROR = "Couldn't update your like. Please try again.";

/** Screen 3: Home Feed (FEED-01 to FEED-07). For now it shows every Post, newest first (D-009). */
export function FeedScreen() {
  const [state, setState] = useState<LoadState>("loading");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [likeErrors, setLikeErrors] = useState<Record<string, string>>({});
  const pendingLikes = useRef(new Set<string>()); // Posts whose Like is still being saved

  const loadFirstPage = useCallback(async () => {
    setState("loading");
    try {
      const page = await getFeed(undefined);
      setPosts(page.posts);
      setNextCursor(page.nextCursor);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await getFeed(nextCursor);
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

  return (
    <main className={styles.screen}>
      <FeedHeader />

      {state === "loading" && (
        <p role="status" className={styles.message}>
          Loading posts…
        </p>
      )}

      {state === "error" && (
        <div className={styles.message}>
          <p role="alert">We couldn&apos;t load the feed.</p>
          <button type="button" className={form.secondaryButton} onClick={loadFirstPage}>
            Try again
          </button>
        </div>
      )}

      {state === "ready" && posts.length === 0 && (
        <p className={styles.message}>No posts yet. Check back soon.</p>
      )}

      {state === "ready" && posts.length > 0 && (
        <div className={styles.list}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onToggleLike={toggleLike} likeError={likeErrors[post.id]} />
          ))}

          {nextCursor && <LoadMore onLoad={loadMore} loading={loadingMore} failed={moreError} />}
        </div>
      )}
    </main>
  );
}

/** "Social" title, Notifications and Messages (not built yet), and a temporary Log out (D-025). */
function FeedHeader() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Even if the server can't be reached, forget the User locally.
    }
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Social</h1>
      <div className={styles.headerActions}>
        <button type="button" className={styles.round} aria-label="Notifications" disabled>
          <BellIcon />
        </button>
        <button type="button" className={styles.round} aria-label="Messages" disabled>
          <ChatIcon />
        </button>
        <button type="button" className={styles.round} aria-label="Log out" onClick={handleLogout}>
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
}

/**
 * Loads the next page when it scrolls into view, with a button as the fallback
 * (and for browsers or tests without IntersectionObserver).
 */
function LoadMore({ onLoad, loading, failed }: { onLoad: () => void; loading: boolean; failed: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || failed) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onLoad();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoad, failed]);

  return (
    <div ref={ref} className={styles.more}>
      {failed && <p role="alert">Couldn&apos;t load more posts.</p>}
      <button type="button" className={form.secondaryButton} onClick={onLoad} disabled={loading}>
        {loading ? "Loading…" : failed ? "Try again" : "Load more"}
      </button>
    </div>
  );
}
