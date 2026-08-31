import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader2, Mic, Play, Pause, Clock, User, Headphones } from "lucide-react";
import { useGetStoryById, getImageUrl } from "@/lib/api-client";

export default function StoryDetail() {
  const [, params] = useRoute("/admin/stories/:id");
  const [, setLocation] = useLocation();
  const id = (params as any)?.id;

  const { data, isLoading } = useGetStoryById(id || "");
  const story = (data as any)?.data;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Story not found</p>
      </div>
    );
  }

  const audioSrc = story.audioUrl || story.audioFile;
  const storyDuration = story.duration || duration;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen text-foreground" style={{ background: "#0c0c14" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => setLocation("/admin/stories")}
          className="text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          ← Back to Stories
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <div className="w-48 h-72 rounded-xl overflow-hidden bg-muted">
              {story.thumbnail ? (
                <img
                  src={getImageUrl(story.thumbnail)}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Mic className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold">{story.title}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {story.author && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{story.author}</span>
                </div>
              )}
              {story.narrator && (
                <div className="flex items-center gap-1">
                  <Headphones className="h-4 w-4" />
                  <span>Narrated by {story.narrator}</span>
                </div>
              )}
              {story.category && (
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    {story.category}
                  </span>
                </div>
              )}
              {storyDuration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(storyDuration)}</span>
                </div>
              )}
            </div>

            {story.description && (
              <p className="text-muted-foreground leading-relaxed">{story.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {(story.genres || []).map((g: any) => (
                <span
                  key={g._id || g}
                  className="px-3 py-1 rounded-full text-xs bg-primary/20 text-primary"
                >
                  {g.name || g}
                </span>
              ))}
            </div>

            {audioSrc && (
              <div className="mt-8 bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Audio Player
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(currentTime / (storyDuration || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(storyDuration || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <audio
                    src={audioSrc}
                    onTimeUpdate={(e) => setCurrentTime((e.target as any).currentTime)}
                    onLoadedMetadata={(e) => setDuration((e.target as any).duration)}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
