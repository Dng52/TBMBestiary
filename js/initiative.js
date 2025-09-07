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
    const monsters = await fetch("data/monsters.json")
      .then(r => { if (!r.ok) throw new Error("Failed to load monsters.json"); return r.json(); });

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

    // DOM elements
    const listEl = document.getElementById("monster-list");
    const typesEl = document.getElementById("creature-types");
    const crEl = document.getElementById("cr-filters");
    const sourceEl = document.getElementById("source-filters");
    const searchEl = document.getElementById("search");

    const activeTypes = new Set();
    const activeCRs = new Set();
    const activeSources = new Set();

    // Format sources
    function formatSource(name) {
      return name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    }

    // -----------------------------
    // Creature Types (Checkboxes)
    // -----------------------------
    const creatureTypes = [
      "aberration","beast","celestial","construct","dragon","elemental",
      "fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"
    ];

    typesEl.innerHTML = creatureTypes.map(t =>
      `<label><input type="checkbox" value="${t}"> ${t}</label>`
    ).join("");

    typesEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) activeTypes.add(cb.value);
        else activeTypes.delete(cb.value);
        applyFilters();
      });
    });

    // -----------------------------
    // CR Filters (Checkboxes)
    // -----------------------------
    const uniqueCRs = [...new Set(
      monsters.map(m => isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean)
    )].sort((a, b) => parseCR(a) - parseCR(b));

    crEl.innerHTML = uniqueCRs.map(cr =>
      `<label><input type="checkbox" value="${cr}"> ${cr}</label>`
    ).join("");

    crEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) activeCRs.add(cb.value);
        else activeCRs.delete(cb.value);
        applyFilters();
      });
    });

    // -----------------------------
    // Source Filters (Checkboxes)
    // -----------------------------
    const uniqueSources = [...new Set(
      monsters.map(m => m.tags[m.tags.length - 1]).filter(Boolean)
    )].sort();

    sourceEl.innerHTML = uniqueSources.map(src =>
      `<label><input type="checkbox" value="${src}"> ${formatSource(src)}</label>`
    ).join("");

    sourceEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) activeSources.add(cb.value);
        else activeSources.delete(cb.value);
        applyFilters();
      });
    });

    // Search
    searchEl.addEventListener("input", () => applyFilters());

    // -----------------------------
    // Apply Filters
    // -----------------------------
    function applyFilters() {
      const query = searchEl.value.toLowerCase();

      const filtered = monsters.filter(m => {
        if (query && !(m._displayName || m.name || "").toLowerCase().includes(query)) return false;
        if (activeTypes.size > 0 && !activeTypes.has(m.type)) return false;
        if (activeCRs.size > 0 && !activeCRs.has(m._cleanCR)) return false;
        if (activeSources.size > 0 && !activeSources.has(m.tags[m.tags.length - 1])) return false;
        return true;
      });

      renderList(filtered);
    }

    // -----------------------------
    // Render Monster List
    // -----------------------------
    function renderList(data) {
      listEl.innerHTML = "";
      data.forEach(m => {
        const div = document.createElement("div");
        div.className = "monster-row";
        div.textContent = `${m._displayName || m.name || m._file} (CR ${m._cleanCR}, ${m.type}, ${m.tags[m.tags.length-1] || "?"})`;
        div.addEventListener("click", () => addToTracker(m));
        listEl.appendChild(div);
      });
    }

    // -----------------------------
    // Tracker
    // -----------------------------
    const trackerBody = document.querySelector("#initiative-table tbody");

    function addToTracker(monster) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${monster._displayName || monster.name || monster._file}</td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
      `;
      row.addEventListener("click", () => showStatBlock(monster));
      trackerBody.appendChild(row);
      showStatBlock(monster);
    }

    // -----------------------------
    // Stat Block Loader
    // -----------------------------
    function showStatBlock(monster) {
      document.getElementById("stat-block").innerHTML = `
        <h3>${monster._displayName || monster.name || monster._file}</h3>
        <p><b>Type:</b> ${monster.type || "?"}</p>
        <p><b>CR:</b> ${monster._cleanCR}</p>
        <p><b>Source:</b> ${monster.tags[monster.tags.length-1] || "?"}</p>
        <pre>${JSON.stringify(monster, null, 2)}</pre>
      `;
    }

    // Initial render
    renderList(monsters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  }
}

loadMonsters();
