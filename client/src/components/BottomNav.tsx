import { NavLink } from "react-router";
import { HomeIcon, InboxIcon, PlusIcon, ProfileIcon, VideoIcon } from "./icons";
import styles from "./BottomNav.module.css";

/**
 * Bottom navigation on every main screen (GEN-05, D-032).
 * Home and Profile work; Video, Create Post and Inbox are shown disabled until they're built.
 */
export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Main">
      <NavLink to="/" end className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>
        {({ isActive }) => (
          <>
            <HomeIcon filled={isActive} />
            <span>Home</span>
          </>
        )}
      </NavLink>

      <button type="button" className={styles.item} disabled>
        <VideoIcon />
        <span>Video</span>
      </button>

      <button type="button" className={styles.create} aria-label="Create Post" disabled>
        <PlusIcon />
      </button>

      <button type="button" className={styles.item} disabled>
        <InboxIcon />
        <span>Inbox</span>
      </button>

      <NavLink to="/profile" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>
        {({ isActive }) => (
          <>
            <ProfileIcon filled={isActive} />
            <span>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
