const fs = require('fs');
let file = fs.readFileSync('src/pages/streaming-home.tsx', 'utf8');

// 1. Remove `{webSections.length > 0 ? (`
file = file.replace('{webSections.length > 0 ? (', '');

// 2. Find `})`
//    `) : (`
//    `<>`
//    `{/* HARDCODED FALLBACK START */}`
const fallbackStart = file.indexOf('{/* HARDCODED FALLBACK START */}');
if (fallbackStart === -1) {
  console.log("Could not find fallback start");
  process.exit(1);
}

// Rewind to find the `) : (` part before the fallback
let cutStart = fallbackStart;
while (cutStart > 0 && file.substring(cutStart, cutStart + 6) !== ') : (\n') {
  cutStart--;
}
if (cutStart > 0) {
  // Found `) : (\n`
  // Actually, the exact code is:
  /*
        })
      ) : (
        <>
  */
  const preText = '      ) : (\n        <>\n          {/* HARDCODED FALLBACK START */}';
  let realStart = file.indexOf(preText);
  if (realStart !== -1) {
     cutStart = realStart;
  } else {
     // Let's just find `) : (` by searching backwards from fallbackStart
     cutStart = file.lastIndexOf(') : (', fallbackStart);
  }
}

const fallbackEnd = file.indexOf('{/* HARDCODED FALLBACK END */}');
if (fallbackEnd === -1) {
  console.log("Could not find fallback end");
  process.exit(1);
}

// Find the `</>\n      )}` after the fallbackEnd
let endOfIf = file.indexOf(')}', fallbackEnd);
// Let's grab the whole block to delete
const blockToDelete = file.slice(cutStart, endOfIf + 2);

file = file.replace(blockToDelete, '');

// 3. Fix the bottom subscribe banner
file = file.replace(
  '{webSections.length > 0 && !isSubscribed && <SubscribeBanner onSubscribeClick={onSubscribeClick} />}',
  '{!isSubscribed && <SubscribeBanner onSubscribeClick={onSubscribeClick} />}'
);

fs.writeFileSync('src/pages/streaming-home.tsx', file);
console.log("Removed fallbacks!");
