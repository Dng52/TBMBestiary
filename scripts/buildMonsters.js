// scripts/buildMonsters.js
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
const outputFile = path.join(dataDir, "monsters.json");

async function buildMonsters() {
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json") && f !== "monsters.json");

    const monsters = files.map(file => {
      const filePath = path.join(dataDir, file);
      const raw = fs.readFileSync(filePath, "utf8");
      const m = JSON.parse(raw);

      // Add helper fields
      m._file = file;
      m._displayName = m.name || file.replace(".json", "");

      return m;
    });

    fs.writeFileSync(outputFile, JSON.stringify(monsters, null, 2), "utf8");
    console.log(`Built ${monsters.length} monsters into monsters.json`);
  } catch (err) {
    console.error("Error building monsters.json:", err);
  }
}

buildMonsters();
