const fs = require('fs');
let file = fs.readFileSync('src/pages/stories-public.tsx', 'utf8');

const cleanTextFunc = `
function cleanText(str?: string) {
  if (!str) return "";
  return str.replace(/kotibox ott/gi, 'The Drama Lock').replace(/kotibox/gi, 'The Drama Lock');
}
`;

const lastImport = file.lastIndexOf("import ");
const nextLine = file.indexOf("\n", lastImport) + 1;
file = file.slice(0, nextLine) + "\n" + cleanTextFunc + "\n" + file.slice(nextLine);

file = file.replace(/{item\.title}/g, '{cleanText(item.title)}');
file = file.replace(/{item\.description /g, '{cleanText(item.description) ');

fs.writeFileSync('src/pages/stories-public.tsx', file);
console.log("Fixed stories page");
