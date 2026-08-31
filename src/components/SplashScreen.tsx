import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useSettings } from "@/contexts/SettingsContext";
import { getImageUrl } from "@/lib/api-client";

const SPLASH_WATCHED_KEY = "thedramalock_splash_watched";

const PUBLIC_PATHS = [
  "/", "/login", "/register", "/movie", "/show", "/drama",
  "/stories", "/story", "/browse", "/tv-shows-browse", "/account",
  "/wishlist", "/help-support", "/page", "/wallet", "/membership"
];

function isPublicPath(path: string) {
  if (path === "/admin/login") return false;
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + "/"));
}

export default function SplashScreen() {
  const [location] = useLocation();
  const { settings } = useSettings();
  const [visible, setVisible] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hide = useCallback(() => {
    setSkipped(true);
    try {
      sessionStorage.setItem(SPLASH_WATCHED_KEY, "1");
    } catch {}
  }, []);

  // Autoplay with audio — retry unmuted on any user interaction if browser blocked it
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !visible || skipped) return;

    video.muted = false;
    const tryPlay = () => {
      video.muted = false;
      video.play().catch(() => {});
    };

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Browser blocked audio autoplay — start muted, unmute on first interaction
        video.muted = true;
        video.play().catch(() => {});
        const unmute = () => {
          video.muted = false;
          document.removeEventListener("click", unmute);
          document.removeEventListener("touchstart", unmute);
          document.removeEventListener("keydown", unmute);
        };
        document.addEventListener("click", unmute, { once: true });
        document.addEventListener("touchstart", unmute, { once: true });
        document.addEventListener("keydown", unmute, { once: true });
      });
    }

    return () => {};
  }, [visible, skipped]);

  useEffect(() => {
    // Only show on home page root
    if (location !== "/") {
      setVisible(false);
      return;
    }
    // No session storage check - play every time user visits home page
    setVisible(true);
  }, [location]);

  if (!visible || skipped) return null;

  const rawUrl = (settings as any)?.splashVideoUrl || "";
  if (!rawUrl) return null;
  const videoUrl = getImageUrl(rawUrl);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      <style>{`
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-start-playback-button { display: none !important; }
        video::-webkit-media-controls-play-button { display: none !important; }
        video::-webkit-media-controls-panel { display: none !important; }
      `}</style>
      <video
        ref={videoRef}
        playsInline
        preload="auto"
        controls={false}
        className="absolute inset-0 w-full h-full object-contain sm:object-cover"
        onEnded={hide}
        onError={hide}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
}
