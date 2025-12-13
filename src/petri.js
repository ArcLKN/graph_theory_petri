var reseau = {
		"E1": [10, ["T1",2]],
		"T1": [0, ["E2", 1], ["E4",1]],
		"E2": [0, ["T2", 2]],
		"E4": [0, ["T2",2]],
		"T2": [0, ["E3", 1], ["E5", 1]],
		"E3": [0],
		"E5": [0]
	  };

var etatDepart = "E1";

var valDepart = "10";

function puits(reseau){
    let puit = [];
    // on trouve les noeuds qui n'ont pas de connexions
    for (let node in reseau){
        if (reseau[node].length === 1){
            puit.push(node);
        }
    }
    return puit;
}

function sources(reseau){
    let compare = [];
    let source = [];

    // compare <-- tous les noeuds connectés
    for (let node in reseau){
        for (let i = 1; i < reseau[node].length; i++){
            if (!compare.includes(reseau[node][i][0])){
                compare.push(reseau[node][i][0]);
            }
        }
    }
    // source <-- noeuds not in compare
    for (let node in reseau){
        if (!compare.includes(node)){
            source.push(node);
        }
    }

    return source;
}

//vérifie si le réseau est simple 
function estSimple(reseau) {
    // Pour chaque noeuds on vérifie si il n'y a pas deux liens vers le même noeud
    for (let node in reseau) {
        let liens = [];

        for (let i = 1; i < reseau[node].length; i++) {
            let cible = reseau[node][i][0];

            // vérifier si la cible existe déjà dans le tableau destinations
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

//EN COURS
function DFS(reseau, départ)
{
    
}
function estVivant(reseau) {
    let sources = source(reseau); 
    let valides = [];

    for (let src in sources) {

        if (src.startsWith("T")) {

            // valeur de sortie (marquage ou poids associé)
            for (let i = 1; i < reseau[src].length; i++){
                // si la transition peut passer
                if (reseau[src][i][1] > 0) {
                    let enfants = DFS(reseau, reseau[src][i][1]);

                    for (let j = 0; j < enfants.length; j++) {
                        if (!valides.includes(enfants[j])) {
                            valides.push(enfants[j]);
                        }
                    }
                }
                else {
                    return false;
                }
            }
        }

        /*maintenant faut tester tous les E restant avec une sorte de DFS où on fait passser le maximum 
        possible de chaque etats vers les etats suivants et quand c'est pas possible d'atteindre un état on 
        regarde si il à déja été atteint avec valides sinon le marque dans le tableau non-passé et à la fin
        on re-vérifie si il a été atteint et on décide de renvoyer tru ou false*/ 
    }
}

console.log(puits(reseau));
console.log(sources(reseau));
console.log(estSimple(reseau));