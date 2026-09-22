import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import {
  Play, Pause, Clock, User, Headphones, ChevronLeft,
  Loader2, Mic, Heart, Share2, Volume2, VolumeX,
  SkipBack, SkipForward, RotateCcw, RotateCw, Gauge, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import PublicLayout from "@/components/PublicLayout";
import { 
  getImageUrl, 
  getPublicStoryById,
  useGetWishlist,
  useToggleWishlist,
  useGetAppProfile
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";

export default function StoryPlayerPage() {
  const [, params] = useRoute("/story/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = (params as any)?.id;

  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: profileData } = useGetAppProfile();
  const user = profileData?.user;

  const { data: wishlistData } = useGetWishlist({ limit: 100 });
  const wishlistItems: any[] = wishlistData?.items || [];
  const toggleWishlistMutation = useToggleWishlist();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        const data = await getPublicStoryById(id);
        if (data && data.success) {
          setStory(data.data);
        } else if (data && !data.error) {
          setStory(data);
        }
      } catch (err) {
        console.error('Failed to fetch story:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStory();
  }, [id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getAudioSrc = () => {
    if (!story) return '';
    if (story.audioUrl) return story.audioUrl;
    if (story.audioFile) {
      if (story.audioFile.startsWith('http')) return story.audioFile;
      return getImageUrl(story.audioFile);
    }
    return '';
  };

  const handleToggleWishlist = () => {
    if (!user) {
      toast({ title: "Please sign in to save stories", variant: "destructive" });
      setLocation("/login");
      return;
    }

    const storyId = story?.id || story?._id;
    const inWishlist = wishlistItems.some((w: any) => w.id === storyId || w.contentId === storyId);

    toggleWishlistMutation.mutate(
      { contentId: storyId, contentType: "story" },
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

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080f]">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080f] text-white">
        <Headphones className="w-16 h-16 text-zinc-600 mb-4" />
        <p className="text-zinc-400 mb-4">Story not found</p>
        <Button onClick={() => setLocation("/stories")} variant="outline" className="border-zinc-700 text-white">
          Back to Stories
        </Button>
      </div>
    );
  }

  const storyDuration = story.duration ? story.duration * 60 : duration;
  const inWishlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);

  return (
    <PublicLayout
      activeTab="stories"
      onSignIn={() => setLocation("/login")}
      onSubscribeClick={() => setPlansModalOpen(true)}
    >
      <div className="min-h-screen bg-[#07080f] text-white pb-24 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-48 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <button
            onClick={() => setLocation("/stories")}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 w-fit backdrop-blur-md"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Stories
          </button>

          <div className="flex flex-col md:flex-row gap-8 p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0c0d16] border border-white/10 shadow-2xl shadow-black/80">
            {/* Story Poster / Cover */}
            <div className="flex-shrink-0 w-full md:w-auto">
              <div className="w-48 sm:w-56 mx-auto md:mx-0 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl border border-white/15">
                {story.thumbnail || story.poster ? (
                  <img
                    src={getImageUrl(story.thumbnail || story.poster)}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Headphones className="h-16 w-16 text-zinc-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Story Meta & Controls */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-600/20 border border-red-500/30 text-red-400 font-semibold text-[11px]">
                      <Headphones className="w-3 h-3 text-red-500" /> Audio Drama
                    </span>
                    {story.planRequired !== "free" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 border border-amber-500/40 text-amber-400">
                        PRO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                        FREE
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {story.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleToggleWishlist}
                    className={`h-9 w-9 rounded-full border transition-colors ${
                      inWishlist 
                        ? "bg-red-600 text-white border-red-500" 
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                    title={inWishlist ? "Saved in Library" : "Add to Library"}
                  >
                    {inWishlist ? <Heart className="h-4 w-4 fill-white" /> : <Heart className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Narrator & Author */}
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-zinc-400 font-medium">
                {story.author && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span>By <strong className="text-white">{story.author}</strong></span>
                  </div>
                )}
                {story.narrator && (
                  <div className="flex items-center gap-1.5">
                    <Mic className="h-4 w-4 text-red-400" />
                    <span>Narrated by <strong className="text-white">{story.narrator}</strong></span>
                  </div>
                )}
                {storyDuration > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span>{formatTime(storyDuration)}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {story.genres && story.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {story.genres.map((g: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md text-xs bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium"
                    >
                      {typeof g === "string" ? g : g.name}
                    </span>
                  ))}
                </div>
              )}

              {story.description && (
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-2xl">{story.description}</p>
              )}

              {/* Audio Player Component */}
              {getAudioSrc() ? (
                <div className="mt-6 bg-[#11121f] border border-white/10 rounded-2xl p-5 shadow-xl">
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div
                        className="h-2 bg-zinc-800 rounded-full overflow-hidden cursor-pointer relative"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          if (audioRef.current && duration) {
                            audioRef.current.currentTime = percent * duration;
                          }
                        }}
                      >
                        <div
                          className="h-full bg-red-600 transition-all"
                          style={{ width: `${((currentTime || 0) / (duration || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration || storyDuration || 0)}</span>
                      </div>
                    </div>

                    {/* Main Controls */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Skip Back 10s */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => skip(-10)}
                          className="h-9 w-9 text-zinc-400 hover:text-white rounded-full"
                          title="Rewind 10s"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>

                        {/* Play/Pause */}
                        <button
                          onClick={togglePlay}
                          className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all shadow-lg shadow-red-600/30 active:scale-95"
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5 ml-0.5 fill-white" />
                          )}
                        </button>

                        {/* Skip Forward 10s */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => skip(10)}
                          className="h-9 w-9 text-zinc-400 hover:text-white rounded-full"
                          title="Forward 10s"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Volume Control */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMute}
                            className="h-8 w-8 text-zinc-400 hover:text-white rounded-full"
                          >
                            {volume === 0 ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="w-20">
                            <Slider
                              value={[volume * 100]}
                              onValueChange={(v) => setVolume(v[0] / 100)}
                              max={100}
                              step={1}
                              className="h-1.5"
                            />
                          </div>
                        </div>

                        {/* Playback Speed */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-zinc-400 hover:text-white flex items-center gap-1 rounded-lg bg-white/5 border border-white/10"
                              title="Playback Speed"
                            >
                              <Gauge className="h-3.5 w-3.5" />
                              <span className="text-xs font-bold">{playbackRate}x</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto bg-zinc-900 border-zinc-800 text-white p-1.5 rounded-xl">
                            <div className="flex flex-col gap-0.5">
                              {playbackRates.map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => setPlaybackRate(rate)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors text-left ${
                                    playbackRate === rate
                                      ? "bg-red-600 text-white"
                                      : "text-zinc-300 hover:bg-zinc-800"
                                  }`}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <audio
                      ref={audioRef}
                      src={getAudioSrc()}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={handleEnded}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-xs text-white/50 text-center">
                  Audio file is being processed or not yet available.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <SubscriptionPlansModal isOpen={plansModalOpen} onClose={() => setPlansModalOpen(false)} />
    </PublicLayout>
  );
}
