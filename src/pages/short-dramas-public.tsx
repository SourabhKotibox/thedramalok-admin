import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Smartphone, Play, Lock, Crown } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useGetWebBrowse } from "@/lib/api-client";
import { PortraitCard } from "@/components/ContentCard";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";

export default function ShortDramasPublicPage() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [plansModalOpen, setPlansModalOpen] = useState(false);

  const { data: browseData, isLoading } = useGetWebBrowse({
    type: "drama",
    page,
    limit: 30,
  });

  const items = browseData?.items || [];
  const pagination = browseData?.pagination;

  const handleSelectDrama = (drama: any) => {
    const id = drama.id || drama._id;
    setLocation(drama.trailerUrl ? `/drama/${id}/episode/0` : `/drama/${id}/episode/1`);
  };

  return (
    <PublicLayout onSignIn={() => setLocation("/login")} onSubscribeClick={() => setPlansModalOpen(true)}>
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-white font-bold text-3xl tracking-tight">Short Drama</h1>
          <p className="text-white/60 text-sm mt-1">
            {isLoading ? "Loading..." : (pagination?.total || 0) + " series · Portrait 9:16 · Episode-based"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-white/60 font-semibold text-lg">No short dramas found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mb-10">
            {items.map((item: any) => (
              <PortraitCard key={item.id || item._id} item={item} onClick={() => handleSelectDrama(item)} fullWidth aspectRatio="9/16" />
            ))}
          </div>
        )}

        <div className="mb-8">
          <div className="bg-[#0f1a2e]/80 border border-red-500/10 rounded-2xl p-5 flex flex-wrap gap-6">
            {[
              { icon: <Smartphone className="w-5 h-5 text-red-500" />, label: "Portrait 9:16", desc: "Optimized for mobile viewing" },
              { icon: <Play className="w-5 h-5 text-emerald-400" />, label: "First Episodes Free", desc: "Start watching without subscription" },
              { icon: <Lock className="w-5 h-5 text-amber-400" />, label: "Premium Episodes", desc: "Subscribe to unlock all episodes" },
              { icon: <Crown className="w-5 h-5 text-yellow-400" />, label: "VIP Access", desc: "Unlimited streaming for subscribers" },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 min-w-[160px]">
                <div className="w-9 h-9 rounded-xl bg-zinc-800/80 flex items-center justify-center flex-shrink-0">{icon}</div>
                <div>
                  <p className="text-white font-bold text-sm">{label}</p>
                  <p className="text-white/80 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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
