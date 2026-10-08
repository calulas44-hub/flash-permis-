/*
 * Catalogue de la boutique.
 * ⚠ Catalogue de démonstration : noms, compositions, prix et photos sont à
 * remplacer par vos fiches réelles (voir README, section « Mettre votre catalogue »).
 * Les photos sont des photos d'illustration libres de droits (Unsplash), pas
 * des photos de vos produits.
 *
 * Ce fichier est lu par le navigateur ET par la fonction de paiement : c'est
 * lui qui fait foi pour les prix côté serveur.
 */
(function (root, factory) {
  var catalogue = factory();
  if (typeof module === "object" && module.exports) module.exports = catalogue;
  else root.CATALOGUE = catalogue;
})(typeof self !== "undefined" ? self : this, function () {
  var categories = [
    { id: "thes-verts", nom: "Thés verts", illustration: "feuille",
      description: "Frais, végétaux, parfois iodés : des thés verts du Japon et de Chine, nature ou parfumés." },
    { id: "thes-noirs", nom: "Thés noirs", illustration: "tasse",
      description: "Corsés, maltés, fruités ou épicés : de quoi bien démarrer la journée et accompagner le goûter." },
    { id: "blancs-oolongs", nom: "Blancs & oolongs", illustration: "bourgeon",
      description: "Les thés les plus délicats : bourgeons duveteux et feuilles roulées aux notes florales." },
    { id: "infusions", nom: "Infusions", illustration: "fleur",
      description: "Fleurs, plantes et fruits, sans théine : pour le soir, les enfants ou le plaisir à toute heure." },
    { id: "coffrets", nom: "Coffrets", illustration: "cadeau",
      description: "Pour offrir ou pour vous faire plaisir : des assortiments prêts à déguster." },
    { id: "accessoires", nom: "Accessoires", illustration: "theiere",
      description: "Le bon matériel pour réussir le thé en vrac, tasse après tasse." }
  ];

  var moments = [
    { id: "matin", nom: "Le matin", accroche: "Pour bien démarrer" },
    { id: "apres-midi", nom: "L'après-midi", accroche: "Pour la pause" },
    { id: "soir", nom: "Le soir", accroche: "Pour se poser" }
  ];

  // Formats standard du vrac : prix en euros TTC, poids en grammes.
  function vrac(p50, p100, boite) {
    return [
      { id: "s50", nom: "Sachet 50 g", icone: "sachet", poids: 50, prix: p50 },
      { id: "s100", nom: "Sachet 100 g", icone: "sachet-l", poids: 100, prix: p100 },
      { id: "b100", nom: "Boîte 100 g", icone: "boite", poids: 100, prix: boite }
    ];
  }

  var produits = [
    {
      id: "sencha", famille: "Thé vert", nom: "Sencha", categorie: "thes-verts",
      accroche: "Le grand classique japonais, frais et herbacé",
      image: "photo-1763617702099-d956f3fd8324", galerie: ["photo-1766482280244-afd07a7028fc"],
      description: "Des aiguilles vert sombre qui libèrent, dès l'ouverture du sachet, un parfum d'herbe fraîchement coupée. En tasse, le Sencha offre une liqueur jaune-vert limpide, une attaque végétale et une finale légèrement iodée, avec cette pointe d'umami qui fait la signature des thés verts du Japon. Un thé du quotidien qui ne lasse jamais — à condition de ne pas l'ébouillanter.",
      ingredients: "Thé vert Sencha (Camellia sinensis).",
      origine: "Japon", saveurs: ["Herbe coupée", "Iodé", "Umami"],
      profil: { "Végétal": 4, "Iodé": 3, "Douceur": 2, "Astringence": 2 },
      preparation: { dosage: "2,5 g / 20 cl", temperature: "75 °C", duree: "1 min 30 à 2 min", infusions: 2 },
      froid: "6 g pour 50 cl d'eau froide, 6 à 8 h au réfrigérateur, puis filtrez.",
      conseil: "Laissez l'eau bouillante reposer 3 à 4 minutes avant de la verser : au-delà de 80 °C, le Sencha devient amer. Ses feuilles supportent deux infusions, la seconde un peu plus courte.",
      theine: 2, moments: ["matin", "apres-midi"], formats: vrac(7.9, 13.9, 17.9), selection: true, stock: true
    },
    {
      id: "gunpowder-menthe", famille: "Thé vert", nom: "Gunpowder à la menthe", categorie: "thes-verts",
      accroche: "Le thé à la menthe de l'hospitalité, vif et rafraîchissant",
      image: "photo-1653937855510-ec3fd2036d98", galerie: [],
      description: "Les feuilles de Gunpowder, roulées en petites perles serrées, s'ouvrent lentement dans l'eau chaude et apportent la structure : une légère amertume, une belle tenue en bouche. La menthe poivrée fait le reste — une fraîcheur franche qui réveille et désaltère. Servi très chaud et sucré à la marocaine, ou nature et glacé l'été : c'est le thé qui fait l'unanimité à table.",
      ingredients: "Thé vert Gunpowder, feuilles de menthe poivrée.",
      origine: "Chine (thé)", saveurs: ["Menthe fraîche", "Végétal", "Légère amertume"],
      profil: { "Fraîcheur": 5, "Végétal": 3, "Douceur": 2, "Amertume": 2 },
      preparation: { dosage: "2,5 g / 20 cl", temperature: "85 °C", duree: "3 min", infusions: 2 },
      froid: "8 g pour 1 L d'eau froide, 6 h au réfrigérateur, puis filtrez. Servez avec des glaçons et quelques feuilles fraîches.",
      conseil: "Pour la version traditionnelle, rincez d'abord les perles avec un fond d'eau chaude que vous jetez : vous adoucissez l'amertume sans perdre le parfum.",
      theine: 2, moments: ["matin", "apres-midi"], formats: vrac(6.9, 11.9, 15.9), selection: true, stock: true
    },
    {
      id: "jasmin", famille: "Thé vert", nom: "Jasmin", categorie: "thes-verts",
      accroche: "Un bouquet floral, tout en rondeur",
      image: "photo-1576092762793-c0e9395ec4b9", galerie: [],
      description: "Un thé vert de Chine parfumé aux fleurs de jasmin. Dès que l'eau touche les feuilles, le parfum emplit la pièce. En bouche, la tasse est florale et suave, sans lourdeur, et la fraîcheur du thé vert reste bien présente. Le thé de l'après-midi par excellence, parfait aussi aux côtés d'une cuisine asiatique.",
      ingredients: "Thé vert, fleurs de jasmin.",
      origine: "Chine", saveurs: ["Jasmin", "Fleuri", "Végétal doux"],
      profil: { "Floral": 5, "Végétal": 2, "Douceur": 3, "Astringence": 1 },
      preparation: { dosage: "2 g / 20 cl", temperature: "75 °C", duree: "2 à 3 min", infusions: 2 },
      froid: "6 g pour 50 cl d'eau froide, 6 h au réfrigérateur.",
      conseil: "Traditionnellement, le thé au jasmin est parfumé en mêlant les feuilles à des fleurs fraîches, qu'on retire ensuite. Une eau trop chaude écrase ce parfum fragile : restez sous 80 °C.",
      theine: 2, moments: ["apres-midi"], formats: vrac(7.5, 12.9, 16.9), selection: false, stock: true
    },
    {
      id: "matcha", famille: "Thé vert", nom: "Matcha", categorie: "thes-verts",
      accroche: "Le thé vert en poudre, intense et velouté",
      image: "photo-1515823064-d6e0c04616a7", galerie: ["photo-1565117661210-fd54898de423"],
      description: "Des feuilles de thé cultivées à l'ombre, puis moulues en une poudre d'un vert profond. Fouetté avec un peu d'eau chaude, le matcha devient une boisson onctueuse, à la fois herbacée, douce et légèrement amère, d'une longueur en bouche étonnante. Ici, on boit la feuille entière : c'est un thé à part, à savourer pur ou en latte.",
      ingredients: "Thé vert matcha (feuilles de Camellia sinensis moulues).",
      origine: "Japon", saveurs: ["Herbacé", "Velouté", "Umami"],
      profil: { "Végétal": 5, "Umami": 4, "Douceur": 2, "Amertume": 3 },
      preparation: { dosage: "1 à 2 g / 7 cl", temperature: "75 °C", duree: "Fouetter 20 s", infusions: null },
      froid: "En latte glacé : fouettez 2 g dans 5 cl d'eau, puis versez sur 15 cl de lait froid et des glaçons.",
      conseil: "Tamisez la poudre avant de verser l'eau, vous éviterez les grumeaux. Fouettez vivement en dessinant des « M » jusqu'à obtenir une mousse fine.",
      theine: 3, moments: ["matin"],
      formats: [
        { id: "b30", nom: "Boîte 30 g", icone: "boite", poids: 30, prix: 14.9 },
        { id: "s100", nom: "Sachet 100 g", icone: "sachet-l", poids: 100, prix: 39.9 }
      ],
      selection: false, stock: true
    },
    {
      id: "darjeeling", famille: "Thé noir", nom: "Darjeeling", categorie: "thes-noirs",
      accroche: "Le « champagne des thés », fin et fruité",
      image: "photo-1606163017137-888c0177b3dd", galerie: [],
      description: "Cultivé sur les contreforts de l'Himalaya, le Darjeeling est le plus aérien des thés noirs. Sa liqueur ambrée et claire déploie des notes fruitées et florales, une légère astringence qui rafraîchit la bouche et une finale tout en délicatesse. Le thé noir de ceux qui pensaient ne pas aimer le thé noir.",
      ingredients: "Thé noir Darjeeling.",
      origine: "Inde", saveurs: ["Fruité", "Fleuri", "Boisé léger"],
      profil: { "Fruité": 4, "Floral": 3, "Corps": 2, "Astringence": 3 },
      preparation: { dosage: "2 g / 20 cl", temperature: "90 °C", duree: "3 min", infusions: 1 },
      froid: "6 g pour 50 cl d'eau froide, 8 h au réfrigérateur : un thé glacé d'une grande finesse.",
      conseil: "Buvez-le nature : le lait masquerait sa finesse. Une eau peu minéralisée fait ici toute la différence.",
      theine: 2, moments: ["apres-midi"], formats: vrac(8.9, 15.9, 19.9), selection: true, stock: true
    },
    {
      id: "assam", famille: "Thé noir", nom: "Assam", categorie: "thes-noirs",
      accroche: "Le thé du petit-déjeuner, rond et malté",
      image: "photo-1604697976842-d36fa5a1b2ed", galerie: [],
      description: "Un thé noir puissant de la vallée du Brahmapoutre, au nord-est de l'Inde. Liqueur rouge cuivrée, notes maltées et légèrement miellées, corps généreux : l'Assam a du répondant et se marie à merveille avec un nuage de lait. Le compagnon idéal des matins pressés et des tartines beurrées.",
      ingredients: "Thé noir Assam.",
      origine: "Inde", saveurs: ["Malté", "Miel", "Corsé"],
      profil: { "Corps": 5, "Malté": 4, "Douceur": 2, "Astringence": 3 },
      preparation: { dosage: "2,5 g / 20 cl", temperature: "95 °C", duree: "3 à 4 min", infusions: 1 },
      froid: null,
      conseil: "Ajoutez le lait après l'infusion, jamais pendant : les feuilles ont besoin d'une eau très chaude pour donner tout leur corps.",
      theine: 3, moments: ["matin"], formats: vrac(6.5, 10.9, 14.9), selection: false, stock: true
    },
    {
      id: "earl-grey", famille: "Thé noir", nom: "Earl Grey", categorie: "thes-noirs",
      accroche: "Thé noir et bergamote, l'élégance anglaise",
      image: "photo-1759523710626-199a2da96085", galerie: [],
      description: "Un thé noir de Ceylan au caractère franc, parfumé à la bergamote, cet agrume à l'écorce si aromatique. Le premier nez est vif et zesté, la bouche reste ronde et tannique juste ce qu'il faut. Nature, avec une rondelle d'orange ou un trait de lait : l'Earl Grey se prête à toutes les envies, à toute heure.",
      ingredients: "Thé noir de Ceylan, arôme naturel de bergamote.",
      origine: "Sri Lanka", saveurs: ["Bergamote", "Agrumes", "Tannique"],
      profil: { "Agrumes": 5, "Corps": 3, "Douceur": 2, "Astringence": 3 },
      preparation: { dosage: "2 g / 20 cl", temperature: "95 °C", duree: "3 min", infusions: 1 },
      froid: "6 g pour 50 cl d'eau froide, 8 h au réfrigérateur ; servez avec une tranche d'orange.",
      conseil: "Trois minutes, pas une de plus : au-delà, les tanins prennent le dessus sur la bergamote.",
      theine: 2, moments: ["matin", "apres-midi"], formats: vrac(6.9, 11.9, 15.9), selection: true, stock: true
    },
    {
      id: "chai", famille: "Thé noir", nom: "Chaï épicé", categorie: "thes-noirs",
      accroche: "Cannelle, gingembre, cardamome : la chaleur en tasse",
      image: "photo-1563911892437-1feda0179e1b", galerie: [],
      description: "Un Assam corsé et un mélange d'épices concassées : cannelle, gingembre, cardamome, clou de girofle et poivre noir. À l'infusion, la cuisine embaume ; en bouche, la douceur de la cannelle précède la chaleur du gingembre et du poivre. Préparé à l'indienne, frémissant avec du lait et un peu de sucre, il devient un véritable dessert.",
      ingredients: "Thé noir Assam, cannelle, gingembre, cardamome, clou de girofle, poivre noir.",
      origine: "Inde (thé)", saveurs: ["Épicé", "Cannelle", "Gingembre"],
      profil: { "Épices": 5, "Corps": 4, "Douceur": 3, "Piquant": 2 },
      preparation: { dosage: "3 g / 20 cl", temperature: "95 °C", duree: "4 à 5 min", infusions: 1 },
      froid: null,
      conseil: "Version masala chai : faites frémir 3 g dans 10 cl d'eau pendant 3 minutes, ajoutez 15 cl de lait et une cuillère de sucre, laissez frémir encore une minute puis filtrez.",
      theine: 2, moments: ["apres-midi"], formats: vrac(7.5, 12.9, 16.9), selection: true, stock: true
    },
    {
      id: "pai-mu-tan", famille: "Thé blanc", nom: "Pai Mu Tan", categorie: "blancs-oolongs",
      accroche: "Douceur de miel et de foin séché",
      image: "photo-1594136604897-29f7e564db27", galerie: [],
      description: "Le « pivoine blanche » réunit bourgeons argentés et jeunes feuilles, simplement flétris puis séchés. Très peu transformé, il donne une liqueur pâle et lumineuse aux notes de foin, de fleurs blanches et de miel. Aucune amertume, une grande douceur : un thé qui accompagne tout un après-midi, infusion après infusion.",
      ingredients: "Thé blanc Pai Mu Tan.",
      origine: "Chine (Fujian)", saveurs: ["Miel", "Foin", "Fleurs blanches"],
      profil: { "Douceur": 5, "Floral": 3, "Végétal": 2, "Astringence": 1 },
      preparation: { dosage: "3 g / 20 cl", temperature: "80 °C", duree: "4 à 5 min", infusions: 3 },
      froid: "8 g pour 1 L d'eau froide, une nuit au réfrigérateur.",
      conseil: "Ses grandes feuilles prennent de la place : utilisez une théière ou un filtre large, et n'hésitez pas à le réinfuser deux ou trois fois.",
      theine: 1, moments: ["apres-midi"], formats: vrac(9.9, 17.9, 21.9), selection: false, stock: true
    },
    {
      id: "tie-guan-yin", famille: "Oolong", nom: "Tie Guan Yin", categorie: "blancs-oolongs",
      accroche: "Floral et crémeux, il se réinfuse encore et encore",
      image: "photo-1672846785798-a8e82326abab", galerie: [],
      description: "Un oolong peu oxydé aux feuilles roulées en billes, qui se déploient tasse après tasse. Notes d'orchidée et de lilas, texture presque crémeuse, finale sucrée : le Tie Guan Yin est un voyage à lui seul. Ses feuilles supportent plusieurs infusions successives, et chacune révèle une nuance nouvelle.",
      ingredients: "Thé oolong Tie Guan Yin.",
      origine: "Chine (Fujian)", saveurs: ["Orchidée", "Crémeux", "Fleuri"],
      profil: { "Floral": 5, "Douceur": 4, "Végétal": 2, "Corps": 2 },
      preparation: { dosage: "3 g / 15 cl", temperature: "90 °C", duree: "2 à 3 min", infusions: 4 },
      froid: null,
      conseil: "Allongez le temps d'infusion de 30 secondes à chaque nouvelle tasse : vous suivrez l'évolution des arômes, du plus floral au plus fruité.",
      theine: 2, moments: ["apres-midi"], formats: vrac(9.5, 16.9, 20.9), selection: false, stock: true
    },
    {
      id: "hibiscus", famille: "Infusion", nom: "Hibiscus & cynorrhodon", categorie: "infusions",
      accroche: "Rouge rubis, acidulé et fruité, chaud comme glacé",
      image: "photo-1563636680-28d36aeb83a4", galerie: ["photo-1602676329820-7a1fa9f5b1ed"],
      description: "Les calices d'hibiscus colorent l'eau d'un rouge éclatant et apportent une acidité franche et rafraîchissante, presque comme un jus de fruits rouges. Le cynorrhodon — le fruit de l'églantier — et la pomme arrondissent le tout d'une douceur naturelle. Sans théine, elle se boit à toute heure et devient un délice glacé dès les premiers beaux jours.",
      ingredients: "Fleurs d'hibiscus, cynorrhodon (fruit de l'églantier), morceaux de pomme.",
      origine: "—", saveurs: ["Acidulé", "Fruits rouges", "Fruité"],
      profil: { "Acidité": 5, "Fruité": 4, "Douceur": 3, "Corps": 2 },
      preparation: { dosage: "3 g / 25 cl", temperature: "100 °C", duree: "6 à 8 min", infusions: 1 },
      froid: "10 g pour 1 L d'eau froide, une nuit au réfrigérateur. Ajoutez un trait de sirop d'agave si vous l'aimez plus doux.",
      conseil: "Contrairement au thé, une infusion de fleurs et de fruits ne devient pas amère : laissez-la infuser longtemps pour une couleur et un goût bien intenses.",
      theine: 0, moments: ["apres-midi", "soir"], formats: vrac(5.9, 9.9, 13.9), selection: true, stock: true
    },
    {
      id: "douce-soiree", famille: "Infusion", nom: "Douce soirée", categorie: "infusions",
      accroche: "Camomille, tilleul et verveine : le rituel du soir",
      image: "photo-1749105862005-6e0409c8c55a", galerie: ["photo-1596343621063-c7a7aaf37aa6"],
      description: "Les fleurs de camomille apportent leurs notes de pomme et de miel, le tilleul sa douceur ronde, la verveine une pointe citronnée qui allège l'ensemble. Une infusion enveloppante et sans théine pour clore la journée, une tasse chaude entre les mains.",
      ingredients: "Fleurs de camomille matricaire, tilleul, feuilles de verveine odorante.",
      origine: "—", saveurs: ["Miel", "Fleuri", "Citronné"],
      profil: { "Floral": 4, "Douceur": 4, "Citronné": 2, "Corps": 1 },
      preparation: { dosage: "2 g / 25 cl", temperature: "100 °C", duree: "5 à 7 min", infusions: 1 },
      froid: null,
      conseil: "Couvrez votre tasse pendant l'infusion : les arômes des fleurs, très volatils, restent dans la boisson au lieu de s'envoler.",
      theine: 0, moments: ["soir"], formats: vrac(6.5, 10.9, 14.9), selection: true, stock: true
    },
    {
      id: "rooibos-orange-vanille", famille: "Rooibos", nom: "Orange & vanille", categorie: "infusions",
      accroche: "Gourmand et naturellement doux, sans théine",
      image: "photo-1652128288793-6a2077ee246b", galerie: [],
      description: "Le rooibos, cette plante d'Afrique du Sud aux fines aiguilles rouges, donne une infusion ambrée naturellement douce, sans amertume ni théine. Les écorces d'orange lui apportent une touche zestée, la vanille une rondeur gourmande. Les enfants l'adorent, les grands aussi — avec ou sans lait.",
      ingredients: "Rooibos, écorces d'orange, morceaux de gousse de vanille.",
      origine: "Afrique du Sud (rooibos)", saveurs: ["Vanille", "Orange", "Boisé doux"],
      profil: { "Douceur": 5, "Gourmand": 4, "Agrumes": 3, "Corps": 2 },
      preparation: { dosage: "3 g / 25 cl", temperature: "100 °C", duree: "5 à 8 min", infusions: 1 },
      froid: "8 g pour 1 L d'eau froide, une nuit au réfrigérateur.",
      conseil: "Le rooibos ne devient jamais amer : vous pouvez laisser les aiguilles dans la théière sans crainte.",
      theine: 0, moments: ["apres-midi", "soir"], formats: vrac(6.5, 10.9, 14.9), selection: false, stock: true
    },
    {
      id: "coffret-decouverte", famille: "Coffret", nom: "Découverte", categorie: "coffrets",
      accroche: "6 thés et infusions pour trouver votre favori",
      image: "photo-1563822249366-3efb23b8e0c9", galerie: ["photo-1765153743332-949b8d623d92"],
      description: "Vous hésitez ? Ce coffret réunit six références en sachets de 25 g : Sencha, Jasmin, Darjeeling, Earl Grey, Rooibos orange & vanille et Douce soirée. De quoi faire le tour de la boutique, du thé vert aux infusions du soir, et découvrir ce que vous aimez vraiment. Une jolie idée cadeau, aussi.",
      ingredients: "Voir la composition de chaque thé sur sa fiche.",
      origine: "Selon les thés", saveurs: ["Assortiment", "Du vert au noir", "Infusions"],
      profil: null, preparation: null, froid: null,
      conseil: "Commencez par les thés verts et blancs, puis passez aux noirs : votre palais percevra mieux les nuances.",
      theine: null, moments: ["matin", "apres-midi", "soir"],
      formats: [{ id: "coffret", nom: "Coffret 6 × 25 g", icone: "cadeau", poids: 150, prix: 24.9 }],
      selection: true, stock: true
    },
    {
      id: "boule-infuseur", famille: "Accessoire", nom: "Boule infuseur inox", categorie: "accessoires",
      accroche: "Pour une tasse rapide, au bureau ou en voyage",
      image: "photo-1521136492500-e18f107709f7", galerie: [],
      description: "Une boule à thé en acier inoxydable à mailles fines, avec fermeture à charnière et chaînette pour la retirer d'un geste. Le secret : ne la remplissez qu'à moitié, pour laisser aux feuilles la place de se déployer. Parfaite pour les thés à petites feuilles et les infusions de fleurs ; pour les grandes feuilles, préférez la théière. Elle se rince simplement à l'eau claire.",
      ingredients: null, origine: null, saveurs: null, profil: null, preparation: null, froid: null, conseil: null,
      theine: null, moments: [],
      formats: [{ id: "unite", nom: "À l'unité", icone: "infuseur", poids: null, prix: 6.9 }],
      selection: false, stock: true
    },
    {
      id: "theiere-verre", famille: "Accessoire", nom: "Théière en verre 600 ml", categorie: "accessoires",
      accroche: "Pour voir les feuilles se déployer",
      image: "photo-1602603412313-ab713536e288", galerie: [],
      description: "Regarder les feuilles danser et la couleur de l'infusion se former : la théière en verre rend chaque préparation un peu magique. Son filtre amovible retient les feuilles, que vous retirez à la fin du temps d'infusion pour éviter toute amertume. Contenance : 600 ml, soit trois belles tasses.",
      ingredients: null, origine: null, saveurs: null, profil: null, preparation: null, froid: null, conseil: null,
      theine: null, moments: [],
      formats: [{ id: "unite", nom: "600 ml", icone: "theiere", poids: null, prix: 24.9 }],
      selection: false, stock: true
    }
  ];

  return { categories: categories, moments: moments, produits: produits };
});
