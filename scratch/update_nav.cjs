const fs = require('fs');

let sidebar = fs.readFileSync('src/components/PublicSidebar.tsx', 'utf8');
sidebar = sidebar.replace(/\/browse\/movies/g, '/movies');
sidebar = sidebar.replace(/\/browse\/drama/g, '/short-dramas');
sidebar = sidebar.replace(/\/browse\/new/g, '/new-hot');
fs.writeFileSync('src/components/PublicSidebar.tsx', sidebar);

let mobile = fs.readFileSync('src/components/MobileNav.tsx', 'utf8');
mobile = mobile.replace(/\/browse\/movies/g, '/movies');
mobile = mobile.replace(/\/browse\/drama/g, '/short-dramas');
mobile = mobile.replace(/\/browse\/new/g, '/new-hot');
fs.writeFileSync('src/components/MobileNav.tsx', mobile);
console.log("Updated nav links");
