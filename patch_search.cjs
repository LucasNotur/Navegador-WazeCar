const fs = require('fs');
let code = fs.readFileSync('src/components/SearchScreen.tsx', 'utf8');

// Add locationBias to getPlacePredictions
code = code.replace(
  "autocompleteService.getPlacePredictions({ input: searchValue }, (preds, status) => {",
  "autocompleteService.getPlacePredictions({ input: searchValue, locationBias: { radius: 50000, center: { lat: -22.9068, lng: -43.1729 } } }, (preds, status) => {"
);

fs.writeFileSync('src/components/SearchScreen.tsx', code);
