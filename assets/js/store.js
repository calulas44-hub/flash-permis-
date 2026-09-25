/* ==========================================================================
   Flash PERMIS — Démo : couche de données
   Toutes les données sont fictives et stockées localement (localStorage).
   Elles sont partagées entre les espaces élève, parent, moniteur et admin,
   et synchronisées en direct entre les onglets ouverts.
   ========================================================================== */
(function (global) {
  'use strict';

  const KEY = 'flashpermis.demo.v1';
  const FP = (global.FP = global.FP || {});

  /* ---------- Dates ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const todayISO = () => iso(new Date());
  const dow = (s) => parse(s).getDay(); // 0 = dimanche
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const nowStamp = () => new Date().toISOString();
  const toMin = (t) => { const p = t.split(':'); return +p[0] * 60 + +p[1]; };
  const toHHMM = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const stampFor = (dateISO, time) => { const d = parse(dateISO); const m = toMin(time || '12:00'); d.setHours(Math.floor(m / 60), m % 60); return d.toISOString(); };

  /** Prochain jour de semaine `wd` (0-6) au moins `min` jours après aujourd'hui */
  function nextWeekday(from, wd, min) {
    let s = addDays(from, min || 1);
    while (dow(s) !== wd) s = addDays(s, 1);
    return s;
  }

  FP.date = { iso, parse, addDays, todayISO, dow, diffDays, toMin, toHHMM, nextWeekday, stampFor };

  /* ---------- Générateur pseudo-aléatoire déterministe ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let uid = 0;
  const id = (p) => p + '-' + Date.now().toString(36) + '-' + (uid++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  /* ---------- Référentiels ---------- */
  const BLOCKS = [
    { id: 'c1', n: 1, title: 'Maîtriser le véhicule', sub: 'Maniement du véhicule, trafic faible ou nul' },
    { id: 'c2', n: 2, title: 'Appréhender la route', sub: 'Circuler dans des conditions normales' },
    { id: 'c3', n: 3, title: 'Conditions difficiles', sub: 'Circuler et partager la route' },
    { id: 'c4', n: 4, title: 'Conduite autonome', sub: 'Une conduite sûre et économique' }
  ];

  const SKILLS = [
    { id: 'k1', b: 'c1', label: 'Installation au poste de conduite' },
    { id: 'k2', b: 'c1', label: 'Démarrage / arrêt' },
    { id: 'k3', b: 'c1', label: 'Utilisation de la boîte de vitesses' },
    { id: 'k4', b: 'c1', label: 'Dosage accélération / freinage' },
    { id: 'k5', b: 'c1', label: 'Direction et trajectoire' },
    { id: 'k6', b: 'c2', label: 'Lecture de la signalisation' },
    { id: 'k7', b: 'c2', label: 'Changements de direction' },
    { id: 'k8', b: 'c2', label: 'Intersections et priorités' },
    { id: 'k9', b: 'c2', label: 'Rond-point' },
    { id: 'k10', b: 'c2', label: 'Créneaux et stationnement' },
    { id: 'k11', b: 'c3', label: 'Insertion dans la circulation' },
    { id: 'k12', b: 'c3', label: 'Changement de voie' },
    { id: 'k13', b: 'c3', label: 'Croisement et dépassement' },
    { id: 'k14', b: 'c3', label: 'Conduite sur voie rapide' },
    { id: 'k15', b: 'c3', label: 'Distances de sécurité' },
    { id: 'k16', b: 'c4', label: 'Conduite de nuit et météo dégradée' },
    { id: 'k17', b: 'c4', label: 'Écoconduite' },
    { id: 'k18', b: 'c4', label: 'Itinéraire en autonomie' }
  ];

  const CODE_THEMES = [
    'Circulation routière', 'Le conducteur', 'La route', 'Les autres usagers',
    'Réglementation générale', 'Premiers secours', 'Prendre et quitter le véhicule',
    'Mécanique et équipements', 'Sécurité et environnement'
  ];

  const STEPS = [
    { id: 'inscription', label: 'Inscription' },
    { id: 'dossier', label: 'Dossier validé' },
    { id: 'code', label: 'Code de la route' },
    { id: 'conduite', label: 'Leçons de conduite' },
    { id: 'evaluation', label: 'Évaluation avant examen' },
    { id: 'examen', label: 'Examen pratique' }
  ];

  const PERIODS = [
    { id: 'matin', label: 'Matin', from: 8, to: 12 },
    { id: 'midi', label: 'Midi', from: 12, to: 14 },
    { id: 'aprem', label: 'Après-midi', from: 14, to: 17 },
    { id: 'soir', label: 'Fin de journée', from: 17, to: 20 }
  ];
  const DAYS = [
    { n: 1, short: 'Lun', label: 'Lundi' }, { n: 2, short: 'Mar', label: 'Mardi' },
    { n: 3, short: 'Mer', label: 'Mercredi' }, { n: 4, short: 'Jeu', label: 'Jeudi' },
    { n: 5, short: 'Ven', label: 'Vendredi' }, { n: 6, short: 'Sam', label: 'Samedi' }
  ];

  FP.ref = { BLOCKS, SKILLS, CODE_THEMES, STEPS, PERIODS, DAYS };

  /* ---------- Contenus du site (modifiables depuis l'administration) ---------- */
  function defaultContent() {
    return {
      school: {
        name: 'Flash PERMIS',
        city: 'Gardanne',
        cp: '13120',
        tagline: 'Votre permis ? En un flash.',
        address: '13 boulevard Carnot',
        phone: '',
        email: '',
        hours: '',
        // Informations légales officielles (source : INSEE / INPI — SIREN 994 121 408)
        legal: {
          name: 'FLASH PERMIS',
          form: 'SARL',
          capital: '500 €',
          siren: '994 121 408',
          siret: '994 121 408 00011',
          tva: 'FR05 994 121 408',
          ape: '85.53Z — Enseignement de la conduite',
          rcs: 'Aix-en-Provence'
        }
      },
      formations: [
        {
          id: 'b', icon: 'car', title: 'Permis B', badge: 'Boîte manuelle',
          desc: 'La formation de référence pour conduire une voiture. Code, leçons de conduite et accompagnement jusqu’à l’examen, avec votre livret de progression digital.',
          points: ['20 heures de conduite minimum (réglementaire)', 'Livret de progression mis à jour après chaque leçon', 'Suivi du code et des révisions', 'Évaluation avant examen'],
          price: '', visible: true
        },
        {
          id: 'aac', icon: 'users', title: 'Conduite accompagnée', badge: 'Dès 15 ans',
          desc: 'Apprenez tôt et gagnez en expérience avec un accompagnateur. L’espace parents permet à la famille de suivre chaque étape.',
          points: ['Formation initiale à l’auto-école', 'Rendez-vous pédagogiques avec l’accompagnateur', 'Espace parents inclus dans la plateforme', 'Expérience de conduite avant l’examen'],
          price: '', visible: true
        },
        {
          id: 'supervisee', icon: 'route', title: 'Conduite supervisée', badge: 'Dès 18 ans',
          desc: 'Après la formation initiale, poursuivez votre apprentissage avec un accompagnateur pour arriver serein le jour de l’examen.',
          points: ['Formation initiale avec votre moniteur', 'Conduite avec un accompagnateur', 'Suivi de progression partagé', 'Préparation à l’examen'],
          price: '', visible: true
        },
        {
          id: 'auto', icon: 'gauge', title: 'Permis boîte automatique', badge: 'Prise en main simplifiée',
          desc: 'Concentrez-vous sur la route et l’anticipation grâce à une prise en main plus simple du véhicule.',
          points: ['13 heures de conduite minimum (réglementaire)', 'Livret de progression digital', 'Planning et propositions de créneaux en ligne', 'Évolution possible vers la boîte manuelle'],
          price: '', visible: true
        },
        {
          id: 'passerelle', icon: 'swap', title: 'Formation passerelle', badge: 'Boîte auto → manuelle',
          desc: 'Formation de 7 heures permettant aux titulaires du permis B boîte automatique de conduire un véhicule à boîte manuelle, dans les conditions prévues par la réglementation.',
          points: ['7 heures de formation', 'Sans nouvel examen', 'Suivi des compétences dans votre espace', 'Planning adapté à vos disponibilités'],
          price: '', visible: true
        },
        {
          id: 'code', icon: 'book', title: 'Code de la route', badge: 'Examen théorique',
          desc: 'Préparez l’examen théorique général avec un suivi clair de vos résultats, de votre moyenne et de votre régularité.',
          points: ['Suivi des séries et de la moyenne', 'Progression par thème', 'Objectif : des résultats réguliers', 'Conseils de l’équipe Flash PERMIS'],
          price: '', visible: true
        }
      ]
    };
  }

  /* ---------- Jeu de données de démonstration ---------- */
  function seed() {
    const T = todayISO();
    const R = rng(1313);
    const pick = (a) => a[Math.floor(R() * a.length)];
    // Jour ouvré de référence (si dimanche : samedi)
    const W = dow(T) === 0 ? addDays(T, -1) : T;

    const instructors = [
      { id: 'julien', first: 'Julien', last: 'R.', color: 'blue', role: 'Moniteur · Permis B, AAC', active: true, phone: '06 •• •• •• 11', email: 'julien@flashpermis-gardanne.fr', licence: 'A •• •• •• 001', vehicle: 'Clio V — AA-000-AA', types: ['Permis B', 'Conduite accompagnée'], hours: { 1: [[8, 12], [13, 19]], 2: [[8, 12], [13, 19]], 3: [[8, 12], [13, 19]], 4: [[8, 12], [13, 19]], 5: [[8, 12], [13, 19]], 6: [[8, 12]] } },
      { id: 'sarah', first: 'Sarah', last: 'M.', color: 'violet', role: 'Monitrice · Permis B, boîte auto', active: true, phone: '06 •• •• •• 22', email: 'sarah@flashpermis-gardanne.fr', licence: 'A •• •• •• 002', vehicle: 'Corsa auto — BB-000-BB', types: ['Permis B', 'Boîte automatique'], hours: { 2: [[8, 12], [13, 19]], 3: [[8, 12], [13, 19]], 4: [[8, 12], [13, 19]], 5: [[8, 12], [13, 19]], 6: [[8, 13]] } },
      { id: 'karim', first: 'Karim', last: 'B.', color: 'teal', role: 'Moniteur · Permis B, passerelle', active: true, phone: '06 •• •• •• 33', email: 'karim@flashpermis-gardanne.fr', licence: 'A •• •• •• 003', vehicle: '208 — CC-000-CC', types: ['Permis B', 'Passerelle'], hours: { 1: [[8, 12], [13, 19]], 2: [[8, 12], [13, 19]], 3: [[8, 12], [13, 19]], 4: [[8, 12], [13, 19]], 5: [[8, 12], [13, 18]] } }
    ];

    const yearsAgo = (y, m, d) => { const n = parse(T); return (n.getFullYear() - y) + '-' + pad(m) + '-' + pad(d); };

    const students = [
      { id: 'lucas', first: 'Lucas', last: 'Martin', birth: yearsAgo(17, 3, 12), formation: 'b', instructor: 'julien', contract: 30, base: 0, step: 'conduite', phone: '06 12 •• •• 48', email: 'lucas.martin@exemple.fr', joined: addDays(T, -75), neph: '•••• •••• 0412', avail: { 1: ['soir'], 2: ['soir'], 3: ['aprem', 'soir'], 4: ['soir'], 6: ['matin'] } },
      { id: 'ines', first: 'Inès', last: 'Benali', birth: yearsAgo(18, 7, 2), formation: 'b', instructor: 'sarah', contract: 25, base: 6, step: 'conduite', target: 45 },
      { id: 'yanis', first: 'Yanis', last: 'Kaddour', birth: yearsAgo(16, 1, 23), formation: 'aac', instructor: 'julien', contract: 20, base: 8, step: 'conduite', target: 62 },
      { id: 'chloe', first: 'Chloé', last: 'Roussel', birth: yearsAgo(19, 11, 5), formation: 'auto', instructor: 'sarah', contract: 20, base: 11, step: 'evaluation', target: 86 },
      { id: 'mathis', first: 'Mathis', last: 'Durand', birth: yearsAgo(17, 5, 17), formation: 'b', instructor: 'karim', contract: 30, base: 1, step: 'conduite', target: 28 },
      { id: 'emma', first: 'Emma', last: 'Laurent', birth: yearsAgo(23, 9, 30), formation: 'passerelle', instructor: 'karim', contract: 7, base: 1, step: 'conduite', target: 50 },
      { id: 'nolan', first: 'Nolan', last: 'Petit', birth: yearsAgo(18, 2, 14), formation: 'supervisee', instructor: 'julien', contract: 30, base: 20, step: 'evaluation', target: 90 },
      { id: 'lea', first: 'Léa', last: 'Garcia', birth: yearsAgo(15, 4, 8), formation: 'aac', instructor: 'karim', contract: 20, base: 0, step: 'code', target: 0 }
    ];
    const extra = [
      ['Adam', 'Moreau'], ['Jade', 'Fontaine'], ['Rayan', 'Mercier'], ['Manon', 'Girard'], ['Hugo', 'Blanc'], ['Sofia', 'Chevalier'],
      ['Enzo', 'Faure'], ['Lina', 'Rousseau'], ['Théo', 'Lambert'], ['Camille', 'Bonnet'], ['Nathan', 'Robin'], ['Zoé', 'Marchand']
    ];
    const forms = ['b', 'b', 'aac', 'auto', 'b', 'supervisee'];
    const instrIds = ['julien', 'sarah', 'karim'];
    extra.forEach((n, i) => {
      const f = forms[i % forms.length];
      const age = f === 'aac' ? 16 : 17 + Math.floor(R() * 8);
      const target = Math.round(10 + R() * 80);
      students.push({
        id: 's' + (i + 1), first: n[0], last: n[1], birth: yearsAgo(age, 1 + Math.floor(R() * 12), 1 + Math.floor(R() * 27)),
        formation: f, instructor: instrIds[i % 3], contract: f === 'auto' ? 20 : f === 'aac' ? 20 : 30,
        base: Math.round(target / 100 * 18), step: target > 82 ? 'evaluation' : 'conduite', target
      });
    });
    students.forEach((s, i) => {
      s.phone = s.phone || '06 ' + pad(10 + i * 3) + ' •• •• ' + pad(20 + i * 4);
      s.email = s.email || (s.first + '.' + s.last).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@exemple.fr';
      s.joined = s.joined || addDays(T, -Math.round(30 + R() * 120));
      s.neph = s.neph || '•••• •••• ' + pad(10 + i) + pad(i * 7 % 100);
      s.avail = s.avail || { 2: ['soir'], 3: ['aprem'], 6: ['matin'] };
      s.active = s.active !== false;
      s.docs = [
        { name: 'Pièce d’identité', status: 'valide' },
        { name: 'Justificatif de domicile', status: s.id === 'yanis' ? 'refuse' : 'valide', reason: s.id === 'yanis' ? 'Justificatif de domicile trop ancien. Merci d’en déposer un nouveau (moins de 3 mois).' : '' },
        { name: 'Photo et signature numériques', status: 'valide' },
        { name: 'ASSR 2', status: s.id === 'ines' || s.id === 's5' ? 'attente' : 'valide' },
        { name: 'Attestation de recensement / JDC', status: s.id === 'mathis' ? 'manquant' : 'valide' },
        { name: 'Contrat de formation', status: 'signe' }
      ].map((d, di) => Object.assign({ id: s.id + '-d' + di, required: true, uploadedAt: d.status === 'manquant' ? null : stampFor(s.joined, '10:0' + (di % 6)) }, d));
    });

    /* Compétences */
    const skills = {};
    const lucasAcq = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9', 'k11', 'k12', 'k13', 'k14', 'k15'];
    students.forEach((s) => {
      const m = {};
      if (s.id === 'lucas') {
        SKILLS.forEach((k) => { m[k.id] = { s: 'non_aborde' }; });
        lucasAcq.forEach((k) => { m[k] = { s: 'acquis' }; });
        m.k10 = { s: 'retravailler' };
        m.k16 = { s: 'en_cours' };
      } else {
        const n = Math.round((s.target / 100) * SKILLS.length);
        SKILLS.forEach((k, i) => {
          let st = 'non_aborde';
          if (i < n) st = 'acquis';
          else if (i === n && s.target > 0) st = 'en_cours';
          else if (i === n + 1 && s.target > 20) st = 'retravailler';
          m[k.id] = { s: st };
        });
        if (n > 9 && R() > 0.4) { m.k10 = { s: 'retravailler' }; }
      }
      skills[s.id] = m;
    });

    /* Leçons de Lucas (historique réaliste) */
    const lessons = [];
    const L = (o) => { const l = Object.assign({ id: id('l'), meeting: 'Agence Flash PERMIS', worked: [], rework: [], difficulties: [], comment: '', shareParent: true }, o); lessons.push(l); return l; };
    const lucasPast = [
      [-60, '17:00', 120, 'Évaluation de départ et installation au poste', ['k1', 'k2'], [], 'Première prise en main réussie. Bonne écoute des consignes, installation au poste bien comprise.'],
      [-55, '17:00', 60, 'Démarrage, arrêt et passage des vitesses', ['k2', 'k3'], [], 'Démarrages plus fluides en fin de leçon. Continuer à travailler le point de patinage.'],
      [-50, '14:00', 120, 'Dosage accélération et freinage', ['k3', 'k4'], [], 'Bon dosage du freinage. Les passages de rapports deviennent naturels.'],
      [-46, '17:00', 60, 'Direction et trajectoire', ['k5'], [], 'Trajectoires propres, regard bien placé loin devant.'],
      [-42, '10:00', 120, 'Signalisation et intersections', ['k6', 'k8'], [], 'Bonne lecture de la signalisation. Priorités à droite à consolider en agglomération.'],
      [-38, '17:00', 60, 'Changements de direction', ['k7'], [], 'Placement correct. Penser à anticiper le clignotant et les contrôles.'],
      [-34, '14:00', 120, 'Priorités en agglomération', ['k8'], [], 'Priorités mieux anticipées. Leçon sérieuse et appliquée.'],
      [-30, '17:00', 60, 'Ronds-points', ['k9'], [], 'Ronds-points bien négociés, choix de voie pertinent.'],
      [-26, '10:00', 120, 'Insertion et changement de voie', ['k11', 'k12'], [], 'Insertions dynamiques et sécurisées. Très bonne leçon.'],
      [-21, '17:00', 60, 'Premières manœuvres : créneau', ['k10'], ['k10'], 'Créneau encore hésitant, c’est normal à ce stade. On y reviendra.'],
      [-17, '14:00', 120, 'Croisement, dépassement et distances', ['k13', 'k15'], [], 'Bonnes distances de sécurité. Dépassements bien préparés.'],
      [-12, '10:00', 120, 'Conduite sur voie rapide', ['k14'], [], 'Bonne adaptation à la vitesse sur voie rapide. Insertion maîtrisée.'],
      [-7, '17:00', 60, 'Manœuvres : bataille et épi', ['k10'], ['k10'], 'Progrès sur la bataille. Le créneau reste à retravailler avec plus de repères.'],
      [-3, '17:00', 120, 'Circulation en agglomération', ['k7', 'k8', 'k9'], [], 'Bonne progression. Continuez à travailler les contrôles avant changement de direction.']
    ];
    lucasPast.forEach((p) => {
      const d = addDays(T, p[0]);
      L({ student: 'lucas', instructor: 'julien', date: d, start: p[1], duration: p[2], status: 'terminee', theme: p[3], worked: p[4], rework: p[5], comment: p[6], difficulties: p[5].length ? ['Manœuvres'] : [] });
      p[4].forEach((k) => { if (skills.lucas[k].s === 'acquis' && !p[5].includes(k)) skills.lucas[k].d = d; });
    });
    skills.lucas.k7.d = addDays(T, -38);
    skills.lucas.k9.d = addDays(T, -30);
    skills.lucas.k16 = { s: 'en_cours', d: addDays(T, -12) };
    skills.lucas.k10 = { s: 'retravailler', d: addDays(T, -7), note: 'Travailler les repères visuels pour le créneau.' };

    // Leçon du jour à compléter par le moniteur
    L({ student: 'lucas', instructor: 'julien', date: W, start: '08:00', duration: 60, status: 'a_completer', theme: 'Contrôles et changements de direction' });

    const tue = nextWeekday(T, 2, 1);
    const lTue = L({ student: 'lucas', instructor: 'julien', date: tue, start: '16:00', duration: 60, status: 'confirmee', theme: 'Stationnement et manœuvres' });
    const sat = nextWeekday(tue, 6, 1);
    L({ student: 'lucas', instructor: 'julien', date: sat, start: '10:00', duration: 120, status: 'confirmee', theme: 'Circulation hors agglomération' });

    /* Demandes de créneaux */
    const requests = [];
    const Q = (o) => { const r = Object.assign({ id: id('r'), status: 'en_attente', duration: 60, message: '', history: [] }, o); requests.push(r); return r; };
    Q({ student: 'lucas', instructor: 'julien', date: tue, start: '16:00', status: 'acceptee', createdAt: stampFor(addDays(T, -4), '19:12'), lessonId: lTue.id, history: [{ at: stampFor(addDays(T, -4), '19:12'), by: 'Lucas', action: 'Demande envoyée' }, { at: stampFor(addDays(T, -3), '09:05'), by: 'Secrétariat Flash PERMIS', action: 'Créneau accepté' }] });
    let fri = nextWeekday(T, 5, 2);
    if (fri === sat || fri === tue) fri = nextWeekday(fri, 5, 1);
    Q({ student: 'lucas', instructor: 'julien', date: fri, start: '17:00', createdAt: stampFor(addDays(T, -1), '20:41'), message: 'Je finis les cours à 16h30 ce jour-là.', history: [{ at: stampFor(addDays(T, -1), '20:41'), by: 'Lucas', action: 'Demande envoyée' }] });
    Q({ student: 'ines', instructor: 'sarah', date: nextWeekday(T, 3, 2), start: '14:00', createdAt: stampFor(T, '07:58'), history: [{ at: stampFor(T, '07:58'), by: 'Inès', action: 'Demande envoyée' }] });
    Q({ student: 'mathis', instructor: 'karim', date: nextWeekday(T, 4, 2), start: '17:00', createdAt: stampFor(addDays(T, -1), '18:20'), message: 'Disponible aussi le samedi matin si besoin.', history: [{ at: stampFor(addDays(T, -1), '18:20'), by: 'Mathis', action: 'Demande envoyée' }] });
    Q({ student: 'nolan', instructor: 'julien', date: nextWeekday(T, 1, 2), start: '11:00', duration: 120, createdAt: stampFor(addDays(T, -2), '12:03'), history: [{ at: stampFor(addDays(T, -2), '12:03'), by: 'Nolan', action: 'Demande envoyée' }] });

    /* Planning des autres élèves (généré) */
    const busy = (instr, date, start, dur) => {
      const a = toMin(start), b = a + dur;
      return lessons.some((l) => l.instructor === instr && l.date === date && l.status !== 'annulee' && toMin(l.start) < b && a < toMin(l.start) + l.duration) ||
        requests.some((r) => r.instructor === instr && r.date === date && r.status === 'en_attente' && toMin(r.start) < b && a < toMin(r.start) + r.duration);
    };
    const templates = {
      julien: [[9, 2], [11, 1], [14, 1], [15, 1], [17, 1], [18, 1]],
      sarah: [[8, 1], [9, 2], [13, 2], [15, 1], [16, 2]],
      karim: [[8, 2], [10, 1], [14, 2], [16, 1], [17, 1]]
    };
    const themes = ['Circulation en agglomération', 'Ronds-points et intersections', 'Manœuvres et stationnement', 'Insertion et voie rapide', 'Conduite hors agglomération', 'Évaluation des acquis', 'Conduite de nuit', 'Écoconduite et anticipation', 'Priorités et signalisation', 'Changements de direction'];
    const comments = ['Bonne leçon, conduite de plus en plus fluide.', 'Attention aux contrôles dans les rétroviseurs avant chaque manœuvre.', 'Très bonne anticipation aujourd’hui. On continue ainsi.', 'Progrès nets sur les intersections. Garder une allure adaptée.', 'Leçon sérieuse. Les manœuvres demandent encore un peu de pratique.', 'Bonne gestion du stress, prise d’initiative en progrès.'];
    const byInstr = {};
    students.forEach((s) => { if (s.id !== 'lucas' && s.step !== 'code') (byInstr[s.instructor] = byInstr[s.instructor] || []).push(s.id); });
    const weekly = {};
    for (let o = -14; o <= 14; o++) {
      const d = addDays(T, o);
      const wd = dow(d);
      instructors.forEach((ins) => {
        if (!ins.hours[wd]) return;
        const pool = byInstr[ins.id];
        templates[ins.id].forEach((slot, si) => {
          if (R() > (o === 0 ? 0.92 : 0.7)) return;
          const start = pad(slot[0]) + ':00', dur = slot[1] * 60;
          if (!ins.hours[wd].some((h) => slot[0] >= h[0] && slot[0] + slot[1] <= h[1])) return;
          if (busy(ins.id, d, start, dur)) return;
          const wk = Math.floor((o + 14) / 7);
          let sid = null;
          for (let t = 0; t < pool.length; t++) {
            const cand = pool[(o * 3 + si + t + 14 * 3) % pool.length];
            const key = cand + ':' + wk;
            if ((weekly[key] || 0) < 2 && !lessons.some((l) => l.student === cand && l.date === d)) { sid = cand; weekly[key] = (weekly[key] || 0) + 1; break; }
          }
          if (!sid) return;
          const past = o < 0;
          L({ student: sid, instructor: ins.id, date: d, start, duration: dur, status: past ? 'terminee' : 'confirmee', theme: pick(themes), comment: past ? pick(comments) : '' });
        });
      });
    }
    lessons.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

    /* Absences */
    const absences = [
      { id: id('a'), who: 'karim', type: 'moniteur', date: nextWeekday(T, 3, 6), label: 'Formation continue', allDay: true },
      { id: id('a'), who: 'ines', type: 'eleve', date: addDays(T, -5), label: 'Absence justifiée (examen scolaire)', allDay: false }
    ];

    /* Résultats du code */
    const code = {};
    const lucasScores = [21, 23, 25, 24, 27, 28, 26, 29, 30, 28, 31, 34, 36, 37, 36];
    const lucasDays = [-44, -41, -38, -35, -32, -29, -26, -23, -20, -17, -12, -9, -6, -4, -1];
    code.lucas = {
      series: lucasScores.map((s, i) => ({ date: addDays(T, lucasDays[i]), score: s })),
      themes: [88, 84, 90, 76, 71, 86, 82, 73, 79],
      activity: [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1]
    };
    students.forEach((s) => {
      if (s.id === 'lucas') return;
      const n = s.step === 'code' ? 9 : 5 + Math.floor(R() * 12);
      const end = s.step === 'code' ? 31 : Math.min(39, 28 + Math.round(R() * 10));
      const series = [];
      for (let i = 0; i < n; i++) {
        const base = 20 + ((end - 20) * (i + 1)) / n;
        series.push({ date: addDays(T, -2 * (n - i) - Math.floor(R() * 2)), score: Math.max(15, Math.min(40, Math.round(base + (R() - 0.5) * 4))) });
      }
      code[s.id] = { series, themes: CODE_THEMES.map(() => Math.round(55 + R() * 40)), activity: Array.from({ length: 14 }, () => (R() > 0.45 ? 1 : 0)) };
    });

    /* Parents */
    const parents = [
      { id: 'sophie', first: 'Sophie', last: 'Martin', relation: 'Mère', student: 'lucas', email: 'sophie.martin@exemple.fr', phone: '06 45 •• •• 19', access: true, visible: { progression: true, remarques: true, planning: true, code: true, documents: false }, notif: { lecons: true, remarques: true, competences: true, code: true } },
      { id: 'p2', first: 'Samir', last: 'Kaddour', relation: 'Père', student: 'yanis', email: 'samir.kaddour@exemple.fr', phone: '06 71 •• •• 02', access: true, visible: { progression: true, remarques: true, planning: true, code: true, documents: true }, notif: { lecons: true, remarques: true, competences: true, code: false } },
      { id: 'p3', first: 'Claire', last: 'Durand', relation: 'Mère', student: 'mathis', email: 'claire.durand@exemple.fr', phone: '06 33 •• •• 57', access: true, visible: { progression: true, remarques: false, planning: true, code: true, documents: false }, notif: { lecons: true, remarques: false, competences: true, code: true } },
      { id: 'p4', first: 'Miguel', last: 'Garcia', relation: 'Père', student: 'lea', email: 'miguel.garcia@exemple.fr', phone: '07 58 •• •• 90', access: true, visible: { progression: true, remarques: true, planning: true, code: true, documents: true }, notif: { lecons: true, remarques: true, competences: true, code: true } },
      { id: 'p5', first: 'Nadia', last: 'Benali', relation: 'Mère', student: 'ines', email: 'nadia.benali@exemple.fr', phone: '06 20 •• •• 64', access: false, visible: { progression: true, remarques: false, planning: true, code: false, documents: false }, notif: { lecons: true, remarques: false, competences: false, code: false } }
    ];

    /* Pré-inscriptions */
    const inscriptions = [
      { id: id('i'), first: 'Maëlys', last: 'Roche', phone: '06 •• •• •• 31', email: 'maelys.roche@exemple.fr', birth: yearsAgo(16, 6, 9), formation: 'aac', minor: true, parent: { name: 'Julie Roche', phone: '06 •• •• •• 77', email: 'julie.roche@exemple.fr' }, dispo: ['Mercredi après-midi', 'Samedi matin'], message: '', status: 'nouvelle', createdAt: stampFor(T, '08:14') },
      { id: id('i'), first: 'Karim', last: 'Haddad', phone: '07 •• •• •• 05', email: 'k.haddad@exemple.fr', birth: yearsAgo(24, 2, 1), formation: 'auto', minor: false, parent: null, dispo: ['Fin de journée en semaine'], message: 'Je travaille à Gardanne, disponible après 17h30.', status: 'contactee', createdAt: stampFor(addDays(T, -2), '18:40') }
    ];

    /* Notifications */
    const notifs = [];
    const N = (to, text, type, dayOff, time, link, read) => notifs.push({ id: id('n'), to, text, type, at: stampFor(addDays(T, dayOff), time), link: link || '', read: !!read });
    N('eleve:lucas', 'Nouveau résultat de code disponible : 36/40.', 'code', -1, '18:32', '#code');
    N('eleve:lucas', 'Votre moniteur a ajouté une remarque à votre dernière leçon.', 'comment', -3, '19:20', '#progression');
    N('eleve:lucas', 'Nouvelle leçon terminée : Circulation en agglomération.', 'lesson', -3, '19:19', '#progression', true);
    N('eleve:lucas', 'Votre demande de conduite a été acceptée.', 'slot', -3, '09:05', '#planning', true);
    N('eleve:lucas', 'Nouvelle compétence validée : Conduite sur voie rapide.', 'skill', -12, '12:10', '#progression', true);
    N('parent:lucas', 'Nouvelle leçon terminée pour Lucas : Circulation en agglomération.', 'lesson', -3, '19:19', '#lecons');
    N('parent:lucas', 'Le moniteur a ajouté une remarque à la dernière leçon de Lucas.', 'comment', -3, '19:20', '#lecons');
    N('parent:lucas', 'Nouveau résultat de code : 36/40.', 'code', -1, '18:32', '#code');
    N('parent:lucas', 'Leçon confirmée pour Lucas : ' + tue.split('-').reverse().slice(0, 2).join('/') + ' à 16h00.', 'slot', -3, '09:05', '#lecons', true);
    N('moniteur:julien', 'Nouvelle demande de créneau pour Lucas.', 'slot', -1, '20:41', '#demandes');
    N('moniteur:julien', 'Livret à compléter : leçon de Lucas de 08h00.', 'lesson', dow(T) === 0 ? -1 : 0, '09:01', '#planning');
    N('moniteur:julien', 'Nouvelle demande de créneau pour Nolan.', 'slot', -2, '12:03', '#demandes', true);
    N('admin', 'Nouvelle pré-inscription : Maëlys Roche (conduite accompagnée).', 'inscription', 0, '08:14', '#inscriptions');
    N('admin', 'Nouvelle demande de créneau pour Inès.', 'slot', 0, '07:58', '#planning');
    N('admin', 'Nouvelle demande de créneau pour Lucas.', 'slot', -1, '20:41', '#planning');
    N('admin', 'Nouvelle demande de créneau pour Mathis.', 'slot', -1, '18:20', '#planning');
    N('admin', 'Nouvelle leçon terminée : Lucas Martin — Circulation en agglomération.', 'lesson', -3, '19:19', '#progression', true);
    N('admin', 'Nouvelle demande de créneau pour Nolan.', 'slot', -2, '12:03', '#planning', true);
    notifs.sort((a, b) => b.at.localeCompare(a.at));

    return { v: 1, seededOn: T, instructors, students, skills, lessons, requests, absences, code, parents, inscriptions, notifs, log: [] };
  }

  /* ---------- Persistance ---------- */
  let db = null;
  const listeners = [];

  function readRaw() {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  // Complète le contenu stocké avec les valeurs officielles par défaut
  // sans écraser une information déjà saisie dans l'administration.
  function mergeContent(stored) {
    if (!stored) return defaultContent();
    const def = defaultContent();
    stored.school = stored.school || {};
    Object.keys(def.school).forEach((k) => {
      if (k === 'legal') { stored.school.legal = Object.assign({}, def.school.legal, stored.school.legal || {}); return; }
      if (stored.school[k] == null || stored.school[k] === '') stored.school[k] = def.school[k];
    });
    if (!stored.formations) stored.formations = def.formations;
    return stored;
  }
  function load() {
    const raw = readRaw();
    if (raw && raw.v === 1 && raw.data && raw.data.seededOn === todayISO()) {
      db = raw.data; db.content = mergeContent(raw.content);
      return;
    }
    // Nouvelle journée (ou première visite) : on régénère un planning frais,
    // en conservant les contenus du site et les données de gestion saisies.
    const fresh = seed();
    if (raw && raw.data) carryOver(raw.data, fresh);
    db = fresh; db.content = mergeContent(raw && raw.content);
    save(true);
  }

  // Collections de gestion conservées d'un jour à l'autre (le planning, lui, est régénéré)
  const CARRY = ['auth', 'payments', 'events', 'outbox', 'templates', 'counters', 'settings'];

  function carryOver(old, fresh) {
    CARRY.forEach((k) => { if (old[k] != null) fresh[k] = old[k]; });
    if (Array.isArray(old.inscriptions)) {
      fresh.inscriptions = old.inscriptions.filter((i) => i.userCreated).concat(fresh.inscriptions);
    }
    // Élèves : on garde documents, offre, état et fiches créées depuis l'administration
    (old.students || []).forEach((os) => {
      const ns = fresh.students.find((s) => s.id === os.id);
      if (ns) {
        if (os.docs) ns.docs = os.docs;
        if (os.offer) ns.offer = os.offer;
        if (os.active === false) ns.active = false;
        ['phone', 'email', 'neph', 'note'].forEach((k) => { if (os[k]) ns[k] = os[k]; });
      } else if (os.userCreated) {
        fresh.students.push(os);
        if (old.skills && old.skills[os.id]) fresh.skills[os.id] = old.skills[os.id];
        if (old.code && old.code[os.id]) fresh.code[os.id] = old.code[os.id];
      }
    });
    // Moniteurs : fiches complétées ou ajoutées
    (old.instructors || []).forEach((oi) => {
      const ni = fresh.instructors.find((i) => i.id === oi.id);
      if (ni) ['phone', 'email', 'licence', 'vehicle', 'photo', 'note', 'active', 'role'].forEach((k) => { if (oi[k] != null) ni[k] = oi[k]; });
      else if (oi.userCreated) fresh.instructors.push(oi);
    });
    // Parents créés depuis l'administration
    (old.parents || []).forEach((op) => {
      const np = fresh.parents.find((p) => p.id === op.id);
      if (np) { np.access = op.access; np.visible = op.visible; np.notif = op.notif; }
      else if (fresh.students.some((s) => s.id === op.student)) fresh.parents.push(op);
    });
  }
  function save(silent) {
    const content = db.content; const data = Object.assign({}, db); delete data.content;
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, data, content })); } catch (e) { /* ignore */ }
    if (!silent) listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  }
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    db = null; load(); listeners.forEach((fn) => fn());
  }
  global.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    const raw = readRaw();
    if (raw && raw.data) { db = raw.data; db.content = mergeContent(raw.content); listeners.forEach((fn) => fn()); }
  });

  load();

  FP.store = {
    get db() { return db; },
    save: () => save(false),
    reset,
    on: (fn) => listeners.push(fn),
    defaultContent
  };

  /* ---------- Requêtes ---------- */
  const S = () => db;
  const q = {};
  q.student = (sid) => S().students.find((s) => s.id === sid);
  q.instructor = (iid) => S().instructors.find((i) => i.id === iid);
  q.formation = (fid) => S().content.formations.find((f) => f.id === fid) || { title: fid === 'conseil' ? 'Formation à définir' : fid };
  q.fullName = (p) => (p ? p.first + ' ' + p.last : '');
  q.age = (s) => { const b = parse(s.birth), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a; };
  q.parentsOf = (sid) => S().parents.filter((p) => p.student === sid);
  q.studentsOf = (iid) => S().students.filter((s) => s.instructor === iid);
  q.skills = (sid) => S().skills[sid] || {};
  q.progress = (sid) => {
    const m = q.skills(sid); const c = { acquis: 0, en_cours: 0, retravailler: 0, non_aborde: 0 };
    SKILLS.forEach((k) => { c[(m[k.id] && m[k.id].s) || 'non_aborde']++; });
    return { pct: Math.round((c.acquis / SKILLS.length) * 100), acquired: c.acquis, total: SKILLS.length, counts: c };
  };
  q.blockProgress = (sid, bid) => {
    const m = q.skills(sid); const list = SKILLS.filter((k) => k.b === bid);
    const a = list.filter((k) => m[k.id] && m[k.id].s === 'acquis').length;
    return { acquired: a, total: list.length, pct: Math.round((a / list.length) * 100) };
  };
  q.lessonsOf = (sid) => S().lessons.filter((l) => l.student === sid);
  q.upcoming = (sid) => {
    const T = todayISO();
    return S().lessons.filter((l) => (!sid || l.student === sid) && l.status === 'confirmee' && l.date >= T)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  };
  q.history = (sid) => S().lessons.filter((l) => l.student === sid && (l.status === 'terminee' || l.status === 'a_completer'))
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
  q.lastCompleted = (sid) => q.history(sid).find((l) => l.status === 'terminee');
  q.lastComment = (sid) => q.history(sid).find((l) => l.status === 'terminee' && l.comment);
  q.hours = (sid) => {
    const s = q.student(sid); const ls = q.lessonsOf(sid);
    const done = s.base + ls.filter((l) => l.status === 'terminee').reduce((t, l) => t + l.duration, 0) / 60;
    const planned = ls.filter((l) => l.status === 'confirmee' && l.date >= todayISO()).reduce((t, l) => t + l.duration, 0) / 60;
    const pending = ls.filter((l) => l.status === 'a_completer').reduce((t, l) => t + l.duration, 0) / 60;
    return { done: Math.round(done * 10) / 10, planned, pending, contract: s.contract, remaining: Math.max(0, s.contract - done) };
  };
  q.code = (sid) => {
    const c = S().code[sid] || { series: [], themes: [], activity: [] };
    const sc = c.series.map((x) => x.score);
    const last3 = sc.slice(-3);
    const avg = last3.length ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length) : 0;
    const prev3 = sc.slice(-6, -3);
    const prevAvg = prev3.length ? prev3.reduce((a, b) => a + b, 0) / prev3.length : avg;
    const last5 = sc.slice(-5);
    return {
      series: c.series, scores: sc, themes: c.themes, activity: c.activity,
      avg, best: sc.length ? Math.max.apply(null, sc) : 0, last: sc[sc.length - 1] || 0, count: sc.length,
      delta: Math.round((avg - prevAvg) * 10) / 10,
      goalHits: last5.filter((x) => x >= 35).length, last5,
      regular: c.activity.slice(-7).reduce((a, b) => a + b, 0)
    };
  };
  q.requestsOf = (sid) => S().requests.filter((r) => r.student === sid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  q.pendingRequests = (iid) => S().requests.filter((r) => (r.status === 'en_attente') && (!iid || r.instructor === iid)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  q.notifs = (to) => S().notifs.filter((n) => n.to === to).sort((a, b) => b.at.localeCompare(a.at));
  q.unread = (to) => q.notifs(to).filter((n) => !n.read).length;
  q.lessonsOn = (date, iid) => S().lessons.filter((l) => l.date === date && (!iid || l.instructor === iid) && l.status !== 'annulee').sort((a, b) => a.start.localeCompare(b.start));
  q.isAbsent = (iid, date) => S().absences.some((a) => a.type === 'moniteur' && a.who === iid && a.date === date);
  q.conflict = (iid, sid, date, start, dur, ignoreReq) => {
    const a = toMin(start), b = a + dur;
    const ov = (s2, d2) => toMin(s2) < b && a < toMin(s2) + d2;
    if (q.isAbsent(iid, date)) return 'Moniteur absent ce jour-là';
    const ins = q.instructor(iid); const h = ins.hours[dow(date)];
    if (!h || !h.some((r) => a >= r[0] * 60 && b <= r[1] * 60)) return 'Hors des disponibilités du moniteur';
    const l = S().lessons.find((x) => x.date === date && x.status !== 'annulee' && (x.instructor === iid || x.student === sid) && ov(x.start, x.duration));
    if (l) return 'Déjà occupé (' + l.start.replace(':', 'h') + ')';
    const r = S().requests.find((x) => x.id !== ignoreReq && x.status === 'en_attente' && x.date === date && (x.instructor === iid || x.student === sid) && ov(x.start, x.duration));
    if (r) return 'Une demande est déjà en attente sur ce créneau';
    return '';
  };
  /** Créneaux potentiellement compatibles : disponibilités élève ∩ moniteur, sans conflit */
  q.compatibleSlots = (sid, opts) => {
    opts = opts || {};
    const s = q.student(sid); const dur = opts.duration || 60; const out = [];
    const T = todayISO();
    for (let o = 1; o <= (opts.days || 14); o++) {
      const d = addDays(T, o); const wd = dow(d);
      const per = (s.avail[wd] || []);
      per.forEach((pid) => {
        const P = PERIODS.find((p) => p.id === pid);
        for (let h = P.from; h + dur / 60 <= P.to; h++) {
          const st = pad(h) + ':00';
          if (!q.conflict(s.instructor, sid, d, st, dur)) out.push({ date: d, start: st, duration: dur, instructor: s.instructor });
        }
      });
    }
    return out;
  };
  q.nextStep = (sid) => {
    const s = q.student(sid); const i = STEPS.findIndex((x) => x.id === s.step);
    return STEPS[Math.min(i + 1, STEPS.length - 1)];
  };
  FP.q = q;

  /* ---------- Actions ---------- */
  const a = {};
  const fmtShort = (d, t) => { const x = parse(d); return x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + (t ? ' à ' + t.replace(':', 'h') : ''); };

  a.notify = (to, text, type, link) => { db.notifs.unshift({ id: id('n'), to, text, type: type || 'info', at: nowStamp(), link: link || '', read: false }); };
  a.log = (text) => { db.log.unshift({ at: nowStamp(), text }); db.log = db.log.slice(0, 80); };
  const parentWants = (sid, key) => q.parentsOf(sid).some((p) => p.access && p.notif[key]);

  a.setAvailability = (sid, avail) => { q.student(sid).avail = avail; save(); };

  a.proposeSlot = (sid, slot, message) => {
    const s = q.student(sid);
    const r = { id: id('r'), student: sid, instructor: slot.instructor || s.instructor, date: slot.date, start: slot.start, duration: slot.duration || 60, status: 'en_attente', message: message || '', createdAt: nowStamp(), history: [{ at: nowStamp(), by: s.first, action: 'Demande envoyée' }] };
    db.requests.push(r);
    a.notify('admin', 'Nouvelle demande de créneau pour ' + s.first + '.', 'slot', '#planning');
    a.notify('moniteur:' + r.instructor, 'Nouvelle demande de créneau pour ' + s.first + '.', 'slot', '#demandes');
    a.log(s.first + ' a proposé un créneau le ' + fmtShort(r.date, r.start) + '.');
    save();
    return r;
  };

  function createLessonFromRequest(r, theme) {
    const l = { id: id('l'), student: r.student, instructor: r.instructor, date: r.date, start: r.start, duration: r.duration, status: 'confirmee', theme: theme || 'Leçon de conduite', meeting: 'Agence Flash PERMIS', worked: [], rework: [], difficulties: [], comment: '', shareParent: true };
    db.lessons.push(l); r.lessonId = l.id; return l;
  }

  a.acceptRequest = (rid, by, theme) => {
    const r = db.requests.find((x) => x.id === rid); if (!r) return;
    const s = q.student(r.student);
    r.status = 'acceptee'; r.history.push({ at: nowStamp(), by: by || 'Secrétariat Flash PERMIS', action: 'Créneau accepté' });
    createLessonFromRequest(r, theme);
    a.notify('eleve:' + r.student, 'Votre demande de conduite a été acceptée : ' + fmtShort(r.date, r.start) + '.', 'slot', '#planning');
    if (parentWants(r.student, 'lecons')) a.notify('parent:' + r.student, 'Nouvelle leçon confirmée pour ' + s.first + ' : ' + fmtShort(r.date, r.start) + '.', 'slot', '#lecons');
    if (by !== 'moniteur') a.notify('moniteur:' + r.instructor, 'Leçon confirmée avec ' + s.first + ' : ' + fmtShort(r.date, r.start) + '.', 'slot', '#planning');
    a.log('Demande de ' + s.first + ' acceptée (' + fmtShort(r.date, r.start) + ').');
    save();
  };
  a.refuseRequest = (rid, reason, by) => {
    const r = db.requests.find((x) => x.id === rid); if (!r) return;
    const s = q.student(r.student);
    r.status = 'refusee'; r.reason = reason || ''; r.history.push({ at: nowStamp(), by: by || 'Secrétariat Flash PERMIS', action: 'Créneau refusé' });
    a.notify('eleve:' + r.student, 'Votre demande du ' + fmtShort(r.date, r.start) + ' n’a pas pu être acceptée.' + (reason ? ' Motif : ' + reason : ''), 'slot', '#planning');
    a.log('Demande de ' + s.first + ' refusée.');
    save();
  };
  a.counterRequest = (rid, slot, by) => {
    const r = db.requests.find((x) => x.id === rid); if (!r) return;
    const s = q.student(r.student);
    r.status = 'contre_proposition'; r.counter = { date: slot.date, start: slot.start, instructor: slot.instructor || r.instructor };
    r.history.push({ at: nowStamp(), by: by || 'Secrétariat Flash PERMIS', action: 'Autre créneau proposé' });
    a.notify('eleve:' + r.student, 'Flash PERMIS vous propose un autre créneau : ' + fmtShort(slot.date, slot.start) + '.', 'slot', '#planning');
    a.log('Contre-proposition envoyée à ' + s.first + ' (' + fmtShort(slot.date, slot.start) + ').');
    save();
  };
  a.answerCounter = (rid, accept) => {
    const r = db.requests.find((x) => x.id === rid); if (!r || !r.counter) return;
    const s = q.student(r.student);
    if (accept) {
      r.date = r.counter.date; r.start = r.counter.start; r.instructor = r.counter.instructor;
      r.status = 'acceptee'; r.history.push({ at: nowStamp(), by: s.first, action: 'Proposition acceptée — créneau confirmé' });
      createLessonFromRequest(r);
      a.notify('admin', s.first + ' a accepté le créneau proposé (' + fmtShort(r.date, r.start) + ').', 'slot', '#planning');
      a.notify('moniteur:' + r.instructor, 'Leçon confirmée avec ' + s.first + ' : ' + fmtShort(r.date, r.start) + '.', 'slot', '#planning');
      if (parentWants(r.student, 'lecons')) a.notify('parent:' + r.student, 'Nouvelle leçon confirmée pour ' + s.first + ' : ' + fmtShort(r.date, r.start) + '.', 'slot', '#lecons');
    } else {
      r.status = 'refusee'; r.reason = 'Proposition déclinée par l’élève';
      r.history.push({ at: nowStamp(), by: s.first, action: 'Proposition déclinée' });
      a.notify('admin', s.first + ' a décliné le créneau proposé.', 'slot', '#planning');
    }
    save();
  };
  a.cancelRequest = (rid) => {
    const r = db.requests.find((x) => x.id === rid); if (!r) return;
    r.status = 'annulee'; r.history.push({ at: nowStamp(), by: q.student(r.student).first, action: 'Demande annulée' });
    a.notify('admin', q.student(r.student).first + ' a annulé sa demande de créneau.', 'slot', '#planning');
    save();
  };

  /** Mise à jour du livret (après une leçon ou directement depuis le dossier) */
  a.updateSkills = (sid, changes, silent) => {
    const m = q.skills(sid); const s = q.student(sid); const newly = [];
    Object.keys(changes).forEach((k) => {
      const prev = m[k] && m[k].s; const st = changes[k];
      if (prev === st) return;
      m[k] = { s: st, d: todayISO() };
      if (st === 'acquis') newly.push(SKILLS.find((x) => x.id === k).label);
    });
    newly.forEach((label) => {
      a.notify('eleve:' + sid, 'Nouvelle compétence validée : ' + label + '.', 'skill', '#progression');
      if (parentWants(sid, 'competences')) a.notify('parent:' + sid, 'Nouvelle compétence validée pour ' + s.first + ' : ' + label + '.', 'skill', '#competences');
    });
    if (!silent) save();
    return newly;
  };

  a.completeLesson = (lid, data) => {
    const l = db.lessons.find((x) => x.id === lid); if (!l) return null;
    const s = q.student(l.student);
    const before = q.progress(l.student).pct;
    l.status = 'terminee';
    l.comment = (data.comment || '').trim();
    l.worked = Object.keys(data.skills || {});
    l.rework = Object.keys(data.skills || {}).filter((k) => data.skills[k] === 'retravailler');
    l.difficulties = data.difficulties || [];
    l.shareParent = data.shareParent !== false;
    l.completedAt = nowStamp();
    if (data.theme) l.theme = data.theme;
    const newly = a.updateSkills(l.student, data.skills || {}, true);
    l.rework.forEach((k) => { if (data.note) q.skills(l.student)[k].note = data.note; });
    a.notify('eleve:' + l.student, 'Nouvelle leçon terminée : ' + l.theme + '.', 'lesson', '#progression');
    if (l.comment) a.notify('eleve:' + l.student, 'Votre moniteur a ajouté une remarque à votre dernière leçon.', 'comment', '#progression');
    if (parentWants(l.student, 'lecons')) a.notify('parent:' + l.student, 'Nouvelle leçon terminée pour ' + s.first + ' : ' + l.theme + '.', 'lesson', '#lecons');
    if (l.comment && l.shareParent && parentWants(l.student, 'remarques')) a.notify('parent:' + l.student, 'Le moniteur a ajouté une remarque à la dernière leçon de ' + s.first + '.', 'comment', '#lecons');
    a.notify('admin', 'Nouvelle leçon terminée : ' + q.fullName(s) + ' — ' + l.theme + '.', 'lesson', '#progression');
    a.log('Livret de ' + s.first + ' mis à jour par ' + q.instructor(l.instructor).first + '.');
    save();
    return { before, after: q.progress(l.student).pct, newly };
  };

  a.addCodeResult = (sid, score, by) => {
    const c = db.code[sid] = db.code[sid] || { series: [], themes: CODE_THEMES.map(() => 60), activity: new Array(14).fill(0) };
    c.series.push({ date: todayISO(), score });
    c.activity[c.activity.length - 1] = 1;
    const s = q.student(sid);
    a.notify('eleve:' + sid, 'Nouveau résultat de code disponible : ' + score + '/40.', 'code', '#code');
    if (parentWants(sid, 'code')) a.notify('parent:' + sid, 'Nouveau résultat de code pour ' + s.first + ' : ' + score + '/40.', 'code', '#code');
    if (by !== 'admin') a.log(s.first + ' a enregistré une série de code : ' + score + '/40.');
    save();
  };

  a.markRead = (to, nid) => { db.notifs.forEach((n) => { if (n.to === to && (!nid || n.id === nid)) n.read = true; }); save(); };

  a.submitInscription = (data) => {
    const i = Object.assign({ id: id('i'), status: 'nouvelle', createdAt: nowStamp(), userCreated: true }, data);
    db.inscriptions.unshift(i);
    a.notify('admin', 'Nouvelle pré-inscription : ' + data.first + ' ' + data.last + ' (' + q.formation(data.formation).title.toLowerCase() + ').', 'inscription', '#inscriptions');
    save();
    return i;
  };
  a.setInscriptionStatus = (iid, st) => { const i = db.inscriptions.find((x) => x.id === iid); if (i) { i.status = st; save(); } };
  a.convertInscription = (iid, instructor) => {
    const i = db.inscriptions.find((x) => x.id === iid); if (!i) return null;
    const sid = 'n' + Date.now().toString(36);
    const s = { id: sid, first: i.first, last: i.last, birth: i.birth || '2008-01-01', formation: i.formation, instructor: instructor || 'julien', contract: 20, base: 0, step: i.formation === 'code' ? 'code' : 'dossier', phone: i.phone, email: i.email, joined: todayISO(), neph: 'En cours d’attribution', avail: { 3: ['aprem'], 6: ['matin'] }, docs: [{ name: 'Pièce d’identité', status: 'attente' }, { name: 'Justificatif de domicile', status: 'attente' }, { name: 'Photo et signature numériques', status: 'manquant' }, { name: 'ASSR 2', status: 'attente' }, { name: 'Contrat de formation', status: 'attente' }] };
    db.students.push(s);
    db.skills[sid] = {}; SKILLS.forEach((k) => { db.skills[sid][k.id] = { s: 'non_aborde' }; });
    db.code[sid] = { series: [], themes: CODE_THEMES.map(() => 0), activity: new Array(14).fill(0) };
    if (i.minor && i.parent && i.parent.name) {
      const pn = i.parent.name.split(' ');
      db.parents.push({ id: 'p' + Date.now().toString(36), first: pn[0], last: pn.slice(1).join(' ') || i.last, relation: 'Parent', student: sid, email: i.parent.email || '', phone: i.parent.phone || '', access: true, visible: { progression: true, remarques: true, planning: true, code: true, documents: false }, notif: { lecons: true, remarques: true, competences: true, code: true } });
    }
    i.status = 'finalisee'; i.studentId = sid;
    a.log('Dossier élève créé pour ' + i.first + ' ' + i.last + '.');
    save();
    return s;
  };

  a.updateSchool = (data) => { Object.assign(db.content.school, data); save(); };
  a.updateFormation = (fid, data) => { const f = db.content.formations.find((x) => x.id === fid); if (f) { Object.assign(f, data); save(); } };
  a.resetContent = () => { db.content = defaultContent(); save(); };

  a.setParent = (pid, path, value) => {
    const p = db.parents.find((x) => x.id === pid); if (!p) return;
    const parts = path.split('.');
    if (parts.length === 1) p[parts[0]] = value; else p[parts[0]][parts[1]] = value;
    save();
  };
  a.addParent = (data) => {
    db.parents.push(Object.assign({ id: 'p' + Date.now().toString(36), relation: 'Parent', access: true, visible: { progression: true, remarques: true, planning: true, code: true, documents: false }, notif: { lecons: true, remarques: true, competences: true, code: true } }, data));
    a.notify('admin', 'Accès parent créé pour ' + q.student(data.student).first + '.', 'info', '#parents');
    save();
  };

  a.addAbsence = (data) => {
    db.absences.push(Object.assign({ id: id('a') }, data));
    if (data.type === 'moniteur') {
      const ins = q.instructor(data.who);
      db.lessons.filter((l) => l.instructor === data.who && l.date === data.date && l.status === 'confirmee').forEach((l) => {
        l.status = 'annulee'; l.cancelReason = 'Absence du moniteur';
        a.notify('eleve:' + l.student, 'Votre leçon du ' + fmtShort(l.date, l.start) + ' est annulée (absence de ' + ins.first + '). L’agence vous propose un nouveau créneau rapidement.', 'slot', '#planning');
      });
    }
    a.log('Absence enregistrée : ' + (data.type === 'moniteur' ? q.instructor(data.who).first : q.student(data.who).first) + '.');
    save();
  };
  a.cancelLesson = (lid, reason) => {
    const l = db.lessons.find((x) => x.id === lid); if (!l) return;
    l.status = 'annulee'; l.cancelReason = reason || '';
    a.notify('eleve:' + l.student, 'Votre leçon du ' + fmtShort(l.date, l.start) + ' a été annulée par l’agence.', 'slot', '#planning');
    save();
  };
  a.setDocStatus = (sid, idx, st) => { const s = q.student(sid); if (s && s.docs[idx]) { s.docs[idx].status = st; save(); } };
  a.addDoc = (sid, name) => { const s = q.student(sid); s.docs.push({ name, status: 'attente' }); a.notify('admin', q.fullName(s) + ' a déposé un document : ' + name + '.', 'info', '#eleves'); save(); };

  FP.act = a;
})(window);
