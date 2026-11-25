import { Link } from "react-router";
import type { FeedPost } from "../api/feed";
import { formatCount } from "../utils/format-count";
import { relativeTime } from "../utils/relative-time";
import { Avatar } from "./Avatar";
import { BookmarkIcon, CommentIcon, HeartIcon, MoreIcon, ShareIcon } from "./icons";
import styles from "./PostCard.module.css";

interface PostCardProps {
  post: FeedPost;
  onToggleLike: (post: FeedPost) => void;
  onToggleSave: (post: FeedPost) => void;
  /** Set when the last Like or Save change failed and was rolled back. */
  error?: string;
}

/** One Post in the Feed: Author, time, Caption, optional Media and the action row (screen 3). */
export function PostCard({ post, onToggleLike, onToggleSave, error }: PostCardProps) {
  const { author } = post;
  const profilePath = `/u/${encodeURIComponent(author.username)}`;

  return (
    <article className={styles.card} aria-label={`Post by ${author.username}`}>
      <header className={styles.header}>
        <Avatar name={author.name} username={author.username} url={author.avatarUrl} />
        <div className={styles.byline}>
          {/* The Username leads to the Author's Profile (D-032). */}
          <Link to={profilePath} className={styles.username}>
            {author.username}
          </Link>
          <time className={styles.time} dateTime={post.createdAt}>
            {relativeTime(post.createdAt)}
          </time>
        </div>
        {/* Post menu (FEED-08) is deferred: shown but not yet available (D-028). */}
        <button type="button" className={styles.iconButton} aria-label="More options" disabled>
          <MoreIcon />
        </button>
      </header>

      <p className={styles.caption} data-testid="caption">
        {post.caption}
      </p>

      {post.media?.type === "IMAGE" && (
        <img className={styles.media} src={post.media.url} alt={`Photo by ${author.username}`} loading="lazy" />
      )}
      {post.media?.type === "VIDEO" && (
        <video className={styles.media} src={post.media.url} controls muted playsInline preload="metadata" />
      )}

      <footer className={styles.actions}>
        <button
          type="button"
          className={styles.pill}
          aria-label="Like"
          aria-pressed={post.likedByMe}
          onClick={() => onToggleLike(post)}
        >
          <HeartIcon filled={post.likedByMe} />
          <span>{formatCount(post.likeCount)}</span>
        </button>
        {/* Not built yet: shown disabled and without fake counts (D-028). */}
        <button type="button" className={styles.pill} aria-label="Comment" disabled>
          <CommentIcon />
        </button>
        <button type="button" className={styles.pill} aria-label="Share" disabled>
          <ShareIcon />
        </button>
        {/* Saves are private, so no count is shown (D-033). */}
        <button
          type="button"
          className={`${styles.iconButton} ${styles.save}`}
          aria-label="Save"
          aria-pressed={post.savedByMe}
          onClick={() => onToggleSave(post)}
        >
          <BookmarkIcon filled={post.savedByMe} />
        </button>
      </footer>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </article>
  );
}
