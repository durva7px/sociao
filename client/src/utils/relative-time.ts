const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "2m ago", "3h ago", "4d ago", then a short date ("10 Nov") from a week on. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diff = now.getTime() - then.getTime();

  if (diff < MINUTE) return "just now"; // includes small clock skew into the future
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
