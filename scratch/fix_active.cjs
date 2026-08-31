const fs = require('fs');
let file = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');

// Fix active state: /browse should only be active for exact match
file = file.replace(
  `const isActive = location === item.href || \n            (item.href !== '/' && location.startsWith(item.href!.split('?')[0]));`,
  `const isActive = location === item.href || 
            (item.href !== '/' && item.href !== '/browse' && location.startsWith(item.href!.split('?')[0])) ||
            (item.href === '/browse' && location === '/browse');`
);

fs.writeFileSync('src/components/PublicSidebar.tsx', file);

let nav = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
nav = nav.replace(
  `const isActive = location === tab.href || \n            (tab.href !== '/' && location.startsWith(tab.href.split('?')[0]));`,
  `const isActive = location === tab.href || 
            (tab.href !== '/' && tab.href !== '/browse' && location.startsWith(tab.href.split('?')[0])) ||
            (tab.href === '/browse' && location === '/browse');`
);
fs.writeFileSync('src/components/MobileNav.tsx', nav);
console.log("Fixed active states");
