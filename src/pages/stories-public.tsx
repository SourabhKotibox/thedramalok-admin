import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { 
  Headphones, Play, Flame, Sparkles, Heart, Plus, Check,
  Clock, User, Mic, Loader2, Volume2, Radio, Crown, Star
} from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { 
  getImageUrl, 
  getPublicStories, 
  useGetWishlist, 
  useToggleWishlist,
  useGetAppProfile
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";

type StoryItem = {
  id: string;
  _id?: string;
  title: string;
  author?: string;
  narrator?: string;
  thumbnail?: string;
  poster?: string;
  backdrop?: string;
  duration?: number;
  planRequired: string;
  status: string;
  featured: boolean;
  trending: boolean;
  isNewContent?: boolean;
  views: number;
  likes: number;
  genres: Array<{ name: string } | string>;
  category?: string;
  description?: string;
  audioUrl?: string;
  audioFile?: string;
};

type FilterCategory = "all" | "trending" | "featured" | "free" | "thriller" | "romance" | "horror" | "drama";

export default function StoriesPublicPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [plansModalOpen, setPlansModalOpen] = useState(false);

  const { data: profileData } = useGetAppProfile();
  const user = profileData?.user;

  const { data: wishlistData } = useGetWishlist({ limit: 100 });
  const wishlistItems: any[] = wishlistData?.items || [];
  const toggleWishlistMutation = useToggleWishlist();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const fetchStories = async () => {
      try {
        const res = await getPublicStories();
        if (res && res.success) {
          setStories(res.data || []);
        } else if (Array.isArray(res)) {
          setStories(res);
        }
      } catch (err) {
        console.error("Failed to fetch stories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const featuredStories = useMemo(() => {
    const f = stories.filter(s => s.featured);
    return f.length > 0 ? f : stories.slice(0, 5);
  }, [stories]);

  const currentHero = featuredStories[activeHeroIndex] || stories[0] || null;

  // Auto slide hero every 7 seconds
  useEffect(() => {
    if (featuredStories.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % featuredStories.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredStories.length]);

  const filteredStories = useMemo(() => {
    if (activeFilter === "all") return stories;
    if (activeFilter === "trending") return stories.filter(s => s.trending || s.views > 50);
    if (activeFilter === "featured") return stories.filter(s => s.featured);
    if (activeFilter === "free") return stories.filter(s => s.planRequired === "free" || !s.planRequired);
    
    // Genre match
    return stories.filter(s => {
      const genreNames = (s.genres || []).map((g: any) => (typeof g === "string" ? g : g.name || "").toLowerCase());
      const cat = (s.category || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      const title = (s.title || "").toLowerCase();
      const query = activeFilter.toLowerCase();

      return (
        genreNames.some(g => g.includes(query)) ||
        cat.includes(query) ||
        desc.includes(query) ||
        title.includes(query)
      );
    });
  }, [stories, activeFilter]);

  const handlePlay = (story: StoryItem) => {
    const id = story.id || story._id;
    setLocation(`/story/${id}`);
  };

  const handleToggleWishlist = (e: React.MouseEvent, story: StoryItem) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in to save stories", variant: "destructive" });
      setLocation("/login");
      return;
    }

    const id = story.id || story._id;
    const inWishlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);

    toggleWishlistMutation.mutate(
      { contentId: id, contentType: "story" },
      {
        onSuccess: () => {
          toast({
            title: inWishlist ? "Removed from library" : "Added to library",
          });
        },
        onError: () => {
          toast({
            title: "Failed to update library",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <PublicLayout 
      activeTab="stories"
      onSignIn={() => setLocation("/login")}
      onSubscribeClick={() => setPlansModalOpen(true)}
    >
      <div className="min-h-screen bg-[#07080f] text-white pb-24 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-52 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 space-y-8 relative z-10">

          {/* ══════════════════════════════════════════════════
              1. CINEMATIC HERO AUDIO STORY BANNER
          ══════════════════════════════════════════════════ */}
          {currentHero && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0c0d16] shadow-2xl shadow-black/80 group">
              {/* Backdrop image container */}
              <div className="relative w-full min-h-[300px] sm:min-h-[360px] md:min-h-[400px]">
                <img
                  src={getImageUrl(currentHero.backdrop || currentHero.thumbnail || currentHero.poster)}
                  alt={currentHero.title}
                  className="absolute inset-0 w-full h-full object-cover object-center transform scale-100 group-hover:scale-102 transition-transform duration-700 ease-out"
                />

                {/* Dark Cinematic Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080f] via-[#07080f]/75 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#07080f]/95 via-[#07080f]/60 to-transparent" />

                {/* Hero Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10 max-w-2xl">
                  {/* Meta Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-2.5">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-600/20 border border-red-500/30 text-red-400 font-semibold text-[11px]">
                      <Headphones className="w-3 h-3 text-red-500" /> Audio Drama
                    </span>

                    {currentHero.planRequired !== "free" ? (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 border border-amber-500/40 text-amber-400">
                          PRO
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                          FREE
                        </span>
                      </>
                    )}

                    {currentHero.duration && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1 text-white/70 font-medium text-xs">
                          <Clock className="w-3 h-3" /> {currentHero.duration} mins
                        </span>
                      </>
                    )}

                    {currentHero.views > 0 && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="text-white/60 text-xs">
                          {currentHero.views.toLocaleString()} listens
                        </span>
                      </>
                    )}
                  </div>

                  {/* Story Title */}
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2 drop-shadow-md">
                    {currentHero.title}
                  </h1>

                  {/* Narrator / Author */}
                  {(currentHero.author || currentHero.narrator) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/70 font-medium mb-2">
                      {currentHero.author && <span>By <strong className="text-white">{currentHero.author}</strong></span>}
                      {currentHero.author && currentHero.narrator && <span>•</span>}
                      {currentHero.narrator && (
                        <span className="flex items-center gap-1 text-red-400">
                          <Mic className="w-3 h-3" /> Narrated by {currentHero.narrator}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {currentHero.description && (
                    <p className="text-white/75 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-5 max-w-xl">
                      {currentHero.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => handlePlay(currentHero)}
                      className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/25 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Listen Now</span>
                    </button>

                    {(() => {
                      const id = currentHero.id || currentHero._id;
                      const inWishlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);
                      return (
                        <button
                          onClick={(e) => handleToggleWishlist(e, currentHero)}
                          className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all active:scale-95 backdrop-blur-md ${
                            inWishlist
                              ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                              : "bg-white/10 border-white/15 text-white hover:bg-white/15 hover:border-white/30"
                          }`}
                        >
                          {inWishlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{inWishlist ? "Saved in Library" : "Add to Library"}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Slider Dots */}
              {featuredStories.length > 1 && (
                <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-20">
                  {featuredStories.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveHeroIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeHeroIndex ? "w-6 bg-red-600" : "w-1.5 bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              2. SECTION HEADING & CATEGORY FILTER TABS
          ══════════════════════════════════════════════════ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 rounded-full bg-red-600" />
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Audio Dramas & Stories
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800/80 text-white/70 border border-zinc-700/60">
                  {filteredStories.length} Stories
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/50 mt-1 ml-4">
                Immersive voice narratives, binaural soundscapes, and original audio novels
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {(
                [
                  { id: "all", label: "All Stories" },
                  { id: "trending", label: "🔥 Trending" },
                  { id: "featured", label: "✨ Featured" },
                  { id: "thriller", label: "Thriller" },
                  { id: "romance", label: "Romance" },
                  { id: "horror", label: "Horror" },
                  { id: "drama", label: "Drama" },
                  { id: "free", label: "Free" },
                ] as const
              ).map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30"
                        : "bg-zinc-900/80 text-white/70 hover:text-white hover:bg-zinc-800 border border-zinc-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              3. VERTICAL POSTER CARDS GRID
          ══════════════════════════════════════════════════ */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
              <p className="text-white/60 text-sm font-medium">Loading audio stories...</p>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800/50 p-8">
              <Headphones className="w-12 h-12 text-white/30 mb-3" />
              <p className="text-white/80 font-bold text-lg">No audio stories found</p>
              <p className="text-white/50 text-xs mt-1">Try switching to another category or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 max-w-5xl">
              {filteredStories.map((story) => {
                const id = story.id || story._id;
                const inWishlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);
                const posterUrl = getImageUrl(story.thumbnail || story.poster || story.backdrop);

                return (
                  <div
                    key={id}
                    onClick={() => handlePlay(story)}
                    className="group relative flex flex-col w-full max-w-[220px] cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
                  >
                    {/* Poster Card Container */}
                    <div className="relative aspect-[2/3] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900/90 border border-white/10 group-hover:border-red-500/60 shadow-lg group-hover:shadow-xl group-hover:shadow-red-950/30 transition-all duration-300">
                      {/* Poster image */}
                      <img
                        src={posterUrl}
                        alt={story.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                      />

                      {/* Subtle Gradient overlay on bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                      {/* Top Badges Row */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                        {story.planRequired === "free" || !story.planRequired ? (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/90 text-white border border-emerald-400 shadow-md">
                            FREE
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/90 text-black border border-amber-400 shadow-md">
                            PRO
                          </span>
                        )}

                        {/* Wishlist Button - reveals on hover or if wishlisted */}
                        <button
                          onClick={(e) => handleToggleWishlist(e, story)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md ${
                            inWishlist
                              ? "bg-red-600 text-white opacity-100"
                              : "bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/15 opacity-0 group-hover:opacity-100"
                          }`}
                          title={inWishlist ? "Saved in Library" : "Add to Library"}
                        >
                          {inWishlist ? <Heart className="w-3.5 h-3.5 fill-white" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Bottom Quick Action Bar with Play button (reveals on hover) & Duration */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                        {/* Play button appears on hover */}
                        <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        </div>

                        {/* Duration badge */}
                        {story.duration && (
                          <span className="px-1.5 py-0.5 rounded bg-black/70 border border-white/15 text-[10px] font-bold text-white/90 backdrop-blur-md flex items-center gap-0.5">
                            <Headphones className="w-2.5 h-2.5 text-red-400" />
                            {story.duration}m
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Clean Meta Information Below Poster */}
                    <div className="mt-2 px-0.5">
                      <h3 className="text-white text-xs sm:text-sm font-bold truncate leading-snug group-hover:text-red-400 transition-colors">
                        {story.title}
                      </h3>

                      <div className="flex items-center justify-between mt-0.5 text-[11px] text-white/50 font-medium">
                        <span className="truncate max-w-[110px]">
                          {story.author || story.narrator || "Audio Drama"}
                        </span>
                        {story.views > 0 && (
                          <span className="text-[10px] text-white/40">
                            {story.views} listens
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <SubscriptionPlansModal isOpen={plansModalOpen} onClose={() => setPlansModalOpen(false)} />
    </PublicLayout>
  );
}
