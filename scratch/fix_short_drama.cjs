const fs = require('fs');
let file = fs.readFileSync('src/pages/short-dramas-public.tsx', 'utf8');

file = file.replace(
  'import { ShortDramaCard } from "@/components/ContentCard";',
  'import { PortraitCard } from "@/components/ContentCard";'
);

file = file.replace(
  '<ShortDramaCard key={item.id || item._id} drama={item} onClick={() => handleSelectDrama(item)} />',
  '<PortraitCard key={item.id || item._id} item={item} onClick={() => handleSelectDrama(item)} fullWidth aspectRatio="9/16" />'
);

fs.writeFileSync('src/pages/short-dramas-public.tsx', file);
console.log("Fixed short dramas page");
