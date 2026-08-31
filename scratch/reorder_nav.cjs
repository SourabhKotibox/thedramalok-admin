const fs = require('fs');

let sidebar = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  /const NAV_ITEMS = \[[\s\S]*?\];/,
  `const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/browse' },
  { icon: Smartphone, label: 'Short Drama', href: '/browse/drama' },
  { icon: Film, label: 'Movies', href: '/browse/movies' },
  { icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },
  { icon: Flame, label: 'New & Hot', href: '/browse/new' },
  { icon: Mic, label: 'Stories', href: '/stories' },
  { icon: User, label: 'My Space', href: '/account' },
];`
);
fs.writeFileSync('src/components/PublicSidebar.tsx', sidebar);

let mobile = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
mobile = mobile.replace(
  /const TABS = \[[\s\S]*?\];/,
  `const TABS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/browse' },
  { icon: Smartphone, label: 'Drama', href: '/browse/drama' },
  { icon: Film, label: 'Movies', href: '/browse/movies' },
  { icon: Tv, label: 'TV', href: '/tv-shows-browse' },
  { icon: Flame, label: 'New', href: '/browse/new' },
  { icon: User, label: 'Me', href: '/account' },
];`
);
if (!mobile.includes('Flame')) {
    mobile = mobile.replace(/Mic, User }/, 'Flame, Mic, User }');
}
fs.writeFileSync('src/components/MobileNav.tsx', mobile);
console.log("Reordered navs");
