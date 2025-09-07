// Parse CR for sorting: converts fractions to decimal, ignores XP
function parseCR(cr) {
  if (!cr) return 0;

  cr = cr.replace(/\(.*?\)/, "").trim(); // Remove XP

  if (cr === "0") return 0;
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return den ? num / den : 0;
  }

  const val = parseFloat(cr);
  return isNaN(val) ? 0 : val;
}

// Clean CR string for display (removes XP)
function cleanCR(cr) {
  if (!cr) return "?";
  return cr.replace(/\(.*?\)/, "").trim();
}

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
        m._cleanCR = cleanCR(m.cr);
        m._crSortValue = parseCR(m.cr);
        return m;
      } catch (err) {
        console.error(`Failed to load ${e.file}:`, err);
        return null; // skip this monster
      }
    }));

    // Remove any failed loads
    const validMonsters = monsters.filter(m => m);

    // Sort by CR numeric value, then name
    validMonsters.sort((a, b) => {
      if (a._crSortValue !== b._crSortValue) return a._crSortValue - b._crSortValue;
      return a._displayName.localeCompare(b._displayName);
    });

    const listEl = document.getElementById("monster-list");
    const typesEl = document.getElementById("creature-types");
    const searchEl = document.getElementById("search");

    const creatureTypes = [
      "aberration", "beast", "celestial", "construct", "dragon", "elemental",
      "fey", "fiend", "giant", "humanoid", "monstrosity", "ooze", "plant", "undead"
    ];

    typesEl.innerHTML = creatureTypes.map(t => `<span class="type-link">${t}</span>`).join(" • ");

    typesEl.querySelectorAll(".type-link").forEach(el => {
      el.addEventListener("click", () => {
        renderList(validMonsters.filter(m => m.type === el.textContent));
      });
    });

    searchEl.addEventListener("input", () => {
      const query = searchEl.value.toLowerCase();
      const filtered = validMonsters.filter(m =>
        m._displayName.toLowerCase().includes(query)
      );
      renderList(filtered);
    });

    renderList(validMonsters);

    function renderList(data) {
      listEl.innerHTML = "";
      let currentCR = null;

      data.forEach(m => {
        const crVal = m._cleanCR || "?";

        if (crVal !== currentCR) {
          currentCR = crVal;
          const heading = document.createElement("h3");
          heading.textContent = `CR ${crVal}`;
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
