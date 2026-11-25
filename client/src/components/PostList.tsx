import { useEffect, useRef, type ReactNode } from "react";
import type { PostList as PostListState } from "../hooks/usePostList";
import { PostCard } from "./PostCard";
import form from "./Form.module.css";
import styles from "./PostList.module.css";

interface PostListProps {
  list: PostListState;
  loadingText: string;
  emptyText: string;
  /** Renders the loaded Posts; defaults to a column of Post cards. */
  children?: (list: PostListState) => ReactNode;
}

/** Loading, error, empty and loaded states for a paged list of Posts (GEN-04). */
export function PostList({ list, loadingText, emptyText, children }: PostListProps) {
  if (list.state === "loading") {
    return (
      <p role="status" className={styles.message}>
        {loadingText}
      </p>
    );
  }

  if (list.state === "error") {
    return (
      <div className={styles.message}>
        <p role="alert">We couldn&apos;t load this. Check your connection.</p>
        <button type="button" className={form.secondaryButton} onClick={list.reload}>
          Try again
        </button>
      </div>
    );
  }

  if (list.posts.length === 0) return <p className={styles.message}>{emptyText}</p>;

  return (
    <div className={styles.list}>
      {children
        ? children(list)
        : list.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={list.toggleLike}
              onToggleSave={list.toggleSave}
              error={list.errors[post.id]}
            />
          ))}

      {list.nextCursor && <LoadMore onLoad={list.loadMore} loading={list.loadingMore} failed={list.moreError} />}
    </div>
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
