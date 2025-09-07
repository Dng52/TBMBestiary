// --- CR Helpers ---
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

function cleanCR(cr) {
  if (!cr) return "?";
  return cr.replace(/\(.*?\)/, "").trim();
}

// --- Main Loader ---
async function loadMonsters() {
  try {
    const entries = await fetch("data/index.json")
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load index.json: ${r.status}`);
        return r.json();
      });

    // Load each monster JSON
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

    // Valid monsters only
    const validMonsters = monsters.filter(m => m);

    // Sort by CR then name
    validMonsters.sort((a, b) => {
      const crA = a._crSortValue;
      const crB = b._crSortValue;
      const aIsNaN = isNaN(crA);
      const bIsNaN = isNaN(crB);

      if (aIsNaN && bIsNaN) return a._displayName.localeCompare(b._displayName);
      if (aIsNaN) return 1;
      if (bIsNaN) return -1;
      if (crA !== crB) return crA - crB;
      return a._displayName.localeCompare(b._displayName);
    });

    // Elements
    const listEl = document.getElementById("monster-list");
    const typesEl = document.getElementById("creature-types");
    const crEl = document.getElementById("cr-filters");
    const searchEl = document.getElementById("search");

    // Active filters
    const activeTypes = new Set();
    const activeCRs = new Set();

    // --- Creature Types ---
    const creatureTypes = [
      "aberration", "beast", "celestial", "construct", "dragon",
      "elemental", "fey", "fiend", "giant", "humanoid",
      "monstrosity", "ooze", "plant", "undead"
    ];

    typesEl.innerHTML = creatureTypes
      .map(t => `<span class="filter-button" data-type="${t}">${t}</span>`)
      .join(" • ");

    typesEl.querySelectorAll(".filter-button").forEach(el => {
      el.addEventListener("click", () => {
        const type = el.dataset.type;
        if (activeTypes.has(type)) {
          activeTypes.delete(type);
          el.classList.remove("active");
        } else {
          activeTypes.add(type);
          el.classList.add("active");
        }
        applyFilters();
      });
    });

    // --- CR Filters ---
    const uniqueCRs = [...new Set(
      validMonsters
        .map(m => (isNaN(m._crSortValue) ? null : m._cleanCR))
        .filter(Boolean)
    )];
    uniqueCRs.sort((a, b) => parseCR(a) - parseCR(b));

    crEl.innerHTML = uniqueCRs
      .map(cr => `<span class="filter-button" data-cr="${cr}">${cr}</span>`)
      .join(" • ");

    crEl.querySelectorAll(".filter-button").forEach(el => {
      el.addEventListener("click", () => {
        const cr = el.dataset.cr;
        if (activeCRs.has(cr)) {
          activeCRs.delete(cr);
          el.classList.remove("active");
        } else {
          activeCRs.add(cr);
          el.classList.add("active");
        }
        applyFilters();
      });
    });

    // --- Search ---
    searchEl.addEventListener("input", () => {
      applyFilters();
    });

    // --- Apply Filters ---
    function applyFilters() {
      const query = searchEl.value.toLowerCase();

      const filtered = validMonsters.filter(m => {
        // Search filter
        if (query && !m._displayName.toLowerCase().includes(query)) {
          return false;
        }
        // Type filter
        if (activeTypes.size > 0 && !activeTypes.has(m.type)) {
          return false;
        }
        // CR filter
        if (activeCRs.size > 0 && !activeCRs.has(m._cleanCR)) {
          return false;
        }
        return true;
      });

      renderList(filtered);
    }

    // --- Render List ---
    function renderList(data) {
      listEl.innerHTML = "";
      let currentCR = null;

      data.forEach(m => {
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

    // Initial render
    renderList(validMonsters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  } finally {
    console.log("Finished attempting to load monsters");
  }
}

loadMonsters();
