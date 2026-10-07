const DAY = 86_400_000;

export function timeAgo(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / 3_600_000)} h ago`;
  if (diff < 2 * DAY) return "yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  return shortDate(iso, now);
}

/** "Oct 9", or "Oct 9, 2025" when the date is not in the same year as `now`. */
export function shortDate(iso: string, now?: number): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  const sameYear = now !== undefined && d.getUTCFullYear() === new Date(now).getUTCFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }), timeZone: "UTC" });
}

export type DueInfo = { label: string; tone: "overdue" | "soon" | "later" };

/** Due dates are calendar days, so compare whole days only. */
export function dueInfo(dueOn: string | null, now: number): DueInfo | null {
  if (!dueOn) return null;
  const today = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  const days = Math.round((Date.parse(`${dueOn}T00:00:00Z`) - today) / DAY);
  if (days < -1) return { label: `${-days} days overdue`, tone: "overdue" };
  if (days === -1) return { label: "Due yesterday", tone: "overdue" };
  if (days === 0) return { label: "Due today", tone: "soon" };
  if (days === 1) return { label: "Due tomorrow", tone: "soon" };
  if (days < 7) return { label: `Due in ${days} days`, tone: "later" };
  return { label: `Due ${shortDate(dueOn, now)}`, tone: "later" };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${Number((bytes / 1024 ** 2).toFixed(1))} MB`;
  return `${Number((bytes / 1024 ** 3).toFixed(1))} GB`;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "Someone";
}
