let monsters = [];
let tracker = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Load monster data (adjust path if needed)
  monsters = await fetch("data/monsters.json").then(r => r.json());

  populateFilters();
  renderMonsterTable(monsters);

  document.getElementById("search").addEventListener("input", filterMonsters);
  document.getElementById("filter-type").addEventListener("change", filterMonsters);
  document.getElementById("filter-cr").addEventListener("change", filterMonsters);
  document.getElementById("filter-source").addEventListener("change", filterMonsters);
});

function populateFilters() {
  const types = [...new Set(monsters.map(m => m.type))].sort();
  const crs = [...new Set(monsters.map(m => m.cr))].sort((a,b)=>a-b);
  const sources = [...new Set(monsters.map(m => m.source))].sort();

  fillSelect("filter-type", types);
  fillSelect("filter-cr", crs);
  fillSelect("filter-source", sources);
}

function fillSelect(id, items) {
  const select = document.getElementById(id);
  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

function filterMonsters() {
  const search = document.getElementById("search").value.toLowerCase();
  const type = document.getElementById("filter-type").value;
  const cr = document.getElementById("filter-cr").value;
  const source = document.getElementById("filter-source").value;

  const filtered = monsters.filter(m => {
    return (!search || m.name.toLowerCase().includes(search)) &&
           (!type || m.type === type) &&
           (!cr || m.cr == cr) &&
           (!source || m.source === source);
  });

  renderMonsterTable(filtered);
}

function renderMonsterTable(list) {
  const tbody = document.querySelector("#monster-table tbody");
  tbody.innerHTML = "";
  list.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.name}</td><td>${m.type}</td><td>${m.cr}</td><td>${m.source}</td>`;
    tr.addEventListener("click", () => addToTracker(m));
    tbody.appendChild(tr);
  });
}

function addToTracker(monster) {
  const entry = {
    ...monster,
    initiative: 0,
    ac: monster.ac || "",
    hp: monster.hp || "",
    notes: ""
  };
  tracker.push(entry);
  renderTracker();
}

function renderTracker() {
  const tbody = document.querySelector("#tracker-table tbody");
  tbody.innerHTML = "";
  tracker.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td contenteditable oninput="tracker[${i}].initiative=this.innerText">${t.initiative}</td>
      <td style="cursor:pointer">${t.name}</td>
      <td contenteditable oninput="tracker[${i}].ac=this.innerText">${t.ac}</td>
      <td contenteditable oninput="tracker[${i}].hp=this.innerText">${t.hp}</td>
      <td contenteditable oninput="tracker[${i}].notes=this.innerText">${t.notes}</td>
    `;
    tr.querySelector("td:nth-child(2)").addEventListener("click", () => showStatBlock(t));
    tbody.appendChild(tr);
  });
}

function showStatBlock(monster) {
  const statblock = document.getElementById("statblock-content");
  statblock.innerHTML = `
    <h3>${monster.name}</h3>
    <p><strong>Type:</strong> ${monster.type} | <strong>CR:</strong> ${monster.cr} | <strong>Source:</strong> ${monster.source}</p>
    <p><strong>AC:</strong> ${monster.ac || "?"} | <strong>HP:</strong> ${monster.hp || "?"}</p>
    <p>${monster.description || "No description."}</p>
  `;
}
