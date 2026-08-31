const fs = require('fs');
let file = fs.readFileSync('src/components/ContentCard.tsx', 'utf8');

// Insert cleanText function
const cleanTextFunc = `
function cleanText(str?: string) {
  if (!str) return "";
  return str.replace(/kotibox ott/gi, 'The Drama Lock').replace(/kotibox/gi, 'The Drama Lock');
}
`;

// Replace item.title with cleanText(item.title) etc.
// But it's easier to just sanitize the item object at the top of PortraitCard and LandscapeCard.
// Find "export function PortraitCard({ item,"
// and insert: "const cleanItem = { ...item, title: cleanText(item.title), description: cleanText(item.description) };"
// Then replace "item." with "cleanItem." inside the component.

// We can just regex replace item.title and item.description
file = file.replace(/item\.title/g, 'cleanText(item.title)');
file = file.replace(/item\.description/g, 'cleanText(item.description)');

// Then we just inject the function at the top after imports.
const lastImport = file.lastIndexOf("import ");
const nextLine = file.indexOf("\n", lastImport) + 1;
file = file.slice(0, nextLine) + "\n" + cleanTextFunc + "\n" + file.slice(nextLine);

fs.writeFileSync('src/components/ContentCard.tsx', file);
console.log("Fixed ContentCard");
