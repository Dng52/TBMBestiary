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
    const entries = await fetch("data/index.json").then(r => r.json());

    const monsters = await Promise.all(
      entries.map(e => fetch(`data/${e.file}`).then(r => r.json()))
    );

    monsters.forEach((m, i) => {
      m._file = entries[i].file;
      m._displayName = entries[i].name;
      m._cleanCR = cleanCR(m.cr);        // for headings
      m._crSortValue = parseCR(m.cr);    // numeric value for sorting
    });

    // Sort by CR (numeric) and then name
    monsters.sort((a, b) => {
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
        renderList(monsters.filter(m => m.type === el.textContent));
      });
    });

    searchEl.addEventListener("input", () => {
      const query = searchEl.value.toLowerCase();
      const filtered = monsters.filter(m =>
        m._displayName.toLowerCase().includes(query)
      );
      renderList(filtered);
    });

    renderList(monsters);

    function renderList(data) {
      listEl.innerHTML = "";
      let currentCR = null;

      data.forEach(m => {
        const crVal = m._cleanCR || "?";

        // Only add heading when CR changes
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
  } finally {
    console.log("Finished attempting to load monsters");
  }
}

loadMonsters();
