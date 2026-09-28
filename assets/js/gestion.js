/* ==========================================================================
   Flash PERMIS — Module de gestion
   Accès administrateur, historique, documents, paiements, tickets,
   comptabilité et communications automatiques.

   Ce module étend FP.q (lectures) et FP.act (actions) définis dans store.js.
   ========================================================================== */
(function (global) {
  'use strict';
  const FP = global.FP;
  const q = FP.q, act = FP.act, D = FP.date;
  const db = () => FP.store.db;
  const save = () => FP.store.save();
  const nowStamp = () => new Date().toISOString();
  let seq = 0;
  const id = (p) => p + '-' + Date.now().toString(36) + '-' + (seq++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  /* ======================================================================
     Modèles de messages (modifiables depuis l'administration)
     ====================================================================== */
  function defaultTemplates() {
    return {
      inscription_recue: { label: 'Demande d’inscription reçue', email: true, sms: false, subject: 'Votre demande d’inscription chez Flash PERMIS', body: 'Bonjour {prenom},\n\nNous avons bien reçu votre demande d’inscription pour la formation {formation}.\nNotre équipe revient vers vous très rapidement pour finaliser votre dossier.\n\nÀ très bientôt,\nL’équipe Flash PERMIS — Gardanne' },
      inscription_validee: { label: 'Inscription validée', email: true, sms: true, subject: 'Votre inscription est confirmée', body: 'Bonjour {prenom},\n\nVotre inscription chez Flash PERMIS est confirmée. Votre espace élève est désormais accessible.\n\nL’équipe Flash PERMIS' },
      offre_envoyee: { label: 'Offre envoyée', email: true, sms: true, subject: 'Votre offre de formation Flash PERMIS', body: 'Bonjour {prenom},\n\nVotre offre « {offre} » d’un montant de {montant} est disponible dans votre espace.\nVous pouvez l’accepter en ligne et procéder au règlement.\n\nL’équipe Flash PERMIS' },
      offre_acceptee: { label: 'Offre acceptée', email: true, sms: false, subject: 'Votre inscription est confirmée', body: 'Bonjour {prenom},\n\nVous avez accepté l’offre « {offre} » ({montant}). Votre inscription est confirmée.\nVous pouvez régler en ligne ou à l’agence.\n\nL’équipe Flash PERMIS' },
      offre_refusee: { label: 'Offre refusée', email: true, sms: false, subject: 'Votre offre Flash PERMIS', body: 'Bonjour {prenom},\n\nNous avons bien noté que l’offre proposée ne vous convient pas. Nous vous recontactons pour en discuter.\n\nL’équipe Flash PERMIS' },
      document_demande: { label: 'Document demandé', email: true, sms: true, subject: 'Document à fournir', body: 'Bonjour {prenom},\n\nMerci de déposer le document suivant dans votre espace : {document}.\n\nL’équipe Flash PERMIS' },
      document_valide: { label: 'Document validé', email: true, sms: false, subject: 'Document validé', body: 'Bonjour {prenom},\n\nVotre document « {document} » a bien été validé.\n\nL’équipe Flash PERMIS' },
      document_refuse: { label: 'Document refusé', email: true, sms: true, subject: 'Document à renouveler', body: 'Bonjour {prenom},\n\nDocument refusé : {document}. Motif : {motif}\nMerci d’en déposer un nouveau depuis votre espace.\n\nL’équipe Flash PERMIS' },
      paiement_effectue: { label: 'Paiement effectué', email: true, sms: true, subject: 'Confirmation de paiement', body: 'Bonjour {prenom},\n\nNous confirmons votre paiement de {montant} ({moyen}).\nVotre reçu n° {ticket} est disponible dans votre espace.\n\nL’équipe Flash PERMIS' },
      creneau_demande: { label: 'Demande de créneau reçue', email: true, sms: false, subject: 'Votre demande de créneau', body: 'Bonjour {prenom},\n\nVotre demande de créneau du {creneau} a bien été transmise à l’agence. Elle sera validée sous peu.\n\nL’équipe Flash PERMIS' },
      creneau_accepte: { label: 'Créneau accepté', email: true, sms: true, subject: 'Votre leçon est confirmée', body: 'Bonjour {prenom},\n\nVotre leçon du {creneau} est confirmée avec {moniteur}.\n\nL’équipe Flash PERMIS' },
      creneau_refuse: { label: 'Créneau refusé', email: true, sms: true, subject: 'Votre demande de créneau', body: 'Bonjour {prenom},\n\nVotre demande du {creneau} n’a pas pu être retenue. Motif : {motif}\nVous pouvez proposer un autre créneau depuis votre espace.\n\nL’équipe Flash PERMIS' },
      creneau_modifie: { label: 'Créneau modifié', email: true, sms: true, subject: 'Votre leçon a été déplacée', body: 'Bonjour {prenom},\n\nVotre leçon du {ancien} a été déplacée au {nouveau}.\nDemande effectuée par : {auteur}.\n\nL’équipe Flash PERMIS' },
      lecon_annulee: { label: 'Leçon annulée', email: true, sms: true, subject: 'Leçon annulée', body: 'Bonjour {prenom},\n\nVotre leçon du {creneau} a été annulée. Motif : {motif}\nNous vous proposons un nouveau créneau rapidement.\n\nL’équipe Flash PERMIS' },
      competence_validee: { label: 'Compétence validée', email: true, sms: false, subject: 'Nouvelle compétence validée', body: 'Bonjour {prenom},\n\nNouvelle compétence validée : {competence}. Votre progression est de {progression}.\n\nL’équipe Flash PERMIS' }
    };
  }

  /* ======================================================================
     Migration : crée les collections de gestion si elles n'existent pas
     ====================================================================== */
  function migrate() {
    const d = db();
    let changed = false;
    const ensure = (k, v) => { if (d[k] == null) { d[k] = v; changed = true; } };
    ensure('auth', { code: '1312à', updatedAt: null });
    ensure('payments', []);
    ensure('events', []);
    ensure('outbox', []);
    ensure('templates', defaultTemplates());
    ensure('counters', { ticket: 0 });
    ensure('settings', { tvaRate: 20, currency: 'EUR', hourRate: 5000 });
    if (d.settings.hourRate == null) { d.settings.hourRate = 5000; changed = true; }
    // Complète les modèles ajoutés après coup
    const def = defaultTemplates();
    Object.keys(def).forEach((k) => { if (!d.templates[k]) { d.templates[k] = def[k]; changed = true; } });
    // Élèves : champs de gestion
    d.students.forEach((s) => {
      if (s.active == null) { s.active = true; changed = true; }
      (s.docs || []).forEach((doc, i) => { if (!doc.id) { doc.id = s.id + '-d' + i; changed = true; } });
    });
    d.instructors.forEach((i) => { if (i.active == null) { i.active = true; changed = true; } });
    if (!d.events.length) { seedHistory(); changed = true; }
    if (changed) FP.store.save();
  }

  /* Historique de départ, reconstruit à partir du parcours des élèves */
  function seedHistory() {
    const d = db();
    const ev = [];
    const push = (sid, at, type, text, by) => ev.push({ id: id('e'), student: sid, at, type, text, by: by || 'Flash PERMIS' });
    d.students.forEach((s) => {
      push(s.id, D.stampFor(s.joined, '09:15'), 'inscription', 'Inscription enregistrée — formation : ' + q.formation(s.formation).title + '.', 'Secrétariat');
      push(s.id, D.stampFor(D.addDays(s.joined, 1), '11:00'), 'document', 'Documents d’inscription transmis.', s.first);
      (s.docs || []).filter((x) => x.status === 'valide' || x.status === 'signe').slice(0, 2).forEach((doc, i) => {
        push(s.id, D.stampFor(D.addDays(s.joined, 2), '10:0' + i), 'document', 'Document validé : ' + doc.name + '.', 'Secrétariat');
      });
      push(s.id, D.stampFor(D.addDays(s.joined, 2), '16:30'), 'dossier', 'Dossier validé par l’auto-école.', 'Secrétariat');
    });
    d.lessons.filter((l) => l.status === 'terminee').forEach((l) => {
      push(l.student, D.stampFor(l.date, l.start), 'lesson', 'Leçon effectuée : ' + l.theme + ' (' + FP.fmt.dur(l.duration) + ').', q.instructor(l.instructor).first);
      if (l.comment) push(l.student, D.stampFor(l.date, D.toHHMM(D.toMin(l.start) + l.duration)), 'skill', 'Remarque du moniteur : « ' + l.comment + ' »', q.instructor(l.instructor).first);
    });
    d.students.forEach((s) => {
      const m = q.skills(s.id);
      FP.ref.SKILLS.forEach((k) => {
        if (m[k.id] && m[k.id].s === 'acquis' && m[k.id].d) push(s.id, D.stampFor(m[k.id].d, '18:30'), 'skill', 'Compétence validée : ' + k.label + '.', q.instructor(s.instructor).first);
      });
    });
    d.requests.forEach((r) => {
      r.history.forEach((h) => push(r.student, h.at, 'slot', h.action + ' — ' + FP.fmt.dayCap(r.date) + ' à ' + FP.fmt.time(r.start) + '.', h.by));
    });
    d.events = ev.sort((a, b) => b.at.localeCompare(a.at));
    // Quelques règlements de démonstration, répartis sur les dernières semaines
    const amounts = [79000, 120000, 95000, 145000, 89000, 110000, 64000, 132000];
    const when = [-1, -3, -6, -9, -14, -19, -24, -28];
    const ways = ['cb', 'especes', 'cb', 'applepay', 'especes', 'cb', 'virement', 'googlepay'];
    d.students.slice(0, 8).forEach((s, i) => {
      const p = makePayment(s.id, 'Forfait ' + q.formation(s.formation).title, amounts[i], { silent: true, at: D.stampFor(D.addDays(D.todayISO(), when[i] - 2), '09:30') });
      if (i < 6) markPaid(p.id, ways[i], { silent: true, at: D.stampFor(D.addDays(D.todayISO(), when[i]), (9 + i) + ':' + (i % 2 ? '45' : '20')) });
      else if (i === 6) markPaid(p.id, ways[i], { silent: true, at: D.stampFor(D.addDays(D.todayISO(), when[i]), '11:10'), amountCts: Math.round(amounts[i] / 2) });
    });
  }

  /* ======================================================================
     Historique
     ====================================================================== */
  function logEvent(sid, type, text, by) {
    db().events.unshift({ id: id('e'), student: sid, at: nowStamp(), type, text, by: by || 'Administration' });
    db().events = db().events.slice(0, 2000);
  }
  q.events = (sid) => db().events.filter((e) => !sid || e.student === sid).sort((a, b) => b.at.localeCompare(a.at));
  act.logEvent = (sid, type, text, by) => { logEvent(sid, type, text, by); save(); };

  /* ---------- Historique : fragment d'affichage réutilisable ---------- */
  const TL_ICON = { inscription: 'user', dossier: 'clipboard', document: 'file', lesson: 'car', skill: 'checkCircle', slot: 'calendar', payment: 'trophy', code: 'book', info: 'info' };
  FP.timeline = (events, opts) => {
    opts = opts || {};
    if (!events.length) return '<p class="empty">Aucun événement enregistré.</p>';
    return '<div class="timeline">' + events.slice(0, opts.limit || 60).map((e) => {
      const dt = new Date(e.at);
      return '<div class="tl"><span class="tl-ic tl-' + e.type + '">' + FP.icon(TL_ICON[e.type] || 'info') + '</span>' +
        '<div class="tl-body"><strong>' + FP.esc(e.text) + '</strong>' +
        '<p class="tl-meta"><span class="tl-date">' + dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' · ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') + '</span> — ' + FP.esc(e.by) +
        (opts.showStudent && q.student(e.student) ? ' · ' + FP.esc(q.fullName(q.student(e.student))) : '') + '</p></div></div>';
    }).join('') + '</div>';
  };

  /* ======================================================================
     Communications automatiques (e-mail + SMS)
     ====================================================================== */
  const fill = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

  /**
   * Prépare les messages d'un événement pour un élève et ses parents.
   * Sur un site statique, l'envoi réel n'est pas possible : les messages sont
   * enregistrés dans la « boîte d'envoi » pour être consultés et rejoués.
   */
  function notify(sid, key, vars, opts) {
    opts = opts || {};
    const t = db().templates[key];
    if (!t) return [];
    const s = q.student(sid);
    if (!s) return [];
    const base = Object.assign({
      prenom: s.first, nom: s.last, eleve: q.fullName(s),
      formation: q.formation(s.formation).title,
      moniteur: q.instructor(s.instructor) ? q.instructor(s.instructor).first : ''
    }, vars || {});
    const subject = fill(t.subject, base);
    const body = fill(t.body, base);
    const out = [];
    const targets = [{ to: s.email, phone: s.phone, who: q.fullName(s) }];
    if (opts.parents !== false) {
      q.parentsOf(sid).filter((p) => p.access).forEach((p) => targets.push({ to: p.email, phone: p.phone, who: p.first + ' ' + p.last + ' (parent)' }));
    }
    targets.forEach((tg) => {
      if (t.email && tg.to) out.push({ id: id('m'), at: nowStamp(), channel: 'email', to: tg.to, who: tg.who, subject, body, key, student: sid, status: 'simule' });
      if (t.sms && tg.phone) out.push({ id: id('m'), at: nowStamp(), channel: 'sms', to: tg.phone, who: tg.who, subject: '', body: body.split('\n\n')[1] || body.split('\n')[0], key, student: sid, status: 'simule' });
    });
    db().outbox = out.concat(db().outbox || []).slice(0, 500);
    return out;
  }
  act.notifyStudent = (sid, key, vars, opts) => { const o = notify(sid, key, vars, opts); save(); return o; };
  q.outbox = (sid) => (db().outbox || []).filter((m) => !sid || m.student === sid);
  act.clearOutbox = () => { db().outbox = []; save(); };
  act.updateTemplate = (key, data) => { Object.assign(db().templates[key], data); save(); };
  act.resetTemplates = () => { db().templates = defaultTemplates(); save(); };

  /* ======================================================================
     Accès administrateur
     ====================================================================== */
  // Comparaison tolérante aux accents et à la casse (clavier mobile)
  const norm = (v) => String(v || '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  q.checkAdminCode = (v) => norm(v) === norm(db().auth.code);
  q.adminCode = () => db().auth.code;
  act.setAdminCode = (v) => {
    db().auth.code = String(v).trim();
    db().auth.updatedAt = nowStamp();
    act.log('Code d’accès administrateur modifié.');
    save();
  };

  /* ======================================================================
     Documents
     ====================================================================== */
  const DOC_MAX = 1600 * 1024; // 1,6 Mo après compression
  /** Lit un fichier, compresse les images, renvoie {name,type,size,dataUrl} */
  FP.readFile = (file) => new Promise((resolve, reject) => {
    const ok = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (ok.indexOf(file.type) < 0) { reject(new Error('Format non accepté. Formats acceptés : PDF, JPEG, JPG, PNG.')); return; }
    const done = (dataUrl) => {
      if (dataUrl.length > DOC_MAX * 1.37) { reject(new Error('Fichier trop volumineux pour la démonstration (1,5 Mo maximum).')); return; }
      resolve({ name: file.name, type: file.type, size: file.size, dataUrl });
    };
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    if (file.type === 'application/pdf') { fr.onload = () => done(fr.result); fr.readAsDataURL(file); return; }
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1400;
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        done(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => reject(new Error('Image illisible.'));
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  q.docs = (sid) => (q.student(sid) || { docs: [] }).docs || [];
  q.doc = (sid, did) => q.docs(sid).find((d) => d.id === did);
  q.docsPending = () => {
    const out = [];
    db().students.forEach((s) => (s.docs || []).forEach((d) => { if (d.status === 'attente') out.push({ student: s, doc: d }); }));
    return out;
  };

  act.uploadDoc = (sid, did, file, name) => {
    const s = q.student(sid);
    let d = did ? q.doc(sid, did) : null;
    if (!d) { d = { id: id('doc'), name: name || file.name, required: false }; s.docs.push(d); }
    d.file = file; d.status = 'attente'; d.uploadedAt = nowStamp(); d.reason = '';
    logEvent(sid, 'document', 'Document transmis : ' + d.name + '.', s.first);
    act.notify('admin', q.fullName(s) + ' a déposé un document : ' + d.name + '.', 'info', '#documents');
    save();
    return d;
  };
  act.reviewDoc = (sid, did, status, reason) => {
    const s = q.student(sid), d = q.doc(sid, did);
    if (!d) return;
    d.status = status; d.reason = reason || '';
    d.reviewedAt = nowStamp();
    if (status === 'valide') {
      logEvent(sid, 'document', 'Document validé : ' + d.name + '.', 'Secrétariat');
      act.notify('eleve:' + sid, 'Votre document « ' + d.name + ' » a été validé.', 'info', '#documents');
      notify(sid, 'document_valide', { document: d.name });
    } else if (status === 'refuse') {
      logEvent(sid, 'document', 'Document refusé : ' + d.name + ' — ' + (reason || 'sans motif') + '.', 'Secrétariat');
      act.notify('eleve:' + sid, 'Document refusé : ' + d.name + '. ' + (reason || ''), 'info', '#documents');
      notify(sid, 'document_refuse', { document: d.name, motif: reason || '—' });
    }
    save();
  };
  act.requestDoc = (sid, name) => {
    const s = q.student(sid);
    s.docs.push({ id: id('doc'), name, status: 'manquant', required: true, uploadedAt: null });
    logEvent(sid, 'document', 'Document demandé : ' + name + '.', 'Secrétariat');
    act.notify('eleve:' + sid, 'Nouveau document à fournir : ' + name + '.', 'info', '#documents');
    notify(sid, 'document_demande', { document: name });
    save();
  };
  act.removeDoc = (sid, did) => {
    const s = q.student(sid);
    const i = s.docs.findIndex((d) => d.id === did);
    if (i >= 0) { logEvent(sid, 'document', 'Document supprimé : ' + s.docs[i].name + '.', 'Secrétariat'); s.docs.splice(i, 1); save(); }
  };

  /* ======================================================================
     Offres et paiements
     ====================================================================== */
  const cts = (eur) => Math.round(parseFloat(String(eur).replace(',', '.')) * 100) || 0;
  const eur = (c) => (c / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  FP.money = { cts, eur };

  const METHODS = {
    cb: 'Carte bancaire', applepay: 'Apple Pay', googlepay: 'Google Pay',
    especes: 'Espèces (sur place)', virement: 'Virement', cheque: 'Chèque'
  };
  const PAY_STATUS = {
    attente: { label: 'En attente', tone: 'pending', icon: 'clock' },
    paye: { label: 'Payé', tone: 'ok', icon: 'checkCircle' },
    partiel: { label: 'Partiellement payé', tone: 'warn', icon: 'alert' },
    annule: { label: 'Annulé', tone: 'mute', icon: 'ban' },
    rembourse: { label: 'Remboursé', tone: 'info', icon: 'refresh' }
  };
  FP.pay = { METHODS, PAY_STATUS };

  function makePayment(sid, label, amountCts, opts) {
    opts = opts || {};
    const p = {
      id: id('p'), student: sid, label, amountCts, paidCts: 0,
      status: 'attente', method: '', createdAt: opts.at || nowStamp(), paidAt: null,
      tvaRate: db().settings.tvaRate, ref: 'REF-' + String(Date.now()).slice(-6), ticket: null, note: ''
    };
    db().payments.unshift(p);
    if (!opts.silent) {
      logEvent(sid, 'payment', 'Règlement attendu : ' + label + ' — ' + eur(amountCts) + '.', 'Secrétariat');
      save();
    }
    return p;
  }

  function markPaid(pid, method, opts) {
    opts = opts || {};
    const p = db().payments.find((x) => x.id === pid);
    if (!p) return null;
    const amount = opts.amountCts != null ? opts.amountCts : p.amountCts - p.paidCts;
    p.paidCts = Math.min(p.amountCts, p.paidCts + amount);
    p.method = method;
    p.status = p.paidCts >= p.amountCts ? 'paye' : 'partiel';
    p.paidAt = opts.at || nowStamp();
    if (p.status === 'paye' && !p.ticket) {
      db().counters.ticket += 1;
      p.ticket = { no: 'FP-' + new Date(p.paidAt).getFullYear() + '-' + String(db().counters.ticket).padStart(4, '0'), at: p.paidAt };
    }
    if (!opts.silent) {
      logEvent(p.student, 'payment', 'Paiement ' + (p.status === 'paye' ? 'encaissé' : 'partiel') + ' : ' + eur(amount) + ' (' + METHODS[method] + ').', opts.by || 'Secrétariat');
      act.notify('admin', 'Paiement reçu : ' + q.fullName(q.student(p.student)) + ' — ' + eur(amount) + '.', 'info', '#paiements');
      act.notify('eleve:' + p.student, 'Paiement confirmé : ' + eur(amount) + '.', 'info', '#paiements');
      notify(p.student, 'paiement_effectue', { montant: eur(amount), moyen: METHODS[method], ticket: p.ticket ? p.ticket.no : '—' });
      save();
    }
    return p;
  }

  act.createPayment = (sid, label, amountEur) => makePayment(sid, label, cts(amountEur));
  act.payPayment = (pid, method, amountEur, by) => markPaid(pid, method, { amountCts: amountEur != null ? cts(amountEur) : undefined, by });
  act.setPaymentStatus = (pid, status, reason) => {
    const p = db().payments.find((x) => x.id === pid); if (!p) return;
    p.status = status; p.note = reason || p.note;
    if (status === 'rembourse') {
      logEvent(p.student, 'payment', 'Remboursement : ' + eur(p.paidCts) + (reason ? ' — ' + reason : '') + '.', 'Secrétariat');
      act.notify('eleve:' + p.student, 'Un remboursement de ' + eur(p.paidCts) + ' a été enregistré.', 'info', '#paiements');
    }
    if (status === 'annule') logEvent(p.student, 'payment', 'Règlement annulé : ' + p.label + '.', 'Secrétariat');
    save();
  };
  act.deletePayment = (pid) => { const i = db().payments.findIndex((x) => x.id === pid); if (i >= 0) { db().payments.splice(i, 1); save(); } };

  q.payments = (sid) => db().payments.filter((p) => !sid || p.student === sid);
  q.payment = (pid) => db().payments.find((p) => p.id === pid);
  q.balance = (sid) => {
    const list = q.payments(sid).filter((p) => p.status !== 'annule' && p.status !== 'rembourse');
    const due = list.reduce((t, p) => t + p.amountCts, 0);
    const paid = list.reduce((t, p) => t + p.paidCts, 0);
    return { due, paid, rest: Math.max(0, due - paid) };
  };

  /* Offres */
  act.sendOffer = (sid, label, amountEur) => {
    const s = q.student(sid);
    s.offer = { label, amountCts: cts(amountEur), status: 'proposee', sentAt: nowStamp() };
    logEvent(sid, 'dossier', 'Offre envoyée : ' + label + ' — ' + eur(s.offer.amountCts) + '.', 'Secrétariat');
    act.notify('eleve:' + sid, 'Flash PERMIS vous a envoyé une offre : ' + label + '.', 'info', '#paiements');
    notify(sid, 'offre_envoyee', { offre: label, montant: eur(s.offer.amountCts) });
    save();
  };
  act.answerOffer = (sid, accept) => {
    const s = q.student(sid);
    if (!s.offer) return;
    s.offer.status = accept ? 'acceptee' : 'refusee';
    s.offer.answeredAt = nowStamp();
    if (accept) {
      makePayment(sid, s.offer.label, s.offer.amountCts, { silent: true });
      logEvent(sid, 'dossier', 'Offre acceptée par l’élève : ' + s.offer.label + '.', s.first);
      act.notify('admin', s.first + ' a accepté l’offre « ' + s.offer.label + ' ».', 'info', '#paiements');
      notify(sid, 'offre_acceptee', { offre: s.offer.label, montant: eur(s.offer.amountCts) });
    } else {
      logEvent(sid, 'dossier', 'Offre refusée par l’élève.', s.first);
      act.notify('admin', s.first + ' a refusé l’offre proposée.', 'info', '#paiements');
      notify(sid, 'offre_refusee', {});
    }
    save();
  };

  /* ======================================================================
     Comptabilité
     ====================================================================== */
  q.accounting = (from, to) => {
    const inRange = (d) => (!from || d >= from) && (!to || d <= to);
    const paid = db().payments.filter((p) => (p.status === 'paye' || p.status === 'partiel') && p.paidAt && inRange(p.paidAt.slice(0, 10)));
    const rate = db().settings.tvaRate;
    const ttc = paid.reduce((t, p) => t + p.paidCts, 0);
    const ht = Math.round(ttc / (1 + rate / 100));
    const byMethod = {};
    Object.keys(METHODS).forEach((m) => { byMethod[m] = paid.filter((p) => p.method === m).reduce((t, p) => t + p.paidCts, 0); });
    const pending = db().payments.filter((p) => p.status === 'attente' || p.status === 'partiel').reduce((t, p) => t + (p.amountCts - p.paidCts), 0);
    const refunded = db().payments.filter((p) => p.status === 'rembourse' && p.paidAt && inRange(p.paidAt.slice(0, 10))).reduce((t, p) => t + p.paidCts, 0);
    return { count: paid.length, ttc, ht, tva: ttc - ht, rate, byMethod, pending, refunded, rows: paid.sort((a, b) => b.paidAt.localeCompare(a.paidAt)) };
  };

  q.periodRange = (kind, ref) => {
    const T = ref || D.todayISO();
    const d = D.parse(T);
    const iso = D.iso;
    if (kind === 'jour') return { from: T, to: T, label: 'Journée du ' + FP.fmt.dateLong(T) };
    if (kind === 'semaine') { let s = T; while (D.dow(s) !== 1) s = D.addDays(s, -1); return { from: s, to: D.addDays(s, 6), label: 'Semaine du ' + FP.fmt.dateLong(s) }; }
    if (kind === 'mois') { const f = iso(new Date(d.getFullYear(), d.getMonth(), 1)); const t = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); return { from: f, to: t, label: D.parse(f).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }; }
    if (kind === 'trimestre') { const qq = Math.floor(d.getMonth() / 3); const f = iso(new Date(d.getFullYear(), qq * 3, 1)); const t = iso(new Date(d.getFullYear(), qq * 3 + 3, 0)); return { from: f, to: t, label: 'Trimestre ' + (qq + 1) + ' ' + d.getFullYear() }; }
    if (kind === 'annee') return { from: d.getFullYear() + '-01-01', to: d.getFullYear() + '-12-31', label: 'Année ' + d.getFullYear() };
    return { from: '', to: '', label: 'Période personnalisée' };
  };

  /* Téléchargement CSV (fichier réel) */
  FP.downloadCSV = (filename, rows) => {
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ======================================================================
     Ticket de caisse (vue imprimable → « Enregistrer en PDF »)
     ====================================================================== */
  FP.ticketHTML = (p) => {
    const s = q.student(p.student);
    const sc = db().content.school;
    const lg = sc.legal || {};
    const ht = Math.round(p.paidCts / (1 + p.tvaRate / 100));
    const at = new Date(p.paidAt || p.createdAt);
    const line = (a, b, strong) => '<tr><td>' + a + '</td><td class="r' + (strong ? ' b' : '') + '">' + b + '</td></tr>';
    return '<div class="ticket">' +
      '<div class="tk-head"><strong>FLASH PERMIS</strong><span>Auto-école · Gardanne</span>' +
      '<span>' + FP.esc(sc.address || '') + ' — ' + FP.esc(sc.cp + ' ' + sc.city) + '</span>' +
      (sc.phone ? '<span>Tél. ' + FP.esc(sc.phone) + '</span>' : '') +
      '<span>SIRET ' + FP.esc(lg.siret || '') + '</span></div>' +
      '<div class="tk-sep"></div>' +
      '<table class="tk-meta"><tbody>' +
      line('Ticket n°', '<b>' + (p.ticket ? p.ticket.no : '—') + '</b>') +
      line('Date', at.toLocaleDateString('fr-FR')) +
      line('Heure', at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })) +
      line('Client', FP.esc(q.fullName(s))) +
      line('Référence', p.ref) +
      '</tbody></table>' +
      '<div class="tk-sep"></div>' +
      '<table class="tk-lines"><tbody>' +
      '<tr><td>' + FP.esc(p.label) + '</td><td class="r">' + eur(p.paidCts) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="tk-sep"></div>' +
      '<table class="tk-meta"><tbody>' +
      line('Total HT', eur(ht)) +
      line('TVA ' + p.tvaRate + ' %', eur(p.paidCts - ht)) +
      line('TOTAL TTC', eur(p.paidCts), true) +
      '</tbody></table>' +
      '<div class="tk-sep"></div>' +
      '<table class="tk-meta"><tbody>' +
      line('Moyen de paiement', METHODS[p.method] || '—') +
      line('Statut', PAY_STATUS[p.status].label) +
      '</tbody></table>' +
      '<p class="tk-foot">Merci de votre confiance.<br>' + FP.esc(lg.name || 'FLASH PERMIS') + ' — ' + FP.esc(lg.form || '') + ' · SIREN ' + FP.esc(lg.siren || '') + '<br>TVA ' + FP.esc(lg.tva || '') + '</p>' +
      '</div>';
  };

  FP.printTickets = (payments, title) => {
    const host = document.createElement('div');
    host.className = 'print-area';
    host.innerHTML = (title ? '<h1 class="print-title">' + FP.esc(title) + '</h1>' : '') +
      payments.map((p) => FP.ticketHTML(p)).join('<div class="tk-break"></div>');
    document.body.appendChild(host);
    document.body.classList.add('printing');
    const cleanup = () => { document.body.classList.remove('printing'); host.remove(); global.removeEventListener('afterprint', cleanup); };
    global.addEventListener('afterprint', cleanup);
    setTimeout(() => { global.print(); setTimeout(cleanup, 1500); }, 60);
  };

  /* ======================================================================
     Élèves : création, modification, suppression
     ====================================================================== */
  act.createStudent = (data) => {
    const sid = data.id || ('e' + Date.now().toString(36));
    const s = Object.assign({
      id: sid, contract: 20, base: 0, step: 'dossier', joined: D.todayISO(),
      neph: 'En cours d’attribution', active: true, userCreated: true,
      avail: { 3: ['aprem'], 6: ['matin'] },
      docs: ['Pièce d’identité', 'Justificatif de domicile', 'Photo et signature numériques', 'ASSR 2', 'Contrat de formation']
        .map((n, i) => ({ id: sid + '-d' + i, name: n, status: 'manquant', required: true, uploadedAt: null }))
    }, data, { id: sid });
    db().students.push(s);
    db().skills[sid] = {}; FP.ref.SKILLS.forEach((k) => { db().skills[sid][k.id] = { s: 'non_aborde' }; });
    db().code[sid] = { series: [], themes: FP.ref.CODE_THEMES.map(() => 0), activity: new Array(14).fill(0) };
    logEvent(sid, 'inscription', 'Fiche élève créée — formation : ' + q.formation(s.formation).title + '.', 'Administration');
    act.log('Élève créé : ' + q.fullName(s) + '.');
    save();
    return s;
  };
  act.updateStudent = (sid, data) => {
    const s = q.student(sid); if (!s) return;
    const changes = Object.keys(data).filter((k) => String(s[k]) !== String(data[k]));
    Object.assign(s, data);
    if (changes.length) logEvent(sid, 'info', 'Informations modifiées (' + changes.join(', ') + ').', 'Administration');
    save();
  };
  act.setStudentActive = (sid, active) => {
    const s = q.student(sid); if (!s) return;
    s.active = active;
    logEvent(sid, 'info', active ? 'Compte réactivé.' : 'Compte désactivé.', 'Administration');
    act.log((active ? 'Réactivation' : 'Désactivation') + ' du compte de ' + q.fullName(s) + '.');
    save();
  };
  act.deleteStudent = (sid) => {
    const d = db(); const s = q.student(sid); if (!s) return;
    d.students = d.students.filter((x) => x.id !== sid);
    d.lessons = d.lessons.filter((x) => x.student !== sid);
    d.requests = d.requests.filter((x) => x.student !== sid);
    d.parents = d.parents.filter((x) => x.student !== sid);
    d.payments = d.payments.filter((x) => x.student !== sid);
    d.events = d.events.filter((x) => x.student !== sid);
    d.outbox = d.outbox.filter((x) => x.student !== sid);
    delete d.skills[sid]; delete d.code[sid];
    act.log('Dossier supprimé : ' + q.fullName(s) + '.');
    save();
  };

  /* ======================================================================
     Moniteurs : création, modification, suppression
     ====================================================================== */
  const COLORS = ['blue', 'violet', 'teal', 'rose', 'amber', 'green', 'slate'];
  act.createInstructor = (data) => {
    const iid = 'm' + Date.now().toString(36);
    const i = Object.assign({
      id: iid, color: COLORS[db().instructors.length % COLORS.length], active: true, userCreated: true,
      role: 'Moniteur', types: ['Permis B'],
      hours: { 1: [[8, 12], [13, 18]], 2: [[8, 12], [13, 18]], 3: [[8, 12], [13, 18]], 4: [[8, 12], [13, 18]], 5: [[8, 12], [13, 18]] }
    }, data, { id: iid });
    db().instructors.push(i);
    act.log('Moniteur ajouté : ' + i.first + ' ' + i.last + '.');
    save();
    return i;
  };
  act.updateInstructor = (iid, data) => { Object.assign(q.instructor(iid), data); save(); };
  act.setInstructorActive = (iid, active) => {
    const i = q.instructor(iid); i.active = active;
    act.log((active ? 'Réactivation' : 'Désactivation') + ' du moniteur ' + i.first + '.');
    save();
  };
  act.deleteInstructor = (iid) => {
    const d = db();
    const others = d.instructors.filter((x) => x.id !== iid && x.active !== false);
    if (!others.length) return 'Impossible : il doit rester au moins un moniteur actif.';
    const fallback = others[0].id;
    d.students.forEach((s) => { if (s.instructor === iid) s.instructor = fallback; });
    d.lessons.forEach((l) => { if (l.instructor === iid) l.instructor = fallback; });
    d.requests.forEach((r) => { if (r.instructor === iid) r.instructor = fallback; });
    const i = q.instructor(iid);
    d.instructors = d.instructors.filter((x) => x.id !== iid);
    act.log('Moniteur supprimé : ' + i.first + ' ' + i.last + ' (élèves réattribués à ' + q.instructor(fallback).first + ').');
    save();
    return '';
  };
  act.assignStudent = (sid, iid) => {
    const s = q.student(sid); s.instructor = iid;
    logEvent(sid, 'info', 'Moniteur référent : ' + q.instructor(iid).first + ' ' + q.instructor(iid).last + '.', 'Administration');
    act.notify('eleve:' + sid, 'Votre moniteur référent est désormais ' + q.instructor(iid).first + '.', 'info', '');
    save();
  };
  act.setInstructorHours = (iid, hours) => { q.instructor(iid).hours = hours; save(); };

  /* ======================================================================
     Modification d'un créneau déjà confirmé
     ====================================================================== */
  /** Demande de déplacement d'une leçon (élève ou parent) */
  act.requestLessonChange = (lid, slot, by, reason) => {
    const l = db().lessons.find((x) => x.id === lid); if (!l) return null;
    const s = q.student(l.student);
    const r = {
      id: id('r'), kind: 'modif', lessonId: lid, student: l.student, instructor: l.instructor,
      date: slot.date, start: slot.start, duration: l.duration, status: 'en_attente',
      from: { date: l.date, start: l.start }, message: reason || '', by: by || s.first,
      createdAt: nowStamp(), history: [{ at: nowStamp(), by: by || s.first, action: 'Demande de modification envoyée' }]
    };
    db().requests.push(r);
    logEvent(l.student, 'slot', 'Demande de modification : leçon du ' + FP.fmt.day(l.date) + ' ' + FP.fmt.time(l.start) + ' → ' + FP.fmt.day(slot.date) + ' ' + FP.fmt.time(slot.start) + '.', by || s.first);
    act.notify('admin', 'Demande de modification de créneau pour ' + s.first + '.', 'slot', '#planning');
    act.notify('moniteur:' + l.instructor, 'Demande de modification de créneau pour ' + s.first + '.', 'slot', '#demandes');
    save();
    return r;
  };

  /** Déplacement effectif d'une leçon (moniteur ou administration) */
  act.moveLesson = (lid, slot, by) => {
    const l = db().lessons.find((x) => x.id === lid); if (!l) return;
    const s = q.student(l.student);
    const old = { date: l.date, start: l.start };
    l.date = slot.date; l.start = slot.start;
    if (slot.instructor) l.instructor = slot.instructor;
    l.movedAt = nowStamp(); l.movedBy = by || 'Administration';
    const oldTxt = FP.fmt.day(old.date) + ' à ' + FP.fmt.time(old.start);
    const newTxt = FP.fmt.day(l.date) + ' à ' + FP.fmt.time(l.start);
    logEvent(l.student, 'slot', 'Leçon déplacée du ' + oldTxt + ' au ' + newTxt + '.', by || 'Administration');
    act.notify('eleve:' + l.student, 'Votre leçon du ' + oldTxt + ' a été déplacée au ' + newTxt + '.', 'slot', '#planning');
    act.notify('moniteur:' + l.instructor, 'Leçon de ' + s.first + ' déplacée au ' + newTxt + '.', 'slot', '#planning');
    if (q.parentsOf(l.student).some((p) => p.access && p.notif.lecons)) {
      act.notify('parent:' + l.student, 'La leçon de ' + s.first + ' a été déplacée au ' + newTxt + '.', 'slot', '#lecons');
    }
    notify(l.student, 'creneau_modifie', { ancien: oldTxt, nouveau: newTxt, auteur: by || 'Administration' });
    save();
  };

  /* ======================================================================
     Enrichissement des actions existantes : historique + communications
     ====================================================================== */
  function wrap(name, after) {
    const orig = act[name];
    if (typeof orig !== 'function') return;
    act[name] = function () {
      const res = orig.apply(this, arguments);
      try { after.apply(null, [res].concat([].slice.call(arguments))); FP.store.save(); } catch (e) { console.error(e); }
      return res;
    };
  }

  wrap('acceptRequest', (res, rid, by) => {
    const r = db().requests.find((x) => x.id === rid); if (!r) return;
    const txt = FP.fmt.day(r.date) + ' à ' + FP.fmt.time(r.start);
    if (r.kind === 'modif' && r.lessonId) {
      const l = db().lessons.find((x) => x.id === r.lessonId);
      if (l && l.status === 'confirmee') { l.date = r.date; l.start = r.start; }
      // la leçon créée en double par acceptRequest est retirée
      const dup = db().lessons.filter((x) => x.id === r.lessonId ? false : x.student === r.student && x.date === r.date && x.start === r.start && x.status === 'confirmee');
      if (dup.length && l) db().lessons = db().lessons.filter((x) => x.id !== dup[dup.length - 1].id);
      logEvent(r.student, 'slot', 'Modification de créneau acceptée — nouvelle date : ' + txt + '.', by || 'Secrétariat');
      notify(r.student, 'creneau_modifie', { ancien: r.from ? FP.fmt.day(r.from.date) + ' à ' + FP.fmt.time(r.from.start) : '—', nouveau: txt, auteur: r.by || 'l’élève' });
    } else {
      logEvent(r.student, 'slot', 'Créneau accepté : ' + txt + '.', by || 'Secrétariat');
      notify(r.student, 'creneau_accepte', { creneau: txt });
    }
  });
  wrap('refuseRequest', (res, rid, reason, by) => {
    const r = db().requests.find((x) => x.id === rid); if (!r) return;
    const txt = FP.fmt.day(r.date) + ' à ' + FP.fmt.time(r.start);
    logEvent(r.student, 'slot', 'Créneau refusé : ' + txt + (reason ? ' — ' + reason : '') + '.', by || 'Secrétariat');
    notify(r.student, 'creneau_refuse', { creneau: txt, motif: reason || '—' });
  });
  wrap('counterRequest', (res, rid, slot, by) => {
    const r = db().requests.find((x) => x.id === rid); if (!r) return;
    logEvent(r.student, 'slot', 'Autre créneau proposé : ' + FP.fmt.day(slot.date) + ' à ' + FP.fmt.time(slot.start) + '.', by || 'Secrétariat');
  });
  wrap('proposeSlot', (r) => {
    if (!r) return;
    const txt = FP.fmt.day(r.date) + ' à ' + FP.fmt.time(r.start);
    logEvent(r.student, 'slot', 'Créneau proposé par l’élève : ' + txt + '.', q.student(r.student).first);
    notify(r.student, 'creneau_demande', { creneau: txt }, { parents: false });
  });
  wrap('completeLesson', (res, lid) => {
    const l = db().lessons.find((x) => x.id === lid); if (!l) return;
    const who = q.instructor(l.instructor).first;
    logEvent(l.student, 'lesson', 'Leçon terminée : ' + l.theme + ' (' + FP.fmt.dur(l.duration) + ').', who);
    if (l.comment) logEvent(l.student, 'skill', 'Remarque du moniteur : « ' + l.comment + ' »', who);
    (res && res.newly || []).forEach((n) => {
      logEvent(l.student, 'skill', 'Compétence validée : ' + n + '.', who);
      notify(l.student, 'competence_validee', { competence: n, progression: q.progress(l.student).pct + ' %' });
    });
    (l.rework || []).forEach((k) => {
      const lab = (FP.ref.SKILLS.find((x) => x.id === k) || {}).label || k;
      logEvent(l.student, 'skill', 'À retravailler : ' + lab + '.', who);
    });
  });
  wrap('updateSkills', (res, sid) => {
    (res || []).forEach((n) => logEvent(sid, 'skill', 'Compétence validée : ' + n + '.', 'Moniteur'));
  });
  wrap('addCodeResult', (res, sid, score) => {
    logEvent(sid, 'code', 'Résultat de code enregistré : ' + score + '/40.', 'Élève');
  });
  wrap('cancelLesson', (res, lid, reason) => {
    const l = db().lessons.find((x) => x.id === lid); if (!l) return;
    const txt = FP.fmt.day(l.date) + ' à ' + FP.fmt.time(l.start);
    logEvent(l.student, 'slot', 'Leçon annulée : ' + txt + (reason ? ' — ' + reason : '') + '.', 'Administration');
    notify(l.student, 'lecon_annulee', { creneau: txt, motif: reason || '—' });
  });
  wrap('convertInscription', (s, iid) => {
    if (!s) return;
    logEvent(s.id, 'inscription', 'Dossier élève créé à partir de la pré-inscription.', 'Secrétariat');
    notify(s.id, 'inscription_validee', {});
  });
  wrap('addDoc', (res, sid, name) => { logEvent(sid, 'document', 'Document transmis : ' + name + '.', 'Élève'); });
  wrap('setDocStatus', (res, sid, idx, st) => {
    const d = q.docs(sid)[idx]; if (!d) return;
    logEvent(sid, 'document', (st === 'valide' ? 'Document validé : ' : 'Statut modifié : ') + d.name + '.', 'Secrétariat');
  });
  wrap('addParent', (res, data) => { logEvent(data.student, 'info', 'Accès parent créé : ' + data.first + ' ' + data.last + '.', 'Administration'); });

  /* Statuts de pré-inscription enrichis */
  FP.INSC_STATUS = {
    nouvelle: 'Nouvelle demande', attente: 'En attente', contactee: 'Contacté',
    dossier: 'Dossier en cours', accepte: 'Accepté', refuse: 'Refusé', finalisee: 'Inscription finalisée'
  };

  /* ======================================================================
     Paiement d'une heure de conduite
     Le règlement n'existe qu'une fois le créneau accepté par l'élève
     ET confirmé par le moniteur ou le secrétariat : dans ce modèle, une
     leçon ne passe au statut « confirmee » qu'à ces deux conditions.
     ====================================================================== */
  const LESSON_PAY = {
    attente: { key: 'attente', label: 'En attente de paiement', tone: 'pending', icon: 'clock' },
    sur_place: { key: 'sur_place', label: 'Paiement sur place', tone: 'info', icon: 'building' },
    paye: { key: 'paye', label: 'Payée', tone: 'ok', icon: 'checkCircle' }
  };
  FP.LESSON_PAY = LESSON_PAY;

  /** Une leçon est réglable dès qu'elle est confirmée (créneau accepté des deux côtés). */
  q.lessonPayable = (l) => !!l && l.status === 'confirmee';
  q.lessonPayment = (l) => (l && l.paymentId ? db().payments.find((p) => p.id === l.paymentId) : null);
  q.lessonPrice = (l) => Math.round((db().settings.hourRate || 5000) * (l.duration / 60));

  /** Crée le règlement rattaché à la leçon si elle est devenue payable. */
  function ensureLessonPayment(l, opts) {
    if (!q.lessonPayable(l)) return null;
    let p = q.lessonPayment(l);
    if (p) return p;
    const label = 'Heure de conduite — ' + FP.fmt.day(l.date) + ' à ' + FP.fmt.time(l.start);
    p = makePayment(l.student, label, q.lessonPrice(l), { silent: true, at: (opts && opts.at) || nowStamp() });
    p.lessonId = l.id;
    p.onSite = false;
    l.paymentId = p.id;
    return p;
  }
  q.ensureLessonPayment = ensureLessonPayment;

  /** Statut de paiement affichable pour une leçon (null si non applicable). */
  q.lessonPayStatus = (l) => {
    if (!q.lessonPayable(l)) return null;
    const p = q.lessonPayment(l);
    if (!p) return LESSON_PAY.attente;
    if (p.status === 'paye') return LESSON_PAY.paye;
    if (p.onSite) return LESSON_PAY.sur_place;
    return LESSON_PAY.attente;
  };

  const lessonById = (lid) => db().lessons.find((x) => x.id === lid);

  /** Règlement en ligne. Idempotent : une leçon déjà payée n'est jamais réencaissée. */
  act.payLesson = (lid, method, by) => {
    const l = lessonById(lid); if (!l) return { ok: false, error: 'Leçon introuvable.' };
    const p = ensureLessonPayment(l);
    if (!p) return { ok: false, error: 'Le créneau doit d’abord être confirmé.' };
    if (p.status === 'paye') return { ok: true, already: true, payment: p };
    p.onSite = false;
    p.lastError = '';
    markPaid(p.id, method, { by: by || q.student(l.student).first });
    logEvent(l.student, 'payment', 'Heure de conduite du ' + FP.fmt.day(l.date) + ' réglée en ligne (' + METHODS[method] + ').', by || q.student(l.student).first);
    act.notify('moniteur:' + l.instructor, 'Leçon du ' + FP.fmt.day(l.date) + ' avec ' + q.student(l.student).first + ' : paiement reçu.', 'info', '#planning');
    save();
    return { ok: true, payment: p };
  };

  /** L'élève choisit de régler à l'agence : la réservation reste valide. */
  act.setLessonOnSite = (lid, by) => {
    const l = lessonById(lid); if (!l) return null;
    const p = ensureLessonPayment(l); if (!p || p.status === 'paye') return p;
    p.onSite = true; p.method = 'especes'; p.lastError = '';
    logEvent(l.student, 'payment', 'Règlement sur place choisi pour la leçon du ' + FP.fmt.day(l.date) + '.', by || q.student(l.student).first);
    act.notify('moniteur:' + l.instructor, q.student(l.student).first + ' réglera sa leçon du ' + FP.fmt.day(l.date) + ' sur place.', 'info', '#planning');
    act.notify('admin', q.student(l.student).first + ' réglera sur place la leçon du ' + FP.fmt.day(l.date) + '.', 'info', '#paiements');
    save();
    return p;
  };

  /** Le moniteur (ou l'agence) encaisse sur place. */
  act.markLessonPaid = (lid, by, method) => {
    const l = lessonById(lid); if (!l) return { ok: false };
    const p = ensureLessonPayment(l);
    if (!p) return { ok: false };
    if (p.status === 'paye') return { ok: true, already: true, payment: p };
    markPaid(p.id, method || 'especes', { by: by || 'Moniteur' });
    logEvent(l.student, 'payment', 'Heure de conduite du ' + FP.fmt.day(l.date) + ' encaissée sur place.', by || 'Moniteur');
    save();
    return { ok: true, payment: p };
  };

  /** Échec de paiement : la réservation est conservée, l'élève peut réessayer. */
  act.failLessonPayment = (lid, reason) => {
    const l = lessonById(lid); if (!l) return;
    const p = ensureLessonPayment(l); if (!p || p.status === 'paye') return;
    p.lastError = reason || 'Le paiement a été refusé.';
    p.attempts = (p.attempts || 0) + 1;
    logEvent(l.student, 'payment', 'Tentative de paiement refusée pour la leçon du ' + FP.fmt.day(l.date) + '.', q.student(l.student).first);
    save();
  };

  /**
   * Modifie le tarif horaire. Les leçons déjà payées gardent leur montant ;
   * celles encore en attente sont réalignées sur le nouveau tarif.
   */
  act.setHourRate = (rateEur) => {
    const cts = Math.round(parseFloat(String(rateEur).replace(',', '.')) * 100);
    if (!(cts > 0)) return { updated: 0 };
    db().settings.hourRate = cts;
    let updated = 0;
    db().lessons.forEach((l) => {
      const p = q.lessonPayment(l);
      if (!p || p.status === 'paye' || p.status === 'annule' || p.paidCts > 0) return;
      const next = q.lessonPrice(l);
      if (next !== p.amountCts) { p.amountCts = next; updated++; }
    });
    act.log('Tarif horaire de conduite fixé à ' + eur(cts) + '.' + (updated ? ' ' + updated + ' leçon(s) recalculée(s).' : ''));
    save();
    return { updated };
  };

  /** Crée les règlements manquants pour toutes les leçons confirmées. */
  function syncLessonPayments() {
    let n = 0;
    db().lessons.forEach((l) => { if (q.lessonPayable(l) && !q.lessonPayment(l)) { ensureLessonPayment(l); n++; } });
    return n;
  }
  q.syncLessonPayments = syncLessonPayments;

  // Un créneau accepté devient immédiatement réglable
  wrap('acceptRequest', (res, rid) => {
    const r = db().requests.find((x) => x.id === rid);
    if (r && r.lessonId) { const l = lessonById(r.lessonId); if (l) ensureLessonPayment(l); }
    syncLessonPayments();
  });
  wrap('answerCounter', (res, rid, accept) => {
    if (!accept) return;
    const r = db().requests.find((x) => x.id === rid);
    if (r && r.lessonId) { const l = lessonById(r.lessonId); if (l) ensureLessonPayment(l); }
  });
  // Une leçon annulée annule son règlement s'il n'a pas été encaissé
  wrap('cancelLesson', (res, lid) => {
    const l = lessonById(lid); const p = q.lessonPayment(l);
    if (p && p.status !== 'paye') { p.status = 'annule'; p.note = 'Leçon annulée'; }
  });

  migrate();
  // Règlements des leçons déjà confirmées, avec quelques cas de démonstration
  if (syncLessonPayments()) {
    const pend = db().lessons.filter((l) => q.lessonPayable(l)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    pend.forEach((l, i) => {
      const p = q.lessonPayment(l); if (!p || p.status === 'paye') return;
      if (i % 3 === 1) { p.onSite = true; p.method = 'especes'; }
      else if (i % 3 === 2) markPaid(p.id, i % 2 ? 'cb' : 'applepay', { silent: true, at: D.stampFor(D.addDays(D.todayISO(), -1), '18:' + (10 + (i % 40))) });
    });
    FP.store.save();
  }

  FP.gestion = { defaultTemplates, notify, makePayment, markPaid, ensureLessonPayment, syncLessonPayments };
})(window);
