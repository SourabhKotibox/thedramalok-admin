import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useGetWebBrowse, useGetGenres } from "@/lib/api-client";
import { PortraitCard } from "@/components/ContentCard";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";

export default function MoviesPublicPage() {
  const [, setLocation] = useLocation();
  const [activeGenre, setActiveGenre] = useState("All");
  const [page, setPage] = useState(1);
  const [plansModalOpen, setPlansModalOpen] = useState(false);

  const { data: browseData, isLoading } = useGetWebBrowse({
    type: "movie",
    genre: activeGenre === "All" ? undefined : activeGenre,
    page,
    limit: 30,
  });

  const { data: genresData } = useGetGenres({ limit: 50 });
  const genres = ["All", ...((genresData?.data || []).map((g: any) => g.name).filter(Boolean))];
  const items = browseData?.items || [];
  const pagination = browseData?.pagination;

  const handlePlay = (item: any) => {
    const id = item.id || item._id;
    setLocation("/movie/" + id);
  };

  return (
    <PublicLayout onSignIn={() => setLocation("/login")} onSubscribeClick={() => setPlansModalOpen(true)}>
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-8 lg:px-12">
        <div className="mb-6">
          <h1 className="text-white font-bold text-3xl tracking-tight">Movies</h1>
          <p className="text-white/60 text-sm mt-1">
            {isLoading ? "Loading..." : (pagination?.total || 0) + " movies available"}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: "none" }}>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => { setActiveGenre(g); setPage(1); }}
              className={"flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border " +
                (activeGenre === g
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-transparent border-white/20 text-white/70 hover:text-white hover:border-white/50")}
            >
              {g}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-white/60 font-semibold text-lg">No movies found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {items.map((item: any) => (
              <PortraitCard key={item.id || item._id} item={item} onClick={() => handlePlay(item)} fullWidth />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-5 py-2 rounded-xl border border-white/20 text-white hover:border-white/50 disabled:opacity-30 text-sm font-semibold">Prev</button>
            <span className="text-white/60 text-sm">{page} / {pagination.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              className="px-5 py-2 rounded-xl border border-white/20 text-white hover:border-white/50 disabled:opacity-30 text-sm font-semibold">Next</button>
          </div>
        )}
      </div>
      <SubscriptionPlansModal isOpen={plansModalOpen} onClose={() => setPlansModalOpen(false)} />
    </PublicLayout>
  );
}
