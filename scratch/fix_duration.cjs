const fs = require('fs');
let file = fs.readFileSync('src/components/ContentCard.tsx', 'utf8');

file = file.replace(
  /const duration = item.duration \? \`\$\{item.duration\}m\` : "";/g,
  'const duration = item.duration ? (String(item.duration).includes("m") ? String(item.duration) : `${item.duration}m`) : "";'
);

fs.writeFileSync('src/components/ContentCard.tsx', file);
console.log("Fixed duration format");
