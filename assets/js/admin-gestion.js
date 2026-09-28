/* ==========================================================================
   Flash PERMIS — Administration : modules de gestion
   Documents · Paiements · Caisse · Comptabilité · Communications · Réglages
   Les vues sont enregistrées dans FP.adminViews et montées par admin.js.
   ========================================================================== */
(function (global) {
  'use strict';
  const FP = global.FP;
  const { q, act, fmt, icon, esc, $, $$ } = FP;
  const D = FP.date;
  const db = () => FP.store.db;
  const eur = FP.money.eur, METHODS = FP.pay.METHODS, PS = FP.pay.PAY_STATUS;
  const V = FP.adminViews = {};
  const M = FP.adminModals = {};

  const st = { period: 'mois', from: '', to: '', docFilter: 'attente', payFilter: 'all', msgFilter: 'all' };
  let shell = null;
  FP.bindAdminShell = (s) => { shell = s; };
  const rerender = () => { if (shell) shell.render(true); };

  const payBadge = (p) => FP.badge(PS[p.status].label, PS[p.status].tone, PS[p.status].icon);
  const docBadge = (d) => ({
    valide: FP.badge('Validé', 'ok', 'check'), signe: FP.badge('Signé', 'ok', 'check'),
    attente: FP.badge('En attente', 'pending', 'clock'), refuse: FP.badge('Refusé', 'danger', 'x'),
    manquant: FP.badge('À fournir', 'warn', 'alert')
  }[d.status] || FP.badge(d.status, 'mute'));
  const person = (s, sub) => '<div class="person">' + FP.avatar(s, 'sm') + '<div><strong>' + esc(q.fullName(s)) + '</strong><span>' + esc(sub || '') + '</span></div></div>';

  /* ======================================================================
     Documents
     ====================================================================== */
  M.viewDoc = (sid, did) => {
    const d = q.doc(sid, did), s = q.student(sid);
    const body = d.file
      ? (d.file.type === 'application/pdf'
        ? '<embed class="doc-viewer" src="' + d.file.dataUrl + '" type="application/pdf">'
        : '<div class="doc-viewer"><img src="' + d.file.dataUrl + '" alt="' + esc(d.name) + '"></div>')
      : '<p class="note">' + icon('info') + '<span>Aucun fichier n’a encore été déposé pour ce document.</span></p>';
    FP.modal({
      title: d.name, sub: q.fullName(s) + (d.file ? ' · ' + d.file.name + ' (' + Math.round(d.file.size / 1024) + ' Ko)' : ''), wide: true,
      body: body + (d.reason ? '<div class="doc-reason">' + icon('alert') + '<span>' + esc(d.reason) + '</span></div>' : ''),
      actions: [
        d.file ? { label: 'Télécharger', icon: 'download', onClick: () => { const a = document.createElement('a'); a.href = d.file.dataUrl; a.download = d.file.name || d.name; a.click(); return false; } } : null,
        d.status !== 'valide' && d.file ? { label: 'Valider', cls: 'btn-ok', icon: 'check', onClick: () => { act.reviewDoc(sid, did, 'valide'); FP.toast('Document validé. L’élève a été notifié.'); } } : null,
        d.file ? { label: 'Refuser', cls: 'btn-danger', icon: 'x', onClick: () => { setTimeout(() => M.refuseDoc(sid, did), 250); } } : null,
        { label: 'Fermer', cls: 'btn-dark' }
      ].filter(Boolean)
    });
  };

  M.refuseDoc = (sid, did) => {
    const d = q.doc(sid, did);
    FP.modal({
      title: 'Refuser le document', sub: d.name + ' · ' + q.fullName(q.student(sid)),
      body: '<label class="field"><span>Motif communiqué à l’élève</span><select class="select" id="dr-preset">' +
        ['Justificatif de domicile trop ancien. Merci d’en déposer un nouveau (moins de 3 mois).',
          'Document illisible. Merci de déposer une photo plus nette.',
          'Document incomplet : il manque une page.',
          'Document expiré. Merci de fournir un document en cours de validité.',
          'Autre motif (à préciser ci-dessous)'].map((x) => '<option>' + esc(x) + '</option>').join('') +
        '</select></label><label class="field"><span>Précision</span><textarea class="textarea" id="dr-text" placeholder="Message libre (remplace le motif si renseigné)"></textarea></label>',
      actions: [{ label: 'Annuler' }, { label: 'Refuser et notifier', cls: 'btn-danger', icon: 'x', onClick: (w) => {
        const free = w.querySelector('#dr-text').value.trim();
        act.reviewDoc(sid, did, 'refuse', free || w.querySelector('#dr-preset').value);
        FP.toast('Document refusé. L’élève a été notifié avec le motif.', 'info');
      } }]
    });
  };

  M.requestDoc = (sid) => {
    FP.modal({
      title: 'Demander un document', sub: q.fullName(q.student(sid)),
      body: '<label class="field"><span>Document demandé</span><input class="input" id="rd-name" list="rd-list" placeholder="Ex. : justificatif de domicile"><datalist id="rd-list">' +
        ['Pièce d’identité', 'Justificatif de domicile', 'Photo et signature numériques', 'ASSR 2', 'Attestation de recensement / JDC', 'Attestation d’hébergement', 'Autorisation parentale', 'Relevé d’identité bancaire'].map((x) => '<option>' + esc(x) + '</option>').join('') + '</datalist></label>',
      actions: [{ label: 'Annuler' }, { label: 'Demander', cls: 'btn-dark', icon: 'send', onClick: (w) => {
        const n = w.querySelector('#rd-name').value.trim();
        if (!n) { FP.toast('Indiquez le document demandé.', 'warn'); return false; }
        act.requestDoc(sid, n); FP.toast('Demande envoyée à l’élève.');
      } }]
    });
  };

  V.documents = (el) => {
    const all = [];
    db().students.forEach((s) => (s.docs || []).forEach((d) => all.push({ s, d })));
    const counts = { attente: 0, refuse: 0, manquant: 0, valide: 0 };
    all.forEach((x) => { counts[x.d.status === 'signe' ? 'valide' : x.d.status] = (counts[x.d.status === 'signe' ? 'valide' : x.d.status] || 0) + 1; });
    const list = all.filter((x) => st.docFilter === 'all' || x.d.status === st.docFilter || (st.docFilter === 'valide' && x.d.status === 'signe'));
    const tabs = [['attente', 'En attente', counts.attente], ['refuse', 'Refusés', counts.refuse], ['manquant', 'À fournir', counts.manquant], ['valide', 'Validés', counts.valide], ['all', 'Tous', all.length]];
    el.innerHTML =
      '<div class="page-head"><div><h2>Documents</h2><p>Pièces d’inscription déposées par les élèves et les parents.</p></div></div>' +
      '<div class="seg" style="flex-wrap:wrap;margin-bottom:16px">' + tabs.map((t) => '<button class="' + (st.docFilter === t[0] ? 'is-on' : '') + '" data-docfilter="' + t[0] + '">' + t[1] + ' <em style="font-style:normal;opacity:.6">' + t[2] + '</em></button>').join('') + '</div>' +
      (list.length ? '<div class="g g-2">' + list.map((x) => {
        const d = x.d;
        const thumb = d.file && d.file.type !== 'application/pdf' ? '<img src="' + d.file.dataUrl + '" alt="">' : icon(d.file ? 'file' : 'upload');
        return '<div class="doc-card"><span class="doc-thumb">' + thumb + '</span><div class="doc-main">' +
          '<div class="row-between"><strong>' + esc(d.name) + '</strong>' + docBadge(d) + '</div>' +
          '<button class="person" data-student="' + x.s.id + '" style="text-align:left">' + FP.avatar(x.s, 'sm') + '<div><strong>' + esc(q.fullName(x.s)) + '</strong><span>' + esc(q.formation(x.s.formation).title) + '</span></div></button>' +
          '<span class="muted">' + (d.uploadedAt ? 'Déposé ' + fmt.ago(d.uploadedAt).toLowerCase() : 'Pas encore déposé') + (d.file ? ' · ' + Math.round(d.file.size / 1024) + ' Ko' : '') + '</span>' +
          (d.reason ? '<div class="doc-reason">' + icon('alert') + '<span>' + esc(d.reason) + '</span></div>' : '') +
          '<div class="doc-actions">' +
          (d.file ? '<button class="btn btn-ghost btn-xs" data-viewdoc="' + x.s.id + '|' + d.id + '">' + icon('eye') + 'Consulter</button>' : '') +
          (d.file && d.status !== 'valide' ? '<button class="btn btn-ok btn-xs" data-okdoc="' + x.s.id + '|' + d.id + '">' + icon('check') + 'Valider</button>' : '') +
          (d.file && d.status !== 'refuse' ? '<button class="btn btn-danger btn-xs" data-kodoc="' + x.s.id + '|' + d.id + '">' + icon('x') + 'Refuser</button>' : '') +
          '<button class="btn btn-ghost btn-xs" data-reqdoc="' + x.s.id + '">' + icon('plus') + 'Demander</button>' +
          '</div></div></div>';
      }).join('') + '</div>' : '<div class="card"><p class="empty">Aucun document dans cette catégorie.</p></div>');
  };

  /* ======================================================================
     Paiements
     ====================================================================== */
  M.newPayment = (sid) => {
    FP.modal({
      title: 'Nouveau règlement', sub: 'Créer une somme à régler pour un élève.',
      body: '<div class="form-grid"><label class="field full"><span>Élève</span><select class="select" id="np-student">' +
        db().students.map((s) => '<option value="' + s.id + '" ' + (sid === s.id ? 'selected' : '') + '>' + esc(q.fullName(s)) + '</option>').join('') + '</select></label>' +
        '<label class="field full"><span>Libellé de la prestation</span><input class="input" id="np-label" list="np-presets" value="Forfait permis B"><datalist id="np-presets">' +
        ['Forfait permis B', 'Forfait conduite accompagnée', 'Forfait boîte automatique', 'Formation passerelle (7 h)', 'Heures supplémentaires de conduite', 'Frais de dossier', 'Présentation à l’examen', 'Forfait code de la route'].map((x) => '<option>' + esc(x) + '</option>').join('') + '</datalist></label>' +
        '<label class="field"><span>Montant TTC (€)</span><input class="input" id="np-amount" type="number" step="0.01" min="0" value="790"></label>' +
        '<label class="field"><span>Encaisser immédiatement</span><select class="select" id="np-now"><option value="">Non — en attente</option>' +
        Object.keys(METHODS).map((m) => '<option value="' + m + '">Oui — ' + METHODS[m] + '</option>').join('') + '</select></label></div>',
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer', cls: 'btn-dark', icon: 'check', onClick: (w) => {
        const amount = parseFloat(w.querySelector('#np-amount').value);
        if (!(amount > 0)) { FP.toast('Montant invalide.', 'warn'); return false; }
        const p = act.createPayment(w.querySelector('#np-student').value, w.querySelector('#np-label').value.trim() || 'Prestation', amount);
        const now = w.querySelector('#np-now').value;
        if (now) { act.payPayment(p.id, now); FP.toast('Paiement encaissé. Ticket généré.'); }
        else FP.toast('Règlement enregistré, en attente de paiement.');
      } }]
    });
  };

  M.collect = (pid) => {
    const p = q.payment(pid), s = q.student(p.student);
    const rest = (p.amountCts - p.paidCts) / 100;
    FP.modal({
      title: 'Encaisser un paiement', sub: q.fullName(s) + ' · ' + p.label,
      body: '<div class="card card-soft" style="padding:14px"><div class="row-between"><span class="muted">Reste à régler</span><span class="pay-amount">' + eur(p.amountCts - p.paidCts) + '</span></div></div>' +
        '<div class="form-grid"><label class="field"><span>Montant encaissé (€)</span><input class="input" id="cp-amount" type="number" step="0.01" min="0.01" value="' + rest.toFixed(2) + '"></label>' +
        '<label class="field"><span>Moyen de paiement</span><select class="select" id="cp-method">' + Object.keys(METHODS).map((m) => '<option value="' + m + '" ' + (m === 'especes' ? 'selected' : '') + '>' + METHODS[m] + '</option>').join('') + '</select></label></div>' +
        '<p class="note">' + icon('info') + '<span>Un ticket de caisse est généré automatiquement dès que le règlement est soldé.</span></p>',
      actions: [{ label: 'Annuler' }, { label: 'Encaisser', cls: 'btn-ok', icon: 'check', onClick: (w) => {
        const a = parseFloat(w.querySelector('#cp-amount').value);
        if (!(a > 0)) { FP.toast('Montant invalide.', 'warn'); return false; }
        act.payPayment(pid, w.querySelector('#cp-method').value, a);
        FP.toast('Paiement enregistré. L’élève a été notifié.');
      } }]
    });
  };

  M.ticket = (pid) => {
    const p = q.payment(pid);
    FP.modal({
      title: 'Ticket ' + (p.ticket ? p.ticket.no : '—'), sub: q.fullName(q.student(p.student)), wide: true,
      body: '<div class="ticket-preview">' + FP.ticketHTML(p) + '</div>',
      actions: [
        { label: 'Imprimer / PDF', cls: 'btn-dark', icon: 'download', onClick: () => { FP.printTickets([p]); return false; } },
        { label: 'Fermer', cls: 'btn-ghost' }
      ]
    });
  };

  M.offer = (sid) => {
    const s = q.student(sid);
    FP.modal({
      title: 'Envoyer une offre', sub: q.fullName(s) + ' · ' + q.formation(s.formation).title,
      body: '<div class="form-grid"><label class="field full"><span>Intitulé de l’offre</span><input class="input" id="of-label" value="Forfait ' + esc(q.formation(s.formation).title) + '"></label>' +
        '<label class="field"><span>Montant TTC (€)</span><input class="input" id="of-amount" type="number" step="0.01" min="0" value="790"></label></div>' +
        '<p class="note">' + icon('info') + '<span>L’élève reçoit l’offre dans son espace. Dès qu’il l’accepte, son inscription est confirmée et le règlement devient accessible.</span></p>',
      actions: [{ label: 'Annuler' }, { label: 'Envoyer l’offre', cls: 'btn-primary', icon: 'send', onClick: (w) => {
        const a = parseFloat(w.querySelector('#of-amount').value);
        if (!(a > 0)) { FP.toast('Montant invalide.', 'warn'); return false; }
        act.sendOffer(sid, w.querySelector('#of-label').value.trim() || 'Offre de formation', a);
        FP.toast('Offre envoyée à ' + s.first + '.');
      } }]
    });
  };

  V.paiements = (el) => {
    const all = q.payments().slice().sort((a, b) => (b.paidAt || b.createdAt).localeCompare(a.paidAt || a.createdAt));
    const list = all.filter((p) => st.payFilter === 'all' || p.status === st.payFilter);
    const due = all.filter((p) => p.status === 'attente' || p.status === 'partiel').reduce((t, p) => t + (p.amountCts - p.paidCts), 0);
    const cashed = all.reduce((t, p) => t + (p.status === 'rembourse' ? 0 : p.paidCts), 0);
    const tabs = [['all', 'Tous'], ['attente', 'En attente'], ['partiel', 'Partiels'], ['paye', 'Payés'], ['rembourse', 'Remboursés'], ['annule', 'Annulés']];
    el.innerHTML =
      '<div class="page-head"><div><h2>Paiements</h2><p>Règlements, encaissements et reçus des élèves.</p></div>' +
      '<div class="page-actions"><button class="btn btn-ghost" data-exportpay>' + icon('download') + 'Export CSV</button><button class="btn btn-dark" data-newpay>' + icon('plus') + 'Nouveau règlement</button></div></div>' +
      '<div class="acc-grid" style="margin-bottom:16px">' +
      '<div class="acc-tile hero"><span>Encaissé au total</span><strong>' + eur(cashed) + '</strong></div>' +
      '<div class="acc-tile"><span>Reste à encaisser</span><strong>' + eur(due) + '</strong></div>' +
      '<div class="acc-tile"><span>Règlements</span><strong>' + all.length + '</strong></div>' +
      '<div class="acc-tile"><span>Tickets émis</span><strong>' + all.filter((p) => p.ticket).length + '</strong></div></div>' +
      '<div class="seg" style="flex-wrap:wrap;margin-bottom:14px">' + tabs.map((t) => '<button class="' + (st.payFilter === t[0] ? 'is-on' : '') + '" data-payfilter="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Élève</th><th>Prestation</th><th>Montant</th><th>Réglé</th><th>Moyen</th><th>Statut</th><th>Date</th><th>Ticket</th><th></th></tr></thead><tbody>' +
      (list.map((p) => {
        const s = q.student(p.student);
        if (!s) return '';
        return '<tr><td>' + person(s, q.formation(s.formation).title) + '</td><td>' + esc(p.label) + '</td>' +
          '<td class="num">' + eur(p.amountCts) + '</td><td class="num">' + eur(p.paidCts) + '</td>' +
          '<td>' + (p.method ? esc(METHODS[p.method]) : '<span class="muted">—</span>') + '</td><td>' + payBadge(p) + '</td>' +
          '<td class="small">' + (p.paidAt ? fmt.dateLong(p.paidAt.slice(0, 10)) : '<span class="muted">—</span>') + '</td>' +
          '<td>' + (p.ticket ? '<button class="link-btn" data-ticket="' + p.id + '">' + esc(p.ticket.no) + '</button>' : '<span class="muted">—</span>') + '</td>' +
          '<td><div class="row" style="gap:6px">' +
          (p.status === 'attente' || p.status === 'partiel' ? '<button class="btn btn-ok btn-xs" data-collect="' + p.id + '">' + icon('check') + 'Encaisser</button>' : '') +
          (p.status === 'paye' ? '<button class="btn btn-ghost btn-xs" data-refund="' + p.id + '">' + icon('refresh') + 'Rembourser</button>' : '') +
          '</div></td></tr>';
      }).join('') || '<tr><td colspan="9"><p class="empty">Aucun règlement.</p></td></tr>') +
      '</tbody></table></div></div>';
  };

  /* ======================================================================
     Caisse — tickets
     ====================================================================== */
  V.caisse = (el) => {
    const tickets = q.payments().filter((p) => p.ticket).sort((a, b) => b.ticket.at.localeCompare(a.ticket.at));
    const today = D.todayISO();
    const todays = tickets.filter((p) => p.ticket.at.slice(0, 10) === today);
    const sum = (l) => l.reduce((t, p) => t + p.paidCts, 0);
    el.innerHTML =
      '<div class="page-head"><div><h2>Ticket de caisse</h2><p>Chaque paiement encaissé génère automatiquement un reçu numéroté.</p></div>' +
      '<div class="page-actions">' + (todays.length ? '<button class="btn btn-ghost" data-printday>' + icon('download') + 'Imprimer la journée</button>' : '') +
      '<button class="btn btn-dark" data-newpay>' + icon('plus') + 'Encaisser</button></div></div>' +
      '<div class="acc-grid" style="margin-bottom:18px">' +
      '<div class="acc-tile hero"><span>Caisse du jour</span><strong>' + eur(sum(todays)) + '</strong></div>' +
      '<div class="acc-tile"><span>Tickets aujourd’hui</span><strong>' + todays.length + '</strong></div>' +
      '<div class="acc-tile"><span>Tickets au total</span><strong>' + tickets.length + '</strong></div>' +
      '<div class="acc-tile"><span>Prochain n°</span><strong style="font-size:18px">FP-' + new Date().getFullYear() + '-' + String(db().counters.ticket + 1).padStart(4, '0') + '</strong></div></div>' +
      '<div class="g g-main"><div class="card"><div class="card-head"><span class="card-title">' + icon('list') + 'Tickets émis</span><span class="small muted">' + tickets.length + '</span></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>N° ticket</th><th>Date</th><th>Client</th><th>Prestation</th><th>Moyen</th><th>TTC</th><th></th></tr></thead><tbody>' +
      (tickets.map((p) => '<tr class="clickable" data-ticket="' + p.id + '"><td><b>' + esc(p.ticket.no) + '</b></td>' +
        '<td class="small">' + new Date(p.ticket.at).toLocaleDateString('fr-FR') + ' · ' + new Date(p.ticket.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') + '</td>' +
        '<td>' + esc(q.fullName(q.student(p.student) || { first: 'Élève', last: 'supprimé' })) + '</td><td>' + esc(p.label) + '</td>' +
        '<td>' + esc(METHODS[p.method] || '—') + '</td><td class="num"><b>' + eur(p.paidCts) + '</b></td>' +
        '<td><button class="btn btn-ghost btn-xs" data-ticket="' + p.id + '">' + icon('eye') + 'Voir</button></td></tr>').join('') ||
        '<tr><td colspan="7"><p class="empty">Aucun ticket émis pour le moment.</p></td></tr>') +
      '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('file') + 'Aperçu</span></div>' +
      (tickets[0] ? '<div class="ticket-preview">' + FP.ticketHTML(tickets[0]) + '</div><button class="btn btn-dark btn-block mt" data-ticket="' + tickets[0].id + '">' + icon('eye') + 'Ouvrir le dernier ticket</button>'
        : '<p class="empty">Le premier ticket apparaîtra ici.</p>') + '</div></div>';
  };

  /* ======================================================================
     Comptabilité et exports
     ====================================================================== */
  const currentRange = () => (st.period === 'perso' ? { from: st.from, to: st.to, label: 'Du ' + (st.from ? fmt.dateLong(st.from) : '…') + ' au ' + (st.to ? fmt.dateLong(st.to) : '…') } : q.periodRange(st.period));

  V.comptabilite = (el) => {
    const r = currentRange();
    const a = q.accounting(r.from, r.to);
    const periods = [['jour', 'Jour'], ['semaine', 'Semaine'], ['mois', 'Mois'], ['trimestre', 'Trimestre'], ['annee', 'Année'], ['perso', 'Personnalisée']];
    const methodRows = Object.keys(METHODS).filter((m) => a.byMethod[m] > 0);
    el.innerHTML =
      '<div class="page-head"><div><h2>Comptabilité</h2><p>Chiffre d’affaires, TVA et encaissements — ' + esc(r.label) + '.</p></div>' +
      '<div class="page-actions"><button class="btn btn-ghost" data-exportacc>' + icon('download') + 'Export CSV</button>' +
      '<button class="btn btn-dark" data-printperiod>' + icon('file') + 'Récapitulatif imprimable</button></div></div>' +
      '<div class="card" style="margin-bottom:16px"><div class="period-bar">' +
      '<div class="seg" style="flex-wrap:wrap">' + periods.map((p) => '<button class="' + (st.period === p[0] ? 'is-on' : '') + '" data-period="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>' +
      (st.period === 'perso' ? '<label class="field" style="flex-direction:row;align-items:center;gap:8px"><span>Du</span><input class="input input-sm" type="date" id="acc-from" value="' + esc(st.from) + '"></label>' +
        '<label class="field" style="flex-direction:row;align-items:center;gap:8px"><span>au</span><input class="input input-sm" type="date" id="acc-to" value="' + esc(st.to) + '"></label>' : '') +
      '<span class="small muted" style="margin-left:auto">' + a.count + ' encaissement(s)</span></div></div>' +
      '<div class="acc-grid">' +
      '<div class="acc-tile hero"><span>Chiffre d’affaires TTC</span><strong>' + eur(a.ttc) + '</strong></div>' +
      '<div class="acc-tile"><span>CA HT</span><strong>' + eur(a.ht) + '</strong></div>' +
      '<div class="acc-tile"><span>TVA ' + a.rate + ' %</span><strong>' + eur(a.tva) + '</strong></div>' +
      '<div class="acc-tile"><span>Reste à encaisser</span><strong>' + eur(a.pending) + '</strong></div>' +
      (a.refunded ? '<div class="acc-tile"><span>Remboursements</span><strong>' + eur(a.refunded) + '</strong></div>' : '') +
      '</div>' +
      '<div class="g g-main mt">' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('list') + 'Détail des encaissements</span><span class="small muted">' + esc(r.label) + '</span></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Ticket</th><th>Client</th><th>Prestation</th><th>Moyen</th><th>HT</th><th>TVA</th><th>TTC</th></tr></thead><tbody>' +
      (a.rows.map((p) => { const ht = Math.round(p.paidCts / (1 + p.tvaRate / 100)); return '<tr class="clickable" data-ticket="' + p.id + '"><td class="small">' + new Date(p.paidAt).toLocaleDateString('fr-FR') + '</td>' +
        '<td class="small">' + (p.ticket ? esc(p.ticket.no) : '—') + '</td><td>' + esc(q.fullName(q.student(p.student) || { first: '—', last: '' })) + '</td>' +
        '<td>' + esc(p.label) + '</td><td>' + esc(METHODS[p.method] || '—') + '</td><td class="num">' + eur(ht) + '</td><td class="num">' + eur(p.paidCts - ht) + '</td><td class="num"><b>' + eur(p.paidCts) + '</b></td></tr>'; }).join('') ||
        '<tr><td colspan="8"><p class="empty">Aucun encaissement sur cette période.</p></td></tr>') +
      '</tbody></table></div></div>' +
      '<div class="stack">' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('chart') + 'Par moyen de paiement</span></div><div class="acc-split">' +
      (methodRows.length ? methodRows.map((m) => '<div class="acc-line"><span>' + esc(METHODS[m]) + '</span>' + FP.bar(a.ttc ? (a.byMethod[m] / a.ttc) * 100 : 0, 'volt', METHODS[m]) + '<b>' + eur(a.byMethod[m]) + '</b></div>').join('')
        : '<p class="empty">Aucun encaissement.</p>') + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('info') + 'Pour votre comptable</span></div>' +
      '<div class="docs">' +
      [['Période', r.label], ['Nombre de ventes', a.count], ['Total HT', eur(a.ht)], ['TVA ' + a.rate + ' %', eur(a.tva)], ['Total TTC', eur(a.ttc)],
        ['Dont carte bancaire', eur(a.byMethod.cb + a.byMethod.applepay + a.byMethod.googlepay)], ['Dont espèces', eur(a.byMethod.especes)], ['Dont virement / chèque', eur(a.byMethod.virement + a.byMethod.cheque)]]
        .map((x) => '<div class="doc" style="padding:9px 0"><span class="doc-name" style="font-weight:600"><span>' + x[0] + '</span>' + x[1] + '</span></div>').join('') +
      '</div><button class="btn btn-ghost btn-block mt" data-exportacc>' + icon('download') + 'Télécharger le détail (CSV)</button></div>' +
      '</div></div>';
  };

  function exportAccounting() {
    const r = currentRange();
    const a = q.accounting(r.from, r.to);
    const rows = [['Flash PERMIS — récapitulatif ' + r.label], [],
      ['Date', 'Ticket', 'Référence', 'Client', 'Prestation', 'Moyen de paiement', 'Statut', 'Montant HT', 'TVA', 'Montant TTC']];
    a.rows.forEach((p) => {
      const ht = Math.round(p.paidCts / (1 + p.tvaRate / 100));
      const s = q.student(p.student) || { first: '—', last: '' };
      rows.push([new Date(p.paidAt).toLocaleDateString('fr-FR'), p.ticket ? p.ticket.no : '', p.ref, q.fullName(s), p.label,
        METHODS[p.method] || '', PS[p.status].label, (ht / 100).toFixed(2), ((p.paidCts - ht) / 100).toFixed(2), (p.paidCts / 100).toFixed(2)]);
    });
    rows.push([], ['Nombre de ventes', a.count], ['Total HT', (a.ht / 100).toFixed(2)], ['TVA ' + a.rate + ' %', (a.tva / 100).toFixed(2)], ['Total TTC', (a.ttc / 100).toFixed(2)]);
    Object.keys(METHODS).forEach((m) => { if (a.byMethod[m]) rows.push(['Dont ' + METHODS[m], (a.byMethod[m] / 100).toFixed(2)]); });
    FP.downloadCSV('flash-permis-compta-' + (r.from || 'debut') + '_' + (r.to || 'fin') + '.csv', rows);
    FP.toast('Export CSV téléchargé.');
  }

  function printPeriod() {
    const r = currentRange();
    const a = q.accounting(r.from, r.to);
    if (!a.rows.length) { FP.toast('Aucun encaissement sur cette période.', 'warn'); return; }
    FP.printTickets(a.rows, 'Flash PERMIS — ' + r.label + ' — ' + a.count + ' ticket(s) — Total TTC ' + eur(a.ttc));
  }

  /* ======================================================================
     Communications
     ====================================================================== */
  V.communications = (el) => {
    const box = q.outbox();
    const list = box.filter((m) => st.msgFilter === 'all' || m.channel === st.msgFilter);
    const tpls = db().templates;
    el.innerHTML =
      '<div class="page-head"><div><h2>Communications</h2><p>Messages déclenchés automatiquement et modèles modifiables.</p></div>' +
      '<div class="page-actions"><button class="btn btn-ghost" data-clearbox>' + icon('refresh') + 'Vider la boîte d’envoi</button></div></div>' +
      '<p class="note note-volt" style="margin-bottom:16px">' + icon('alert') + '<span><strong>Envoi réel non actif.</strong> Le site étant hébergé sans serveur, les messages sont préparés et listés ici. Seul l’e-mail de pré-inscription part réellement (Netlify Forms). Pour activer e-mails et SMS automatiques, un service d’envoi est nécessaire.</span></p>' +
      '<div class="g g-main"><div class="card"><div class="card-head"><span class="card-title">' + icon('send') + 'Boîte d’envoi</span>' +
      '<div class="seg">' + [['all', 'Tous'], ['email', 'E-mails'], ['sms', 'SMS']].map((t) => '<button class="' + (st.msgFilter === t[0] ? 'is-on' : '') + '" data-msgfilter="' + t[0] + '">' + t[1] + '</button>').join('') + '</div></div>' +
      '<div class="msgs">' + (list.slice(0, 40).map((m) => '<div class="msg"><span class="msg-ic msg-' + m.channel + '">' + icon(m.channel === 'sms' ? 'phone' : 'mail') + '</span>' +
        '<div class="msg-body"><div class="row-between"><strong>' + esc(m.subject || (m.channel === 'sms' ? 'SMS' : 'Message')) + '</strong>' + FP.badge(m.channel === 'sms' ? 'SMS' : 'E-mail', 'mute') + '</div>' +
        '<p class="muted">À ' + esc(m.who) + ' · ' + esc(m.to) + ' · ' + fmt.ago(m.at).toLowerCase() + '</p>' +
        '<p>' + esc(m.body) + '</p></div></div>').join('') || '<p class="empty">Aucun message. Les actions (paiement, document, créneau…) en génèrent automatiquement.</p>') + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('edit') + 'Modèles de messages</span><button class="link-btn" data-resettpl>Réinitialiser</button></div><div class="stack">' +
      Object.keys(tpls).map((k) => '<div class="tpl"><div class="tpl-main"><div class="row wrap" style="gap:6px"><strong>' + esc(tpls[k].label) + '</strong>' +
        (tpls[k].email ? FP.badge('E-mail', 'info', 'mail') : '') + (tpls[k].sms ? FP.badge('SMS', 'ok', 'phone') : '') + '</div>' +
        '<p>' + esc(tpls[k].body) + '</p></div><button class="btn btn-ghost btn-xs" data-edittpl="' + k + '">' + icon('edit') + 'Modifier</button></div>').join('') +
      '</div></div></div>';
  };

  M.editTemplate = (key) => {
    const t = db().templates[key];
    FP.modal({
      title: 'Modèle : ' + t.label, wide: true,
      body: '<div class="vars"><span class="small muted">Variables disponibles :</span>' +
        ['{prenom}', '{nom}', '{eleve}', '{formation}', '{moniteur}', '{montant}', '{creneau}', '{document}', '{motif}', '{ticket}', '{ancien}', '{nouveau}'].map((v) => '<code>' + v + '</code>').join('') + '</div>' +
        '<label class="field"><span>Objet de l’e-mail</span><input class="input" id="tp-subject" value="' + esc(t.subject) + '"></label>' +
        '<label class="field"><span>Message</span><textarea class="textarea" id="tp-body" style="min-height:180px">' + esc(t.body) + '</textarea></label>' +
        '<div class="toggles"><label class="switch"><input type="checkbox" id="tp-email" ' + (t.email ? 'checked' : '') + '><span class="switch-ui"></span>Envoyer par e-mail</label>' +
        '<label class="switch"><input type="checkbox" id="tp-sms" ' + (t.sms ? 'checked' : '') + '><span class="switch-ui"></span>Envoyer par SMS</label></div>',
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer', cls: 'btn-dark', icon: 'check', onClick: (w) => {
        act.updateTemplate(key, { subject: w.querySelector('#tp-subject').value, body: w.querySelector('#tp-body').value, email: w.querySelector('#tp-email').checked, sms: w.querySelector('#tp-sms').checked });
        FP.toast('Modèle enregistré.');
      } }]
    });
  };

  /* ======================================================================
     Réglages
     ====================================================================== */
  const unpaidLessonCount = () => q.payments().filter((p) => p.lessonId && p.status !== 'paye' && p.status !== 'annule').length;
  function ratePreview(rateCts) {
    return [[60, '1 h de conduite'], [90, '1 h 30'], [120, '2 h de conduite']]
      .map((d) => '<div class="rate-line"><span>' + d[1] + '</span><b>' + eur(Math.round(rateCts * (d[0] / 60))) + '</b></div>').join('');
  }

  V.reglages = (el) => {
    const a = db().auth, s = db().settings;
    el.innerHTML =
      '<div class="page-head"><div><h2>Réglages</h2><p>Accès à l’administration, TVA et données de démonstration.</p></div></div>' +
      '<div class="g g-2">' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('lock') + 'Code d’accès administrateur</span></div>' +
      '<p class="muted small">Ce code est demandé à l’ouverture de l’espace administrateur. Vous pouvez le modifier à tout moment, sans toucher au site.</p>' +
      '<form id="code-form" class="stack mt">' +
      '<label class="field"><span>Code actuel</span><input class="input" type="password" name="current" autocomplete="current-password" placeholder="••••••"></label>' +
      '<label class="field"><span>Nouveau code</span><input class="input" type="password" name="next" autocomplete="new-password" placeholder="Au moins 4 caractères"></label>' +
      '<label class="field"><span>Confirmer le nouveau code</span><input class="input" type="password" name="confirm" autocomplete="new-password"></label>' +
      '<button class="btn btn-dark" type="submit">' + icon('check') + 'Modifier le code</button></form>' +
      '<p class="small muted mt">' + (a.updatedAt ? 'Dernière modification : ' + fmt.ago(a.updatedAt).toLowerCase() + '.' : 'Code d’origine, jamais modifié.') + '</p>' +
      '<p class="note note-volt mt">' + icon('alert') + '<span><strong>Important :</strong> sur un site sans serveur, ce code est visible dans le code source par une personne avertie. Il protège des regards, pas d’une intrusion. Une vraie authentification nécessite un serveur.</span></p></div>' +
      '<div class="stack">' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('car') + 'Tarif des heures de conduite</span><span class="editable-tag">' + icon('edit') + 'Modifiable</span></div>' +
      '<form id="rate-form">' +
      '<label class="field"><span>Prix d’une heure de conduite (€ TTC)</span>' +
      '<input class="input" type="number" name="hourRate" id="rate-input" min="0" max="500" step="0.5" value="' + (s.hourRate / 100).toFixed(2) + '"></label>' +
      '<div class="rate-preview" id="rate-preview">' + ratePreview(s.hourRate) + '</div>' +
      '<button class="btn btn-dark btn-block mt" type="submit">' + icon('check') + 'Enregistrer le tarif</button></form>' +
      '<p class="note mt">' + icon('info') + '<span>Ce tarif s’applique à chaque heure de conduite réservée. Les leçons <b>déjà payées gardent leur montant</b> ; celles encore en attente de paiement sont recalculées automatiquement.</span></p>' +
      (unpaidLessonCount() ? '<p class="small muted" style="margin-top:6px">' + unpaidLessonCount() + ' leçon(s) en attente de paiement seront mises à jour.</p>' : '') +
      '</div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('trophy') + 'Facturation</span></div>' +
      '<form id="settings-form" class="form-grid">' +
      '<label class="field"><span>Taux de TVA appliqué (%)</span><input class="input" type="number" name="tvaRate" min="0" max="30" step="0.1" value="' + s.tvaRate + '"></label>' +
      '<label class="field"><span>Prochain n° de ticket</span><input class="input" type="number" name="ticket" min="0" value="' + db().counters.ticket + '"></label>' +
      '<div class="full"><button class="btn btn-dark" type="submit">' + icon('check') + 'Enregistrer</button></div></form>' +
      '<p class="small muted mt">Le taux de TVA s’applique aux nouveaux tickets. Vérifiez le taux applicable à votre activité avec votre comptable.</p></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('refresh') + 'Données de démonstration</span></div>' +
      '<p class="muted small">Les données sont enregistrées dans ce navigateur uniquement. La réinitialisation régénère un jeu complet et efface les saisies.</p>' +
      '<div class="row wrap mt"><button class="btn btn-ghost" data-exportall>' + icon('download') + 'Exporter les données (CSV)</button>' +
      '<button class="btn btn-danger" data-resetall>' + icon('refresh') + 'Réinitialiser la démonstration</button></div></div>' +
      '</div></div>';
  };

  /* ======================================================================
     Interactions
     ====================================================================== */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const one = (attr, fn) => { const b = t.closest('[' + attr + ']'); if (b) { fn(b.getAttribute(attr), b); return true; } return false; };

    if (one('data-docfilter', (v) => { st.docFilter = v; rerender(); })) return;
    if (one('data-payfilter', (v) => { st.payFilter = v; rerender(); })) return;
    if (one('data-msgfilter', (v) => { st.msgFilter = v; rerender(); })) return;
    if (one('data-period', (v) => {
      st.period = v;
      if (v === 'perso' && !st.from) { st.from = D.addDays(D.todayISO(), -30); st.to = D.todayISO(); }
      rerender();
    })) return;
    if (one('data-viewdoc', (v) => { const [sid, did] = v.split('|'); M.viewDoc(sid, did); })) return;
    if (one('data-okdoc', (v) => { const [sid, did] = v.split('|'); act.reviewDoc(sid, did, 'valide'); FP.toast('Document validé. L’élève a été notifié.'); })) return;
    if (one('data-kodoc', (v) => { const [sid, did] = v.split('|'); M.refuseDoc(sid, did); })) return;
    if (one('data-reqdoc', (v) => M.requestDoc(v))) return;
    if (one('data-newpay', () => M.newPayment())) return;
    if (one('data-collect', (v) => M.collect(v))) return;
    if (one('data-ticket', (v) => M.ticket(v))) return;
    if (one('data-offer', (v) => M.offer(v))) return;
    if (one('data-edittpl', (v) => M.editTemplate(v))) return;
    if (one('data-refund', (v) => {
      const p = q.payment(v);
      FP.modal({
        title: 'Rembourser', sub: q.fullName(q.student(p.student)) + ' · ' + eur(p.paidCts),
        body: '<label class="field"><span>Motif du remboursement</span><input class="input" id="rf-reason" placeholder="Ex. : arrêt de la formation"></label>',
        actions: [{ label: 'Annuler' }, { label: 'Enregistrer le remboursement', cls: 'btn-danger', icon: 'refresh', onClick: (w) => { act.setPaymentStatus(v, 'rembourse', w.querySelector('#rf-reason').value.trim()); FP.toast('Remboursement enregistré.', 'info'); } }]
      });
    })) return;

    if (t.closest('[data-exportacc]')) { exportAccounting(); return; }
    if (t.closest('[data-printperiod]')) { printPeriod(); return; }
    if (t.closest('[data-printday]')) {
      const today = D.todayISO();
      const list = q.payments().filter((p) => p.ticket && p.ticket.at.slice(0, 10) === today);
      FP.printTickets(list, 'Flash PERMIS — caisse du ' + fmt.dateLong(today));
      return;
    }
    if (t.closest('[data-exportpay]')) {
      const rows = [['Date', 'Ticket', 'Référence', 'Élève', 'Prestation', 'Montant TTC', 'Réglé', 'Moyen', 'Statut']];
      q.payments().forEach((p) => {
        const s = q.student(p.student) || { first: '—', last: '' };
        rows.push([(p.paidAt || p.createdAt).slice(0, 10), p.ticket ? p.ticket.no : '', p.ref, q.fullName(s), p.label,
          (p.amountCts / 100).toFixed(2), (p.paidCts / 100).toFixed(2), METHODS[p.method] || '', PS[p.status].label]);
      });
      FP.downloadCSV('flash-permis-paiements.csv', rows);
      FP.toast('Export CSV téléchargé.');
      return;
    }
    if (t.closest('[data-exportall]')) {
      const rows = [['Élève', 'Formation', 'Moniteur', 'Progression %', 'Heures effectuées', 'Code moyenne', 'Total dû', 'Total réglé', 'Reste']];
      db().students.forEach((s) => {
        const b = q.balance(s.id), h = q.hours(s.id), c = q.code(s.id);
        rows.push([q.fullName(s), q.formation(s.formation).title, q.instructor(s.instructor).first, q.progress(s.id).pct, h.done, c.count ? c.avg : '',
          (b.due / 100).toFixed(2), (b.paid / 100).toFixed(2), (b.rest / 100).toFixed(2)]);
      });
      FP.downloadCSV('flash-permis-eleves.csv', rows);
      FP.toast('Export CSV téléchargé.');
      return;
    }
    if (t.closest('[data-clearbox]')) { act.clearOutbox(); FP.toast('Boîte d’envoi vidée.', 'info'); return; }
    if (t.closest('[data-resettpl]')) { act.resetTemplates(); FP.toast('Modèles réinitialisés.', 'info'); return; }
    if (t.closest('[data-resetall]')) {
      FP.modal({
        title: 'Réinitialiser la démonstration', sub: 'Toutes les saisies seront effacées.',
        body: '<p class="note">' + icon('alert') + '<span>Élèves créés, documents déposés, paiements, tickets et historique seront supprimés et remplacés par le jeu de démonstration.</span></p>',
        actions: [{ label: 'Annuler' }, { label: 'Tout réinitialiser', cls: 'btn-danger', icon: 'refresh', onClick: () => { FP.store.reset(); FP.toast('Démonstration réinitialisée.'); } }]
      });
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'rate-input') {
      const prev = document.getElementById('rate-preview');
      const v = parseFloat(e.target.value);
      if (prev && v > 0) prev.innerHTML = ratePreview(Math.round(v * 100));
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'acc-from') { st.from = e.target.value; rerender(); }
    if (e.target.id === 'acc-to') { st.to = e.target.value; rerender(); }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'code-form') {
      e.preventDefault();
      const f = new FormData(e.target);
      const cur = f.get('current'), next = f.get('next').trim(), conf = f.get('confirm').trim();
      if (!q.checkAdminCode(cur)) { FP.toast('Code actuel incorrect.', 'warn'); return; }
      if (next.length < 4) { FP.toast('Le nouveau code doit contenir au moins 4 caractères.', 'warn'); return; }
      if (next !== conf) { FP.toast('Les deux codes ne correspondent pas.', 'warn'); return; }
      act.setAdminCode(next);
      try { sessionStorage.setItem('fp.admin.ok', '1'); } catch (err) { /* ignore */ }
      FP.toast('Code d’accès modifié. Il sera demandé à la prochaine ouverture.');
      e.target.reset();
    }
    if (e.target.id === 'rate-form') {
      e.preventDefault();
      const v = parseFloat(new FormData(e.target).get('hourRate'));
      if (!(v > 0) || v > 500) { FP.toast('Indiquez un tarif compris entre 1 et 500 €.', 'warn'); return; }
      const r = act.setHourRate(v);
      FP.toast('Tarif enregistré : ' + eur(Math.round(v * 100)) + ' de l’heure.' + (r.updated ? ' ' + r.updated + ' leçon(s) recalculée(s).' : ''));
      return;
    }
    if (e.target.id === 'settings-form') {
      e.preventDefault();
      const f = new FormData(e.target);
      db().settings.tvaRate = Math.max(0, Math.min(30, parseFloat(f.get('tvaRate')) || 0));
      db().counters.ticket = Math.max(0, parseInt(f.get('ticket'), 10) || 0);
      FP.store.save();
      FP.toast('Réglages enregistrés.');
    }
  });
})(window);
