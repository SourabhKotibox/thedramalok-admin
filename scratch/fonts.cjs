const fs = require('fs');

// Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">',
  '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">'
);
fs.writeFileSync('index.html', html);

// Update index.css
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/--app-font-sans: 'Plus Jakarta Sans', 'Inter', sans-serif;/g, "--app-font-sans: 'Poppins', sans-serif;");
css = css.replace(/--app-font-sans: 'Plus Jakarta Sans', sans-serif;/g, "--app-font-sans: 'Poppins', sans-serif;");
css = css.replace(/var\(--app-font-sans, 'Inter'\)/g, "var(--app-font-sans, 'Poppins')");

fs.writeFileSync('src/index.css', css);
console.log("Updated fonts");
