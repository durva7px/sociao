import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { login } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { TextField } from "../components/TextField";
import form from "../components/Form.module.css";
import styles from "./Auth.module.css";

// Same shape check the server uses (D-014). This is the only rule the client applies itself (D-015).
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Screen 1: Log in (AUTH-20 to AUTH-24). */
export function LoginScreen() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = EMAIL_FORMAT.test(email.trim()) && password.length > 0 && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await login({ email, password });
      if (result.ok) {
        setUser(result.user);
        navigate("/", { replace: true });
        return;
      }
      setError(result.error);
    } catch {
      setError(GENERIC_ERROR);
    }
    setSubmitting(false);
  }

  /** Editing a field clears the last error, so it never describes stale input. */
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setError(null);
  };

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Welcome Back!</h1>
      <p className={styles.subtitle}>Log in to continue sharing, connecting, and discovering.</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@gmail.com"
          value={email}
          onChange={(e) => edit(setEmail)(e.target.value)}
        />
        <TextField
          label="Password"
          password
          autoComplete="current-password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => edit(setPassword)(e.target.value)}
        />

        {error && (
          <p role="alert" className={form.alert}>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className={form.primaryButton} disabled={!canSubmit}>
            {submitting ? "Logging in…" : "Login"}
          </button>
        </div>
      </form>

      <p className={styles.switch}>
        New here? <Link to="/signup">Create Account</Link>
      </p>
      <p className={styles.legal}>By signing up, you agree to our Terms of Service and Privacy Policy.</p>
    </main>
  );
}
