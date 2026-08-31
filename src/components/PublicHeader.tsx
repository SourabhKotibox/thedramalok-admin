import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";
import { getImageUrl, useGetPublicNotifications } from "@/lib/api-client";
import { Play } from "lucide-react";

export default function PublicHeader({
  activeTab, setActiveTab, onSignIn, onSignOut, user, onSubscribeClick,
}: {
  activeTab?: string; setActiveTab?: (tab: string) => void;
  onSignIn?: () => void; onSignOut?: () => void; user?: any; onSubscribeClick?: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [, setLocation] = useLocation();

  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();

  const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return getImageUrl(settings.darkLogoUrl);
    if (resolvedTheme === "light" && settings.lightLogoUrl) return getImageUrl(settings.lightLogoUrl);
    return settings.logoUrl ? getImageUrl(settings.logoUrl) : "";
  };
  const logoUrl = getLogoUrl();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 right-0 left-0 lg:left-[72px] z-40 transition-all duration-300 ${scrolled ? "bg-[#0a0a10]/95 backdrop-blur-md shadow-md border-b border-white/5" : "bg-gradient-to-b from-[#030306]/90 via-[#030306]/40 to-transparent"}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <div className="flex items-center gap-4 lg:hidden">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              {logoUrl ? (
                <img src={logoUrl} alt={settings.platformName || "StreamIT"} className="h-6 w-auto object-contain group-hover:scale-105 transition-transform" />
              ) : (
                <>
                  <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/50 group-hover:scale-105 transition-transform">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </div>
                  <span className="text-white font-bold text-lg tracking-tight hidden sm:block">{settings.platformName || "StreamIT"}</span>
                </>
              )}
            </Link>
          </div>
          
          {/* Top navbar intentionally kept minimal; navigation and actions are in the sidebar */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </header>
  );
}
