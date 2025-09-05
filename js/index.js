// Convert CR strings like "1/8", "1/4", "1/2", "1", "2" into numbers for sorting
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
    const files = await fetch("data/index.json").then(r => r.json());

    const monsters = await Promise.all(
      files.map(f => fetch(`data/${f}`).then(r => r.json()))
    );

    // Sort by CR, then alphabetically within each CR
    monsters.sort((a, b) => {
      const crA = parseCR(a.cr);
      const crB = parseCR(b.cr);
      if (crA !== crB) return crA - crB;
      return a.name.localeCompare(b.name);
    });

    const listEl = document.getElementById("monster-list");
    const filtersEl = document.getElementById("filters");

    // Hardcoded filter buttons
    const creatureTypes = [
      "aberration", "beast", "celestial", "construct", "dragon", "elemental",
      "fey", "fiend", "giant", "humanoid", "monstrosity", "ooze", "plant", "undead"
    ];

    creatureTypes.forEach(type => {
      const btn = document.createElement("button");
      btn.textContent = type;
      btn.onclick = () => renderList(monsters.filter(m => m.type === type));
      filtersEl.appendChild(btn);
    });

    // Render everything by default
    renderList(monsters);

    function renderList(data) {
      listEl.innerHTML = "";

      let currentCR = null;

      data.forEach(m => {
        const crVal = m.cr || "?";

        // Add a new CR subheading when CR changes
        if (crVal !== currentCR) {
          currentCR = crVal;
          const heading = document.createElement("h2");
          heading.textContent = `CR ${crVal}`;
          listEl.appendChild(heading);
        }

        const li = document.createElement("li");
        li.innerHTML = `<a href="monster.html?name=${encodeURIComponent(m.name)}">${m.name}</a>`;
        listEl.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Error loading monsters:", err);
  }
}

loadMonsters();
