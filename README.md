# Flash PERMIS · Gardanne — plateforme de démonstration

> **Votre permis ? En un flash.**
> Aussi moderne qu’une plateforme en ligne. Aussi humaine qu’une auto-école locale.

Maquette interactive complète du futur site de l’auto-école **Flash PERMIS à Gardanne** : un site vitrine, une pré-inscription en ligne et quatre espaces connectés (élève, parents, moniteur, administration) qui partagent les mêmes données en temps réel.

## Lancer la démo

Aucune installation ni compilation : le site est en HTML, CSS et JavaScript.

- **Le plus simple** : ouvrir `index.html` dans un navigateur.
- **Recommandé** (serveur local) : `npx serve .` puis ouvrir l’adresse indiquée.
- **En ligne** : le dossier peut être publié tel quel (GitHub Pages, Netlify, hébergement mutualisé…).

## Pages

| Page | Rôle |
|---|---|
| `index.html` | Site vitrine : Hero avec la campagne « Votre permis ? En un flash. », livret, espaces, créneaux, code, formations, pourquoi Flash PERMIS, contact |
| `inscription.html` | Pré-inscription en ligne (statut mineur/majeur automatique, coordonnées du parent si mineur) |
| `espace.html` | Accès aux espaces + visite guidée pour le gérant |
| `eleve.html` | Espace élève (Lucas) : tableau de bord, livret, planning et propositions de créneaux, code, dossier, notifications |
| `parent.html` | Espace parents (Sophie, mère de Lucas) : progression, leçons, code, informations partagées |
| `moniteur.html` | Espace moniteur, pensé pour le téléphone : planning, élèves, fin de leçon en 3 étapes, demandes |
| `admin.html` | Back-office : élèves, moniteurs, planning, progression, code, parents, pré-inscriptions, contenus du site |

## Visite guidée (5 minutes)

1. **Élève** → *Planning & créneaux* : renseigner ses disponibilités, choisir un créneau compatible, l’envoyer. Le message « Demande envoyée — en attente de validation de Flash PERMIS. » s’affiche.
2. **Administration** → *Planning* : accepter, refuser ou proposer un autre créneau.
3. **Moniteur** → *Livret à compléter* : valider « Créneaux et stationnement », ajouter une remarque, terminer la leçon (78 % → 83 %).
4. **Élève** et **Parents** : la progression, la remarque et les notifications apparaissent.
5. **Pré-inscription** : le formulaire du site crée une demande visible dans l’administration, transformable en dossier élève.

Astuce : ouvrir deux espaces dans deux onglets côte à côte — les mises à jour sont synchronisées en direct.
Le menu **Démo** (en haut de chaque espace) permet de changer d’espace et de réinitialiser les données.

## Principes respectés

- **Le gérant garde le contrôle** : aucun créneau n’est réservé sans validation de l’agence.
- **La décision d’examen reste humaine** : la progression et les résultats du code sont présentés comme des outils pédagogiques.
- **Rien n’est inventé** : tarifs, adresse, téléphone, e-mail et horaires restent « à renseigner » tant qu’ils ne sont pas saisis dans *Administration › Contenus du site*. Les formations y sont entièrement modifiables (texte, points clés, tarif optionnel, visibilité).
- **Mobile d’abord** : navigation par onglets en bas d’écran pour l’élève, les parents et le moniteur.

## Structure technique

```
assets/
  css/  base.css (système de design) · site.css (vitrine) · app.css (espaces) · fonts.css
  js/   store.js (données de démo + actions) · ui.js (composants) · views.js (fragments partagés)
        site.js · inscription.js · eleve.js · parent.js · moniteur.js · admin.js
  img/  visuel de campagne (optimisé WebP + recadrages), image de partage, favicon
  fonts/ Archivo et Plus Jakarta Sans auto-hébergées (aucun appel à un service tiers)
```

Les données sont **fictives** et stockées uniquement dans le navigateur (`localStorage`). Le planning est régénéré chaque jour pour rester réaliste ; les contenus du site et les pré-inscriptions saisies sont conservés.

## Pour passer en production

- Serveur et base de données (comptes, droits par rôle, historique), authentification sécurisée.
- Envoi réel des notifications (e-mail, SMS, notifications push).
- Conformité RGPD : mentions légales, politique de confidentialité, consentement parental.
- Informations de l’agence, tarifs et équipe réelle des moniteurs à renseigner.
- Vérifier les droits d’utilisation du visuel de campagne avant diffusion publique.
