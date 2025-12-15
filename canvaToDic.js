function transformationIn(places, transitions, arcs) {
  const reseau = {};

  // Création des labels E1, E2, T1, T2
  const placeIdToLabel = {};
  const transitionIdToLabel = {};

  places.forEach((p, index) => {
    placeIdToLabel[p.id] = `E${index + 1}`;
  });

  transitions.forEach((t, index) => {
    transitionIdToLabel[t.id] = `T${index + 1}`;
  });

  // Initialisation des noeuds
  places.forEach(p => {
    const label = placeIdToLabel[p.id];
    reseau[label] = [p.value ?? 0];
  });

  transitions.forEach(t => {
    const label = transitionIdToLabel[t.id];
    reseau[label] = [0];
  });

  // Ajout des arcs sortants
  arcs.forEach(a => {
    const weight = a.value ?? 1;

    // Place to Transition
    if (placeIdToLabel[a.from] && transitionIdToLabel[a.to]) {
      const fromLabel = placeIdToLabel[a.from];
      const toLabel = transitionIdToLabel[a.to];
      reseau[fromLabel].push([toLabel, weight]);
    }

    // Transition to Place
    if (transitionIdToLabel[a.from] && placeIdToLabel[a.to]) {
      const fromLabel = transitionIdToLabel[a.from];
      const toLabel = placeIdToLabel[a.to];
      reseau[fromLabel].push([toLabel, weight]);
    }
  });

  return reseau;
}

//version zoli pour afficher le dictionnaire du réseau dans la zone de texte
function formatReseau(reseau) {
  const lines = [];

  for (const [key, value] of Object.entries(reseau)) {
    const tokens = value[0];
    const arcs = value
      .slice(1)
      .map(([to, w]) => `["${to}",${w}]`)
      .join(",");

    const content = arcs
      ? `${tokens},${arcs}`
      : `${tokens}`;

    lines.push(`  "${key}": [${content}]`);
  }

  return `{\n${lines.join(",\n")}\n}`;
}


export {transformationIn, formatReseau};
