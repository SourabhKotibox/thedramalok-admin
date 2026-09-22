import { useState, useEffect, useRef, Fragment, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useSearch } from "wouter";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";
import { getImageUrl, useGetPublicAds, recordAdInteraction, getPublicStories } from "@/lib/api-client";
import { HomeBannerAd, GoogleAdsenseBanner, PlayerPrerollAd } from "@/components/AdComponents";
import {
  Play, Pause, Search, ChevronLeft, ChevronRight, X,
  ChevronDown, User, Star, Plus, Info, Film, Tv,
  TrendingUp, Flame, Sparkles, Smartphone, Lock, Crown, Bell,
  Loader2, Clock, Check, EyeOff, AlertCircle, ListPlus, Send, Eye, Clapperboard, Bookmark,
  Volume2, VolumeX, ExternalLink, SkipForward, Mic,
} from "lucide-react";
import {
  useGetWebHome, useGetWebBrowse, loginClient, registerClient, useGetPages,
  useGetGenres, useGetPublicNotifications, useGetWebSubscriptionPlans,
  useGetWatchHistory, useGetSections, useGetWebAllContent,
} from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WebsiteReviews } from "@/components/WebsiteReviews";
import { PortraitCard, LandscapeCard } from "@/components/ContentCard";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";
import PublicLayout from "@/components/PublicLayout";

/* ─── TYPES ─── */
interface ContentItem {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  type: "movie" | "show" | "story";
  year?: string;
  duration?: string;
  imdbRating?: string;
  ageRating?: string;
  description?: string;
  language?: string;
  badge?: "NEW" | "TOP" | "HOT" | "TRENDING" | "EXCLUSIVE";
  genres?: string[];
  seasons?: number;
  contentType?: string;
  _id?: string;
  isPremium?: boolean;
  releaseDate?: string;
}

interface ShortDrama {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  posterImage?: string;
  bannerImage?: string;
  thumbnail?: string;
  rating: string;
  totalEpisodes: number;
  freeEpisodes: number;
  language?: string;
  badge?: string;
  _id?: string;
  contentType?: string;
}

type Tab = "home" | "movies" | "tvshows" | "drama" | "new" | "stories";

/* ─── HELPERS ─── */
const getContinueWatching = () => {
  try {
    const data = JSON.parse(localStorage.getItem("continue_watching") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return "";
  const ts = new Date(dateStr).getTime();
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

/* ─── BADGES ─── */
function ImdbBadge({ rating }: { rating?: string }) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/40 text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded">
      <Star className="w-2.5 h-2.5 fill-amber-400" />
      {rating}
    </span>
  );
}

function PremiumBadge() {
  return (
    <span className="flex items-center gap-1 bg-[#f5a623] text-black text-[9px] font-black px-2 py-[2px] rounded-sm uppercase tracking-wide">
      <Crown className="w-2.5 h-2.5" /> Premium
    </span>
  );
}

function FreeBadge() {
  return (
    <span className="flex items-center gap-1 bg-[#00c2a8] text-black text-[9px] font-black px-2 py-[2px] rounded-sm uppercase tracking-wide">
      Free
    </span>
  );
}

function ContentBadge({ badge }: { badge?: ContentItem["badge"] }) {
  if (!badge) return null;
  const map: Record<string, string> = {
    NEW: "bg-emerald-500 text-white",
    TOP: "bg-[#f5a623] text-black",
    HOT: "bg-orange-500 text-white",
    TRENDING: "bg-red-600 text-white",
    EXCLUSIVE: "bg-purple-600 text-white",
  };
  return (
    <span className={`absolute top-2 left-2 z-10 px-1.5 py-[2px] text-[9px] font-black rounded-sm uppercase tracking-wider ${map[badge]}`}>
      {badge}
    </span>
  );
}

function AgeBadge({ rating }: { rating?: string }) {
  if (!rating) return null;
  return (
    <span className="px-1.5 py-[2px] text-[9px] font-black border border-white/10 text-white bg-black/40 backdrop-blur-md rounded">
      {rating}
    </span>
  );
}

/* ─── SECTION HEADER ─── */
function SectionHeader({ title, icon, onSeeAll, count }: { title: string; icon?: React.ReactNode; onSeeAll?: () => void; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-4 px-4 sm:px-8 lg:px-12">
      {icon && <div className="text-red-500">{icon}</div>}
      <h2 className="text-white font-bold text-lg sm:text-xl tracking-tight">{title}</h2>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-white/80 rounded-full">
          {count}
        </span>
      )}
      <div className="flex-1" />
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-white/80 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 group">
          See all <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-red-500" />
        </button>
      )}
    </div>
  );
}

/* ─── FEATURED CARD wrapper (delegates to LandscapeCard) ─── */
function FeaturedCard({ item, onPlay, size = "md" }: { item: ContentItem; onPlay: (item: ContentItem) => void; size?: "sm" | "md" | "lg" }) {
  return <LandscapeCard item={item} onClick={() => onPlay(item)} size={size} />;
}

/* ─── CONTENT CARD wrapper (delegates to PortraitCard for grids, LandscapeCard for rows) ─── */
function ContentCard({ item, onPlay, size = "md", fullWidth = false }: { item: ContentItem; onPlay: (item: ContentItem) => void; size?: "sm" | "md" | "lg"; fullWidth?: boolean }) {
  return <PortraitCard item={item} onClick={() => onPlay(item)} size={size} fullWidth={fullWidth} />;
}

/* ─── SHORT DRAMA CARD (9:16) ─── */
const DRAMA_BADGE_MAP: Record<string, string> = {
  NEW: "bg-emerald-500 text-white",
  HOT: "bg-orange-500 text-white",
  TRENDING: "bg-red-600 text-white",
  EXCLUSIVE: "bg-purple-600 text-white",
};

function ShortDramaCard({ drama, onClick, fullWidth }: { drama: ShortDrama; onClick: () => void; fullWidth?: boolean }) {
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

  const item = {
    ...drama,
    poster: drama.poster || drama.posterImage || drama.thumbnail || drama.backdrop || drama.bannerImage,
    type: "drama",
    badge: drama.badge,
    isPremium: drama.freeEpisodes > 0 && !isSubscribed,
    description: `${drama.totalEpisodes || 0} Episodes`
  };

  return <PortraitCard item={item} onClick={onClick} fullWidth={fullWidth} aspectRatio="9/16" size="md" />;
}

function useRowScroll() {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right", amount = 800) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };
  return { rowRef, scroll };
}

function FeaturedRow({ title, icon, items, onPlay, size = "md", onSeeAll }: {
  title: string; icon?: React.ReactNode; items: ContentItem[]; onPlay: (item: ContentItem) => void; size?: "sm" | "md" | "lg"; onSeeAll?: () => void;
}) {
  const { rowRef, scroll } = useRowScroll();
  if (!items.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="mb-4 lg:mb-6">
      <SectionHeader title={title} icon={icon} onSeeAll={onSeeAll} count={items.length} />
      <div className="relative group/row">
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("left", 900)} className="hidden lg:flex absolute left-2 top-[38%] -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-red-600 hover:border-red-600 transition-all shadow-xl">
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("right", 900)} className="hidden lg:flex absolute right-2 top-[38%] -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-red-600 hover:border-red-600 transition-all shadow-xl">
          <ChevronRight className="w-4 h-4" />
        </motion.button>
        <div ref={rowRef} className="flex gap-2 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-6 pt-2 -mb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
          {items.map((item, i) => (
            <motion.div key={item.id || item._id} className="relative z-0 hover:z-[99]" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}>
              <ContentCard item={item} onPlay={onPlay} size={size} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ContentRow({ title, icon, items, onPlay, size = "md", onSeeAll }: {
  title: string; icon?: React.ReactNode; items: ContentItem[]; onPlay: (item: ContentItem) => void; size?: "sm" | "md" | "lg"; onSeeAll?: () => void;
}) {
  const { rowRef, scroll } = useRowScroll();
  if (!items.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="mb-4 lg:mb-6">
      <SectionHeader title={title} icon={icon} onSeeAll={onSeeAll} count={items.length} />
      <div className="relative group/row">
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("left", 900)} className="hidden lg:flex absolute left-2 top-[38%] -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-red-600 hover:border-red-600 transition-all shadow-xl">
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("right", 900)} className="hidden lg:flex absolute right-2 top-[38%] -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-red-600 hover:border-red-600 transition-all shadow-xl">
          <ChevronRight className="w-4 h-4" />
        </motion.button>
        <div ref={rowRef} className="flex gap-2 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-6 pt-2 -mb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
          {items.map((item, i) => (
            <motion.div key={item.id || item._id} className="relative z-0 hover:z-[99]" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}>
              <ContentCard item={item} onPlay={onPlay} size={size} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ShortDramaRow({ title, icon, items, onSelect, onSeeAll }: {
  title: string; icon?: React.ReactNode; items: ShortDrama[]; onSelect: (d: ShortDrama) => void; onSeeAll?: () => void;
}) {
  const { rowRef, scroll } = useRowScroll();
  if (!items.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="mb-4 lg:mb-6">
      <SectionHeader title={title} icon={icon} count={items.length} onSeeAll={onSeeAll} />
      <div className="relative group/row">
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("left", 800)} className="hidden lg:flex absolute left-2 top-[40%] -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-purple-700 hover:border-purple-600 transition-all shadow-xl">
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => scroll("right", 800)} className="hidden lg:flex absolute right-2 top-[40%] -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-purple-700 hover:border-purple-600 transition-all shadow-xl">
          <ChevronRight className="w-4 h-4" />
        </motion.button>
        <div ref={rowRef} className="flex gap-2 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-6 pt-2 -mb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
          {items.map((d, i) => (
            <motion.div key={d.id || d._id} className="relative z-0 hover:z-[99]" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}>
              <ShortDramaCard drama={d} onClick={() => onSelect(d)} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}


function cleanText(str?: string) {
  if (!str) return "";
  return str.replace(/kotibox ott/gi, 'The Drama Lok').replace(/kotibox/gi, 'The Drama Lok');
}

/* ─── HERO BANNER ─── */
function Hero({ activeTab, onPlay, onSubscribeClick, isSubscribed }: { activeTab: Tab; onPlay: (item: ContentItem) => void; onSubscribeClick: () => void; isSubscribed?: boolean }) {
  const { data: homeData, isLoading } = useGetWebHome();
  const { settings } = useSettings();
  const splashVideoUrl = (settings as any)?.splashVideoUrl ? getImageUrl((settings as any).splashVideoUrl) : "";
  
  const heroContent = useMemo(() => {
    const raw = homeData?.heroContent || [];
    if (activeTab === "drama") {
      return raw.filter((item: any) => item.contentType === "drama");
    }
    if (activeTab === "movies") {
      return raw.filter((item: any) => item.type === "movie" || item.contentType === "movie");
    }
    if (activeTab === "tvshows") {
      return raw.filter((item: any) => item.type !== "movie" && item.contentType !== "movie");
    }
    return raw;
  }, [homeData?.heroContent, activeTab]);

  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setCurrent(0);
  }, [activeTab, heroContent.length]);

  const go = (index: number) => {
    if (index === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(index); setFading(false); }, 400);
  };

  useEffect(() => {
    if (heroContent.length === 0 || isPaused) return;
    const timer = setInterval(() => go((current + 1) % heroContent.length), 6000);
    return () => clearInterval(timer);
  }, [current, heroContent.length, isPaused]);

  if (isLoading) {
    return <div className="flex items-center justify-center w-full bg-[#030306]" style={{ height: "85vh", minHeight: 480 }}><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
  }
  if (!heroContent.length) return null;

  const item = heroContent[current];
  const isPremium = item.isPremium || item.badge === "TOP" || item.badge === "EXCLUSIVE";

  return (
    <div
      className="relative w-full overflow-hidden bg-[#030306] mt-[60px] lg:mt-0"
      style={{ height: "85vh", minHeight: 480 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
        {splashVideoUrl ? (
          <video
            src={splashVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center lg:object-top"
          />
        ) : (
          <img
            src={getImageUrl(item.backdrop || item.poster) || ""}
            alt={cleanText(item.title)}
            className="w-full h-full object-cover object-center lg:object-top"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=675&fit=crop&q=80`;
            }}
          />
        )}
      </div>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a10]/90 via-[#0a0a10]/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-[#030306] via-[#030306]/60 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-10 sm:bottom-12 left-0 px-6 sm:px-10 lg:px-14 max-w-2xl w-full">
        <div className={`transition-all duration-500 ${fading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {isPremium && !isSubscribed ? <PremiumBadge /> : null}
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
              item.type === "movie"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : item.contentType === "drama"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}>
              {item.type === "movie" ? <Film className="w-3 h-3" /> : item.contentType === "drama" ? <Smartphone className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
              {item.type === "movie" ? "Movie" : item.contentType === "drama" ? "Short Drama" : "TV Show"}
            </span>
            {[...new Set<string>(item.genres || [])].slice(0, 2).map((g) => (
              <span key={g} className="text-white text-xs bg-zinc-900/80 border border-zinc-800 px-2 py-1 rounded-lg font-semibold">{g}</span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 tracking-tight drop-shadow-lg">
            {cleanText(item.title)}
          </h1>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <ImdbBadge rating={item.imdbRating} />
            <AgeBadge rating={item.ageRating} />
            {item.duration && <span className="text-white/80 text-xs font-semibold">{item.duration}</span>}
            {item.year && <span className="text-white/80 text-xs font-semibold">{item.year}</span>}
            {item.language && <span className="text-white text-xs font-semibold">{item.language}</span>}
          </div>

          <p className="text-white text-sm sm:text-base leading-relaxed mb-6 max-w-lg line-clamp-3">
            {cleanText(item.description)}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-2.5 px-8 py-3.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-full text-sm tracking-wide transition-all active:scale-95 shadow-xl"
            >
              <Play className="w-4 h-4 fill-black" />
              Watch Now
            </button>
            {isPremium && !isSubscribed && (
              <button
                onClick={onSubscribeClick}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-red-950/30"
              >
                <Crown className="w-4 h-4" /> Subscribe
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Indicators */}
      <div className="absolute bottom-6 sm:bottom-12 right-6 sm:right-10 flex gap-1.5 z-20">
        {heroContent.map((_, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === current ? "w-6 h-1.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}


function GenreFilter({ active, onChange }: { active: string; onChange: (g: string) => void }) {
  const { data: genresData } = useGetGenres({ limit: 50 });
  const genres: string[] = ["All", ...((genresData?.data || []).map((g: any) => g.name))];

  return (
    <div className="flex gap-2 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-2 mb-6" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
      {genres.map((g) => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
            active === g
              ? "bg-red-600 border-red-600 text-white"
              : "bg-transparent border-zinc-700 text-white/80 hover:border-zinc-500 hover:text-white"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

/* ─── SUBSCRIBE BANNER (Dynamic from API) ─── */
function SubscribeBanner({ onSubscribeClick }: { onSubscribeClick: () => void }) {
  const { settings } = useSettings();
  const { data: plansData } = useGetWebSubscriptionPlans();
  const plans = plansData?.data || [];
  const paidPlans = plans.filter((p: any) => (p.name || "").toLowerCase() !== "free" && Number(p.price) > 0);
  const cheapest = paidPlans.length > 0
    ? paidPlans.reduce((a: any, b: any) => (a.price < b.price ? a : b), paidPlans[0])
    : null;

  const formatCurrency = (val: number | string) => {
    const num = Number(val && typeof val === "string" ? val.replace(/[^0-9.-]+/g,"") : val) || 0;
    return settings?.currencyPosition === "before" 
      ? `${settings?.currencySymbol || '₹'}${num.toFixed(settings?.decimalPlaces ?? 2)}` 
      : `${num.toFixed(settings?.decimalPlaces ?? 2)} ${settings?.currencySymbol || '₹'}`;
  };

  return (
    <div className="mx-4 sm:mx-8 lg:mx-12 mb-10 rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[#0a0a10]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a10] via-[#0a0a10]/90 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent" />

      <div className="relative z-10 px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-red-500 font-bold text-sm uppercase tracking-wider">Premium Plan</span>
          </div>
          <h3 className="text-white font-bold text-xl sm:text-2xl mb-1">Unlock All Premium Content</h3>
          <p className="text-white/80 text-sm">4K Ultra HD · No Ads · Download & Watch · Multi-Screen</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {cheapest && (
            <div className="text-right">
              {cheapest.originalPrice && cheapest.originalPrice > cheapest.price && (
                <p className="text-white text-xs line-through">{formatCurrency(cheapest.originalPrice)}</p>
              )}
              <p className="text-white font-bold text-xl">
                {formatCurrency(cheapest.price)}<span className="text-white/80 text-sm font-normal">/{cheapest.interval || "mo"}</span>
              </p>
            </div>
          )}
          <button
            onClick={onSubscribeClick}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-sm transition-all shadow-lg shadow-red-900/40 whitespace-nowrap"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MOVIES GRID TAB ─── */
function MoviesTab({ onPlay }: { onPlay: (item: ContentItem) => void }) {
  const [activeGenre, setActiveGenre] = useState("All");
  const { data: browseData, isLoading } = useGetWebBrowse({ type: "movie", genre: activeGenre });
  const filtered = browseData?.items || [];

  return (
    <div className="pt-6 pb-20">
      <div className="px-4 sm:px-8 lg:px-12 mb-6">
        <h2 className="text-white font-bold text-2xl tracking-tight">Movies</h2>
        <p className="text-white text-xs sm:text-sm mt-1">{isLoading ? "Loading..." : `${browseData?.pagination?.total || 0} movies available`}</p>
      </div>
      <GenreFilter active={activeGenre} onChange={setActiveGenre} />
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
      ) : (
        <div className="px-4 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filtered.map((item: any, i: number) => (
            <motion.div key={item.id || item._id} className="relative z-0 hover:z-[99]" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}>
              <ContentCard item={item} onPlay={onPlay} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── TV SHOWS GRID TAB ─── */
function TVShowsTab({ onPlay }: { onPlay: (item: ContentItem) => void }) {
  const [activeGenre, setActiveGenre] = useState("All");
  const { data: browseData, isLoading } = useGetWebBrowse({ type: "show", genre: activeGenre });
  const filtered = browseData?.items || [];

  return (
    <div className="pt-6 pb-20">
      <div className="px-4 sm:px-8 lg:px-12 mb-6">
        <h2 className="text-white font-bold text-2xl tracking-tight">TV Shows</h2>
        <p className="text-white text-xs sm:text-sm mt-1">{isLoading ? "Loading..." : `${browseData?.pagination?.total || 0} shows available`}</p>
      </div>
      <GenreFilter active={activeGenre} onChange={setActiveGenre} />
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
      ) : (
        <div className="px-4 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filtered.map((item: any, i: number) => (
            <motion.div key={item.id || item._id} className="relative z-0 hover:z-[99]" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}>
              <ContentCard item={item} onPlay={onPlay} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── NEW & HOT TAB ─── */
function NewHotTab({ onPlay }: { onPlay: (item: ContentItem) => void }) {
  const { data: homeData, isLoading } = useGetWebHome();

  if (isLoading || !homeData) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

  const newReleases = homeData.newReleases || [];
  const trendingNow = homeData.trendingNow || [];
  const newDramas = homeData.newDramas || [];
  const featuredDramas = homeData.featuredDramas || [];
  const topRated = homeData.topRated || [];

  const heroItem = trendingNow[0] || newReleases[0] || featuredDramas[0];

  return (
    <div className="pt-6 pb-20 mt-[60px] lg:mt-[68px]">
      {/* Hero Banner */}
      {heroItem && (
        <div className="px-4 sm:px-8 lg:px-12 mb-8">
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => onPlay(heroItem)}
          >
            <div className="aspect-[21/9] sm:aspect-[3/1]">
              <img
                src={getImageUrl(heroItem.backdrop || heroItem.poster || heroItem.posterImage || heroItem.thumbnail) || ""}
                alt={heroItem.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-red-600 text-white border border-red-500/50 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 fill-white" />
                  Featured
                </span>
                {heroItem.badge && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-white/10 text-white/90 border border-white/20">
                    {heroItem.badge}
                  </span>
                )}
              </div>
              <h2 className="text-white font-black text-2xl sm:text-4xl lg:text-5xl tracking-tight mb-2 line-clamp-2">
                {heroItem.title}
              </h2>
              {heroItem.description && (
                <p className="text-white/70 text-sm sm:text-base max-w-2xl line-clamp-2 mb-4">
                  {heroItem.description}
                </p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(heroItem);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30"
              >
                <Play className="w-5 h-5 fill-white" />
                Watch Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trending Now */}
      {trendingNow.length > 0 && (
        <FeaturedRow
          title="Trending Now"
          icon={<TrendingUp className="w-4 h-4 text-red-500" />}
          items={trendingNow}
          onPlay={onPlay}
          onSeeAll={() => {}}
        />
      )}

      {/* New Releases */}
      {newReleases.length > 0 && (
        <ContentRow
          title="New Releases"
          icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
          items={newReleases}
          onPlay={onPlay}
          size="lg"
          onSeeAll={() => {}}
        />
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <FeaturedRow
          title="Top Rated"
          icon={<Star className="w-4 h-4 text-amber-400" />}
          items={topRated}
          onPlay={onPlay}
          onSeeAll={() => {}}
        />
      )}

      {/* New Dramas */}
      {newDramas.length > 0 && (
        <ShortDramaRow
          title="New Dramas"
          icon={<Flame className="w-4 h-4 text-orange-400" />}
          items={newDramas}
          onSelect={(d: any) => onPlay(d)}
          onSeeAll={() => {}}
        />
      )}

      {/* Featured Dramas */}
      {featuredDramas.length > 0 && (
        <ShortDramaRow
          title="Featured Dramas"
          icon={<Crown className="w-4 h-4 text-amber-400" />}
          items={featuredDramas}
          onSelect={(d: any) => onPlay(d)}
          onSeeAll={() => {}}
        />
      )}
    </div>
  );
}

/* ─── SHORT DRAMA TAB ─── */
function ShortDramaTab({ onSelect }: { onSelect: (d: ShortDrama) => void }) {
  const { data: homeData, isLoading } = useGetWebHome();
  const allDramas = [...(homeData?.featuredDramas || []), ...(homeData?.newDramas || [])];

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

  return (
    <div className="pt-6 pb-20">
      <div className="px-4 sm:px-8 lg:px-12 mb-8">
        <h2 className="text-white font-bold text-2xl tracking-tight">Short Drama</h2>
        <p className="text-white text-sm mt-1">{allDramas.length} series · Portrait 9:16 · Episode-based</p>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-10">
        {allDramas.map((d: any) => (
          <ShortDramaCard key={d.id || d._id} drama={d} onClick={() => onSelect(d)} />
        ))}
      </div>

      <div className="px-4 sm:px-8 lg:px-12 mb-8">
        <div className="bg-[#0f1a2e]/80 border border-red-500/10 rounded-2xl p-5 flex flex-wrap gap-6">
          {[
            { icon: <Smartphone className="w-5 h-5 text-red-500" />, label: "Portrait 9:16", desc: "Optimized for mobile viewing" },
            { icon: <Play className="w-5 h-5 text-emerald-400" />, label: "First Episodes Free", desc: "Start watching without subscription" },
            { icon: <Lock className="w-5 h-5 text-amber-400" />, label: "Premium Episodes", desc: "Subscribe to unlock all episodes" },
            { icon: <Crown className="w-5 h-5 text-yellow-400" />, label: "VIP Access", desc: "Unlimited streaming for subscribers" },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 min-w-[160px]">
              <div className="w-9 h-9 rounded-xl bg-zinc-800/80 flex items-center justify-center flex-shrink-0">{icon}</div>
              <div>
                <p className="text-white font-bold text-sm">{label}</p>
                <p className="text-white/80 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getSectionItems(section: any, movies: any[], dramas: any[], homeData: any) {
  if (section.content && section.content.length > 0) return section.content;
  if (section.category && homeData && homeData[section.category] && homeData[section.category].length > 0) return homeData[section.category];
  
  let sourceItems = section.contentType === 'movie' ? movies : section.contentType === 'drama' ? dramas : [...movies, ...dramas];
  
  let filteredItems = [...sourceItems];
  if (section.contentSelection === 'dynamic' || section.contentSelection === 'mixed') {
    if (section.filterKey && section.filterKey !== 'none') {
       const fKey = section.filterKey;
       const fVal = section.filter?.[fKey] || section.filterValue; // Fallback to raw filterValue if filter obj is missing
       if (fKey === 'genres') {
          filteredItems = filteredItems.filter(i => i.genres?.includes(fVal));
       } else if (fKey === 'isNewContent' || fKey === 'trending' || fKey === 'featured') {
          filteredItems = filteredItems.filter(i => i[fKey] === (fVal === 'true' || fVal === true));
       } else {
          filteredItems = filteredItems.filter(i => i[fKey] === fVal);
       }
    }
  }

  if (section.contentSelection === 'manual') {
    filteredItems = sourceItems.filter(item => section.manualContentIds?.includes(item._id));
  } else if (section.contentSelection === 'mixed') {
    const manualItems = sourceItems.filter(item => section.manualContentIds?.includes(item._id));
    // Combine manual items with filtered items, avoiding duplicates
    const manualIds = new Set(manualItems.map(i => i._id));
    filteredItems = [...manualItems, ...filteredItems.filter(i => !manualIds.has(i._id))];
  }

  if (section.sortBy) {
    const sKey = Object.keys(section.sortBy)[0] || section.sortKey;
    const sDir = section.sortBy[sKey] || section.sortDir || -1;
    filteredItems = [...filteredItems].sort((a, b) => {
       if (a[sKey] < b[sKey]) return -1 * sDir;
       if (a[sKey] > b[sKey]) return 1 * sDir;
       return 0;
    });
  }

  if (section.limit) {
    filteredItems = filteredItems.slice(0, section.limit);
  }

  return filteredItems;
}

/* ─── HOME TAB ─── */
function HomeTab({ onPlay, onSelectDrama, onSubscribeClick, isSubscribed }: {
  onPlay: (item: ContentItem) => void;
  onSelectDrama: (d: ShortDrama) => void;
  onSubscribeClick: () => void;
  isSubscribed?: boolean;
}) {
  const [, setLocation] = useLocation();
  const { data: homeData, isLoading: isHomeLoading } = useGetWebHome();
  const { data: watchHistoryData } = useGetWatchHistory({ limit: 10 });
  const { data: sectionsData, isLoading: isSectionsLoading } = useGetSections({ platform: 'web', activeOnly: true });
  const { data: allContentRes, isLoading: isAllContentLoading } = useGetWebAllContent();
  
  const [stories, setStories] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const data = await getPublicStories();
        if (data && data.success) {
          setStories(data.data || []);
        } else if (Array.isArray(data)) {
          setStories(data);
        }
      } catch (err) {
        console.error('Failed to fetch stories:', err);
      }
    };
    fetchStories();
  }, []);
  
  const cw = watchHistoryData?.items || [];
  const webSections = (sectionsData?.data || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).filter((s: any) => {
    const t = (s.title || '').toLowerCase();
    const type = (s.contentType || '').toLowerCase();
    return !t.includes('movie') && !t.includes('drama') && type !== 'movie' && type !== 'drama';
  });
  const movies = allContentRes?.movies || [];
  const dramas = allContentRes?.dramas || [];

  if (isHomeLoading || isSectionsLoading || isAllContentLoading || !homeData) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

  return (
    <div className="pb-20 space-y-12 pt-8">
      {cw.length > 0 && (
        <section className="px-4 sm:px-8 lg:px-12">
          <SectionHeader title="Continue Watching" icon={<Clock className="w-4 h-4" />} />
          <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
            {cw.map((item: any) => (
              <div
                key={item.id}
                className="group relative flex-shrink-0 w-[260px] sm:w-[300px] cursor-pointer"
                onClick={() => onPlay(item)}
              >
                {/* Card */}
                 <div className="relative rounded-xl overflow-hidden bg-zinc-900 shadow-lg" style={{ aspectRatio: "16/9" }}>
                  <img
                    src={getImageUrl(item.backdrop || item.poster || item.posterImage || item.thumbnail) || ""}
                    alt={item.title || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.backgroundColor = "#111"; }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-12 h-12 rounded-full bg-red-600/95 flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform duration-200">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 pt-8">
                    <p className="text-white font-bold text-sm truncate leading-tight">
                      {item.showTitle || item.title}
                    </p>
                    {item.showTitle && (
                      <p className="text-white/80 text-[11px] truncate mt-0.5">
                        {item.title}
                      </p>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700/60">
                    <div className="h-full bg-red-600 rounded-r-full transition-all" style={{ width: `${Math.min(100, Math.round(item.progressPercent || 0))}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      
      {webSections.map((section: any, index: number) => {
          if (section.layout === 'ad') {
            return (
              <Fragment key={section._id || index}>
                {section.itemType === 'google-adsense' ? <GoogleAdsenseBanner /> : <HomeBannerAd adId={section.manualContentIds?.[0]} />}
              </Fragment>
            );
          }

          let rowContent = null;
          const items = getSectionItems(section, movies, dramas, homeData);
          
          if (items.length === 0) return null;

          if (section.layout === 'grid') {
            rowContent = (
              <div className="mb-10">
                <SectionHeader title={section.title} onSeeAll={() => setLocation(`/browse?section=${section._id}`)} count={items.length} />
                <div className="px-4 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 pt-2">
                  {items.map((item: any, i: number) => (
                    <motion.div key={item.id || item._id} className="relative z-0 hover:z-[99]" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}>
                      {section.itemType === 'landscape' ? (
                        <LandscapeCard item={item} onClick={() => onPlay(item)} fullWidth />
                      ) : section.itemType === 'drama' ? (
                        <ShortDramaCard drama={item} onClick={() => onSelectDrama(item)} fullWidth />
                      ) : (
                        <PortraitCard item={item} onClick={() => onPlay(item)} fullWidth />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          } else {
            if (section.itemType === 'landscape') {
              rowContent = <FeaturedRow title={section.title} items={items} onPlay={onPlay} onSeeAll={() => setLocation(`/browse?section=${section._id}`)} />;
            } else if (section.itemType === 'drama') {
              rowContent = <ShortDramaRow title={section.title} items={items} onSelect={onSelectDrama} onSeeAll={() => setLocation(`/browse?section=${section._id}`)} />;
            } else {
              rowContent = <ContentRow title={section.title} items={items} onPlay={onPlay} size="lg" onSeeAll={() => setLocation(`/browse?section=${section._id}`)} />;
            }
          }
          
          return (
            <Fragment key={section._id || index}>
              {rowContent}
            </Fragment>
          );
        })}

      {/* Audio Stories row on Home page */}
      {stories.length > 0 && (
        <ContentRow
          title="Trending Audio Stories"
          icon={<Mic className="w-4 h-4 text-red-500" />}
          items={stories.map((s: any) => ({
            id: s.id || s._id,
            title: s.title,
            poster: s.thumbnail || s.coverImage || s.bannerImage,
            backdrop: s.bannerImage || s.thumbnail,
            type: "story",
            year: s.author ? `by ${s.author}` : "",
            duration: s.duration ? `${s.duration}m` : "",
            ageRating: s.planRequired === "free" ? "FREE" : "PRO",
            description: s.description || `${s.views || 0} views`,
            badge: s.trending ? "TRENDING" : s.featured ? "TOP" : undefined,
            isPremium: s.planRequired !== "free",
          }))}
          onPlay={(item: any) => setLocation(`/story/${item.id}`)}
          onSeeAll={() => setLocation('/stories')}
          size="md"
        />
      )}

      {/* Subscribe Banner if there are dynamic sections, to ensure it always renders at bottom if not shown in hardcoded fallback */}
      {!isSubscribed && <SubscribeBanner onSubscribeClick={onSubscribeClick} />}
    </div>
  );
}

/* ─── USER DROPDOWN ─── */
function UserDropdown({ onSignIn, onSignOut, user }: { onSignIn: () => void; onSignOut?: () => void; user?: any }) {
  const [, setLocation] = useLocation();

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-[260px] bg-[#0a0a10] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-4 flex items-center gap-3 border-b border-zinc-800">
        {user && user.avatar ? (
          <img
            src={getImageUrl(user.avatar)}
            alt={user.name || "User"}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-red-900 flex items-center justify-center flex-shrink-0 uppercase font-bold text-sm text-white">
            {user ? user.name?.[0] || "U" : <User className="w-4 h-4 text-white" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-white font-bold text-sm truncate leading-none">{user ? user.name || "User" : "Guest User"}</p>
            {user && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
          </div>
          <p className="text-white text-[11px] truncate mt-1 leading-none font-medium">
            {user ? "Premium Member" : "Sign in for full access"}
          </p>
        </div>
      </div>

      <div className="p-1.5 space-y-0.5">
        {[
          { label: "Account Settings", href: "/account", icon: <User className="w-4 h-4" /> },
          { label: "My Watchlist", href: "/wishlist", icon: <Bookmark className="w-4 h-4" /> },
          { label: "Help & Support", href: "/help-support", icon: <AlertCircle className="w-4 h-4" /> },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => setLocation(opt.href)}
                 className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-2xl text-left text-xs font-semibold transition-all"
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-zinc-800 bg-zinc-950/50">
        {user ? (
          <button
            onClick={onSignOut}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white hover:text-white font-bold rounded-2xl text-xs transition-all text-center"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={onSignIn}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs transition-all text-center shadow-md shadow-red-900/20"
          >
            Log In / Register
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── SIGN IN MODAL ─── */
function SignInModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [usePhone, setUsePhone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();

  const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return getImageUrl(settings.darkLogoUrl);
    if (resolvedTheme === "light" && settings.lightLogoUrl) return getImageUrl(settings.lightLogoUrl);
    return settings.logoUrl ? getImageUrl(settings.logoUrl) : "";
  };
  const logoUrl = getLogoUrl();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        // Phone login: pass phone number as the email field — server handles phone vs email
        const loginIdentifier = usePhone ? phone : email;
        const res = await loginClient({ email: loginIdentifier, password });
        localStorage.setItem("appAccessToken", res.accessToken);
        localStorage.setItem("accessToken", res.accessToken); // legacy compat
        localStorage.setItem("appUser", JSON.stringify({
          id: res.userId,
          name: res.name || email.split("@")[0],
          avatar: res.avatar || null,
          subscriptionPlan: res.subscriptionPlan || "free",
          subscriptionStatus: res.subscriptionStatus || "inactive",
        }));
        localStorage.setItem("user", JSON.stringify({
          id: res.userId,
          name: res.name || email.split("@")[0],
          avatar: res.avatar || null,
          subscriptionPlan: res.subscriptionPlan || "free",
          subscriptionStatus: res.subscriptionStatus || "inactive",
        }));
        window.location.reload();
      } else {
        const res = await registerClient({ email, password, name, phone: phone || undefined });
        localStorage.setItem("appAccessToken", res.accessToken);
        localStorage.setItem("accessToken", res.accessToken); // legacy compat
        localStorage.setItem("appUser", JSON.stringify({
          id: res.userId,
          name,
          avatar: res.avatar || null,
          subscriptionPlan: res.subscriptionPlan || "free",
          subscriptionStatus: res.subscriptionStatus || "inactive",
        }));
        localStorage.setItem("user", JSON.stringify({
          id: res.userId,
          name,
          avatar: res.avatar || null,
          subscriptionPlan: res.subscriptionPlan || "free",
          subscriptionStatus: res.subscriptionStatus || "inactive",
        }));
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[520px] bg-[#0c0c14] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex max-h-[92vh]">
        <div className="hidden sm:flex w-[180px] flex-shrink-0 relative overflow-hidden bg-black flex-col justify-between p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-black/90 to-[#030306]/95 z-0" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={settings.platformName || "StreamIT"}
                className="w-auto object-contain drop-shadow-2xl transition-all"
                style={{
                  height: `${(resolvedTheme === "dark" ? (settings.darkLogoSize || 36) : (settings.lightLogoSize || 36)) * 1.4}px`,
                  maxHeight: "80px"
                }}
              />
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/50">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
                <span className="text-white font-bold text-[15px] tracking-tight mt-2">{settings.platformName || "StreamIT"}</span>
              </>
            )}
            <p className="text-[10px] text-white/80 text-center font-medium mt-3 leading-relaxed">Your portal to premium cinematic experiences.</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white hover:text-white hover:bg-white/5 transition-all z-10">
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-white font-bold text-xl sm:text-2xl tracking-tight mb-1 pr-6">{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p className="text-white text-xs sm:text-sm mb-6 font-medium">
            {isLogin ? "New to the platform? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-red-500 hover:underline font-bold transition-all">
              {isLogin ? "Sign Up Free" : "Log In"}
            </button>
          </p>

          {error && <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold leading-snug">{error}</div>}

          {/* Phone / Email toggle for login */}
          {isLogin && (
            <div className="flex gap-1 mb-1 bg-zinc-900/60 rounded-full p-1">
              <button
                type="button"
                onClick={() => setUsePhone(false)}
                className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${!usePhone ? "bg-red-600 text-white" : "text-white hover:text-white"}`}
              >Email</button>
              <button
                type="button"
                onClick={() => setUsePhone(true)}
                className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${usePhone ? "bg-red-600 text-white" : "text-white hover:text-white"}`}
              >Phone</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {!isLogin && (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder:text-white/80 px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              />
            )}

            {/* Email field — shown in register, or in login when not using phone */}
            {(!isLogin || !usePhone) && (
              <input
                type={isLogin ? "text" : "email"}
                required={!usePhone}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder:text-white/80 px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              />
            )}

            {/* Phone field — always shown in register (optional), or in login when phone tab active */}
            {(usePhone || !isLogin) && (
              <input
                type="tel"
                required={usePhone && isLogin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={isLogin ? "Phone Number" : "Phone Number (optional — links app account)"}
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder:text-white/80 px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              />
            )}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder:text-white/80 px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button disabled={loading} type="submit" className="w-full mt-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all text-xs flex justify-center items-center h-[44px] shadow-lg shadow-red-900/20 hover:-translate-y-0.5 active:translate-y-0">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Log In" : "Register")}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-white/80 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex-1 h-px bg-zinc-800" />
              <span>Or connect with</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex-1 py-2 bg-zinc-950 border border-zinc-800 text-white/80 hover:text-white rounded-full text-[11px] font-bold transition-all hover:bg-zinc-900 flex items-center justify-center gap-1.5">
                Google
              </button>
              <button className="flex-1 py-2 bg-zinc-950 border border-zinc-800 text-white/80 hover:text-white rounded-full text-[11px] font-bold transition-all hover:bg-zinc-900 flex items-center justify-center gap-1.5">
                Apple
              </button>
            </div>
          </div>

          <p className="text-white/80 text-[10px] text-center leading-relaxed mt-6 font-medium">
            By continuing, you accept our <a href="#" className="text-white/80 hover:underline">Terms of Service</a> & <a href="#" className="text-white/80 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function StreamingHomePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [pendingPlay, setPendingPlay] = useState<any>(null);
  const [showPreroll, setShowPreroll] = useState(false);

  // Prefetch player ads so we know if pre-roll exists before showing it
  const { data: playerAdsData } = useGetPublicAds({ placement: 'Player' });
  const { settings } = useSettings();
  const hasPlayerAds = (playerAdsData?.data?.length ?? 0) > 0 || !!settings?.vastPrerollUrl;

  const { data: homeData } = useGetWebHome();
  const rawBanners = homeData?.heroContent || [];
  const hasHeroForTab = useMemo(() => {
    if (activeTab === "home") return rawBanners.length > 0;
    if (activeTab === "drama") return rawBanners.some((b: any) => b.contentType === "drama");
    if (activeTab === "movies") return rawBanners.some((b: any) => b.type === "movie" || b.contentType === "movie");
    if (activeTab === "tvshows") return rawBanners.some((b: any) => b.type === "show" || b.contentType === "series");
    return false;
  }, [rawBanners, activeTab]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("appUser") || localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        else setUser(null);
      } catch (e) { /* ignore */ }
    };
    loadUser();
    window.addEventListener("user-updated", loadUser);
    return () => window.removeEventListener("user-updated", loadUser);
  }, []);

  useEffect(() => {
    const tabNames: Record<string, string> = {
      home: "Home",
      drama: "Short Dramas",
      movies: "Movies",
      tvshows: "TV Shows",
      stories: "Stories",
      new: "New & Hot",
    };
    const titleName = tabNames[activeTab] || "Home";
    const appName = settings?.platformName || "The Drama Lok";
    document.title = `${titleName} | ${appName}`;
  }, [activeTab, settings?.platformName]);

  const handleSignOut = () => {
    localStorage.removeItem("appUser");
    localStorage.removeItem("appAccessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    window.location.reload();
  };

  const isSubscribed = user?.subscriptionStatus === "active" && user?.subscriptionPlan !== "free";

  const navigateToContent = useCallback((item: any) => {
    const id = item.contentId || item.id || item._id;
    const contentType = (item.contentType || "").toLowerCase();
    const type = (item.type || "").toLowerCase();
    const isStory = contentType === "story";
    const isDrama = contentType === "drama";
    const isMovie = type === "movie" || contentType === "movie";
    const isShow = type === "show" || type === "series" || contentType === "series";
    if (isStory) {
      setLocation(`/story/${id}`);
    } else if (isDrama) {
      setLocation(item.trailerUrl ? `/drama/${id}/episode/0` : `/drama/${id}/episode/1`);
    } else if (isMovie) {
      setLocation(`/movie/${id}`);
    } else if (isShow) {
      setLocation(`/show/${id}`);
    } else {
      setLocation(`/movie/${id}`);
    }
  }, [setLocation]);

  const handlePlay = useCallback((item: any) => {
    // Show pre-roll ad before navigation (only for non-subscribers)
    if (hasPlayerAds && !isSubscribed) {
      setPendingPlay(item);
      setShowPreroll(true);
    } else {
      navigateToContent(item);
    }
  }, [hasPlayerAds, isSubscribed, navigateToContent]);

  const handlePrerollFinished = useCallback(() => {
    setShowPreroll(false);
    if (pendingPlay) {
      navigateToContent(pendingPlay);
      setPendingPlay(null);
    }
  }, [pendingPlay, navigateToContent]);

  const handleSelectDrama = useCallback((drama: any) => {
    const id = drama.id || drama._id;
    if (hasPlayerAds && !isSubscribed) {
      setPendingPlay({ ...drama, contentType: 'drama', trailerUrl: drama.trailerUrl });
      setShowPreroll(true);
    } else {
      setLocation(drama.trailerUrl ? `/drama/${id}/episode/0` : `/drama/${id}/episode/1`);
    }
  }, [hasPlayerAds, isSubscribed, setLocation]);

  return (
    <PublicLayout
      activeTab={activeTab}
      setActiveTab={(tab: string) => setActiveTab(tab as Tab)}
      onSignIn={() => setShowSignIn(true)}
      onSignOut={handleSignOut}
      user={user}
      onSubscribeClick={() => setPlansModalOpen(true)}
    >
      <main>
        {activeTab !== "new" && (
          <>
            <Hero activeTab={activeTab} onPlay={handlePlay} onSubscribeClick={() => setPlansModalOpen(true)} isSubscribed={isSubscribed} />
            {!hasHeroForTab && <div className="h-20" />}
          </>
        )}

        {activeTab === "home" && (
          <HomeTab onPlay={handlePlay} onSelectDrama={handleSelectDrama} onSubscribeClick={() => setPlansModalOpen(true)} isSubscribed={isSubscribed} />
        )}
        {activeTab === "movies" && (
          <MoviesTab onPlay={handlePlay} />
        )}
        {activeTab === "tvshows" && (
          <TVShowsTab onPlay={handlePlay} />
        )}
        {activeTab === "drama" && (
          <ShortDramaTab onSelect={handleSelectDrama} />
        )}
        {activeTab === "new" && <NewHotTab onPlay={handlePlay} />}
      </main>

      {/* ── PRE-ROLL AD OVERLAY ── */}
      {showPreroll && (
        <div className="fixed inset-0 z-[400] bg-black">
          <PlayerPrerollAd onFinished={handlePrerollFinished} />
        </div>
      )}

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}

      <SubscriptionPlansModal
        isOpen={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
      />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[300] bg-[#0c0c14]/95 border border-red-600/40 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span className="text-white text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      <style>{`
        html { scroll-behavior: smooth; }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        body { background: #030306; }
      `}</style>
    </PublicLayout>
  );
}
