import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { checkCreateAccount, type FieldErrors } from "../api/auth";
import { useSignupDraft } from "../auth/SignupDraft";
import { TextField } from "../components/TextField";
import form from "../components/Form.module.css";
import styles from "./Auth.module.css";

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Screen 2, Sign up step 1 (D-011): Name, email and password are checked by the server
 * but nothing is stored. On success the details move to Choose Username in memory.
 */
export function CreateAccountScreen() {
  const { draft, setDraft } = useSignupDraft();
  const navigate = useNavigate();

  // Coming Back from Choose Username keeps what was typed.
  const [name, setName] = useState(draft?.name ?? "");
  const [email, setEmail] = useState(draft?.email ?? "");
  const [password, setPassword] = useState(draft?.password ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Editing a field clears only that field's error; the others still apply. */
  const edit = (field: keyof FieldErrors, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const canSubmit = name.trim() !== "" && email.trim() !== "" && password !== "" && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFailure(null);
    try {
      const details = { name, email, password };
      const result = await checkCreateAccount(details);
      if (result.ok) {
        setDraft(details);
        navigate("/signup/username");
        return;
      }
      setErrors(result.errors);
    } catch {
      setFailure(GENERIC_ERROR);
    }
    setSubmitting(false);
  }

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Create Account</h1>
      <p className={styles.subtitle}>Join Sociao and start connecting with people who inspire you.</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Full Name"
          autoComplete="name"
          placeholder="Enter name"
          value={name}
          error={errors.name}
          onChange={(e) => edit("name", setName)(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@gmail.com"
          value={email}
          error={errors.email}
          onChange={(e) => edit("email", setEmail)(e.target.value)}
        />
        <div>
          <TextField
            label="Create Password"
            password
            autoComplete="new-password"
            placeholder="Enter password"
            value={password}
            error={errors.password}
            onChange={(e) => edit("password", setPassword)(e.target.value)}
          />
          <p className={form.hint} style={{ marginTop: 8 }}>
            At least 8 characters, with an uppercase letter, a lowercase letter, a number and a special
            character. It can&apos;t contain your name or username.
          </p>
        </div>

        {failure && (
          <p role="alert" className={form.alert}>
            {failure}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className={form.primaryButton} disabled={!canSubmit}>
            {submitting ? "Checking…" : "Continue"}
          </button>
        </div>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
      <p className={styles.legal}>By signing up, you agree to our Terms of Service and Privacy Policy.</p>
    </main>
  );
}
