const fs = require('fs');

const files = [
  'src/pages/categories-browse.tsx',
  'src/pages/movies-public.tsx',
  'src/pages/tv-shows-public.tsx',
  'src/pages/short-dramas-public.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace grids with 7 cols to 6 cols, and increase gap
  content = content.replace(
    /grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3/g,
    'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6'
  );

  content = content.replace(
    /grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3/g,
    'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6'
  );

  content = content.replace(
    /grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-10/g,
    'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mb-10'
  );

  fs.writeFileSync(file, content);
}

// Check streaming-home.tsx tabs too
let home = fs.readFileSync('src/pages/streaming-home.tsx', 'utf8');
home = home.replace(
    /grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6/g,
    'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6'
);
fs.writeFileSync('src/pages/streaming-home.tsx', home);

console.log("Fixed grid columns and gaps");
