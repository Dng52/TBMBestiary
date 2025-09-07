// -----------------------------
// CR Parsing Helpers
// -----------------------------

// Parse CR for sorting: converts fractions to decimal, ignores XP
function parseCR(cr) {
  if (!cr) return NaN; // treat missing as NaN

  cr = cr.replace(/\(.*?\)/, "").trim(); // Remove XP

  if (cr === "0") return 0;
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return den ? num / den : NaN;
  }

  const val = parseFloat(cr);
  return isNaN(val) ? NaN : val;
}

// Clean CR string for display (removes XP)
function cleanCR(cr) {
  if (!cr) return "?";
  return cr.replace(/\(.*?\)/, "").trim();
}

// -----------------------------
// State
// -----------------------------
let selectedFilters = {
  type: new Set(),
  cr: new Set()
};

// -----------------------------
// Main Loader
// -----------------------------
async function loadMonsters() {
  try {
    const entries = await fetch("data/index.json")
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load index.json: ${r.status}`);
        return r.json();
      });

    // Load each monster JSON with individual error handling
    const monsters = await Promise.all(entries.map(async e => {
      try {
        const res = await fetch(`data/${e.file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const m = await res.json();
        m._file = e.file;
        m._displayName = e.name;
        m._cleanCR = cleanCR(m.cr);        // for headings
        m._crSortValue = parseCR(m.cr);    // numeric value for sorting
        return m;
      } catch (err) {
        console.error(`Failed to load ${e.file}:`, err);
        return null; // skip this monster
      }
    }));

    // Remove any failed loads
    const validMonsters = monsters.filter(m => m);

    // Sort by CR numeric value, putting NaN CRs at the bottom, then name
    validMonsters.sort((a, b) => {
      const crA = a._crSortValue;
      const crB = b._crSortValue;

      const aIsNaN = isNaN(crA);
      const bIsNaN = isNaN(crB);

      if (aIsNaN && bIsNaN) return a._displayName.localeCompare(b._displayName);
      if (aIsNaN) return 1; // a goes after b
      if (bIsNaN) return -1; // b goes after a

      if (crA !== crB) return crA - crB;
      return a._displayName.localeCompare(b._displayName);
    });

    // Setup UI
    const listEl = document.getElementById("monster-list");
    const typesEl = document.getElementById("creature-types");
    const crEl = document.getElementById("cr-filters");
    const searchEl = document.getElementById("search");

    const creatureTypes = [
      "aberration", "beast", "celestial", "construct", "dragon", "elemental",
      "fey", "fiend", "giant", "humanoid", "monstrosity", "ooze", "plant", "undead"
    ];

    // Unique CRs from dataset (excluding NaN)
    const uniqueCRs = [...new Set(
      validMonsters
        .map(m => m._cleanCR)
        .filter(c => c !== "?" && c !== "Undefined")
    )].sort((a, b) => parseCR(a) - parseCR(b));

    // Render type filters
    typesEl.innerHTML = creatureTypes.map(t => 
      `<button class="filter-button" data-type="type" data-value="${t}">${t}</button>`
    ).join(" ");

    // Render CR filters
    crEl.innerHTML = uniqueCRs.map(c =>
      `<button class="filter-button" data-type="cr" data-value="${c}">CR ${c}</button>`
    ).join(" ");

    // Hook up event listeners
    document.querySelectorAll(".filter-button").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        const val = btn.dataset.value;
        toggleFilter(type, val);
      });
    });

    searchEl.addEventListener("input", () => {
      renderList(validMonsters);
    });

    renderList(validMonsters);

    // -----------------------------
    // Filtering + Rendering
    // -----------------------------
    function toggleFilter(filterType, value) {
      const set = selectedFilters[filterType];
      if (set.has(value)) {
        set.delete(value); // turn off
      } else {
        set.add(value); // turn on
      }
      updateFilterUI();
      renderList(validMonsters);
    }

    function updateFilterUI() {
      document.querySelectorAll(".filter-button").forEach(btn => {
        const type = btn.dataset.type;
        const val = btn.dataset.value;
        if (selectedFilters[type].has(val)) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    function renderList(data) {
      const query = searchEl.value.toLowerCase();

      let filtered = data;

      // Apply type filters (AND logic)
      if (selectedFilters.type.size > 0) {
        filtered = filtered.filter(m => selectedFilters.type.has(m.type));
      }

      // Apply CR filters (OR logic)
      if (selectedFilters.cr.size > 0) {
        filtered = filtered.filter(m => selectedFilters.cr.has(m._cleanCR));
      }

      // Apply search
      if (query) {
        filtered = filtered.filter(m =>
          m._displayName.toLowerCase().includes(query)
        );
      }

      // Clear
      listEl.innerHTML = "";
      let currentCR = null;

      filtered.forEach(m => {
        // Display 'Undefined' for non-numeric CR
        let crVal = isNaN(m._crSortValue) ? "Undefined" : m._cleanCR;

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

  } catch (err) {
    console.error("Failed to load monsters:", err);
  } finally {
    console.log("Finished attempting to load monsters");
  }
}

loadMonsters();
