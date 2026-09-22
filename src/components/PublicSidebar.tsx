import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useSettings } from '@/contexts/SettingsContext';
import { getImageUrl } from '@/lib/api-client';
import { useTheme } from 'next-themes';
import {
  Home,
  Search,
  Film,
  Tv,
  Smartphone,
  Mic,
  Flame,
  Bookmark,
  Wallet,
  Crown,
  User,
  HelpCircle,
  Play
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/browse' },
  { icon: Smartphone, label: 'Short Drama', href: '/short-dramas-browse' },
  { icon: Film, label: 'Movies', href: '/movies-browse' },
  { icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },
  { icon: Flame, label: 'New & Hot', href: '/new-hot-browse' },
  { icon: Mic, label: 'Stories', href: '/stories' },
  { icon: User, label: 'My Space', href: '/account' },
];

export function PublicSidebar() {
  const [location, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();
  
  const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return getImageUrl(settings.darkLogoUrl);
    if (resolvedTheme === "light" && settings.lightLogoUrl) return getImageUrl(settings.lightLogoUrl);
    return settings.logoUrl ? getImageUrl(settings.logoUrl) : "";
  };
  const logoUrl = getLogoUrl();
  
  const logoSize = resolvedTheme === "dark"
    ? (settings.darkLogoSize || 32)
    : (settings.lightLogoSize || 32);

  const user = (() => { try { return JSON.parse(localStorage.getItem("appUser") || "null"); } catch { return null; } })();
  
  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full z-50 bg-[#0a0a10]/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ${
        isHovered ? 'w-[240px]' : 'w-[80px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col items-center pt-8 mb-4 relative">
        <Link href="/" className="w-[80px] h-12 mb-2 flex items-center justify-center text-white transition-transform hover:scale-110">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={settings.platformName || "The Drama Lock"}
              className="w-auto object-contain transition-all"
              style={{ height: `${Math.min(logoSize, 44)}px`, maxHeight: "44px" }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/50">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          )}
        </Link>
        
        {/* Subscribe / Upgrade Button */}
        <div className={`transition-all duration-300 overflow-hidden flex justify-center ${isHovered ? 'opacity-100 h-[32px] w-full px-5' : 'opacity-0 h-0 w-0'}`}>
          <button 
            onClick={() => setLocation('/membership')}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-600/20 to-amber-900/20 hover:from-amber-500/30 hover:to-amber-800/30 border border-amber-500/30 text-amber-500 hover:text-amber-400 text-[11px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-lg transition-all whitespace-nowrap w-full"
          >
            Upgrade <span className="text-[10px]">❯</span>
          </button>
        </div>
        
        {/* Active Indicator collapsed Upgrade button (shows small badge) */}
        <div className={`transition-all duration-300 absolute top-20 flex justify-center ${isHovered ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
          <div className="text-[9px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Pro</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2 flex flex-col gap-1 mt-4">
        {NAV_ITEMS.map((item, index) => {
          const isActive = location === item.href || 
            (item.href !== '/' && item.href !== '/browse' && location.startsWith(item.href!.split('?')[0])) ||
            (item.href === '/browse' && location === '/browse');
          
          const Icon = item.icon!;
          const shouldFill = isActive && item.icon !== Search;

          return (
            <Link key={item.label} href={item.href!}>
              <div
                className={`flex items-center relative group transition-colors h-14 ${
                  isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                
                <div className="w-[80px] h-full flex items-center justify-center flex-shrink-0 relative">
                  <Icon 
                    className={`w-[22px] h-[22px] transition-all duration-300 group-hover:scale-110 ${isActive ? 'drop-shadow-md' : ''}`}
                    fill={shouldFill ? "currentColor" : "none"}
                    stroke={shouldFill ? "none" : "currentColor"}
                    strokeWidth={shouldFill ? 0 : (isActive ? 2.5 : 2)}
                  />
                  {!isHovered && isActive && (
                    <div className="absolute inset-0 bg-white/5 rounded-full w-10 h-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                <span
                  className={`whitespace-nowrap font-bold text-[15px] tracking-wide transition-all duration-300 ${
                    isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
