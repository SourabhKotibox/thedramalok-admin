const fs = require('fs');
let sidebar = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');

sidebar = sidebar.replace("{ icon: Film, label: 'Movies', href: '/browse/movies' },\n  { icon: Film, label: 'Movies', href: '/browse/movies' },", "{ icon: Film, label: 'Movies', href: '/browse/movies' },");
sidebar = sidebar.replace("{ icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },\n  { icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },", "{ icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },");
// Also check for New & Hot
sidebar = sidebar.replace("{ icon: Flame, label: 'New & Hot', href: '/browse?tab=new' },", "{ icon: Flame, label: 'New & Hot', href: '/browse/new' },");

fs.writeFileSync('src/components/PublicSidebar.tsx', sidebar);

let mobile = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
mobile = mobile.replace("{ icon: Film, label: 'Movies', href: '/browse/movies' },\n  { icon: Film, label: 'Movies', href: '/browse/movies' },", "{ icon: Film, label: 'Movies', href: '/browse/movies' },");
mobile = mobile.replace("{ icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },\n  { icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },", "{ icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },");
fs.writeFileSync('src/components/MobileNav.tsx', mobile);
