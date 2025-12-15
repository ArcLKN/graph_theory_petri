var reseau = {
  E1: [10, ["T1", 2]],
  T1: [0, ["E2", 1], ["E4", 1]],
  E2: [0, ["T2", 2]],
  E4: [0, ["T2", 2]],
  T2: [0, ["E3", 1], ["E5", 1]],
  E3: [0],
  E5: [0],
};

var etatDepart = "E1";
var valDepart = 10;

function MajEtatDepart(nouvelEtat) {
  etatDepart = nouvelEtat;
}

function MajValDepart(nouvelleValeur) {
  valDepart = nouvelleValeur;
}

function MajReseau(nouveauReseau) {
  reseau = nouveauReseau;
  return reseau;
}

export { MajValDepart, MajEtatDepart, MajReseau, valDepart, etatDepart, reseau };