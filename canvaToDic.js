import { MajValDepart, MajEtatDepart, MajReseau, reseau } from "./varGlobales.js";

function transformationIn(places, transitions, arcs) {
  const reseaux = {};

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
    reseaux[label] = [p.value ?? 0];
  });

  transitions.forEach(t => {
    const label = transitionIdToLabel[t.id];
    reseaux[label] = [0];
  });

  // Ajout des arcs sortants
  arcs.forEach(a => {
    const weight = a.value ?? 1;

    // Place to Transition
    if (placeIdToLabel[a.from] && transitionIdToLabel[a.to]) {
      const fromLabel = placeIdToLabel[a.from];
      const toLabel = transitionIdToLabel[a.to];
      reseaux[fromLabel].push([toLabel, weight]);
    }

    // Transition to Place
    if (transitionIdToLabel[a.from] && placeIdToLabel[a.to]) {
      const fromLabel = transitionIdToLabel[a.from];
      const toLabel = placeIdToLabel[a.to];
      reseaux[fromLabel].push([toLabel, weight]);
    }
  });

  return MajReseau(reseaux);
}

//version zoli pour afficher le dictionnaire du réseau dans la zone de texte
function formatReseau(res) {
  const lines = [];

  for (const [key, value] of Object.entries(res)) {
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

function transformationOut(places, transitions, arcs) {
  // Reconstruction des labels
  const placeLabelToId = {};
  const transitionLabelToId = {};

  places.forEach((p, index) => {
    placeLabelToId[`E${index + 1}`] = p.id;
  });

  transitions.forEach((t, index) => {
    transitionLabelToId[`T${index + 1}`] = t.id;
  });

  // Mise à jour des etats (jetons)
  const updatedPlaces = places.map(p => {
    const label = Object.keys(placeLabelToId).find(
      l => placeLabelToId[l] === p.id
    );

    if (!label || !reseau[label]) return p;

    return {
      ...p,
      value: reseau[label][0], // nombre de jetons
    };
  });

  // Mise à jour des arcs (poids)
  const updatedArcs = arcs.map(a => {
    let fromLabel = null;
    let toLabel = null;

    if (placeLabelToId) {
      fromLabel = Object.keys(placeLabelToId).find(
        l => placeLabelToId[l] === a.from
      );
      toLabel = Object.keys(placeLabelToId).find(
        l => placeLabelToId[l] === a.to
      );
    }

    if (transitionLabelToId) {
      fromLabel =
        fromLabel ??
        Object.keys(transitionLabelToId).find(
          l => transitionLabelToId[l] === a.from
        );

      toLabel =
        toLabel ??
        Object.keys(transitionLabelToId).find(
          l => transitionLabelToId[l] === a.to
        );
    }

    if (!fromLabel || !reseau[fromLabel]) return a;

    const arcDef = reseau[fromLabel]
      .slice(1)
      .find(([dest]) => dest === toLabel);

    if (!arcDef) return a;

    return {
      ...a,
      value: arcDef[1],
    };
  });

  return {
    places: updatedPlaces,
    arcs: updatedArcs,
  };
}

export {transformationIn, transformationOut, formatReseau};
