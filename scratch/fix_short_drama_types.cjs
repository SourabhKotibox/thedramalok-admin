const fs = require('fs');
let file = fs.readFileSync('src/pages/streaming-home.tsx', 'utf8');

file = file.replace(
  'description: `${drama.episodes?.length || 0} Episodes • ${drama.views > 1000 ? (drama.views/1000).toFixed(1)+\'k\' : (drama.views || 0)} Views`',
  'description: `${drama.totalEpisodes || 0} Episodes`'
);

fs.writeFileSync('src/pages/streaming-home.tsx', file);
