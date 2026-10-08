/*
 * Réglages de la boutique — c'est le seul fichier à modifier pour adapter
 * la marque, la livraison, le paiement et les coordonnées.
 * Ce fichier est lu par le navigateur ET par la fonction de paiement
 * (netlify/functions/paiement.js) : les frais de port y sont donc calculés
 * de la même façon des deux côtés.
 */
(function (root, factory) {
  var config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  else root.BOUTIQUE = config;
})(typeof self !== "undefined" ? self : this, function () {
  return {
    nom: "Florelle",
    accroche: "Thés & infusions en vrac",

    // Affiche un bandeau « boutique de démonstration ». À passer à false
    // une fois le vrai catalogue, les vrais prix et les mentions légales en place.
    demo: true,

    contact: {
      email: "bonjour@florelle.fr",
      telephone: "",          // ex. "04 00 00 00 00" — laissé vide, il n'est pas affiché
      horaires: "du lundi au vendredi, 9 h – 17 h"
    },

    // Délai de préparation annoncé sur le site : à ajuster à votre organisation réelle.
    delaiPreparation: "48 h ouvrées",

    livraison: {
      zone: "France métropolitaine",
      // Livraison offerte pour les modes marqués gratuitDes, à partir de ce montant d'articles.
      seuilGratuit: 45,
      modes: [
        { id: "relais", nom: "Point relais", detail: "3 à 5 jours ouvrés après expédition", prix: 4.5, gratuitDes: 45 },
        { id: "domicile", nom: "Colissimo à domicile", detail: "2 à 3 jours ouvrés après expédition", prix: 6.9, gratuitDes: 45 },
        { id: "retrait", nom: "Retrait sur rendez-vous", detail: "Adresse communiquée par e-mail", prix: 0, gratuitDes: null, actif: false }
      ]
    },

    paiement: {
      /*
       * "demande" : aucun prestataire de paiement n'est branché. Le client envoie
       *             une demande de commande (formulaire Netlify) ; vous lui
       *             renvoyez ensuite un lien de paiement. Rien n'est débité en ligne.
       * "stripe"  : paiement par carte via Stripe Checkout. Nécessite le déploiement
       *             de la fonction netlify/functions/paiement.js et la variable
       *             d'environnement STRIPE_SECRET_KEY (voir README).
       */
      mode: "demande",
      endpoint: "/.netlify/functions/paiement"
    },

    // Formulaires (contact, newsletter, demande de commande).
    // "netlify" : Netlify Forms, actif dès que le site est hébergé sur Netlify.
    formulaires: "netlify"
  };
});
