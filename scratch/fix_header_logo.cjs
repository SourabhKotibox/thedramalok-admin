const fs = require('fs');
let file = fs.readFileSync('src/components/PublicHeader.tsx', 'utf8');

file = file.replace(
  /const getLogoUrl = \(\) => \{\n    if \(resolvedTheme === "dark" && settings\.darkLogoUrl\) return settings\.darkLogoUrl;\n    if \(resolvedTheme === "light" && settings\.lightLogoUrl\) return settings\.lightLogoUrl;\n    return settings\.logoUrl \|\| "";\n  \};/g,
  \`const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return getImageUrl(settings.darkLogoUrl);
    if (resolvedTheme === "light" && settings.lightLogoUrl) return getImageUrl(settings.lightLogoUrl);
    return settings.logoUrl ? getImageUrl(settings.logoUrl) : "";
  };\`
);

fs.writeFileSync('src/components/PublicHeader.tsx', file);
console.log("Fixed getLogoUrl");
