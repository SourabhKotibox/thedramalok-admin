const fs = require('fs');
let file = fs.readFileSync('src/components/PublicHeader.tsx', 'utf8');

// Remove the entire nav block
file = file.replace(
  `          {/* Desktop nav tabs - matches Triple Mindes original */}
          <nav className="hidden lg:flex items-center gap-1">
            {([
              { label: "Home", href: "/", tab: "home", icon: null },
              { label: "Short Drama", href: "/browse/drama", tab: "drama", icon: <Smartphone className="w-3.5 h-3.5" /> },
              { label: "Movies", href: "/browse/movies", tab: "movies", icon: <Film className="w-3.5 h-3.5" /> },
              { label: "TV Shows", href: "/tv-shows-browse", tab: "tvshows", icon: <Tv className="w-3.5 h-3.5" /> },
              { label: "New & Hot", href: "/browse/new", tab: "new", icon: <Flame className="w-3.5 h-3.5" /> },
            ] as const).map(({ label, href, tab, icon }) => (
              <button
                key={tab}
                onClick={() => {
                  if (setActiveTab) setActiveTab(tab);
                  setLocation(href);
                }}
                className={\`relative flex items-center gap-1.5 px-3.5 py-2 text-[13.5px] font-bold rounded-lg transition-all duration-200 hover:bg-white/10 \${
                  resolvedActiveTab === tab ? "text-white" : "text-white/70 hover:text-white"
                }\`}
              >
                {icon}
                {label}
                {resolvedActiveTab === tab && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-red-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>`,
  ''
);

// Remove icons we added that are no longer needed
file = file.replace(
  'import { Play, Search, X, Bell, Crown, ChevronDown, User, Home, Film, Tv, Smartphone, Flame } from "lucide-react";',
  'import { Play, Search, X, Bell, Crown, ChevronDown, User } from "lucide-react";'
);

// Remove location detection added for nav
file = file.replace(
  `  const [location] = useLocation();
  const isBrowsePage = typeof window !== "undefined" && window.location.pathname.startsWith("/browse");
  const [searchOpen, setSearchOpen] = useState(() => !!currentQuery || isBrowsePage);

  // Auto-detect active tab from URL when not explicitly passed as prop
  const resolvedActiveTab = activeTab || (() => {
    if (location === "/") return "home";
    if (location.startsWith("/browse/drama")) return "drama";
    if (location.startsWith("/browse/movies")) return "movies";
    if (location.startsWith("/browse/new")) return "new";
    if (location.startsWith("/tv-shows-browse")) return "tvshows";
    return "";
  })();`,
  `  const isBrowsePage = typeof window !== "undefined" && window.location.pathname.startsWith("/browse");
  const [searchOpen, setSearchOpen] = useState(() => !!currentQuery || isBrowsePage);`
);

fs.writeFileSync('src/components/PublicHeader.tsx', file);
console.log("Reverted header");
