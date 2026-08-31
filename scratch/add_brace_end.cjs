const fs = require('fs');
let file = fs.readFileSync('src/pages/streaming-home.tsx', 'utf8');

file = file.replace(
  '        })\n\n\n      {/* Subscribe Banner',
  '        })}\n\n\n      {/* Subscribe Banner'
);

fs.writeFileSync('src/pages/streaming-home.tsx', file);
