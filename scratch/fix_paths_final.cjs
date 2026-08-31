const fs = require('fs');

let sidebar = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');
sidebar = sidebar.replace(/\/browse\?tab=movies/g, '/browse/movies');
sidebar = sidebar.replace(/\/browse\?tab=drama/g, '/browse/drama');
sidebar = sidebar.replace(/\/browse\?tab=new/g, '/browse/new');
fs.writeFileSync('src/components/PublicSidebar.tsx', sidebar);

let mobile = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
mobile = mobile.replace(/\/browse\?tab=movies/g, '/browse/movies');
mobile = mobile.replace(/\/browse\?tab=drama/g, '/browse/drama');
mobile = mobile.replace(/\/browse\?tab=new/g, '/browse/new');
fs.writeFileSync('src/components/MobileNav.tsx', mobile);
console.log("Fixed paths to use path params");
