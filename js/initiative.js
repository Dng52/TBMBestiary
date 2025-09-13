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
	
const rollButton = document.getElementById("roll-initiative-btn");
rollButton.addEventListener("click", () => {
  document.querySelectorAll("#tracker-body tr").forEach(row => {
    const monsterName = row.dataset.monsterName;
    const monster = monsters.find(m => (m._displayName || m.name || m._file) === monsterName);
    if (!monster) return;

    let dexMod = 0;
    if (monster.abilities && typeof monster.abilities.dex === "number") {
      dexMod = Math.floor((monster.abilities.dex - 10) / 2);
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    const initiative = roll + dexMod;

    const initInput = row.querySelector("td:nth-child(2) input");
    if (initInput) initInput.value = initiative;
  });
});

// Sort button listener
const sortButton = document.getElementById("sort-initiative-btn");
sortButton.addEventListener("click", () => {
  const rows = Array.from(trackerBody.querySelectorAll("tr"));
  rows.sort((a, b) => {
    const aVal = parseInt(a.querySelector("td:nth-child(2) input").value, 10) || 0;
    const bVal = parseInt(b.querySelector("td:nth-child(2) input").value, 10) || 0;
    return bVal - aVal; // descending order
  });

  rows.forEach(row => trackerBody.appendChild(row));
}); // <-- close the listener here!

// -----------------------------
// Add Blank Entry Button
// -----------------------------
const addBlankButton = document.getElementById("add-blank-btn");
addBlankButton.addEventListener("click", () => {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td class="monster-name"><input type="text" value="Custom Entry" style="width: 100%;"></td>
    <td><input type="number" value="0" style="width: 50px;"></td>
    <td><input type="text" style="width: 50px;"></td>
    <td><input type="text" style="width: 60px;"></td>
    <td><input type="text" style="width: 100%;"></td>
    <td><button class="remove-btn">Remove</button></td>
  `;

  // Remove button
  row.querySelector(".remove-btn").addEventListener("click", () => row.remove());

  // Hover & click highlight (still works on the <td>, not the input itself)
  const nameCell = row.querySelector(".monster-name");
  nameCell.addEventListener("mouseenter", () => {
    if (!lockedRow) nameCell.style.backgroundColor = "#ffd";
  });
  nameCell.addEventListener("mouseleave", () => {
    if (!lockedRow) nameCell.style.backgroundColor = "";
  });
  nameCell.addEventListener("click", () => {
    if (lockedRow === row) {
      lockedRow = null;
      nameCell.style.backgroundColor = "";
    } else {
      if (lockedRow) lockedRow.querySelector(".monster-name").style.backgroundColor = "";
      lockedRow = row;
      nameCell.style.backgroundColor = "#ffa";
    }
  });

  trackerBody.appendChild(row);
});




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
  listEl.innerHTML = ""; // Clear table body

  data.forEach(monster => {
    const tr = document.createElement("tr");

    // Get Source = last tag
    const source = monster.tags && monster.tags.length > 0
      ? monster.tags[monster.tags.length - 1]
      : "Unknown";

    tr.innerHTML = `
      <td class="creature-name">${monster._displayName || monster.name || monster._file}</td>
      <td>${monster.type || "—"}</td>
      <td>${monster._cleanCR || "—"}</td>
      <td>${source}</td>
    `;

    // Add event handlers
    tr.addEventListener("mouseenter", () => {
      if (!statBlockLocked) displayStatBlock(monster);
    });
    tr.addEventListener("mouseleave", () => {
      if (!statBlockLocked) statBlockContainer.innerHTML = "";
    });
    tr.addEventListener("click", (e) => {
      e.preventDefault();
      addToTracker(monster);
      statBlockLocked = true;
      lockedMonster = monster;
      displayStatBlock(monster);
    });

    listEl.appendChild(tr);
  });
}
    // -----------------------------
    // Display monster stat block
    // -----------------------------
	let lockedRow = null; // track which tracker row is highlighted / locked
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
        ${monster.traits?.map(t => {
  if (t.desc.includes("*")) {
    // Split on "*" and trim
    const parts = t.desc.split("*").map(s => s.trim()).filter(Boolean);
    const first = parts.shift(); // intro sentence
    return `
      <p><strong><em>${t.name}.</em></strong> ${first}</p>
      <ul>
        ${parts.map(p => `<li>${p}</li>`).join("")}
      </ul>
    `;
  } else {
    return `<p><strong><em>${t.name}.</em></strong> ${t.desc}</p>`;
  }
}).join("") || ""}

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
    const monster = link.monsterRef;

    // Hover shows stat block preview
    link.addEventListener("mouseenter", () => {
      if (!statBlockLocked) displayStatBlock(monster);
    });

    link.addEventListener("mouseleave", () => {
      if (!statBlockLocked) statBlockContainer.innerHTML = "";
    });

    // Click always adds a new row and updates stat block
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Always add a new copy to the tracker
      addToTracker(monster);

      // Lock stat block to clicked monster
      statBlockLocked = true;
      lockedMonster = monster;
      displayStatBlock(monster);
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

  // --- Tracker row hover & click for stat block ---
  const nameCell = row.querySelector(".monster-name");

  // Hover temporarily shows stat block
  nameCell.addEventListener("mouseenter", () => {
    if (!statBlockLocked) displayStatBlock(monster);
    if (!lockedRow) nameCell.style.backgroundColor = "#ffd"; // hover color
  });

  nameCell.addEventListener("mouseleave", () => {
    if (!statBlockLocked) statBlockContainer.innerHTML = "";
    if (!lockedRow) nameCell.style.backgroundColor = ""; // reset hover
  });

  // Click locks/unlocks the stat block and highlight
  nameCell.addEventListener("click", () => {
    if (lockedRow === row) {
      // Clicking same row unlocks it
      lockedRow = null;
      statBlockLocked = false;
      lockedMonster = null;
      statBlockContainer.innerHTML = "";
      nameCell.style.backgroundColor = "";
    } else {
      // Clicking a new row
      if (lockedRow) lockedRow.querySelector(".monster-name").style.backgroundColor = "";
      lockedRow = row;
      statBlockLocked = true;
      lockedMonster = monster;
      displayStatBlock(monster);
      nameCell.style.backgroundColor = "#ffa"; // lock color
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
  
// -----------------------------
// Resizers (LEFT & RIGHT handles)
// -----------------------------
document.querySelectorAll('.resizer').forEach((handle) => {
  const left = handle.previousElementSibling;
  const right = handle.nextElementSibling;
  if (!left || !right) return; // guard

  let startX = 0;
  let startLeftW = 0;
  let startRightW = 0;

  const onMouseDown = (e) => {
    e.preventDefault(); // <-- prevents native drag/text selection jumps
    startX = e.clientX;

    // robust measurement even if flex-basis is 'auto'
    startLeftW = left.getBoundingClientRect().width;
    startRightW = right.getBoundingClientRect().width;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    document.body.style.cursor = 'col-resize';
    left.style.userSelect = 'none';
    right.style.userSelect = 'none';
    left.style.pointerEvents = 'none';
    right.style.pointerEvents = 'none';
  };

  const onMouseMove = (e) => {
    const dx = e.clientX - startX;

    const minLeft = parseFloat(getComputedStyle(left).minWidth) || 150;
    const minRight = parseFloat(getComputedStyle(right).minWidth) || 150;

    // Move boundary by dx (left grows when dx>0)
    let newLeft = Math.max(minLeft, startLeftW + dx);
    let newRight = Math.max(minRight, startRightW - dx);

    // preserve original total width to avoid layout creep
    const total = startLeftW + startRightW;
    if (Math.round(newLeft + newRight) !== Math.round(total)) newRight = total - newLeft;

    // Lock both panels to explicit pixel widths so they don't switch to auto
    left.style.flex = `0 0 ${newLeft}px`;
    right.style.removeProperty('flex');
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    document.body.style.removeProperty('cursor');
    left.style.removeProperty('user-select');
    right.style.removeProperty('user-select');
    left.style.removeProperty('pointer-events');
    right.style.removeProperty('pointer-events');
  };

  handle.addEventListener('mousedown', onMouseDown);
});

// === SAVE TRACKER ===
document.getElementById("save-tracker-btn").addEventListener("click", () => {
  const rows = document.querySelectorAll("#tracker-body tr");
  let trackerData = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    trackerData.push({
      name: cells[0].querySelector("input")?.value || cells[0].innerText,
      initiative: cells[1].querySelector("input")?.value || "",
      ac: cells[2].querySelector("input")?.value || "",
      hp: cells[3].querySelector("input")?.value || "",
      notes: cells[4].querySelector("input")?.value || "",
      monsterId: row.dataset.monsterId || null  // preserve link to stat block
    });
  });

  const blob = new Blob([JSON.stringify(trackerData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "initiative_tracker.json";
  a.click();

  URL.revokeObjectURL(url);
});


// === LOAD TRACKER ===
document.getElementById("load-tracker-input").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    let trackerData;
    try {
      trackerData = JSON.parse(e.target.result);
    } catch (err) {
      alert("Invalid tracker file (not JSON).");
      return;
    }

    // Clear current tracker
    trackerBody.innerHTML = "";

    trackerData.forEach(entry => {
      // Try to find the original monster (prefer id, fallback to displayName/name/_file)
      let monster = null;
      if (entry.monsterId) {
        monster = monsters.find(m => (m.id && String(m.id) === String(entry.monsterId)));
      }
      if (!monster && entry.name) {
        monster = monsters.find(m => (m._displayName || m.name || m._file) === entry.name);
      }

      if (monster) {
        // Use your existing addToTracker so the row has the same listeners & data attributes
        addToTracker(monster);

        // Grab the newly appended row (addToTracker appends it)
        const row = trackerBody.lastElementChild;

        // Set initiative (column 2 input)
        const initInput = row.querySelector("td:nth-child(2) input");
        if (initInput && entry.initiative !== undefined) initInput.value = entry.initiative;

        // AC is a text cell in addToTracker — overwrite it if saved
        const acCell = row.querySelector("td:nth-child(3)");
        if (acCell && entry.ac !== undefined) acCell.textContent = entry.ac;

        // HP input is inside column 4 (we created a text input there in addToTracker)
        const hpInput = row.querySelector("td:nth-child(4) input");
        if (hpInput && entry.hp !== undefined) {
          hpInput.value = entry.hp;
          hpInput.dataset.currentHp = entry.hp;
        }

        // Notes input (column 5)
        const notesInput = row.querySelector("td:nth-child(5) input");
        if (notesInput && entry.notes !== undefined) notesInput.value = entry.notes;

        // Keep the monsterId if present
        if (entry.monsterId) row.dataset.monsterId = entry.monsterId;

      } else {
        // No matching monster → create an editable (custom) row like Add Blank Entry
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="monster-name"><input type="text" value="${(entry.name||"Custom Entry").replace(/"/g,'&quot;')}" style="width: 100%;"></td>
          <td><input type="number" value="${entry.initiative ?? 0}" style="width: 50px;"></td>
          <td><input type="text" value="${entry.ac ?? ""}" style="width: 50px;"></td>
          <td><input type="text" value="${entry.hp ?? ""}" style="width: 60px;"></td>
          <td><input type="text" value="${entry.notes ?? ""}" style="width: 100%;"></td>
          <td><button class="remove-btn">Remove</button></td>
        `;
        // Remove button
        row.querySelector(".remove-btn").addEventListener("click", () => row.remove());

        // keep the same hover/highlight behaviour for the name cell if you want
        const nameCell = row.querySelector(".monster-name");
        nameCell.addEventListener("mouseenter", () => {
          if (!lockedRow) nameCell.style.backgroundColor = "#ffd";
        });
        nameCell.addEventListener("mouseleave", () => {
          if (!lockedRow) nameCell.style.backgroundColor = "";
        });
        nameCell.addEventListener("click", () => {
          if (lockedRow === row) {
            lockedRow = null;
            nameCell.style.backgroundColor = "";
          } else {
            if (lockedRow) lockedRow.querySelector(".monster-name").style.backgroundColor = "";
            lockedRow = row;
            nameCell.style.backgroundColor = "#ffa";
          }
        });

        trackerBody.appendChild(row);
      }
    });
  };

  reader.readAsText(file);
});



}

loadMonsters();


