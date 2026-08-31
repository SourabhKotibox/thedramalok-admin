const fs = require('fs');
let file = fs.readFileSync('src/pages/new-hot-public.tsx', 'utf8');

// Remove timeline dots
file = file.replace(
  /<div className="absolute -left-\[31px\] sm:-left-\[47px\] top-4 w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center group-hover\/timeline:border-red-500 transition-colors">\s*<div className="w-1\.5 h-1\.5 rounded-full bg-zinc-700 group-hover\/timeline:bg-red-500 transition-colors" \/>\s*<\/div>/g,
  ''
);

// Remove month/date block
file = file.replace(
  /\{month && \(\s*<div className="absolute -left-\[95px\] sm:-left-\[125px\] top-1 text-center w-16">\s*<p className="text-white text-\[10px\] font-bold tracking-widest">\{month\}<\/p>\s*<p className="text-white text-xl sm:text-2xl font-bold leading-none mt-0\.5">\{day\}<\/p>\s*<\/div>\s*\)\}/g,
  ''
);

// Remove border-l and padding for the timeline structure
file = file.replace(
  /<div className="relative border-l border-zinc-800 ml-4 sm:ml-10 pl-6 sm:pl-10 space-y-12">/g,
  '<div className="space-y-6 sm:space-y-8">'
);

// Remove the reminder button
file = file.replace(
  /<button[\s\S]*?\{hasReminder \? "Reminder Set" : "Remind Me"\}\s*<\/button>/g,
  ''
);

// Clean up unused state and functions related to reminders
file = file.replace(
  /const \[reminders, setReminders\] = useState<Record<string, boolean>>\(\(\) => \{[\s\S]*?\}\);/g,
  ''
);
file = file.replace(
  /const toggleReminder = \(id: string, title: string\) => \{[\s\S]*?\};/g,
  ''
);
file = file.replace(
  /const hasReminder = !!reminders\[id\];/g,
  ''
);
file = file.replace(
  /const releaseDate = item\.releaseDate \|\| item\.year \|\| item\.createdAt \|\| new Date\(\)\.toISOString\(\);\s*const parsedDate = new Date\(releaseDate\);\s*const month = parsedDate\.toLocaleString\("default", \{ month: "short" \}\)\.toUpperCase\(\);\s*const day = parsedDate\.getDate\(\);/g,
  ''
);

// Remove unused imports
file = file.replace(/Bell,\s*Check\s*/g, '');

fs.writeFileSync('src/pages/new-hot-public.tsx', file);
console.log("Redesigned new-hot-public.tsx");
