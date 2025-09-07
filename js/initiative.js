// -----------------------------
// CR Parsing Helpers
// -----------------------------
function parseCR(cr) {
  if (!cr) return NaN;
  cr = cr.replace(/\(.*?\)/, "").trim();
  if (cr === "0") return 0;
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return den ? num / den : NaN;
  }
  const val = parseFloat(cr);
  return isNaN(val) ? NaN : val;
}

function cleanCR(cr) {
  if (!cr) return "?";
  return cr.replace(/\(.*?\)/, "").trim();
}

// -----------------------------
// DOM Elements
// -----------------------------
const searchEl = document.getElementById("search");
const typeFiltersEl = document.getElementById("type-filters");
const crFiltersEl = document.getElementById("cr-filters");
const sourceFiltersEl = document.getElementById("source-filters");
const listEl = document.getElementById("monster-list");
const trackerBody = document.getElementById("tracker-body");
const statBlockEl = document.getElementById("stat-block");

// -----------------------------
// State
// -----------------------------
const activeTypes = new Set();
const activeCRs = new Set();
const activeSources = new Set();
let monsters = [];

// -----------------------------
// Load Monsters
// -----------------------------
async function loadMonsters() {
  try {
    monsters = await fetch("data/monsters.json").then(r => r.json());
    monsters.forEach(m => {
      m._cleanCR = cleanCR(m.cr);
      m._crSortValue = parseCR(m.cr);
      if (!m.tags) m.tags = [];
    });

    renderFilters();
    renderMonsterList(monsters);

    searchEl.addEventListener("input", applyFilters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  }
}

// -----------------------------
// Render Filters
// -----------------------------
function renderFilters() {
  // Type
  const types = [
    "aberration","beast","celestial","construct","dragon","elemental",
    "fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"
  ];
  typeFiltersEl.innerHTML = "";
  types.forEach(type => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${type}">${type}`;
    label.querySelector("input").addEventListener("change", e => {
      if (e.target.checked) activeTypes.add(type);
      else activeTypes.delete(type);
      applyFilters();
    });
    typeFiltersEl.appendChild(label);
  });

  // CR
  const crs = [...new Set(monsters.map(m => isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean))]
    .sort((a,b) => parseCR(a)-parseCR(b));
  crFiltersEl.innerHTML = "";
  crs.forEach(cr => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${cr}">${cr}`;
    label.querySelector("input").addEventListener("change", e => {
      if (e.target.checked) activeCRs.add(cr);
      else activeCRs.delete(cr);
      applyFilters();
    });
    crFiltersEl.appendChild(label);
  });

  // Source
  const sources = [...new Set(monsters.map(m => m.tags[m.tags.length-1]).filter(Boolean))].sort();
  sourceFiltersEl.innerHTML = "";
  sources.forEach(src => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${src}">${src}`;
    label.querySelector("input").addEventListener("change", e => {
      if (e.target.checked) activeSources.add(src);
      else activeSources.delete(src);
      applyFilters();
    });
    sourceFiltersEl.appendChild(label);
  });
}

// -----------------------------
// Apply Filters
// -----------------------------
function applyFilters() {
  const query = searchEl.value.toLowerCase();

  const filtered = monsters.filter(m => {
    if (query && !(m._displayName || m.name || "").toLowerCase().includes(query)) return false;
    if (activeTypes.size && !activeTypes.has(m.type)) return false;
    if (activeCRs.size && !activeCRs.has(m._cleanCR)) return false;
    if (activeSources.size && !activeSources.has(m.tags[m.tags.length-1])) return false;
    return true;
  });

  renderMonsterList(filtered);
}

// -----------------------------
// Render Monster List
// -----------------------------
function renderMonsterList(data) {
  listEl.innerHTML = "";
  data.forEach(m => {
    const div = document.createElement("div");
    div.className = "monster-link";
    div.textContent = m._displayName || m.name;
    div.addEventListener("click", () => {
      addToTracker(m);
      renderStatBlock(m);
    });
    listEl.appendChild(div);
  });
}

// -----------------------------
// Add Monster to Tracker
// -----------------------------
function addToTracker(monster) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${monster._displayName || monster.name}</td>
    <td><input type="number" value="0" style="width:50px;"></td>
    <td>${monster.ac || "?"}</td>
    <td><input type="number" value="${monster.hp || 0}" style="width:60px;"></td>
    <td><input type="text" style="width:100%;"></td>
    <td><button class="remove-btn">Remove</button></td>
  `;

  row.querySelector(".remove-btn").addEventListener("click", () => row.remove());
  const hpInput = row.querySelector("input[type='number']:nth-of-type(2)");
  hpInput.addEventListener("input", () => {
    if (hpInput.value < 0) hpInput.value = 0;
  });

  trackerBody.appendChild(row);
}

// -----------------------------
// Render Stat Block (right panel)
// -----------------------------
function renderStatBlock(monster) {
  statBlockEl.innerHTML = `
    <div class="stat-block">
      <h1>${monster._displayName || monster.name}</h1>
      <h5>${monster.size || "Medium"} ${monster.type || ""}${monster.alignment ? `, ${monster.alignment}` : ""}</h5>
      <hr class="orange-border">
      <div class="property-line"><h4>AC&nbsp</h4><p>${monster.ac}</p></div>
      <div class="property-line"><h4>HP&nbsp</h4><p>${monster.hp}</p></div>
      <div class="property-line"><h4>Speed&nbsp</h4><p>${monster.speed || ""}</p></div>
      <hr class="orange-border">
      <div class="abilities">
        ${Object.entries(monster.abilities || {}).map(([k,v]) => `
          <div><h4>${k.toUpperCase()}</h4><p>${v}</p></div>
        `).join("")}
      </div>
    </div>
  `;
}

// -----------------------------
// Initialize
// -----------------------------
loadMonsters();
