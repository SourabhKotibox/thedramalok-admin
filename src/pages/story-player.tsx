import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import {
  Play, Pause, Clock, User, Headphones, ChevronLeft,
  Loader2, Mic, Heart, Share2, BookmarkPlus, Volume2, VolumeX,
  SkipBack, SkipForward, RotateCcw, RotateCw, Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import PublicLayout from "@/components/PublicLayout";
import { getImageUrl } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

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
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stories/public/${id}`);
        const data = await res.json();
        if (data.success) {
          setStory(data.data);
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
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030306]">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030306] text-white">
        <Mic className="w-16 h-16 text-zinc-600 mb-4" />
        <p className="text-zinc-400 mb-4">Story not found</p>
        <Button onClick={() => setLocation("/stories")} variant="outline" className="border-zinc-700 text-white">
          Back to Stories
        </Button>
      </div>
    );
  }

  const storyDuration = story.duration || duration;

  return (
    <PublicLayout
      activeTab="stories"
      setActiveTab={(tab: any) => {
        if (tab === "home") setLocation("/");
        else if (tab === "movies") setLocation("/browse/movies");
        else if (tab === "tvshows") setLocation("/tv-shows-browse");
        else setLocation(`/browse/${tab}`);
      }}
      onSignIn={() => setLocation("/login")}
    >
      <div className="min-h-screen bg-[#030306] text-white">

      <main className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => setLocation("/stories")}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Stories
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-full md:w-auto">
            <div className="w-full max-w-[200px] mx-auto md:mx-0 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
              {story.thumbnail ? (
                <img
                  src={getImageUrl(story.thumbnail)}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Mic className="h-16 w-16 text-zinc-600" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">{story.title}</h1>
                {story.category && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs bg-red-600/15 text-red-500 border border-red-600/30 mt-2">
                    {story.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white">
                  <BookmarkPlus className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              {story.author && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{story.author}</span>
                </div>
              )}
              {story.narrator && (
                <div className="flex items-center gap-1.5">
                  <Headphones className="h-4 w-4" />
                  <span>Narrated by {story.narrator}</span>
                </div>
              )}
              {storyDuration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(storyDuration)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(story.genres || []).map((g: any) => (
                <span
                  key={g._id || g}
                  className="px-3 py-1 rounded-full text-xs bg-red-600/15 text-red-500 border border-red-600/30"
                >
                  {g.name || g}
                </span>
              ))}
            </div>

            {story.description && (
              <p className="text-zinc-300 leading-relaxed">{story.description}</p>
            )}

            {getAudioSrc() && (
              <div className="mt-8 bg-gradient-to-br from-red-900/30 to-zinc-900 border border-red-800/40 rounded-2xl p-6 shadow-lg shadow-red-900/10">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Play className="h-5 w-5 text-red-600" />
                  <span className="text-white">Audio Player</span>
                  <span className="text-xs text-red-400 bg-red-600/20 px-2 py-0.5 rounded-full ml-2">
                    Now Playing
                  </span>
                </h2>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div
                      className="h-2 bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        if (audioRef.current) {
                          audioRef.current.currentTime = percent * duration;
                        }
                      }}
                    >
                      <div
                        className="h-full bg-red-600 transition-all"
                        style={{ width: `${(currentTime / (storyDuration || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(storyDuration || 0)}</span>
                    </div>
                  </div>

                  {/* Main Controls */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {/* Skip Back */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => skip(-10)}
                        className="h-10 w-10 text-zinc-400 hover:text-white"
                        title="Rewind 10s"
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>

                      {/* Rewind 5s */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => skip(-5)}
                        className="h-10 w-10 text-zinc-400 hover:text-white"
                        title="Rewind 5s"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>

                      {/* Play/Pause */}
                      <button
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                      >
                        {isPlaying ? (
                          <Pause className="h-7 w-7" />
                        ) : (
                          <Play className="h-7 w-7 ml-0.5" />
                        )}
                      </button>

                      {/* Forward 5s */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => skip(5)}
                        className="h-10 w-10 text-zinc-400 hover:text-white"
                        title="Forward 5s"
                      >
                        <RotateCw className="h-5 w-5" />
                      </Button>

                      {/* Skip Forward */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => skip(10)}
                        className="h-10 w-10 text-zinc-400 hover:text-white"
                        title="Forward 10s"
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Volume Control */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleMute}
                          className="h-9 w-9 text-zinc-400 hover:text-white"
                        >
                          {volume === 0 ? (
                            <VolumeX className="h-5 w-5" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </Button>
                        <div className="w-24">
                          <Slider
                            value={[volume * 100]}
                            onValueChange={(v) => setVolume(v[0] / 100)}
                            max={100}
                            step={1}
                            className="h-2"
                          />
                        </div>
                      </div>

                      {/* Playback Speed */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-zinc-400 hover:text-white flex items-center gap-1"
                            title="Playback Speed"
                          >
                            <Gauge className="h-4 w-4" />
                            <span className="text-xs font-bold">{playbackRate}x</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto bg-zinc-900 border-zinc-800 text-white p-2">
                          <div className="flex flex-col gap-1">
                            {playbackRates.map((rate) => (
                              <button
                                key={rate}
                                onClick={() => setPlaybackRate(rate)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
            )}
          </div>
        </div>
      </main>
      </div>
    </PublicLayout>
  );
}
