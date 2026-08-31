const fs = require('fs');

let file = fs.readFileSync('src/App.tsx', 'utf8');

const imports = `import CategoriesBrowsePage from "@/pages/categories-browse";
import MoviesPublicPage from "@/pages/movies-public";
import ShortDramasPublicPage from "@/pages/short-dramas-public";
import NewHotPublicPage from "@/pages/new-hot-public";`;
file = file.replace('import CategoriesBrowsePage from "@/pages/categories-browse";', imports);

const routes = `<Route path="/browse/:tab" component={CategoriesBrowsePage} />
      <Route path="/browse" component={CategoriesBrowsePage} />
      <Route path="/movies" component={MoviesPublicPage} />
      <Route path="/short-dramas" component={ShortDramasPublicPage} />
      <Route path="/new-hot" component={NewHotPublicPage} />`;
file = file.replace('<Route path="/browse/:tab" component={CategoriesBrowsePage} />\n      <Route path="/browse" component={CategoriesBrowsePage} />', routes);

fs.writeFileSync('src/App.tsx', file);
console.log("Updated App.tsx");
