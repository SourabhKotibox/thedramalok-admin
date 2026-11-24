import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, ImageIcon, Upload as UploadIcon, X, Music2, Link2, Library, Loader2,
  CheckCircle2, AlertCircle, Star, Flame, Sparkles, Crown, Clock3, Save, Eye, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import MediaPicker from "@/components/MediaPicker";
import {
  useCreateStory, useUpdateStory, useGetStoryById, useGetGenres, useGetLanguagesList,
  useGetCategoriesList, useGetAllMediaFiles, getImageUrl, uploadStoryAsset,
} from "@/lib/api-client";
import {
  refId, probeAudioDuration, formatStoryDuration, formatClock, STATUS_META,
} from "@/components/stories/story-utils";
import { cn } from "@/lib/utils";

const MAX_AUDIO_MB = 300;
const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|oga|opus)$/i;

type Errors = Partial<Record<"title" | "author" | "audio" | "duration" | "description" | "slug" | "thumbnail", string>>;

const slugify = (v: string) =>
  v.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

export default function StoryForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const storyQuery = useGetStoryById(isEdit ? id! : "");
  const story = (storyQuery.data as any)?.data;

  const { data: genresData } = useGetGenres({ page: 1, limit: 100 });
  const genresList: any[] = (genresData as any)?.data || [];
  const { data: languagesData } = useGetLanguagesList();
  const languagesList: any[] = (languagesData as any)?.data || [];
  const { data: categoriesData } = useGetCategoriesList({ limit: 100 });
  const categoriesList: any[] = (categoriesData as any)?.data || [];

  const createMutation = useCreateStory();
  const updateMutation = useUpdateStory();
  const saving = createMutation.isPending || updateMutation.isPending;

  // ── form state ──
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [narrator, setNarrator] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [thumbnail, setThumbnail] = useState({ filePath: "", preview: "" });
  const [banner, setBanner] = useState({ filePath: "", preview: "" });
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState("");
  const [audioName, setAudioName] = useState("");
  const [duration, setDuration] = useState("");
  const [planRequired, setPlanRequired] = useState("free");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [isNewContent, setIsNewContent] = useState(true);
  const [isExclusive, setIsExclusive] = useState(false);
  const [ageRating, setAgeRating] = useState("0");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState<null | "thumbnail" | "banner">(null);
  const [audioLibraryOpen, setAudioLibraryOpen] = useState(false);
  const [audioMode, setAudioMode] = useState<"upload" | "url">("upload");
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [audioDurationSec, setAudioDurationSec] = useState(0);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!story) return;
    setTitle(story.title || "");
    setAuthor(story.author || "");
    setNarrator(story.narrator || "");
    setCategory(story.category || "");
    setDescription(story.description || "");
    setShortDescription(story.shortDescription || "");
    setTagsText((story.tags || []).join(", "));
    const thumb = story.thumbnail || story.coverImage || "";
    setThumbnail({ filePath: thumb, preview: thumb ? getImageUrl(thumb) : "" });
    setBanner({ filePath: story.bannerImage || "", preview: story.bannerImage ? getImageUrl(story.bannerImage) : "" });
    setAudioUrl(story.audioUrl || "");
    setAudioFile(story.audioFile || "");
    setAudioName("");
    setAudioMode(story.audioFile ? "upload" : story.audioUrl ? "url" : "upload");
    setDuration(story.duration ? String(story.duration) : "");
    setPlanRequired(story.planRequired || "free");
    setStatus(story.status || "draft");
    setFeatured(!!story.featured);
    setTrending(!!story.trending);
    setIsNewContent(!!story.isNewContent);
    setIsExclusive(!!story.isExclusive);
    setAgeRating(String(story.ageRating ?? 0));
    setSelectedGenres((story.genres || []).map(refId).filter(Boolean));
    setSelectedLanguages((story.languages || []).map(refId).filter(Boolean));
    setSelectedCategories((story.categories || []).map(refId).filter(Boolean));
    setMetaTitle(story.metaTitle || "");
    setMetaDescription(story.metaDescription || "");
    setSlug(story.slug || "");
    setSlugTouched(!!story.slug);
    setDirty(false);
  }, [story]);

  // Auto slug from title until edited manually.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const audioSrc = audioUrl ? getImageUrl(audioUrl) : audioFile ? getImageUrl(audioFile) : "";

  // Probe audio length whenever the source changes.
  useEffect(() => {
    let cancelled = false;
    setAudioDurationSec(0);
    if (!audioSrc) return;
    probeAudioDuration(audioSrc).then((sec) => {
      if (cancelled || !sec) return;
      setAudioDurationSec(sec);
      setDuration((cur) => (cur ? cur : String(Math.max(1, Math.round(sec / 60)))));
    });
    return () => {
      cancelled = true;
    };
  }, [audioSrc]);

  const mark = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
    setDirty(true);
  };

  const handleAudioFile = async (file?: File | null) => {
    if (!file) return;
    if (!(file.type.startsWith("audio/") || AUDIO_EXT.test(file.name))) {
      setErrors((e) => ({ ...e, audio: "Please choose an audio file (mp3, m4a, aac, wav, ogg)." }));
      return;
    }
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, audio: `Audio must be smaller than ${MAX_AUDIO_MB} MB.` }));
      return;
    }
    setErrors((e) => ({ ...e, audio: undefined }));
    setUploadPct(0);
    try {
      const res = await uploadStoryAsset(file, setUploadPct);
      setAudioFile(res.filePath);
      setAudioUrl(res.url);
      setAudioName(res.name || file.name);
      setDuration("");
      setDirty(true);
      toast({ title: "Audio uploaded" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrors((e) => ({
        ...e,
        audio: /invalid file type/i.test(msg)
          ? "The server doesn't accept audio uploads yet — redeploy the API, or paste an audio URL instead."
          : msg,
      }));
    } finally {
      setUploadPct(null);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const clearAudio = () => {
    setAudioUrl("");
    setAudioFile("");
    setAudioName("");
    setDuration("");
    setDirty(true);
  };

  const validate = (targetStatus: string): Errors => {
    const e: Errors = {};
    if (!title.trim()) e.title = "Title is required.";
    else if (title.trim().length > 150) e.title = "Keep the title under 150 characters.";
    if (!author.trim()) e.author = "Author is required.";
    if (!audioUrl.trim() && !audioFile.trim()) e.audio = "Add the story audio (upload a file or paste a URL).";
    else if (audioMode === "url" && audioUrl && !audioFile && !isHttpUrl(audioUrl) && !audioUrl.startsWith("/uploads/"))
      e.audio = "Enter a valid http(s) audio URL.";
    if (duration && (!Number.isFinite(Number(duration)) || Number(duration) <= 0)) e.duration = "Duration must be a positive number of minutes.";
    if (description.length > 5000) e.description = "Description is too long (max 5000 characters).";
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) e.slug = "Use lowercase letters, numbers and dashes only.";
    if (targetStatus === "published" && !thumbnail.filePath) e.thumbnail = "Add a cover image before publishing.";
    return e;
  };

  const submit = async (overrideStatus?: string) => {
    const nextStatus = overrideStatus || status;
    const e = validate(nextStatus);
    setErrors(e);
    if (Object.keys(e).length) {
      toast({ title: "Please fix the highlighted fields", description: Object.values(e)[0], variant: "destructive" });
      const first = document.querySelector("[data-invalid='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (overrideStatus) setStatus(overrideStatus);
    const payload: Record<string, unknown> = {
      title: title.trim(),
      author: author.trim(),
      narrator: narrator.trim(),
      category: category.trim(),
      description: description.trim(),
      shortDescription: shortDescription.trim(),
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      thumbnail: thumbnail.filePath,
      coverImage: thumbnail.filePath,
      bannerImage: banner.filePath,
      audioUrl: audioUrl.trim() || getImageUrl(audioFile),
      audioFile: audioFile.trim(),
      duration: duration ? Number(duration) : undefined,
      planRequired,
      status: nextStatus,
      featured,
      trending,
      isNewContent,
      isExclusive,
      ageRating: Number(ageRating) || 0,
      genres: selectedGenres,
      languages: selectedLanguages,
      categories: selectedCategories,
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      slug: slug.trim(),
    };

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data: payload });
        toast({ title: "Story saved", description: nextStatus === "published" ? "Changes are live on the website." : undefined });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: nextStatus === "published" ? "Story published 🎧" : "Draft saved" });
      }
      setDirty(false);
      setLocation("/admin/stories");
    } catch (err) {
      toast({
        title: "Couldn't save the story",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    submit();
  };

  const goBack = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setLocation("/admin/stories");
  };

  if (isEdit && storyQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-[520px] w-full" />
          <Skeleton className="h-[520px] w-full" />
        </div>
      </div>
    );
  }

  if (isEdit && (storyQuery.isError || (!storyQuery.isLoading && !story))) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-primary mb-3" />
        <h2 className="font-semibold text-foreground">Story not found</h2>
        <p className="text-sm text-muted-foreground mt-1">It may have been deleted.</p>
        <Button className="mt-5 bg-primary text-white" onClick={() => setLocation("/admin/stories")}>Back to stories</Button>
      </div>
    );
  }

  const statusMeta = STATUS_META[status] || STATUS_META.draft;

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button type="button" variant="outline" size="icon" onClick={goBack} className="bg-card border-border shrink-0" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Stories / {isEdit ? "Edit" : "New"}</p>
            <h1 className="truncate text-xl font-bold text-foreground">{isEdit ? title || "Edit story" : "New story"}</h1>
          </div>
          <span className={cn("hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold", statusMeta.className)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)} /> {statusMeta.label}
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          {isEdit && (
            <Button type="button" variant="outline" className="gap-2 bg-card border-border" onClick={() => setLocation(`/admin/stories/${id}`)}>
              <Eye className="h-4 w-4" /> Preview
            </Button>
          )}
          <Button type="button" variant="outline" className="bg-card border-border" disabled={saving} onClick={() => submit("draft")}>
            {isEdit && status === "published" ? "Unpublish" : "Save draft"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => submit("published")} className="gap-2 bg-primary text-white hover:bg-primary/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit && status === "published" ? "Save changes" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── main column ── */}
        <div className="space-y-6 min-w-0">
          <Section title="Story details" subtitle="What listeners see on the story page.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Title" required error={errors.title} className="md:col-span-2">
                <Input value={title} maxLength={150} onChange={(e) => mark(setTitle)(e.target.value)} placeholder="e.g. The Haunted Haveli" className="bg-background border-border h-11 text-base" />
              </Field>
              <Field label="Author" required error={errors.author}>
                <Input value={author} onChange={(e) => mark(setAuthor)(e.target.value)} placeholder="Writer's name" className="bg-background border-border" />
              </Field>
              <Field label="Narrator">
                <Input value={narrator} onChange={(e) => mark(setNarrator)(e.target.value)} placeholder="Voice artist" className="bg-background border-border" />
              </Field>
              <Field label="Tagline" hint={`${shortDescription.length}/160`} className="md:col-span-2">
                <Input value={shortDescription} maxLength={160} onChange={(e) => mark(setShortDescription)(e.target.value)} placeholder="One line hook shown on cards and in the story viewer" className="bg-background border-border" />
              </Field>
              <Field label="Description" error={errors.description} hint={`${description.length}/5000`} className="md:col-span-2">
                <Textarea value={description} onChange={(e) => mark(setDescription)(e.target.value)} placeholder="Synopsis of the story…" className="bg-background border-border min-h-[130px]" />
              </Field>
            </div>
          </Section>

          <Section title="Audio" subtitle="Upload the narration or link to a hosted audio file." error={errors.audio}>
            <div data-invalid={!!errors.audio} className="space-y-4">
              {audioSrc ? (
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Music2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{audioName || decodeURIComponent((audioFile || audioUrl).split("/").pop() || "Audio")}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {audioDurationSec ? `Length ${formatClock(audioDurationSec)}` : "Ready"}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={clearAudio} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4 mr-1" /> Replace
                    </Button>
                  </div>
                  <audio key={audioSrc} src={audioSrc} controls preload="metadata" className="mt-3 w-full h-10" />
                </div>
              ) : (
                <>
                  <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
                    {(["upload", "url"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAudioMode(m)}
                        className={cn("rounded-md px-3 py-1.5 text-xs font-semibold", audioMode === m ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
                      >
                        {m === "upload" ? "Upload file" : "Paste URL"}
                      </button>
                    ))}
                  </div>
                  {audioMode === "upload" ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleAudioFile(e.dataTransfer.files?.[0]);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                        errors.audio ? "border-destructive/60 bg-destructive/5" : "border-border bg-background hover:border-primary/50"
                      )}
                    >
                      {uploadPct !== null ? (
                        <div className="w-full max-w-sm space-y-2">
                          <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Uploading… {uploadPct}%
                          </p>
                          <Progress value={uploadPct} className="h-2" />
                        </div>
                      ) : (
                        <>
                          <UploadIcon className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-foreground font-medium">Drag & drop audio here</p>
                          <p className="text-xs text-muted-foreground">MP3, M4A, AAC, WAV or OGG · up to {MAX_AUDIO_MB} MB</p>
                          <div className="mt-2 flex flex-wrap justify-center gap-2">
                            <Button type="button" size="sm" className="bg-primary text-white" onClick={() => audioInputRef.current?.click()}>
                              Choose file
                            </Button>
                            <Button type="button" size="sm" variant="outline" className="gap-1 bg-card border-border" onClick={() => setAudioLibraryOpen(true)}>
                              <Library className="h-3.5 w-3.5" /> From library
                            </Button>
                          </div>
                        </>
                      )}
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.opus"
                        className="hidden"
                        onChange={(e) => handleAudioFile(e.target.files?.[0])}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={audioUrl}
                        onChange={(e) => {
                          mark(setAudioUrl)(e.target.value);
                          setAudioFile("");
                        }}
                        placeholder="https://cdn.example.com/story.mp3"
                        className="pl-9 bg-background border-border"
                      />
                    </div>
                  )}
                </>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Duration (minutes)" error={errors.duration} hint={audioDurationSec ? "Auto-filled from the audio" : undefined}>
                  <div className="relative">
                    <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" min={0} step="1" value={duration} onChange={(e) => mark(setDuration)(e.target.value)} placeholder="e.g. 42" className="pl-9 bg-background border-border" />
                  </div>
                </Field>
                <div className="flex items-end">
                  <p className="text-xs text-muted-foreground pb-2.5">
                    {duration && Number(duration) > 0 ? `Shown as “${formatStoryDuration(Number(duration))}” on the website.` : "Leave empty to detect it from the audio."}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Classification" subtitle="Helps listeners discover the story.">
            <div className="space-y-5">
              <ChipGroup label="Genres" items={genresList} selected={selectedGenres} onToggle={(v) => toggleIn(setSelectedGenres, v)} empty="No genres yet — add them under Genres." />
              <ChipGroup label="Languages" items={languagesList} selected={selectedLanguages} onToggle={(v) => toggleIn(setSelectedLanguages, v)} empty="No languages configured." />
              <ChipGroup label="Categories" items={categoriesList} selected={selectedCategories} onToggle={(v) => toggleIn(setSelectedCategories, v)} empty="No categories configured." />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Category label" hint="Free text, e.g. Horror">
                  <Input value={category} onChange={(e) => mark(setCategory)(e.target.value)} placeholder="Horror, Romance, Thriller…" className="bg-background border-border" />
                </Field>
                <Field label="Tags" hint="Comma separated">
                  <Input value={tagsText} onChange={(e) => mark(setTagsText)(e.target.value)} placeholder="ghost, village, mystery" className="bg-background border-border" />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="SEO" subtitle="Optional. Used for search engines and link previews.">
            <div className="grid gap-5">
              <Field label="Meta title" hint={`${metaTitle.length}/70`}>
                <Input value={metaTitle} maxLength={70} onChange={(e) => mark(setMetaTitle)(e.target.value)} placeholder={title || "Defaults to the story title"} className="bg-background border-border" />
              </Field>
              <Field label="Meta description" hint={`${metaDescription.length}/160`}>
                <Textarea value={metaDescription} maxLength={160} onChange={(e) => mark(setMetaDescription)(e.target.value)} placeholder={shortDescription || "Defaults to the tagline"} className="bg-background border-border min-h-[80px]" />
              </Field>
              <Field label="Slug" error={errors.slug}>
                <div className="flex gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      mark(setSlug)(e.target.value.toLowerCase());
                    }}
                    placeholder="the-haunted-haveli"
                    className="bg-background border-border font-mono text-sm"
                  />
                  <Button type="button" variant="outline" size="icon" className="shrink-0 bg-card border-border" title="Generate from title" onClick={() => { setSlugTouched(false); setSlug(slugify(title)); setDirty(true); }}>
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
              </Field>
            </div>
          </Section>
        </div>

        {/* ── sidebar ── */}
        <div className="space-y-6 lg:sticky lg:top-4 self-start">
          <Section title="Publishing">
            <div className="space-y-4">
              <Field label="Status">
                <Select value={status} onValueChange={mark(setStatus)}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <span className="inline-flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", v.dot)} />{v.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Access">
                  <Select value={planRequired} onValueChange={mark(setPlanRequired)}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Age rating">
                  <Select value={ageRating} onValueChange={mark(setAgeRating)}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {["0", "7", "13", "16", "18"].map((a) => (
                        <SelectItem key={a} value={a}>{a === "0" ? "All ages" : `${a}+`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="divide-y divide-border rounded-lg border border-border bg-background">
                <ToggleRow icon={Star} tone="text-amber-500" label="Featured" hint="Hero & story rings" checked={featured} onChange={mark(setFeatured)} />
                <ToggleRow icon={Flame} tone="text-orange-500" label="Trending" hint="Trending row" checked={trending} onChange={mark(setTrending)} />
                <ToggleRow icon={Sparkles} tone="text-primary" label="New" hint="Shows a NEW badge" checked={isNewContent} onChange={mark(setIsNewContent)} />
                <ToggleRow icon={Crown} tone="text-violet-500" label="Exclusive" hint="Exclusive badge" checked={isExclusive} onChange={mark(setIsExclusive)} />
              </div>
            </div>
          </Section>

          <Section title="Artwork" error={errors.thumbnail}>
            <div className="space-y-4" data-invalid={!!errors.thumbnail}>
              <ArtworkBox
                label="Cover (portrait 2:3)"
                aspect="aspect-[2/3] max-w-[200px]"
                preview={thumbnail.preview}
                onPick={() => setPicker("thumbnail")}
                onClear={() => { setThumbnail({ filePath: "", preview: "" }); setDirty(true); }}
                invalid={!!errors.thumbnail}
              />
              <ArtworkBox
                label="Banner (landscape 16:9, optional)"
                aspect="aspect-video"
                preview={banner.preview}
                onPick={() => setPicker("banner")}
                onClear={() => { setBanner({ filePath: "", preview: "" }); setDirty(true); }}
              />
            </div>
          </Section>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <Button type="button" variant="outline" className="flex-1 bg-card border-border" disabled={saving} onClick={() => submit("draft")}>
          {isEdit && status === "published" ? "Unpublish" : "Save draft"}
        </Button>
        <Button type="button" className="flex-1 gap-2 bg-primary text-white" disabled={saving} onClick={() => submit("published")}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {isEdit && status === "published" ? "Save changes" : "Publish"}
        </Button>
      </div>

      <MediaPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        accept="image/*"
        source="stories"
        onSelect={(file: any) => {
          const filePath = file?.filePath || file?.url || "";
          const value = { filePath, preview: file?.url || getImageUrl(filePath) };
          if (picker === "thumbnail") {
            setThumbnail(value);
            setErrors((e) => ({ ...e, thumbnail: undefined }));
          } else if (picker === "banner") setBanner(value);
          setDirty(true);
        }}
      />

      <AudioLibraryDialog
        open={audioLibraryOpen}
        onClose={() => setAudioLibraryOpen(false)}
        onSelect={(f) => {
          setAudioFile(f.filePath);
          setAudioUrl(getImageUrl(f.filePath));
          setAudioName(f.name);
          setDuration("");
          setErrors((e) => ({ ...e, audio: undefined }));
          setDirty(true);
          setAudioLibraryOpen(false);
        }}
      />
    </form>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

function Section({ title, subtitle, error, children }: { title: string; subtitle?: string; error?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 sm:p-6", error ? "border-destructive/60" : "border-border")}>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, error, hint, className, children }: { label: string; required?: boolean; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)} data-invalid={!!error}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-foreground text-sm">
          {label} {required && <span className="text-primary">*</span>}
        </Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className={cn(error && "[&_input]:border-destructive [&_textarea]:border-destructive")}>{children}</div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ChipGroup({ label, items, selected, onToggle, empty }: { label: string; items: any[]; selected: string[]; onToggle: (id: string) => void; empty: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground text-sm">
        {label} {selected.length > 0 && <span className="text-xs text-muted-foreground">({selected.length})</span>}
      </Label>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item: any) => {
            const id = item._id || item.id;
            const on = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  on ? "border-primary bg-primary text-white" : "border-border bg-background text-foreground hover:border-primary/60"
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToggleRow({ icon: Icon, tone, label, hint, checked, onChange }: { icon: any; tone: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
      <Icon className={cn("h-4 w-4", tone)} />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="data-[state=unchecked]:bg-muted" />
    </label>
  );
}

function ArtworkBox({ label, aspect, preview, onPick, onClear, invalid }: { label: string; aspect: string; preview: string; onPick: () => void; onClear: () => void; invalid?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <div
        role="button"
        tabIndex={0}
        onClick={onPick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick()}
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border-2 border-dashed bg-background transition-colors cursor-pointer",
          aspect,
          invalid ? "border-destructive/60" : "border-border hover:border-primary/60"
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-black">Change</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">Upload or choose</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AudioLibraryDialog({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (f: { filePath: string; name: string }) => void }) {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useGetAllMediaFiles({ page: 1, limit: 100, fileType: "audio", search: search || undefined });
  const files: any[] = useMemo(() => ((data as any)?.data || []).filter((f: any) => /audio|mpeg|ogg|wav|aac|mp4a/i.test(f.fileType || "") || AUDIO_EXT.test(f.name || "")), [data]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose audio from library</DialogTitle>
        </DialogHeader>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audio files…" className="bg-background border-border" />
        <div className="max-h-[50vh] overflow-y-auto space-y-1.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive">Couldn't load the media library.</p>
          ) : files.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No audio files in the library yet. Upload one instead.</p>
          ) : (
            files.map((f) => (
              <button
                key={f._id || f.id || f.filePath}
                type="button"
                onClick={() => onSelect({ filePath: f.filePath || f.url, name: f.name })}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-2.5 text-left hover:border-primary/60"
              >
                <Music2 className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate text-sm text-foreground">{f.name}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
