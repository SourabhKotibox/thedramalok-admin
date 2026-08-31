import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  ImageIcon, Plus, X, Upload as UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import MediaPicker from "@/components/MediaPicker";
import {
  useCreateStory, useUpdateStory, useGetStoryById,
  useGetGenres, useGetLanguagesList, useGetCategoriesList,
  getImageUrl,
} from "@/lib/api-client";

type Tab = "Story Details" | "Audio" | "SEO Settings";

const TABS: Tab[] = ["Story Details", "Audio", "SEO Settings"];

export default function StoryForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<Tab>("Story Details");

  const [thumbnailPickerOpen, setThumbnailPickerOpen] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  const { data: genresData } = useGetGenres({ page: 1, limit: 100 });
  const genresList = (genresData as any)?.data || [];
  const { data: languagesData } = useGetLanguagesList();
  const languagesList = (languagesData as any)?.data || [];
  const { data: categoriesData } = useGetCategoriesList({ limit: 100 });
  const categoriesList = (categoriesData as any)?.data || [];

  const createMutation = useCreateStory();
  const updateMutation = useUpdateStory();

  const { data: storyData } = useGetStoryById(isEdit ? id! : "");
  const story = (storyData as any)?.data;

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [narrator, setNarrator] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [thumbnail, setThumbnail] = useState({ filePath: "", preview: "" });
  const [banner, setBanner] = useState({ filePath: "", preview: "" });
  const [cover, setCover] = useState({ filePath: "", preview: "" });
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState("");
  const [duration, setDuration] = useState("");
  const [planRequired, setPlanRequired] = useState<"free" | "basic" | "standard" | "premium">("free");
  const [status, setStatus] = useState("draft");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (story) {
      setTitle(story.title || "");
      setAuthor(story.author || "");
      setNarrator(story.narrator || "");
      setCategory(story.category || "");
      setDescription(story.description || "");
      setShortDescription(story.shortDescription || "");
      setAudioUrl(story.audioUrl || "");
      setAudioFile(story.audioFile || "");
      setDuration(story.duration ? String(story.duration) : "");
      setPlanRequired(story.planRequired || "free");
      setStatus(story.status || "draft");
      setThumbnail({ filePath: story.thumbnail || "", preview: story.thumbnail ? getImageUrl(story.thumbnail) : "" });
      setBanner({ filePath: story.bannerImage || "", preview: story.bannerImage ? getImageUrl(story.bannerImage) : "" });
      setCover({ filePath: story.coverImage || "", preview: story.coverImage ? getImageUrl(story.coverImage) : "" });
      setSelectedGenres((story.genres || []).map((g: any) => g._id || g));
      setSelectedLanguages((story.languages || []).map((l: any) => l._id || l));
      setSelectedCategories((story.categories || []).map((c: any) => c._id || c));
    }
  }, [story]);

  const toggleGenre = (id: string) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleLanguage = (id: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      title,
      author,
      narrator,
      category,
      description,
      shortDescription,
      thumbnail: thumbnail.filePath,
      bannerImage: banner.filePath,
      coverImage: cover.filePath,
      audioUrl,
      audioFile,
      duration: duration ? Number(duration) : undefined,
      planRequired,
      status,
      genres: selectedGenres,
      languages: selectedLanguages,
      categories: selectedCategories,
    };

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data: payload });
        toast({ title: "Story updated successfully!" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Story created successfully!" });
      }
      setLocation("/admin/stories");
    } catch (err) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className="cursor-pointer hover:text-foreground"
            onClick={() => setLocation("/admin/stories")}
        >
          Stories
        </span>
        <span>/</span>
        <span className="text-foreground font-medium">
          {isEdit ? "Edit Story" : "New Story"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 border-b border-border mb-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Story Details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter story title"
                    className="bg-background border-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Category</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Horror, Romance, Thriller"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Author *</Label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                    className="bg-background border-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Narrator</Label>
                  <Input
                    value={narrator}
                    onChange={(e) => setNarrator(e.target.value)}
                    placeholder="Narrator name"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter story description..."
                  className="bg-background border-border text-foreground min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Short Description</Label>
                <Textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Short tagline or summary"
                  className="bg-background border-border text-foreground min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Genres</Label>
                <div className="flex flex-wrap gap-2">
                  {genresList.map((genre: any) => (
                    <button
                      key={genre._id || genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre._id || genre.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedGenres.includes(genre._id || genre.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {languagesList.map((lang: any) => (
                    <button
                      key={lang._id || lang.id}
                      type="button"
                      onClick={() => toggleLanguage(lang._id || lang.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedLanguages.includes(lang._id || lang.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat: any) => (
                    <button
                      key={cat._id || cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat._id || cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedCategories.includes(cat._id || cat.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Audio" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground">Audio URL *</Label>
                <Input
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://example.com/story.mp3"
                  className="bg-background border-border text-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground">Direct link to the audio file (MP3, M4A, etc.)</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Audio File Path</Label>
                <Input
                  value={audioFile}
                  onChange={(e) => setAudioFile(e.target.value)}
                  placeholder="/uploads/audio/story.mp3"
                  className="bg-background border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">Local path if stored on server</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Duration (seconds)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="3600"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          )}

          {activeTab === "SEO Settings" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground">Meta Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="SEO title"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Meta Description</Label>
                <Textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="SEO description"
                  className="bg-background border-border text-foreground min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Slug</Label>
                <Input
                  value={title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="story-slug"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <Label className="text-foreground mb-4 block">Artwork</Label>
            <div className="flex flex-wrap gap-6">
              <ImageBox
                label="Thumbnail"
                preview={thumbnail.preview}
                onOpen={() => setThumbnailPickerOpen(true)}
              />
              <ImageBox
                label="Banner Image"
                preview={banner.preview}
                onOpen={() => setBannerPickerOpen(true)}
              />
              <ImageBox
                label="Cover Image"
                preview={cover.preview}
                onOpen={() => setCoverPickerOpen(true)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="moderation">Moderation</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Plan Required</Label>
              <Select value={planRequired} onValueChange={(v) => setPlanRequired(v as any)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
          onClick={() => setLocation("/admin/stories")}
            className="bg-card border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? "Update Story" : "Create Story"}
          </Button>
        </div>
      </form>

      <MediaPicker
        open={thumbnailPickerOpen}
        onClose={() => setThumbnailPickerOpen(false)}
        onSelect={(file) => {
          setThumbnail({ filePath: file.path || file.url, preview: file.url });
        }}
        source=""
      />
      <MediaPicker
        open={bannerPickerOpen}
        onClose={() => setBannerPickerOpen(false)}
        onSelect={(file) => {
          setBanner({ filePath: file.path || file.url, preview: file.url });
        }}
        source=""
      />
      <MediaPicker
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(file) => {
          setCover({ filePath: file.path || file.url, preview: file.url });
        }}
        source=""
      />
    </div>
  );
}

function ImageBox({ label, preview, onOpen }: { label: string; preview: string; onOpen: () => void }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div
        onClick={onOpen}
        className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex items-center justify-center cursor-pointer hover:border-primary/40 bg-muted/20 transition-colors overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
