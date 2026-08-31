const fs = require('fs');

let sidebar = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');
sidebar = sidebar.replace(/\/browse\/movies/g, '/browse?tab=movies');
sidebar = sidebar.replace(/\/browse\/drama/g, '/browse?tab=drama');
sidebar = sidebar.replace(/\/browse\/new/g, '/browse?tab=new');
fs.writeFileSync('src/components/PublicSidebar.tsx', sidebar);

let mobile = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
mobile = mobile.replace(/\/browse\/movies/g, '/browse?tab=movies');
mobile = mobile.replace(/\/browse\/drama/g, '/browse?tab=drama');
fs.writeFileSync('src/components/MobileNav.tsx', mobile);
console.log("Fixed paths");
