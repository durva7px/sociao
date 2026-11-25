import { useId, useState, type InputHTMLAttributes } from "react";
import styles from "./Form.module.css";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** Shown under the field; also marks the field invalid for screen readers. */
  error?: string;
  /** Adds a show/hide toggle and starts hidden (AUTH-12, AUTH-22). */
  password?: boolean;
}

/** A labelled input with an optional error message and password toggle. */
export function TextField({ label, error, password, className, ...inputProps }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [shown, setShown] = useState(false);

  const type = password ? (shown ? "text" : "password") : inputProps.type;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          {...inputProps}
          id={id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[styles.input, password ? styles.withToggle : "", className ?? ""].join(" ")}
        />
        {password && (
          <button
            type="button"
            className={styles.toggle}
            aria-label={shown ? "Hide password" : "Show password"}
            onClick={() => setShown((s) => !s)}
          >
            <EyeIcon crossed={!shown} />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 20 20 4" />}
    </svg>
  );
}
