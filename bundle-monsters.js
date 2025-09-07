// bundle-monsters.js
const fs = require("fs");
const path = require("path");

// Folder where your individual monster JSONs are stored
const monstersFolder = path.join(__dirname, "data");
// Output file
const outputFile = path.join(monstersFolder, "monsters.json");

// Load index.json
const indexFile = path.join(monstersFolder, "index.json");
const indexData = JSON.parse(fs.readFileSync(indexFile, "utf8"));

// Collect all monsters
const allMonsters = [];

indexData.forEach(entry => {
  const filePath = path.join(monstersFolder, entry.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${entry.file}, skipping`);
    return;
  }
  try {
    const monster = JSON.parse(fs.readFileSync(filePath, "utf8"));
    monster._file = entry.file;        // keep original filename if needed
    monster._displayName = entry.name; // keep display name
    allMonsters.push(monster);
  } catch (err) {
    console.error(`Failed to parse ${entry.file}:`, err);
  }
});

// Save bundled file
fs.writeFileSync(outputFile, JSON.stringify(allMonsters, null, 2), "utf8");
console.log(`Bundled ${allMonsters.length} monsters into ${outputFile}`);
