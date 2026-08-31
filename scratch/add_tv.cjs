const fs = require('fs');

let file = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');
if (!file.includes('TV Shows')) {
    file = file.replace(
        "{ icon: Mic, label: 'Stories', href: '/stories' },",
        "{ icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },\n  { icon: Mic, label: 'Stories', href: '/stories' },"
    );
    fs.writeFileSync('src/components/PublicSidebar.tsx', file);
}

let nav = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
if (!nav.includes('TV Shows')) {
    nav = nav.replace(
        "{ icon: User, label: 'My Space', href: '/account' },",
        "{ icon: Tv, label: 'TV Shows', href: '/tv-shows-browse' },\n  { icon: User, label: 'My Space', href: '/account' },"
    );
    // Wait, in MobileNav, the import might be missing Tv. Let's add it.
    if (!nav.includes('Tv,')) {
        nav = nav.replace('Smartphone }', 'Smartphone, Tv }');
    }
    fs.writeFileSync('src/components/MobileNav.tsx', nav);
}
console.log("Added TV Shows back");
