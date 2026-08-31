const fs = require('fs');
let file = fs.readFileSync('src/pages/categories-browse.tsx', 'utf8');

// Make 'new' show all content types (movies + shows + drama), not just movies
// Also add 'new' to the heading logic
file = file.replace(
  `  new: "movie",`,
  `  new: "all",`
);

// Also add isNew detection from path tab param - currently only query string
// Let's also fix getHeading to detect tab=new
file = file.replace(
  `  const isTrending = searchParams.has("trending");`,
  `  const tabParam = (params as any)?.tab || "";
  const isTrending = searchParams.has("trending");`
);

file = file.replace(
  `  const isNew = searchParams.has("new");`,
  `  const isNew = searchParams.has("new") || tabParam === "new";`
);

file = file.replace(
  `  const isShortDrama = searchParams.has("short-drama");`,
  `  const isShortDrama = searchParams.has("short-drama") || tabParam === "drama";`
);

fs.writeFileSync('src/pages/categories-browse.tsx', file);
console.log("Fixed TAB_TO_TYPE and heading detection");
