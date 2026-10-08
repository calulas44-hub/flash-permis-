# Florelle — boutique de thés et d'infusions

Site e-commerce statique (HTML, CSS, JavaScript, sans compilation) dont la direction artistique s'inspire d'Ascenbio Thés, avec une marque propre : **Florelle** est un nom provisoire, à remplacer par le vôtre.

> ⚠️ **Boutique de démonstration.** Le catalogue, les prix et les photos sont fictifs. Un bandeau l'indique en haut de chaque page tant que `demo: true` dans `assets/js/config.js`. Ne passez cette valeur à `false` qu'après avoir fait tout ce que demande la section « Avant la mise en ligne ».

## Ouvrir le site

- **Le plus simple** : double-cliquez sur `index.html`. Tout fonctionne (navigation, panier, recherche, commande), sauf l'envoi des formulaires, qui demande un hébergement. À la place, le site propose d'envoyer la commande ou le message par e-mail.
- **Avec un petit serveur** : `npx serve .` dans ce dossier.
- **En ligne** : voir « Déploiement ».

## Pages

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil : médaillons des familles de thés, bandeau principal, coups de cœur, focus, réassurance, conseils, newsletter |
| `boutique.html` | Catalogue complet, avec filtres (catégorie, moment de la journée, sans théine, disponibilité), tri et recherche. Les pages de catégorie sont `boutique.html?categorie=thes-verts`, etc. |
| `produit.html?id=…` | Fiche produit : galerie, choix du format, prix au kilo, ajout au panier, paramètres d'infusion, profil aromatique, préparation à chaud et à froid, produits associés, barre d'achat fixe sur mobile |
| `panier.html` | Panier détaillé (le panier s'ouvre aussi en tiroir sur toutes les pages) |
| `commande.html` | Coordonnées, adresse, mode de livraison, paiement, validation champ par champ |
| `confirmation.html` | Récapitulatif après envoi ou paiement |
| `histoire.html`, `conseils.html`, `faq.html`, `contact.html` | Contenus |
| `livraison-retours.html`, `cgv.html`, `mentions-legales.html`, `confidentialite.html` | Informations légales (modèles à compléter) |
| `404.html` | Page introuvable |

## Ce qui a été repris du site de référence

D'après l'accueil, une page catégorie, une fiche produit et la version mobile d'ascenbio-thes.com :

- **Palette** : blanc, corail `#F87C56`, pêche `#FFE4D1` pour les fonds de section et le pied des cartes, gris anthracite `#252525` pour le bandeau promotionnel et le pied de page. Pour l'accessibilité, les boutons et les textes en couleur utilisent un corail plus soutenu, `#C24E2A` (contraste AA).
- **Typographie** : Poppins légère et espacée partout, avec les menus en capitales et les prix en italique (« à partir de 7,90 € »). Une serif (Cormorant Garamond) est réservée au bandeau principal, comme le visuel de campagne du site de référence.
- **Structure** : bandeau d'annonces pêche, médaillon de logo qui déborde de l'en-tête, barre noire d'annonce, rangée de médaillons de catégories illustrés au trait, grand bandeau photo avec le bouton à cheval sur son bord, grilles de cartes à pied pêche avec bouton contour, trois tuiles illustrées, focus « photo + produits », icônes de réassurance, encadrés de conseils sur fond pêche, bande corail pour la newsletter, médaillon de remerciement, pied de page sombre.
- **Fiche produit** : la même disposition (galerie et vignettes à gauche ; nom avec le séparateur ✿, description, ingrédients en italique, vignettes de format, quantité et prix, gros bouton, accordéons à droite), puis un bandeau pêche avec les paramètres d'infusion, des cartes « profil » et un bloc texte et photo.

**Volontairement différent** : le nom, le logo (une tasse dont la vapeur dessine une feuille, au lieu du profil de femme Art nouveau d'Ascenbio), tous les textes et toutes les images. Aucun visuel ni texte d'Ascenbio n'est réutilisé. Les illustrations au trait sont dessinées pour ce projet. Il n'y a ni avis clients, ni réduction, ni compteur, ni label bio inventés : ces blocs n'apparaîtront que lorsque vous aurez de vraies données.

## Avant la mise en ligne

1. **Marque** : remplacez « Florelle » (nom, e-mail `bonjour@florelle.fr`) dans `assets/js/config.js`, puis cherchez-remplacez le nom dans les fichiers `.html`. Remplacez aussi le logo dans `assets/js/illustrations.js` (`LOGO`), `assets/img/logo.svg` et `assets/img/favicon.svg`.
2. **Catalogue** (`assets/js/catalogue.js`) : vos produits, compositions exactes (arôme naturel ou non, origine de chaque ingrédient), formats, prix et stocks. Les profils aromatiques et les conseils sont des exemples réalistes, mais ils doivent décrire *vos* thés.
3. **Photos** : celles du catalogue sont des photos d'illustration libres de droits (Unsplash), pas vos produits. Déposez vos photos dans `assets/img/` et indiquez leur chemin dans le champ `image` du produit (par exemple `"assets/img/sencha.jpg"`). Les photos des pages (accueil, histoire) se changent directement dans le HTML. Si une photo ne se charge pas, le site affiche à sa place l'illustration au trait de la catégorie.
4. **Promesses commerciales** (`config.js`) : délai de préparation, seuil de livraison offerte, tarifs et modes de livraison, horaires. Sur la confirmation et dans la FAQ, vérifiez aussi la promesse « lien de paiement sous 24 h ouvrées ».
5. **Textes légaux** : tout ce qui est surligné en jaune (`.a-completer`) dans `histoire.html`, `cgv.html`, `mentions-legales.html` et `confidentialite.html` : identité de l'entreprise, SIREN, hébergeur, **médiateur de la consommation** (obligatoire), régime de TVA. Faites relire les CGV par un professionnel.
6. **Allégations** : n'ajoutez pas de bienfaits santé (« favorise la digestion », « aide à dormir »…). Ces allégations sont encadrées par le règlement européen 1924/2006, et les fiches actuelles n'en contiennent volontairement aucune. Ne mentionnez « bio » que si le produit est certifié, avec le code de l'organisme certificateur.
7. **Référencement** : remplacez `https://www.exemple.fr` dans `sitemap.xml` et `robots.txt`.
8. Passez `demo: false`.

## Paiement

Réglage : `paiement.mode` dans `assets/js/config.js`.

- **`"demande"` (par défaut)** : aucun prestataire n'est branché, donc **aucun faux paiement n'est simulé**. Le client envoie une *demande de commande*. Le site lui indique clairement que rien n'est débité et qu'un lien de paiement lui sera envoyé. Vous recevez la demande dans Netlify (Forms › `commande`) et vous envoyez le lien, par exemple un lien de paiement Stripe ou SumUp.
- **`"stripe"`** : paiement par carte via Stripe Checkout.
  1. Créez un compte Stripe et récupérez la clé secrète (`sk_test_…` pour tester).
  2. Sur Netlify : Site configuration › Environment variables, ajoutez `STRIPE_SECRET_KEY`.
  3. Passez `paiement.mode` à `"stripe"`.

  La fonction `netlify/functions/paiement.js` recalcule côté serveur les prix et les frais de port à partir du catalogue : le navigateur n'envoie que des identifiants et des quantités. Au retour de Stripe, `confirmation.html` vérifie que le paiement a bien été reçu. Le bouton final porte alors la mention « Commander avec obligation de paiement », exigée par le Code de la consommation. Pensez à activer les e-mails de reçu dans Stripe.

## Formulaires (commande, contact, newsletter)

Les formulaires utilisent **Netlify Forms** : rien à installer, ils sont détectés automatiquement au déploiement. Activez les notifications par e-mail dans Netlify (Forms › Form notifications) pour être prévenu de chaque commande. Hors Netlify, le site propose l'envoi par e-mail.

## Déploiement (Netlify)

1. Add new site › Import an existing project › choisissez ce dépôt.
2. **Base directory : `boutique-the`** (le fichier `netlify.toml` de ce dossier règle le reste).
3. Deploy.

Le site doit être servi à la racine de son domaine pour que le retour de paiement Stripe pointe vers la bonne adresse.

## Fichiers techniques

- `assets/js/config.js` : réglages (marque, livraison, paiement, contact)
- `assets/js/catalogue.js` : catégories, moments, produits
- `assets/js/app.js` : panier (stockage local du navigateur), en-tête, pied de page, tiroirs, recherche, animations
- `assets/js/pages.js` : comportement de chaque page
- `assets/js/illustrations.js` : illustrations au trait, icônes, logo (SVG)
- `assets/css/style.css` : styles et adaptation mobile
- `assets/fonts/` : Poppins et Cormorant Garamond, hébergées localement (aucun appel à Google Fonts)

## Vérifications effectuées

- Navigateur headless (Chromium), en 1440 px et 390 px : aucune erreur JavaScript et aucun débordement horizontal.
- Parcours complet : choix du format, quantité, ajout au panier, modification dans le tiroir, validation des champs, calcul de la livraison offerte, envoi de la demande, confirmation. Testé aussi avec le paiement Stripe simulé, avec le site ouvert en `file://` et avec des photos indisponibles.
- Fonction de paiement : testée avec une API Stripe simulée (montants, frais de port, produits inconnus, session invalide).
- Accessibilité : analyse axe-core (WCAG 2 A et AA) sans violation sur l'accueil, la boutique, la fiche produit, la commande, le contact et les conseils.
- Non testé : un vrai compte Stripe et un vrai déploiement Netlify (les formulaires n'ont été testés qu'avec un serveur simulé).

## Crédits

Photographies d'illustration : [Unsplash](https://unsplash.com/license). Polices : Poppins et Cormorant Garamond (SIL Open Font License). Illustrations et logo : créés pour ce projet.
