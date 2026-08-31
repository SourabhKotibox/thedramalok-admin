const fs = require('fs');
let file = fs.readFileSync('src/pages/streaming-home.tsx', 'utf8');

file = file.replace(
  '        webSections.map((section: any, index: number) => {',
  '      {webSections.map((section: any, index: number) => {'
);

fs.writeFileSync('src/pages/streaming-home.tsx', file);
