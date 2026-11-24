import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, Search, LayoutGrid, List, Eye, Edit2, Trash2, MoreVertical,
  Headphones, Mic, Star, Flame, GripVertical, ArrowUpDown, X, RefreshCw,
  AlertTriangle, Loader2, ImageIcon, CheckCircle2, FileEdit, Clock3, Sparkles,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useGetStories, useDeleteStory, useToggleStoryFeatured, useToggleStoryTrending,
  useUpdateStoryStatus, useReorderStories,
} from "@/lib/api-client";
import {
  type Story, storyId, storyCover, refName, formatStoryDuration, formatCount,
  STATUS_META, PLAN_META,
} from "@/components/stories/story-utils";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

type StatusTab = "all" | "published" | "draft" | "moderation" | "rejected";
const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "moderation", label: "In review" },
  { value: "rejected", label: "Rejected" },
];

function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

const totalOf = (res: any) => Number(res?.pagination?.total ?? res?.data?.length ?? 0);

export default function StoriesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [view, setView] = useState<"grid" | "table">(
    () => (localStorage.getItem("admin_stories_view") as "grid" | "table") || "grid"
  );
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Story | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [busyIds, setBusyIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("admin_stories_view", view);
  }, [view]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [statusTab, debouncedSearch, planFilter]);

  const listQuery = useGetStories({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusTab === "all" ? undefined : statusTab,
    plan: planFilter === "all" ? undefined : planFilter,
  });

  // Lightweight count queries for the status tabs / stats strip.
  const allCount = useGetStories({ page: 1, limit: 1 });
  const publishedCount = useGetStories({ page: 1, limit: 1, status: "published" });
  const draftCount = useGetStories({ page: 1, limit: 1, status: "draft" });
  const reviewCount = useGetStories({ page: 1, limit: 1, status: "moderation" });
  const rejectedCount = useGetStories({ page: 1, limit: 1, status: "rejected" });
  const featuredCount = useGetStories({ page: 1, limit: 1, featured: "true" });

  const counts: Record<StatusTab, number> = {
    all: totalOf(allCount.data),
    published: totalOf(publishedCount.data),
    draft: totalOf(draftCount.data),
    moderation: totalOf(reviewCount.data),
    rejected: totalOf(rejectedCount.data),
  };

  const deleteMutation = useDeleteStory();
  const featuredMutation = useToggleStoryFeatured();
  const trendingMutation = useToggleStoryTrending();
  const statusMutation = useUpdateStoryStatus();

  const rawStories: Story[] = (listQuery.data as any)?.data || [];
  const stories = useMemo(
    () => rawStories.filter((s) => planFilter === "all" || (s.planRequired || "free") === planFilter),
    [rawStories, planFilter]
  );
  const pagination = (listQuery.data as any)?.pagination;
  const totalPages = Math.max(1, Number(pagination?.pages || 1));
  const hasFilters = statusTab !== "all" || !!debouncedSearch || planFilter !== "all";

  const withBusy = async (id: string, fn: () => Promise<unknown>) => {
    setBusyIds((p) => [...p, id]);
    try {
      await fn();
    } finally {
      setBusyIds((p) => p.filter((x) => x !== id));
    }
  };

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Please try again.");

  const togglePublish = (s: Story) => {
    const id = storyId(s);
    const next = s.status === "published" ? "draft" : "published";
    return withBusy(id, async () => {
      try {
        await statusMutation.mutateAsync({ id, data: { status: next } });
        toast({ title: next === "published" ? `“${s.title}” is live` : `“${s.title}” moved to drafts` });
      } catch (e) {
        toast({ title: "Couldn't update status", description: errMsg(e), variant: "destructive" });
      }
    });
  };

  const toggleFlag = (s: Story, flag: "featured" | "trending") => {
    const id = storyId(s);
    return withBusy(id, async () => {
      try {
        await (flag === "featured" ? featuredMutation : trendingMutation).mutateAsync(id);
        const on = !s[flag];
        toast({ title: `${flag === "featured" ? "Featured" : "Trending"} ${on ? "on" : "off"} for “${s.title}”` });
      } catch (e) {
        toast({ title: "Update failed", description: errMsg(e), variant: "destructive" });
      }
    });
  };

  const handleDelete = async () => {
    const s = confirmDelete;
    setConfirmDelete(null);
    if (!s) return;
    try {
      await deleteMutation.mutateAsync(storyId(s));
      setSelectedIds((p) => p.filter((x) => x !== storyId(s)));
      toast({ title: `Deleted “${s.title}”` });
    } catch (e) {
      toast({ title: "Delete failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const runBulk = async (action: "publish" | "draft" | "delete") => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const results = await Promise.allSettled(
      ids.map((id) =>
        action === "delete"
          ? deleteMutation.mutateAsync(id)
          : statusMutation.mutateAsync({ id, data: { status: action === "publish" ? "published" : "draft" } })
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = ids.length - failed;
    const verb = action === "delete" ? "deleted" : action === "publish" ? "published" : "moved to drafts";
    toast({
      title: `${ok} ${ok === 1 ? "story" : "stories"} ${verb}`,
      description: failed ? `${failed} failed — please retry.` : undefined,
      variant: failed ? "destructive" : "default",
    });
    setSelectedIds([]);
  };

  const allOnPageSelected = stories.length > 0 && stories.every((s) => selectedIds.includes(storyId(s)));
  const toggleAll = () =>
    setSelectedIds(allOnPageSelected ? [] : stories.map((s) => storyId(s)));
  const toggleOne = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const clearFilters = () => {
    setStatusTab("all");
    setSearch("");
    setPlanFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="cursor-pointer hover:text-foreground" onClick={() => setLocation("/admin")}>Dashboard</span>
            <span>/</span>
            <span className="text-foreground font-medium">Stories</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Mic className="h-5 w-5" />
            </span>
            Stories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audio stories shown in the Stories section of the website. Publish, feature and order them here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setReorderOpen(true)}
            className="h-10 gap-2 bg-card border-border text-foreground hover:bg-muted"
          >
            <ArrowUpDown className="h-4 w-4" /> Reorder
          </Button>
          <Button
            onClick={() => setLocation("/admin/stories/new")}
            className="h-10 gap-2 bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            <Plus className="h-4 w-4" /> New story
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Headphones} label="Total stories" value={counts.all} loading={allCount.isLoading} tone="text-primary bg-primary/10" />
        <StatCard icon={CheckCircle2} label="Published" value={counts.published} loading={publishedCount.isLoading} tone="text-emerald-500 bg-emerald-500/10" />
        <StatCard icon={FileEdit} label="Drafts" value={counts.draft} loading={draftCount.isLoading} tone="text-zinc-400 bg-zinc-500/10" />
        <StatCard icon={Star} label="Featured" value={totalOf(featuredCount.data)} loading={featuredCount.isLoading} tone="text-amber-500 bg-amber-500/10" />
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-3 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusTab(t.value)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  statusTab === t.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 text-[11px] font-semibold tabular-nums",
                    statusTab === t.value ? "bg-white/20" : "bg-muted"
                  )}
                >
                  {counts[t.value]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-1 items-center gap-2 lg:justify-end">
            <div className="relative flex-1 lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, author, narrator…"
                className="pl-9 pr-8 h-10 bg-background border-border text-foreground"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-32 h-10 bg-background border-border text-foreground">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:flex rounded-lg border border-border bg-background p-0.5">
              <button
                onClick={() => setView("grid")}
                className={cn("p-2 rounded-md", view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("table")}
                className={cn("p-2 rounded-md", view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk bar */}
        {stories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAll} />
              {selectedIds.length ? `${selectedIds.length} selected` : "Select all on page"}
            </label>
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Button size="sm" variant="outline" className="bg-card border-border" onClick={() => runBulk("publish")}>
                  Publish
                </Button>
                <Button size="sm" variant="outline" className="bg-card border-border" onClick={() => runBulk("draft")}>
                  Move to draft
                </Button>
                <Button size="sm" className="bg-destructive text-white hover:bg-destructive/90" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {listQuery.isLoading ? (
        view === "grid" ? <GridSkeleton /> : <TableSkeleton />
      ) : listQuery.isError ? (
        <StateBox
          icon={AlertTriangle}
          title="Couldn't load stories"
          text={errMsg(listQuery.error)}
          action={
            <Button onClick={() => listQuery.refetch()} className="gap-2 bg-primary text-white hover:bg-primary/90">
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          }
        />
      ) : stories.length === 0 ? (
        hasFilters ? (
          <StateBox
            icon={Search}
            title="No stories match your filters"
            text="Try a different search term, status or plan."
            action={<Button variant="outline" onClick={clearFilters} className="bg-card border-border">Clear filters</Button>}
          />
        ) : (
          <StateBox
            icon={Headphones}
            title="No stories yet"
            text="Create your first audio story. Add artwork, upload the audio and publish it to the website."
            action={
              <Button onClick={() => setLocation("/admin/stories/new")} className="gap-2 bg-primary text-white hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Create a story
              </Button>
            }
          />
        )
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {stories.map((s) => (
            <StoryCard
              key={storyId(s)}
              story={s}
              selected={selectedIds.includes(storyId(s))}
              busy={busyIds.includes(storyId(s))}
              onSelect={() => toggleOne(storyId(s))}
              onOpen={() => setLocation(`/admin/stories/${storyId(s)}`)}
              onEdit={() => setLocation(`/admin/stories/${storyId(s)}/edit`)}
              onTogglePublish={() => togglePublish(s)}
              onToggleFlag={(f) => toggleFlag(s, f)}
              onDelete={() => setConfirmDelete(s)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="w-10 p-3"><Checkbox checked={allOnPageSelected} onCheckedChange={toggleAll} /></th>
                <th className="p-3">Story</th>
                <th className="p-3 hidden md:table-cell">Genres</th>
                <th className="p-3">Plan</th>
                <th className="p-3 hidden sm:table-cell">Listens</th>
                <th className="p-3">Published</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => {
                const id = storyId(s);
                const status = STATUS_META[s.status] || STATUS_META.draft;
                const plan = PLAN_META[s.planRequired || "free"] || PLAN_META.free;
                return (
                  <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="p-3"><Checkbox checked={selectedIds.includes(id)} onCheckedChange={() => toggleOne(id)} /></td>
                    <td className="p-3">
                      <button onClick={() => setLocation(`/admin/stories/${id}`)} className="flex items-center gap-3 text-left">
                        <Thumb story={s} className="h-14 w-10 rounded-md" />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[220px]">{s.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {[s.author, s.narrator && `Narr. ${s.narrator}`].filter(Boolean).join(" · ") || "—"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 text-[10px] font-semibold", status.className)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />{status.label}
                            </span>
                            {s.featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                            {s.trending && <Flame className="h-3 w-3 text-orange-500" />}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">
                      {(s.genres || []).map(refName).filter(Boolean).slice(0, 3).join(", ") || "—"}
                    </td>
                    <td className="p-3">
                      <span className={cn("rounded border px-2 py-0.5 text-[11px] font-semibold", plan.className)}>{plan.label}</span>
                    </td>
                    <td className="p-3 hidden sm:table-cell tabular-nums text-muted-foreground">{formatCount(s.views)}</td>
                    <td className="p-3">
                      <Switch
                        checked={s.status === "published"}
                        disabled={busyIds.includes(id)}
                        onCheckedChange={() => togglePublish(s)}
                        className="data-[state=unchecked]:bg-muted"
                        aria-label="Published"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end">
                        <RowMenu
                          story={s}
                          onOpen={() => setLocation(`/admin/stories/${id}`)}
                          onEdit={() => setLocation(`/admin/stories/${id}/edit`)}
                          onToggleFlag={(f) => toggleFlag(s, f)}
                          onDelete={() => setConfirmDelete(s)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!listQuery.isLoading && !listQuery.isError && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {pagination?.total ?? 0} stories
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-card border-border" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-card border-border" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ReorderDialog open={reorderOpen} onClose={() => setReorderOpen(false)} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirmDelete?.title}” will be removed from the website and apps. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-card border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} {selectedIds.length === 1 ? "story" : "stories"}?</AlertDialogTitle>
            <AlertDialogDescription>The selected stories will be permanently deleted. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-card border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setBulkDeleteOpen(false);
                runBulk("delete");
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

function StatCard({ icon: Icon, label, value, loading, tone }: { icon: any; label: string; value: number; loading?: boolean; tone: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-lg", tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="h-6 w-10 mt-1" /> : <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>}
      </div>
    </div>
  );
}

function Thumb({ story, className }: { story: Story; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = storyCover(story);
  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-muted", className)}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/25 to-muted">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function RowMenu({
  story, onOpen, onEdit, onToggleFlag, onDelete, triggerClassName,
}: {
  story: Story;
  onOpen: () => void;
  onEdit: () => void;
  onToggleFlag: (f: "featured" | "trending") => void;
  onDelete: () => void;
  triggerClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-8 w-8", triggerClassName)} aria-label="Story actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
        <DropdownMenuItem onClick={onOpen}><Eye className="h-4 w-4 mr-2" /> Preview</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}><Edit2 className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleFlag("featured")}>
          <Star className={cn("h-4 w-4 mr-2", story.featured && "fill-amber-500 text-amber-500")} />
          {story.featured ? "Unfeature" : "Feature"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleFlag("trending")}>
          <Flame className={cn("h-4 w-4 mr-2", story.trending && "text-orange-500")} />
          {story.trending ? "Remove trending" : "Mark trending"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StoryCard({
  story, selected, busy, onSelect, onOpen, onEdit, onTogglePublish, onToggleFlag, onDelete,
}: {
  story: Story;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onTogglePublish: () => void;
  onToggleFlag: (f: "featured" | "trending") => void;
  onDelete: () => void;
}) {
  const status = STATUS_META[story.status] || STATUS_META.draft;
  const plan = PLAN_META[story.planRequired || "free"] || PLAN_META.free;
  const duration = formatStoryDuration(story.duration);
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
        selected ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      <div className="relative aspect-[2/3] cursor-pointer" onClick={onOpen}>
        <Thumb story={story} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className={cn("border-white/70 bg-black/40 transition-opacity", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
            aria-label="Select story"
          />
        </div>
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} /> {status.label}
          </span>
          {story.planRequired && story.planRequired !== "free" && (
            <span className="inline-flex items-center rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">{plan.label}</span>
          )}
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2 text-white">
          <div className="flex items-center gap-1">
            {story.featured && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/90" title="Featured">
                <Star className="h-3.5 w-3.5 fill-white" />
              </span>
            )}
            {story.trending && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/90" title="Trending">
                <Flame className="h-3.5 w-3.5" />
              </span>
            )}
            {story.isNewContent && (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-primary/90 px-2 text-[10px] font-bold" title="New">
                <Sparkles className="h-3 w-3" /> NEW
              </span>
            )}
          </div>
          {duration && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
              <Clock3 className="h-3 w-3" /> {duration}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground" title={story.title}>{story.title}</p>
          <p className="truncate text-xs text-muted-foreground">{story.author || story.narrator || "Unknown author"}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Switch
                checked={story.status === "published"}
                onCheckedChange={onTogglePublish}
                className="data-[state=unchecked]:bg-muted"
                aria-label="Published"
              />
            )}
            {story.status === "published" ? "Live" : "Hidden"}
          </label>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit">
              <Edit2 className="h-4 w-4" />
            </Button>
            <RowMenu story={story} onOpen={onOpen} onEdit={onEdit} onToggleFlag={onToggleFlag} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StateBox({ icon: Icon, title, text, action }: { icon: any; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          <Skeleton className="aspect-[2/3] w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-14 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── reorder ───────────────────────── */

function SortableRow({ story, index }: { story: Story; index: number }) {
  const id = storyId(story);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const status = STATUS_META[story.status] || STATUS_META.draft;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-2 pr-3",
        isDragging && "z-10 shadow-xl ring-1 ring-primary"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
        aria-label={`Drag ${story.title}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-6 text-center text-xs font-semibold text-muted-foreground tabular-nums">{index + 1}</span>
      <Thumb story={story} className="h-12 w-9 rounded" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{story.title}</p>
        <p className="truncate text-xs text-muted-foreground">{story.author || "—"}</p>
      </div>
      <span className={cn("hidden sm:inline-flex items-center gap-1 rounded border px-1.5 text-[10px] font-semibold", status.className)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />{status.label}
      </span>
    </div>
  );
}

function ReorderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const query = useGetStories({ page: 1, limit: 100 });
  const reorder = useReorderStories();
  const [items, setItems] = useState<Story[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (open) {
      setItems(((query.data as any)?.data || []) as Story[]);
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((s) => storyId(s) === active.id);
      const to = prev.findIndex((s) => storyId(s) === over.id);
      return arrayMove(prev, from, to);
    });
    setDirty(true);
  };

  const save = async () => {
    try {
      await reorder.mutateAsync(items.map((s) => storyId(s)));
      toast({ title: "Story order saved", description: "The website now shows stories in this order." });
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast({
        title: "Couldn't save order",
        description: /not found|404/i.test(msg)
          ? "The API server needs the latest update (PATCH /stories/reorder). Redeploy the API and try again."
          : msg || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!open) return null;
  const total = Number((query.data as any)?.pagination?.total || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full sm:max-w-xl flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Reorder stories"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Reorder stories</h2>
            <p className="text-sm text-muted-foreground">Drag to set the order used on the website. Top = shown first.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {query.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No stories to order yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((s) => storyId(s))} strategy={verticalListSortingStrategy}>
                {items.map((s, i) => <SortableRow key={storyId(s)} story={s} index={i} />)}
              </SortableContext>
            </DndContext>
          )}
          {total > items.length && (
            <p className="pt-2 text-xs text-muted-foreground">Showing the first {items.length} of {total} stories.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="outline" className="bg-card border-border" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!dirty || reorder.isPending} className="gap-2 bg-primary text-white hover:bg-primary/90">
            {reorder.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save order
          </Button>
        </div>
      </div>
    </div>
  );
}
