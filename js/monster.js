async function loadMonster() {
  const params = new URLSearchParams(window.location.search);
  const file = params.get("file"); // e.g. "goblin.json"
  if (!file) return;

  // Load index.json to map file -> display name
  const index = await fetch("data/index.json").then(r => r.json());
  const entry = index.find(e => e.file === file);

  // Load monster JSON
  const monster = await fetch(`data/${file}`).then(r => r.json());

  // Use display name from index.json if available, fallback to JSON
  const displayName = entry?.name || monster.name || file.replace(".json", "");

  const container = document.getElementById("monster");

  // Helper for ability score formatting (with modifier)
  const formatAbility = (score) => {
    const mod = Math.floor((score - 10) / 2);
    const sign = mod >= 0 ? `+${mod}` : mod;
    return `${score} (${sign})`;
  };
  // Actual display psuedo CSS
  container.innerHTML = `
    <div class="creature-heading">
      <h1>${displayName}</h1>
      <h2>${monster.size || "Medium"} ${monster.type || ""}${
        monster.alignment ? `, ${monster.alignment}` : ""
      }</h2>
    </div>
    <hr class="orange-border">

    <div class="property-line">
      <h4>Armor Class </h4><p>${monster.ac}</p>
    </div>
    <div class="property-line">
      <h4>Hit Points </h4><p>${monster.hp}</p>
    </div>
    ${monster.speed ? `<div class="property-line"><h4>Speed </h4><p>${monster.speed}</p></div>` : ""}
    
    <hr class="orange-border">

    <div class="abilities">
      ${Object.entries(monster.abilities || {}).map(([k,v]) => `
        <div>
          <h4>${k.toUpperCase()}</h4>
          <p>${formatAbility(v)}</p>
        </div>
      `).join("")}
    </div>

    <hr class="orange-border">

    ${monster.skills ? `<div class="property-line"><h4>Skills </h4><p>${monster.skills}</p></div>` : ""}
    ${monster.languages ? `<div class="property-line"><h4>Languages </h4><p>${monster.languages}</p></div>` : ""}
    <div class="property-line">
      <h4>Challenge </h4><p>${monster.cr}</p>
    </div>

    <hr class="orange-border">

    ${monster.traits && monster.traits.length ? `
      ${monster.traits.map(t => `
        <p><strong><em>${t.name}.</em></strong> ${t.desc}</p>
      `).join("")}
    ` : ""}

    ${monster.actions && monster.actions.length ? `
      <h3>Actions</h3>
      ${monster.actions.map(a => `
        <p><strong><em>${a.name}.</em></strong> ${a.desc}</p>
      `).join("")}
    ` : ""}

    ${monster.legendary && monster.legendary.length ? `
      <h3>Legendary Actions</h3>
      ${monster.legendary.map(a => `
        <p><strong><em>${a.name}.</em></strong> ${a.desc}</p>
      `).join("")}
    ` : ""}

    ${monster.description ? `<p>${monster.description}</p>` : ""}
  `;
}

loadMonster();
