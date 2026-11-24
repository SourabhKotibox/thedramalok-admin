import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Headphones, Play, Flame, Sparkles, Heart, Plus, Clock3, Mic, Crown, Star,
  Search, X, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";
import StoryViewer from "@/components/stories/StoryViewer";
import {
  useGetPublicStories, useGetWishlist, useToggleWishlist, useGetAppProfile,
} from "@/lib/api-client";
import {
  type Story, storyId, storyCover, storyBackdrop, refName, formatStoryDuration,
  formatCount, getSeenStories,
} from "@/components/stories/story-utils";
import { useToast } from "@/hooks/use-toast";

type Filter = "all" | "trending" | "featured" | "new" | "free" | `genre:${string}`;

export default function StoriesPublicPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [viewer, setViewer] = useState<{ list: Story[]; index: number } | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => getSeenStories());
  const [plansModalOpen, setPlansModalOpen] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useGetPublicStories({ limit: 100 });
  const stories: Story[] = useMemo(() => {
    const raw = (data as any)?.data ?? (Array.isArray(data) ? data : []);
    return (raw as Story[]).filter((s) => s && storyId(s));
  }, [data]);

  const { data: profileData } = useGetAppProfile();
  const user = (profileData as any)?.user;
  const { data: wishlistData } = useGetWishlist({ limit: 100 });
  const wishlistItems: any[] = (wishlistData as any)?.items || [];
  const toggleWishlist = useToggleWishlist();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Rings: featured → new → trending → rest, max 15.
  const ringStories = useMemo(() => {
    const score = (s: Story) => (s.featured ? 4 : 0) + (s.isNewContent ? 2 : 0) + (s.trending ? 1 : 0);
    return [...stories].sort((a, b) => score(b) - score(a)).slice(0, 15);
  }, [stories]);

  const heroStories = useMemo(() => {
    const f = stories.filter((s) => s.featured);
    return (f.length ? f : stories).slice(0, 6);
  }, [stories]);
  const hero = heroStories[heroIndex % Math.max(1, heroStories.length)];

  useEffect(() => {
    if (heroStories.length <= 1 || viewer) return;
    const t = window.setInterval(() => setHeroIndex((i) => (i + 1) % heroStories.length), 7000);
    return () => window.clearInterval(t);
  }, [heroStories.length, viewer]);

  const topGenres = useMemo(() => {
    const counts = new Map<string, number>();
    stories.forEach((s) => (s.genres || []).map(refName).filter(Boolean).forEach((g) => counts.set(g, (counts.get(g) || 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([g]) => g);
  }, [stories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stories.filter((s) => {
      if (filter === "trending" && !s.trending) return false;
      if (filter === "featured" && !s.featured) return false;
      if (filter === "new" && !s.isNewContent) return false;
      if (filter === "free" && s.planRequired && s.planRequired !== "free") return false;
      if (filter.startsWith("genre:")) {
        const g = filter.slice(6).toLowerCase();
        if (!(s.genres || []).some((x) => refName(x).toLowerCase() === g)) return false;
      }
      if (q) {
        const hay = [s.title, s.author, s.narrator, s.category, ...(s.tags || [])].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [stories, filter, search]);

  const openViewer = (list: Story[], index: number) => setViewer({ list, index });
  const closeViewer = () => {
    setViewer(null);
    setSeen(getSeenStories());
  };
  const listen = (s: Story) => {
    setViewer(null);
    setLocation(`/story/${storyId(s)}`);
  };

  const inWishlist = (s: Story) => wishlistItems.some((w: any) => w.id === storyId(s) || w.contentId === storyId(s));
  const onWishlist = (e: React.MouseEvent, s: Story) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in to save stories", variant: "destructive" });
      setLocation("/login");
      return;
    }
    const was = inWishlist(s);
    toggleWishlist.mutate(
      { contentId: storyId(s), contentType: "story" } as any,
      {
        onSuccess: () => toast({ title: was ? "Removed from your library" : "Saved to your library" }),
        onError: () => toast({ title: "Couldn't update your library", variant: "destructive" }),
      }
    );
  };

  const chips: { value: Filter; label: string; icon?: any }[] = [
    { value: "all", label: "All" },
    { value: "trending", label: "Trending", icon: Flame },
    { value: "featured", label: "Featured", icon: Star },
    { value: "new", label: "New", icon: Sparkles },
    { value: "free", label: "Free" },
    ...topGenres.map((g) => ({ value: `genre:${g}` as Filter, label: g })),
  ];

  return (
    <PublicLayout activeTab="stories" onSignIn={() => setLocation("/login")} onSubscribeClick={() => setPlansModalOpen(true)}>
      <div className="relative min-h-screen overflow-hidden bg-[#07080f] pb-24 text-white">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
        <div className="pointer-events-none absolute top-60 right-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 pt-6 sm:px-6 sm:pt-8 lg:px-10">
          {/* Title + search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Audio stories</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Stories</h1>
              <p className="mt-1 text-sm text-white/60">Tap a story to preview it, then listen to the full episode.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories, authors…"
                className="h-11 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-9 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-red-500/60 focus:bg-white/10"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <Message
              icon={AlertTriangle}
              title="Couldn't load stories"
              text="Check your connection and try again."
              action={
                <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500">
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Retry
                </button>
              }
            />
          ) : stories.length === 0 ? (
            <Message icon={Headphones} title="Stories are coming soon" text="New audio stories are on their way. Check back shortly." />
          ) : (
            <>
              {/* Story rings */}
              <section aria-label="Story highlights">
                <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                  {ringStories.map((s, i) => {
                    const isSeen = seen.has(storyId(s));
                    return (
                      <button key={storyId(s)} onClick={() => openViewer(ringStories, i)} className="group flex w-[76px] shrink-0 flex-col items-center gap-2 sm:w-[88px]" aria-label={`Preview ${s.title}`}>
                        <span
                          className={`relative block rounded-full p-[3px] transition-transform group-hover:scale-105 group-active:scale-95 ${
                            isSeen ? "bg-white/20" : "bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400"
                          }`}
                        >
                          <span className="block h-[66px] w-[66px] overflow-hidden rounded-full border-[3px] border-[#07080f] bg-white/5 sm:h-[78px] sm:w-[78px]">
                            <CoverImg story={s} className="h-full w-full object-cover" />
                          </span>
                          {s.isNewContent && !isSeen && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#07080f] bg-red-600 px-1.5 text-[9px] font-bold uppercase leading-4">New</span>
                          )}
                        </span>
                        <span className={`w-full truncate text-center text-[11px] font-medium ${isSeen ? "text-white/50" : "text-white/90"}`}>{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Hero spotlight */}
              {hero && (
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d16] shadow-2xl shadow-black/60">
                  <img key={storyId(hero)} src={storyBackdrop(hero)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 dl-story-in" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#07080f] via-[#07080f]/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07080f] via-transparent to-transparent" />
                  <div key={`hero-${storyId(hero)}`} className="relative flex min-h-[320px] items-end gap-6 p-5 sm:min-h-[380px] sm:p-10 dl-story-up">
                    <div className="hidden w-40 shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-2xl md:block aspect-[2/3]">
                      <CoverImg story={hero} className="h-full w-full object-cover" />
                    </div>
                    <div className="max-w-xl space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                        {hero.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-black"><Star className="h-3 w-3 fill-black" /> Featured</span>}
                        {hero.trending && <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-0.5"><Flame className="h-3 w-3" /> Trending</span>}
                        {hero.planRequired && hero.planRequired !== "free" && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5"><Crown className="h-3 w-3 text-amber-400" /> {hero.planRequired}</span>}
                      </div>
                      <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">{hero.title}</h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                        {hero.author && <span>by {hero.author}</span>}
                        {hero.narrator && <span className="inline-flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> {hero.narrator}</span>}
                        {formatStoryDuration(hero.duration) && <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatStoryDuration(hero.duration)}</span>}
                      </div>
                      {(hero.shortDescription || hero.description) && <p className="line-clamp-2 text-sm text-white/70 sm:text-base">{hero.shortDescription || hero.description}</p>}
                      <div className="flex flex-wrap gap-3 pt-1">
                        <button onClick={() => listen(hero)} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold shadow-lg shadow-red-600/40 transition hover:bg-red-500 active:scale-95">
                          <Play className="h-4 w-4 fill-white" /> Listen now
                        </button>
                        <button onClick={() => openViewer(heroStories, heroStories.indexOf(hero))} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20">
                          <Eye className="h-4 w-4" /> Preview
                        </button>
                        <button onClick={(e) => onWishlist(e, hero)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur hover:bg-white/20" aria-label="Save to library">
                          {inWishlist(hero) ? <Heart className="h-4 w-4 fill-red-500 text-red-500" /> : <Plus className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {heroStories.length > 1 && (
                    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 sm:bottom-6 sm:right-6">
                      <button onClick={() => setHeroIndex((i) => (i - 1 + heroStories.length) % heroStories.length)} className="hidden h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 sm:flex" aria-label="Previous">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <div className="flex gap-1.5">
                        {heroStories.map((s, i) => (
                          <button key={storyId(s)} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full transition-all ${i === heroIndex % heroStories.length ? "w-6 bg-red-500" : "w-1.5 bg-white/40"}`} aria-label={`Show ${s.title}`} />
                        ))}
                      </div>
                      <button onClick={() => setHeroIndex((i) => (i + 1) % heroStories.length)} className="hidden h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 sm:flex" aria-label="Next">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Filters */}
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                {chips.map((c) => {
                  const Icon = c.icon;
                  const active = filter === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => setFilter(c.value)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        active ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-600/30" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />} {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Grid */}
              <section>
                <div className="mb-4 flex items-baseline justify-between">
                  <h3 className="text-lg font-bold">{filter === "all" && !search ? "All stories" : "Results"}</h3>
                  <span className="text-xs text-white/50">{filtered.length} {filtered.length === 1 ? "story" : "stories"}</span>
                </div>
                {filtered.length === 0 ? (
                  <Message
                    icon={Search}
                    title="Nothing matches"
                    text="Try another filter or search term."
                    action={
                      <button onClick={() => { setFilter("all"); setSearch(""); }} className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/10">
                        Clear filters
                      </button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {filtered.map((s, i) => (
                      <article key={storyId(s)} className="group cursor-pointer" onClick={() => openViewer(filtered, i)}>
                        <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg shadow-black/40 transition duration-300 group-hover:-translate-y-1 group-hover:border-red-500/40 group-hover:shadow-red-900/30">
                          <CoverImg story={s} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                          <div className="absolute left-2 right-2 top-2 flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                              {s.isNewContent && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase">New</span>}
                              {s.planRequired && s.planRequired !== "free" && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black"><Crown className="h-2.5 w-2.5" /> Pro</span>
                              )}
                            </div>
                            <button
                              onClick={(e) => onWishlist(e, s)}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition ${
                                inWishlist(s) ? "bg-red-600" : "bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-black/70"
                              }`}
                              aria-label={inWishlist(s) ? "Saved" : "Save to library"}
                            >
                              {inWishlist(s) ? <Heart className="h-3.5 w-3.5 fill-white" /> : <Plus className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <button
                              onClick={(e) => { e.stopPropagation(); listen(s); }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/40 transition sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
                              aria-label={`Listen to ${s.title}`}
                            >
                              <Play className="ml-0.5 h-4 w-4 fill-white" />
                            </button>
                            {formatStoryDuration(s.duration) && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
                                <Headphones className="h-3 w-3 text-red-400" /> {formatStoryDuration(s.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 px-0.5">
                          <h4 className="truncate text-sm font-bold group-hover:text-red-400">{s.title}</h4>
                          <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-white/50">
                            <span className="truncate">{s.author || s.narrator || "Audio story"}</span>
                            {!!s.views && <span className="shrink-0">{formatCount(s.views)} listens</span>}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {viewer && <StoryViewer stories={viewer.list} startIndex={viewer.index} onClose={closeViewer} onListen={listen} />}
      <SubscriptionPlansModal isOpen={plansModalOpen} onClose={() => setPlansModalOpen(false)} />
    </PublicLayout>
  );
}

function CoverImg({ story, className }: { story: Story; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = storyCover(story);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-red-900/50 via-[#11121c] to-indigo-900/40 ${className || ""}`}>
        <Headphones className="h-1/4 w-1/4 text-white/25" />
      </div>
    );
  }
  return <img src={src} alt={story.title} loading="lazy" onError={() => setFailed(true)} className={className} draggable={false} />;
}

function Message({ icon: Icon, title, text, action }: { icon: any; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
      <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/15 text-red-500">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-white/60">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-2">
            <div className="h-[72px] w-[72px] rounded-full bg-white/10 sm:h-[84px] sm:w-[84px]" />
            <div className="h-2.5 w-14 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="h-[320px] rounded-3xl bg-white/5 sm:h-[380px]" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] rounded-xl bg-white/5" />
            <div className="mt-2 h-3 w-3/4 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
