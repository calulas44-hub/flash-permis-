/*
 * Florelle — comportements propres à chaque page (data-page sur <body>).
 */
(function () {
  "use strict";
  var FL = window.FL, B = window.BOUTIQUE, C = window.CATALOGUE, I = window.ICONES, ILLUS = window.ILLUS;
  var $ = FL.$, $$ = FL.$$, esc = FL.esc, euros = FL.euros;
  var page = document.body.dataset.page;

  /* =================================================================== Accueil */
  function accueil() {
    var cercles = $("#medaillons");
    if (cercles) {
      cercles.innerHTML = C.categories.map(function (c) {
        return '<li><a class="medaillon" href="boutique.html?categorie=' + c.id + '"><span class="medaillon__rond">' + ILLUS[c.illustration] +
          '</span><span class="medaillon__nom">' + esc(c.nom) + "</span></a></li>";
      }).join("");
    }
    var sel = $("#selection");
    if (sel) {
      sel.innerHTML = C.produits.filter(function (p) { return p.selection; }).slice(0, 8)
        .map(function (p) { return FL.carteProduit(p); }).join("");
    }
    var focus = $("#focus-produits");
    if (focus) {
      focus.innerHTML = ["douce-soiree", "rooibos-orange-vanille"].map(function (id) {
        var p = FL.produit(id); return p ? FL.carteProduit(p, { sizes: "(max-width: 989px) 50vw, 270px" }) : "";
      }).join("").replace(/<li>/g, "").replace(/<\/li>/g, "");
    }
    FL.apparitions();
  }

  /* ================================================================== Boutique */
  function boutique() {
    var grille = $("#grille"), compteur = $("#compteur"), tri = $("#tri"), titre = $("#titre-page"), intro = $("#intro-page"), puces = $("#puces"), fil = $("#fil-courant");
    var etat = {
      categorie: FL.param("categorie") || "",
      moment: FL.param("moment") || "",
      theine: FL.param("theine") || "",
      q: FL.param("q") || "",
      tri: "selection",
      dispo: false
    };
    if (etat.categorie && !FL.categorie(etat.categorie)) etat.categorie = "";

    puces.innerHTML = '<li><a class="puce" href="boutique.html"' + (!etat.categorie ? ' aria-current="true"' : "") + ">Tout le catalogue</a></li>" +
      C.categories.map(function (c) {
        return '<li><a class="puce" href="boutique.html?categorie=' + c.id + '"' + (etat.categorie === c.id ? ' aria-current="true"' : "") + ">" + esc(c.nom) + "</a></li>";
      }).join("");

    // Filtres
    var zoneMoments = $("#filtre-moments");
    zoneMoments.innerHTML = C.moments.map(function (m) {
      return '<label class="case"><input type="checkbox" name="moment" value="' + m.id + '"' + (etat.moment === m.id ? " checked" : "") + "> " + esc(m.nom) + "</label>";
    }).join("");
    if (etat.theine === "sans") $("#filtre-sans-theine").checked = true;
    var btnFiltre = $("#btn-filtre"), panneau = $("#filtres");
    if (etat.moment || etat.theine) { panneau.classList.add("est-ouvert"); btnFiltre.setAttribute("aria-expanded", "true"); }
    btnFiltre.addEventListener("click", function () {
      var o = !panneau.classList.contains("est-ouvert");
      panneau.classList.toggle("est-ouvert", o); btnFiltre.setAttribute("aria-expanded", String(o));
    });
    panneau.addEventListener("change", rendre);
    tri.addEventListener("change", rendre);
    $("#reinitialiser").addEventListener("click", function () {
      $$("input", panneau).forEach(function (i) { i.checked = false; }); etat.q = ""; etat.moment = ""; etat.theine = "";
      history.replaceState(null, "", "boutique.html" + (etat.categorie ? "?categorie=" + etat.categorie : ""));
      rendre();
    });

    // En-tête de page selon le contexte
    var cat = FL.categorie(etat.categorie), mom = C.moments.find(function (m) { return m.id === etat.moment; });
    var t = "Tout le catalogue", d = "Thés verts, noirs, blancs, oolongs et infusions en vrac, à choisir en sachet de 50 g pour goûter ou en 100 g pour les habitués.";
    if (cat) { t = cat.nom; d = cat.description; }
    else if (etat.q) { t = "Recherche : « " + etat.q + " »"; d = "Les thés qui correspondent à votre recherche."; }
    else if (mom) { t = mom.nom + " · " + mom.accroche.toLowerCase(); d = "Notre sélection de thés et d'infusions pour ce moment de la journée."; }
    else if (etat.theine === "sans") { t = "Sans théine"; d = "Infusions et rooibos : à boire le soir, en famille, ou toute la journée sans compter."; }
    titre.textContent = t; intro.textContent = d; fil.textContent = t;
    document.title = t + " — " + B.nom;
    var meta = $('meta[name="description"]'); if (meta) meta.setAttribute("content", d);

    function rendre() {
      var moments = $$('input[name="moment"]:checked', panneau).map(function (i) { return i.value; });
      var sansTheine = $("#filtre-sans-theine").checked, dispo = $("#filtre-dispo").checked;
      var liste = etat.q ? FL.chercher(etat.q) : C.produits.slice();
      liste = liste.filter(function (p) {
        if (etat.categorie && p.categorie !== etat.categorie) return false;
        if (moments.length && !moments.some(function (m) { return (p.moments || []).indexOf(m) > -1; })) return false;
        if (sansTheine && p.theine !== 0) return false;
        if (dispo && !p.stock) return false;
        return true;
      });
      var t = tri.value;
      if (t === "prix-asc") liste.sort(function (a, b) { return FL.prixMin(a) - FL.prixMin(b); });
      else if (t === "prix-desc") liste.sort(function (a, b) { return FL.prixMin(b) - FL.prixMin(a); });
      else if (t === "nom") liste.sort(function (a, b) { return a.nom.localeCompare(b.nom, "fr"); });
      else if (!etat.q) liste.sort(function (a, b) { return (b.selection ? 1 : 0) - (a.selection ? 1 : 0); });

      compteur.textContent = liste.length + " produit" + (liste.length > 1 ? "s" : "");
      if (!liste.length) {
        grille.innerHTML = "";
        $("#vide").hidden = false;
      } else {
        $("#vide").hidden = true;
        grille.innerHTML = liste.map(function (p) { return FL.carteProduit(p, { accroche: true }); }).join("");
        grille.classList.remove("est-visible"); grille.removeAttribute("data-observe");
        FL.apparitions();
      }
    }
    rendre();
  }

  /* ============================================================= Fiche produit */
  function ficheProduit() {
    var p = FL.produit(FL.param("id"));
    var racine = $("#fiche");
    if (!p) {
      document.title = "Thé introuvable — " + B.nom;
      racine.innerHTML = '<div class="vide">' + ILLUS.tasse + '<h1>Ce thé est introuvable</h1><p>Il a peut-être changé de nom ou quitté le catalogue.</p><a class="btn btn--plein" href="boutique.html">Voir tout le catalogue</a></div>';
      return;
    }
    var cat = FL.categorie(p.categorie), illus = FL.illusDe(p);
    var nom = FL.nomComplet(p);
    document.title = p.famille + " " + p.nom + " — " + p.accroche + " | " + B.nom;
    var meta = $('meta[name="description"]'); if (meta) meta.setAttribute("content", p.accroche + ". " + p.description.slice(0, 120) + "…");
    $("#fil-cat").innerHTML = '<a href="boutique.html?categorie=' + cat.id + '">' + esc(cat.nom) + "</a>";
    $("#fil-produit").textContent = nom;

    var images = [p.image].concat(p.galerie || []);
    var formatChoisi = p.formats[0];

    var html =
      '<div class="galerie">' +
      '<div class="galerie__principale" id="image-principale">' + FL.image(images[0], nom, { illus: illus, prioritaire: true, largeurs: [540, 720, 960, 1200], sizes: "(max-width: 989px) 100vw, 524px" }) + "</div>" +
      (images.length > 1 ? '<ul class="galerie__vignettes" aria-label="Autres photos">' + images.map(function (id, i) {
        return '<li><button type="button" data-img="' + id + '" aria-label="Voir la photo ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : "") + ">" +
          FL.image(id, "", { illus: illus, largeurs: [200], sizes: "120px" }) + "</button></li>";
      }).join("") + "</ul>" : "") +
      '<p class="galerie__note">Photo d\'ambiance non contractuelle.</p>' +
      "</div>" +
      '<div class="fiche__info">' +
      "<h1>" + FL.nomComplet(p, true) + "</h1>" +
      '<p class="fiche__accroche">' + esc(p.accroche) + "</p>" +
      '<p class="fiche__description">' + esc(p.description) + "</p>" +
      (p.ingredients ? '<p class="fiche__ingredients">Ingrédient(s) : ' + esc(p.ingredients) + "</p>" : "") +
      (p.saveurs ? '<p class="fiche__saveurs">Principales saveurs : ' + esc(p.saveurs.join(", ")) + "</p>" : "") +
      '<form id="form-achat" novalidate>' +
      (p.formats.length > 1 || p.formats[0].icone !== "infuseur"
        ? '<fieldset class="choix-format"><legend>Format : <strong id="format-nom">' + esc(formatChoisi.nom) + '</strong></legend><div class="choix-format__liste">' +
          p.formats.map(function (f, i) {
            return '<div class="format"><input type="radio" name="format" id="f-' + f.id + '" value="' + f.id + '"' + (i === 0 ? " checked" : "") + ">" +
              '<label for="f-' + f.id + '">' + (window.FORMATS[f.icone] || "") + "<span>" + esc(f.nom) + "</span></label></div>";
          }).join("") + "</div></fieldset>"
        : '<input type="hidden" name="format" value="' + p.formats[0].id + '">') +
      '<div class="achat"><div class="quantite"><button type="button" data-pas="-1" aria-label="Diminuer la quantité">' + I.moins + "</button>" +
      '<input type="number" id="qte" name="qte" min="1" max="20" value="1" aria-label="Quantité">' +
      '<button type="button" data-pas="1" aria-label="Augmenter la quantité">' + I.plus + "</button></div>" +
      '<span class="prix-grand" id="prix">' + euros(formatChoisi.prix) + "</span></div>" +
      '<p class="prix-unitaire" id="prix-unitaire"></p>' +
      (p.stock ? '<p class="dispo">En stock — expédié sous ' + esc(B.delaiPreparation) + "</p>" : '<p class="dispo dispo--non">Momentanément épuisé</p>') +
      '<button type="submit" class="btn btn--plein btn--large fiche__ajout" id="btn-ajout"' + (p.stock ? "" : " disabled") + ">Ajouter au panier</button>" +
      "</form>" +
      '<div class="fiche__liens"><a href="livraison-retours.html">› Livraison offerte dès ' + euros(B.livraison.seuilGratuit).replace(",00", "") + '</a><a href="livraison-retours.html#retours">› Retours sous 14 jours</a></div>' +
      (p.conseil && !p.preparation ? '<p class="fiche__note">✿ <em>Le conseil :</em> ' + esc(p.conseil) + "</p>" : "") +
      accordeons(p) +
      "</div>";
    racine.innerHTML = html;

    // Galerie
    $$(".galerie__vignettes button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".galerie__vignettes button").forEach(function (x) { x.removeAttribute("aria-current"); });
        b.setAttribute("aria-current", "true");
        $("#image-principale").innerHTML = FL.image(b.dataset.img, nom, { illus: illus, largeurs: [540, 720, 960, 1200], sizes: "(max-width: 989px) 100vw, 524px" });
      });
    });

    // Format, quantité, prix
    var form = $("#form-achat"), qte = $("#qte");
    function formatCourant() {
      var r = $('input[name="format"]:checked', form) || $('input[name="format"]', form);
      return p.formats.find(function (f) { return f.id === r.value; });
    }
    function majPrix() {
      var f = formatCourant(), q = Math.max(1, Math.min(20, parseInt(qte.value, 10) || 1));
      $("#prix").textContent = euros(f.prix * q);
      var fn = $("#format-nom"); if (fn) fn.textContent = f.nom;
      $("#prix-unitaire").textContent = (f.poids ? "soit " + euros(f.prix / f.poids * 1000) + " / kg" : "") + (q > 1 ? (f.poids ? " · " : "") + q + " × " + euros(f.prix) : "");
      var bc = $("#barre-prix"); if (bc) bc.textContent = euros(f.prix);
    }
    form.addEventListener("change", majPrix);
    qte.addEventListener("input", majPrix);
    $$("[data-pas]", form).forEach(function (b) {
      b.addEventListener("click", function () {
        qte.value = Math.max(1, Math.min(20, (parseInt(qte.value, 10) || 1) + parseInt(b.dataset.pas, 10))); majPrix();
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = formatCourant(), q = Math.max(1, Math.min(20, parseInt(qte.value, 10) || 1));
      FL.Panier.ajouter(p.id, f.id, q);
      var b = $("#btn-ajout"); b.innerHTML = I.check + " Ajouté au panier";
      setTimeout(function () { b.textContent = "Ajouter au panier"; }, 1800);
      FL.ouvrir("tiroir-panier", b);
    });
    majPrix();

    // Bandeau de paramètres d'infusion
    var zoneParam = $("#parametres");
    if (p.preparation) {
      var jauge = p.theine == null ? "Variable" : p.theine === 0 ? "Sans théine"
        : '<span class="jauge" role="img" aria-label="Théine : ' + p.theine + ' sur 3">' + [1, 2, 3].map(function (n) { return '<i class="' + (n <= p.theine ? "plein" : "") + '"></i>'; }).join("") + "</span>";
      var moments = (p.moments || []).map(function (m) { var x = C.moments.find(function (y) { return y.id === m; }); return x ? x.nom : ""; }).join(" · ");
      zoneParam.innerHTML = '<div class="page"><ul class="parametres__liste">' +
        item(I.terre, "Origine", p.origine) + item(I.cuillere, "Dosage", p.preparation.dosage) +
        item(I.thermo, "Température", p.preparation.temperature) + item(I.sablier, "Infusion", p.preparation.duree) +
        item(I.soleil, "Moment", moments) + item(I.feuille, "Théine", jauge, true) + "</ul></div>";
    } else zoneParam.remove();
    function item(ico, lib, val, brut) { return "<li>" + ico + "<span><small>" + lib + "</small>" + (brut ? val : esc(val || "—")) + "</span></li>"; }

    // Profil aromatique
    var zoneProfil = $("#profil");
    if (p.profil) {
      zoneProfil.innerHTML = '<div class="page"><div class="entete-section"><div><h2>Profil aromatique</h2><p>Ce que vous trouverez dans la tasse, sur une échelle de 1 à 5.</p></div></div>' +
        '<div class="profil apparait"><div class="carte-info"><h3>En bouche</h3><p class="sous">' + esc(p.famille + " " + p.nom) + '</p><ul class="barres">' +
        Object.keys(p.profil).map(function (k) {
          return "<li><span>" + esc(k) + '</span><span class="rail" role="img" aria-label="' + esc(k) + " : " + p.profil[k] + ' sur 5"><span style="--v:' + p.profil[k] * 20 + '%"></span></span></li>';
        }).join("") + "</ul></div>" +
        '<div class="carte-info"><h3>Notes dominantes</h3><p class="sous">À l\'ouverture du sachet et en tasse</p><ul class="notes">' +
        p.saveurs.map(function (s) { return "<li>✿ " + esc(s) + "</li>"; }).join("") + "</ul>" +
        (p.preparation && p.preparation.infusions > 1 ? '<p class="centre" style="margin:18px 0 0;font-size:14.5px">Se réinfuse jusqu\'à <strong>' + p.preparation.infusions + " fois</strong>.</p>" : "") +
        "</div></div></div>";
    } else zoneProfil.remove();

    // Récit + préparation
    var zoneRecit = $("#recit");
    if (p.preparation) {
      zoneRecit.innerHTML = '<div class="page"><div class="recit apparait"><div class="recit__texte">' +
        "<h2>Réussir votre " + esc(p.nom) + "</h2>" +
        "<h3>À chaud</h3><p>Comptez <strong>" + esc(p.preparation.dosage) + "</strong> d'une eau idéalement filtrée, chauffée à <strong>" + esc(p.preparation.temperature) +
        "</strong>, et laissez infuser <strong>" + esc(p.preparation.duree) + "</strong>. Une eau trop chaude ou une infusion trop longue changent nettement le goût : mieux vaut goûter, puis ajuster d'une fois sur l'autre.</p>" +
        (p.froid ? "<h3>À froid</h3><p>" + esc(p.froid) + "</p>" : "") +
        (p.conseil ? "<h3>Le petit plus</h3><p>" + esc(p.conseil) + "</p>" : "") +
        '<p style="margin:22px 0 0"><a class="lien-fleche" href="conseils.html"><span>Tous nos conseils de préparation</span>' + I.fleche + "</a></p>" +
        '</div><div class="recit__photo">' + FL.image(images[images.length - 1], "", { illus: illus, ratio: 1.3, largeurs: [480, 720], sizes: "(max-width: 989px) 100vw, 430px" }) + "</div></div></div>";
    } else zoneRecit.remove();

    // Produits associés
    var assoc = C.produits.filter(function (x) { return x.id !== p.id && x.categorie === p.categorie; });
    var autres = C.produits.filter(function (x) { return x.id !== p.id && x.categorie !== p.categorie && x.selection; });
    var liste = assoc.concat(autres).slice(0, 4);
    $("#associes").innerHTML = liste.map(function (x) { return FL.carteProduit(x); }).join("");

    // Barre d'achat collante (mobile)
    var barre = $("#barre-collante");
    if (barre && p.stock) {
      barre.innerHTML = '<span class="barre-collante__nom">' + esc(nom) + '<em id="barre-prix">' + euros(formatCourant().prix) + "</em></span>" +
        '<button type="button" class="btn btn--plein">Ajouter</button>';
      $("button", barre).addEventListener("click", function () { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); });
      var cible = $("#btn-ajout");
      // Affichée dès que le bouton principal est passé au-dessus de l'écran.
      var majBarre = function () { barre.classList.toggle("est-visible", cible.getBoundingClientRect().bottom < 0); };
      window.addEventListener("scroll", majBarre, { passive: true });
      majBarre();
    }

    // Données structurées (référencement)
    var ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Product", name: p.famille + " " + p.nom, description: p.description,
      image: FL.urlImage(p.image, 1200, 1200), brand: { "@type": "Brand", name: B.nom }, category: cat.nom,
      offers: p.formats.map(function (f) {
        return { "@type": "Offer", name: f.nom, price: f.prix.toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/" + (p.stock ? "InStock" : "OutOfStock") };
      })
    });
    document.head.appendChild(ld);
    FL.apparitions();
  }

  function accordeons(p) {
    function acc(titre, contenu, ico) {
      return '<details class="accordeon"><summary>' + (ico || I.feuille).replace("<svg", '<svg class="ico"') + "<span>" + titre + "</span>" +
        I.chevron.replace("<svg", '<svg class="chev"') + '</summary><div class="accordeon__corps">' + contenu + "</div></details>";
    }
    var h = "";
    if (p.ingredients) h += acc("Composition & conservation", "<p>" + esc(p.ingredients) + "</p><p>À conserver dans une boîte hermétique, à l'abri de la lumière, de la chaleur et des odeurs fortes. Le thé ne se périme pas brutalement mais perd peu à peu ses arômes : savourez-le de préférence dans l'année.</p>" +
      (p.theine > 0 ? "<p>Contient de la théine (caféine) : déconseillé aux enfants et aux femmes enceintes ou allaitantes en quantité importante.</p>" : ""), I.feuille);
    h += acc("Livraison & retours", "<p>Commande préparée et expédiée sous " + esc(B.delaiPreparation) + ". " +
      FL.modesLivraison().map(function (m) { return esc(m.nom) + " : " + (m.prix ? euros(m.prix) : "gratuit") + " (" + esc(m.detail) + ")"; }).join(" · ") +
      ". Livraison offerte dès " + euros(B.livraison.seuilGratuit) + " d'achats en " + esc(B.livraison.zone) + ".</p><p>Vous disposez de 14 jours pour changer d'avis. <a href=\"livraison-retours.html\">Tout savoir</a></p>", I.colis);
    h += acc("Une question sur ce thé ?", "<p>Écrivez-nous à <a href=\"mailto:" + esc(B.contact.email) + "\">" + esc(B.contact.email) + "</a> ou via le <a href=\"contact.html\">formulaire de contact</a> : nous répondons " + esc(B.contact.horaires) + ".</p><p>Les réponses aux questions les plus courantes sont dans notre <a href=\"faq.html\">FAQ</a>.</p>", I.bulle);
    return '<div style="margin-top:26px">' + h + "</div>";
  }

  /* ==================================================================== Panier */
  function pagePanier() {
    var zone = $("#panier-page");
    FL.surControlesPanier(zone);
    function rendre() {
      var lignes = FL.Panier.lignes(), st = FL.Panier.sousTotal();
      if (!lignes.length) {
        zone.innerHTML = '<div class="vide">' + ILLUS.theiere + '<h2>Votre panier est vide</h2><p>Laissez-vous tenter par nos coups de cœur.</p><a class="btn btn--plein" href="boutique.html">Découvrir la boutique</a></div>';
        return;
      }
      zone.innerHTML = '<div class="commande" style="padding-top:10px"><div>' + FL.htmlProgression(st) + lignes.map(function (l) { return FL.htmlLigne(l); }).join("") +
        '<p style="margin-top:18px"><a class="lien-fleche" href="boutique.html"><span>Continuer mes achats</span>' + I.fleche + "</a></p></div>" +
        '<aside class="recap"><h2>Récapitulatif</h2><div class="totaux"><div><span>Sous-total</span><strong>' + euros(st) + "</strong></div>" +
        '<div class="petit"><span>Livraison : ' + FL.modesLivraison().map(function (m) {
          var fr = FL.fraisLivraison(m.id, st); return esc(m.nom) + " " + (fr === 0 ? "offerte" : euros(fr));
        }).join(" · ") + "</span></div>" +
        '<div class="petit"><span>Prix TTC. Le mode de livraison se choisit à l\'étape suivante.</span></div></div>' +
        '<a class="btn btn--plein btn--large" href="commande.html">Passer commande</a></aside></div>';
    }
    document.addEventListener("panier:maj", rendre);
    rendre();
  }

  /* ================================================================== Commande */
  function pageCommande() {
    var form = $("#form-commande"), recap = $("#recap");
    var modes = FL.modesLivraison();

    $("#modes-livraison").innerHTML = modes.map(function (m, i) {
      return '<label class="option"><input type="radio" name="livraison" value="' + m.id + '"' + (i === 0 ? " checked" : "") + ">" +
        "<span>" + esc(m.nom) + "<small>" + esc(m.detail) + '</small></span><span class="prix" data-prix-mode="' + m.id + '"></span></label>';
    }).join("");

    // Bloc paiement selon le mode configuré — jamais de faux paiement.
    var blocPaiement = $("#bloc-paiement"), btn = $("#btn-commander");
    if (B.paiement.mode === "stripe") {
      blocPaiement.innerHTML = '<div class="alerte">' + I.cadenas + "<p>Vous serez redirigé·e vers la page de paiement sécurisée de notre prestataire <strong>Stripe</strong> pour régler par carte. Nous ne voyons ni ne stockons jamais vos données bancaires.</p></div>";
    } else {
      blocPaiement.innerHTML = '<div class="alerte">' + I.mail + "<div><p><strong>Le paiement en ligne n'est pas encore activé sur la boutique.</strong></p>" +
        "<p>Envoyez votre commande : nous vérifions la disponibilité et vous adressons par e-mail un lien de paiement sécurisé. Votre commande n'est préparée qu'après votre paiement — <strong>rien n'est débité maintenant</strong>.</p></div></div>";
    }

    function livraisonChoisie() { var r = $('input[name="livraison"]:checked', form); return r ? r.value : modes[0].id; }
    function rendreRecap() {
      var lignes = FL.Panier.lignes();
      if (!lignes.length) {
        $("#zone-commande").innerHTML = '<div class="vide">' + ILLUS.theiere + '<h2>Votre panier est vide</h2><p>Ajoutez quelques thés avant de passer commande.</p><a class="btn btn--plein" href="boutique.html">Découvrir la boutique</a></div>';
        return null;
      }
      var st = FL.Panier.sousTotal(), fr = FL.fraisLivraison(livraisonChoisie(), st), total = FL.arrondi(st + fr);
      modes.forEach(function (m) { var el = $('[data-prix-mode="' + m.id + '"]'); var x = FL.fraisLivraison(m.id, st); if (el) el.textContent = x === 0 ? "Offerte" : euros(x); });
      recap.innerHTML = "<h2>Votre commande</h2>" + lignes.map(function (l) { return FL.htmlLigne(l, true); }).join("") +
        '<div class="totaux" style="margin-top:14px"><div><span>Sous-total</span><span>' + euros(st) + "</span></div>" +
        "<div><span>Livraison</span><span>" + (fr === 0 ? "Offerte" : euros(fr)) + "</span></div>" +
        '<div class="total"><span>Total TTC</span><span>' + euros(total) + "</span></div></div>" +
        (B.livraison.seuilGratuit && st < B.livraison.seuilGratuit ? '<p class="discret" style="font-size:13.5px;margin:0">Ajoutez ' + euros(B.livraison.seuilGratuit - st) + ' d\'articles pour une livraison offerte. <a href="boutique.html">Compléter</a></p>' : "") +
        '<p style="margin:12px 0 0"><a href="panier.html">Modifier le panier</a></p>';
      btn.textContent = B.paiement.mode === "stripe" ? "Commander avec obligation de paiement · " + euros(total) : "Envoyer ma demande de commande";
      return { lignes: lignes, st: st, fr: fr, total: total };
    }
    form.addEventListener("change", function (e) { if (e.target.name === "livraison") rendreRecap(); });
    document.addEventListener("panier:maj", rendreRecap);
    if (!rendreRecap()) return;

    // Validation
    var regles = {
      email: function (v) { return FL.emailValide(v) || "Indiquez une adresse e-mail valide, par exemple prenom@exemple.fr."; },
      telephone: function (v) { return !v || /^[+0-9 ().-]{8,20}$/.test(v) || "Ce numéro ne semble pas valide."; },
      prenom: function (v) { return v.trim().length > 0 || "Indiquez votre prénom."; },
      nom: function (v) { return v.trim().length > 0 || "Indiquez votre nom."; },
      adresse: function (v) { return v.trim().length > 4 || "Indiquez votre adresse (numéro et rue)."; },
      cp: function (v) { return /^(0[1-9]|[1-8][0-9]|9[0-5]|2A|2B)[0-9]{3}$/i.test(v.trim()) || "Code postal à 5 chiffres, en France métropolitaine."; },
      ville: function (v) { return v.trim().length > 1 || "Indiquez votre ville."; },
      cgv: function (v, el) { return el.checked || "Merci d'accepter les conditions générales de vente."; }
    };
    function verifier(el) {
      var r = regles[el.name]; if (!r) return true;
      var res = r(el.value, el), champ = el.closest(".champ, .case-cgv"), err = champ && $(".erreur .txt", champ);
      var ok = res === true;
      if (champ) champ.classList.toggle("est-invalide", !ok);
      el.setAttribute("aria-invalid", String(!ok));
      if (err) err.textContent = ok ? "" : res;
      return ok;
    }
    $$("input, select, textarea", form).forEach(function (el) {
      el.addEventListener("blur", function () { if (el.value || el.type === "checkbox") verifier(el); });
      el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") verifier(el); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var invalides = $$("input, select, textarea", form).filter(function (el) { return !verifier(el); });
      var msg = $("#message-commande");
      msg.hidden = true;
      if (invalides.length) {
        msg.className = "alerte alerte--erreur"; msg.hidden = false;
        msg.innerHTML = I.alerte + "<p>" + (invalides.length > 1 ? invalides.length + " champs sont à compléter ou à corriger." : "Un champ est à compléter ou à corriger.") + "</p>";
        invalides[0].focus();
        return;
      }
      var r = rendreRecap(); if (!r) return;
      var d = new FormData(form), client = {};
      ["email", "telephone", "prenom", "nom", "adresse", "complement", "cp", "ville", "message"].forEach(function (k) { client[k] = (d.get(k) || "").toString().trim(); });
      var mode = modes.find(function (m) { return m.id === livraisonChoisie(); });
      var numero = "FL-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      var resume = r.lignes.map(function (l) { return l.qte + " × " + FL.nomComplet(l.produit) + " (" + l.f.nom + ") — " + euros(l.total); }).join("\n");
      var commande = {
        numero: numero, date: new Date().toISOString(), client: client, livraison: mode.nom,
        lignes: r.lignes.map(function (l) { return { id: l.id, format: l.format, qte: l.qte, nom: FL.nomComplet(l.produit), formatNom: l.f.nom, total: l.total }; }),
        sousTotal: r.st, frais: r.fr, total: r.total, mode: B.paiement.mode
      };
      btn.disabled = true; var libelle = btn.textContent; btn.innerHTML = '<span class="rond-chargement" aria-hidden="true"></span> Envoi en cours…';

      function echec(texte, secours) {
        btn.disabled = false; btn.textContent = libelle;
        msg.className = "alerte alerte--erreur"; msg.hidden = false;
        msg.innerHTML = I.alerte + "<div><p>" + texte + "</p>" + (secours || "") + "</div>";
        msg.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      if (B.paiement.mode === "stripe") {
        fetch(B.paiement.endpoint, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero: numero, lignes: commande.lignes.map(function (l) { return { id: l.id, format: l.format, qte: l.qte }; }), livraison: mode.id, client: client })
        }).then(function (res) { return res.json().then(function (j) { if (!res.ok || !j.url) throw new Error(j.erreur || "paiement"); return j; }); })
          .then(function (j) {
            try { sessionStorage.setItem("florelle-commande", JSON.stringify(commande)); } catch (err) { /* sans conséquence */ }
            location.href = j.url;
          })
          .catch(function (err) {
            echec("Le paiement n'a pas pu être lancé" + (err.message && err.message !== "paiement" ? " : " + esc(err.message) : "") + ". Votre carte n'a pas été débitée. Réessayez, ou écrivez-nous à <a href=\"mailto:" + esc(B.contact.email) + "\">" + esc(B.contact.email) + "</a>.");
          });
        return;
      }

      var donnees = {
        numero: numero, email: client.email, telephone: client.telephone, prenom: client.prenom, nom: client.nom,
        adresse: client.adresse + (client.complement ? ", " + client.complement : "") + ", " + client.cp + " " + client.ville,
        livraison: mode.nom + " — " + (r.fr === 0 ? "offerte" : euros(r.fr)), commande: resume, total: euros(r.total), message: client.message
      };
      FL.envoyerFormulaire("commande", donnees).then(function () {
        try { sessionStorage.setItem("florelle-commande", JSON.stringify(commande)); } catch (err) { /* sans conséquence */ }
        FL.Panier.vider();
        location.href = "confirmation.html";
      }).catch(function (err) {
        var corpsMail = "Bonjour,\n\nJe souhaite passer la commande suivante (réf. " + numero + ") :\n\n" + resume +
          "\n\nLivraison : " + donnees.livraison + "\nTotal : " + donnees.total + "\n\n" + client.prenom + " " + client.nom + "\n" + donnees.adresse + "\n" + client.email + (client.telephone ? "\n" + client.telephone : "") +
          (client.message ? "\n\nMessage : " + client.message : "");
        var lien = "mailto:" + B.contact.email + "?subject=" + encodeURIComponent("Commande " + numero) + "&body=" + encodeURIComponent(corpsMail);
        echec(err.message === "hors-ligne"
          ? "L'envoi automatique fonctionne une fois le site publié sur Netlify. En attendant, vous pouvez envoyer cette commande par e-mail :"
          : "Votre commande n'a pas pu être envoyée (problème de connexion). Rien n'a été débité. Réessayez, ou envoyez-la par e-mail :",
          '<p style="margin-top:10px"><a class="btn btn--contour" href="' + lien + '">' + I.mail + " Envoyer par e-mail</a></p>");
      });
    });
  }

  /* ============================================================== Confirmation */
  function pageConfirmation() {
    var zone = $("#confirmation"), cmd = null;
    try { cmd = JSON.parse(sessionStorage.getItem("florelle-commande") || "null"); } catch (e) { cmd = null; }
    var sessionId = FL.param("session_id");
    if (!cmd) {
      zone.innerHTML = '<div class="vide">' + ILLUS.tasse + '<h1>Aucune commande récente</h1><p>Cette page s\'affiche après l\'envoi d\'une commande.</p><a class="btn btn--plein" href="boutique.html">Découvrir la boutique</a></div>';
      return;
    }
    function rendre(etatPaiement) {
      var paye = etatPaiement === "paid";
      var entete = cmd.mode === "stripe"
        ? (paye ? "<h1>Merci, votre commande est confirmée !</h1><div class=\"alerte alerte--succes\">" + I.check + "<p>Votre paiement a bien été reçu. Un e-mail de confirmation vous est envoyé par notre prestataire de paiement.</p></div>"
                : "<h1>Commande en attente de paiement</h1><div class=\"alerte\">" + I.alerte + "<p>Nous n'avons pas (encore) de confirmation de paiement pour cette commande. Si vous avez quitté la page de paiement, votre carte n'a pas été débitée : vous pouvez <a href=\"commande.html\">reprendre la commande</a>.</p></div>")
        : "<h1>Merci, votre demande de commande est bien partie !</h1><div class=\"alerte alerte--succes\">" + I.check +
          "<div><p><strong>Aucun paiement n'a été effectué.</strong> Nous vérifions la disponibilité de vos thés et vous envoyons sous 24 h ouvrées, à <strong>" + esc(cmd.client.email) +
          "</strong>, un lien de paiement sécurisé. Votre colis part dès réception du règlement.</p></div></div>";
      zone.innerHTML = '<p class="fil">Référence <strong>' + esc(cmd.numero) + "</strong></p>" + entete +
        '<div class="recap" style="position:static;margin-top:26px"><h2>Récapitulatif</h2>' +
        cmd.lignes.map(function (l) { return '<div class="totaux"><div><span>' + l.qte + " × " + esc(l.nom) + " <em class=\"discret\">(" + esc(l.formatNom) + ")</em></span><span>" + euros(l.total) + "</span></div></div>"; }).join("") +
        '<div class="totaux"><div><span>Livraison (' + esc(cmd.livraison) + ")</span><span>" + (cmd.frais === 0 ? "Offerte" : euros(cmd.frais)) + '</span></div><div class="total"><span>Total TTC</span><span>' + euros(cmd.total) + "</span></div></div>" +
        '<p style="margin:0">Livraison à : ' + esc(cmd.client.prenom + " " + cmd.client.nom + ", " + cmd.client.adresse + (cmd.client.complement ? ", " + cmd.client.complement : "") + ", " + cmd.client.cp + " " + cmd.client.ville) + "</p></div>" +
        '<p style="margin-top:26px">En attendant votre colis, préparez le terrain : <a href="conseils.html">nos conseils pour réussir chaque thé</a>.</p>' +
        '<a class="btn btn--plein" href="boutique.html">Continuer la visite</a>';
    }
    if (cmd.mode === "stripe" && sessionId) {
      zone.innerHTML = '<p class="centre"><span class="rond-chargement" style="display:inline-block;width:22px;height:22px;border:2px solid var(--corail-encre);border-right-color:transparent;border-radius:50%;animation:tourne .7s linear infinite"></span><br>Vérification du paiement…</p>';
      fetch(B.paiement.endpoint + "?session_id=" + encodeURIComponent(sessionId)).then(function (r) { return r.json(); })
        .then(function (j) { if (j.payment_status === "paid") FL.Panier.vider(); rendre(j.payment_status); })
        .catch(function () { rendre("inconnu"); });
    } else rendre(cmd.mode === "stripe" ? "inconnu" : "demande");
  }

  /* =================================================================== Contact */
  function pageContact() {
    var form = $("#form-contact"), msg = $("#message-contact");
    var sujet = FL.param("sujet"); if (sujet) $("#c-sujet").value = sujet;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      [["c-nom", function (v) { return v.trim().length > 1; }], ["c-email", FL.emailValide], ["c-message", function (v) { return v.trim().length > 9; }]].forEach(function (r) {
        var el = $("#" + r[0]), bon = r[1](el.value);
        el.closest(".champ").classList.toggle("est-invalide", !bon); el.setAttribute("aria-invalid", String(!bon));
        if (!bon && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      var b = $("button[type=submit]", form), l = b.textContent; b.disabled = true; b.textContent = "Envoi…";
      var donnees = { nom: $("#c-nom").value, email: $("#c-email").value, sujet: $("#c-sujet").value, message: $("#c-message").value };
      FL.envoyerFormulaire("contact", donnees).then(function () {
        form.reset(); msg.hidden = false; msg.className = "alerte alerte--succes";
        msg.innerHTML = I.check + "<p>Merci, votre message est bien arrivé. Nous vous répondons " + esc(B.contact.horaires) + ".</p>";
      }).catch(function (err) {
        var lien = "mailto:" + B.contact.email + "?subject=" + encodeURIComponent(donnees.sujet || "Question") + "&body=" + encodeURIComponent(donnees.message + "\n\n" + donnees.nom);
        msg.hidden = false; msg.className = "alerte alerte--erreur";
        msg.innerHTML = I.alerte + "<div><p>" + (err.message === "hors-ligne" ? "L'envoi automatique fonctionne une fois le site publié sur Netlify." : "Le message n'a pas pu être envoyé.") +
          ' Vous pouvez nous l\'envoyer par e-mail :</p><p><a class="btn btn--contour" href="' + lien + '">' + I.mail + " Écrire à " + esc(B.contact.email) + "</a></p></div>";
      }).then(function () { b.disabled = false; b.textContent = l; });
    });
  }

  /* ============================================================ Pages éditoriales */
  function contenus() {
    $$("[data-illus-slot]").forEach(function (el) { el.innerHTML = ILLUS[el.dataset.illusSlot] || ""; });
    $$("[data-icone]").forEach(function (el) { el.innerHTML = I[el.dataset.icone] || ""; });
    $$("[data-logo-clair]").forEach(function (el) {
      el.innerHTML = window.LOGO.replace(/#F87C56/g, "#F9CDB4").replace('fill="#fff"', 'fill="#FFE4D1"');
    });
    $$("[data-config]").forEach(function (el) {
      var chemin = el.dataset.config.split("."), v = B;
      chemin.forEach(function (k) { v = v == null ? v : v[k]; });
      if (v != null && v !== "") el.textContent = typeof v === "number" ? euros(v).replace(",00", "") : v;
      if (el.tagName === "A" && /^mailto:/.test(el.getAttribute("href") || "")) el.setAttribute("href", "mailto:" + v);
    });
    var t = $("#tableau-livraison");
    if (t) {
      t.innerHTML = FL.modesLivraison().map(function (m) {
        return "<tr><td>" + esc(m.nom) + "</td><td>" + esc(m.detail) + "</td><td>" + (m.prix ? euros(m.prix) : "Gratuit") + "</td><td>" +
          (m.gratuitDes != null ? "Offerte dès " + euros(m.gratuitDes) : "—") + "</td></tr>";
      }).join("");
    }
    $$("[data-paiement]").forEach(function (el) { el.hidden = el.dataset.paiement !== B.paiement.mode; });
    FL.apparitions();
  }

  var pages = { accueil: accueil, boutique: boutique, produit: ficheProduit, panier: pagePanier, commande: pageCommande, confirmation: pageConfirmation, contact: pageContact };
  contenus();
  if (pages[page]) pages[page]();
})();
