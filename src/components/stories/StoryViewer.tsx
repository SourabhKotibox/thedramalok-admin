import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Pause, Play, Volume2, VolumeX, ChevronLeft, ChevronRight, Headphones,
  Clock3, Crown, ChevronUp, Mic,
} from "lucide-react";
import {
  type Story, storyId, storyCover, storyBackdrop, storyAudioSrc, refName,
  formatStoryDuration, markStorySeen,
} from "./story-utils";

const SEGMENT_MS = 10000; // each story preview lasts 10s
const HOLD_MS = 220;
const MUTE_KEY = "dl_story_muted";

type Props = {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
  onListen: (story: Story) => void;
};

/**
 * Full-screen, Instagram-style story viewer for audio stories.
 * - progress bars per story, auto-advance
 * - tap left/right, swipe left/right, swipe down to close, swipe up to listen
 * - press & hold (or Space) to pause, M to mute, arrows to navigate, Esc to close
 * - plays a short audio preview of each story when audio is available
 */
export default function StoryViewer({ stories, startIndex, onClose, onListen }: Props) {
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), Math.max(0, stories.length - 1)));
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [audioOk, setAudioOk] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const elapsedRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const heldRef = useRef(false);

  const story = stories[index];
  const isPaused = paused || held;

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= stories.length - 1) {
        window.setTimeout(onClose, 0);
        return i;
      }
      return i + 1;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i === 0) {
        elapsedRef.current = 0;
        setProgress(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
        return 0;
      }
      return i - 1;
    });
  }, []);

  // Reset on story change.
  useEffect(() => {
    elapsedRef.current = 0;
    lastTsRef.current = null;
    setProgress(0);
    setImgFailed(false);
    if (story) markStorySeen(storyId(story));
    // Preload next cover
    const nextStory = stories[index + 1];
    if (nextStory) {
      const img = new Image();
      img.src = storyCover(nextStory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Progress loop.
  useEffect(() => {
    if (isPaused || !story) {
      lastTsRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (ts: number) => {
      if (lastTsRef.current != null) elapsedRef.current += ts - lastTsRef.current;
      lastTsRef.current = ts;
      const p = Math.min(1, elapsedRef.current / SEGMENT_MS);
      setProgress(p);
      if (p >= 1) {
        goNext();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lastTsRef.current = null;
    };
  }, [isPaused, index, story, goNext]);

  // Load audio preview for current story.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const src = storyAudioSrc(story);
    setAudioOk(false);
    if (!src) {
      a.pause();
      a.removeAttribute("src");
      a.load();
      return;
    }
    a.src = src;
    a.currentTime = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Play/pause/mute audio in sync with the viewer.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !a.getAttribute("src")) return;
    a.muted = muted;
    if (isPaused) a.pause();
    else a.play().then(() => setAudioOk(true)).catch(() => setAudioOk(false));
  }, [isPaused, muted, index]);

  useEffect(() => {
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [muted]);

  // Keyboard, scroll lock, tab visibility.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key.toLowerCase() === "m") setMuted((m) => !m);
    };
    const onVis = () => {
      if (document.hidden) setPaused(true);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      audioRef.current?.pause();
    };
  }, [onClose, goNext, goPrev]);

  const clearHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = undefined;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    downRef.current = { x: e.clientX, y: e.clientY };
    heldRef.current = false;
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true;
      setHeld(true);
    }, HOLD_MS);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    clearHold();
    const start = downRef.current;
    const wasHeld = heldRef.current;
    downRef.current = null;
    heldRef.current = false;
    setHeld(false);
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
      return;
    }
    if (dy > 90) {
      onClose();
      return;
    }
    if (dy < -90 && story) {
      onListen(story);
      return;
    }
    if (wasHeld) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width * 0.3) goPrev();
    else goNext();
  };

  const onPointerCancel = () => {
    clearHold();
    downRef.current = null;
    heldRef.current = false;
    setHeld(false);
  };

  if (!story) return null;

  const cover = storyCover(story);
  const backdrop = storyBackdrop(story);
  const genres = (story.genres || []).map(refName).filter(Boolean).slice(0, 3);
  const duration = formatStoryDuration(story.duration);
  const premium = story.planRequired && story.planRequired !== "free";
  const hasAudio = !!storyAudioSrc(story);

  // Portal to <body> so the viewer sits above the site header, sidebar and mobile nav
  // (the page content lives inside a `relative z-0` stacking context).
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Story: ${story.title}`}
    >
      {/* Blurred ambient backdrop (desktop) */}
      {backdrop && (
        <img key={`bg-${storyId(story)}`} src={backdrop} alt="" className="absolute inset-0 hidden h-full w-full object-cover opacity-30 blur-3xl sm:block dl-story-in" />
      )}

      {/* Desktop arrows */}
      <button
        onClick={goPrev}
        disabled={index === 0}
        className="absolute left-[calc(50%-290px)] top-1/2 z-30 hidden -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 disabled:opacity-30 sm:flex"
        aria-label="Previous story"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-[calc(50%-290px)] top-1/2 z-30 hidden -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 sm:flex"
        aria-label="Next story"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Story card */}
      <div className="relative h-full w-full overflow-hidden bg-[#0b0c14] sm:h-[min(92vh,860px)] sm:w-auto sm:aspect-[9/16] sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl">
        {/* Media */}
        {cover && !imgFailed ? (
          <img
            key={storyId(story)}
            src={cover}
            alt={story.title}
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover dl-story-in"
            draggable={false}
          />
        ) : (
          <div key={storyId(story)} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/60 via-[#0b0c14] to-indigo-900/50 dl-story-in">
            <Headphones className="h-20 w-20 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/95" />

        {/* Tap / swipe layer */}
        <div
          className="absolute inset-0 z-10 touch-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={(e) => downRef.current && onPointerCancel()}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Top: progress + header */}
        <div className="absolute inset-x-0 top-0 z-20 p-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex gap-1" aria-hidden>
            {stories.map((s, i) => (
              <div key={storyId(s)} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full p-[2px] bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400">
              <div className="h-full w-full overflow-hidden rounded-full bg-black">
                {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
              </div>
            </div>
            <div className="min-w-0 flex-1 text-white">
              <p className="truncate text-sm font-semibold leading-tight">{story.title}</p>
              <p className="truncate text-xs text-white/70">
                {story.author || story.narrator || "Audio story"}
                {duration && <span className="text-white/50"> · {duration}</span>}
              </p>
            </div>
            {hasAudio && (
              <button
                onClick={() => setMuted((m) => !m)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/15"
                aria-label={muted ? "Unmute preview" : "Mute preview"}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            )}
            <button
              onClick={() => setPaused((p) => !p)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/15"
              aria-label={paused ? "Play" : "Pause"}
            >
              {paused ? <Play className="h-5 w-5 fill-white" /> : <Pause className="h-5 w-5 fill-white" />}
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/15"
              aria-label="Close stories"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Paused indicator */}
        {isPaused && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="rounded-full bg-black/50 p-4 backdrop-blur">
              <Pause className="h-8 w-8 fill-white text-white" />
            </span>
          </div>
        )}

        {/* Bottom info + CTA */}
        <div key={`info-${storyId(story)}`} className="absolute inset-x-0 bottom-0 z-20 space-y-3 p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-white dl-story-up">
          <div className="flex flex-wrap items-center gap-1.5">
            {premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                <Crown className="h-3 w-3" /> {story.planRequired}
              </span>
            )}
            {story.isNewContent && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase">New</span>}
            {genres.map((g) => (
              <span key={g} className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">{g}</span>
            ))}
          </div>
          <h2 className="text-2xl font-extrabold leading-tight drop-shadow">{story.title}</h2>
          {(story.shortDescription || story.description) && (
            <p className="line-clamp-3 text-sm text-white/80">{story.shortDescription || story.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-white/70">
            {story.narrator && <span className="inline-flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> {story.narrator}</span>}
            {duration && <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {duration}</span>}
            {hasAudio && audioOk && !muted && !isPaused && (
              <span className="inline-flex items-end gap-[2px] h-3" aria-label="Preview playing">
                {[0, 1, 2, 3].map((b) => (
                  <span key={b} className="dl-eq-bar w-[3px] h-3 rounded-sm bg-red-500" style={{ animationDelay: `${b * 0.15}s` }} />
                ))}
              </span>
            )}
          </div>
          <button
            onClick={() => onListen(story)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 py-3.5 text-sm font-bold shadow-lg shadow-red-600/40 transition hover:bg-red-500 active:scale-[0.98]"
          >
            <Headphones className="h-5 w-5" /> Listen to full story
          </button>
          <p className="flex items-center justify-center gap-1 text-[11px] text-white/50 sm:hidden">
            <ChevronUp className="h-3 w-3" /> Swipe up to listen · swipe down to close
          </p>
        </div>
      </div>

      <audio ref={audioRef} preload="auto" onError={() => setAudioOk(false)} />
    </div>,
    document.body
  );
}
