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
Fonctionnement:
1. Crée une copie du marquage avec spread operator {...marquage}
2. Parcourt tous les états pour trouver ceux qui pointent vers la transition T (états d'entrée)
3. Retire les jetons de ces états selon le poids des arcs (consommation)
4. Ajoute les jetons aux états de sortie de la transition (production)
5. Retourne le nouveau marquage sans toucher l'original
Retourne: nouveau marquage (objet) avec les jetons mis à jour, l'original reste intact
Relations: Utilisée par isBorne pour tester plusieurs tirs sans modifier le réseau réel. Différente de echangeRessources qui mute.
*/
function calculNouveauMarquage(transition, marquage, graph) {
    const nouveau = { ...marquage };

    for (const noeud in graph) {
        if (noeud.startsWith("E")) {
            for (const arc of graph[noeud].slice(1)) {
                const [destination, poids] = arc;
                if (destination === transition) {
                    nouveau[noeud] -= poids;
                }
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
Description: Parcours tous les états qui pointent vers cette transition et vérifie qu'ils ont assez de jetons.
Exemple: Si E1→T1 avec poids 2, alors E1 doit avoir au moins 2 jetons pour que T1 soit franchissable.
Fonctionnement:
1. Parcourt tous les nœuds du réseau
2. Pour chaque état (E), regarde ses arcs sortants
3. Si un arc pointe vers la transition demandée, vérifie que l'état a assez de jetons (jetons >= poids)
4. Si un seul état manque de jetons, retourne false
5. Si tous les états d'entrée ont assez de jetons, retourne true
Retourne: booléen (true si la transition peut être tirée, false sinon)
Relations: Appelée AVANT echangeRessources dans simulation. Utilisée par isDeadlock et isBorne.
*/
function isFranchissable(reseau, transitionId) {
    for (const noeud in reseau) {
        if (noeud.startsWith("E")) {
            const arcs = reseau[noeud].slice(1);
            for (const arc of arcs) {
                const [destination, poids] = arc;
                if (destination === transitionId) {
                    if (reseau[noeud][0] < poids) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

/*
echangeRessources - Exécute le tir d'une transition pour de vrai
Description: Contrairement à calculNouveauMarquage, cette fonction modifie directement l'objet reseau.
Retire les jetons des états d'entrée, ajoute les jetons aux états de sortie.
Fonctionnement:
1. Parcourt tous les états du réseau
2. Trouve ceux qui pointent vers la transition (états d'entrée)
3. Retire les jetons de ces états selon le poids des arcs (consommation)
4. Parcourt les arcs sortants de la transition
5. Ajoute les jetons aux états de sortie selon les poids (production)
6. Mutation directe: reseau[noeud][0] -= poids ou += poids
Retourne: rien (void) car la mutation de reseau est l'effet voulu
Relations: Appelée par simulation APRÈS vérification avec isFranchissable. Différente de calculNouveauMarquage (retourne copie).
Changements: Nouvelle fonction pour simulation réelle, complète calculNouveauMarquage qui reste pour tests hypothétiques.
*/
function echangeRessources(reseau, transitionId) {
    for (const noeud in reseau) {
        if (noeud.startsWith("E")) {
            const arcs = reseau[noeud].slice(1);
            for (const arc of arcs) {
                const [destination, poids] = arc;
                if (destination === transitionId) {
                    reseau[noeud][0] -= poids;
                }
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
2. Pour chaque marquage exploré (jusqu'à maxIterations=100):
   a. Vérifie si un état > borneMax → retourne false immédiatement
   b. Trouve toutes les transitions franchissables avec isFranchissable
   c. Pour chaque transition franchissable, simule son tir avec calculNouveauMarquage
   d. Ajoute les nouveaux marquages uniques à la liste d'exploration (évite boucles infinies avec Set)
3. Si aucun dépassement trouvé après exploration complète → retourne true
Méthode: Utilise BFS pour explorer l'espace d'états. Set de marquages visités pour éviter de revisiter les mêmes états.
Paramètres: graph (réseau), borneMax (limite de jetons par état), maxIterations (limite d'exploration)
Retourne: booléen (false si un état dépasse borneMax, true si tous respectent la borne)
Relations: Utilise calculNouveauMarquage pour simulations hypothétiques sans modifier le réseau réel.
*/
function isBorne(graph, borneMax, maxIterations = 100) {
    const marquages = [marquageInitial(graph)];
    const visites = new Set();
    visites.add(JSON.stringify(marquages[0]));
    
    for (let i = 0; i < maxIterations; i++) {
        let nouveauMarquageTrouve = false;
        
        for (const marquage of marquages) {
            for (const noeud in graph) {
                if (noeud.startsWith("E")) {
                    if (marquage[noeud] > borneMax) {
                        return false;
                    }
                }
            }
        }
        
        const derniereMarquage = marquages[marquages.length - 1];
        for (const noeud in graph) {
            if (noeud.startsWith("T")) {
                let peutTirer = true;
                for (const etat in graph) {
                    if (etat.startsWith("E")) {
                        const arcs = graph[etat].slice(1);
                        for (const arc of arcs) {
                            const [destination, poids] = arc;
                            if (destination === noeud && derniereMarquage[etat] < poids) {
                                peutTirer = false;
                                break;
                            }
                        }
                        if (!peutTirer) break;
                    }
                }
                
                if (peutTirer) {
                    const nouveauMarquage = calculNouveauMarquage(noeud, derniereMarquage, graph);
                    const marquageStr = JSON.stringify(nouveauMarquage);
                    
                    if (!visites.has(marquageStr)) {
                        visites.add(marquageStr);
                        marquages.push(nouveauMarquage);
                        nouveauMarquageTrouve = true;
                    }
                }
            }
        }
        
        if (!nouveauMarquageTrouve) break;
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
lignes de test pour les fonctions => les enlever avant de push ou les rajouter si faire test
+ décommenter la ligne export
*/

export { reseau, isBipartite, isConnex, marquageInitial, calculNouveauMarquage, isFranchissable, echangeRessources, isDeadlock, isBorne, simulation };