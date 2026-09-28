/* ==========================================================================
   Flash PERMIS — Espace moniteur (démo : Julien R.) — pensé pour le téléphone
   ========================================================================== */
(function () {
  'use strict';
  const { q, act, fmt, icon, esc, $ } = FP;
  const V = FP.v, D = FP.date;
  const IID = 'julien', TO = 'moniteur:julien';
  const ins = () => q.instructor(IID);
  let day = D.todayISO();
  let search = '';

  /* État du parcours « fin de leçon » */
  const flow = { key: null, step: 1, skills: {}, comment: '', diffs: [], share: true, showAll: false, result: null };
  const resetFlow = (key) => Object.assign(flow, { key, step: 1, skills: {}, comment: '', diffs: [], share: true, showAll: false, result: null });

  const QUICK = ['Bonne progression.', 'Très bonne leçon, continuez ainsi.', 'Continuez à travailler les contrôles avant changement de direction.', 'Anticipez davantage les intersections.', 'Gagnez en fluidité sur les manœuvres.', 'Bonne gestion du stress aujourd’hui.'];
  const DIFFS = ['Stress', 'Contrôles / rétroviseurs', 'Priorités', 'Manœuvres', 'Allure adaptée', 'Trajectoire', 'Anticipation'];

  /* ---------------- Planning ---------------- */
  function planning(el) {
    const todo = FP.store.db.lessons.filter((l) => l.instructor === IID && l.status === 'a_completer');
    const lessons = q.lessonsOn(day, IID);
    const start = D.addDays(D.todayISO(), -1);
    const week = Array.from({ length: 7 }, (_, i) => D.addDays(start, i));
    const pend = q.pendingRequests(IID).length;
    el.innerHTML =
      '<div class="m-hello"><div><h2>Bonjour ' + esc(ins().first) + '</h2><p>' + fmt.dayCap(D.todayISO()) + ' · ' + q.lessonsOn(D.todayISO(), IID).length + ' leçon(s) aujourd’hui</p></div>' + FP.avatar(ins(), 'lg', ins().color) + '</div>' +
      (todo.length ? todo.map((l) => { const s = q.student(l.student); return '<div class="todo-card">' + FP.skillBadge('retravailler') + '<div><strong>Livret à compléter · ' + esc(s.first) + '</strong><span>' + fmt.relShort(l.date) + ' ' + fmt.time(l.start) + ' · ' + esc(l.theme) + '</span></div><a class="btn btn-dark btn-sm" href="#fin/' + l.id + '">' + icon('edit') + 'Compléter</a></div>'; }).join('') : '') +
      (pend ? '<a class="todo-card" href="#demandes" style="background:var(--volt-wash);border-color:#f7e59a"><span class="sk" style="background:var(--volt)">' + icon('calendar') + '</span><div><strong>' + pend + ' demande(s) de créneau</strong><span style="color:var(--pending)">En attente de votre réponse</span></div>' + icon('right', 'chev') + '</a>' : '') +
      '<div class="week-strip" role="tablist" aria-label="Jours">' + week.map((d) => { const n = q.lessonsOn(d, IID).length; return '<button role="tab" aria-selected="' + (d === day) + '" class="' + (d === day ? 'is-on ' : '') + (d === D.todayISO() ? 'today' : '') + '" data-day="' + d + '">' + D.parse(d).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '') + '<b>' + D.parse(d).getDate() + '</b><em>' + (n ? n + ' leç.' : '—') + '</em></button>'; }).join('') + '</div>' +
      '<div class="section-title" style="margin-top:0"><h3>' + fmt.rel(day) + '</h3><span class="small muted">' + lessons.length + ' leçon(s) · ' + fmt.hours(lessons.reduce((t, l) => t + l.duration, 0) / 60) + '</span></div>' +
      (lessons.length ? lessons.map((l) => {
        const s = q.student(l.student);
        const badge = (l.status === 'a_completer' ? FP.badge('Livret à compléter', 'warn', 'edit') : l.status === 'terminee' ? FP.badge('Terminée', 'ok', 'check') : '') + V.payBadge(l);
        return '<a class="m-lesson ' + (l.status === 'terminee' ? 'is-done' : '') + '" href="#lecon/' + l.id + '"><span class="m-time"><b>' + fmt.time(l.start) + '</b><span>' + fmt.dur(l.duration) + '</span></span><span class="m-body"><strong>' + esc(q.fullName(s)) + '</strong><span>' + esc(l.theme) + '</span><span class="row" style="gap:6px;margin-top:4px">' + FP.badge(q.progress(s.id).pct + ' %', 'mute', 'trend') + badge + '</span></span>' + icon('right', 'chev') + '</a>';
      }).join('') : '<div class="card"><p class="empty">' + (q.isAbsent(IID, day) ? 'Absence enregistrée ce jour-là.' : 'Aucune leçon ce jour-là.') + '</p></div>');
  }

  /* ---------------- Détail d'une leçon ---------------- */
  function lecon(el, id) {
    const l = FP.store.db.lessons.find((x) => x.id === id);
    if (!l) { location.hash = '#planning'; return; }
    const s = q.student(l.student), p = q.progress(s.id), last = q.lastComment(s.id), h = q.hours(s.id);
    el.innerHTML =
      '<a class="link-arrow" href="#planning" style="margin-bottom:14px">' + icon('left') + 'Planning</a>' +
      '<div class="card"><div class="row" style="margin-bottom:14px">' + FP.avatar(s, 'lg') + '<div style="flex:1;min-width:0"><strong style="font-size:19px">' + esc(q.fullName(s)) + '</strong><p class="small muted">' + esc(q.formation(s.formation).title) + ' · ' + q.age(s) + ' ans</p></div>' + FP.ring(p.pct, { size: 64, stroke: 7 }) + '</div>' +
      '<div class="docs">' +
      '<div class="doc"><span class="doc-ic">' + icon('clock') + '</span><span class="doc-name"><span>Horaire</span>' + fmt.dayCap(l.date) + ' · ' + fmt.range(l.start, l.duration) + '</span></div>' +
      '<div class="doc"><span class="doc-ic">' + icon('route') + '</span><span class="doc-name"><span>Objectif</span>' + esc(l.theme) + '</span></div>' +
      '<div class="doc"><span class="doc-ic">' + icon('pin') + '</span><span class="doc-name"><span>Rendez-vous</span>' + esc(l.meeting) + '</span></div>' +
      '<div class="doc"><span class="doc-ic">' + icon('car') + '</span><span class="doc-name"><span>Heures effectuées</span>' + fmt.hours(h.done) + ' / ' + h.contract + ' h</span></div>' +
      '</div></div>' +
      (function () {
        const st = q.lessonPayStatus(l);
        if (!st) return '';
        const pay = q.ensureLessonPayment(l);
        return '<div class="card mt"><div class="card-head"><span class="card-title">' + icon('trophy') + 'Paiement de la leçon</span>' + FP.badge(st.label, st.tone, st.icon) + '</div>' +
          '<div class="docs">' +
          '<div class="doc"><span class="doc-ic">' + icon('trophy') + '</span><span class="doc-name"><span>Montant</span>' + FP.money.eur(pay.amountCts) + '</span></div>' +
          '<div class="doc"><span class="doc-ic">' + icon('lock') + '</span><span class="doc-name"><span>Moyen choisi</span>' + esc(pay.method ? FP.pay.METHODS[pay.method] : 'Non choisi') + '</span></div>' +
          '</div>' +
          (st.key === 'paye'
            ? '<div class="note mt" style="background:var(--ok-bg);border-color:#bfe8cd;color:var(--ok)">' + icon('checkCircle') + '<span><b>Payée</b> le ' + fmt.dateLong((pay.paidAt || '').slice(0, 10)) + '.</span></div>'
            : '<button class="btn btn-ok btn-block mt" data-cashlesson="' + l.id + '">' + icon('check') + 'Marquer le paiement comme effectué</button>') +
          '</div>';
      })() +
      (V.reworkList(s.id) ? '<div class="stack mt">' + V.reworkList(s.id) + '</div>' : '') +
      (last ? '<div class="card mt"><span class="card-kicker">Dernière remarque</span><p style="font-weight:600;margin-top:6px">« ' + esc(last.comment) + ' »</p><p class="small muted" style="margin-top:4px">' + fmt.relShort(last.date) + ' · ' + esc(last.theme) + '</p></div>' : '') +
      '<div class="stack mt">' +
      (l.status === 'terminee' ? '<div class="note">' + icon('checkCircle') + '<span>Leçon terminée, livret mis à jour.</span></div>'
        : '<a class="btn btn-primary btn-lg btn-block" href="#fin/' + l.id + '">' + icon('clipboard') + (l.status === 'a_completer' ? 'Compléter le livret' : 'Terminer la leçon') + '</a>') +
      '<a class="btn btn-ghost btn-lg btn-block" href="#eleve/' + s.id + '">' + icon('user') + 'Ouvrir le dossier de ' + esc(s.first) + '</a>' +
      (l.status === 'confirmee' ? '<button class="btn btn-ghost btn-lg btn-block" data-movem="' + l.id + '">' + icon('swap') + 'Déplacer la leçon</button>' : '') + '</div>';
  }

  /* ---------------- Fin de leçon / mise à jour du livret ---------------- */
  function flowView(el, key, withLesson) {
    const l = withLesson ? FP.store.db.lessons.find((x) => x.id === key) : null;
    const sid = l ? l.student : key;
    const s = q.student(sid);
    if (!s || (withLesson && !l)) { location.hash = '#planning'; return; }
    if (flow.key !== (withLesson ? 'l:' : 's:') + key) resetFlow((withLesson ? 'l:' : 's:') + key);
    const cur = q.skills(sid);
    const eff = (k) => flow.skills[k] || (cur[k.id || k] && cur[k.id || k].s) || 'non_aborde';
    const title = withLesson ? 'Fin de leçon · ' + s.first : 'Livret de ' + s.first;
    const steps = 3;

    if (flow.result) {
      const r = flow.result;
      el.innerHTML = '<div class="flow"><div class="success-box"><span class="success-ic">' + icon('check') + '</span><h2 style="font-size:24px">Livret mis à jour</h2>' +
        '<div class="delta"><span>' + r.before + ' %</span>' + icon('arrow') + '<span>' + r.after + ' %</span></div>' +
        (r.newly.length ? '<div class="chips" style="justify-content:center">' + r.newly.map((n) => '<span class="tag tag-ok">' + icon('check') + esc(n) + '</span>').join('') + '</div>' : '') +
        '<p class="muted">' + esc(s.first) + (q.parentsOf(sid).some((p) => p.access) ? ' et ses parents ont été notifiés.' : ' a été notifié.') + '</p>' +
        '<div class="stack" style="width:100%;max-width:360px;margin-top:8px"><a class="btn btn-dark btn-lg btn-block" href="#planning">Retour au planning</a><a class="btn btn-ghost btn-block" href="eleve.html#progression" target="_blank" rel="noopener">' + icon('external') + 'Voir côté élève</a><a class="btn btn-ghost btn-block" href="parent.html" target="_blank" rel="noopener">' + icon('external') + 'Voir côté parents</a></div></div></div>';
      return;
    }

    let body = '';
    if (flow.step === 1) {
      const list = FP.ref.SKILLS.filter((k) => flow.showAll || cur[k.id].s !== 'acquis' || flow.skills[k.id] || (l && (l.worked || []).includes(k.id)));
      const blockName = (b) => FP.ref.BLOCKS.find((x) => x.id === b).title;
      body = '<div class="tri-legend"><span>' + icon('check') + 'Maîtrisée</span><span>' + icon('half') + 'En cours</span><span>' + icon('alert') + 'À retravailler</span></div>' +
        list.map((k) => {
          const e = eff(k.id), changed = !!flow.skills[k.id];
          return '<div class="sk-row ' + (changed ? 'changed' : '') + '"><span class="sk-row-label">' + esc(k.label) + '<small>' + esc(blockName(k.b)) + (changed ? ' · modifiée' : '') + '</small></span><span class="tri" role="group" aria-label="' + esc(k.label) + '">' +
            [['acquis', 'check', 'Maîtrisée'], ['en_cours', 'half', 'En cours'], ['retravailler', 'alert', 'À retravailler']].map((b) => '<button class="' + (e === b[0] ? 'on-' + b[0] : '') + '" data-tri="' + k.id + ':' + b[0] + '" aria-pressed="' + (e === b[0]) + '" aria-label="' + b[2] + '">' + icon(b[1]) + '</button>').join('') + '</span></div>';
        }).join('') +
        '<button class="btn btn-ghost btn-sm" data-showall>' + icon(flow.showAll ? 'eye' : 'plus') + (flow.showAll ? 'Masquer les compétences maîtrisées' : 'Afficher toutes les compétences') + '</button>';
    } else if (flow.step === 2) {
      body = '<label class="field"><span>Remarque pour l’élève</span><textarea class="textarea" id="fl-comment" placeholder="Un conseil clair pour la prochaine leçon…">' + esc(flow.comment) + '</textarea></label>' +
        '<span class="label">Phrases rapides</span><div class="quick-chips">' + QUICK.map((t, i) => '<button class="chip" data-quick="' + i + '">' + icon('plus') + esc(t) + '</button>').join('') + '</div>' +
        '<span class="label" style="margin-top:6px">Difficultés rencontrées</span><div class="quick-chips">' + DIFFS.map((d) => '<button class="chip ' + (flow.diffs.includes(d) ? 'is-on' : '') + '" data-diff="' + esc(d) + '" aria-pressed="' + flow.diffs.includes(d) + '">' + esc(d) + '</button>').join('') + '</div>' +
        (withLesson ? '<label class="switch" style="margin-top:8px"><input type="checkbox" id="fl-share" ' + (flow.share ? 'checked' : '') + '><span class="switch-ui"></span>Partager la remarque avec les parents</label>' : '');
    } else {
      const changes = Object.keys(flow.skills);
      const before = q.progress(sid).pct;
      const after = Math.round((FP.ref.SKILLS.filter((k) => eff(k.id) === 'acquis').length / FP.ref.SKILLS.length) * 100);
      const lab = (k) => FP.ref.SKILLS.find((x) => x.id === k).label;
      body = '<div class="card card-soft" style="padding:16px"><div class="row-between"><span class="card-kicker">Progression</span><span class="delta" style="font-size:22px"><span>' + before + ' %</span>' + icon('arrow') + '<span>' + after + ' %</span></span></div></div>' +
        '<span class="label">Compétences modifiées (' + changes.length + ')</span>' +
        (changes.length ? '<div class="chips">' + changes.map((k) => { const st = flow.skills[k]; return '<span class="tag ' + (st === 'acquis' ? 'tag-ok' : st === 'retravailler' ? 'tag-warn' : 'tag-info') + '">' + icon(FP.status.SKILL_STATUS[st].icon) + esc(lab(k)) + '</span>'; }).join('') + '</div>' : '<p class="small muted">Aucune modification des compétences.</p>') +
        '<span class="label">Remarque</span><p class="req-msg">' + (flow.comment ? '« ' + esc(flow.comment) + ' »' : '<span class="muted">Pas de remarque.</span>') + '</p>' +
        (flow.diffs.length ? '<span class="label">Difficultés</span><div class="chips">' + flow.diffs.map((d) => '<span class="tag">' + esc(d) + '</span>').join('') + '</div>' : '') +
        '<p class="note">' + icon('bell') + '<span>' + esc(s.first) + ' recevra une notification' + (withLesson && flow.share && q.parentsOf(sid).some((p) => p.access) ? ', ainsi que ses parents' : '') + '.</span></p>';
    }

    el.innerHTML = '<div class="flow"><div class="flow-head"><div class="row-between"><a class="icon-btn" href="' + (withLesson ? '#lecon/' + key : '#eleve/' + sid) + '" aria-label="Fermer">' + icon('x') + '</a><span class="small" style="font-weight:700;color:rgba(255,255,255,.7)">Étape ' + flow.step + '/' + steps + '</span></div>' +
      '<div><h2>' + esc(title) + '</h2><p>' + (flow.step === 1 ? 'Compétences travaillées' : flow.step === 2 ? 'Remarque et difficultés' : 'Récapitulatif') + (l ? ' · ' + esc(l.theme) : '') + '</p></div>' +
      '<div class="flow-progress">' + [1, 2, 3].map((i) => '<span class="' + (i <= flow.step ? 'on' : '') + '"></span>').join('') + '</div></div>' +
      '<div class="flow-body">' + body + '</div>' +
      '<div class="flow-foot">' + (flow.step > 1 ? '<button class="btn btn-ghost btn-lg" data-fstep="' + (flow.step - 1) + '">' + icon('left') + 'Retour</button>' : '') +
      (flow.step < 3 ? '<button class="btn btn-dark btn-lg" data-fstep="' + (flow.step + 1) + '">Continuer' + icon('arrow') + '</button>'
        : '<button class="btn btn-primary btn-lg" data-fsubmit="' + (withLesson ? 'l' : 's') + ':' + key + '">' + icon('check') + (withLesson ? 'Valider et terminer' : 'Enregistrer') + '</button>') + '</div></div>';
  }

  /* ---------------- Élèves ---------------- */
  function eleves(el) {
    const list = q.studentsOf(IID).filter((s) => !search || q.fullName(s).toLowerCase().includes(search.toLowerCase()));
    el.innerHTML = '<div class="m-hello"><div><h2>Mes élèves</h2><p>' + q.studentsOf(IID).length + ' élèves attribués</p></div></div>' +
      '<div class="search" style="max-width:none;margin-bottom:14px">' + icon('search') + '<input class="input" id="m-search" placeholder="Rechercher un élève" value="' + esc(search) + '" aria-label="Rechercher un élève"></div>' +
      list.map((s) => {
        const p = q.progress(s.id), next = q.upcoming(s.id)[0];
        return '<a class="m-lesson" href="#eleve/' + s.id + '">' + FP.avatar(s) + '<span class="m-body"><strong>' + esc(q.fullName(s)) + '</strong><span>' + esc(q.formation(s.formation).title) + (next ? ' · prochaine : ' + fmt.relShort(next.date).toLowerCase() : '') + '</span><span class="prog-cell" style="margin-top:6px">' + FP.bar(p.pct, 'volt') + '<b>' + p.pct + ' %</b></span></span>' + icon('right', 'chev') + '</a>';
      }).join('');
  }

  function eleve(el, sid) {
    const s = q.student(sid); if (!s) { location.hash = '#eleves'; return; }
    const p = q.progress(sid), c = q.code(sid), h = q.hours(sid);
    el.innerHTML = '<a class="link-arrow" href="#eleves" style="margin-bottom:14px">' + icon('left') + 'Mes élèves</a>' +
      '<div class="card card-dark"><div class="row">' + FP.ring(p.pct, { size: 92, stroke: 10 }) + '<div><strong style="font-size:20px">' + esc(q.fullName(s)) + '</strong><p style="color:rgba(255,255,255,.7);font-size:14px">' + esc(q.formation(s.formation).title) + ' · ' + q.age(s) + ' ans · ' + esc(s.phone) + '</p></div></div></div>' +
      '<div class="g g-4 g-stats mt"><div class="card stat"><span class="stat-label">Compétences</span><span class="stat-value">' + p.acquired + '<small>/' + p.total + '</small></span></div><div class="card stat"><span class="stat-label">Heures</span><span class="stat-value">' + fmt.hours(h.done) + '</span></div><div class="card stat"><span class="stat-label">Code</span><span class="stat-value">' + (c.count ? c.avg + '<small>/40</small>' : '—') + '</span></div><div class="card stat"><span class="stat-label">À retravailler</span><span class="stat-value">' + p.counts.retravailler + '</span></div></div>' +
      '<a class="btn btn-primary btn-lg btn-block mt" href="#maj/' + sid + '">' + icon('clipboard') + 'Mettre à jour le livret</a>' +
      (V.reworkList(sid) ? '<div class="stack mt">' + V.reworkList(sid) + '</div>' : '') +
      '<div class="section-title"><h3>Compétences</h3></div>' + V.blocks(sid) +
      '<div class="section-title"><h3>Historique</h3></div><div class="hist">' + (q.history(sid).slice(0, 8).map((l) => V.histItem(l)).join('') || '<p class="empty">Aucune leçon.</p>') + '</div>';
  }

  /* ---------------- Demandes ---------------- */
  function demandes(el) {
    const pend = q.pendingRequests(IID);
    const recent = FP.store.db.requests.filter((r) => r.instructor === IID && r.status !== 'en_attente').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    el.innerHTML = '<div class="m-hello"><div><h2>Demandes de créneaux</h2><p>' + pend.length + ' en attente de réponse</p></div></div>' +
      '<p class="note" style="margin-bottom:14px">' + icon('shield') + '<span>Aucune heure n’est réservée sans votre validation ou celle du secrétariat.</span></p>' +
      '<div class="stack">' + (pend.map((r) => V.reqItem(r, { showStudent: true, actions: V.reqActions(r) })).join('') || '<div class="card"><p class="empty">Aucune demande en attente. 👌</p></div>') + '</div>' +
      (FP.store.db.lessons.filter((l) => l.instructor === IID && l.status === 'confirmee' && l.date >= D.todayISO()).length
        ? '<div class="section-title"><h3>Déplacer une leçon</h3></div>' +
          FP.store.db.lessons.filter((l) => l.instructor === IID && l.status === 'confirmee' && l.date >= D.todayISO()).slice(0, 6)
            .map((l) => '<div class="m-lesson"><span class="m-time"><b>' + fmt.time(l.start) + '</b><span>' + fmt.relShort(l.date) + '</span></span>' +
              '<span class="m-body"><strong>' + esc(q.fullName(q.student(l.student))) + '</strong><span>' + esc(l.theme) + '</span></span>' +
              '<button class="btn btn-ghost btn-xs" data-movem="' + l.id + '" style="align-self:center">' + icon('swap') + 'Déplacer</button></div>').join('')
        : '') +
      (recent.length ? '<div class="section-title"><h3>Récemment traitées</h3></div><div class="stack">' + recent.map((r) => V.reqItem(r, { showStudent: true })).join('') + '</div>' : '');
  }

  function historique(el) {
    const list = FP.store.db.lessons.filter((l) => l.instructor === IID && (l.status === 'terminee')).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)).slice(0, 25);
    el.innerHTML = '<div class="m-hello"><div><h2>Historique</h2><p>Dernières leçons terminées</p></div></div><div class="hist">' + list.map((l) => V.histItem(l, { showStudent: true })).join('') + '</div>';
  }

  const shell = FP.shell({
    role: 'moniteur', page: 'moniteur.html', roleLabel: 'Espace moniteur', roleIcon: 'wheel',
    user: { first: 'Julien', last: 'R.', sub: 'Moniteur · Flash PERMIS', color: 'blue' },
    notifTo: TO,
    nav: [
      { id: 'planning', label: 'Mon planning', short: 'Planning', icon: 'calendar', badge: () => FP.store.db.lessons.filter((l) => l.instructor === IID && l.status === 'a_completer').length },
      { id: 'eleves', label: 'Mes élèves', short: 'Élèves', icon: 'users' },
      { id: 'demandes', label: 'Demandes', short: 'Demandes', icon: 'inbox', badge: () => q.pendingRequests(IID).length },
      { id: 'historique', label: 'Historique', short: 'Historique', icon: 'clock' }
    ],
    hidden: ['lecon', 'fin', 'eleve', 'maj'],
    hiddenTitles: { lecon: 'Leçon', fin: 'Fin de leçon', eleve: 'Dossier élève', maj: 'Mise à jour du livret' },
    hiddenParent: { lecon: 'planning', fin: 'planning', eleve: 'eleves', maj: 'eleves' },
    tabs: ['planning', 'eleves', 'demandes', 'historique'],
    sideFoot: '<div class="side-card">' + icon('phoneDevice') + '<strong>Pensé pour le téléphone</strong>Mettez à jour le livret en fin de leçon, en moins d’une minute.</div>',
    onRender: (r) => { const a = document.querySelector('.app'); if (a) a.classList.toggle('in-flow', r === 'fin' || r === 'maj'); },
    views: { planning, eleves, demandes, historique, lecon, eleve, fin: (el, id) => flowView(el, id, true), maj: (el, sid) => flowView(el, sid, false) }
  });

  V.handleRequests('moniteur');

  document.addEventListener('input', (e) => {
    if (e.target.id === 'fl-comment') flow.comment = e.target.value;
    if (e.target.id === 'm-search') { search = e.target.value; const pos = e.target.selectionStart; shell.render(true); const i = $('#m-search'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }
  });
  document.addEventListener('change', (e) => { if (e.target.id === 'fl-share') flow.share = e.target.checked; });
  function moveModal(lid) {
    const l = FP.store.db.lessons.find((x) => x.id === lid); if (!l) return;
    const s = q.student(l.student);
    FP.modal({
      title: 'Déplacer la leçon', sub: q.fullName(s) + ' · ' + fmt.day(l.date) + ' à ' + fmt.time(l.start),
      body: '<div class="form-grid"><label class="field"><span>Nouvelle date</span><input class="input" type="date" id="mm-date" value="' + l.date + '"></label>' +
        '<label class="field"><span>Nouvelle heure</span><input class="input" type="time" id="mm-time" step="1800" value="' + l.start + '"></label></div>' +
        '<p class="note">' + icon('bell') + '<span>' + esc(s.first) + ', ses parents et le secrétariat seront prévenus automatiquement.</span></p>',
      actions: [{ label: 'Annuler' }, { label: 'Déplacer', cls: 'btn-primary', icon: 'swap', onClick: (w) => {
        const date = w.querySelector('#mm-date').value, time = w.querySelector('#mm-time').value;
        if (!date || !time) { FP.toast('Renseignez la date et l’heure.', 'warn'); return false; }
        const conflict = q.conflict(IID, l.student, date, time, l.duration);
        if (conflict && !w.dataset.forced) { FP.toast('Conflit : ' + conflict + '. Confirmez pour forcer.', 'warn'); w.dataset.forced = '1'; return false; }
        act.moveLesson(lid, { date, start: time }, q.instructor(IID).first + ' (moniteur)');
        FP.toast('Leçon déplacée. L’élève a été notifié.');
      } }]
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target;
    const cl = t.closest('[data-cashlesson]');
    if (cl) {
      const lid = cl.dataset.cashlesson;
      const l = FP.store.db.lessons.find((x) => x.id === lid);
      const pay = q.ensureLessonPayment(l);
      FP.modal({
        title: 'Encaisser la leçon', sub: q.fullName(q.student(l.student)) + ' · ' + FP.money.eur(pay.amountCts),
        body: '<label class="field"><span>Moyen de paiement reçu</span><select class="select" id="cl-method">' +
          Object.keys(FP.pay.METHODS).map((k) => '<option value="' + k + '" ' + (k === 'especes' ? 'selected' : '') + '>' + FP.pay.METHODS[k] + '</option>').join('') + '</select></label>' +
          '<p class="note">' + icon('info') + '<span>Un reçu numéroté sera généré et l’élève verra sa leçon passer en « Payée ».</span></p>',
        actions: [{ label: 'Annuler' }, { label: 'Confirmer l’encaissement', cls: 'btn-ok', icon: 'check', onClick: (w) => {
          const r = act.markLessonPaid(lid, ins().first + ' (moniteur)', w.querySelector('#cl-method').value);
          FP.toast(r.already ? 'Cette leçon était déjà payée.' : 'Paiement enregistré. L’élève a été notifié.');
        } }]
      });
      return;
    }
    const mm = t.closest('[data-movem]'); if (mm) { moveModal(mm.dataset.movem); return; }
    const d = t.closest('[data-day]'); if (d) { day = d.dataset.day; shell.render(true); return; }
    const tri = t.closest('[data-tri]');
    if (tri) {
      const [k, st] = tri.dataset.tri.split(':');
      const sid = flow.key.startsWith('l:') ? FP.store.db.lessons.find((x) => x.id === flow.key.slice(2)).student : flow.key.slice(2);
      const orig = q.skills(sid)[k].s;
      if (orig === st) delete flow.skills[k]; else flow.skills[k] = st;
      shell.render(true); return;
    }
    if (t.closest('[data-showall]')) { flow.showAll = !flow.showAll; shell.render(true); return; }
    const qk = t.closest('[data-quick]');
    if (qk) { const txt = QUICK[+qk.dataset.quick]; flow.comment = (flow.comment ? flow.comment.trim() + ' ' : '') + txt; shell.render(true); return; }
    const df = t.closest('[data-diff]');
    if (df) { const v = df.dataset.diff; const i = flow.diffs.indexOf(v); if (i >= 0) flow.diffs.splice(i, 1); else flow.diffs.push(v); shell.render(true); return; }
    const fs = t.closest('[data-fstep]');
    if (fs) { flow.step = +fs.dataset.fstep; shell.render(); window.scrollTo(0, 0); return; }
    const sub = t.closest('[data-fsubmit]');
    if (sub) {
      const [kind, key] = [sub.dataset.fsubmit.slice(0, 1), sub.dataset.fsubmit.slice(2)];
      if (kind === 'l') {
        flow.result = act.completeLesson(key, { skills: Object.assign({}, flow.skills), comment: flow.comment, difficulties: flow.diffs.slice(), shareParent: flow.share });
      } else {
        const before = q.progress(key).pct;
        const s = q.student(key);
        const newly = act.updateSkills(key, Object.assign({}, flow.skills), true);
        if (flow.comment) act.notify('eleve:' + key, 'Votre moniteur a ajouté une remarque à votre livret : « ' + flow.comment + ' »', 'comment', '#progression');
        act.log('Livret de ' + s.first + ' mis à jour par ' + ins().first + '.');
        FP.store.save();
        flow.result = { before, after: q.progress(key).pct, newly };
      }
      FP.toast('Livret mis à jour.');
      shell.render(); window.scrollTo(0, 0);
    }
  });
})();
