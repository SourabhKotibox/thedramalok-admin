import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Play, Pause, ChevronLeft, ChevronRight, Loader2,
  TrendingUp, Flame, Sparkles, Star, Headphones, Search
} from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { PortraitCard } from "@/components/ContentCard";
import { getImageUrl } from "@/lib/api-client";


function cleanText(str?: string) {
  if (!str) return "";
  return str.replace(/kotibox ott/gi, 'The Drama Lok').replace(/kotibox/gi, 'The Drama Lok');
}


type StoryItem = {
  id: string;
  title: string;
  author?: string;
  narrator?: string;
  thumbnail?: string;
  duration?: number;
  planRequired: string;
  status: string;
  featured: boolean;
  trending: boolean;
  isNewContent: boolean;
  views: number;
  likes: number;
  genres: Array<{ name: string }>;
  description?: string;
};

// Map StoryItem to what PortraitCard expects
const mapStoryToCard = (story: StoryItem) => ({
  id: story.id,
  title: story.title,
  poster: story.thumbnail,
  type: "story",
  year: story.author ? `by ${story.author}` : "",
  duration: story.duration ? `${story.duration}m` : "",
  ageRating: story.planRequired === "free" ? "FREE" : "PRO",
  description: story.description || `${story.views || 0} views • ${story.likes || 0} likes`,
  isPremium: story.planRequired !== "free",
  badge: story.trending ? "TRENDING" : story.featured ? "TOP" : undefined,
  titleLogo: null,
});

/* ─── Hero Section ─── */
function StoriesHero({ featured, onPlay }: { featured: StoryItem[]; onPlay: (story: StoryItem) => void }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (featured.length === 0 || isPaused) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % featured.length);
        setFading(false);
      }, 400);
    }, 6000);
    return () => clearInterval(timer);
  }, [current, featured.length, isPaused]);

  if (!featured.length) return null;

  const item = featured[current];

  return (
    <div
      className="relative w-full overflow-hidden bg-[#030306] mt-[60px] lg:mt-0"
      style={{ height: "80vh", minHeight: 480 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`absolute inset-0 transition-opacity duration-1000 ${fading ? "opacity-0" : "opacity-100"}`}>
        <img
          src={getImageUrl(item.thumbnail)}
          alt={cleanText(item.title)}
          className="w-full h-full object-cover scale-105"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030306] via-[#030306]/70 to-transparent w-[80%] z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030306] via-transparent to-transparent h-full z-0" />
      </div>

      <div className="relative z-10 w-full h-full max-w-[90%] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-center">
        <div className="max-w-2xl mt-20 lg:mt-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white text-[10px] sm:text-xs font-black tracking-widest uppercase rounded">
              <Headphones className="w-3.5 h-3.5" />
              Audio Story
            </span>
            {item.planRequired !== "free" && (
              <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[10px] sm:text-xs font-black tracking-wider uppercase rounded">
                PRO
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 drop-shadow-lg">
            {cleanText(item.title)}
          </h1>

          <div className="flex items-center gap-3 text-white/70 text-sm font-semibold mb-6">
            <span>{item.author ? `By ${item.author}` : "Original"}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span>{item.duration ? `${item.duration}m` : "Episodic"}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span>{item.views || 0} views</span>
          </div>

          <p className="text-sm sm:text-base text-zinc-300 mb-8 line-clamp-3 leading-relaxed max-w-xl">
            {cleanText(item.description) || "Immerse yourself in this captivating audio story experience. Listen now on The Drama Lok."}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-2 px-8 py-3.5 bg-white hover:bg-zinc-200 text-black rounded-lg font-bold transition-transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-black" />
              Listen Now
            </button>
            <button
              className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors border border-white/10"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="absolute bottom-10 right-12 z-20 flex gap-2">
        {featured.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setFading(true);
              setTimeout(() => { setCurrent(idx); setFading(false); }, 400);
            }}
            className={`transition-all duration-300 rounded-full ${
              idx === current ? "w-6 h-1.5 bg-red-600" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Reusable dummy plus icon for hero
const Plus = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

/* ─── Horizontal Row ─── */
function StoriesRow({ title, items, icon: Icon, onPlay }: { title: string; items: StoryItem[]; icon?: any; onPlay: (s: StoryItem) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 20);
  };

  if (!items?.length) return null;

  return (
    <div className="relative w-full mb-8 lg:mb-12">
      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 mb-3 lg:mb-4">
        <h2 className="text-white font-bold text-lg lg:text-xl flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-red-600" />}
          {title}
        </h2>
      </div>

      <div className="group relative">
        {/* Scroll Buttons */}
        <AnimatePresence>
          {showLeft && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll("left")}
              className="absolute left-0 top-0 bottom-0 z-40 w-12 sm:w-16 bg-gradient-to-r from-[#030306] via-[#030306]/80 to-transparent flex items-center justify-start pl-2 sm:pl-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg" />
            </motion.button>
          )}
        </AnimatePresence>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-8 lg:px-12 pb-4 scroll-smooth"
        >
          {items.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="relative z-0 hover:z-[99]"
            >
              <PortraitCard item={mapStoryToCard(story)} onClick={() => onPlay(story)} />
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showRight && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll("right")}
              className="absolute right-0 top-0 bottom-0 z-40 w-12 sm:w-16 bg-gradient-to-l from-[#030306] via-[#030306]/80 to-transparent flex items-center justify-end pr-2 sm:pr-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-8 h-8 text-white drop-shadow-lg hover:scale-125 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function StoriesPage() {
  const [, setLocation] = useLocation();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const fetchStories = async () => {
      try {
        const res = await fetch(`/api/stories/public`);
        const data = await res.json();
        if (data.success) setStories(data.data || []);
      } catch (err) {
        console.error('Failed to fetch stories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const featured = stories.filter((s) => s.featured);
  const trending = stories.filter((s) => s.trending);
  const free = stories.filter((s) => s.planRequired === "free");
  const others = stories.filter((s) => !s.featured && !s.trending);

  const handlePlay = (story: StoryItem) => {
    setLocation(`/story/${story.id}`);
  };

  return (
    <PublicLayout activeTab="stories">
      <div className="flex flex-col min-h-screen bg-[#030306]">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          </div>
        ) : (
          <>
            {/* Massive Hotstar Style Hero Carousel */}
            <StoriesHero featured={featured.length ? featured : stories.slice(0, 5)} onPlay={handlePlay} />

            {/* Content Rows */}
            <div className="relative z-10 -mt-20 pb-20">
              {trending.length > 0 && (
                <StoriesRow title="Trending Audio" items={trending} icon={Flame} onPlay={handlePlay} />
              )}
              {featured.length > 0 && (
                <StoriesRow title="Exclusive Masterpieces" items={featured} icon={Star} onPlay={handlePlay} />
              )}
              {free.length > 0 && (
                <StoriesRow title="Listen for Free" items={free} icon={Mic} onPlay={handlePlay} />
              )}
              {others.length > 0 && (
                <StoriesRow title="Explore More Stories" items={others} icon={Headphones} onPlay={handlePlay} />
              )}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
