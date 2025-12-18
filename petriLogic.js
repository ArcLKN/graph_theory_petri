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
function marquageValide(graph) {

  if (!graph.hasOwnProperty(etatDepart)) {
    return false;
  }

  if (!Number.isInteger(valDepart) || valDepart < 0) {
    return false;
  }

  for (const noeud in graph) {
    const valeur = graph[noeud][0];

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
calculNouveauMarquage - Simule un tir de transition de façon hypothétique
Description: Crée une copie du marquage actuel, simule le tir d'une transition dessus, et retourne le nouveau marquage sans jamais 
toucher à l'original. Permet de tester "et si on tirait cette transition ?" sans modifier le réseau réel.
Fonctionnement: Fait une copie du marquage avec {...marquage}, parcourt tous les états pour trouver ceux qui alimentent la transition 
(accumule les poids si plusieurs arcs), retire les jetons correspondants, puis ajoute les jetons aux états de sortie de la transition.
Point important: Gère les arcs multiples en cumulant les poids (si E1 a deux arcs vers T1 de poids 2 et 3, retire 5 jetons de E1).
Retourne: nouveau objet marquage avec les jetons mis à jour, l'original reste intact.
Relations: Utilisée par isBorne, isInvariantTransitions et isInvariantConservation pour explorer l'espace d'états. Différente de 
echangeRessources qui modifie directement le réseau.
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
Description: Parcourt tous les états qui alimentent la transition et vérifie qu'ils ont assez de jetons. 
Une transition n'est franchissable que si TOUS ses états d'entrée ont suffisamment de ressources.
Fonctionnement: Pour chaque état du réseau, regarde ses arcs sortants et cumule les poids de ceux qui pointent vers la transition 
demandée. Si le total cumulé est supérieur aux jetons disponibles dans l'état, retourne false immédiatement.
Point important: Gère les arcs multiples en additionnant les poids (E1→T1 poids 2 + E1→T1 poids 3 = besoin de 5 jetons dans E1).
Retourne: booléen (true si tous les états d'entrée ont assez de jetons, false si au moins un état manque de ressources)
Relations: Toujours appelée AVANT echangeRessources dans simulation pour vérifier qu'un tir est possible. Utilisée aussi par 
isDeadlock et isBorne.
*/
function isFranchissable(graph, transitionId) {
    for (const noeud in graph) {
        if (noeud.startsWith("E")) {
            let total_poids = 0;

            const arcs = graph[noeud].slice(1);
            for (const arc of arcs) {
                const [destination, poids] = arc;
                if (destination === transitionId) {
                    total_poids = total_poids + poids;
                }
            }
            
            if (total_poids > 0 && graph[noeud][0] < total_poids) {
                return false;
            }
        }
    }
    return true;
}

/*
echangeRessources - Exécute réellement le tir d'une transition
Description: Modifie directement le réseau en retirant les jetons des états d'entrée et en ajoutant les jetons aux états de sortie. 
Contrairement à calculNouveauMarquage qui simule, celle-ci change vraiment le réseau.
Fonctionnement: Parcourt tous les états pour trouver ceux qui alimentent la transition, cumule les poids de leurs arcs (gère les arcs 
multiples), retire les jetons correspondants. Ensuite parcourt les sorties de la transition et ajoute les jetons aux états de 
destination.
Point important: Mutation directe avec -= et += sur le réseau passé en paramètre, pas de copie créée.
Retourne: le réseau modifié (même si la modification est faite en place)
Relations: Appelée par simulation APRÈS vérification avec isFranchissable. Opposée à calculNouveauMarquage qui retourne une copie.
*/
function echangeRessources(graph, transitionId) {
    for (const noeud in graph) {
        if (noeud.startsWith("E")) {
            let total_poids = 0;
            
            const arcs = graph[noeud].slice(1);
            for (const arc of arcs) {
                const [destination, poids] = arc;
                if (destination === transitionId) {
                    total_poids = total_poids + poids;
                }
            }
            
            if (total_poids > 0) {
                graph[noeud][0] -= total_poids;
            }
        }
    }

    const sortiesTransition = graph[transitionId].slice(1);
    for (const arc of sortiesTransition) {
        const [destination, poids] = arc;
        graph[destination][0] += poids;
    }

    return graph
}

/*
isDeadlock - Détecte si le système est bloqué définitivement
Description: Vérifie si au moins une transition reste franchissable. Si toutes les transitions sont bloquées, le système ne peut plus 
évoluer donc c'est un deadlock, un état terminal généralement indésirable.
Fonctionnement: Parcourt toutes les transitions du réseau et appelle isFranchissable sur chacune. Dès qu'une transition est 
franchissable, retourne false (pas de deadlock). Si la boucle complète sans trouver de transition franchissable, retourne true 
(deadlock détecté).
Retourne: booléen (true si toutes transitions bloquées donc deadlock, false si au moins une transition reste tirable)
Relations: Appelée après simulations ou lors de l'analyse du réseau. Dépend de isFranchissable pour tester chaque transition.
*/
function isDeadlock(graph) {
    for (const noeud in graph) {
        if (noeud.startsWith("T")) {
            if (isFranchissable(graph, noeud)) {
                return false;
            }
        }
    }
    return true;
}

/*
isBorne - Vérifie qu'aucun état ne peut accumuler infiniment de jetons
Description: Explore tous les marquages atteignables pour détecter si un état peut dépasser la borne maximale autorisée. 
Une vérification instantanée ne suffit pas car un état pourrait avoir 5 jetons maintenant mais monter à 100 après une séquence de tirs.
Fonctionnement: Utilise BFS avec queue pour explorer l'espace d'états complet. Pour chaque marquage exploré, vérifie qu'aucun 
état ne dépasse borneMax. Pour chaque transition franchissable, calcule le nouveau marquage avec calculNouveauMarquage et l'ajoute 
à la queue si pas déjà visité. Un Set évite de revisiter les mêmes marquages (terminaison garantie).
Point important: Explore tout l'espace d'états accessible, pas juste le marquage actuel. Peut prendre du temps sur de gros réseaux.
Retourne: booléen (false si un état peut dépasser borneMax, true si le réseau respecte toujours la borne)
Relations: Utilise marquageInitial pour démarrer et calculNouveauMarquage pour simuler les tirs. Fonctionne de façon indépendante.
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
isInvariantTransitions - Cherche un cycle qui ramène au marquage initial (T-invariant)
Description: Explore l'espace d'états pour trouver une séquence de transitions qui revient exactement au point de départ. 
Un T-invariant signifie qu'on peut tirer des transitions et retrouver le marquage initial - c'est un cycle complet du système.
Fonctionnement: Sauvegarde le marquage initial comme référence, puis explore avec BFS en tirant toutes les transitions possibles. 
Pour chaque nouveau marquage atteint, compare avec le marquage initial. Important : ignore la première itération (zéro tir) car 
c'est trivial. Si on retrouve le marquage initial après au moins un tir, retourne true immédiatement.
Point important: Utilise un Set pour éviter de revisiter les mêmes marquages. Exploration complète de l'espace d'états.
Retourne: booléen (true si un cycle existe ramenant au marquage initial, false si aucun cycle trouvé)
Relations: Fonction d'analyse avancée, utilise marquageInitial et calculNouveauMarquage pour les simulations hypothétiques
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
isInvariantConservation - Vérifie que le nombre total de jetons reste constant (P-invariant)
Description: Teste si les transitions créent ou détruisent des jetons. Un P-invariant signifie que les jetons ne font que circuler, 
le total reste identique au marquage initial.
Fonctionnement: Calcule le total de jetons au départ, puis explore tous les marquages atteignables avec BFS. Pour chaque marquage 
exploré, recalcule le total de jetons. Si un seul marquage a un total différent de l'initial, retourne false immédiatement 
(non-conservatif détecté).
Point important: Une seule violation suffit pour échouer. Tous les marquages doivent avoir exactement le même total.
Retourne: booléen (true si conservation respectée partout, false si création/destruction de jetons détectée)
Relations: Fonction d'analyse structurelle, utilise marquageInitial et calculNouveauMarquage pour explorer l'espace d'états
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
tarjan - Trouve les composantes fortement connexes (SCCs) du réseau
Description: Identifie tous les sous-graphes où chaque nœud peut atteindre tous les autres nœuds du même sous-graphe. 
Une SCC représente un groupe de nœuds fortement inter-connectés. Algorithme optimal en temps linéaire O(V+E).
Fonctionnement: Utilise DFS avec indices et lowlinks. Pour chaque nœud, assigne un index (ordre de visite) et un lowlink (
plus petit index atteignable par arcs descendants ou de retour). Empile les nœuds pendant le parcours. Quand un nœud a lowlink = index, 
c'est la racine d'une SCC et on dépile tous les nœuds jusqu'à lui pour former la composante.
Point important: La fonction interne strongconnect fait le travail récursif, la fonction principale initialise et collecte les 
résultats.
Retourne: tableau de SCCs, où chaque SCC est un tableau de nœuds appartenant à cette composante
Relations: Fonction d'analyse structurelle avancée indépendante. Révèle la modularité et les cycles du réseau.
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
puits - Trouve les nœuds terminaux sans sorties
Description: Identifie tous les nœuds qui n'ont aucune connexion sortante. Ce sont les destinations finales où les jetons s'accumulent 
sans pouvoir aller ailleurs. Dans la structure du réseau, un puits a une longueur de 1 (juste sa valeur, pas d'arcs).
Fonctionnement: Parcourt tous les nœuds et vérifie que leur tableau de connexions a une longueur de 1 (index 0 = valeur, pas d'index 
suivants pour les arcs).
Retourne: tableau contenant les identifiants des nœuds puits
Relations: Fonction d'analyse structurelle basique, indépendante des autres fonctions
*/
function puits(graph){
    let puit = [];
    for (let node in graph){
        if (graph[node].length === 1){
            puit.push(node);
        }
    }
    return puit;
}

/*
sources - Trouve les nœuds initiaux sans entrées
Description: Identifie tous les nœuds qui ne reçoivent aucun arc entrant. Ce sont les points de départ du réseau où les jetons 
commencent leur parcours, personne ne leur en envoie.
Fonctionnement: Crée d'abord un tableau de tous les nœuds qui sont destinations d'au moins un arc. Ensuite compare avec tous les 
nœuds du réseau - ceux qui n'apparaissent jamais comme destination sont les sources.
Retourne: tableau contenant les identifiants des nœuds sources
Relations: Fonction d'analyse structurelle basique, indépendante des autres fonctions
*/
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

/*
estSimple - Vérifie l'absence d'arcs multiples entre mêmes nœuds
Description: Parcourt tous les nœuds pour s'assurer qu'il n'existe pas deux arcs différents allant vers la même destination. 
Un réseau simple a au maximum un arc entre deux nœuds donnés.
Fonctionnement: Pour chaque nœud, collecte ses destinations dans un tableau temporaire. Si une destination apparaît deux fois, 
retourne false immédiatement (arc multiple détecté).
Retourne: booléen (true si le réseau est simple sans arcs multiples, false dès qu'un arc multiple est trouvé)
Relations: Fonction d'analyse structurelle qui caractérise le type de réseau, indépendante des autres fonctions
*/
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

/*
DFS - Parcours en profondeur du réseau depuis un point de départ
Description: Explore le graphe en profondeur à partir d'un nœud donné en suivant les arcs. Collecte tous les états (E) rencontrés 
pendant l'exploration.
Fonctionnement: Utilise une pile pour le parcours. Empile le nœud de départ, puis tant que la pile n'est pas vide : dépile un nœud, 
le marque comme visité, collecte-le s'il commence par "E", et empile tous ses voisins non visités.
Retourne: tableau des états (nœuds commençant par "E") trouvés pendant l'exploration
Relations: Fonction utilitaire de parcours, utilisée pour explorer le réseau. Travaille avec currentReseau (variable globale).
*/
function DFS(graph, départ) {
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

             var arcs = graph[noeud];
            for (var j = 1; j < arcs.length; j++) {
                var voisin = arcs[j][0];
                pile.push(voisin);
            }
        }
    }

    return étatsTrouvés;
}

/*
reachable - Vérifie l'atteignabilité entre deux nœuds
Description: Teste si on peut aller du nœud "from" au nœud "to" en suivant les arcs du graphe. Utile pour vérifier la connectivité 
entre deux points spécifiques.
Fonctionnement: Utilise BFS avec queue. Démarre de "from", explore les voisins niveau par niveau en maintenant un Set des nœuds 
visités. Si on atteint "to" pendant l'exploration, retourne true. Si l'exploration se termine sans trouver "to", retourne false.
Retourne: booléen (true si "to" est atteignable depuis "from", false sinon)
Relations: Fonction utilitaire utilisée notamment par isLive pour tester l'atteignabilité entre marquages
*/
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

/*
isLive - Vérifie que toutes les transitions restent toujours activables (vivacité)
Description: Un réseau est vivant si pour chaque transition et chaque marquage atteignable, il existe toujours un futur où cette 
transition peut être tirée. Aucune transition ne peut devenir définitivement morte.
Fonctionnement: Construit d'abord le graphe d'atteignabilité complet avec buildReachabilityGraph. Pour chaque marquage atteignable et 
chaque transition, cherche s'il existe au moins un marquage futur (atteignable depuis le marquage actuel) où la transition devient 
franchissable. Si une transition n'a aucun futur possible dans un marquage donné, le réseau n'est pas vivant.
Point important: Fonction très coûteuse car explore tout l'espace d'atteignabilité. Requiert buildReachabilityGraph et isEnabled 
(fonctions externes non définies dans ce fichier).
Retourne: booléen (true si le réseau est vivant, false si au moins une transition peut mourir)
Relations: Fonction d'analyse comportementale avancée, dépend de buildReachabilityGraph, isEnabled et reachable
*/
function isLive() {

  const graph = buildReachabilityGraph(currentReseau);
  const markings = Object.keys(graph);


  for (const M of markings) {


    for (const transition in currentReseau) {
      if (!transition.startsWith("T")) continue;

      let transitionVivante = false;


      for (const M2 of markings) {
        if (reachable(M, M2, graph)) {


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


      if (!transitionVivante) {
        return false;
      }
    }
  }

  
  return true;
}

/*
simulation - Fonction principale de simulation appelée par l'interface utilisateur
Description: Parcourt toutes les transitions du réseau et tire celles qui sont franchissables. C'est le point d'entrée principal quand 
l'utilisateur lance une simulation depuis l'UI.
Fonctionnement: Crée deux clones du réseau avec structuredClone. Le premier clone sert à identifier quelles transitions sont 
franchissables à l'instant T. Le second clone est modifié en tirant ces transitions avec echangeRessources. Pour chaque transition, 
vérifie d'abord si elle est franchissable sur les deux clones avant de l'exécuter.
Point important: Les deux clones sont nécessaires pour éviter qu'une transition tirée ne rende une autre transition franchissable 
artificiellement dans la même itération.
Retourne: le réseau modifié après avoir tiré toutes les transitions franchissables simultanément
Relations: Fonction principale utilisée par l'UI React. Appelle isFranchissable pour vérifier et echangeRessources pour exécuter.
*/
function simulation(graph) {
    let copy = structuredClone(graph);
    let res = structuredClone(graph);

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

