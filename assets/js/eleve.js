/* ==========================================================================
   Flash PERMIS — Espace élève (démo : Lucas Martin)
   ========================================================================== */
(function () {
  'use strict';
  const { q, act, fmt, icon, esc, $, $$ } = FP;
  const V = FP.v, D = FP.date;
  const SID = 'lucas', TO = 'eleve:lucas';
  const me = () => q.student(SID);

  // État local de l'assistant de proposition de créneau
  const wiz = { step: 1, slot: null, duration: 60, msg: '', sent: null };

  /* ---------------- Tableau de bord ---------------- */
  function accueil(el) {
    const s = me(), p = q.progress(SID), c = q.code(SID);
    const next = q.upcoming(SID)[0];
    const last = q.lastComment(SID);
    const reqs = q.requestsOf(SID);
    const pend = reqs.filter((r) => r.status === 'en_attente');
    const counters = reqs.filter((r) => r.status === 'contre_proposition');
    const ins = q.instructor(s.instructor);
    const toRework = V.reworkList(SID);

    el.innerHTML =
      '<div class="page-head"><div><h2>Bonjour ' + esc(s.first) + ' 👋</h2><p>Voici où vous en êtes dans votre ' + esc(q.formation(s.formation).title.toLowerCase().replace('permis b', 'permis B')) + '.</p></div>' +
      '<div class="page-actions"><a class="btn btn-primary" href="#planning">' + icon('plus') + 'Proposer un créneau</a></div></div>' +

      counters.map((r) => '<div class="card mt-0" style="margin-bottom:16px;border-color:#c9d7ff;background:var(--info-bg)"><div class="row wrap"><span class="stat-ic info" style="margin:0">' + icon('swap') + '</span><div style="flex:1;min-width:200px"><strong>Flash PERMIS vous propose un autre créneau</strong><p class="small muted">' + fmt.dayCap(r.counter.date) + ' à ' + fmt.time(r.counter.start) + ' (au lieu du ' + fmt.day(r.date) + ' à ' + fmt.time(r.start) + ')</p></div><div class="row"><button class="btn btn-ok btn-sm" data-counter-yes="' + r.id + '">' + icon('check') + 'Accepter</button><button class="btn btn-ghost btn-sm" data-counter-no="' + r.id + '">Refuser</button></div></div></div>').join('') +

      '<div class="g g-4">' +
      '<a class="card card-dark span-2 hero-card" href="#progression">' + FP.ring(p.pct, { size: 132, stroke: 13, label: p.acquired + ' / ' + p.total, aria: 'des compétences maîtrisées' }) +
      '<div class="hero-body"><span class="card-kicker">Votre progression</span><h3>' + p.pct + ' % des compétences maîtrisées</h3>' + V.heroBlocks(SID) + '<span class="link-arrow" style="margin-top:14px">Voir mon livret ' + icon('arrow') + '</span></div></a>' +

      '<div class="card"><span class="stat-label">' + icon('calendar') + 'Prochaine conduite</span>' +
      (next ? '<p class="next-date mt">' + fmt.dayCap(next.date) + ' — ' + fmt.time(next.start) + '</p><div class="next-meta"><span>' + icon('user') + 'avec ' + esc(ins.first + ' ' + ins.last) + '</span><span>' + icon('route') + esc(next.theme) + '</span><span>' + icon('pin') + esc(next.meeting) + '</span></div>'
        : '<p class="muted mt">Aucune conduite planifiée.</p><a class="btn btn-dark btn-sm mt" href="#planning">Proposer un créneau</a>') +
      (pend.length ? '<p class="mt">' + FP.badge(pend.length + ' demande' + (pend.length > 1 ? 's' : '') + ' en attente', 'pending', 'clock') + '</p>' : '') + '</div>' +

      V.hoursCard(SID) + '</div>' +

      '<div class="g g-main mt">' +
      '<div class="stack">' +
      (last ? '<div class="card quote-card"><div class="card-head"><span class="card-title">' + icon('message') + 'Dernière remarque du moniteur</span><span class="small muted">' + fmt.relShort(last.date) + '</span></div>' +
        '<div class="remark">' + FP.avatar(ins, '', ins.color) + '<div><blockquote>« ' + esc(last.comment) + ' »</blockquote><p class="remark-meta">' + esc(ins.first) + ' · ' + esc(last.theme) + '</p></div></div></div>' : '') +
      (toRework ? '<div class="card"><div class="card-head"><span class="card-title">' + icon('alert') + 'À retravailler</span></div><div class="stack">' + toRework + '</div></div>' : '') +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('calendar') + 'Mes prochaines conduites</span><a class="link-arrow" href="#planning">Planning ' + icon('arrow') + '</a></div><div class="lessons">' +
      (q.upcoming(SID).slice(0, 3).map((l) => V.lessonRow(l)).join('') || '<p class="empty">Aucune leçon à venir.</p>') +
      pend.map((r) => '<div class="lesson">' + V.dateBlock(r.date) + '<div class="lesson-info"><strong>Créneau proposé</strong><span>' + fmt.relShort(r.date) + ' · ' + fmt.range(r.start, r.duration) + '</span></div><div class="lesson-side">' + FP.reqBadge('en_attente') + '</div></div>').join('') +
      '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('clock') + 'Dernières leçons</span><a class="link-arrow" href="#progression">Historique ' + icon('arrow') + '</a></div><div class="lessons">' + q.history(SID).slice(0, 3).map((l) => V.lessonRow(l)).join('') + '</div></div>' +
      '</div>' +

      '<div class="stack">' +
      '<a class="card" href="#code"><div class="card-head"><span class="card-title">' + icon('book') + 'Résultats du code</span>' + (c.delta >= 0 ? FP.badge('En progression', 'ok', 'trend') : FP.badge('À consolider', 'warn')) + '</div>' +
      '<div class="row-between"><div class="stat"><span class="stat-value">' + c.avg + '<small>/40</small></span><span class="stat-sub">Moyenne actuelle</span></div>' + FP.spark(c.scores.slice(-8), { w: 120, h: 44 }) + '</div>' +
      '<div class="mt">' + V.last5(SID) + '</div></a>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('route') + 'Prochaines étapes</span></div>' + V.steps(SID) +
      '<div class="next-step mt">' + icon('target') + '<span>Prochaine étape : <strong>' + esc(q.nextStep(SID).label.toLowerCase()) + '</strong></span></div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('bell') + 'Notifications</span><a class="link-arrow" href="#notifications">Tout voir ' + icon('arrow') + '</a></div><div class="feed">' + q.notifs(TO).slice(0, 4).map(FP.notifItem).join('') + '</div></div>' +
      '</div></div>';
  }

  /* ---------------- Livret de progression ---------------- */
  function progression(el) {
    const p = q.progress(SID);
    const rework = V.reworkList(SID);
    el.innerHTML =
      '<div class="card livret-hero">' + FP.ring(p.pct, { size: 150, stroke: 14, label: p.acquired + ' / ' + p.total }) +
      '<div class="stack"><span class="card-kicker">Votre progression</span><div><span class="big">' + p.pct + ' %</span><h2>des compétences maîtrisées</h2></div>' + V.legend(SID) +
      '<div class="next-step">' + icon('target') + '<span>Prochaine étape : <strong>' + esc(q.nextStep(SID).label.toLowerCase()) + '</strong></span></div></div></div>' +
      '<p class="note mt">' + icon('info') + '<span>Cette progression est un outil pédagogique. Flash PERMIS conserve la décision concernant la présentation à l’examen.</span></p>' +
      (rework ? '<div class="section-title"><h3>À retravailler</h3></div><div class="stack">' + rework + '</div>' : '') +
      '<div class="section-title"><h3>Compétences par étape</h3><span class="small muted">Mis à jour par votre moniteur après chaque leçon</span></div>' + V.blocks(SID) +
      '<div class="section-title"><h3>Historique des leçons</h3><span class="small muted">' + q.history(SID).length + ' leçons</span></div>' +
      '<div class="hist">' + q.history(SID).map((l) => V.histItem(l)).join('') + '</div>';
  }

  /* ---------------- Planning & créneaux ---------------- */
  function wizardHTML() {
    const s = me();
    const stepsBar = '<div class="wizard-steps">' + ['Mes disponibilités', 'Créneaux compatibles', 'Confirmation'].map((t, i) => '<span class="' + (wiz.step === i + 1 ? 'is-on' : wiz.step > i + 1 ? 'is-done' : '') + '"><b>' + (wiz.step > i + 1 ? '✓' : i + 1) + '</b>' + t + '</span>').join('') + '</div>';
    if (wiz.sent) {
      const r = FP.store.db.requests.find((x) => x.id === wiz.sent);
      const status = r ? r.status : 'en_attente';
      return '<div class="card" id="wizard"><div class="card-head"><span class="card-title">' + icon('send') + 'Proposition envoyée</span>' + FP.reqBadge(status) + '</div>' +
        (status === 'en_attente'
          ? '<div class="pending-box"><span class="pulse-ic">' + icon('clock') + '</span><div><strong>Demande envoyée — en attente de validation de Flash PERMIS.</strong><p>' + fmt.dayCap(r.date) + ' · ' + fmt.range(r.start, r.duration) + ' avec ' + esc(q.instructor(r.instructor).first) + '. Vous serez notifié dès la réponse de l’agence.</p></div></div>' +
            '<p class="note mt">' + icon('sparkles') + '<span><strong>Astuce démo :</strong> ouvrez l’<a href="admin.html#planning" style="text-decoration:underline">administration</a> ou l’<a href="moniteur.html#demandes" style="text-decoration:underline">espace moniteur</a> dans un autre onglet pour accepter, refuser ou proposer un autre créneau. Cet écran se mettra à jour en direct.</span></p>'
          : status === 'acceptee' ? '<div class="pending-box" style="background:var(--ok-bg);border-color:#bfe8cd"><span class="pulse-ic" style="background:var(--ok);color:#fff;animation:none">' + icon('check') + '</span><div><strong>Créneau confirmé par Flash PERMIS 🎉</strong><p style="color:var(--ok)">' + fmt.dayCap(r.date) + ' · ' + fmt.range(r.start, r.duration) + '. Il apparaît dans votre planning.</p></div></div>'
            : V.reqItem(r, { role: 'eleve', actions: r.status === 'contre_proposition' ? '<button class="btn btn-ok btn-sm" data-counter-yes="' + r.id + '">' + icon('check') + 'Accepter ce créneau</button><button class="btn btn-ghost btn-sm" data-counter-no="' + r.id + '">Refuser</button>' : '' })) +
        '<button class="btn btn-ghost mt" data-wiz="restart">' + icon('plus') + 'Proposer un autre créneau</button></div>';
    }
    let body = '';
    if (wiz.step === 1) {
      body = '<p class="muted small" style="margin-bottom:14px">Indiquez quand vous êtes disponible. Nous croisons vos disponibilités avec le planning de votre moniteur.</p>' +
        '<div class="avail-grid"><span></span>' + FP.ref.DAYS.map((d) => '<span class="ag-h">' + d.short + '</span>').join('') +
        FP.ref.PERIODS.map((p) => '<span class="ag-p">' + p.label + '<small>' + p.from + 'h – ' + p.to + 'h</small></span>' +
          FP.ref.DAYS.map((d) => { const on = (s.avail[d.n] || []).includes(p.id); return '<button class="ag-cell ' + (on ? 'is-on' : '') + '" data-av="' + d.n + ':' + p.id + '" aria-pressed="' + on + '" aria-label="' + d.label + ' ' + p.label + '">' + icon('check') + '</button>'; }).join('')).join('') +
        '</div><div class="row-between mt wrap"><span class="small muted">' + icon('info', '') + ' Enregistré automatiquement</span><button class="btn btn-dark" data-wiz="2">Voir les créneaux compatibles' + icon('arrow') + '</button></div>';
    } else if (wiz.step === 2) {
      const slots = q.compatibleSlots(SID, { duration: wiz.duration, days: 14 });
      const byDay = {};
      slots.forEach((x) => { (byDay[x.date] = byDay[x.date] || []).push(x); });
      const days = Object.keys(byDay).slice(0, 7);
      body = '<div class="row-between wrap" style="margin-bottom:14px"><p class="muted small">' + slots.length + ' créneaux potentiellement compatibles sur les 14 prochains jours.</p>' +
        '<div class="seg"><button class="' + (wiz.duration === 60 ? 'is-on' : '') + '" data-dur="60">1 h</button><button class="' + (wiz.duration === 120 ? 'is-on' : '') + '" data-dur="120">2 h</button></div></div>' +
        (days.length ? '<div class="slot-days">' + days.map((d) => '<div class="slot-day"><strong>' + fmt.dayCap(d) + '</strong><div class="slot-list">' +
          byDay[d].slice(0, 6).map((x) => { const on = wiz.slot && wiz.slot.date === x.date && wiz.slot.start === x.start; return '<button class="slot ' + (on ? 'is-on' : '') + '" data-slot="' + x.date + '|' + x.start + '">' + fmt.time(x.start) + '<small>' + fmt.dur(x.duration) + '</small></button>'; }).join('') + '</div></div>').join('') + '</div>'
          : '<p class="empty">Aucun créneau compatible. Ajoutez des disponibilités pour élargir la recherche.</p>') +
        '<div class="row-between mt wrap"><button class="btn btn-ghost" data-wiz="1">' + icon('left') + 'Mes disponibilités</button><button class="btn btn-dark" data-wiz="3" ' + (wiz.slot ? '' : 'disabled') + '>Continuer' + icon('arrow') + '</button></div>';
    } else {
      const ins = q.instructor(s.instructor);
      body = '<div class="card card-soft" style="padding:16px"><div class="row">' + V.dateBlock(wiz.slot.date, 'night') + '<div><strong style="font-size:17px">' + fmt.dayCap(wiz.slot.date) + '</strong><p class="muted small">' + fmt.range(wiz.slot.start, wiz.duration) + ' · avec ' + esc(ins.first + ' ' + ins.last) + ' · Départ de l’agence</p></div></div></div>' +
        '<label class="field mt"><span>Message pour l’agence <em class="hint">(facultatif)</em></span><textarea class="textarea" id="wiz-msg" placeholder="Ex. : je termine les cours à 16h30 ce jour-là.">' + esc(wiz.msg) + '</textarea></label>' +
        '<p class="note note-volt mt">' + icon('shield') + '<span>Votre créneau ne sera <strong>réservé qu’après validation</strong> par Flash PERMIS. L’agence peut l’accepter, le refuser ou vous proposer un autre horaire.</span></p>' +
        '<div class="row-between mt wrap"><button class="btn btn-ghost" data-wiz="2">' + icon('left') + 'Retour</button><button class="btn btn-primary" data-wiz="send">' + icon('send') + 'Envoyer ma proposition</button></div>';
    }
    return '<div class="card" id="wizard"><div class="card-head"><span class="card-title">' + icon('calendar') + 'Proposer un créneau de conduite</span></div>' + stepsBar + body + '</div>';
  }

  function planning(el) {
    const reqs = q.requestsOf(SID);
    const up = q.upcoming(SID);
    const cancelled = q.lessonsOf(SID).filter((l) => l.status === 'annulee' && l.date >= D.todayISO());
    el.innerHTML =
      '<div class="page-head"><div><h2>Planning & créneaux</h2><p>Proposez vos créneaux : Flash PERMIS valide chaque demande.</p></div></div>' +
      '<div class="g g-main">' +
      '<div class="stack">' + wizardHTML() + '</div>' +
      '<div class="stack">' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('checkCircle') + 'Conduites confirmées</span><span class="badge badge-mute">' + up.length + '</span></div><div class="lessons">' +
      (up.map((l) => V.lessonRow(l)).join('') || '<p class="empty">Aucune conduite confirmée.</p>') +
      cancelled.map((l) => V.lessonRow(l)).join('') + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('inbox') + 'Mes demandes</span></div><div class="stack">' +
      (reqs.filter((r) => r.status !== 'annulee').map((r) => V.reqItem(r, {
        role: 'eleve', history: true,
        actions: r.status === 'en_attente' ? '<button class="btn btn-ghost btn-xs" data-cancel="' + r.id + '">Annuler la demande</button>' :
          r.status === 'contre_proposition' ? '<button class="btn btn-ok btn-sm" data-counter-yes="' + r.id + '">' + icon('check') + 'Accepter</button><button class="btn btn-ghost btn-sm" data-counter-no="' + r.id + '">Refuser</button>' : ''
      })).join('') || '<p class="empty">Aucune demande.</p>') +
      '</div></div>' +
      '<div class="card card-soft"><p class="small muted">' + icon('info', '') + ' Pour annuler une leçon confirmée, contactez directement l’agence Flash PERMIS.</p></div>' +
      '</div></div>';
  }

  /* ---------------- Code ---------------- */
  function code(el) {
    const c = q.code(SID);
    el.innerHTML =
      '<div class="page-head"><div><h2>Mes résultats</h2><p>Suivez vos révisions du code série après série.</p></div>' +
      '<div class="page-actions"><button class="btn btn-primary" data-add-code>' + icon('plus') + 'Enregistrer une série</button></div></div>' +
      V.codeStats(SID) +
      '<div class="g g-main mt">' +
      '<div class="stack"><div class="card"><div class="card-head"><span class="card-title">' + icon('chart') + 'Évolution de mes résultats</span><span class="small muted">' + c.count + ' séries</span></div><div id="code-chart"></div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('list') + 'Mes 5 derniers résultats</span></div>' + V.last5(SID) + '</div>' +
      V.codeMessage(SID) + '</div>' +
      '<div class="stack">' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('target') + 'Objectif</span></div><p style="font-weight:700">Obtenir 35/40 ou plus de manière régulière.</p>' +
      '<div class="mt">' + FP.bar((c.goalHits / 5) * 100, c.goalHits >= 4 ? 'ok' : 'volt', 'Objectif') + '</div><p class="small muted" style="margin-top:8px">Objectif atteint sur <b style="color:var(--ink)">' + c.goalHits + ' des 5</b> dernières séries</p></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('flame') + 'Régularité</span><span class="small muted">' + c.regular + ' j / 7</span></div>' + V.activity(SID) + '</div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('grid') + 'Progression par thème</span></div>' + V.themes(SID) + '</div>' +
      '</div></div>';
    FP.lineChart($('#code-chart'), c.series, { min: 15, max: 40, goal: 35, ticks: [15, 20, 25, 30, 35, 40], height: 260, aria: 'Évolution de mes résultats au code' });
  }

  /* ---------------- Dossier ---------------- */
  function documents(el) {
    const s = me(), ins = q.instructor(s.instructor), par = q.parentsOf(SID);
    el.innerHTML =
      '<div class="page-head"><div><h2>Mon dossier</h2><p>Vos informations et documents d’inscription.</p></div>' +
      '<div class="page-actions"><button class="btn btn-dark" data-upload>' + icon('upload') + 'Déposer un document</button></div></div>' +
      '<div class="g g-main-r">' +
      '<div class="stack"><div class="card"><div class="row" style="margin-bottom:14px">' + FP.avatar(s, 'lg', 'blue') + '<div><strong style="font-size:18px">' + esc(q.fullName(s)) + '</strong><p class="small muted">' + q.age(s) + ' ans · élève depuis le ' + fmt.dateLong(s.joined) + '</p></div></div>' +
      '<div class="docs">' +
      [['cap', 'Formation', q.formation(s.formation).title], ['wheel', 'Moniteur référent', ins.first + ' ' + ins.last], ['shield', 'Numéro NEPH', s.neph], ['building', 'Agence', 'Flash PERMIS · Gardanne'], ['heart', 'Accès parents', par.length ? par.map((p) => p.first + ' ' + p.last + ' (' + p.relation.toLowerCase() + ')').join(', ') : 'Aucun']]
        .map((r) => '<div class="doc"><span class="doc-ic">' + icon(r[0]) + '</span><span class="doc-name"><span>' + r[1] + '</span>' + esc(r[2]) + '</span></div>').join('') +
      '</div></div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('file') + 'Documents</span><span class="small muted">' + s.docs.filter((d) => d.status === 'valide' || d.status === 'signe').length + '/' + s.docs.length + ' validés</span></div><div class="docs">' +
      s.docs.map((d) => '<div class="doc"><span class="doc-ic">' + icon('file') + '</span><span class="doc-name">' + esc(d.name) + '</span>' + V.docStatus(d.status) + '</div>').join('') +
      '<div class="doc"><span class="doc-ic">' + icon('clipboard') + '</span><span class="doc-name">Livret d’apprentissage<span>Version digitale : votre livret de progression</span></span><a class="btn btn-ghost btn-xs" href="#progression">Ouvrir</a></div>' +
      '</div></div></div>';
  }

  /* ---------------- Notifications ---------------- */
  function notifications(el) {
    const list = q.notifs(TO);
    el.innerHTML = '<div class="page-head"><div><h2>Notifications</h2><p>' + q.unread(TO) + ' non lue(s)</p></div><div class="page-actions"><button class="btn btn-ghost" data-readall>' + icon('check') + 'Tout marquer comme lu</button></div></div>' +
      '<div class="card"><div class="feed">' + (list.map(FP.notifItem).join('') || '<p class="empty">Aucune notification.</p>') + '</div></div>';
  }

  /* ---------------- Coquille ---------------- */
  const shell = FP.shell({
    role: 'eleve', page: 'eleve.html', roleLabel: 'Espace élève', roleIcon: 'user',
    user: { first: 'Lucas', last: 'Martin', sub: 'Permis B · Gardanne', color: 'blue' },
    notifTo: TO,
    nav: [
      { id: 'accueil', label: 'Tableau de bord', short: 'Accueil', icon: 'home' },
      { id: 'progression', label: 'Mon livret de progression', short: 'Livret', icon: 'clipboard' },
      { id: 'planning', label: 'Planning & créneaux', short: 'Planning', icon: 'calendar', badge: () => q.requestsOf(SID).filter((r) => r.status === 'contre_proposition').length },
      { id: 'code', label: 'Suivi du code', short: 'Code', icon: 'book' },
      { id: 'documents', label: 'Mon dossier', short: 'Dossier', icon: 'file' },
      { id: 'notifications', label: 'Notifications', short: 'Alertes', icon: 'bell', badge: () => q.unread(TO) }
    ],
    tabs: ['accueil', 'progression', 'planning', 'code', 'notifications'],
    sideFoot: V.agencyCard(),
    views: { accueil, progression, planning, code, documents, notifications }
  });

  /* ---------------- Interactions ---------------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const av = t.closest('[data-av]');
    if (av) {
      const [d, p] = av.dataset.av.split(':'); const s = me(); const cur = (s.avail[d] || []).slice();
      const i = cur.indexOf(p); if (i >= 0) cur.splice(i, 1); else cur.push(p);
      const next = Object.assign({}, s.avail); next[d] = cur; wiz.slot = null;
      act.setAvailability(SID, next); return;
    }
    const w = t.closest('[data-wiz]');
    if (w) {
      const k = w.dataset.wiz;
      if (k === 'send') {
        wiz.msg = ($('#wiz-msg') || {}).value || '';
        const conflict = q.conflict(me().instructor, SID, wiz.slot.date, wiz.slot.start, wiz.duration);
        if (conflict) { FP.toast('Ce créneau n’est plus disponible : ' + conflict + '.', 'warn'); wiz.step = 2; wiz.slot = null; shell.render(true); return; }
        const r = act.proposeSlot(SID, Object.assign({}, wiz.slot, { duration: wiz.duration }), wiz.msg);
        wiz.sent = r.id; wiz.step = 1; wiz.slot = null; wiz.msg = '';
        FP.toast('Demande envoyée — en attente de validation de Flash PERMIS.');
        shell.render(true); return;
      }
      if (k === 'restart') { wiz.sent = null; wiz.step = 1; shell.render(true); return; }
      if (k === '3') wiz.msg = wiz.msg || '';
      if (k === '2' && $('#wiz-msg')) wiz.msg = $('#wiz-msg').value;
      wiz.step = +k; shell.render(true);
      const wz = $('#wizard'); if (wz && wz.getBoundingClientRect().top < 60) wz.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const dur = t.closest('[data-dur]');
    if (dur) { wiz.duration = +dur.dataset.dur; wiz.slot = null; shell.render(true); return; }
    const sl = t.closest('[data-slot]');
    if (sl) { const [date, start] = sl.dataset.slot.split('|'); wiz.slot = { date, start, instructor: me().instructor }; shell.render(true); return; }
    const cy = t.closest('[data-counter-yes]');
    if (cy) { act.answerCounter(cy.dataset.counterYes, true); FP.toast('Créneau confirmé ! Il apparaît dans votre planning.'); return; }
    const cn = t.closest('[data-counter-no]');
    if (cn) { act.answerCounter(cn.dataset.counterNo, false); FP.toast('Proposition refusée. Vous pouvez proposer un autre créneau.', 'info'); return; }
    const ca = t.closest('[data-cancel]');
    if (ca) { act.cancelRequest(ca.dataset.cancel); FP.toast('Demande annulée.', 'info'); return; }
    if (t.closest('[data-readall]')) { act.markRead(TO); return; }
    if (t.closest('[data-add-code]')) {
      FP.modal({
        title: 'Enregistrer une série de code', sub: 'Saisissez votre score sur 40.',
        body: '<label class="field"><span>Score obtenu</span><input class="input" id="code-score" type="number" min="0" max="40" value="37" inputmode="numeric"></label><p class="note">' + icon('info') + '<span>Dans la version finale, les résultats peuvent aussi être importés depuis l’outil d’entraînement utilisé par l’agence.</span></p>',
        actions: [{ label: 'Annuler' }, { label: 'Enregistrer', cls: 'btn-primary', icon: 'check', onClick: (m) => { const v = Math.round(+m.querySelector('#code-score').value); if (!(v >= 0 && v <= 40)) { FP.toast('Le score doit être compris entre 0 et 40.', 'warn'); return false; } act.addCodeResult(SID, v); FP.toast('Nouveau résultat enregistré : ' + v + '/40.'); } }]
      });
      return;
    }
    if (t.closest('[data-upload]')) {
      FP.modal({
        title: 'Déposer un document', sub: 'Le document sera vérifié par le secrétariat Flash PERMIS.',
        body: '<label class="field"><span>Type de document</span><select class="select" id="doc-type"><option>Justificatif de domicile (mise à jour)</option><option>Attestation d’hébergement</option><option>Autorisation parentale</option><option>Autre document</option></select></label><label class="field"><span>Fichier</span><input class="input" type="file" accept="image/*,.pdf"></label>',
        actions: [{ label: 'Annuler' }, { label: 'Envoyer', cls: 'btn-primary', icon: 'upload', onClick: (m) => { act.addDoc(SID, m.querySelector('#doc-type').value); FP.toast('Document envoyé. Il est en cours de vérification.'); } }]
      });
    }
  });
})();
