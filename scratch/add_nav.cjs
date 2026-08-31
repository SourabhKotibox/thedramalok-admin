const fs = require('fs');

let sidebar = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  "{ icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },",
  "{ icon: Film, label: 'Movies', href: '/browse/movies' },\n  { icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },\n  { icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },"
);
// Make sure Film and Smartphone are imported
if (!sidebar.includes('Film,')) {
    sidebar = sidebar.replace('Tv,', 'Film, Tv, Smartphone,');
}
fs.writeFileSync('src/components/PublicSidebar.tsx', sidebar);

let mobile = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
mobile = mobile.replace(
  "{ icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },",
  "{ icon: Film, label: 'Movies', href: '/browse/movies' },\n  { icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },\n  { icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },"
);
if (!mobile.includes('Film,')) {
    mobile = mobile.replace('Tv }', 'Film, Smartphone, Tv }');
}
fs.writeFileSync('src/components/MobileNav.tsx', mobile);
console.log("Added missing pages back to navbar");
