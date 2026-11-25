/**
 * Counts as shown on Post cards and Profiles (D-032):
 * under 10,000 in full with separators ("1,450"); from 10,000 shortened ("12.8k", "1.3m").
 */
export function formatCount(n: number): string {
  if (n < 10_000) return n.toLocaleString("en-US");
  if (n < 1_000_000) return `${trim(n / 1_000)}k`;
  return `${trim(n / 1_000_000)}m`;
}

/** One decimal place, dropping a trailing ".0" ("10.0" -> "10"). */
function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}
