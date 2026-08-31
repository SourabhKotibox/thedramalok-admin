const fs = require('fs');
let file = fs.readFileSync('src/components/ContentCard.tsx', 'utf8');

file = file.replace(
  'style={{ aspectRatio: "2/3" }}',
  'style={{ aspectRatio }}'
);

fs.writeFileSync('src/components/ContentCard.tsx', file);
