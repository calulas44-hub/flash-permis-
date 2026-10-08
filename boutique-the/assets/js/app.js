/*
 * Florelle — socle commun à toutes les pages :
 * outils, panier, en-tête, pied de page, tiroirs, recherche, animations.
 */
(function () {
  "use strict";

  var B = window.BOUTIQUE, C = window.CATALOGUE, I = window.ICONES, ILLUS = window.ILLUS;
  document.documentElement.classList.add("js");

  /* ---------------------------------------------------------------- Outils */
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  var fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
  function euros(n) { return fmt.format(n); }
  function arrondi(n) { return Math.round(n * 100) / 100; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function param(nom) { return new URLSearchParams(location.search).get(nom); }
  function normal(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  // Photos : servies et redimensionnées par le CDN d'Unsplash (WebP/AVIF automatique).
  function urlImage(id, l, h) {
    if (!/^photo-/.test(id)) return new URL(id, location.href).href;
    return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&q=72&w=" + l + (h ? "&h=" + h : "");
  }
  function image(id, alt, opts) {
    opts = opts || {};
    // Vos propres photos : indiquez un chemin (ex. "assets/img/sencha.jpg") à la place d'un identifiant Unsplash.
    if (!/^photo-/.test(id)) {
      return '<img src="' + esc(id) + '" alt="' + esc(alt) + '"' + (opts.prioritaire ? ' fetchpriority="high"' : ' loading="lazy"') +
        ' decoding="async" data-illus="' + (opts.illus || "tasse") + '">';
    }
    var ratio = opts.ratio || 1, largeurs = opts.largeurs || [360, 540, 720, 960];
    var srcset = largeurs.map(function (l) { return urlImage(id, l, Math.round(l * ratio)) + " " + l + "w"; }).join(", ");
    var l0 = largeurs[1] || largeurs[0];
    return '<img src="' + urlImage(id, l0, Math.round(l0 * ratio)) + '" srcset="' + srcset + '" sizes="' + (opts.sizes || "(max-width: 989px) 50vw, 270px") +
      '" alt="' + esc(alt) + '" width="' + l0 + '" height="' + Math.round(l0 * ratio) + '"' +
      (opts.prioritaire ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async" data-illus="' + (opts.illus || "tasse") + '">';
  }
  // Si une photo ne charge pas (hors ligne, bloquée…), on affiche l'illustration au trait.
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (!img || img.tagName !== "IMG" || !img.dataset.illus || img.dataset.secours) return;
    img.dataset.secours = "1";
    var div = document.createElement("div");
    div.className = "img-secours";
    if (img.alt) { div.setAttribute("role", "img"); div.setAttribute("aria-label", img.alt); }
    else div.setAttribute("aria-hidden", "true");
    div.innerHTML = ILLUS[img.dataset.illus] || ILLUS.tasse;
    img.replaceWith(div);
  }, true);

  /* ------------------------------------------------------------- Catalogue */
  function produit(id) { return C.produits.find(function (p) { return p.id === id; }); }
  function categorie(id) { return C.categories.find(function (c) { return c.id === id; }); }
  function prixMin(p) { return Math.min.apply(null, p.formats.map(function (f) { return f.prix; })); }
  function nomComplet(p, html) {
    return html ? esc(p.famille) + '<span class="sep" aria-hidden="true"> ✿ </span><span class="sr-only"> – </span>' + esc(p.nom)
                : p.famille + " ✿ " + p.nom;
  }
  function illusDe(p) { var c = categorie(p.categorie); return c ? c.illustration : "tasse"; }
  function prixAffiche(p) { return (p.formats.length > 1 ? "à partir de " : "") + euros(prixMin(p)); }
  function lienProduit(p) { return "produit.html?id=" + encodeURIComponent(p.id); }

  /* ----------------------------------------------------------------- Panier */
  var CLE = "florelle-panier", memoire = [];
  function lirePanier() {
    try { var v = JSON.parse(localStorage.getItem(CLE) || "[]"); return Array.isArray(v) ? v : []; }
    catch (e) { return memoire.slice(); }
  }
  function ecrirePanier(l) {
    memoire = l.slice();
    try { localStorage.setItem(CLE, JSON.stringify(l)); } catch (e) { /* navigation privée : on garde en mémoire */ }
    document.dispatchEvent(new CustomEvent("panier:maj"));
  }
  var Panier = {
    lignes: function () {
      return lirePanier().map(function (l) {
        var p = produit(l.id); if (!p) return null;
        var f = p.formats.find(function (x) { return x.id === l.format; }); if (!f) return null;
        var q = Math.max(1, Math.min(20, parseInt(l.qte, 10) || 1));
        return { id: p.id, format: f.id, qte: q, produit: p, f: f, total: arrondi(f.prix * q) };
      }).filter(Boolean);
    },
    ajouter: function (id, format, qte) {
      var l = lirePanier(), i = l.findIndex(function (x) { return x.id === id && x.format === format; });
      if (i > -1) l[i].qte = Math.min(20, (parseInt(l[i].qte, 10) || 1) + qte);
      else l.push({ id: id, format: format, qte: Math.min(20, qte) });
      ecrirePanier(l);
    },
    changer: function (id, format, qte) {
      var l = lirePanier().map(function (x) {
        if (x.id === id && x.format === format) x.qte = Math.max(1, Math.min(20, qte));
        return x;
      });
      ecrirePanier(l);
    },
    retirer: function (id, format) {
      ecrirePanier(lirePanier().filter(function (x) { return !(x.id === id && x.format === format); }));
    },
    vider: function () { ecrirePanier([]); },
    sousTotal: function () { return arrondi(this.lignes().reduce(function (s, l) { return s + l.total; }, 0)); },
    nombre: function () { return this.lignes().reduce(function (s, l) { return s + l.qte; }, 0); }
  };
  window.addEventListener("storage", function (e) { if (e.key === CLE) document.dispatchEvent(new CustomEvent("panier:maj")); });

  /* --------------------------------------------------------------- Livraison */
  function modesLivraison() { return B.livraison.modes.filter(function (m) { return m.actif !== false; }); }
  function fraisLivraison(modeId, sousTotal) {
    var m = modesLivraison().find(function (x) { return x.id === modeId; });
    if (!m) return null;
    if (m.gratuitDes != null && sousTotal >= m.gratuitDes) return 0;
    return m.prix;
  }

  /* ------------------------------------------------------------ Formulaires */
  function envoyerFormulaire(nom, donnees) {
    if (location.protocol === "file:") {
      return Promise.reject(new Error("hors-ligne"));
    }
    var corps = new URLSearchParams();
    corps.append("form-name", nom);
    Object.keys(donnees).forEach(function (k) { corps.append(k, donnees[k]); });
    return fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: corps.toString() })
      .then(function (r) { if (!r.ok) throw new Error("http-" + r.status); return r; });
  }
  function emailValide(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); }

  /* ------------------------------------------------------------ Gabarits */
  function carteProduit(p, opts) {
    opts = opts || {};
    var etiquette = !p.stock ? '<span class="carte__etiquette carte__etiquette--epuise">Épuisé</span>'
      : p.theine === 0 ? '<span class="carte__etiquette">Sans théine</span>' : "";
    return '<li><article class="carte">' +
      '<a class="carte__visuel" href="' + lienProduit(p) + '" tabindex="-1" aria-hidden="true">' +
      image(p.image, "", { illus: illusDe(p), sizes: opts.sizes }) + etiquette + "</a>" +
      '<div class="carte__corps">' +
      '<h3 class="carte__nom"><a href="' + lienProduit(p) + '">' + nomComplet(p, true) + "</a></h3>" +
      (opts.accroche ? '<p class="carte__accroche">' + esc(p.accroche) + "</p>" : "") +
      '<p class="carte__prix">' + prixAffiche(p) + "</p>" +
      '<a class="btn btn--contour carte__action" href="' + lienProduit(p) + '">' + (p.formats.length > 1 ? "Choisir mon format" : "Découvrir") + "</a>" +
      "</div></article></li>";
  }

  function htmlEntete() {
    var cats = C.categories.map(function (c) {
      return '<li><a href="boutique.html?categorie=' + c.id + '"><span class="mini">' + ILLUS[c.illustration] + "</span><span>" + esc(c.nom) +
        "<small>" + esc(c.description.split(":")[0].split(".")[0]) + "</small></span></a></li>";
    }).join("");
    var moments = C.moments.map(function (m) {
      return '<li><a href="boutique.html?moment=' + m.id + '"><span class="mini">' + (m.id === "soir" ? I.lune : m.id === "matin" ? I.soleil : I.tasse) +
        "</span><span>" + esc(m.nom) + "<small>" + esc(m.accroche) + "</small></span></a></li>";
    }).join("") + '<li><a href="boutique.html?theine=sans"><span class="mini">' + I.feuille + "</span><span>Sans théine<small>Infusions et rooibos</small></span></a></li>";

    var annonces = ["Livraison offerte dès " + euros(B.livraison.seuilGratuit).replace(",00", ""), "Expédition sous " + B.delaiPreparation,
      "Conseils de préparation sur chaque fiche"];

    return (B.demo ? '<div class="bandeau-demo">Boutique de démonstration : catalogue, prix et photos sont fictifs et aucune commande n\'est expédiée. <a href="mentions-legales.html#demonstration">En savoir plus</a></div>' : "") +
      '<a class="lien-evitement" href="#contenu">Aller au contenu</a>' +
      '<div class="annonce">' + annonces.map(function (a) { return "<span>" + esc(a) + "</span>"; }).join("") + "</div>" +
      '<header class="entete"><div class="page entete__barre">' +
      '<button type="button" class="icone-btn entete__burger" data-ouvre="menu-mobile" aria-controls="menu-mobile" aria-expanded="false" aria-label="Ouvrir le menu">' + I.menu + "</button>" +
      '<a class="logo" href="index.html"><span class="logo__medaillon">' + window.LOGO + '</span><span class="sr-only">' + esc(B.nom) + " — accueil</span></a>" +
      '<nav class="nav" aria-label="Navigation principale"><ul class="nav__liste">' +
      '<li class="nav__item"><button type="button" class="nav__lien" aria-expanded="false" aria-controls="sm-boutique">La boutique ' + I.chevron + "</button>" +
      '<div class="sous-menu" id="sm-boutique"><ul>' + cats + '</ul><div class="sous-menu__pied"><a href="boutique.html"><span class="mini">' + ILLUS.feuille + "</span><span>Tout le catalogue<small>" + C.produits.length + " références</small></span></a></div></div></li>" +
      '<li class="nav__item"><button type="button" class="nav__lien" aria-expanded="false" aria-controls="sm-moment">Par moment ' + I.chevron + "</button>" +
      '<div class="sous-menu" id="sm-moment"><ul>' + moments + "</ul></div></li>" +
      '<li><a class="nav__lien" href="boutique.html?categorie=coffrets">Cadeaux</a></li>' +
      '<li><a class="nav__lien" href="conseils.html">Conseils</a></li>' +
      '<li><a class="nav__lien" href="histoire.html">Notre histoire</a></li>' +
      '<li><a class="nav__lien" href="contact.html">Contact</a></li>' +
      "</ul></nav>" +
      '<div class="entete__actions">' +
      '<button type="button" class="icone-btn" data-ouvre="recherche" aria-controls="recherche" aria-expanded="false" aria-label="Rechercher un thé">' + I.recherche + "</button>" +
      '<button type="button" class="icone-btn" data-ouvre="tiroir-panier" aria-controls="tiroir-panier" aria-expanded="false"><span class="sr-only libelle-panier">Ouvrir le panier</span>' + I.panier + '<span class="pastille" aria-hidden="true">0</span></button>' +
      "</div></div></header>" +
      '<div class="promo"><a href="produit.html?id=coffret-decouverte"><span>✿ Le coffret Découverte : 6 thés pour trouver le vôtre</span>' + I.fleche + "</a></div>";
  }

  function htmlTiroirs() {
    var cats = C.categories.map(function (c) { return '<li><a href="boutique.html?categorie=' + c.id + '">' + esc(c.nom) + "</a></li>"; }).join("");
    var moments = C.moments.map(function (m) { return '<li><a href="boutique.html?moment=' + m.id + '">' + esc(m.nom) + "</a></li>"; }).join("");
    return '<div class="voile" data-ferme></div>' +
      '<aside class="tiroir" id="tiroir-panier" role="dialog" aria-modal="true" aria-labelledby="titre-panier" hidden>' +
      '<div class="tiroir__tete"><h2 id="titre-panier">Votre panier</h2><button type="button" class="icone-btn" data-ferme aria-label="Fermer le panier">' + I.fermer + "</button></div>" +
      '<div class="tiroir__corps" id="panier-corps" aria-live="polite"></div>' +
      '<div class="tiroir__pied" id="panier-pied"></div></aside>' +
      '<aside class="tiroir tiroir--gauche" id="menu-mobile" role="dialog" aria-modal="true" aria-label="Menu" hidden>' +
      '<div class="tiroir__tete"><h2>Menu</h2><button type="button" class="icone-btn" data-ferme aria-label="Fermer le menu">' + I.fermer + "</button></div>" +
      '<nav class="tiroir__corps menu-mobile" aria-label="Navigation mobile"><ul>' +
      '<li><details open><summary>La boutique ' + I.chevron + "</summary><ul>" + cats + '<li><a href="boutique.html">Tout le catalogue</a></li></ul></details></li>' +
      '<li><details><summary>Par moment ' + I.chevron + "</summary><ul>" + moments + '<li><a href="boutique.html?theine=sans">Sans théine</a></li></ul></details></li>' +
      '<li><a href="boutique.html?categorie=coffrets">Cadeaux ' + I.fleche + "</a></li>" +
      '<li><a href="conseils.html">Conseils de préparation ' + I.fleche + "</a></li>" +
      '<li><a href="histoire.html">Notre histoire ' + I.fleche + "</a></li>" +
      '<li><a href="faq.html">Questions fréquentes ' + I.fleche + "</a></li>" +
      '<li><a href="contact.html">Contact ' + I.fleche + "</a></li>" +
      "</ul></nav></aside>" +
      '<div class="recherche" id="recherche" role="dialog" aria-modal="true" aria-label="Recherche" hidden><div class="page">' +
      '<form class="recherche__champ" action="boutique.html" role="search">' + I.recherche +
      '<label class="sr-only" for="champ-recherche">Rechercher un thé, une saveur, un ingrédient</label>' +
      '<input id="champ-recherche" name="q" type="search" autocomplete="off" placeholder="Un thé, une saveur, un ingrédient…">' +
      '<button type="button" class="icone-btn" data-ferme aria-label="Fermer la recherche">' + I.fermer + "</button></form>" +
      '<ul class="resultats" id="resultats-recherche" aria-live="polite"></ul></div></div>' +
      '<div class="notif" role="status" aria-live="polite"></div>';
  }

  function htmlPied() {
    var annee = new Date().getFullYear();
    var paiement = B.paiement.mode === "stripe"
      ? '<div class="moyens" aria-label="Moyens de paiement acceptés"><span>Carte bancaire</span><span>Visa</span><span>Mastercard</span></div>' : "";
    return '<footer class="pied"><div class="page">' +
      '<div class="pied__colonnes">' +
      "<div><h2>Nos engagements</h2><ul>" +
      '<li><a href="histoire.html#selection">Comment nous choisissons nos thés</a></li>' +
      '<li><a href="conseils.html">Bien préparer son thé</a></li>' +
      '<li><a href="livraison-retours.html">Livraison soignée</a></li>' +
      '<li><a href="livraison-retours.html#retours">Retours sous 14 jours</a></li>' +
      "</ul></div>" +
      "<div><h2>Informations</h2><ul>" +
      '<li><a href="faq.html">Questions fréquentes</a></li>' +
      '<li><a href="livraison-retours.html">Livraison & retours</a></li>' +
      '<li><a href="cgv.html">Conditions générales de vente</a></li>' +
      '<li><a href="mentions-legales.html">Mentions légales</a></li>' +
      '<li><a href="confidentialite.html">Confidentialité</a></li>' +
      '<li><a href="contact.html">Nous contacter</a></li>' +
      "</ul></div>" +
      "<div><h2>" + esc(B.nom) + "</h2><p>" + esc(B.accroche) + ", choisis pour leur goût et accompagnés de conseils précis pour les réussir à la maison.</p>" +
      '<p>Une question ? <a href="mailto:' + esc(B.contact.email) + '">' + esc(B.contact.email) + "</a></p>" +
      '<form class="js-newsletter" novalidate><div class="champ-ligne"><label class="sr-only" for="nl-pied">Votre adresse e-mail</label>' +
      '<input id="nl-pied" type="email" name="email" placeholder="Newsletter : votre e-mail" autocomplete="email" required>' +
      '<button type="submit" aria-label="S\'inscrire à la newsletter">' + I.fleche + "</button></div>" +
      '<p class="message-form" role="status"></p></form>' + paiement + "</div>" +
      "</div>" +
      '<div class="pied__bas"><span>© ' + annee + " " + esc(B.nom) + " — " + esc(B.accroche) + "</span>" +
      "<span>Photographies d'illustration : Unsplash</span></div>" +
      "</div></footer>";
  }

  /* ---------------------------------------------------------- Mise en place */
  function monter() {
    var e = $("#site-entete"), p = $("#site-pied");
    if (e) e.outerHTML = htmlEntete();
    if (p) p.outerHTML = htmlPied();
    document.body.insertAdjacentHTML("beforeend", htmlTiroirs());
  }

  /* --------------------------------------------------------------- Tiroirs */
  var ouvert = null, declencheur = null;
  function ouvrir(id, depuis) {
    var el = document.getElementById(id); if (!el) return;
    if (ouvert) fermer(true);
    declencheur = depuis || document.activeElement;
    el.hidden = false;
    // Laisse le navigateur appliquer hidden=false avant d'animer.
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("est-ouvert"); }); });
    $(".voile").classList.add("est-visible");
    document.body.style.overflow = "hidden";
    $$('[aria-controls="' + id + '"]').forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    ouvert = el;
    var cible = el.querySelector("input, [data-focus]") || el.querySelector("button, a");
    setTimeout(function () { if (cible) cible.focus(); }, 80);
    if (id === "tiroir-panier") rendrePanier();
  }
  function fermer(silencieux) {
    if (!ouvert) return;
    var el = ouvert; ouvert = null;
    el.classList.remove("est-ouvert");
    $(".voile").classList.remove("est-visible");
    document.body.style.overflow = "";
    $$('[aria-controls="' + el.id + '"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    setTimeout(function () { if (!el.classList.contains("est-ouvert")) el.hidden = true; }, 380);
    if (!silencieux && declencheur && declencheur.focus) declencheur.focus();
  }
  function piegerFocus(e) {
    if (!ouvert || e.key !== "Tab") return;
    var f = $$("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])", ouvert).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var premier = f[0], dernier = f[f.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  }

  /* --------------------------------------------------------- Panier (tiroir) */
  function htmlProgression(st) {
    var seuil = B.livraison.seuilGratuit;
    if (!seuil) return "";
    if (st >= seuil) return '<div class="progression">✿ Bonne nouvelle : la livraison vous est offerte.<div class="progression__rail"><span style="width:100%"></span></div></div>';
    return '<div class="progression">Plus que <strong>' + euros(seuil - st) + "</strong> pour profiter de la livraison offerte." +
      '<div class="progression__rail"><span style="width:' + Math.round((st / seuil) * 100) + '%"></span></div></div>';
  }
  function htmlLigne(l, compact) {
    var p = l.produit;
    return '<div class="ligne-panier">' +
      '<a class="ligne-panier__img" href="' + lienProduit(p) + '" tabindex="-1" aria-hidden="true">' + image(p.image, "", { illus: illusDe(p), largeurs: [160], sizes: "76px" }) +
      (compact ? "<b>" + l.qte + "</b>" : "") + "</a>" +
      '<div><a class="ligne-panier__nom" href="' + lienProduit(p) + '">' + nomComplet(p, true) + "</a>" +
      '<div class="ligne-panier__format">' + esc(l.f.nom) + (compact ? "" : " · " + euros(l.f.prix)) + "</div>" +
      (compact ? "" :
        '<div class="ligne-panier__ctrl"><div class="quantite quantite--petite">' +
        '<button type="button" data-qte="-1" data-id="' + p.id + '" data-format="' + l.f.id + '" aria-label="Retirer un ' + esc(p.nom) + '">' + I.moins + "</button>" +
        '<input type="number" min="1" max="20" value="' + l.qte + '" aria-label="Quantité de ' + esc(p.nom + " " + l.f.nom) + '" data-id="' + p.id + '" data-format="' + l.f.id + '">' +
        '<button type="button" data-qte="1" data-id="' + p.id + '" data-format="' + l.f.id + '" aria-label="Ajouter un ' + esc(p.nom) + '">' + I.plus + "</button></div>" +
        '<button type="button" class="btn-retirer" data-retirer data-id="' + p.id + '" data-format="' + l.f.id + '" aria-label="Supprimer ' + esc(p.nom + " " + l.f.nom) + ' du panier">' + I.poubelle + "</button></div>") +
      "</div>" +
      '<div class="ligne-panier__prix">' + euros(l.total) + "</div></div>";
  }
  function rendrePanier() {
    var corps = $("#panier-corps"), pied = $("#panier-pied");
    if (!corps) return;
    var lignes = Panier.lignes(), st = Panier.sousTotal();
    if (!lignes.length) {
      corps.innerHTML = '<div class="vide">' + ILLUS.theiere + '<p>Votre panier est vide.</p><a class="btn btn--plein" href="boutique.html">Continuer les achats</a></div>';
      pied.innerHTML = "";
      pied.hidden = true;
      return;
    }
    pied.hidden = false;
    corps.innerHTML = htmlProgression(st) + lignes.map(function (l) { return htmlLigne(l); }).join("");
    pied.innerHTML = '<div class="totaux"><div><span>Sous-total</span><strong>' + euros(st) + "</strong></div>" +
      '<div class="petit"><span>Taxes incluses. Frais de livraison calculés à l\'étape suivante.</span></div></div>' +
      '<a class="btn btn--plein btn--large" href="commande.html">Commander</a>' +
      '<p class="centre" style="margin:10px 0 0"><a href="panier.html">Voir le panier détaillé</a></p>';
  }
  function majPastille() {
    var n = Panier.nombre();
    $$(".pastille").forEach(function (p) {
      var avant = p.textContent;
      p.textContent = n;
      p.classList.toggle("est-visible", n > 0);
      if (String(n) !== avant && n > 0) { p.classList.remove("rebond"); void p.offsetWidth; p.classList.add("rebond"); }
    });
    $$(".libelle-panier").forEach(function (s) { s.textContent = "Ouvrir le panier, " + n + " article" + (n > 1 ? "s" : ""); });
  }
  function surControlesPanier(racine) {
    racine.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-qte], button[data-retirer]"); if (!b) return;
      var l = Panier.lignes().find(function (x) { return x.id === b.dataset.id && x.format === b.dataset.format; });
      if (!l) return;
      if (b.hasAttribute("data-retirer")) { Panier.retirer(l.id, l.format); notifier(l.produit.nom + " retiré du panier"); return; }
      var q = l.qte + parseInt(b.dataset.qte, 10);
      if (q < 1) Panier.retirer(l.id, l.format); else Panier.changer(l.id, l.format, q);
    });
    racine.addEventListener("change", function (e) {
      var i = e.target.closest("input[data-id]"); if (!i) return;
      var q = parseInt(i.value, 10);
      if (!q || q < 1) q = 1;
      Panier.changer(i.dataset.id, i.dataset.format, q);
    });
  }

  var minuteur;
  function notifier(txt) {
    var n = $(".notif"); if (!n) return;
    n.textContent = txt; n.classList.add("est-visible");
    clearTimeout(minuteur); minuteur = setTimeout(function () { n.classList.remove("est-visible"); }, 2600);
  }

  /* -------------------------------------------------------------- Recherche */
  function chercher(q) {
    var n = normal(q).trim(); if (!n) return [];
    var mots = n.split(/\s+/);
    return C.produits.map(function (p) {
      var cat = categorie(p.categorie);
      var foin = normal([p.nom, p.famille, p.accroche, cat && cat.nom, (p.saveurs || []).join(" "), p.ingredients, p.origine].join(" "));
      var score = mots.reduce(function (s, m) { return s + (foin.indexOf(m) > -1 ? 1 : 0); }, 0);
      if (normal(p.nom).indexOf(n) > -1) score += 2;
      return { p: p, score: score, tous: mots.every(function (m) { return foin.indexOf(m) > -1; }) };
    }).filter(function (x) { return x.tous; }).sort(function (a, b) { return b.score - a.score; }).map(function (x) { return x.p; });
  }
  function brancherRecherche() {
    var champ = $("#champ-recherche"), res = $("#resultats-recherche");
    if (!champ) return;
    champ.addEventListener("input", function () {
      var r = chercher(champ.value).slice(0, 8);
      if (!champ.value.trim()) { res.innerHTML = ""; return; }
      res.innerHTML = r.length ? r.map(function (p) {
        return '<li><a href="' + lienProduit(p) + '">' + image(p.image, "", { illus: illusDe(p), largeurs: [120], sizes: "48px" }) +
          "<span>" + nomComplet(p, true) + "<small>" + prixAffiche(p) + "</small></span></a></li>";
      }).join("") + '<li><a href="boutique.html?q=' + encodeURIComponent(champ.value) + '"><span>Voir tous les résultats →</span></a></li>'
        : '<li class="discret" style="padding:8px">Aucun thé ne correspond à « ' + esc(champ.value) + " ». Essayez « menthe », « vanille » ou « sans théine ».</li>";
    });
  }

  /* --------------------------------------------------------------- Navigation */
  function brancherNav() {
    var items = $$(".nav__item");
    function toutFermer(sauf) { items.forEach(function (it) { if (it !== sauf) { it.classList.remove("est-ouvert"); $("button", it).setAttribute("aria-expanded", "false"); } }); }
    items.forEach(function (it) {
      var b = $("button", it), minut;
      b.addEventListener("click", function () {
        var o = !it.classList.contains("est-ouvert"); toutFermer(it);
        it.classList.toggle("est-ouvert", o); b.setAttribute("aria-expanded", String(o));
      });
      if (window.matchMedia("(hover: hover)").matches) {
        it.addEventListener("mouseenter", function () { clearTimeout(minut); toutFermer(it); it.classList.add("est-ouvert"); b.setAttribute("aria-expanded", "true"); });
        it.addEventListener("mouseleave", function () { minut = setTimeout(function () { it.classList.remove("est-ouvert"); b.setAttribute("aria-expanded", "false"); }, 160); });
      }
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".nav__item")) toutFermer(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { toutFermer(); fermer(); }
      piegerFocus(e);
    });
    // Lien de page courante
    var page = location.pathname.split("/").pop() || "index.html";
    $$(".nav__lien[href]").forEach(function (a) { if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page"); });

    var entete = $(".entete");
    var maj = function () { entete.classList.toggle("est-defile", window.scrollY > 60); };
    window.addEventListener("scroll", maj, { passive: true }); maj();

    document.addEventListener("click", function (e) {
      var o = e.target.closest("[data-ouvre]");
      if (o) { e.preventDefault(); ouvrir(o.dataset.ouvre, o); return; }
      if (e.target.closest("[data-ferme]")) { e.preventDefault(); fermer(); }
    });
  }

  /* ------------------------------------------------------------- Newsletter */
  function brancherNewsletter() {
    $$(".js-newsletter").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var champ = $("input[type=email]", f), msg = $(".message-form", f);
        msg.classList.remove("est-erreur");
        if (!emailValide(champ.value)) { msg.textContent = "Cette adresse e-mail ne semble pas valide."; msg.classList.add("est-erreur"); champ.focus(); return; }
        msg.textContent = "Inscription en cours…";
        envoyerFormulaire("newsletter", { email: champ.value.trim() }).then(function () {
          msg.textContent = "Merci ! Vous êtes bien inscrit·e."; f.reset();
        }).catch(function (err) {
          msg.classList.add("est-erreur");
          msg.textContent = err.message === "hors-ligne"
            ? "L'inscription fonctionne une fois le site en ligne (Netlify)."
            : "L'inscription n'a pas pu aboutir. Réessayez dans un instant.";
        });
      });
    });
  }

  /* -------------------------------------------------------------- Animations */
  function brancherApparitions() {
    var els = $$(".apparait:not([data-observe]), .apparait-groupe:not([data-observe])");
    els.forEach(function (e) { e.setAttribute("data-observe", ""); });
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("est-visible"); }); return; }
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("est-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ------------------------------------------------------------ Démarrage */
  window.FL = {
    $: $, $$: $$, euros: euros, esc: esc, param: param, normal: normal, arrondi: arrondi,
    image: image, urlImage: urlImage, produit: produit, categorie: categorie, prixMin: prixMin, prixAffiche: prixAffiche,
    nomComplet: nomComplet, illusDe: illusDe, lienProduit: lienProduit, carteProduit: carteProduit,
    Panier: Panier, modesLivraison: modesLivraison, fraisLivraison: fraisLivraison, htmlLigne: htmlLigne, htmlProgression: htmlProgression,
    envoyerFormulaire: envoyerFormulaire, emailValide: emailValide, notifier: notifier, ouvrir: ouvrir, fermer: fermer,
    chercher: chercher, apparitions: brancherApparitions, surControlesPanier: surControlesPanier
  };

  monter();
  brancherNav();
  brancherRecherche();
  brancherNewsletter();
  surControlesPanier($("#tiroir-panier"));
  document.addEventListener("panier:maj", function () { majPastille(); if (ouvert && ouvert.id === "tiroir-panier") rendrePanier(); });
  majPastille();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", brancherApparitions);
  else brancherApparitions();
})();
