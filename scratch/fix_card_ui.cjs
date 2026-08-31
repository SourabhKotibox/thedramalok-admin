const fs = require('fs');
let file = fs.readFileSync('src/components/ContentCard.tsx', 'utf8');

// Fix the badges and text layout in the normal state of PortraitCard
const oldNormalState = `          {isShow && (
            <div className="absolute bottom-9 left-2 z-10">
              <span className="px-1 py-0.5 bg-white/15 border border-white/20 text-foreground text-[8px] font-black rounded-sm leading-none">TV Show</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-white text-[11px] font-bold leading-tight line-clamp-1">{cleanText(item.title)}</p>
            <p className="text-white/80 text-[9px] mt-0.5 font-medium">{year} {duration ? \`• \${duration}\` : ""}</p>
          </div>`;

const newNormalState = `          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
            {isShow && (
              <span className="inline-block px-1.5 py-[3px] bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-black tracking-wider uppercase rounded mb-1.5">TV Show</span>
            )}
            <p className="text-white text-[12px] font-bold leading-tight line-clamp-1 drop-shadow-md">{cleanText(item.title)}</p>
            <p className="text-white/70 text-[10px] mt-1 font-semibold tracking-wide drop-shadow-md">{year} {duration ? \`• \${duration}\` : ""}</p>
          </div>`;

file = file.replace(oldNormalState, newNormalState);

// Fix the star rating to look better
const oldStar = `<div className="absolute top-1.5 right-1.5 z-10 flex gap-1">
            <div className="flex items-center gap-0.5 px-1 py-0.5 bg-black/60 backdrop-blur-sm rounded-sm">
              <Star className="w-[8px] h-[8px] text-yellow-400 fill-yellow-400" />
              <span className="text-white text-[9px] font-bold leading-none mt-[1px]">{item.rating || "0.0"}</span>
            </div>
          </div>`;

const newStar = `<div className="absolute top-2 right-2 z-10 flex gap-1">
            <div className="flex items-center gap-1 px-1.5 py-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-md shadow-lg">
              <Star className="w-3 h-3 text-[#FFC107] fill-[#FFC107]" />
              <span className="text-white text-[10px] font-black leading-none mt-[1px]">{item.rating || "0.0"}</span>
            </div>
          </div>`;

file = file.replace(oldStar, newStar);

// Fix premium badge to look better
const oldPremium = `          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
            <img src="/logo.png" alt="TDL" className="h-2 w-auto object-contain opacity-90 drop-shadow-md" />
            {item.isPremium && (
              <div className="flex items-center bg-[#FFC107] px-0.5 rounded-[2px] shadow-sm">
                <Crown className="w-2 h-2 text-black mr-[1px]" fill="currentColor" />
                <span className="text-[6px] font-black tracking-tight text-black leading-none pb-[1px]">PREMIUM</span>
              </div>
            )}
          </div>`;

const newPremium = `          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            <img src="/logo.png" alt="TDL" className="h-3 w-auto object-contain drop-shadow-lg" />
            {item.isPremium && (
              <div className="flex items-center self-start bg-gradient-to-r from-amber-400 to-amber-600 px-1.5 py-[3px] rounded shadow-md border border-amber-300/30">
                <Crown className="w-2.5 h-2.5 text-black mr-1" fill="currentColor" />
                <span className="text-[8px] font-black tracking-wider text-black uppercase leading-none">Premium</span>
              </div>
            )}
          </div>`;

file = file.replace(oldPremium, newPremium);

fs.writeFileSync('src/components/ContentCard.tsx', file);
console.log("Improved PortraitCard UI");
