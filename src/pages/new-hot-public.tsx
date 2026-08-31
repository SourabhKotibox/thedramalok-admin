import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useGetWebHome, getImageUrl } from "@/lib/api-client";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";

export default function NewHotPublicPage() {
  const [, setLocation] = useLocation();
  const [plansModalOpen, setPlansModalOpen] = useState(false);

  const { data: homeData, isLoading } = useGetWebHome();

  const newReleases = homeData?.newReleases || [];
  const trendingNow = homeData?.trendingNow || [];
  const newDramas = homeData?.newDramas || [];
  const featuredDramas = homeData?.featuredDramas || [];
  const allItems = [...newReleases, ...trendingNow, ...newDramas, ...featuredDramas]
    .filter((v, i, a) => a.findIndex(t => (t.id || t._id) === (v.id || v._id)) === i)
    .sort((a, b) => {
      const dateA = new Date(a.releaseDate || a.year || 0).getTime();
      const dateB = new Date(b.releaseDate || b.year || 0).getTime();
      return dateB - dateA;
    });

  const handlePlay = (item: any) => {
    const id = item.id || item._id;
    const contentType = (item.contentType || "").toLowerCase();
    const type = (item.type || "").toLowerCase();
    const isDrama = contentType === "drama";
    const isShow = type === "show" || type === "series" || contentType === "series";

    if (isDrama) {
      setLocation(item.trailerUrl ? `/drama/${id}/episode/0` : `/drama/${id}/episode/1`);
    } else if (isShow) {
      setLocation(`/show/${id}`);
    } else {
      setLocation(`/movie/${id}`);
    }
  };

  return (
    <PublicLayout onSignIn={() => setLocation("/login")} onSubscribeClick={() => setPlansModalOpen(true)}>
      <div className="min-h-screen pt-20 pb-20 max-w-4xl mx-auto px-4">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-white font-bold text-3xl tracking-tight">New & Hot</h1>
          <p className="text-white/60 text-sm mt-1.5 font-medium">Follow the latest titles and trending releases.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-white/60 font-semibold text-lg">No content found</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {allItems.map((item: any, index: number) => {
              const id = item.id || item._id || `item-${index}`;

              return (
                <div key={id} className="relative group/timeline">
                  <div 
                    onClick={() => handlePlay(item)}
                    className="rounded-2xl overflow-hidden bg-zinc-900/40 border border-zinc-800/60 flex flex-col md:flex-row gap-5 p-4 sm:p-5 hover:border-zinc-700/60 transition-colors cursor-pointer group-hover/timeline:bg-zinc-900/70"
                  >
                    <div className={`relative md:w-64 w-full flex-shrink-0 rounded-xl overflow-hidden bg-black ${item.contentType === 'drama' ? 'aspect-[9/16] md:w-36' : 'aspect-[16/9]'}`}>
                      <img src={getImageUrl(item.contentType === 'drama' ? (item.poster || item.backdrop) : (item.backdrop || item.poster))} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <h3 className="text-white text-base sm:text-lg font-bold truncate">{item.title}</h3>
                        </div>
                        {item.description && (
                          <p className="text-white text-xs sm:text-[13px] leading-relaxed mt-2.5 line-clamp-3">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <span className="text-white/80 text-[10px] font-bold tracking-wider uppercase">{item.badge || 'NEW'}</span>
                        <span className="text-white text-[10px]">·</span>
                        {(item.genres || []).slice(0, 2).map((g: string, gi: number) => (
                          <span key={`${g}-${gi}`} className="text-[10px] font-bold px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-white/80 rounded-full uppercase tracking-wider">{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <SubscriptionPlansModal isOpen={plansModalOpen} onClose={() => setPlansModalOpen(false)} />
    </PublicLayout>
  );
}
