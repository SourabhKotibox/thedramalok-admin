const fs = require('fs');
let file = fs.readFileSync('src/components/ContentCard.tsx', 'utf8');

file = file.replace(/cleanText\(item\.title\)Logo/g, 'item.titleLogo');
fs.writeFileSync('src/components/ContentCard.tsx', file);
