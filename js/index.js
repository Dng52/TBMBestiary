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
    const entries = await fetch("data/index.json")
      .then(r => { if (!r.ok) throw new Error(`Failed to load index.json: ${r.status}`); return r.json(); });

    const monsters = await Promise.all(entries.map(async e => {
      try {
        const res = await fetch(`data/${e.file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const m = await res.json();
        m._file = e.file;
        m._displayName = e.name;
        m._cleanCR = cleanCR(m.cr);
        m._crSortValue = parseCR(m.cr);
        return m;
      } catch (err) {
        console.error(`Failed to load ${e.file}:`, err);
        return null;
      }
    }));

    const validMonsters = monsters.filter(m => m);

    validMonsters.sort((a, b) => {
      const crA = a._crSortValue, crB = b._crSortValue;
      const aNaN = isNaN(crA), bNaN = isNaN(crB);
      if (aNaN && bNaN) return a._displayName.localeCompare(b._displayName);
      if (aNaN) return 1;
      if (bNaN) return -1;
      if (crA !== crB) return crA - crB;
      return a._displayName.localeCompare(b._displayName);
    });

    // -----------------------------
    // DOM Elements
    // -----------------------------
    const listEl = document.getElementById("monster-list");
    const typesEl = document.getElementById("creature-types");
    const crEl = document.getElementById("cr-filters");
    const sourceEl = document.getElementById("source-filters");
    const searchEl = document.getElementById("search");

    // -----------------------------
    // State
    // -----------------------------
    const activeTypes = new Set();
    const activeCRs = new Set();
    const activeSources = new Set();

    // -----------------------------
    // Helper: format source material
    // -----------------------------
    function formatSource(name) {
      return name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    }

    // -----------------------------
    // Type Filters
    // -----------------------------
    const creatureTypes = [
      "aberration","beast","celestial","construct","dragon","elemental",
      "fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"
    ];

    typesEl.innerHTML = creatureTypes.map(t =>
      `<span class="filter-button" data-type="${t}">${t}</span>`
    ).join("");

    typesEl.querySelectorAll(".filter-button").forEach(btn => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.type;
        if (activeTypes.has(t)) { activeTypes.delete(t); btn.classList.remove("active"); }
        else { activeTypes.add(t); btn.classList.add("active"); }
        applyFilters();
      });
    });

    // -----------------------------
    // CR Filters
    // -----------------------------
    const uniqueCRs = [...new Set(
      validMonsters.map(m => isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean)
    )].sort((a, b) => parseCR(a) - parseCR(b));

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

    // -----------------------------
    // Source Filters
    // -----------------------------
    const uniqueSources = [...new Set(
      validMonsters.map(m => m.tags?.[m.tags.length - 1]).filter(Boolean)
    )].sort();

    sourceEl.innerHTML = uniqueSources.map(src =>
      `<span class="filter-button" data-source="${src}">${formatSource(src)}</span>`
    ).join("");

    sourceEl.querySelectorAll(".filter-button").forEach(btn => {
      btn.addEventListener("click", () => {
        const src = btn.dataset.source;
        if (activeSources.has(src)) { activeSources.delete(src); btn.classList.remove("active"); }
        else { activeSources.add(src); btn.classList.add("active"); }
        applyFilters();
      });
    });

    // -----------------------------
    // Search
    // -----------------------------
    searchEl.addEventListener("input", () => applyFilters());

    // -----------------------------
    // Apply Filters
    // -----------------------------
    function applyFilters() {
      const query = searchEl.value.toLowerCase();

      const filtered = validMonsters.filter(m => {
        // Search
        if (query && !m._displayName.toLowerCase().includes(query)) return false;

        // Type filter (AND logic)
        if (activeTypes.size > 0 && !activeTypes.has(m.type)) return false;

        // CR filter (OR logic)
        if (activeCRs.size > 0 && !activeCRs.has(m._cleanCR)) return false;

        // Source filter (OR logic)
        if (activeSources.size > 0 && !activeSources.has(m.tags?.[m.tags.length - 1])) return false;

        return true;
      });

      renderList(filtered);
    }

    // -----------------------------
    // Render List
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
        li.innerHTML = `<a href="monster.html?file=${encodeURIComponent(m._file)}">${m._displayName}</a>`;
        listEl.appendChild(li);
      });
    }

    // Initial render
    renderList(validMonsters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  } finally {
    console.log("Finished attempting to load monsters");
  }
}

loadMonsters();
