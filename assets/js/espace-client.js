/* ==========================================================================
   Flash PERMIS — Espace client partagé (élève et parents)
   Documents, offre, paiement, historique et demande de modification de créneau.
   ========================================================================== */
(function (global) {
  'use strict';
  const FP = global.FP;
  const { q, act, fmt, icon, esc } = FP;
  const D = FP.date;
  const eur = FP.money.eur, METHODS = FP.pay.METHODS, PS = FP.pay.PAY_STATUS;
  const C = FP.client = {};

  const docBadge = (d) => ({
    valide: FP.badge('Validé', 'ok', 'check'), signe: FP.badge('Signé', 'ok', 'check'),
    attente: FP.badge('En vérification', 'pending', 'clock'), refuse: FP.badge('Refusé', 'danger', 'x'),
    manquant: FP.badge('À fournir', 'warn', 'alert')
  }[d.status] || FP.badge(d.status, 'mute'));

  /* ======================================================================
     Documents
     ====================================================================== */
  C.documentsView = (sid, opts) => {
    opts = opts || {};
    const s = q.student(sid);
    const docs = s.docs || [];
    const todo = docs.filter((d) => d.status === 'manquant' || d.status === 'refuse');
    const ok = docs.filter((d) => d.status === 'valide' || d.status === 'signe').length;
    const who = opts.who || 'votre';
    return (todo.length
      ? '<div class="card" style="border-color:#fde2b3;background:var(--warn-bg);margin-bottom:16px"><div class="row wrap">' + FP.skillBadge('retravailler') +
        '<div style="flex:1;min-width:200px"><strong>' + todo.length + ' document(s) à fournir</strong><p class="small" style="color:var(--warn)">Déposez-les ci-dessous pour compléter ' + (opts.possessive || 'votre dossier') + '.</p></div></div></div>'
      : '<div class="note" style="margin-bottom:16px">' + icon('checkCircle') + '<span>Tous les documents demandés ont été transmis. ' + ok + ' document(s) validé(s).</span></div>') +
      '<div class="stack">' + docs.map((d) => {
        const canUpload = d.status === 'manquant' || d.status === 'refuse' || d.status === 'attente';
        return '<div class="doc-card"><span class="doc-thumb">' +
          (d.file && d.file.type !== 'application/pdf' ? '<img src="' + d.file.dataUrl + '" alt="">' : icon(d.file ? 'file' : 'upload')) + '</span>' +
          '<div class="doc-main"><div class="row-between"><strong>' + esc(d.name) + '</strong>' + docBadge(d) + '</div>' +
          '<span class="muted">' + (d.uploadedAt ? 'Transmis ' + fmt.ago(d.uploadedAt).toLowerCase() : 'Pas encore transmis') + (d.file ? ' · ' + d.file.name : '') + '</span>' +
          (d.reason ? '<div class="doc-reason">' + icon('alert') + '<span>' + esc(d.reason) + '</span></div>' : '') +
          '<div class="doc-actions">' +
          (d.file ? '<button class="btn btn-ghost btn-xs" data-cdoc="' + sid + '|' + d.id + '">' + icon('eye') + 'Voir</button>' : '') +
          (canUpload ? '<label class="btn ' + (d.status === 'attente' ? 'btn-ghost' : 'btn-dark') + ' btn-xs">' + icon('upload') + (d.file ? 'Remplacer' : 'Déposer') +
            '<input type="file" accept="application/pdf,image/jpeg,image/png" hidden data-upload="' + sid + '|' + d.id + '"></label>' : '') +
          '</div></div></div>';
      }).join('') +
      '<label class="drop">' + icon('upload') + '<strong>Ajouter un autre document</strong>' +
      '<span>PDF, JPEG, JPG ou PNG — 1,5 Mo maximum</span>' +
      '<input type="file" accept="application/pdf,image/jpeg,image/png" hidden data-upload="' + sid + '|"></label>' +
      '</div>';
  };

  C.viewDoc = (sid, did) => {
    const d = q.doc(sid, did);
    FP.modal({
      title: d.name, sub: d.file ? d.file.name : '', wide: true,
      body: (d.file
        ? (d.file.type === 'application/pdf'
          ? '<embed class="doc-viewer" src="' + d.file.dataUrl + '" type="application/pdf">'
          : '<div class="doc-viewer"><img src="' + d.file.dataUrl + '" alt="' + esc(d.name) + '"></div>')
        : '<p class="empty">Aucun fichier.</p>') +
        (d.reason ? '<div class="doc-reason">' + icon('alert') + '<span>' + esc(d.reason) + '</span></div>' : ''),
      actions: [d.file ? { label: 'Télécharger', icon: 'download', onClick: () => { const a = document.createElement('a'); a.href = d.file.dataUrl; a.download = d.file.name; a.click(); return false; } } : null, { label: 'Fermer', cls: 'btn-dark' }].filter(Boolean)
    });
  };

  /** Gestion du dépôt : à brancher une fois par page */
  C.handleUploads = (onDone) => {
    document.addEventListener('change', (e) => {
      const inp = e.target.closest('[data-upload]');
      if (!inp || !inp.files || !inp.files[0]) return;
      const [sid, did] = inp.dataset.upload.split('|');
      const file = inp.files[0];
      FP.readFile(file).then((f) => {
        const name = did ? null : (file.name.replace(/\.[^.]+$/, '') || 'Document');
        act.uploadDoc(sid, did || null, f, name);
        FP.toast('Document transmis. Flash PERMIS va le vérifier.');
        if (onDone) onDone();
      }).catch((err) => FP.toast(err.message, 'warn'));
      inp.value = '';
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cdoc]');
      if (b) { const [sid, did] = b.dataset.cdoc.split('|'); C.viewDoc(sid, did); }
    });
  };

  /* ======================================================================
     Offre et paiements
     ====================================================================== */
  C.offerBanner = (sid, canAnswer) => {
    const s = q.student(sid);
    if (!s.offer || s.offer.status !== 'proposee') return '';
    return '<div class="offer-card" style="margin-bottom:16px"><span class="card-kicker" style="color:var(--volt)">Offre de formation</span>' +
      '<h3>' + esc(s.offer.label) + '</h3>' +
      '<p class="offer-price">' + eur(s.offer.amountCts) + '</p>' +
      '<p>Flash PERMIS vous propose cette formation. En acceptant, votre inscription est confirmée et le règlement devient accessible.</p>' +
      (canAnswer ? '<div class="offer-actions"><button class="btn btn-primary" data-offer-yes="' + sid + '">' + icon('check') + 'Accepter l’offre</button>' +
        '<button class="btn btn-glass" data-offer-no="' + sid + '">Ne pas accepter</button></div>'
        : '<p class="small" style="margin-top:14px;color:rgba(255,255,255,.6)">Seul l’élève peut accepter l’offre depuis son espace.</p>') + '</div>';
  };

  C.paymentsView = (sid, opts) => {
    opts = opts || {};
    const s = q.student(sid);
    const bal = q.balance(sid);
    const pays = q.payments(sid).slice().sort((a, b) => (b.paidAt || b.createdAt).localeCompare(a.paidAt || a.createdAt));
    const due = pays.filter((p) => p.status === 'attente' || p.status === 'partiel');
    const confirmed = s.offer && s.offer.status === 'acceptee';
    return (confirmed ? '<div class="card" style="background:var(--ok-bg);border-color:#bfe8cd;margin-bottom:16px"><div class="row">' +
      '<span class="stat-ic ok" style="margin:0">' + icon('checkCircle') + '</span><div><strong style="font-size:17px">Votre inscription est confirmée.</strong>' +
      '<p class="small" style="color:var(--ok)">Offre « ' + esc(s.offer.label) + ' » acceptée le ' + fmt.dateLong((s.offer.answeredAt || '').slice(0, 10)) + '.</p></div></div></div>' : '') +
      C.offerBanner(sid, opts.canAnswer !== false) +
      '<div class="g g-3 g-stats"><div class="card card-dark stat"><span class="stat-label">Reste à régler</span><span class="stat-value">' + eur(bal.rest) + '</span></div>' +
      '<div class="card stat"><span class="stat-label">Déjà réglé</span><span class="stat-value">' + eur(bal.paid) + '</span></div>' +
      '<div class="card stat"><span class="stat-label">Total formation</span><span class="stat-value">' + eur(bal.due) + '</span></div></div>' +
      (due.length ? '<div class="card mt"><div class="card-head"><span class="card-title">' + icon('trophy') + 'À régler</span></div>' +
        due.map((p) => '<div class="card card-soft" style="padding:16px;margin-bottom:10px"><div class="row-between wrap"><div><strong style="font-size:16px">' + esc(p.label) + '</strong>' +
          '<p class="small muted">Référence ' + esc(p.ref) + (p.paidCts ? ' · déjà réglé ' + eur(p.paidCts) : '') + '</p></div>' +
          '<span class="amount-hero" style="font-size:28px">' + eur(p.amountCts - p.paidCts) + '</span></div>' +
          '<button class="btn btn-primary btn-block mt" data-pay="' + p.id + '">' + icon('lock') + 'Payer en ligne</button>' +
          '<p class="small muted" style="margin-top:8px;text-align:center">Ou réglez directement à l’agence de Gardanne.</p></div>').join('') + '</div>' : '') +
      '<div class="card mt"><div class="card-head"><span class="card-title">' + icon('list') + 'Historique des paiements</span></div><div class="docs">' +
      (pays.map((p) => '<div class="pay-row"><span class="doc-ic">' + icon(p.status === 'paye' ? 'checkCircle' : 'clock') + '</span>' +
        '<div class="grow"><strong>' + esc(p.label) + '</strong><span>' + (p.paidAt ? fmt.dateLong(p.paidAt.slice(0, 10)) + ' · ' + esc(METHODS[p.method] || '') : 'En attente de règlement') + '</span></div>' +
        '<span class="pay-amount">' + eur(p.paidCts || p.amountCts) + '</span>' + FP.badge(PS[p.status].label, PS[p.status].tone) +
        (p.ticket ? '<button class="btn btn-ghost btn-xs" data-cticket="' + p.id + '">' + icon('file') + 'Reçu</button>' : '') + '</div>').join('') ||
        '<p class="empty">Aucun règlement pour le moment.</p>') + '</div></div>' +
      '<p class="note mt">' + icon('info') + '<span>Démonstration : le paiement en ligne est simulé, aucune somme n’est débitée. La mise en service nécessite un prestataire de paiement (Stripe, SumUp…).</span></p>';
  };

  C.payModal = (pid, onDone) => {
    const p = q.payment(pid);
    const rest = p.amountCts - p.paidCts;
    const method = (m, ic, label, sub, cls) => '<button class="pay-method ' + (cls || '') + '" data-method="' + m + '">' + icon(ic) + '<span>' + label + '<small>' + sub + '</small></span></button>';
    FP.modal({
      title: 'Régler ' + eur(rest), sub: p.label,
      body: '<div class="pay-methods">' +
        method('cb', 'lock', 'Carte bancaire', 'Visa, Mastercard, CB') +
        method('applepay', 'phoneDevice', 'Apple Pay', 'Paiement en un geste', 'dark') +
        method('googlepay', 'phoneDevice', 'Google Pay', 'Paiement en un geste', 'dark') +
        method('especes', 'building', 'Payer à l’agence', 'Espèces ou carte sur place') +
        '</div>' +
        '<p class="note mt">' + icon('shield') + '<span>Démonstration : aucun paiement réel n’est effectué et aucune donnée bancaire n’est demandée.</span></p>',
      actions: [{ label: 'Annuler' }],
      onOpen: (w) => {
        w.addEventListener('click', (e) => {
          const b = e.target.closest('[data-method]'); if (!b) return;
          const m = b.dataset.method;
          if (m === 'especes') {
            act.logEvent(p.student, 'payment', 'Règlement sur place demandé par l’élève : ' + eur(rest) + '.', q.student(p.student).first);
            act.notify('admin', q.fullName(q.student(p.student)) + ' souhaite régler à l’agence (' + eur(rest) + ').', 'info', '#paiements');
            FP.toast('C’est noté. Présentez-vous à l’agence de Gardanne pour régler.', 'info');
          } else {
            act.payPayment(pid, m, rest / 100, q.student(p.student).first);
            FP.toast('Paiement accepté. Votre reçu est disponible.');
          }
          w.querySelector('[data-close]').click();
          if (onDone) onDone();
        });
      }
    });
  };

  C.ticketModal = (pid) => {
    const p = q.payment(pid);
    FP.modal({
      title: 'Reçu ' + (p.ticket ? p.ticket.no : ''), sub: p.label, wide: true,
      body: '<div class="ticket-preview">' + FP.ticketHTML(p) + '</div>',
      actions: [{ label: 'Imprimer / PDF', cls: 'btn-dark', icon: 'download', onClick: () => { FP.printTickets([p]); return false; } }, { label: 'Fermer', cls: 'btn-ghost' }]
    });
  };

  /** Gestion des paiements et offres : à brancher une fois par page */
  C.handlePayments = (onDone) => {
    document.addEventListener('click', (e) => {
      const t = e.target;
      const pay = t.closest('[data-pay]'); if (pay) { C.payModal(pay.dataset.pay, onDone); return; }
      const tk = t.closest('[data-cticket]'); if (tk) { C.ticketModal(tk.dataset.cticket); return; }
      const oy = t.closest('[data-offer-yes]');
      if (oy) {
        const sid = oy.dataset.offerYes;
        FP.modal({
          title: 'Accepter l’offre', sub: q.student(sid).offer.label + ' — ' + eur(q.student(sid).offer.amountCts),
          body: '<p class="note">' + icon('checkCircle') + '<span>En acceptant, votre inscription chez Flash PERMIS est confirmée. Le règlement pourra être effectué en ligne ou à l’agence.</span></p>',
          actions: [{ label: 'Annuler' }, { label: 'J’accepte l’offre', cls: 'btn-primary', icon: 'check', onClick: () => { act.answerOffer(sid, true); FP.toast('Offre acceptée — votre inscription est confirmée ! 🎉'); if (onDone) onDone(); } }]
        });
        return;
      }
      const on = t.closest('[data-offer-no]');
      if (on) { act.answerOffer(on.dataset.offerNo, false); FP.toast('L’agence a été prévenue et vous recontactera.', 'info'); if (onDone) onDone(); }
    });
  };

  /* ======================================================================
     Demande de modification d'un créneau confirmé
     ====================================================================== */
  C.changeSlotModal = (lid, by, onDone) => {
    const l = FP.store.db.lessons.find((x) => x.id === lid); if (!l) return;
    const sug = q.compatibleSlots(l.student, { duration: l.duration, days: 21 }).slice(0, 8);
    let pick = sug[0] || null;
    const m = FP.modal({
      title: 'Demander un autre horaire', sub: 'Leçon du ' + fmt.day(l.date) + ' à ' + fmt.time(l.start),
      body: (sug.length ? '<p class="small muted">Créneaux compatibles avec vos disponibilités et le planning du moniteur :</p>' +
        '<div class="slot-list">' + sug.map((x, i) => '<button class="slot ' + (i === 0 ? 'is-on' : '') + '" data-cs="' + i + '">' +
          fmt.dayShort(x.date).replace(/^./, (c) => c.toUpperCase()) + ' · ' + fmt.time(x.start) + '</button>').join('') + '</div>'
        : '<p class="note">' + icon('info') + '<span>Aucun créneau compatible trouvé. Indiquez une date souhaitée ci-dessous.</span></p>') +
        '<div class="form-grid"><label class="field"><span>Ou une date</span><input class="input" type="date" id="cs-date"></label>' +
        '<label class="field"><span>Heure</span><input class="input" type="time" id="cs-time" step="1800" value="' + l.start + '"></label></div>' +
        '<label class="field"><span>Motif <em class="hint">(facultatif)</em></span><input class="input" id="cs-reason" placeholder="Ex. : contretemps scolaire"></label>' +
        '<p class="note note-volt">' + icon('shield') + '<span>Votre demande est transmise à Flash PERMIS. La leçon actuelle reste valable tant que l’agence n’a pas validé le changement.</span></p>',
      actions: [{ label: 'Annuler' }, { label: 'Envoyer la demande', cls: 'btn-primary', icon: 'send', onClick: (w) => {
        const d = w.querySelector('#cs-date').value, t = w.querySelector('#cs-time').value;
        const slot = d && t ? { date: d, start: t } : pick;
        if (!slot) { FP.toast('Choisissez un créneau.', 'warn'); return false; }
        act.requestLessonChange(lid, slot, by, w.querySelector('#cs-reason').value.trim());
        FP.toast('Demande envoyée — en attente de validation de Flash PERMIS.');
        if (onDone) onDone();
      } }]
    });
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cs]'); if (!b) return;
      pick = sug[+b.dataset.cs];
      m.el.querySelectorAll('[data-cs]').forEach((x) => x.classList.toggle('is-on', x === b));
      m.el.querySelector('#cs-date').value = '';
    });
  };
})(window);
