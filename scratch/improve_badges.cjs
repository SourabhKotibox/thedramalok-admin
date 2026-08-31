const fs = require('fs');
let file = fs.readFileSync('src/components/ContentCard.tsx', 'utf8');

// Replace BadgeTop
const oldBadgeTop = `function BadgeTop({ item }: { item: any }) {
  const isSubscribed = (() => {
    try {
      const stored = localStorage.getItem("appUser");
      if (stored) {
        const u = JSON.parse(stored);
        return u.subscriptionStatus === "active" && u.subscriptionPlan !== "free";
      }
    } catch {}
    return false;
  })();

  const isPremium = item.isPremium || item.badge === "TOP" || item.badge === "EXCLUSIVE";
  if (isPremium && !isSubscribed) {
    return (
      <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-400/90 text-black text-[8px] font-black rounded-sm leading-none shadow">
        <Crown className="w-2.5 h-2.5" /> PREMIUM
      </span>
    );
  }
  if (item.badge === "NEW") {
    return (
      <span className="px-1 py-0.5 bg-emerald-500/90 text-foreground text-[8px] font-black rounded-sm leading-none shadow">
        NEW
      </span>
    );
  }
  if (item.badge === "HOT") {
    return (
      <span className="px-1 py-0.5 bg-orange-500/90 text-foreground text-[8px] font-black rounded-sm leading-none shadow">
        HOT
      </span>
    );
  }
  if (item.badge === "TRENDING") {
    return (
      <span className="px-1 py-0.5 bg-red-500/90 text-white text-[8px] font-black rounded-sm leading-none shadow">
        TRENDING
      </span>
    );
  }
  if (item.badge && item.badge !== "TOP" && item.badge !== "EXCLUSIVE") {
    return (
      <span className="px-1 py-0.5 bg-white/20 text-foreground text-[8px] font-black rounded-sm leading-none shadow">
        {item.badge}
      </span>
    );
  }
  return null;
}`;

const newBadgeTop = `function BadgeTop({ item }: { item: any }) {
  const isSubscribed = (() => {
    try {
      const stored = localStorage.getItem("appUser");
      if (stored) {
        const u = JSON.parse(stored);
        return u.subscriptionStatus === "active" && u.subscriptionPlan !== "free";
      }
    } catch {}
    return false;
  })();

  const isPremium = item.isPremium || item.badge === "TOP" || item.badge === "EXCLUSIVE";
  if (isPremium && !isSubscribed) {
    return (
      <div className="flex items-center gap-1 px-1.5 py-[3px] bg-gradient-to-r from-amber-400 to-amber-600 rounded-md shadow-lg border border-amber-300/30">
        <Crown className="w-2.5 h-2.5 text-black" fill="currentColor" />
        <span className="text-black text-[9px] font-black tracking-wider uppercase leading-none mt-[1px]">Premium</span>
      </div>
    );
  }
  
  const badgeClasses = "inline-block px-1.5 py-[3px] rounded-md shadow-lg border text-[9px] font-black tracking-wider uppercase leading-none";
  if (item.badge === "NEW") {
    return <span className={\`\${badgeClasses} bg-emerald-500 border-emerald-400/50 text-white\`}>NEW</span>;
  }
  if (item.badge === "HOT") {
    return <span className={\`\${badgeClasses} bg-orange-500 border-orange-400/50 text-white\`}>HOT</span>;
  }
  if (item.badge === "TRENDING") {
    return <span className={\`\${badgeClasses} bg-red-600 border-red-500/50 text-white\`}>TRENDING</span>;
  }
  if (item.badge && item.badge !== "TOP" && item.badge !== "EXCLUSIVE") {
    return <span className={\`\${badgeClasses} bg-white/20 backdrop-blur-md border-white/30 text-white\`}>{item.badge}</span>;
  }
  return null;
}`;

file = file.replace(oldBadgeTop, newBadgeTop);

// Replace ImdbBadge
const oldImdbBadge = `function ImdbBadge({ rating }: { rating: string | number }) {
  return (
    <div className="flex items-center gap-0.5 px-1 py-0.5 bg-black/60 backdrop-blur-sm rounded-sm">
      <Star className="w-[8px] h-[8px] text-yellow-400 fill-yellow-400" />
      <span className="text-white text-[9px] font-bold leading-none mt-[1px]">{rating}</span>
    </div>
  );
}`;

const newImdbBadge = `function ImdbBadge({ rating }: { rating: string | number }) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-[3px] bg-black/70 backdrop-blur-md rounded-md shadow-lg border border-white/10">
      <Star className="w-2.5 h-2.5 text-[#FFC107] fill-[#FFC107]" />
      <span className="text-white text-[10px] font-black leading-none mt-[1px]">{rating}</span>
    </div>
  );
}`;

file = file.replace(oldImdbBadge, newImdbBadge);

fs.writeFileSync('src/components/ContentCard.tsx', file);
console.log("Improved BadgeTop and ImdbBadge");
