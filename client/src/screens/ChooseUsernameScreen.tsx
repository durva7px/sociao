import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { getUsernameSuggestions, signup, type FieldErrors } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { useSignupDraft } from "../auth/SignupDraft";
import { TextField } from "../components/TextField";
import form from "../components/Form.module.css";
import styles from "./Auth.module.css";

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Sign up step 2 (D-011): pick a suggestion or type a Username, then the account is created
 * in one request and the User is logged in. Needs the step 1 details from memory.
 */
export function ChooseUsernameScreen() {
  const { draft } = useSignupDraft();

  // Opened directly, or after a refresh: there's nothing to sign up with, so start again.
  if (!draft) return <Navigate to="/signup" replace />;

  return <ChooseUsernameForm draft={draft} />;
}

function ChooseUsernameForm({ draft }: { draft: NonNullable<ReturnType<typeof useSignupDraft>["draft"]> }) {
  const { setDraft } = useSignupDraft();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUsernameSuggestions(draft.name)
      .then((list) => !cancelled && setSuggestions(list))
      .catch(() => {}); // suggestions are a convenience; the User can still type one
    return () => {
      cancelled = true;
    };
  }, [draft.name]);

  const canSubmit = username !== "" && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFailure(null);
    try {
      const result = await signup({ ...draft, username });
      if (result.ok) {
        setDraft(null); // the password leaves memory as soon as it's no longer needed
        setUser(result.user);
        navigate("/", { replace: true });
        return;
      }
      setErrors(result.errors);
      if (result.suggestions) setSuggestions(result.suggestions);
    } catch {
      setFailure(GENERIC_ERROR);
    }
    setSubmitting(false);
  }

  // Errors about step 1 fields (e.g. the password contains this Username) can only be fixed there.
  const stepOneProblems = [errors.name, errors.email, errors.password].filter(Boolean);

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Choose a username</h1>
      <p className={styles.subtitle}>This is how people will find you on Sociao. Pick one or make your own.</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {suggestions.length > 0 && (
          <div className={styles.chips} role="group" aria-label="Suggestions">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className={styles.chip}
                aria-pressed={username === s}
                onClick={() => {
                  setUsername(s);
                  setErrors({});
                }}
              >
                @{s}
              </button>
            ))}
          </div>
        )}

        <TextField
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="your.username"
          value={username}
          error={errors.username}
          onChange={(e) => {
            setUsername(e.target.value.toLowerCase()); // Usernames are lowercase only (AUTH-08)
            setErrors({});
          }}
        />
        <p className={form.hint}>3–30 characters: lowercase letters, numbers, _ and .</p>

        {stepOneProblems.length > 0 && (
          <div role="alert" className={form.alert}>
            {stepOneProblems.map((problem) => (
              <p key={problem} style={{ margin: 0 }}>
                {problem}
              </p>
            ))}
            <p style={{ margin: "4px 0 0" }}>Go back to change it.</p>
          </div>
        )}
        {failure && (
          <p role="alert" className={form.alert}>
            {failure}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className={form.primaryButton} disabled={!canSubmit}>
            {submitting ? "Creating account…" : "Create Account"}
          </button>
          <button type="button" className={form.secondaryButton} onClick={() => navigate("/signup")}>
            Back
          </button>
        </div>
      </form>
    </main>
  );
}
