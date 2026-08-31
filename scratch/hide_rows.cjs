const fs = require('fs');
let file = fs.readFileSync('src/pages/streaming-home.tsx', 'utf8');

file = file.replace(
  'const webSections = (sectionsData?.data || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));',
  `const webSections = (sectionsData?.data || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).filter((s: any) => {
    const t = (s.title || '').toLowerCase();
    const type = (s.contentType || '').toLowerCase();
    return !t.includes('movie') && !t.includes('drama') && type !== 'movie' && type !== 'drama';
  });`
);

fs.writeFileSync('src/pages/streaming-home.tsx', file);
console.log("Hid rows");
