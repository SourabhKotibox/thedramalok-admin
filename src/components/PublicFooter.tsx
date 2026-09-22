import { useLocation } from "wouter";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";
import { getImageUrl, useGetPages } from "@/lib/api-client";
import { Play } from "lucide-react";

export function PublicFooter() {
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();
  const [, setLocation] = useLocation();

  const { data: pagesData } = useGetPages({ limit: 50 });
  const pages: any[] = (pagesData?.data || []).filter((p: any) => 
    (p.status === "published" || !p.status) &&
    p.title && p.title.trim() !== "" &&
    p.slug && p.slug.trim() !== "" &&
    p.slug !== "faq" && p.slug !== "help"
  );

  const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return getImageUrl(settings.darkLogoUrl);
    if (resolvedTheme === "light" && settings.lightLogoUrl) return getImageUrl(settings.lightLogoUrl);
    return settings.logoUrl ? getImageUrl(settings.logoUrl) : "";
  };
  const logoUrl = getLogoUrl();

  const socialLinks = [
    { label: "Facebook", d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z", url: settings.facebookUrl },
    { label: "Twitter", d: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z", url: settings.twitterUrl },
    { label: "YouTube", d: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z", url: settings.youtubeUrl },
    { label: "Instagram", d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0 1 2 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z", url: settings.instagramUrl },
  ].filter(link => link.url && link.url.trim() !== "");

  const logoSize = resolvedTheme === "dark"
    ? (settings.darkLogoSize || 36)
    : (settings.lightLogoSize || 36);

  return (
    <footer className="bg-[#040407] border-t border-zinc-900 mt-20 pt-16 pb-10">
      <div className="px-6 sm:px-10 lg:px-14 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={settings.platformName || "StreamIT"}
                  className="w-auto object-contain transition-all"
                  style={{ height: `${logoSize}px`, maxHeight: "64px" }}
                />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                  <span className="text-white font-bold text-xl tracking-tight">{settings.platformName || "StreamIT"}</span>
                </>
              )}
            </div>
            <p className="text-white text-xs leading-relaxed max-w-xs">{settings.siteDescription || "Your premium OTT destination for movies, TV shows, and exclusive short dramas."}</p>
            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}                  className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800 text-white hover:border-red-600 hover:bg-red-600/5 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold text-[11px] tracking-widest uppercase">Browse Catalog</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Movies", href: "/browse" },
                { label: "TV Shows", href: "/browse" },
                { label: "Short Dramas", href: "/browse" },
                { label: "New & Hot", href: "/browse" },
              ].map((itm) => (
                <li key={itm.label}>
                  <button onClick={() => setLocation(itm.href)} className="text-white hover:text-white text-xs font-semibold transition-colors text-left">{itm.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-bold text-[11px] tracking-widest uppercase">Help & Info</h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {pages.length > 0 ? pages.map((p: any) => (
                <li key={p.slug || p.id}>
                  <button 
                    onClick={() => {
                      if (p.slug === "faq" || p.slug === "help") {
                        setLocation("/help-support");
                      } else {
                        setLocation(`/page/${p.slug}`);
                      }
                    }} 
                    className="text-white hover:text-white text-xs font-semibold transition-colors text-left truncate max-w-full" 
                    title={p.title}
                  >
                    {p.title}
                  </button>
                </li>
              )) : (
                <li className="text-white text-xs col-span-2">No pages available</li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-300 text-xs font-medium text-center sm:text-left">
            {settings.copyrightText || `© ${new Date().getFullYear()} ${settings.platformName || "StreamIT"}. All rights reserved.`}
          </p>
          <div className="flex items-center gap-6">
            <button onClick={() => setLocation("/page/privacy-policy")} className="text-zinc-300 hover:text-white text-xs font-medium transition-colors">Privacy Policy</button>
            <button onClick={() => setLocation("/page/terms-of-service")} className="text-zinc-300 hover:text-white text-xs font-medium transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
