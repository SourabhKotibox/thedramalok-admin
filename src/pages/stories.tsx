import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Edit2, Eye, Trash2, Search, Plus, Download,
  SlidersHorizontal, ImageIcon, Loader2, Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  useGetStories,
  useDeleteStory,
  useToggleStoryFeatured,
  useToggleStoryTrending,
  useUpdateStoryStatus,
  useGetLanguagesList,
} from "@/lib/api-client";
import { getImageUrl } from "@/lib/api-client";

type StoryRow = {
  id: string;
  title: string;
  thumbnail?: string;
  author?: string;
  narrator?: string;
  genres: Array<{ name: string }>;
  views: number;
  likes: number;
  planRequired: string;
  languages: Array<{ name: string }>;
  status: string;
  featured: boolean;
  trending: boolean;
  category?: string;
};

const ACCESS_BADGE: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-green-500/20 text-green-400" },
  basic: { label: "Basic", className: "bg-primary/20 text-blue-400" },
  standard: { label: "Standard", className: "bg-purple-500/20 text-purple-400" },
  premium: { label: "Premium", className: "bg-amber-500/20 text-amber-400" },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  published: { label: "Published", className: "bg-green-500/20 text-green-400" },
  draft: { label: "Draft", className: "bg-zinc-500/20 text-foreground/70" },
  processing: { label: "Processing", className: "bg-primary/20 text-blue-400" },
  moderation: { label: "Moderation", className: "bg-amber-500/20 text-amber-400" },
  rejected: { label: "Rejected", className: "bg-primary/20 text-primary" },
};

export default function StoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("action");
  const [confirmDelete, setConfirmDelete] = useState<StoryRow | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [planFilter, setPlanFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [trendingFilter, setTrendingFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: langsData } = useGetLanguagesList();
  const languagesList = langsData?.data || [];

  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter, planFilter, langFilter, featuredFilter, trendingFilter, categoryFilter]);

  const isAnyFilterActive =
    planFilter !== "all" ||
    langFilter !== "all" ||
    featuredFilter !== "all" ||
    trendingFilter !== "all" ||
    categoryFilter !== "all";

  const handleResetFilters = () => {
    setPlanFilter("all");
    setLangFilter("all");
    setFeaturedFilter("all");
    setTrendingFilter("all");
    setCategoryFilter("all");
  };

  const { data: storiesData, isLoading } = useGetStories({
    page: 1,
    limit: 100,
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const stories = storiesData?.data || [];

  const deleteMutation = useDeleteStory();
  const toggleFeaturedMutation = useToggleStoryFeatured();
  const toggleTrendingMutation = useToggleStoryTrending();
  const updateStatusMutation = useUpdateStoryStatus();

  const filtered = stories.filter((s: StoryRow) => {
    const matchStatus =
      statusFilter === "all" ||
      s.status === statusFilter;

    const matchPlan =
      planFilter === "all" ||
      s.planRequired === planFilter;

    const matchLang =
      langFilter === "all" ||
      s.languages.some((l: any) => l.name === langFilter);

    const matchFeatured =
      featuredFilter === "all" ||
      (featuredFilter === "yes" && s.featured) ||
      (featuredFilter === "no" && !s.featured);

    const matchTrending =
      trendingFilter === "all" ||
      (trendingFilter === "yes" && s.trending) ||
      (trendingFilter === "no" && !s.trending);

    const matchCategory =
      categoryFilter === "all" ||
      s.category === categoryFilter;

    return matchStatus && matchPlan && matchLang && matchFeatured && matchTrending && matchCategory;
  });

  const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  const toggleAll = () =>
    allSelected ? setSelectedIds([]) : setSelectedIds(filtered.map((s) => s.id));

  const toggleOne = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    updateStatusMutation.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: `Story ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!` });
        },
      }
    );
  };

  const handleToggleFeatured = (id: string) => {
    toggleFeaturedMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Featured status updated!" });
      },
    });
  };

  const handleToggleTrending = (id: string) => {
    toggleTrendingMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Trending status updated!" });
      },
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => {
        toast({ title: "Story deleted successfully!" });
        setConfirmDelete(null);
        setSelectedIds((prev) => prev.filter((id) => id !== confirmDelete.id));
      },
    });
  };

  const handleApplyBulk = () => {
    if (bulkAction === "action" || selectedIds.length === 0) {
      toast({ title: "Select items and an action first", variant: "destructive" });
      return;
    }
    if (bulkAction === "delete") {
      setBulkConfirmOpen(true);
      return;
    }
    executeBulkAction();
  };

  const executeBulkAction = async () => {
    try {
      if (bulkAction === "activate") {
        await Promise.all(
          selectedIds.map((id) =>
            updateStatusMutation.mutateAsync({ id, data: { status: "published" } })
          )
        );
        toast({ title: `${selectedIds.length} story(s) published.` });
      } else if (bulkAction === "deactivate") {
        await Promise.all(
          selectedIds.map((id) =>
            updateStatusMutation.mutateAsync({ id, data: { status: "draft" } })
          )
        );
        toast({ title: `${selectedIds.length} story(s) set to draft.` });
      }
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      setBulkAction("action");
    } catch {
      toast({ title: "Action failed. Please try again.", variant: "destructive" });
    }
  };

  const confirmBulkDelete = async () => {
    setBulkConfirmOpen(false);
    try {
      await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      toast({ title: `${selectedIds.length} story(s) deleted successfully.` });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      setBulkAction("action");
    } catch {
      toast({ title: "Bulk delete failed. Please try again.", variant: "destructive" });
    }
  };

  const categories = Array.from(new Set(stories.map((s: any) => s.category).filter(Boolean)));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-foreground font-medium">Stories</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={bulkAction} onValueChange={setBulkAction}>
          <SelectTrigger className="w-36 bg-card border-border text-foreground h-10 rounded-lg text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-foreground">
            <SelectItem value="action">Action</SelectItem>
            <SelectItem value="delete">Delete Selected</SelectItem>
            <SelectItem value="activate">Activate</SelectItem>
            <SelectItem value="deactivate">Deactivate</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleApplyBulk}
          className="bg-primary hover:bg-primary/90 text-white h-10 px-5 rounded-lg font-semibold text-sm"
        >
          Apply
        </Button>

        <div className="flex-1" />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 bg-card border-border text-foreground h-10 rounded-lg text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-foreground">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="moderation">Moderation</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-52 bg-card border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm focus:border-primary"
          />
        </div>

        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="outline"
          className={`bg-card border-border text-foreground h-10 gap-2 rounded-lg text-sm hover:bg-muted transition-all ${
            showAdvanced ? "border-primary text-primary hover:text-primary bg-primary/5" : ""
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced Filter
        </Button>

        <Button
          onClick={() => setLocation("/admin/stories/new")}
          className="bg-primary hover:bg-primary/90 text-white h-10 gap-2 rounded-lg px-5 font-semibold text-sm"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {showAdvanced && (
        <div className="bg-card border border-border p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan</label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full bg-background border-border text-foreground h-10 rounded-lg text-sm">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Language</label>
              <Select value={langFilter} onValueChange={setLangFilter}>
                <SelectTrigger className="w-full bg-background border-border text-foreground h-10 rounded-lg text-sm">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="all">All Languages</SelectItem>
                  {languagesList.map((lang: any) => (
                    <SelectItem key={lang._id || lang.id} value={lang.name}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured</label>
              <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                <SelectTrigger className="w-full bg-background border-border text-foreground h-10 rounded-lg text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trending</label>
              <Select value={trendingFilter} onValueChange={setTrendingFilter}>
                <SelectTrigger className="w-full bg-background border-border text-foreground h-10 rounded-lg text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAnyFilterActive && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Story</TableHead>
              <TableHead>Author / Narrator</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Mic className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No stories found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((story: StoryRow) => (
                <TableRow key={story.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(story.id)}
                      onCheckedChange={() => toggleOne(story.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-8 rounded bg-muted overflow-hidden flex-shrink-0">
                        {story.thumbnail ? (
                          <img
                            src={getImageUrl(story.thumbnail)}
                            alt={story.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[200px]">{story.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {STATUS_BADGE[story.status] && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGE[story.status].className}`}>
                              {STATUS_BADGE[story.status].label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{story.author || '-'}</div>
                    {story.narrator && <div className="text-xs">by {story.narrator}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {story.category || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {story.languages.slice(0, 2).map((lang: any, i: number) => (
                        <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {lang.name}
                        </span>
                      ))}
                      {story.languages.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{story.languages.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${ACCESS_BADGE[story.planRequired]?.className || 'bg-muted text-foreground'}`}>
                      {ACCESS_BADGE[story.planRequired]?.label || story.planRequired}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={story.status === 'published'}
                      onCheckedChange={() => handleToggleStatus(story.id, story.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setLocation(`/admin/stories/${story.id}`)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setLocation(`/admin/stories/${story.id}/edit`)}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleFeatured(story.id)}
                        title={story.featured ? "Remove from Featured" : "Add to Featured"}
                      >
                        <span className={`text-xs ${story.featured ? 'text-amber-400' : 'text-muted-foreground'}`}>★</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleTrending(story.id)}
                        title={story.trending ? "Remove from Trending" : "Add to Trending"}
                      >
                        <span className={`text-xs ${story.trending ? 'text-orange-400' : 'text-muted-foreground'}`}>🔥</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(story)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{confirmDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-card border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Stories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} story(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-card border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
