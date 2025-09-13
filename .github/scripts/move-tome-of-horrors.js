const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data");
const oldDataDir = path.join(__dirname, "../../olddata");

// Make sure /olddata exists
if (!fs.existsSync(oldDataDir)) {
  fs.mkdirSync(oldDataDir);
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json") && f !== "index.json");

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (content.tags && content.tags.includes("homebrew")) {
      const newPath = path.join(oldDataDir, file);
      fs.renameSync(filePath, newPath);
      console.log(`Moved ${file} to /olddata`);
    }
  } catch (err) {
    console.error(`Could not parse ${file}:`, err.message);
  }
});
