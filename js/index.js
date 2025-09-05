async function loadMonsters() {
  // Load the list of JSON files
  const files = await fetch("data/index.json").then(r => r.json());

  const monsters = await Promise.all(
    files.map(f => fetch(`data/${f}`).then(r => r.json()))
  );

  // Sort alphabetically
  monsters.sort((a, b) => a.name.localeCompare(b.name));

  const listEl = document.getElementById("monster-list");
  const filtersEl = document.getElementById("filters");

  // Collect all unique tags
  const tags = [...new Set(monsters.flatMap(m => m.tags))].sort();

  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.onclick = () => renderList(monsters.filter(m => m.tags.includes(tag)));
    filtersEl.appendChild(btn);
  });

  renderList(monsters);

  function renderList(data) {
    listEl.innerHTML = "";
    data.forEach(m => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="monster.html?name=${encodeURIComponent(m.name)}">${m.name}</a>`;
      listEl.appendChild(li);
    });
  }
}

loadMonsters();
