var reseau = { 
    "E1": [10, ["T1", 2]], 
    "T1": [0, ["E2", 1], ["E4", 1]], 
    "E2": [0, ["T2", 2]], 
    "E4": [0, ["T2", 2]], 
    "T2": [0, ["E3", 1], ["E5", 1]], 
    "E3": [0], 
    "E5": [0]
};

var etatDepart;
etatDepart = "E1";

var valDepart;
valDepart = 10;

/*
isBipartite - Vérifie que le réseau Petri est bien structuré
Description: Un réseau valide a deux groupes : les états (E) sont toujours connectés à des transitions (T), et inversement.
Méthode: Utilise une technique de coloration avec BFS (Breadth-First Search). Si on peut colorier tous les nœuds en 2 couleurs 
où les voisins ont toujours des couleurs différentes, le graphe est bipartite.
Fonctionnement: Démarre d'un nœud, lui assigne couleur 0, explore ses voisins avec BFS et leur assigne couleur 1.
Si un voisin a déjà la même couleur que le nœud actuel, il y a conflit et le graphe n'est pas bipartite.
Retourne: booléen (true si bipartite, false si conflit détecté)
Relations: Fonction de validation indépendante, utilisée avant la simulation
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
isConnex - Vérifie qu'il n'y a pas de parties du réseau isolées
Description: Démarre d'un nœud et explore tous les voisins avec BFS. Si on peut atteindre tous les nœuds, le réseau est connexe.
Importance: Crucial car un réseau avec des parties déconnectées ne peut pas fonctionner correctement.
Méthode: Utilise BFS pour parcourir le graphe. Maintient un Set de nœuds visités. Compare la taille du Set avec le nombre total de nœuds.
Retourne: booléen (true si tous les nœuds sont atteignables, false si des nœuds sont isolés)
Relations: Fonction de validation indépendante, utilisée avant la simulation
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
marquageInitial - Extrait les jetons de chaque état sous forme simplifiée
Description: Prend le réseau complet et retourne un objet simplifié contenant uniquement les états avec leur nombre de jetons.
Exemple: {E1: 10, E2: 0, E3: 0} au lieu de la structure complète du réseau.
Utilité: Pratique pour l'affichage UI et pour créer des copies du marquage pour les simulations hypothétiques.
Retourne: objet avec états comme clés et nombre de jetons comme valeurs
Relations: Utilisée par calculNouveauMarquage, isBorne, et pour l'affichage dans les tests
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
function isFranchissable(reseau, transitionId) {
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
            
            if (total_poids > 0 && reseau[noeud][0] < total_poids) {
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
simulation - Fonction principale appelée par l'UI
Description: Vérifie d'abord avec isFranchissable si la transition peut être tirée. Si oui, appelle echangeRessources pour exécuter le tir.
Si non, ne fait rien. C'est le point d'entrée pour le joueur qui clique sur une transition.
Fonctionnement:
1. Appelle isFranchissable(reseau, transitionId) pour vérifier si tirable
2. Si true, appelle echangeRessources(reseau, transitionId) pour modifier le réseau
3. Si false, ne fait rien (la transition ne peut pas être tirée)
Usage: L'UI React appellera cette fonction quand l'utilisateur clique sur une transition dans le canvas.
Retourne: rien (void), mais modifie reseau si la transition est franchissable
Relations: Point d'entrée principal. Utilise isFranchissable et echangeRessources.
*/
function simulation(reseau, transitionId) {
    if (isFranchissable(reseau, transitionId)) {
        echangeRessources(reseau, transitionId);
    }
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

/*
lignes de test pour les fonctions => les enlever avant de push ou les rajouter si faire test
+ décommenter la ligne export
*/


export { reseau, isBipartite, isConnex, marquageInitial, calculNouveauMarquage, isFranchissable, echangeRessources, isDeadlock, isBorne, simulation, isInvariantTransitions, isInvariantConservation, tarjan };