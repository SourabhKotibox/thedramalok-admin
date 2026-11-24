import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, Edit2, Trash2, Loader2, Headphones, Heart, Share2, Clock3, User, Mic,
  Star, Flame, Crown, Sparkles, AlertCircle, ExternalLink, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useGetStoryById, useDeleteStory, useUpdateStoryStatus } from "@/lib/api-client";
import {
  type Story, storyCover, storyBackdrop, storyAudioSrc, refName, formatStoryDuration,
  formatCount, STATUS_META, PLAN_META,
} from "@/components/stories/story-utils";
import { cn } from "@/lib/utils";

export default function StoryDetail() {
  const [, params] = useRoute("/admin/stories/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = (params as any)?.id as string | undefined;

  const { data, isLoading, isError } = useGetStoryById(id || "");
  const story = (data as any)?.data as Story | undefined;
  const statusMutation = useUpdateStoryStatus();
  const deleteMutation = useDeleteStory();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !story || !id) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-primary mb-3" />
        <h2 className="font-semibold text-foreground">Story not found</h2>
        <Button className="mt-5 bg-primary text-white" onClick={() => setLocation("/admin/stories")}>Back to stories</Button>
      </div>
    );
  }

  const status = STATUS_META[story.status] || STATUS_META.draft;
  const plan = PLAN_META[story.planRequired || "free"] || PLAN_META.free;
  const audio = storyAudioSrc(story);
  const backdrop = storyBackdrop(story);
  const cover = storyCover(story);
  const isLive = story.status === "published";

  const togglePublish = async () => {
    setStatusBusy(true);
    try {
      await statusMutation.mutateAsync({ id, data: { status: isLive ? "draft" : "published" } });
      toast({ title: isLive ? "Moved to drafts" : "Story is live" });
    } catch (e) {
      toast({ title: "Couldn't update status", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setStatusBusy(false);
    }
  };

  const remove = async () => {
    setConfirmOpen(false);
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: `Deleted “${story.title}”` });
      setLocation("/admin/stories");
    } catch (e) {
      toast({ title: "Delete failed", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  const genres = (story.genres || []).map(refName).filter(Boolean);
  const languages = (story.languages || []).map(refName).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" className="gap-2 px-2 text-muted-foreground hover:text-foreground" onClick={() => setLocation("/admin/stories")}>
          <ArrowLeft className="h-4 w-4" /> Stories
        </Button>
        <div className="flex items-center gap-2">
          {isLive && (
            <Button variant="outline" className="gap-2 bg-card border-border" onClick={() => window.open(`/story/${id}`, "_blank")}>
              <Globe className="h-4 w-4" /> View on site <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          <Button variant="outline" className="gap-2 bg-card border-border" onClick={() => setLocation(`/admin/stories/${id}/edit`)}>
            <Edit2 className="h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" size="icon" className="bg-card border-border text-destructive hover:text-destructive" onClick={() => setConfirmOpen(true)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {backdrop && <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 blur-sm scale-110" />}
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/40" />
        <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:p-8">
          <div className="mx-auto w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-muted shadow-2xl sm:mx-0 sm:w-48 aspect-[2/3]">
            {cover ? <img src={cover} alt={story.title} className="h-full w-full object-cover" /> : (
              <div className="flex h-full items-center justify-center"><Headphones className="h-10 w-10 text-muted-foreground" /></div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold", status.className)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} /> {status.label}
              </span>
              <span className={cn("rounded-md border px-2 py-0.5 text-xs font-semibold", plan.className)}>{plan.label}</span>
              {story.featured && <Badge icon={Star} label="Featured" className="text-amber-500 border-amber-500/30 bg-amber-500/10" />}
              {story.trending && <Badge icon={Flame} label="Trending" className="text-orange-500 border-orange-500/30 bg-orange-500/10" />}
              {story.isNewContent && <Badge icon={Sparkles} label="New" className="text-primary border-primary/30 bg-primary/10" />}
              {story.isExclusive && <Badge icon={Crown} label="Exclusive" className="text-violet-500 border-violet-500/30 bg-violet-500/10" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{story.title}</h1>
              {story.shortDescription && <p className="mt-1 text-muted-foreground">{story.shortDescription}</p>}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {story.author && <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {story.author}</span>}
              {story.narrator && <span className="inline-flex items-center gap-1.5"><Mic className="h-4 w-4" /> {story.narrator}</span>}
              {formatStoryDuration(story.duration) && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {formatStoryDuration(story.duration)}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background/60 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                {statusBusy ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
                  <Switch checked={isLive} onCheckedChange={togglePublish} className="data-[state=unchecked]:bg-muted" />
                )}
                {isLive ? "Live on website" : "Hidden from website"}
              </label>
              <div className="ml-auto flex gap-5 text-sm">
                <Stat icon={Headphones} value={formatCount(story.views)} label="listens" />
                <Stat icon={Heart} value={formatCount(story.likes)} label="likes" />
                <Stat icon={Share2} value={formatCount((story as any).shares)} label="shares" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6 min-w-0">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">Audio</h2>
            {audio ? (
              <audio src={audio} controls preload="metadata" className="w-full" />
            ) : (
              <p className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> No audio attached — the story can't be played.</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{story.description || "No description yet."}</p>
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 self-start">
          <Meta label="Genres" value={genres.join(", ")} />
          <Meta label="Languages" value={languages.join(", ")} />
          <Meta label="Category" value={story.category} />
          <Meta label="Tags" value={(story.tags || []).join(", ")} />
          <Meta label="Slug" value={story.slug} mono />
          <Meta label="Created" value={story.createdAt ? new Date(story.createdAt).toLocaleString() : ""} />
          <Meta label="Updated" value={story.updatedAt ? new Date(story.updatedAt).toLocaleString() : ""} />
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>“{story.title}” will be removed everywhere. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-card border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">Delete story</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Badge({ icon: Icon, label, className }: { icon: any; label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold", className)}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function Stat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-4 w-4" /> <span className="font-semibold text-foreground tabular-nums">{value}</span> {label}
    </span>
  );
}

function Meta({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm text-foreground break-words", mono && "font-mono text-xs")}>{value || "—"}</p>
    </div>
  );
}
