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
    // Fetch monsters.json
    const validMonsters = await fetch("data/monsters.json")
      .then(r => { 
        if (!r.ok) throw new Error(`Failed to load monsters.json: ${r.status}`); 
        return r.json();
      });

    // Compute display values
    validMonsters.forEach(m => {
      m._cleanCR = cleanCR(m.cr);
      m._crSortValue = parseCR(m.cr);
      if (!m.tags) m.tags = [];
    });

    // Sort by CR, NaN at bottom, then by name
    validMonsters.sort((a, b) => {
      const crA = a._crSortValue, crB = b._crSortValue;
      const aNaN = isNaN(crA), bNaN = isNaN(crB);
      const nameA = a._displayName || a.name || a.file || "";
      const nameB = b._displayName || b.name || b.file || "";
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
    // Create Checkbox Filters
    // -----------------------------
    function createCheckboxGroup(container, items, set, className) {
      container.innerHTML = "";
      items.forEach(item => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = item;
        checkbox.classList.add("filter-checkbox", className);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + item));
        container.appendChild(label);

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) set.add(item);
          else set.delete(item);
          applyFilters();
        });
      });
    }

    // -----------------------------
    // Type Filters
    // -----------------------------
    const creatureTypes = [
      "aberration","beast","celestial","construct","dragon","elemental",
      "fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"
    ];
    createCheckboxGroup(typesEl, creatureTypes, activeTypes, "type-filter");

    // -----------------------------
    // CR Filters
    // -----------------------------
    const uniqueCRs = [...new Set(
      validMonsters.map(m => isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean)
    )].sort((a, b) => parseCR(a) - parseCR(b));
    createCheckboxGroup(crEl, uniqueCRs, activeCRs, "cr-filter");

    // -----------------------------
    // Source Filters
    // -----------------------------
    const uniqueSources = [...new Set(
      validMonsters.map(m => m.tags[m.tags.length - 1]).filter(Boolean)
    )].sort();
    createCheckboxGroup(sourceEl, uniqueSources, activeSources, "source-filter");

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
        if (query && !(m._displayName || m.name || "").toLowerCase().includes(query)) return false;
        if (activeTypes.size > 0 && !activeTypes.has(m.type)) return false;
        if (activeCRs.size > 0 && !activeCRs.has(m._cleanCR)) return false;
        if (activeSources.size > 0 && !activeSources.has(m.tags[m.tags.length - 1])) return false;
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
        li.innerHTML = `<a href="monster.html?file=${encodeURIComponent(m._file)}">${m._displayName || m.name || m._file}</a>`;
        listEl.appendChild(li);
      });
    }

    // Initial render
    renderList(validMonsters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  }
}

loadMonsters();
