import { useNavigate } from "react-router";
import { logout } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import form from "../components/Form.module.css";
import styles from "./Home.module.css";

/**
 * Placeholder Home (D-025): proves the logged-in path works end to end.
 * The Feed replaces the body; Log out moves to Settings (screen 11) later.
 */
export function HomeScreen() {
  const { state, setUser } = useAuth();
  const navigate = useNavigate();
  const user = state.status === "ready" ? state.user : null;

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
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Social</h1>
      </header>
      <p className={styles.welcome}>
        Logged in as <strong>@{user?.username}</strong>. The Feed is coming next.
      </p>
      <button type="button" className={form.secondaryButton} onClick={handleLogout}>
        Log out
      </button>
    </main>
  );
}
