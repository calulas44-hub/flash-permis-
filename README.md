# Flash PERMIS · Gardanne — plateforme de démonstration

> **Votre permis ? En un flash.**
> Aussi moderne qu’une plateforme en ligne. Aussi humaine qu’une auto-école locale.

Maquette interactive complète du futur site de l’auto-école **Flash PERMIS à Gardanne** : un site vitrine, une pré-inscription en ligne et quatre espaces connectés (élève, parents, moniteur, administration) qui partagent les mêmes données en temps réel.

## Lancer la démo

Aucune installation ni compilation : le site est en HTML, CSS et JavaScript.

- **Le plus simple** : ouvrir `index.html` dans un navigateur.
- **Recommandé** (serveur local) : `npx serve .` puis ouvrir l’adresse indiquée.
- **En ligne** : le dossier peut être publié tel quel (GitHub Pages, Netlify, hébergement mutualisé…).

### Déployer sur Netlify

Le fichier `netlify.toml` est déjà configuré (aucune commande de build, dossier publié : la racine).

1. Sur [app.netlify.com](https://app.netlify.com) : **Add new site › Import an existing project › GitHub**.
2. Choisir le dépôt `flash-permis-` et la branche à publier.
3. Laisser les réglages proposés (ils sont lus dans `netlify.toml`) puis **Deploy**.

Chaque nouveau commit sur la branche redéploie automatiquement le site.
Alternative sans GitHub : glisser-déposer le dossier du projet sur [app.netlify.com/drop](https://app.netlify.com/drop).

## Pages

| Page | Rôle |
|---|---|
| `index.html` | Site vitrine : Hero avec la campagne « Votre permis ? En un flash. », livret, espaces, créneaux, code, formations, pourquoi Flash PERMIS, contact |
| `inscription.html` | Pré-inscription en ligne (statut mineur/majeur automatique, coordonnées du parent si mineur) |
| `espace.html` | Accès aux espaces + visite guidée pour le gérant |
| `eleve.html` | Espace élève (Lucas) : tableau de bord, livret, planning et propositions de créneaux, code, dossier, notifications |
| `parent.html` | Espace parents (Sophie, mère de Lucas) : progression, leçons, code, informations partagées |
| `moniteur.html` | Espace moniteur, pensé pour le téléphone : planning, élèves, fin de leçon en 3 étapes, demandes |
| `admin.html` | Back-office complet (accès par code) : élèves, moniteurs, planning, progression, code, pré-inscriptions, documents, parents, paiements, caisse, comptabilité, communications, contenus, réglages |

## Visite guidée (5 minutes)

1. **Élève** → *Planning & créneaux* : renseigner ses disponibilités, choisir un créneau compatible, l’envoyer. Le message « Demande envoyée — en attente de validation de Flash PERMIS. » s’affiche.
2. **Administration** → *Planning* : accepter, refuser ou proposer un autre créneau.
3. **Moniteur** → *Livret à compléter* : valider « Créneaux et stationnement », ajouter une remarque, terminer la leçon (78 % → 83 %).
4. **Élève** et **Parents** : la progression, la remarque et les notifications apparaissent.
5. **Pré-inscription** : le formulaire du site crée une demande visible dans l’administration, transformable en dossier élève.

Astuce : ouvrir deux espaces dans deux onglets côte à côte — les mises à jour sont synchronisées en direct.
Le menu **Démo** (en haut de chaque espace) permet de changer d’espace et de réinitialiser les données.

## Espace administrateur

L’administration est protégée par un **code d’accès**, demandé à l’ouverture de `admin.html`.

- **Code initial : `1312à`** (les accents et la casse sont ignorés : `1312a` fonctionne aussi).
- Il se change depuis **Administration › Réglages**, sans toucher au site.
- ⚠️ **Ce code n’est pas une sécurité informatique.** Sur un site sans serveur, il est lisible dans le code source par une personne avertie : il protège des regards, pas d’une intrusion. Une véritable authentification exige un serveur.

### Modules de gestion

| Module | Contenu |
|---|---|
| **Élèves** | Création, modification, désactivation, suppression · fiche à onglets : dossier, progression, heures, documents, paiements, historique, parents |
| **Moniteurs** | Fiches complètes (photo, téléphone, e-mail, autorisation d’enseigner, véhicule, types de permis), disponibilités, élèves attribués, ajout et suppression avec réattribution automatique |
| **Planning** | Calendrier, demandes de créneaux, acceptation, refus, contre-proposition, **déplacement d’une leçon**, absences |
| **Documents** | Pièces déposées par les élèves et les parents · consultation, téléchargement, validation, refus motivé, demande de pièce complémentaire |
| **Paiements** | Offres, règlements, encaissements (CB, Apple Pay, Google Pay, espèces, virement, chèque), paiements partiels, remboursements |
| **Ticket de caisse** | Reçu numéroté `FP-AAAA-NNNN` généré à chaque encaissement, aperçu, impression et enregistrement en PDF |
| **Comptabilité** | CA HT / TVA / TTC par jour, semaine, mois, trimestre, année ou période libre · répartition par moyen de paiement · exports CSV et récapitulatif imprimable |
| **Communications** | Boîte d’envoi des messages déclenchés automatiquement et **modèles modifiables** (e-mail et SMS) |
| **Réglages** | Code d’accès, taux de TVA, numérotation des tickets, exports et réinitialisation |

## Historique et traçabilité

Chaque dossier élève dispose d’un **historique chronologique** : inscription, documents transmis, validés ou refusés, leçons effectuées, compétences validées ou remises à travailler, créneaux demandés, acceptés, refusés ou déplacés, paiements et remboursements. Il est consultable par l’administration, par l’élève et par ses parents.

## Ce qui est réellement branché, et ce qui est simulé

Le site est **statique** (aucun serveur). Cela détermine ce qui fonctionne réellement :

| Fonctionnalité | État |
|---|---|
| E-mail à chaque pré-inscription | ✅ **Réel**, via Netlify Forms — voir ci-dessous |
| Documents, paiements, tickets, comptabilité, historique | ✅ Pleinement fonctionnels, enregistrés dans le navigateur |
| Synchronisation entre les espaces | ✅ En direct **sur un même navigateur** (onglets) |
| Synchronisation entre appareils différents | ❌ Nécessite un serveur et une base de données |
| SMS automatiques | ❌ Nécessite un service d’envoi (Twilio, Brevo…) — les messages sont préparés dans *Communications* |
| E-mails automatiques (hors pré-inscription) | ❌ Même remarque : les messages sont préparés et consultables |
| Paiement réel par carte / Apple Pay / Google Pay | ❌ Simulé — nécessite un prestataire (Stripe, SumUp…) ; aucune donnée bancaire n’est demandée |

### Activer l’e-mail de pré-inscription (Netlify)

Le formulaire est déjà déclaré pour **Netlify Forms**. Après déploiement :

1. Netlify › votre site › **Forms** — le formulaire `preinscription` apparaît dès la première demande.
2. **Form notifications › Add notification › Email notification**.
3. Saisir l’adresse de l’auto-école : chaque demande arrive par e-mail avec toutes les informations du formulaire.

Offre gratuite : 100 demandes par mois.

## Principes respectés

- **Le gérant garde le contrôle** : aucun créneau n’est réservé sans validation de l’agence.
- **La décision d’examen reste humaine** : la progression et les résultats du code sont présentés comme des outils pédagogiques.
- **Rien n’est inventé** : tarifs, adresse, téléphone, e-mail et horaires restent « à renseigner » tant qu’ils ne sont pas saisis dans *Administration › Contenus du site*. Les formations y sont entièrement modifiables (texte, points clés, tarif optionnel, visibilité).
- **Mobile d’abord** : navigation par onglets en bas d’écran pour l’élève, les parents et le moniteur.

## Structure technique

```
assets/
  css/  base.css (système de design) · site.css (vitrine) · app.css (espaces) · fonts.css
  js/   store.js (données + actions) · gestion.js (accès, historique, documents,
        paiements, tickets, comptabilité, communications) · ui.js (composants) ·
        views.js et espace-client.js (fragments partagés) · site.js · inscription.js ·
        eleve.js · parent.js · moniteur.js · admin.js · admin-gestion.js
  img/  visuel de campagne (optimisé WebP + recadrages), image de partage, favicon
  fonts/ Archivo et Plus Jakarta Sans auto-hébergées (aucun appel à un service tiers)
```

Les données sont **fictives** et stockées uniquement dans le navigateur (`localStorage`). Le planning est régénéré chaque jour pour rester réaliste ; les contenus du site et les pré-inscriptions saisies sont conservés.

## Pour passer en production

1. **Serveur et base de données** — c’est le point central : comptes réels, droits par rôle, données partagées entre appareils, sauvegardes. Tout le reste en dépend.
2. **Authentification** — mots de passe chiffrés et sessions, à la place du code d’accès actuel.
3. **Paiement en ligne** — Stripe ou SumUp pour la carte, Apple Pay et Google Pay.
4. **E-mails et SMS** — un service d’envoi (Brevo, Twilio…) branché sur les modèles déjà rédigés.
5. **Facturation** — vérifier avec un comptable le taux de TVA applicable et les mentions obligatoires des reçus.
6. **Conformité RGPD** — mentions légales, politique de confidentialité, consentement parental, durée de conservation des documents d’identité.
7. **Contenus** — téléphone, e-mail, horaires, tarifs et équipe réelle des moniteurs.
8. **Visuel de campagne** — vérifier les droits d’utilisation avant toute diffusion publique.
