async function loadMonster() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");

  if (!name) return;

  // Assuming file is lowercased: goblin.json, dragon.json, etc.
  const file = `data/${name.toLowerCase()}.json`;
  const monster = await fetch(file).then(r => r.json());

  const container = document.getElementById("monster");
  container.innerHTML = `
    <h1>${monster.name}</h1>
    <p><b>Tags:</b> ${monster.tags.join(", ")}</p>
    <p><b>HP:</b> ${monster.hp}, <b>AC:</b> ${monster.ac}</p>
    <p><b>Attack:</b> ${monster.attack}</p>
    <h3>Abilities</h3>
    <ul>
      ${Object.entries(monster.abilities).map(([k,v]) => `<li>${k.toUpperCase()}: ${v}</li>`).join("")}
    </ul>
    <p>${monster.description}</p>
    <p><a href="index.html">← Back to Bestiary</a></p>
  `;
}

loadMonster();
