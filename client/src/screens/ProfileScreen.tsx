import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import type { FeedPost } from "../api/feed";
import { followUser, getProfile, getUserPosts, unfollowUser, type Profile } from "../api/users";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/Avatar";
import { BottomNav } from "../components/BottomNav";
import { EyeIcon, GearIcon } from "../components/icons";
import { PostList } from "../components/PostList";
import form from "../components/Form.module.css";
import { usePostList } from "../hooks/usePostList";
import { formatCount } from "../utils/format-count";
import styles from "./Profile.module.css";

const FOLLOW_ERROR = "Couldn't update follow. Please try again.";

/**
 * Screens 7 and 8 (PROF-01 to PROF-05, D-032).
 * `/profile` shows your own Profile; `/u/:username` shows anyone's.
 * Keyed by Username, so moving between Profiles starts fresh.
 */
export function ProfileScreen() {
  const { username: fromUrl } = useParams();
  const { state } = useAuth();
  const me = state.status === "ready" ? state.user : null;
  const username = fromUrl ?? me?.username ?? "";

  return (
    <>
      <ProfileView key={username} username={username} />
      <BottomNav />
    </>
  );
}

type LoadState = { status: "loading" } | { status: "error" } | { status: "missing" } | { status: "ready"; profile: Profile };

function ProfileView({ username }: { username: string }) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [followError, setFollowError] = useState<string | null>(null);
  const followPending = useRef(false);

  const fetchProfile = useCallback(async () => {
    setLoad({ status: "loading" });
    try {
      const profile = await getProfile(username);
      setLoad(profile ? { status: "ready", profile } : { status: "missing" });
    } catch {
      setLoad({ status: "error" });
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Instant update, then the server's counts; rolled back if the request fails (D-032).
  async function toggleFollow(profile: Profile) {
    if (followPending.current) return; // ignore extra taps until this one is saved
    followPending.current = true;
    setFollowError(null);

    const following = !profile.followedByMe;
    const optimistic: Profile = {
      ...profile,
      followedByMe: following,
      counts: { ...profile.counts, followers: profile.counts.followers + (following ? 1 : -1) },
    };
    setLoad({ status: "ready", profile: optimistic });

    try {
      const saved = following ? await followUser(username) : await unfollowUser(username);
      setLoad({ status: "ready", profile: { ...optimistic, ...saved } });
    } catch {
      setLoad({ status: "ready", profile });
      setFollowError(FOLLOW_ERROR);
    } finally {
      followPending.current = false;
    }
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        {/* Settings (screen 11) isn't built yet (D-032). */}
        <button type="button" className={styles.round} aria-label="Settings" disabled>
          <GearIcon />
        </button>
      </header>

      {load.status === "loading" && (
        <p role="status" className={styles.message}>
          Loading profile…
        </p>
      )}

      {load.status === "missing" && <p className={styles.message}>User not found.</p>}

      {load.status === "error" && (
        <div className={styles.message}>
          <p role="alert">We couldn&apos;t load this profile.</p>
          <button type="button" className={form.secondaryButton} onClick={fetchProfile}>
            Try again
          </button>
        </div>
      )}

      {load.status === "ready" && (
        <>
          <ProfileCard profile={load.profile} onToggleFollow={() => toggleFollow(load.profile)} followError={followError} />
          <ProfileTabs username={load.profile.user.username} />
        </>
      )}
    </main>
  );
}

function ProfileCard({
  profile,
  onToggleFollow,
  followError,
}: {
  profile: Profile;
  onToggleFollow: () => void;
  followError: string | null;
}) {
  const { user, counts } = profile;
  const followersLabel = `${formatCount(counts.followers)} Followers`;
  const followingLabel = `${formatCount(counts.following)} Following`;

  return (
    <section className={styles.card} aria-label="Profile details">
      <div className={styles.identity}>
        <Avatar name={user.name} username={user.username} url={user.avatarUrl} size={64} />
        <div className={styles.names}>
          <p className={styles.name}>{user.name}</p>
          <p className={styles.username}>@{user.username}</p>
        </div>
        {!profile.isMe && (
          <button
            type="button"
            className={profile.followedByMe ? styles.followingButton : styles.followButton}
            aria-pressed={profile.followedByMe}
            onClick={onToggleFollow}
          >
            {profile.followedByMe ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {user.bio && (
        <p className={styles.bio} data-testid="bio">
          {user.bio}
        </p>
      )}

      {/* The Following / Followers lists (screens 12 and 13) aren't built yet (D-032). */}
      <div className={styles.counts}>
        <button type="button" className={styles.count} aria-label={followingLabel} disabled>
          <span className={styles.countValue}>{formatCount(counts.following)}</span>
          <span className={styles.countLabel}>Following</span>
        </button>
        <button type="button" className={styles.count} aria-label={followersLabel} disabled>
          <span className={styles.countValue}>{formatCount(counts.followers)}</span>
          <span className={styles.countLabel}>Followers</span>
        </button>
        <div className={styles.count}>
          <span className={styles.countValue}>{formatCount(counts.posts)}</span>
          <span className={styles.countLabel}>Posts</span>
        </div>
      </div>

      {followError && (
        <p role="alert" className={styles.error}>
          {followError}
        </p>
      )}
    </section>
  );
}

const TABS = ["Post", "Video", "Tag"] as const;
type Tab = (typeof TABS)[number];

function ProfileTabs({ username }: { username: string }) {
  const [tab, setTab] = useState<Tab>("Post");

  return (
    <section className={styles.tabsSection}>
      <div role="tablist" aria-label="Profile content" className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "Post" && <PostsTab username={username} />}
        {tab === "Video" && <VideosTab username={username} />}
        {tab === "Tag" && <p className={styles.message}>No tagged posts yet.</p>}
      </div>
    </section>
  );
}

function PostsTab({ username }: { username: string }) {
  const list = usePostList((cursor) => getUserPosts(username, "all", cursor), `all:${username}`);
  return <PostList list={list} loadingText="Loading posts…" emptyText="No posts yet." />;
}

function VideosTab({ username }: { username: string }) {
  const list = usePostList((cursor) => getUserPosts(username, "video", cursor), `video:${username}`);
  return (
    <PostList list={list} loadingText="Loading videos…" emptyText="No videos yet.">
      {({ posts }) => (
        <ul className={styles.grid} aria-label="Videos">
          {posts.map((post) => (
            <VideoTile key={post.id} post={post} />
          ))}
        </ul>
      )}
    </PostList>
  );
}

/** One cell of the two-column video grid, with its View count (PROF-04). */
function VideoTile({ post }: { post: FeedPost }) {
  return (
    <li className={styles.tile}>
      {/* A muted, paused video shows its first frame as the thumbnail. The Video viewer comes later. */}
      <video className={styles.thumb} src={post.media?.url} muted playsInline preload="metadata" aria-label={post.caption} />
      <span className={styles.views}>
        <EyeIcon />
        {formatCount(post.viewCount ?? 0)}
      </span>
    </li>
  );
}
