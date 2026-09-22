import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { 
  Loader2, Download, Check, Play, Film, Tv, Plus, Star, Crown, 
  Flame, Sparkles, Heart, Clock, Calendar, CheckCircle2
} from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { 
  useGetWebHome, 
  getImageUrl, 
  useGetAppProfile, 
  useRequestDownload, 
  useRemoveDownload, 
  useGetDownloads, 
  cacheDownloadedVideo, 
  removeOfflineVideo,
  useGetWishlist,
  useToggleWishlist
} from "@/lib/api-client";
import { useDownloadPermission } from "@/hooks/useDownloadPermission";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type FilterType = "all" | "movie" | "show" | "drama" | "trending";

export default function NewHotPublicPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { canDownload } = useDownloadPermission();
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadModalItem, setDownloadModalItem] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { data: profileData } = useGetAppProfile();
  const user = profileData?.user;

  const { data: homeData, isLoading } = useGetWebHome();
  const { data: downloadsData, refetch: refetchDownloads } = useGetDownloads();
  const userDownloads: any[] = downloadsData?.items || [];

  const { data: wishlistData } = useGetWishlist({ limit: 100 });
  const wishlistItems: any[] = wishlistData?.items || [];
  const toggleWishlistMutation = useToggleWishlist();

  const requestDownloadMutation = useRequestDownload();
  const removeDownloadMutation = useRemoveDownload();

  const newReleases = homeData?.newReleases || [];
  const trendingNow = homeData?.trendingNow || [];
  const newDramas = homeData?.newDramas || [];
  const featuredDramas = homeData?.featuredDramas || [];

  const allItems = useMemo(() => {
    return [...trendingNow, ...newReleases, ...newDramas, ...featuredDramas]
      .filter((v, i, a) => a.findIndex(t => (t.id || t._id) === (v.id || v._id)) === i)
      .sort((a, b) => {
        const dateA = new Date(a.releaseDate || a.year || 0).getTime();
        const dateB = new Date(b.releaseDate || b.year || 0).getTime();
        return dateB - dateA;
      });
  }, [newReleases, trendingNow, newDramas, featuredDramas]);

  // Top featured item for the cinematic hero card
  const featuredItem = allItems.length > 0 ? allItems[0] : null;

  // Filtered list for the vertical cards grid
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return allItems;
    if (activeFilter === "trending") {
      return allItems.filter(item => item.trending || item.badge === "HOT" || item.badge === "TRENDING");
    }
    if (activeFilter === "drama") {
      return allItems.filter(item => (item.contentType || "").toLowerCase() === "drama");
    }
    if (activeFilter === "show") {
      return allItems.filter(item => {
        const t = (item.type || item.contentType || "").toLowerCase();
        return t === "show" || t === "series";
      });
    }
    if (activeFilter === "movie") {
      return allItems.filter(item => {
        const t = (item.type || item.contentType || "").toLowerCase();
        return t === "movie" || (!t.includes("show") && !t.includes("series") && t !== "drama");
      });
    }
    return allItems;
  }, [allItems, activeFilter]);

  const handlePlay = (item: any) => {
    const id = item.id || item._id;
    const contentType = (item.contentType || "").toLowerCase();
    const type = (item.type || "").toLowerCase();
    const isDrama = contentType === "drama";
    const isShow = type === "show" || type === "series" || contentType === "series";

    if (isDrama) {
      setLocation(item.trailerUrl ? `/drama/${id}/episode/0` : `/drama/${id}/episode/1`);
    } else if (isShow) {
      setLocation(`/show/${id}`);
    } else {
      setLocation(`/movie/${id}`);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in to add to watchlist", variant: "destructive" });
      setLocation("/login");
      return;
    }

    const id = item.id || item._id;
    const isDrama = (item.contentType || "").toLowerCase() === "drama";
    const isShow = (item.type || item.contentType || "").toLowerCase() === "show" || (item.contentType || "").toLowerCase() === "series";
    const contentType = isDrama ? "drama" : isShow ? "show" : "movie";

    const inWatchlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);

    toggleWishlistMutation.mutate(
      { contentId: id, contentType },
      {
        onSuccess: () => {
          toast({
            title: inWatchlist ? "Removed from watchlist" : "Added to watchlist",
          });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to update watchlist",
            description: err?.message || "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDownloadClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in to download", variant: "destructive" });
      setLocation("/login");
      return;
    }

    const id = item.id || item._id;
    const isDownloaded = userDownloads.some((d: any) => d.contentId === id || d.id === id);

    if (isDownloaded) {
      const record = userDownloads.find((d: any) => d.contentId === id || d.id === id);
      removeDownloadMutation.mutate(
        { id: record?.id || record?._id, contentId: id },
        {
          onSuccess: async () => {
            await removeOfflineVideo(id);
            refetchDownloads();
            toast({ title: "Removed from downloads" });
          },
          onError: () => toast({ title: "Failed to remove download", variant: "destructive" }),
        }
      );
      return;
    }

    // Open download confirmation popup
    setDownloadModalItem(item);
  };

  const executeDownload = async (item: any) => {
    const id = item.id || item._id;
    setDownloadingId(id);
    setDownloadModalItem(null);
    toast({ title: "Downloading started...", description: `${item.title} is being downloaded for offline viewing.` });
    const contentType = (item.contentType === "drama" ? "drama" : item.type === "show" || item.contentType === "series" ? "series" : "movie") as "movie" | "drama" | "series";

    try {
      const res: any = await requestDownloadMutation.mutateAsync({ contentId: id, contentType });
      const downloadUrl = res?.data?.downloadUrl || res?.downloadUrl || item?.videoUrl || item?.hlsUrl;

      if (downloadUrl) {
        const ok = await cacheDownloadedVideo(downloadUrl, id);
        refetchDownloads();
        toast({ title: ok ? "Download complete — available offline" : "Added to downloads" });
      } else {
        refetchDownloads();
        toast({ title: "Added to downloads" });
      }
    } catch (err: any) {
      const fallbackUrl = item?.videoUrl || item?.hlsUrl;
      if (fallbackUrl && item?.downloadAllowed !== false) {
        const ok = await cacheDownloadedVideo(fallbackUrl, id);
        refetchDownloads();
        toast({ title: ok ? "Download complete — available offline" : "Added to downloads" });
      } else {
        toast({ 
          title: "Download failed", 
          description: err?.message || "Could not download content at this time.", 
          variant: "destructive" 
        });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const getBadgeInfo = (item: any) => {
    if (item.badge === "TOP" || item.badge === "EXCLUSIVE") {
      return { text: item.badge, icon: Crown, bg: "bg-amber-500/90 text-black border-amber-400" };
    }
    if (item.trending || item.badge === "HOT" || item.badge === "TRENDING") {
      return { text: "HOT", icon: Flame, bg: "bg-orange-500/90 text-white border-orange-400" };
    }
    if (item.isNew || item.badge === "NEW") {
      return { text: "NEW", icon: Sparkles, bg: "bg-emerald-500/90 text-white border-emerald-400" };
    }
    return { text: "NEW", icon: Sparkles, bg: "bg-red-600/90 text-white border-red-500" };
  };

  return (
    <PublicLayout onSignIn={() => setLocation("/login")} onSubscribeClick={() => setPlansModalOpen(true)}>
      <div className="min-h-screen bg-[#07080f] text-white pb-24 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-48 right-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 space-y-8 relative z-10">
          
          {/* ══════════════════════════════════════════════════
              1. FEATURED HERO CARD (Top Cinematic Banner)
          ══════════════════════════════════════════════════ */}
          {featuredItem && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0c0d16] shadow-2xl shadow-black/80 group">
              {/* Backdrop image container */}
              <div className="relative w-full min-h-[300px] sm:min-h-[360px] md:min-h-[400px]">
                <img
                  src={getImageUrl(featuredItem.backdrop || featuredItem.poster || featuredItem.thumbnail)}
                  alt={featuredItem.title}
                  className="absolute inset-0 w-full h-full object-cover object-top sm:object-center transform scale-100 group-hover:scale-102 transition-transform duration-700 ease-out"
                />

                {/* Smooth cinematic gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080f] via-[#07080f]/75 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#07080f]/95 via-[#07080f]/60 to-transparent" />

                {/* Hero Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10 max-w-2xl">
                  {/* Subtle, refined meta row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-2.5">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-600/20 border border-red-500/30 text-red-400 font-semibold text-[11px]">
                      <Flame className="w-3 h-3 text-red-500 fill-red-500" /> Featured #1
                    </span>

                    {featuredItem.imdbRating && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                          <Star className="w-3 h-3 fill-amber-400" /> {featuredItem.imdbRating} IMDb
                        </span>
                      </>
                    )}

                    <span className="text-white/30">•</span>
                    <span className="text-white/70 font-medium text-xs">
                      {featuredItem.year || new Date().getFullYear()}
                    </span>

                    <span className="text-white/30">•</span>
                    <span className="text-white/70 font-medium text-xs">
                      {featuredItem.contentType === "drama" ? "Short Drama" : featuredItem.type === "show" || featuredItem.contentType === "series" ? "TV Series" : "Movie"}
                    </span>

                    {featuredItem.ageRating && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-white/20 text-white/70">
                          {featuredItem.ageRating}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title (Properly proportioned) */}
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2 drop-shadow-md">
                    {featuredItem.title}
                  </h1>

                  {/* Synopsis / Description */}
                  {featuredItem.description && (
                    <p className="text-white/75 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-5 max-w-xl">
                      {featuredItem.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Watch Now Button */}
                    <button
                      onClick={() => handlePlay(featuredItem)}
                      className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/25 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Watch Now</span>
                    </button>

                    {/* Wishlist / My List Button */}
                    {(() => {
                      const id = featuredItem.id || featuredItem._id;
                      const inWishlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);
                      return (
                        <button
                          onClick={(e) => handleToggleWishlist(e, featuredItem)}
                          className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all active:scale-95 backdrop-blur-md ${
                            inWishlist
                              ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                              : "bg-white/10 border-white/15 text-white hover:bg-white/15 hover:border-white/30"
                          }`}
                        >
                          {inWishlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{inWishlist ? "In Watchlist" : "My List"}</span>
                        </button>
                      );
                    })()}

                    {/* Download Button */}
                    {canDownload && featuredItem?.downloadAllowed !== false && (() => {
                      const id = featuredItem.id || featuredItem._id;
                      const isDownloaded = userDownloads.some((d: any) => d.contentId === id || d.id === id);
                      const isDownloading = downloadingId === id;

                      return (
                        <button
                          onClick={(e) => handleDownloadClick(e, featuredItem)}
                          disabled={isDownloading}
                          className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all active:scale-95 backdrop-blur-md ${
                            isDownloaded
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-white/10 border-white/15 text-white hover:bg-white/15 hover:border-white/30"
                          } disabled:opacity-50`}
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Downloading...</span>
                            </>
                          ) : isDownloaded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Downloaded</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
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
                  Recommended For You
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800/80 text-white/70 border border-zinc-700/60">
                  {filteredItems.length} Titles
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/50 mt-1 ml-4">
                Fresh releases, high-rated movies, and trending dramas
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "movie", label: "Movies" },
                  { id: "show", label: "TV Shows" },
                  { id: "drama", label: "Short Dramas" },
                  { id: "trending", label: "Trending" },
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
              <p className="text-white/60 text-sm font-medium">Loading catalog...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800/50 p-8">
              <Film className="w-12 h-12 text-white/30 mb-3" />
              <p className="text-white/80 font-bold text-lg">No content found</p>
              <p className="text-white/50 text-xs mt-1">Try switching to another category or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
              {filteredItems.map((item: any, index: number) => {
                const id = item.id || item._id || `item-${index}`;
                const isDownloaded = userDownloads.some((d: any) => d.contentId === id || d.id === id);
                const isDownloading = downloadingId === id;
                const inWishlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);
                const badge = getBadgeInfo(item);
                const BadgeIcon = badge.icon;
                const posterUrl = getImageUrl(item.poster || item.posterImage || item.thumbnail || item.backdrop);

                const isDrama = (item.contentType || "").toLowerCase() === "drama";
                const isShow = (item.type || item.contentType || "").toLowerCase() === "show" || (item.contentType || "").toLowerCase() === "series";
                const contentTypeLabel = isDrama ? "Drama" : isShow ? "TV Series" : "Movie";

                return (
                  <div
                    key={id}
                    onClick={() => handlePlay(item)}
                    className="group relative flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
                  >
                    {/* Poster Card Container */}
                    <div className="relative aspect-[2/3] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900/90 border border-white/10 group-hover:border-red-500/60 shadow-lg group-hover:shadow-xl group-hover:shadow-red-950/30 transition-all duration-300">
                      {/* Poster image */}
                      <img
                        src={posterUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                      />

                      {/* Subtle Gradient overlay on bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                      {/* Top Badges Row */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                        {/* Status badge */}
                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border shadow-md ${badge.bg}`}>
                          <BadgeIcon className="w-2.5 h-2.5" />
                          {badge.text}
                        </span>

                        {/* Wishlist Quick Action - reveals on hover or if wishlisted */}
                        <button
                          onClick={(e) => handleToggleWishlist(e, item)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md ${
                            inWishlist
                              ? "bg-red-600 text-white opacity-100"
                              : "bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/15 opacity-0 group-hover:opacity-100"
                          }`}
                          title={inWishlist ? "In Watchlist" : "Add to Watchlist"}
                        >
                          {inWishlist ? <Heart className="w-3.5 h-3.5 fill-white" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Bottom Quick Action Bar with Video/Play icon & Download icon (reveal on hover) */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                        {/* Small Video/Play button at bottom left - only appears on hover */}
                        <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        </div>

                        {/* Quick Download icon button on bottom right */}
                        {canDownload && item?.downloadAllowed !== false && (
                          <button
                            onClick={(e) => handleDownloadClick(e, item)}
                            disabled={isDownloading}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md ${
                              isDownloaded
                                ? "bg-emerald-600 text-white opacity-100"
                                : isDownloading
                                ? "bg-amber-600 text-white opacity-100"
                                : "bg-black/60 text-white/90 hover:text-white hover:bg-black/80 border border-white/15 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100"
                            } disabled:opacity-50`}
                            title={isDownloaded ? "Downloaded" : isDownloading ? "Downloading..." : "Download"}
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-white" />
                            ) : isDownloaded ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Clean Meta Information Below Poster */}
                    <div className="mt-2 px-0.5">
                      <h3 className="text-white text-xs sm:text-sm font-bold truncate leading-snug group-hover:text-red-400 transition-colors">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/50 font-medium">
                        <span>{item.year || new Date().getFullYear()}</span>
                        <span>•</span>
                        <span className="text-white/60">{contentTypeLabel}</span>
                        {item.imdbRating && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                              ★ {item.imdbRating}
                            </span>
                          </>
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

      {/* ══════════════════════════════════════════════════
          4. DOWNLOAD CONFIRMATION POPUP MODAL
      ══════════════════════════════════════════════════ */}
      <Dialog open={!!downloadModalItem} onOpenChange={(open) => { if (!open) setDownloadModalItem(null); }}>
        <DialogContent className="bg-[#0e0f1d] border border-white/15 text-white sm:max-w-md rounded-2xl shadow-2xl p-6">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Download className="w-5 h-5 text-red-500" />
              Download Content
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Save this title for offline viewing anytime, anywhere.
            </DialogDescription>
          </DialogHeader>

          {downloadModalItem && (
            <div className="space-y-4 my-2">
              {/* Preview Card */}
              <div className="flex gap-4 p-3.5 rounded-xl bg-white/5 border border-white/10 items-center">
                <div className="w-16 h-24 rounded-lg overflow-hidden bg-black flex-shrink-0 shadow-md">
                  <img
                    src={getImageUrl(downloadModalItem.poster || downloadModalItem.posterImage || downloadModalItem.thumbnail || downloadModalItem.backdrop)}
                    alt={downloadModalItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-white font-bold text-sm sm:text-base truncate">{downloadModalItem.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span>{downloadModalItem.year || new Date().getFullYear()}</span>
                    <span>•</span>
                    <span className="capitalize">{downloadModalItem.contentType === "drama" ? "Short Drama" : downloadModalItem.type === "show" ? "TV Series" : "Movie"}</span>
                    {downloadModalItem.imdbRating && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">★ {downloadModalItem.imdbRating}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      1080p Full HD
                    </span>
                    <span className="text-[10px] font-semibold text-white/40">
                      Offline Storage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDownloadModalItem(null)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => executeDownload(downloadModalItem)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black shadow-lg shadow-red-600/30 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Now</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubscriptionPlansModal isOpen={plansModalOpen} onClose={() => setPlansModalOpen(false)} />
    </PublicLayout>
  );
}
