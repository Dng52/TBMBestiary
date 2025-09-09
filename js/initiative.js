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
    const monsters = await fetch("data/monsters.json").then(r => r.json());

    monsters.forEach(m => {
      m._cleanCR = cleanCR(m.cr);
      m._crSortValue = parseCR(m.cr);
      if (!m.tags) m.tags = [];
    });

    monsters.sort((a, b) => {
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

    // -----------------------------
    // DOM Elements
    // -----------------------------
    const listEl = document.getElementById("monster-list");
    const typeEl = document.getElementById("type-filters");
    const crEl = document.getElementById("cr-filters");
    const sourceEl = document.getElementById("source-filters");
    const searchEl = document.getElementById("search");
    const trackerBody = document.getElementById("tracker-body");
    const statBlockContainer = document.getElementById("stat-block");

    const activeTypes = new Set();
    const activeCRs = new Set();
    const activeSources = new Set();

    function formatSource(name) {
      return name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    }

    // -----------------------------
    // Filters (Types, CR, Source)
    // -----------------------------
    const creatureTypes = [
      "aberration","beast","celestial","construct","dragon",
      "elemental","fey","fiend","giant","humanoid",
      "monstrosity","ooze","plant","undead"
    ];
    typeEl.innerHTML = creatureTypes.map(t =>
      `<label><input type="checkbox" data-type="${t}">${t}</label>`
    ).join("");
    typeEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        activeTypes.clear();
        typeEl.querySelectorAll("input:checked").forEach(c => activeTypes.add(c.dataset.type));
        applyFilters();
      });
    });

    const uniqueCRs = [...new Set(monsters.map(m =>
      isNaN(m._crSortValue) ? null : m._cleanCR).filter(Boolean)
    )].sort((a,b) => parseCR(a)-parseCR(b));
    crEl.innerHTML = uniqueCRs.map(cr =>
      `<label><input type="checkbox" data-cr="${cr}">${cr}</label>`
    ).join("");
    crEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        activeCRs.clear();
        crEl.querySelectorAll("input:checked").forEach(c => activeCRs.add(c.dataset.cr));
        applyFilters();
      });
    });

    const uniqueSources = [...new Set(monsters.map(m =>
      m.tags[m.tags.length-1]).filter(Boolean)
    )].sort();
    sourceEl.innerHTML = uniqueSources.map(src =>
      `<label><input type="checkbox" data-source="${src}">${formatSource(src)}</label>`
    ).join("");
    sourceEl.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        activeSources.clear();
        sourceEl.querySelectorAll("input:checked").forEach(c => activeSources.add(c.dataset.source));
        applyFilters();
      });
    });

    // -----------------------------
    // Search
    // -----------------------------
    searchEl.addEventListener("input", () => applyFilters());

    // -----------------------------
    // Filter Logic
    // -----------------------------
    function applyFilters() {
      const query = searchEl.value.toLowerCase();
      const filtered = monsters.filter(m => {
        if (query && !(m._displayName || m.name || "").toLowerCase().includes(query)) return false;
        if (activeTypes.size && !activeTypes.has(m.type)) return false;
        if (activeCRs.size && !activeCRs.has(m._cleanCR)) return false;
        if (activeSources.size && !activeSources.has(m.tags[m.tags.length-1])) return false;
        return true;
      });
      renderList(filtered);
    }

    // -----------------------------
    // Render Monster List
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

        const link = document.createElement("a");
        link.href = "#";
        link.textContent = m._displayName || m.name || m._file;
        link.monsterRef = m; // store monster object directly

        li.appendChild(link);
        listEl.appendChild(li);
      });

      // Attach hover & click events
      attachStatBlockEvents();
    }

    // -----------------------------
    // Display monster stat block
    // -----------------------------
    let statBlockLocked = false;
    let lockedMonster = null;

    function displayStatBlock(monster) {
      const displayName = monster._displayName || monster.name || monster._file;
      const formatAbility = (score) => {
        const mod = Math.floor((score - 10) / 2);
        const sign = mod >= 0 ? `+${mod}` : mod;
        return `${score} (${sign})`;
      };

      let html = `
        <div class="creature-heading">
          <h1>${displayName}</h1>
          <h5>${monster.size || "Medium"} ${monster.type || ""}${monster.alignment ? `, ${monster.alignment}` : ""}</h5>
        </div>
        <hr class="orange-border">
        <div class="property-line"><h4>Armor Class&nbsp</h4><p>${monster.ac}</p></div>
        <div class="property-line"><h4>Hit Points&nbsp</h4><p>${monster.hp}</p></div>
        ${monster.speed ? `<div class="property-line"><h4>Speed&nbsp</h4><p>${monster.speed}</p></div>` : ""}
        <hr class="orange-border">
        <div class="abilities">
          ${Object.entries(monster.abilities || {}).map(([k,v]) => `<div><h4>${k.toUpperCase()}</h4><p>${formatAbility(v)}</p></div>`).join("")}
        </div>
        <hr class="orange-border">
        ${monster.saves ? `<div class="property-line"><h4>Saving Throws&nbsp</h4><p>${monster.saves}</p></div>` : ""}
        ${monster.skills ? `<div class="property-line"><h4>Skills&nbsp</h4><p>${monster.skills}</p></div>` : ""}
        ${monster.immunities ? `<div class="property-line"><h4>Damage Immunities&nbsp</h4><p>${monster.immunities}</p></div>` : ""}
        ${monster.resistance ? `<div class="property-line"><h4>Damage Resistance&nbsp</h4><p>${monster.resistance}</p></div>` : ""}
        ${monster.vulnerability ? `<div class="property-line"><h4>Damage Vulnerability&nbsp</h4><p>${monster.vulnerability}</p></div>` : ""}
        ${monster.conimmunities ? `<div class="property-line"><h4>Condition Immunities&nbsp</h4><p>${monster.conimmunities}</p></div>` : ""}
        ${monster.senses ? `<div class="property-line"><h4>Senses&nbsp</h4><p>${monster.senses}</p></div>` : ""}
        ${monster.languages ? `<div class="property-line"><h4>Languages&nbsp</h4><p>${monster.languages}</p></div>` : ""}
        <div class="property-line"><h4>Challenge&nbsp</h4><p>${monster.cr}</p></div>
        <hr class="orange-border">
        ${monster.traits?.length ? monster.traits.map(t => `<p><strong><em>${t.name}.</em></strong> ${t.desc}</p>`).join("") : ""}
        ${monster.actions?.length ? `<h3>Actions</h3>${monster.actions.map(a => `<p><strong><em>${a.name}.</em></strong> ${a.desc}</p>`).join("")}` : ""}
        ${monster.reactions?.length ? `<h3>Reactions</h3>${monster.reactions.map(a => `<p><strong><em>${a.name}.</em></strong> ${a.desc}</p>`).join("")}` : ""}
        ${monster.legendary?.length ? `<h3>Legendary Actions</h3><p>The ${displayName} can take ${monster.legendarynumber || 3} legendary actions. Only one can be used at a time. Regains spent actions at the start of its turn.</p>${monster.legendary.map(a => `<p><strong><em>${a.name}.</em></strong> ${a.desc}</p>`).join("")}` : ""}
        ${monster.lairactions?.length ? `<h3>Lair Actions</h3>${monster.lairactions.map(l => `<p>${l.description || ""}</p>${l.bullets?.length ? `<ul>${l.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>` : ""}`).join("")}` : ""}
        ${monster.regionaleffects?.length ? `<h3>Regional Effects</h3>${monster.regionaleffects.map(r => `<p>${r.description || ""}</p>${r.bullets?.length ? `<ul>${r.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>` : ""}${r.secondaryDescription ? `<p>${r.secondaryDescription}</p>` : ""}`).join("")}` : ""}
      `;

      statBlockContainer.innerHTML = html;
    }

    // -----------------------------
    // Attach hover & click to monster links
    // -----------------------------
    function attachStatBlockEvents() {
      document.querySelectorAll("#monster-list .monster-link a").forEach(link => {
        const monster = link.monsterRef; // use stored monster

        link.addEventListener("mouseenter", () => {
          if (!statBlockLocked) displayStatBlock(monster);
        });

        link.addEventListener("mouseleave", () => {
          if (!statBlockLocked) statBlockContainer.innerHTML = "";
        });

	link.addEventListener("click", (e) => {
	  e.preventDefault();

	  if (lockedMonster === monster) {
		statBlockLocked = false;
		lockedMonster = null;
		statBlockContainer.innerHTML = "";
	  } else {
		statBlockLocked = true;
		lockedMonster = monster;
		displayStatBlock(monster);

		// Always add to tracker
		addToTracker(monster);
	  }
	});


      });
    }

    // -----------------------------
    // Add monster to initiative tracker
    // -----------------------------
function addToTracker(monster) {
  const row = document.createElement("tr");
  row.dataset.monsterName = monster._displayName || monster.name || monster._file;

  let hpValue = "?";
  if (monster.hp) {
    const match = monster.hp.match(/\d+/);
    if (match) hpValue = match[0];
  }
  const startHP = isNaN(parseInt(hpValue)) ? 0 : parseInt(hpValue);

  row.innerHTML = `
    <td class="monster-name">${monster._displayName || monster.name}</td>
    <td><input type="number" value="0" style="width: 50px;"></td>
    <td>${monster.ac || "?"}</td>
    <td></td>
    <td><input type="text" style="width: 100%;"></td>
    <td><button class="remove-btn">Remove</button></td>
  `;

  const hpCell = row.querySelector("td:nth-child(4)");
  const hpInput = document.createElement("input");
  hpInput.type = "text";
  hpInput.style.width = "60px";
  hpInput.value = startHP;
  hpInput.dataset.currentHp = startHP;
  hpCell.appendChild(hpInput);

  hpInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      let current = parseInt(hpInput.dataset.currentHp, 10) || 0;
      const raw = hpInput.value.trim();
      if (/^[+-]\d+$/.test(raw)) {
        current += parseInt(raw, 10);
      } else if (/^\d+$/.test(raw)) {
        current = parseInt(raw, 10);
      }
      if (current < 0) current = 0;
      hpInput.dataset.currentHp = current;
      hpInput.value = current;
    }
  });

  row.querySelector(".remove-btn").addEventListener("click", () => row.remove());

  // Track currently highlighted row
  let lockedRow = null;

  const nameCell = row.querySelector(".monster-name");

  nameCell.addEventListener("mouseenter", () => {
    if (lockedRow !== row) {
      nameCell.style.backgroundColor = "#ffd"; // hover color
    }
    displayStatBlock(monster);
  });

  nameCell.addEventListener("mouseleave", () => {
    if (lockedRow !== row) {
      nameCell.style.backgroundColor = ""; // reset
    }
    if (!statBlockLocked) statBlockContainer.innerHTML = "";
  });

  nameCell.addEventListener("click", () => {
    if (lockedRow === row) {
      lockedRow = null;
      nameCell.style.backgroundColor = "";
      statBlockLocked = false;
      lockedMonster = null;
      statBlockContainer.innerHTML = "";
    } else {
      if (lockedRow) lockedRow.querySelector(".monster-name").style.backgroundColor = ""; // reset previous
      lockedRow = row;
      nameCell.style.backgroundColor = "#ffa"; // lock color
      statBlockLocked = true;
      lockedMonster = monster;
      displayStatBlock(monster);
    }
  });

  trackerBody.appendChild(row);
}




    // -----------------------------
    // Initial render
    // -----------------------------
    renderList(monsters);

  } catch (err) {
    console.error("Failed to load monsters:", err);
  }
}

loadMonsters();
