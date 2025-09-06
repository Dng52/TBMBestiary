function parseCR(cr) {
  if (!cr) return 0;
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return num / den;
  }
  return Number(cr);
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
    });

    monsters.sort((a, b) => {
      const crA = parseCR(a.cr);
      const crB = parseCR(b.cr);
      if (crA !== crB) return crA - crB;
      return a._displayName.localeCompare(b._displayName);
    });

    const listEl = document.getElementById("monster-list");
    const typesEl = document.getElementById("creature-types");
    const searchEl = document.getElementById("search");

    // Fixed creature types (Bookmania styled nav)
    const creatureTypes = [
      "aberration", "beast", "celestial", "construct", "dragon", "elemental",
      "fey", "fiend", "giant", "humanoid", "monstrosity", "ooze", "plant", "undead"
    ];

    typesEl.innerHTML = creatureTypes.map(t => `<span class="type-link">${t}</span>`).join(" • ");

    // Filter by type when clicking a type link
    typesEl.querySelectorAll(".type-link").forEach(el => {
      el.addEventListener("click", () => {
        renderList(monsters.filter(m => m.type === el.textContent));
      });
    });

    // Search bar functionality
    searchEl.addEventListener("input", () => {
      const query = searchEl.value.toLowerCase();
      const filtered = monsters.filter(m =>
        m._displayName.toLowerCase().includes(query)
      );
      renderList(filtered);
    });

    // Initial render
    renderList(monsters);

    function renderList(data) {
      listEl.innerHTML = "";
      let currentCR = null;

      data.forEach(m => {
        const crVal = m.cr || "?";

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
    console.error("Error loading monsters:", err);
  }
}

loadMonsters();
