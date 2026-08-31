import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Play, Star, Crown, Tv, Plus } from "lucide-react";
import { getImageUrl } from "@/lib/api-client";


function cleanText(str?: string) {
  if (!str) return "";
  return str.replace(/kotibox ott/gi, 'The Drama Lok').replace(/kotibox/gi, 'The Drama Lok');
}


// ─── Shared helpers ────────────────────────────────────────────────────────────

function BadgeTop({ item }: { item: any }) {
  const isSubscribed = (() => {
    try {
      const stored = localStorage.getItem("appUser");
      if (stored) {
        const u = JSON.parse(stored);
        return u.subscriptionStatus === "active" && u.subscriptionPlan !== "free";
      }
    } catch {}
    return false;
  })();

  const isPremium = item.isPremium || item.badge === "TOP" || item.badge === "EXCLUSIVE";
  if (isPremium && !isSubscribed) {
    return (
      <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-400/90 text-black text-[8px] font-black rounded-sm leading-none shadow">
        <Crown className="w-2.5 h-2.5" /> PREMIUM
      </span>
    );
  }
  if (item.badge === "NEW") {
    return (
      <span className="px-1 py-0.5 bg-emerald-500/90 text-foreground text-[8px] font-black rounded-sm leading-none shadow">
        NEW
      </span>
    );
  }
  if (item.badge === "HOT") {
    return (
      <span className="px-1 py-0.5 bg-orange-500/90 text-foreground text-[8px] font-black rounded-sm leading-none shadow">
        HOT
      </span>
    );
  }
  if (item.badge === "TRENDING") {
    return (
      <span className="px-1 py-0.5 bg-red-500/90 text-white text-[8px] font-black rounded-sm leading-none shadow">
        TRENDING
      </span>
    );
  }
  if (item.badge && item.badge !== "TOP" && item.badge !== "EXCLUSIVE") {
    return (
      <span className="px-1 py-0.5 bg-white/20 text-foreground text-[8px] font-black rounded-sm leading-none shadow">
        {item.badge}
      </span>
    );
  }

  return null;
}

function ImdbBadge({ rating }: { rating: any }) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-400/90 text-black text-[8px] font-black rounded-sm leading-none shadow">
      <Star className="w-2.5 h-2.5 fill-black" /> {rating}
    </span>
  );
}

// ─── PortraitCard ──────────────────────────────────────────────────────────────
// Use fullWidth=true when inside a CSS grid (categories, search results).
// Leave fullWidth=false (default) when inside a horizontal scroll row.

const portraitWidths = {
  sm: "w-[130px] sm:w-[145px]",
  md: "w-[145px] sm:w-[160px] lg:w-[175px]",
  lg: "w-[170px] sm:w-[190px] lg:w-[210px]",
};

export function PortraitCard({
  item,
  onClick,
  size = "md",
  fullWidth = false,
  aspectRatio = "2/3",
}: {
  item: any;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  aspectRatio?: "2/3" | "9/16";
}) {
  const imgSrc = getImageUrl(item.poster || item.posterImage || item.thumbnail) || "";
  const isShow = item.type === "show" || item.type === "series" || item.contentType === "series" || item.contentType === "show";
  const year = item.year || item.releaseYear || "";
  const duration = item.duration ? (String(item.duration).includes("m") ? String(item.duration) : `${item.duration}m`) : "";

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (window.innerWidth >= 768) {
      if (cardRef.current) {
        setRect(cardRef.current.getBoundingClientRect());
      }
      hoverTimeout.current = setTimeout(() => setIsHovered(true), 400);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(false);
  };

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const updateRect = () => setRect(cardRef.current!.getBoundingClientRect());
      window.addEventListener('scroll', updateRect, { capture: true });
      return () => window.removeEventListener('scroll', updateRect, { capture: true });
    }
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className={`${fullWidth ? "w-full" : `${portraitWidths[size]} flex-shrink-0`} cursor-pointer relative z-10`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div className="relative rounded-lg transition-all duration-300" style={{ aspectRatio }}>
        {/* Main Card */}
        <div className={`absolute inset-0 rounded-lg overflow-hidden bg-zinc-900 transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"}`}>
          <img src={imgSrc} alt={cleanText(item.title) || ""} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute top-2 left-2 z-10"><BadgeTop item={item} /></div>
          {item.imdbRating && <div className="absolute top-2 right-2 z-10"><ImdbBadge rating={item.imdbRating} /></div>}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
            {isShow && (
              <span className="inline-block px-1.5 py-[3px] bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-black tracking-wider uppercase rounded mb-1.5">TV Show</span>
            )}
            <p className="text-white text-[12px] font-bold leading-tight line-clamp-1 drop-shadow-md">{cleanText(item.title)}</p>
            <p className="text-white/70 text-[10px] mt-1 font-semibold tracking-wide drop-shadow-md">{year} {duration ? `• ${duration}` : ""}</p>
          </div>
        </div>

        {/* Portal Hover Popup */}
        {rect && createPortal(
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.666 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.666, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="fixed z-[9999] flex flex-col bg-[#16181f] rounded-xl overflow-hidden shadow-2xl border border-white/10 pointer-events-auto origin-center"
                style={{
                  top: rect.top + rect.height / 2,
                  left: rect.left + rect.width / 2,
                  width: rect.width * 1.5, aspectRatio,
                  height: rect.height * 1.5,
                  x: "-50%",
                  y: "-50%",
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img src={getImageUrl(item.poster || item.backdrop || item.thumbnail)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16181f] via-[#16181f]/80 to-transparent" />
                </div>
                
                {/* Content Box at the bottom */}
                <div className="relative z-10 flex flex-col h-full justify-end p-3 sm:p-4">
                  {item.titleLogo ? (
                    <img src={getImageUrl(item.titleLogo)} alt={cleanText(item.title)} className="w-[85%] object-contain drop-shadow-lg mb-3" />
                  ) : (
                    <h3 className="text-white font-black text-sm sm:text-base drop-shadow-lg line-clamp-2 leading-tight mb-3">{cleanText(item.title)}</h3>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2.5">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-md text-[10px] sm:text-[11px] transition-colors" onClick={(e) => { e.stopPropagation(); onClick(); }}>
                      <Play className="w-3 h-3 fill-black" /> Watch Now
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors border border-white/10" onClick={(e) => e.stopPropagation()}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-white/80 mb-2 flex-wrap">
                    <span>{year || "2024"}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/40" />
                    <span className="px-1 py-[1px] bg-white/20 rounded-sm text-white">{item.ageRating || "U/A 16+"}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/40" />
                    <span>{duration || "2h 10m"}</span>
                  </div>
                  
                  <p className="text-[10px] sm:text-[11px] text-white/60 line-clamp-3 leading-snug font-medium">{cleanText(item.description) || "Watch this exciting new content on our platform today. Experience the thrill and drama."}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </div>
  );
}

// ─── LandscapeCard ─────────────────────────────────────────────────────────────
// Use fullWidth=true when inside a CSS grid.

const landscapeWidths = {
  sm: "w-[240px] sm:w-[280px]",
  md: "w-[280px] sm:w-[320px] lg:w-[360px]",
  lg: "w-[320px] sm:w-[360px] lg:w-[420px]",
};

export function LandscapeCard({
  item,
  onClick,
  size = "md",
  fullWidth = false,
}: {
  item: any;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const imgSrc =
    getImageUrl(item.backdrop || item.poster || item.posterImage || item.thumbnail) || "";

  const year = item.year || item.releaseYear || "";
  const duration = item.duration ? (String(item.duration).includes("m") ? String(item.duration) : `${item.duration}m`) : "";

  return (
    <div
      className={`${fullWidth ? "w-full" : `${landscapeWidths[size]} flex-shrink-0`} cursor-pointer group`}
      onClick={onClick}
    >
      <div
         className="relative rounded-lg overflow-hidden bg-zinc-900 group-hover:ring-1 group-hover:ring-red-500/40 transition-all duration-300"
        style={{ aspectRatio: "16/9" }}
      >
        {/* Backdrop image */}
        <img
          src={imgSrc}
          alt={cleanText(item.title) || ""}
          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.backgroundColor = "#111";
            el.style.display = "none";
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

        {/* Top-left: badge */}
        <div className="absolute top-2 left-2 z-10">
          <BadgeTop item={item} />
        </div>

        {/* Top-right: IMDB */}
        {item.imdbRating && (
          <div className="absolute top-2 right-2 z-10">
            <ImdbBadge rating={item.imdbRating} />
          </div>
        )}

        {/* Bottom info row */}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-8 z-10 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-foreground font-semibold text-xs line-clamp-1 leading-tight">{cleanText(item.title)}</p>
            {(year || duration) && (
              <p className="text-foreground/80 text-[10px] mt-0.5 truncate">
                {[year, duration].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* Play button */}
          <button
            className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            aria-label="Play"
          >
            <Play className="w-4 h-4 text-foreground fill-white ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Default export
export default PortraitCard;
