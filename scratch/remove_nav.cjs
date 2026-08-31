const fs = require('fs');
let file = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');

file = file.replace("{ icon: Film, label: 'Movies', href: '/browse?tab=movies' },", "");
file = file.replace("{ icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },", "");
file = file.replace("{ icon: Smartphone, label: 'Short Drama', href: '/browse?tab=drama' },", "");

fs.writeFileSync('src/components/PublicSidebar.tsx', file);

let navFile = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
navFile = navFile.replace("{ icon: Film, label: 'Movies', href: '/browse?tab=movies' },", "");
navFile = navFile.replace("{ icon: Smartphone, label: 'Drama', href: '/browse?tab=drama' },", "");

fs.writeFileSync('src/components/MobileNav.tsx', navFile);
