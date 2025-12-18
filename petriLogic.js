import { valDepart, etatDepart } from "./varGlobales";

var reseau = { 
    "E1": [10, ["T1", 2]], 
    "T1": [0, ["E2", 1], ["E4", 1]], 
    "E2": [0, ["T2", 2]], 
    "E4": [0, ["T2", 2]], 
    "T2": [0, ["E3", 1], ["E5", 1]], 
    "E3": [0], 
    "E5": [0]
};
/*
isBipartite - Vérifie que le réseau Petri est bien structuré
Description: Un réseau valide a deux groupes distincts : les états (E) connectés uniquement aux transitions (T), 
et vice-versa. Cette séparation garantit qu'on alterne toujours entre états et transitions.
Fonctionnement: Utilise un algorithme de coloration avec BFS. On assigne couleur 0 au premier nœud, puis couleur 1 à ses voisins, 
puis couleur 0 aux voisins de ces voisins, etc. Si deux nœuds voisins ont la même couleur, c'est qu'il y a un problème de structure.
Retourne: booléen (true si le graphe est bipartite donc structure valide, false si conflit détecté)
Relations: Fonction de validation indépendante, appelée avant toute simulation pour vérifier l'intégrité structurelle du réseau
*/
function isBipartite(graph) {
    const color = {};
    const nodes = Object.keys(graph);

    for (const element of nodes) {
        if (!(element in color)) {
            color[element] = 0;
            const queue = [element];

            while (queue.length > 0) {
                const noeud = queue.shift();
                const voisins = graph[noeud].slice(1).map(voisin => voisin[0]);

                for (const voisin of voisins) {
                    if (!(voisin in color)) {
                        color[voisin] = 1 - color[noeud];
                        queue.push(voisin);
                    } else if (color[voisin] === color[noeud]) {
                        console.log("Conflit:", noeud, "↔", voisin);
                        return false;
                    }
                }
            }
        }
    }

    /* Debugg

    const p1 = [];
    const p2 = [];
    for (const noeud of nodes) {
        if (color[noeud] === 0) p1.push(noeud);
        else p2.push(noeud);
    }

    console.log("partition p1 :", p1);
    console.log("partition p2 :", p2);
    */

    return true;
}

/*
marquageValide - Vérifie la cohérence des jetons dans le réseau
Description: Parcourt tous les nœuds pour s'assurer que chaque nombre de jetons est un entier positif ou nul. 
Évite les situations impossibles comme des jetons négatifs ou des valeurs décimales.
Fonctionnement: Parcourt chaque état et transition, vérifie que la valeur est un entier avec Number.isInteger() et qu'elle est >= 0. 
Vérifie aussi que l'état de départ existe.
Retourne: booléen (true si tous les marquages sont valides, false dès qu'une valeur invalide est détectée)
Relations: Fonction de validation appelée avant le lancement de simulations, travaille indépendamment des autres fonctions
*/
function marquageValide(reseau) {

  if (!reseau.hasOwnProperty(etatDepart)) {
    return false;
  }

  if (!Number.isInteger(valDepart) || valDepart < 0) {
    return false;
  }

  for (const noeud in reseau) {
    const valeur = reseau[noeud][0];

    if (!Number.isInteger(valeur) || valeur < 0) {
      return false;
    }
  }

  return true;
}

/*
isConnex - Vérifie qu'il n'y a pas de parties isolées dans le réseau
Description: Utilise BFS pour explorer le graphe depuis un point de départ. Si on peut atteindre tous les nœuds, le réseau est connexe. 
Crucial car des parties déconnectées rendraient certaines transitions inaccessibles.
Fonctionnement: Démarre du premier nœud, explore tous ses voisins avec BFS en maintenant un Set des nœuds visités. 
Compare la taille finale du Set avec le nombre total de nœuds.
Retourne: booléen (true si tous les nœuds sont atteignables, false si des nœuds restent isolés)
Relations: Fonction de validation structurelle utilisée avant simulation, indépendante des autres validations
*/
function isConnex(graph){
    const nodes = Object.keys(graph);
    const debut = nodes[0];
    const noeuds_visites = new Set;

    const queue = [debut];

    while (queue.length > 0) {
        const noeud = queue.shift();

        if (!noeuds_visites.has(noeud)){
            noeuds_visites.add(noeud);
            const voisins = graph[noeud].slice(1).map(voisin => voisin[0]);
            for (const voisin of voisins) {
                if (!noeuds_visites.has(voisin)){
                    queue.push(voisin);
                }
            }
        }
    }

    return noeuds_visites.size === nodes.length;
}


/*
marquageInitial - Extrait une vue simplifiée des jetons dans les états
Description: Transforme la structure complexe du réseau en un objet simple contenant juste les états et leurs jetons. 
Pratique pour afficher l'état actuel ou créer des copies rapides lors de simulations.
Fonctionnement: Parcourt tous les nœuds du graphe, filtre uniquement ceux qui commencent par "E" (états), et extrait leur nombre de jetons.
Retourne: objet de type {E1: 10, E2: 5, E3: 0} associant chaque état à son nombre de jetons
Relations: Utilisée par calculNouveauMarquage, isBorne, isInvariantTransitions et isInvariantConservation pour manipuler les marquages
*/
function marquageInitial(graph) {
    const marquage = {};
    for (const noeud in graph) {
        if (noeud.startsWith("E")) {
            marquage[noeud] = graph[noeud][0];
        }
    }
    return marquage;
}

/*
calculNouveauMarquage - Simule le tir d'une transition de manière hypothétique
Description: Crée une copie du marquage, retire les jetons nécessaires des états d'entrée, ajoute les jetons aux états de sortie.
Important: L'original n'est jamais touché. C'est pour tester "et si on tirait cette transition?" sans modifier le réseau réel.
IMPORTANT: Gère le cas où un même état a plusieurs arcs vers la même transition (somme des poids).
Fonctionnement:
1. Crée une copie du marquage avec spread operator {...marquage}
2. Parcourt tous les états pour trouver ceux qui pointent vers la transition (états d'entrée)
3. Pour chaque état, accumule les poids de tous les arcs qui pointent vers la transition
4. Retire la somme totale des jetons de l'état selon les poids cumulés (consommation)
5. Ajoute les jetons aux états de sortie de la transition (production)
6. Retourne le nouveau marquage sans toucher l'original
Retourne: nouveau marquage (objet) avec les jetons mis à jour, l'original reste intact
Relations: Utilisée par isBorne pour tester plusieurs tirs sans modifier le réseau réel. Différente de echangeRessources qui mute.
*/
function calculNouveauMarquage(transition, marquage, graph) {
    const nouveau = { ...marquage };

    for (const noeud in graph) {
        if (noeud.startsWith("E")) {
            let total_poids = 0;
            
            for (const arc of graph[noeud].slice(1)) {
                const [destination, poids] = arc;
                if (destination === transition) {
                    total_poids = total_poids + poids;
                }
            }
            
            if (total_poids > 0) {
                nouveau[noeud] -= total_poids;
            }
        }
    }

    for (const arc of graph[transition].slice(1)) {
        const [destination, poids] = arc;
        if (destination.startsWith("E")) {
            nouveau[destination] += poids;
        }
    }

    return nouveau;
}

/*
isFranchissable - Vérifie si une transition peut être tirée
Description: Parcourt tous les états qui pointent vers cette transition et vérifie qu'ils ont assez de jetons.
IMPORTANT: Gère le cas où un même état a plusieurs arcs vers la même transition (somme des poids).
Exemple simple: Si E1→T1 avec poids 2, alors E1 doit avoir au moins 2 jetons pour que T1 soit franchissable.
Exemple multi-arcs: Si E1 a deux arcs vers T1 (poids 2 et 3), alors E1 doit avoir au moins 5 jetons (2+3).
Fonctionnement:
1. Parcourt tous les nœuds du réseau
2. Pour chaque état (E), regarde tous ses arcs sortants
3. Accumule les poids de tous les arcs qui pointent vers la transition demandée
4. Vérifie que l'état a assez de jetons pour la somme totale des poids
5. Si un seul état manque de jetons, retourne false
6. Si tous les états d'entrée ont assez de jetons, retourne true
Retourne: booléen (true si la transition peut être tirée, false sinon)
Relations: Appelée AVANT echangeRessources dans simulation. Utilisée par isDeadlock et isBorne.
*/
function isFranchissable(currentReseau, transitionId) {
    for (const noeud in currentReseau) {
        if (noeud.startsWith("E")) {
            let total_poids = 0;

            const arcs = currentReseau[noeud].slice(1);
            for (const arc of arcs) {
                const [destination, poids] = arc;
                if (destination === transitionId) {
                    total_poids = total_poids + poids;
                }
            }
            
            if (total_poids > 0 && currentReseau[noeud][0] < total_poids) {
                return false;
            }
        }
    }
    return true;
}

/*
echangeRessources - Exécute le tir d'une transition pour de vrai
Description: Contrairement à calculNouveauMarquage, cette fonction modifie directement l'objet reseau.
Retire les jetons des états d'entrée, ajoute les jetons aux états de sortie.
IMPORTANT: Gère le cas où un même état a plusieurs arcs vers la même transition (somme des poids retirés).
Fonctionnement:
1. Parcourt tous les états du réseau
2. Pour chaque état, accumule les poids de tous les arcs qui pointent vers la transition
3. Retire la somme totale des jetons de l'état (consommation)
4. Parcourt les arcs sortants de la transition
5. Ajoute les jetons aux états de sortie selon les poids (production)
6. Mutation directe: reseau[noeud][0] -= total_poids ou += poids
Retourne: rien (void) car la mutation de reseau est l'effet voulu
Relations: Appelée par simulation APRÈS vérification avec isFranchissable. Différente de calculNouveauMarquage (retourne copie).
Changements: Amélioration pour gérer plusieurs arcs d'un même état vers une transition (cohérence avec isFranchissable)
*/
function echangeRessources(reseau, transitionId) {
    for (const noeud in reseau) {
        if (noeud.startsWith("E")) {
            let total_poids = 0;
            
            const arcs = reseau[noeud].slice(1);
            for (const arc of arcs) {
                const [destination, poids] = arc;
                if (destination === transitionId) {
                    total_poids = total_poids + poids;
                }
            }
            
            if (total_poids > 0) {
                reseau[noeud][0] -= total_poids;
            }
        }
    }

    const sortiesTransition = reseau[transitionId].slice(1);
    for (const arc of sortiesTransition) {
        const [destination, poids] = arc;
        reseau[destination][0] += poids;
    }

    return reseau
}

/*
isDeadlock - Détecte si le système est bloqué définitivement
Description: Parcourt toutes les transitions et vérifie si au moins une est franchissable.
Si aucune transition n'est tirable, le système est en deadlock (arrêt définitif).
Fonctionnement:
1. Parcourt tous les nœuds du réseau
2. Pour chaque transition (T), appelle isFranchissable
3. Si au moins une transition est franchissable, retourne false (pas de deadlock)
4. Si toutes les transitions sont infranchissables, retourne true (deadlock détecté)
Importance: Un deadlock signifie que le système ne peut plus évoluer. C'est un état terminal indésirable dans beaucoup de systèmes.
Retourne: booléen (true si deadlock détecté, false si au moins une transition est franchissable)
Relations: Appelée après des simulations pour détecter l'arrêt du système. Utilise isFranchissable.
*/
function isDeadlock(reseau) {
    for (const noeud in reseau) {
        if (noeud.startsWith("T")) {
            if (isFranchissable(reseau, noeud)) {
                return false;
            }
        }
    }
    return true;
}

/*
isBorne - Vérifie qu'aucun état ne peut accumuler trop de jetons
Description: Simule plusieurs tirs de transitions pour explorer l'espace d'états et détecter si un état dépasse borneMax.
Importance: Une simple vérification de l'état actuel ne suffit pas. Le réseau pourrait avoir E1=5 au départ mais après 10 tirs, E1=50.
Fonctionnement:
1. Démarre avec le marquage initial
2. Utilise une queue FIFO (BFS complète) pour explorer TOUS les marquages possibles
3. Pour chaque marquage de la queue (jusqu'à maxIterations=1000):
   a. Vérifie si un état > borneMax → retourne false immédiatement
   b. Trouve toutes les transitions franchissables
   c. Pour chaque transition franchissable, simule son tir avec calculNouveauMarquage
   d. Ajoute les nouveaux marquages uniques à la queue (évite boucles infinies avec Set)
4. Si aucun dépassement trouvé après exploration complète → retourne true
Méthode: Utilise BFS avec queue FIFO pour explorer tout l'espace d'états. Set de marquages visités pour éviter de revisiter les mêmes états.
Particularités gérées: Cycles accumulateurs, branches parallèles, réseaux complexes.
Paramètres: graph (réseau), borneMax (limite de jetons par état), maxIterations (limite d'exploration, défaut=5000)
Retourne: booléen (false si un état dépasse borneMax, true si tous respectent la borne)
Relations: Utilise calculNouveauMarquage pour simulations hypothétiques sans modifier le réseau réel.
*/
function isBorne(graph, borneMax) {
    const marquageInitial_debut = marquageInitial(graph);
    const queue = [marquageInitial_debut];
    const visites = new Set();
    visites.add(JSON.stringify(marquageInitial_debut));
    
    while (queue.length > 0) {
        const marquageActuel = queue.shift();
        
        for (const noeud in graph) {
            if (noeud.startsWith("E")) {
                if (marquageActuel[noeud] > borneMax) {
                    return false;
                }
            }
        }
        
        for (const transition in graph) {
            if (transition.startsWith("T")) {
                let peutTirer = true;
                for (const etat in graph) {
                    if (etat.startsWith("E")) {
                        const arcs = graph[etat].slice(1);
                        for (const arc of arcs) {
                            const [destination, poids] = arc;
                            if (destination === transition && marquageActuel[etat] < poids) {
                                peutTirer = false;
                                break;
                            }
                        }
                        if (!peutTirer) break;
                    }
                }
                
                if (peutTirer) {
                    const nouveauMarquage = calculNouveauMarquage(transition, marquageActuel, graph);
                    const marquageStr = JSON.stringify(nouveauMarquage);
                    
                    if (!visites.has(marquageStr)) {
                        visites.add(marquageStr);
                        queue.push(nouveauMarquage);
                    }
                }
            }
        }
    }
    
    return true;
}

/*
isInvariantTransitions - Vérifie qu'il existe une séquence de transitions qui ramène au marquage initial
Description: Explore l'espace d'états pour trouver un cycle qui revient au marquage de départ.
Un invariant de transitions signifie qu'on peut tirer des transitions et revenir exactement à l'état initial.
Exemple: Si on tire T1, puis T2, puis T3 et qu'on retrouve le marquage initial → invariant existe.
Fonctionnement:
1. Sauvegarde le marquage initial comme référence
2. Utilise BFS pour explorer l'espace d'états en tirant toutes les transitions possibles
3. Pour chaque nouveau marquage atteint, vérifie s'il correspond au marquage initial
4. Garde trace de la profondeur (nombre de tirs) pour éviter le marquage initial trivial (0 tirs)
5. Si on retrouve le marquage initial après au moins 1 tir → retourne true (invariant existe)
6. Si exploration complète sans trouver de cycle → retourne false
Méthode: BFS avec queue de paires (marquage, profondeur). Limite à maxDepth tirs pour éviter explosion combinatoire.
Paramètres: graph (réseau), maxDepth (profondeur max d'exploration, défaut=20)
Retourne: booléen (true si invariant trouvé, false sinon)
Relations: Fonction d'analyse avancée. Utilise calculNouveauMarquage pour simulations hypothétiques.
*/
function isInvariantTransitions(graph) {
    const marquageInitial_ref = marquageInitial(graph);
    const marquageInitialStr = JSON.stringify(marquageInitial_ref);
    
    const queue = [marquageInitial_ref];
    const visites = new Set();
    visites.add(marquageInitialStr);
    let premiereIteration = true;
    
    while (queue.length > 0) {
        const marquageActuel = queue.shift();
        
        if (!premiereIteration && JSON.stringify(marquageActuel) === marquageInitialStr) {
            return true;
        }
        premiereIteration = false;
        
        for (const transition in graph) {
            if (transition.startsWith("T")) {
                let peutTirer = true;
                for (const etat in graph) {
                    if (etat.startsWith("E")) {
                        let total_poids = 0;
                        const arcs = graph[etat].slice(1);
                        for (const arc of arcs) {
                            const [destination, poids] = arc;
                            if (destination === transition) {
                                total_poids += poids;
                            }
                        }
                        if (total_poids > 0 && marquageActuel[etat] < total_poids) {
                            peutTirer = false;
                            break;
                        }
                    }
                }
                
                if (peutTirer) {
                    const nouveauMarquage = calculNouveauMarquage(transition, marquageActuel, graph);
                    const nouveauMarquageStr = JSON.stringify(nouveauMarquage);
                    
                    if (nouveauMarquageStr === marquageInitialStr) {
                        return true;
                    }
                    
                    if (!visites.has(nouveauMarquageStr)) {
                        visites.add(nouveauMarquageStr);
                        queue.push(nouveauMarquage);
                    }
                }
            }
        }
    }
    
    return false;
}

/*
isInvariantConservation - Vérifie que le nombre total de jetons reste constant
Description: Un invariant de conservation (P-invariant) signifie qu'aucune transition ne crée ni ne détruit de jetons.
Les jetons circulent uniquement, le total reste toujours identique au total initial.
Exemple conservatif: E1(5) --1--> T1 --1--> E2(0). Total avant = 5, total après = 5 ✓
Exemple non-conservatif: E1(5) --2--> T1 --1--> E2(0). T1 consomme 2, produit 1 → perte nette ✗
Fonctionnement:
1. Calcule le nombre total de jetons au marquage initial
2. Utilise BFS pour explorer l'espace d'états en tirant toutes les transitions possibles
3. Pour chaque nouveau marquage atteint, calcule le total de jetons
4. Si un marquage a un total différent du total initial → retourne false immédiatement
5. Si tous les marquages explorés ont le même total → retourne true
Méthode: BFS avec vérification du total à chaque étape. Limite à maxStates marquages pour performances.
Conditions de conservation: Pour chaque transition T, somme(poids_entrées) = somme(poids_sorties)
Paramètres: graph (réseau), maxStates (nombre max de marquages à explorer, défaut=1000)
Retourne: booléen (true si conservation respectée, false si création/destruction détectée)
Relations: Fonction d'analyse de propriété structurelle. Utilise calculNouveauMarquage pour simulations.
*/
function isInvariantConservation(graph) {
    const marquageInitial_ref = marquageInitial(graph);
    
    let totalInitial = 0;
    for (const etat in marquageInitial_ref) {
        totalInitial += marquageInitial_ref[etat];
    }
    
    const queue = [marquageInitial_ref];
    const visites = new Set();
    visites.add(JSON.stringify(marquageInitial_ref));
    
    while (queue.length > 0) {
        const marquageActuel = queue.shift();
        
        let totalActuel = 0;
        for (const etat in marquageActuel) {
            totalActuel += marquageActuel[etat];
        }
        
        if (totalActuel !== totalInitial) {
            return false;
        }
        
        for (const transition in graph) {
            if (transition.startsWith("T")) {
                let peutTirer = true;
                for (const etat in graph) {
                    if (etat.startsWith("E")) {
                        let total_poids = 0;
                        const arcs = graph[etat].slice(1);
                        for (const arc of arcs) {
                            const [destination, poids] = arc;
                            if (destination === transition) {
                                total_poids += poids;
                            }
                        }
                        if (total_poids > 0 && marquageActuel[etat] < total_poids) {
                            peutTirer = false;
                            break;
                        }
                    }
                }
                
                if (peutTirer) {
                    const nouveauMarquage = calculNouveauMarquage(transition, marquageActuel, graph);
                    const marquageStr = JSON.stringify(nouveauMarquage);
                    
                    if (!visites.has(marquageStr)) {
                        visites.add(marquageStr);
                        queue.push(nouveauMarquage);
                    }
                }
            }
        }
    }
    
    return true;
}

/*
tarjan - Algorithme de Tarjan pour trouver les composantes fortement connexes
Description: Identifie tous les sous-graphes fortement connexes (SCCs) en utilisant DFS avec indices.
Un sous-graphe fortement connexe est un ensemble maximal de nœuds où chaque nœud peut atteindre tous les autres.
Structure: Fonction principale avec fonction auxiliaire strongconnect interne (closure).
Algorithme en temps linéaire O(V+E) optimal pour identifier les SCCs.
Fonctionnement:
1. Initialise index = 0, stack vide, nodeData pour stocker index/lowlink/onStack
2. Pour chaque nœud v non visité du graphe :
   - Appelle strongconnect(v) qui explore récursivement
3. strongconnect(v) :
   - Assigne index et lowlink au nœud
   - Empile le nœud (onStack = true)
   - Explore chaque successeur w :
     * Si w non visité : recurse, puis v.lowlink = min(v.lowlink, w.lowlink)
     * Si w dans pile : v.lowlink = min(v.lowlink, w.index) [arc de retour]
   - Si v.lowlink == v.index : v est racine d'une SCC
     * Dépile tous les nœuds jusqu'à v → forme une SCC complète
4. Retourne tableau de SCCs (chaque SCC = tableau de nœuds)
Méthode: DFS avec pile et lowlink pour détecter les racines de SCCs.
Paramètres: graph (réseau de Petri)
Retourne: tableau de tableaux (chaque sous-tableau = une SCC avec ses nœuds)
Relations: Fonction d'analyse structurelle avancée. Détecte les cycles et la modularité du réseau.
*/
function tarjan(graph) {
    const nodes = Object.keys(graph);
    let index = 0;
    const stack = [];
    const nodeData = {};
    const sccs = [];
    
    for (const noeud of nodes) {
        nodeData[noeud] = {
            index: undefined,
            lowlink: undefined,
            onStack: false
        };
    }
    
    function strongconnect(v) {
        nodeData[v].index = index;
        nodeData[v].lowlink = index;
        index++;
        stack.push(v);
        nodeData[v].onStack = true;
        
        const successeurs = graph[v].slice(1).map(arc => arc[0]);
        
        for (const w of successeurs) {
            if (nodeData[w].index === undefined) {
                strongconnect(w);
                nodeData[v].lowlink = Math.min(nodeData[v].lowlink, nodeData[w].lowlink);
            } else if (nodeData[w].onStack) {
                nodeData[v].lowlink = Math.min(nodeData[v].lowlink, nodeData[w].index);
            }
        }
        
        if (nodeData[v].lowlink === nodeData[v].index) {
            const scc = [];
            let w;
            do {
                w = stack.pop();
                nodeData[w].onStack = false;
                scc.push(w);
            } while (w !== v);
            sccs.push(scc);
        }
    }
    
    for (const v of nodes) {
        if (nodeData[v].index === undefined) {
            strongconnect(v);
        }
    }
    
    return sccs;
}

function puits(graph){
    let puit = [];
    for (let node in graph){
        if (graph[node].length === 1){
            puit.push(node);
        }
    }
    return puit;
}

function sources(graph){
    let compare = [];
    let source = [];

    for (let node in graph){
        for (let i = 1; i < graph[node].length; i++){
            if (!compare.includes(graph[node][i][0])){
                compare.push(graph[node][i][0]);
            }
        }
    }
    for (let node in graph){
        if (!compare.includes(node)){
            source.push(node);
        }
    }

    return source;
}

//vérifie si le réseau est simple 
function estSimple(graph) {
    for (let node in graph) {
        let liens = [];

        for (let i = 1; i < graph[node].length; i++) {
            let cible = graph[node][i][0];

            for (let j = 0; j < liens.length; j++) {
                if (liens[j] === cible) {
                    return false;
                }
            }
            liens.push(cible);
        }
    }
    return true;
}

function DFS(départ) {
    var visités = [];
    var étatsTrouvés = [];
    var pile = [départ];

    while (pile.length > 0) {
        var noeud = pile.pop();

        if (!(visités.includes(noeud))){
            visités.push(noeud);
            if (noeud[0] === "E") {
                étatsTrouvés.push(noeud);
            }

             var arcs = currentReseau[noeud];
            for (var j = 1; j < arcs.length; j++) {
                var voisin = arcs[j][0];
                pile.push(voisin);
            }
        }
    }

    return étatsTrouvés;
}

function reachable(from, to, graph) {
  const visited = new Set();
  const queue = [from];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === to) return true;

    if (visited.has(current)) continue;
    visited.add(current);

    (graph[current] || []).forEach(next => queue.push(next));
  }
  return false;
}

function isLive() {
  // 1. Construire le graphe d’atteignabilité
  const graph = buildReachabilityGraph(currentReseau);
  const markings = Object.keys(graph);

  // 2. Pour chaque marquage atteignable
  for (const M of markings) {

    // Reconstruire un réseau avec ce marquage
    for (const transition in currentReseau) {
      if (!transition.startsWith("T")) continue;

      let transitionVivante = false;

      // 3. Chercher un futur où la transition est franchissable
      for (const M2 of markings) {
        if (reachable(M, M2, graph)) {

          // Recréer le réseau correspondant à M2
          const reseauM2 = JSON.parse(JSON.stringify(currentReseau));
          const tokens = M2.split(",").map(Number);

          let i = 0;
          for (const node in reseauM2) {
            if (node.startsWith("E")) {
              reseauM2[node][0] = tokens[i++];
            }
          }

          if (isEnabled(reseauM2, transition)) {
            transitionVivante = true;
            break;
          }
        }
      }

      // 4. Transition morte → réseau non vivant
      if (!transitionVivante) {
        return false;
      }
    }
  }

  // 5. Toutes les transitions sont vivantes
  return true;
}

/*
simulation - Fonction principale appelée par l'UI
Description: Vérifie d'abord avec isFranchissable si la transition peut être tirée. Si oui, appelle echangeRessources pour exécuter le tir.
Si non, ne fait rien. C'est le point d'entrée pour le joueur qui clique sur une transition.
Fonctionnement:
1. crée deux clones du réseau (nécéssaire) l'un pour trouver toutes les transitions faisables à l'instant T et l'auter pout les modifiers
1. Appelle isFranchissable(reseau, transitionId) pour vérifier si tirable
2. Si true, appelle echangeRessources(reseau, transitionId) pour modifier le réseau
3. Si false, ne fait rien (la transition ne peut pas être tirée)
Usage: L'UI React appellera cette fonction quand l'utilisateur clique sur une transition dans le canvas.
Retourne: rien (void), mais modifie reseau si la transition est franchissable
Relations: Point d'entrée principal. Utilise isFranchissable et echangeRessources.
*/
function simulation(reseauLocal) {
    let copy = structuredClone(reseauLocal);
    let res = structuredClone(reseauLocal);

    for (let elem in copy){
        if (elem.startsWith("T")){
            if (isFranchissable(copy, elem) && isFranchissable(res, elem)) {
                res = echangeRessources(res, elem);
            }
        }
    }
    return res;
}

export {isBipartite, isConnex, marquageInitial, calculNouveauMarquage, isFranchissable, echangeRessources, isDeadlock, isBorne, simulation, isInvariantTransitions, isInvariantConservation, tarjan, DFS, estSimple, isLive, marquageValide, puits, sources, reseau };

