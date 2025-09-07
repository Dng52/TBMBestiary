// initiative.js

// -----------------------------
// CR Helpers
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
// State
// -----------------------------
let monsters = [];
const activeTypes = new Set();
const activeCRs = new Set();
const activeSources = new Set();

// -----------------------------
// Load Monsters
// -----------------------------
async function loadMonsters() {
  try {
    monsters = await fetch("data/monsters.json").then(r => {
      if (!r.ok) throw new Error(`Failed to load monsters.json: ${r.status}`);
      return r.json();
    });

    // Compute fields
    monsters.forEach(m => {
      m._cleanCR = cleanCR(m.cr);
      m._crSortValue = parseCR(m.cr);
      if (!m.tags) m.tags = [];
    });

    // Sort consistently: CR numeric → name
    monsters.sort((a, b) => {
      const crA = a._crSortValue, crB = b._crSortValue;
      const aNaN = isNaN(crA), bNaN = isNaN(crB);
      const nameA = a._displayName || a.name || a._file || "";
      const nameB = b._displayName || b.name || b._file || "";

      if (aNaN && bNaN) return nameA.localeCompare(nameB);
      if (aNaN) return 1;
      if (bNaN) return -1;
      if (crA !== crB) return crA - crB;
      return nameA.localeCompare(nameB);
    });

    populateFilters();
    applyFilters();

  } catch (err) {
    console.error("Failed to load monsters:", err);
  }
}

// -----------------------------
// Populate Filter Buttons
// -----------------------------
function populateFilters() {
  // Creature Types
  const types = [
    "aberration","beast","celestial","construct","dragon","elemental",
    "fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"
  ];
  const typeEl = document.getElementById("filter-type");
  typeEl.innerHTML = types.map(t =>
    `<span class="filter-button" data-type="${t}">${t}</span>`
  ).join("");
  typeEl.querySelectorAll(".filter-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.type;
      if (activeTypes.has(t)) { activeTypes.delete(t); btn.classList.remove("active"); }
      else { activeTypes.add(t); btn.classList.add("active"); }
      applyFilters();
    });
  });

  // CRs
  const uniqueCRs = [...new Set(
    monsters.map(m => isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean)
  )].sort((a, b) => parseCR(a) - parseCR(b));
  const crEl = document.getElementById("filter-cr");
  crEl.innerHTML = uniqueCRs.map(cr =>
    `<span class="filter-button" data-cr="${cr}">${cr}</span>`
  ).join("");
  crEl.querySelectorAll(".filter-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const cr = btn.dataset.cr;
      if (activeCRs.has(cr)) { activeCRs.delete(cr); btn.classList.remove("active"); }
      else { activeCRs.add(cr); btn.classList.add("active"); }
      applyFilters();
    });
  });

  // Sources
  const uniqueSources = [...new Set(
    monsters.map(m => m.tags[m.tags.length - 1]).filter(Boolean)
  )].sort();
  const sourceEl = document.getElementById("filter-source");
  sourceEl.innerHTML = uniqueSources.map(src =>
    `<span class="filter-button" data-source="${src}">${src}</span>`
  ).join("");
  sourceEl.querySelectorAll(".filter-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const src = btn.dataset.source;
      if (activeSources.has(src)) { activeSources.delete(src); btn.classList.remove("active"); }
      else { activeSources.add(src); btn.classList.add("active"); }
      applyFilters();
    });
  });

  // Search
  document.getElementById("search").addEventListener("input", () => applyFilters());
}

// -----------------------------
// Apply Filters
// -----------------------------
function applyFilters() {
  const search = document.getElementById("search").value.toLowerCase();

  const filtered = monsters.filter(m => {
    const name = (m._displayName || m.name || "").toLowerCase();
    if (search && !name.includes(search)) return false;

    if (activeTypes.size > 0 && !activeTypes.has(m.type)) return false;
    if (activeCRs.size > 0 && !activeCRs.has(m._cleanCR)) return false;

    const src = m.tags[m.tags.length - 1];
    if (activeSources.size > 0 && !activeSources.has(src)) return false;

    return true;
  });

  renderMonsterTable(filtered);
}

// -----------------------------
// Render Left Monster Table
// -----------------------------
function renderMonsterTable(data) {
  const tbody = document.querySelector("#monster-table tbody");
  tbody.innerHTML = "";

  data.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m._displayName || m.name || m._file}</td>
      <td>${m.type || ""}</td>
      <td>${m._cleanCR}</td>
      <td>${m.tags[m.tags.length - 1] || ""}</td>
    `;
    tr.addEventListener("click", () => addToInitiative(m));
    tbody.appendChild(tr);
  });
}

// -----------------------------
// Middle Panel: Initiative Tracker
// -----------------------------
function addToInitiative(monster) {
  const tracker = document.getElementById("initiative-table").querySelector("tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${monster._displayName || monster.name || monster._file}</td>
    <td><input type="number" value="0" style="width:50px"></td>
    <td>${monster.ac || ""}</td>
    <td>${monster.hp || ""}</td>
    <td><input type="text" placeholder="Notes"></td>
  `;
  tr.addEventListener("click", () => showStatBlock(monster));
  tracker.appendChild(tr);
}

// -----------------------------
// Right Panel: Stat Block Preview
// -----------------------------
function showStatBlock(monster) {
  const panel = document.getElementById("statblock-panel");
  panel.innerHTML = `
    <h2>${monster._displayName || monster.name}</h2>
    <p><strong>Type:</strong> ${monster.size || "Medium"} ${monster.type || ""}</p>
    <p><strong>CR:</strong> ${monster._cleanCR}</p>
    <p><strong>AC:</strong> ${monster.ac || "?"}</p>
    <p><strong>HP:</strong> ${monster.hp || "?"}</p>
    <p><strong>Source:</strong> ${monster.tags[m.tags.length - 1] || ""}</p>
  `;
}

// -----------------------------
// Init
// -----------------------------
loadMonsters();
