const fs = require('fs');

let layout = fs.readFileSync('src/components/PublicLayout.tsx', 'utf8');
layout = layout.replace(
  `<div className="lg:hidden">\n          <PublicHeader`,
  `<div className="">\n          <PublicHeader`
);
fs.writeFileSync('src/components/PublicLayout.tsx', layout);
console.log("Fixed layout");
