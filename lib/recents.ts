export type RecentEntry = { title: string; format: string; time: number };

const KEY = "brandos-recent-designs";
const MAX = 6;

export function getRecents(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

export function addRecent(entry: Omit<RecentEntry, "time">) {
  if (typeof window === "undefined") return;
  try {
    const list = getRecents().filter((r) => r.title !== entry.title);
    list.unshift({ ...entry, time: Date.now() });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // private-mode / quota errors — recents are a nice-to-have, not critical
  }
}

export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  const week = Math.floor(day / 7);
  return `${week} week${week === 1 ? "" : "s"} ago`;
}
