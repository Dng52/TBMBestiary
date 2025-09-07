// ==============================
// CR Parsing Helpers
// ==============================
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

// ==============================
// Main Loader
// ==============================
async function loadMonsters() {
  try {
    const validMonsters = await fetch("data/monsters.json")
      .then(r => { if (!r.ok) throw new Error(`Failed to load monsters.json: ${r.status}`); return r.json(); });

    // Prepare monsters
    validMonsters.forEach(m => {
      m._cleanCR = cleanCR(m.cr);
      m._crSortValue = parseCR(m.cr);
      if (!m.tags) m.tags = [];
    });

    validMonsters.sort((a, b) => {
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

    // DOM Elements
    const listEl = document.getElementById("monster-list");
    const typesEl = document.getElementById("creature-types");
    const crEl = document.getElementById("cr-filters");
    const sourceEl = document.getElementById("source-filters");
    const searchEl = document.getElementById("search");
    const trackerBody = document.getElementById("tracker-body");
    const statBlockEl = document.getElementById("stat-block");

    // State
    const activeTypes = new Set();
    const activeCRs = new Set();
    const activeSources = new Set();

    function formatSource(name) {
      return name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    }

    // ==============================
    // Type Filters (checkboxes)
    // ==============================
    const creatureTypes = ["aberration","beast","celestial","construct","dragon","elemental",
      "fey","fiend","giant","humanoid","monstrosity","ooze","plant","undead"];

    typesEl.innerHTML = creatureTypes.map(t => `
      <label><input type="checkbox" data-type="${t}"> ${t}</label>
    `).join(" ");

    typesEl.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        activeTypes.clear();
        typesEl.querySelectorAll("input[type=checkbox]:checked").forEach(c => activeTypes.add(c.dataset.type));
        applyFilters();
      });
    });

    // ==============================
    // CR Filters (checkboxes)
    // ==============================
    const uniqueCRs = [...new Set(validMonsters.map(m => isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean))]
      .sort((a, b) => parseCR(a) - parseCR(b));

    crEl.innerHTML = uniqueCRs.map(cr => `
      <label><input type="checkbox" data-cr="${cr}"> ${cr}</label>
    `).join(" ");

    crEl.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        activeCRs.clear();
        crEl.querySelectorAll("input[type=checkbox]:checked").forEach(c => activeCRs.add(c.dataset.cr));
        applyFilters();
      });
    });

    // ==============================
    // Source Filters (checkboxes)
    // ==============================
    const uniqueSources = [...new Set(validMonsters.map(m => m.tags[m.tags.length - 1]).filter(Boolean))].sort();
    sourceEl.innerHTML = uniqueSources.map(src => `
      <label><input type="checkbox" data-source="${src}"> ${formatSource(src)}</label>
    `).join(" ");

    sourceEl.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        activeSources.clear();
        sourceEl.querySelectorAll("input[type=checkbox]:checked").forEach(c => activeSources.add(c.dataset.source));
        applyFilters();
      });
    });

    // ==============================
    // Search
    // ==============================
    searchEl.addEventListener("input", () => applyFilters());

    // ==============================
    // Apply Filters
    // ==============================
    function applyFilters() {
      const query = searchEl.value.toLowerCase();
      const filtered = validMonsters.filter(m => {
        if (query && !(m._displayName || m.name || "").toLowerCase().includes(query)) return false;
        if (activeTypes.size > 0 && !activeTypes.has(m.type)) return false;
        if (activeCRs.size > 0 && !activeCRs.has(m._cleanCR)) return false;
        if (activeSources.size > 0 && !activeSources.has(m.tags[m.tags.length - 1])) return false;
        return true;
      });
      renderMonsterList(filtered);
    }

    // ==============================
    // Render Monster List
    // ==============================
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

    // ==============================
    // Add to Initiative Tracker
    // ==============================
    function addToTracker(monster) {
      const ac = monster.ac || monster.armor_class || "?";
      const hpVal = monster.hp || monster.hit_points || 0;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${monster._displayName || monster.name}</td>
        <td><input type="number" value="0" style="width:50px;"></td>
        <td>${ac}</td>
        <td><input type="number" value="${hpVal}" style="width:60px;"></td>
        <td><input type="text" style="width:100%;"></td>
        <td><button class="remove-btn">Remove</button></td>
      `;

      row.querySelector(".remove-btn").addEventListener("click", () => row.remove());
      trackerBody.appendChild(row);
    }

    // ==============================
    // Render Stat Block
    // ==============================
    function renderStatBlock(monster) {
      statBlockEl.innerHTML = `
        <h2>${monster._displayName || monster.name}</h2>
        <p><strong>Type:</strong> ${monster.type || "Unknown"}</p>
        <p><strong>CR:</strong> ${monster.cr || "?"}</p>
        <p><strong>AC:</strong> ${monster.ac || monster.armor_class || "?"}</p>
        <p><strong>HP:</strong> ${monster.hp || monster.hit_points || "?"}</p>
        <p><strong>Speed:</strong> ${monster.speed || "—"}</p>
        ${monster.traits?.length ? monster.traits.map(t => `<p><strong>${t.name}.</strong> ${t.desc}</p>`).join("") : ""}
        ${monster.actions?.length ? `<h3>Actions</h3>` + monster.actions.map(a => `<p><strong>${a.name}.</strong> ${a.desc}</p>`).join("") : ""}
      `;
    }

    // ==============================
    // Initial render
    // ==============================
    renderMonsterList(validMonsters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  }
}

loadMonsters();
