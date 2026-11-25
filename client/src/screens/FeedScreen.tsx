import { useNavigate } from "react-router";
import { logout } from "../api/auth";
import { getFeed } from "../api/feed";
import { useAuth } from "../auth/AuthContext";
import { BottomNav } from "../components/BottomNav";
import { BellIcon, ChatIcon, LogoutIcon } from "../components/icons";
import { PostList } from "../components/PostList";
import { usePostList } from "../hooks/usePostList";
import styles from "./Feed.module.css";

/** Screen 3: Home Feed (FEED-01 to FEED-07). For now it shows every Post, newest first (D-009). */
export function FeedScreen() {
  const list = usePostList((cursor) => getFeed(cursor), "feed");

  return (
    <>
      <main className={styles.screen}>
        <FeedHeader />
        <PostList list={list} loadingText="Loading posts…" emptyText="No posts yet. Check back soon." />
      </main>
      <BottomNav />
    </>
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
