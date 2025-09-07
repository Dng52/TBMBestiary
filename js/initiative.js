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
// Main Loader
// -----------------------------
async function loadMonsters() {
  try {
    const monsters = await fetch("data/monsters.json").then(r => r.json());

    monsters.forEach(m => {
      m._cleanCR = cleanCR(m.cr);
      m._crSortValue = parseCR(m.cr);
      if (!m.tags) m.tags = [];
    });

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

    // -----------------------------
    // DOM Elements
    // -----------------------------
    const listEl = document.getElementById("monster-list");
    const typeEl = document.getElementById("type-filters");
    const crEl = document.getElementById("cr-filters");
    const sourceEl = document.getElementById("source-filters");
    const searchEl = document.getElementById("search");

    const activeTypes = new Set();
    const activeCRs = new Set();
    const activeSources = new Set();

    function formatSource(name) {
      return name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    }

    // -----------------------------
    // Filters
    // -----------------------------
    const creatureTypes = ["aberration","beast","celestial","construct","dragon","elemental","fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"];
    typeEl.innerHTML = creatureTypes.map(t => `
      <label><input type="checkbox" data-type="${t}">${t}</label>
    `).join("");
    typeEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) activeTypes.add(cb.dataset.type);
        else activeTypes.delete(cb.dataset.type);
        applyFilters();
      });
    });

    const uniqueCRs = [...new Set(monsters.map(m => isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean))]
      .sort((a,b) => parseCR(a)-parseCR(b));
    crEl.innerHTML = uniqueCRs.map(cr => `<label><input type="checkbox" data-cr="${cr}">${cr}</label>`).join("");
    crEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) activeCRs.add(cb.dataset.cr);
        else activeCRs.delete(cb.dataset.cr);
        applyFilters();
      });
    });

    const uniqueSources = [...new Set(monsters.map(m => m.tags[m.tags.length-1]).filter(Boolean))].sort();
    sourceEl.innerHTML = uniqueSources.map(src => `<label><input type="checkbox" data-source="${src}">${formatSource(src)}</label>`).join("");
    sourceEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) activeSources.add(cb.dataset.source);
        else activeSources.delete(cb.dataset.source);
        applyFilters();
      });
    });

    // -----------------------------
    // Search
    // -----------------------------
    searchEl.addEventListener("input", () => applyFilters());

    // -----------------------------
    // Filter Logic
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
      renderList(filtered);
    }

    // -----------------------------
    // Render Monster List
    // -----------------------------
    function renderList(data) {
      listEl.innerHTML = "";
      let currentCR = null;
      data.forEach(m => {
        const crVal = isNaN(m._crSortValue) ? "Undefined" : m._cleanCR;
        if (crVal !== currentCR) {
          currentCR = crVal;
          const heading = document.createElement("h3");
          heading.textContent = crVal === "Undefined" ? "CR Undefined" : `CR ${crVal}`;
          listEl.appendChild(heading);
        }
        const li = document.createElement("div");
        li.className = "monster-link";
        li.textContent = m._displayName || m.name || m._file;
        li.dataset.file = m._file;
        li.dataset.name = m._displayName || m.name;
        li.dataset.ac = m.ac || "";
        li.dataset.hp = m.hp || "";
        li.dataset.cr = m.cr || "";
        li.addEventListener("click", () => displayStatBlock(m));
        listEl.appendChild(li);
      });
    }

    // -----------------------------
    // Display Stat Block
    // -----------------------------
    function displayStatBlock(monster) {
      const container = document.getElementById("stat-block");
      container.innerHTML = `
        <h2>${monster._displayName || monster.name}</h2>
        <p><strong>CR:</strong> ${monster.cr || "?"}</p>
        <p><strong>AC:</strong> ${monster.ac || "?"}</p>
        <p><strong>HP:</strong> ${monster.hp || "?"}</p>
        <p><strong>Type:</strong> ${monster.type || "?"}</p>
      `;
    }

    renderList(monsters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  }
}

loadMonsters();
