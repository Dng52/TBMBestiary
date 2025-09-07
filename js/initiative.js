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

function formatSource(name) {
  return name.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// -----------------------------
// Main Loader
// -----------------------------
async function loadMonsters() {
  try {
    const monsters = await fetch("data/monsters.json").then(r => r.json());

    // Compute CR helpers
    monsters.forEach(m => {
      m._cleanCR = cleanCR(m.cr);
      m._crSortValue = parseCR(m.cr);
      if (!m.tags) m.tags = [];
    });

    monsters.sort((a, b) => {
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

    // DOM Elements
    const listEl = document.getElementById("monster-list");
    const typesEl = document.getElementById("creature-types");
    const crEl = document.getElementById("cr-filters");
    const sourceEl = document.getElementById("source-filters");
    const searchEl = document.getElementById("search");
    const trackerBody = document.querySelector("#initiative-table tbody");
    const statBlockEl = document.getElementById("stat-block");

    // Creature Types
    const creatureTypes = [
      "aberration","beast","celestial","construct","dragon","elemental",
      "fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"
    ];

    creatureTypes.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      typesEl.appendChild(opt);
    });

    // CR Filters
    const uniqueCRs = [...new Set(
      monsters.map(m => isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean)
    )].sort((a, b) => parseCR(a) - parseCR(b));

    uniqueCRs.forEach(cr => {
      const opt = document.createElement("option");
      opt.value = cr;
      opt.textContent = cr;
      crEl.appendChild(opt);
    });

    // Source Filters
    const uniqueSources = [...new Set(
      monsters.map(m => m.tags[m.tags.length - 1]).filter(Boolean)
    )].sort();

    uniqueSources.forEach(src => {
      const opt = document.createElement("option");
      opt.value = src;
      opt.textContent = formatSource(src);
      sourceEl.appendChild(opt);
    });

    // Apply Filters
    function applyFilters() {
      const query = searchEl.value.toLowerCase();

      const activeTypes = new Set(Array.from(typesEl.selectedOptions).map(o => o.value));
      const activeCRs = new Set(Array.from(crEl.selectedOptions).map(o => o.value));
      const activeSources = new Set(Array.from(sourceEl.selectedOptions).map(o => o.value));

      const filtered = monsters.filter(m => {
        if (query && !(m._displayName || m.name || "").toLowerCase().includes(query)) return false;
        if (activeTypes.size > 0 && !activeTypes.has(m.type)) return false;
        if (activeCRs.size > 0 && !activeCRs.has(m._cleanCR)) return false;
        if (activeSources.size > 0 && !activeSources.has(m.tags[m.tags.length - 1])) return false;
        return true;
      });

      renderList(filtered);
    }

    // Render Monster List
    function renderList(data) {
      listEl.innerHTML = "";
      data.forEach(m => {
        const row = document.createElement("div");
        row.className = "monster-row";
        row.textContent = `${m._displayName || m.name} (CR ${m._cleanCR}, ${m.type}, ${formatSource(m.tags[m.tags.length - 1])})`;
        row.addEventListener("click", () => addToTracker(m));
        listEl.appendChild(row);
      });
    }

    // Add to Tracker
    function addToTracker(monster) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td contenteditable="true"></td>
        <td>${monster._displayName || monster.name}</td>
        <td>${monster.ac || ""}</td>
        <td contenteditable="true">${monster.hp || ""}</td>
        <td contenteditable="true"></td>
      `;
      tr.addEventListener("click", () => showStatBlock(monster));
      trackerBody.appendChild(tr);
    }

    // Show Stat Block
    async function showStatBlock(monster) {
      try {
        const data = await fetch(`data/${monster._file}`).then(r => r.json());
        statBlockEl.innerHTML = `
          <h2>${data.name}</h2>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
      } catch (err) {
        statBlockEl.textContent = "Failed to load stat block.";
      }
    }

    // Event Listeners
    searchEl.addEventListener("input", applyFilters);
    typesEl.addEventListener("change", applyFilters);
    crEl.addEventListener("change", applyFilters);
    sourceEl.addEventListener("change", applyFilters);

    // Initial render
    renderList(monsters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  }
}

loadMonsters();
