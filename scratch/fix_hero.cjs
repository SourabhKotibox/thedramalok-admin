const fs = require('fs');
let file = fs.readFileSync('src/pages/streaming-home.tsx', 'utf8');

// The file is corrupted. We need to restore it by writing the whole Hero function again.
// Wait, I can just use a regex to replace everything from "function Hero(" to its closing brace.
// The issue is finding the correct closing brace.

// Actually, I can just use my own code to completely rewrite the Hero function!
const heroRewrite = `
function cleanText(str?: string) {
  if (!str) return "";
  return str.replace(/kotibox ott/gi, 'The Drama Lock').replace(/kotibox/gi, 'The Drama Lock');
}

/* ─── HERO BANNER ─── */
function Hero({ activeTab, onPlay, onSubscribeClick, isSubscribed }: { activeTab: Tab; onPlay: (item: ContentItem) => void; onSubscribeClick: () => void; isSubscribed?: boolean }) {
  const { data: homeData, isLoading } = useGetWebHome();
  const { settings } = useSettings();
  const splashVideoUrl = (settings as any)?.splashVideoUrl ? getImageUrl((settings as any).splashVideoUrl) : "";
  
  const heroContent = useMemo(() => {
    const raw = homeData?.heroContent || [];
    if (activeTab === "drama") {
      return raw.filter((item: any) => item.contentType === "drama");
    }
    if (activeTab === "movies") {
      return raw.filter((item: any) => item.type === "movie" || item.contentType === "movie");
    }
    if (activeTab === "tvshows") {
      return raw.filter((item: any) => item.type !== "movie" && item.contentType !== "movie");
    }
    return raw;
  }, [homeData?.heroContent, activeTab]);

  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setCurrent(0);
  }, [activeTab, heroContent.length]);

  const go = (index: number) => {
    if (index === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(index); setFading(false); }, 400);
  };

  useEffect(() => {
    if (heroContent.length === 0 || isPaused) return;
    const timer = setInterval(() => go((current + 1) % heroContent.length), 6000);
    return () => clearInterval(timer);
  }, [current, heroContent.length, isPaused]);

  if (isLoading) {
    return <div className="flex items-center justify-center w-full bg-[#030306]" style={{ height: "85vh", minHeight: 480 }}><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
  }
  if (!heroContent.length) return null;

  const item = heroContent[current];
  const isPremium = item.isPremium || item.badge === "TOP" || item.badge === "EXCLUSIVE";

  return (
    <div
      className="relative w-full overflow-hidden bg-[#030306] mt-[60px] lg:mt-0"
      style={{ height: "85vh", minHeight: 480 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Backdrop */}
      <div className={\`absolute inset-0 transition-opacity duration-500 \${fading ? "opacity-0" : "opacity-100"}\`}>
        {splashVideoUrl ? (
          <video
            src={splashVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center lg:object-top"
          />
        ) : (
          <img
            src={getImageUrl(item.backdrop || item.poster) || ""}
            alt={cleanText(item.title)}
            className="w-full h-full object-cover object-center lg:object-top"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = \`https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=675&fit=crop&q=80\`;
            }}
          />
        )}
      </div>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a10]/90 via-[#0a0a10]/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-[#030306] via-[#030306]/60 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-10 sm:bottom-12 left-0 px-6 sm:px-10 lg:px-14 max-w-2xl w-full">
        <div className={\`transition-all duration-500 \${fading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}\`}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {isPremium && !isSubscribed ? <PremiumBadge /> : null}
            <span className={\`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg \${
              item.type === "movie"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : item.contentType === "drama"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }\`}>
              {item.type === "movie" ? <Film className="w-3 h-3" /> : item.contentType === "drama" ? <Smartphone className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
              {item.type === "movie" ? "Movie" : item.contentType === "drama" ? "Short Drama" : "TV Show"}
            </span>
            {[...new Set<string>(item.genres || [])].slice(0, 2).map((g) => (
              <span key={g} className="text-white text-xs bg-zinc-900/80 border border-zinc-800 px-2 py-1 rounded-lg font-semibold">{g}</span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 tracking-tight drop-shadow-lg">
            {cleanText(item.title)}
          </h1>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <ImdbBadge rating={item.imdbRating} />
            <AgeBadge rating={item.ageRating} />
            {item.duration && <span className="text-white/80 text-xs font-semibold">{item.duration}</span>}
            {item.year && <span className="text-white/80 text-xs font-semibold">{item.year}</span>}
            {item.language && <span className="text-white text-xs font-semibold">{item.language}</span>}
          </div>

          <p className="text-white text-sm sm:text-base leading-relaxed mb-6 max-w-lg line-clamp-3">
            {cleanText(item.description)}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-2.5 px-8 py-3.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-full text-sm tracking-wide transition-all active:scale-95 shadow-xl"
            >
              <Play className="w-4 h-4 fill-black" />
              Watch Now
            </button>
            {isPremium && !isSubscribed && (
              <button
                onClick={onSubscribeClick}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-red-950/30"
              >
                <Crown className="w-4 h-4" /> Subscribe
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Indicators */}
      <div className="absolute bottom-6 sm:bottom-12 right-6 sm:right-10 flex gap-1.5 z-20">
        {heroContent.map((_, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            className={\`transition-all duration-300 rounded-full \${
              idx === current ? "w-6 h-1.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
            }\`}
          />
        ))}
      </div>
    </div>
  );
}
`;

// Now find where function cleanText starts and where function Hero ends
// Or wait, my previous replacement might have left some junk.
let startIndex = file.indexOf("function cleanText(");
if (startIndex === -1) {
  startIndex = file.indexOf("/* ─── HERO BANNER ─── */");
  if (startIndex === -1) {
      startIndex = file.indexOf("function Hero(");
  }
}

let remaining = file.slice(startIndex);
// The component after Hero is PremiumBadge
let endIndex = remaining.indexOf("function PremiumBadge");
if (endIndex === -1) {
  console.log("Could not find PremiumBadge!");
  process.exit(1);
}

let newFile = file.slice(0, startIndex) + heroRewrite + "\n\n" + remaining.slice(endIndex);
fs.writeFileSync('src/pages/streaming-home.tsx', newFile);
console.log("Fixed streaming-home.tsx");
