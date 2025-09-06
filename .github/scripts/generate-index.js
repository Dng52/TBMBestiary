const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data");

// Collect all .json files except index.json
const files = fs.readdirSync(dataDir)
  .filter(f => f.endsWith(".json") && f !== "index.json");

// Generate objects with name + file
const monsters = files.map(f => {
  // Try to read the file to extract the monster name
  try {
    const content = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
    return {
      name: content.name || f.replace(".json", ""),
      file: f
    };
  } catch (err) {
    console.error(`⚠️ Could not read ${f}, using filename only.`);
    return { name: f.replace(".json", ""), file: f };
  }
});

fs.writeFileSync(
  path.join(dataDir, "index.json"),
  JSON.stringify(monsters, null, 2)
);

console.log("✅ Generated index.json with", monsters.length, "files");
