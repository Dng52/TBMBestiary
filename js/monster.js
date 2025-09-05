async function loadMonster() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (!name) return;

  const file = `data/${name.toLowerCase()}.json`;
  const monster = await fetch(file).then(r => r.json());

  const container = document.getElementById("monster");

  // Helper for ability score formatting (with modifier)
  const formatAbility = (score) => {
    const mod = Math.floor((score - 10) / 2);
    const sign = mod >= 0 ? `+${mod}` : mod;
    return `${score} (${sign})`;
  };

  container.innerHTML = `
    <hr class="orange-border">
    <div class="creature-heading">
      <h1>${monster.name}</h1>
      <h2>${monster.size || "Medium"} ${monster.type || ""}${
        monster.alignment ? `, ${monster.alignment}` : ""
      }</h2>
    </div>
    <hr class="orange-border">

    <div class="property-line">
      <h4>Armor Class</h4><p>${monster.ac}</p>
    </div>
    <div class="property-line">
      <h4>Hit Points</h4><p>${monster.hp}</p>
    </div>
    ${monster.speed ? `<div class="property-line"><h4>Speed</h4><p>${monster.speed}</p></div>` : ""}
    
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

    ${monster.skills ? `<div class="property-line"><h4>Skills</h4><p>${monster.skills}</p></div>` : ""}
    ${monster.languages ? `<div class="property-line"><h4>Languages</h4><p>${monster.languages}</p></div>` : ""}
    <div class="property-line">
      <h4>Challenge</h4><p>${monster.cr}</p>
    </div>

    <hr class="orange-border">

    ${monster.traits && monster.traits.length ? `
      ${monster.traits.map(t => `
