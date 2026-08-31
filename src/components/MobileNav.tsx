import React from 'react';
import { useLocation, Link } from 'wouter';
import { Home, Search, Film, Tv, Smartphone, Flame, Mic, User } from 'lucide-react';

const TABS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/browse' },
  { icon: Smartphone, label: 'Drama', href: '/short-dramas' },
  { icon: Film, label: 'Movies', href: '/movies' },
  { icon: Tv, label: 'TV', href: '/tv-shows-browse' },
  { icon: Flame, label: 'New', href: '/new-hot' },
  { icon: User, label: 'Me', href: '/account' },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a10]/98 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map((tab) => {
          const isActive = location === tab.href || 
            (tab.href !== '/' && tab.href !== '/browse' && location.startsWith(tab.href.split('?')[0])) ||
            (tab.href === '/browse' && location === '/browse');

          const Icon = tab.icon;

          return (
            <Link key={tab.label} href={tab.href}>
              <a className="flex flex-col items-center justify-center w-full h-full space-y-1">
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-[#e50914]' : 'text-zinc-500'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? 'text-white' : 'text-zinc-500'
                  }`}
                >
                  {tab.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
