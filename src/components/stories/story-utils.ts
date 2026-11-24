import { getImageUrl } from "@/lib/api-client";

/**
 * Shared helpers for audio Stories (admin + public website).
 *
 * Convention: `story.duration` is stored in MINUTES (matches seed data and the
 * public website). The admin form auto-fills it from the audio file length.
 */

export type StoryStatus = "published" | "draft" | "processing" | "moderation" | "rejected";
export type StoryPlan = "free" | "basic" | "standard" | "premium";

export type StoryRef = { _id?: string; id?: string; name?: string } | string;

export type Story = {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  bannerImage?: string;
  coverImage?: string;
  author?: string;
  narrator?: string;
  category?: string;
  tags?: string[];
  genres?: StoryRef[];
  languages?: StoryRef[];
  categories?: StoryRef[];
  status: StoryStatus | string;
  audioUrl?: string;
  audioFile?: string;
  duration?: number;
  views?: number;
  likes?: number;
  featured?: boolean;
  trending?: boolean;
  isNewContent?: boolean;
  isExclusive?: boolean;
  planRequired?: StoryPlan | string;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const storyId = (s: Pick<Story, "id" | "_id">) => (s.id || s._id || "") as string;

export const refName = (r: StoryRef | undefined | null) =>
  !r ? "" : typeof r === "string" ? r : r.name || "";

export const refId = (r: StoryRef | undefined | null) =>
  !r ? "" : typeof r === "string" ? r : (r._id || r.id || "") as string;

export const storyCover = (s: Partial<Story>) =>
  getImageUrl(s.thumbnail || s.coverImage || s.bannerImage || "");

export const storyBackdrop = (s: Partial<Story>) =>
  getImageUrl(s.bannerImage || s.coverImage || s.thumbnail || "");

export const storyAudioSrc = (s: Partial<Story> | null | undefined) => {
  if (!s) return "";
  const raw = s.audioUrl || s.audioFile || "";
  return raw ? getImageUrl(raw) : "";
};

/** Duration (minutes) -> "1h 05m" / "42 min" */
export const formatStoryDuration = (minutes?: number | null) => {
  if (!minutes || minutes <= 0 || !Number.isFinite(minutes)) return "";
  const total = Math.round(minutes);
  if (total < 1) return "<1 min";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m} min`;
};

/** Seconds -> m:ss or h:mm:ss */
export const formatClock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
};

export const formatCount = (n?: number) => {
  const v = n || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
};

export const STATUS_META: Record<string, { label: string; dot: string; className: string }> = {
  published: { label: "Published", dot: "bg-emerald-500", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  draft: { label: "Draft", dot: "bg-zinc-400", className: "bg-zinc-500/15 text-muted-foreground border-zinc-500/30" },
  processing: { label: "Processing", dot: "bg-sky-500", className: "bg-sky-500/15 text-sky-500 border-sky-500/30" },
  moderation: { label: "In review", dot: "bg-amber-500", className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  rejected: { label: "Rejected", dot: "bg-rose-500", className: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
};

export const PLAN_META: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  basic: { label: "Basic", className: "bg-sky-500/15 text-sky-500 border-sky-500/30" },
  standard: { label: "Standard", className: "bg-violet-500/15 text-violet-500 border-violet-500/30" },
  premium: { label: "Premium", className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
};

/** Read audio length (seconds) from a URL/blob in the browser; resolves 0 on failure. */
export const probeAudioDuration = (src: string, timeoutMs = 15000) =>
  new Promise<number>((resolve) => {
    if (!src) return resolve(0);
    const audio = new Audio();
    let done = false;
    const finish = (v: number) => {
      if (done) return;
      done = true;
      audio.removeAttribute("src");
      resolve(Number.isFinite(v) ? v : 0);
    };
    const timer = window.setTimeout(() => finish(0), timeoutMs);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish(audio.duration);
    };
    audio.onerror = () => {
      window.clearTimeout(timer);
      finish(0);
    };
    audio.src = src;
  });

const SEEN_KEY = "dl_seen_stories";
export const getSeenStories = (): Set<string> => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set<string>();
  }
};
export const markStorySeen = (id: string) => {
  try {
    const seen = getSeenStories();
    seen.add(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen).slice(-300)));
  } catch {
    /* ignore storage errors */
  }
};
