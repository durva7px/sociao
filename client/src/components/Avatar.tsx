import styles from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  username: string;
  url: string | null;
  size?: number;
}

/** Up to two initials: "Lindsey Septimus" -> "LS", "Gustavo" -> "G". */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((w) => w[0]!.toUpperCase()).join("");
}

/** A round profile picture, or the User's initials when there is none (D-026). */
export function Avatar({ name, username, url, size = 44 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (url) return <img className={styles.avatar} style={style} src={url} alt={username} />;
  return (
    <span className={`${styles.avatar} ${styles.initials}`} style={style} role="img" aria-label={username}>
      <span aria-hidden="true">{initials(name)}</span>
    </span>
  );
}
