/* ==========================================================================
   Flash PERMIS — Administration (back-office)
   ========================================================================== */
(function () {
  'use strict';
  const { q, act, fmt, icon, esc, $, $$ } = FP;
  const V = FP.v, D = FP.date;
  const TO = 'admin';
  const db = () => FP.store.db;
  const st = { week: 0, instr: 'all', search: '', formation: 'all', mon: 'all', tab: 'dossier' };

  const weekStart = (off) => { let d = D.todayISO(); while (D.dow(d) !== 1) d = D.addDays(d, -1); return D.addDays(d, (off || 0) * 7); };
  const inWeek = (d, off) => { const a = weekStart(off); return d >= a && d <= D.addDays(a, 6); };
  const lessonsWeek = (off) => db().lessons.filter((l) => l.status !== 'annulee' && inWeek(l.date, off));
  const kpi = (ic, tone, label, value, sub, hot, href) => '<' + (href ? 'a href="' + href + '"' : 'div') + ' class="card kpi ' + (hot ? 'kpi-hot' : '') + '"><span class="stat-ic ' + tone + '">' + icon(ic) + '</span><span class="stat-label">' + label + '</span><span class="stat-value">' + value + '</span><span class="stat-sub">' + sub + '</span></' + (href ? 'a' : 'div') + '>';
  const personCell = (s, sub) => '<div class="person">' + FP.avatar(s, 'sm') + '<div><strong>' + esc(q.fullName(s)) + '</strong><span>' + esc(sub) + '</span></div></div>';
  const progCell = (pct) => '<div class="prog-cell">' + FP.bar(pct, pct >= 80 ? 'ok' : 'volt') + '<b>' + pct + ' %</b></div>';
  const avgProgress = () => Math.round(db().students.reduce((t, s) => t + q.progress(s.id).pct, 0) / db().students.length);
  const avgCode = () => { const l = db().students.map((s) => q.code(s.id)).filter((c) => c.count); return l.length ? (l.reduce((t, c) => t + c.avg, 0) / l.length).toFixed(1).replace('.', ',') : '—'; };

  /* ---------------- Tableau de bord ---------------- */
  function dashboard(el) {
    const pend = q.pendingRequests();
    const insc = db().inscriptions.filter((i) => i.status === 'nouvelle' || i.status === 'contactee');
    const wk = lessonsWeek(0);
    const today = D.todayISO();
    const todo = db().lessons.filter((l) => l.status === 'a_completer');
    const follow = db().students.filter((s) => q.progress(s.id).counts.retravailler || s.docs.some((d) => d.status === 'manquant') || (q.code(s.id).count && q.code(s.id).avg < 30)).slice(0, 6);
    el.innerHTML =
      '<div class="page-head"><div><h2>Bonjour 👋</h2><p>' + fmt.dayCap(today) + ' · Flash PERMIS Gardanne</p></div><div class="page-actions"><a class="btn btn-ghost" href="index.html" target="_blank" rel="noopener">' + icon('external') + 'Voir le site</a><a class="btn btn-dark" href="#planning">' + icon('calendar') + 'Planning</a></div></div>' +
      '<div class="g" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">' +
      kpi('users', 'night', 'Élèves actifs', db().students.length, db().students.filter((s) => q.age(s) < 18).length + ' mineurs', false, '#eleves') +
      kpi('car', 'info', 'Leçons cette semaine', wk.length, fmt.hours(wk.reduce((t, l) => t + l.duration, 0) / 60) + ' de conduite', false, '#planning') +
      kpi('inbox', 'volt', 'Demandes à valider', pend.length, pend.length ? 'Réponse attendue' : 'Tout est traité', pend.length > 0, '#planning') +
      kpi('user', 'ok', 'Pré-inscriptions', insc.length, 'À traiter', insc.some((i) => i.status === 'nouvelle'), '#inscriptions') +
      kpi('trend', 'ok', 'Progression moyenne', avgProgress() + ' %', 'Compétences maîtrisées', false, '#progression') +
      kpi('book', 'info', 'Moyenne code', avgCode() + '<small>/40</small>', '3 dernières séries', false, '#code') +
      '</div>' +
      '<div class="g g-main mt"><div class="stack">' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('inbox') + 'Demandes de créneaux à valider</span><a class="link-arrow" href="#planning">Planning ' + icon('arrow') + '</a></div><div class="stack">' +
      (pend.slice(0, 4).map((r) => V.reqItem(r, { showStudent: true, actions: V.reqActions(r) })).join('') || '<p class="empty">Aucune demande en attente. 👌</p>') + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('calendar') + 'Planning du jour</span><span class="small muted">' + q.lessonsOn(today).length + ' leçons</span></div>' +
      db().instructors.map((i) => { const ls = q.lessonsOn(today, i.id); return '<div style="margin-bottom:10px"><div class="row" style="margin-bottom:4px">' + FP.avatar(i, 'sm', i.color) + '<strong>' + esc(i.first + ' ' + i.last) + '</strong><span class="small muted">' + (q.isAbsent(i.id, today) ? 'Absent' : ls.length + ' leçon(s)') + '</span></div><div class="lessons">' + ls.map((l) => V.lessonRow(l, { showStudent: true })).join('') + '</div></div>'; }).join('') + '</div>' +
      '</div><div class="stack">' +
      (todo.length ? '<div class="card"><div class="card-head"><span class="card-title">' + icon('edit') + 'Livrets à compléter</span></div>' + todo.map((l) => '<div class="todo-card" style="margin-bottom:8px">' + FP.skillBadge('retravailler') + '<div><strong>' + esc(q.fullName(q.student(l.student))) + '</strong><span>' + fmt.relShort(l.date) + ' ' + fmt.time(l.start) + ' · ' + esc(q.instructor(l.instructor).first) + '</span></div></div>').join('') + '<p class="small muted">Le moniteur complète le livret depuis son téléphone.</p></div>' : '') +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('user') + 'Pré-inscriptions</span><a class="link-arrow" href="#inscriptions">Tout voir ' + icon('arrow') + '</a></div><div class="feed">' +
      (db().inscriptions.slice(0, 3).map((i) => '<a class="notif" href="#inscriptions"><span class="notif-ic nt-inscription">' + icon('user') + '</span><span class="notif-body"><span class="notif-text">' + esc(i.first + ' ' + i.last) + ' — ' + esc(q.formation(i.formation).title) + '</span><span class="notif-time">' + fmt.ago(i.createdAt) + ' · ' + inscStatus(i.status) + '</span></span></a>').join('') || '<p class="empty">Aucune pré-inscription.</p>') + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('alert') + 'Élèves à suivre</span></div><div class="feed">' +
      follow.map((s) => { const p = q.progress(s.id); const why = p.counts.retravailler ? p.counts.retravailler + ' compétence(s) à retravailler' : s.docs.some((d) => d.status === 'manquant') ? 'Document manquant' : 'Code : moyenne ' + q.code(s.id).avg + '/40'; return '<button class="notif" data-student="' + s.id + '">' + FP.avatar(s, 'sm') + '<span class="notif-body"><span class="notif-text">' + esc(q.fullName(s)) + '</span><span class="notif-time">' + esc(why) + '</span></span></button>'; }).join('') + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('bell') + 'Activité récente</span><a class="link-arrow" href="#notifications">Tout voir ' + icon('arrow') + '</a></div><div class="feed">' + q.notifs(TO).slice(0, 5).map(FP.notifItem).join('') + '</div></div>' +
      '</div></div>';
  }
  const inscStatus = (s) => ({ nouvelle: 'Nouvelle', contactee: 'Contactée', dossier: 'Dossier en cours', finalisee: 'Inscription finalisée' }[s] || s);

  /* ---------------- Élèves ---------------- */
  function eleves(el) {
    const list = db().students.filter((s) => (st.formation === 'all' || s.formation === st.formation) && (st.mon === 'all' || s.instructor === st.mon) && (!st.search || q.fullName(s).toLowerCase().includes(st.search.toLowerCase())));
    el.innerHTML =
      '<div class="page-head"><div><h2>Élèves</h2><p>' + db().students.length + ' dossiers · cliquez sur un élève pour ouvrir son dossier</p></div><div class="page-actions"><a class="btn btn-dark" href="#inscriptions">' + icon('plus') + 'Depuis une pré-inscription</a></div></div>' +
      '<div class="card"><div class="toolbar"><div class="search">' + icon('search') + '<input class="input" id="s-search" placeholder="Rechercher un élève" value="' + esc(st.search) + '" aria-label="Rechercher"></div>' +
      '<select class="select" id="s-form" aria-label="Formation"><option value="all">Toutes les formations</option>' + db().content.formations.map((f) => '<option value="' + f.id + '" ' + (st.formation === f.id ? 'selected' : '') + '>' + esc(f.title) + '</option>').join('') + '</select>' +
      '<select class="select" id="s-mon" aria-label="Moniteur"><option value="all">Tous les moniteurs</option>' + db().instructors.map((i) => '<option value="' + i.id + '" ' + (st.mon === i.id ? 'selected' : '') + '>' + esc(i.first + ' ' + i.last) + '</option>').join('') + '</select>' +
      '<span class="small muted">' + list.length + ' résultat(s)</span></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Élève</th><th>Formation</th><th>Moniteur</th><th>Progression</th><th>Heures</th><th>Code</th><th>Parents</th><th>Dossier</th></tr></thead><tbody>' +
      list.map((s) => {
        const h = q.hours(s.id), c = q.code(s.id), ins = q.instructor(s.instructor), par = q.parentsOf(s.id);
        const docsOk = s.docs.every((d) => d.status === 'valide' || d.status === 'signe');
        return '<tr class="clickable" data-student="' + s.id + '" tabindex="0"><td>' + personCell(s, q.age(s) + ' ans' + (q.age(s) < 18 ? ' · mineur' : '')) + '</td><td>' + esc(q.formation(s.formation).title) + '</td><td>' + esc(ins.first) + '</td><td>' + progCell(q.progress(s.id).pct) + '</td>' +
          '<td class="num">' + fmt.hours(h.done) + ' <span class="muted">/ ' + h.contract + ' h</span></td><td class="num">' + (c.count ? c.avg + '/40' : '—') + '</td><td>' + (par.length ? FP.badge(par.some((p) => p.access) ? 'Accès actif' : 'Accès suspendu', par.some((p) => p.access) ? 'ok' : 'mute') : '<span class="muted small">—</span>') + '</td><td>' + (docsOk ? FP.badge('Complet', 'ok', 'check') : FP.badge('Incomplet', 'warn', 'alert')) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function openStudent(sid) {
    const render = (m) => {
      const s = q.student(sid), p = q.progress(sid), h = q.hours(sid), ins = q.instructor(s.instructor), c = q.code(sid);
      const tabs = [['dossier', 'Dossier'], ['progression', 'Progression'], ['heures', 'Heures'], ['documents', 'Documents'], ['parents', 'Parents']];
      let body = '';
      if (st.tab === 'dossier') {
        body = '<div class="g g-4 g-stats"><div class="card stat"><span class="stat-label">Progression</span><span class="stat-value">' + p.pct + ' %</span></div><div class="card stat"><span class="stat-label">Heures</span><span class="stat-value">' + fmt.hours(h.done) + '</span></div><div class="card stat"><span class="stat-label">Code</span><span class="stat-value">' + (c.count ? c.avg + '<small>/40</small>' : '—') + '</span></div><div class="card stat"><span class="stat-label">Étape</span><span class="stat-value" style="font-size:17px">' + esc(FP.ref.STEPS.find((x) => x.id === s.step).label) + '</span></div></div>' +
          '<div class="form-grid"><label class="field"><span>Formation</span><select class="select" data-sfield="formation">' + db().content.formations.map((f) => '<option value="' + f.id + '" ' + (s.formation === f.id ? 'selected' : '') + '>' + esc(f.title) + '</option>').join('') + '</select></label>' +
          '<label class="field"><span>Moniteur référent</span><select class="select" data-sfield="instructor">' + db().instructors.map((i) => '<option value="' + i.id + '" ' + (s.instructor === i.id ? 'selected' : '') + '>' + esc(i.first + ' ' + i.last) + '</option>').join('') + '</select></label>' +
          '<label class="field"><span>Étape du parcours</span><select class="select" data-sfield="step">' + FP.ref.STEPS.map((x) => '<option value="' + x.id + '" ' + (s.step === x.id ? 'selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select></label>' +
          '<label class="field"><span>Volume prévu (heures)</span><input class="input" type="number" min="1" max="80" data-sfield="contract" value="' + s.contract + '"></label></div>' +
          '<div class="docs">' + [['phone', 'Téléphone', s.phone], ['mail', 'E-mail', s.email], ['shield', 'NEPH', s.neph], ['calendar', 'Inscrit le', fmt.dateLong(s.joined)]].map((r) => '<div class="doc"><span class="doc-ic">' + icon(r[0]) + '</span><span class="doc-name"><span>' + r[1] + '</span>' + esc(r[2]) + '</span></div>').join('') + '</div>';
      } else if (st.tab === 'progression') {
        body = '<div class="row wrap">' + FP.ring(p.pct, { size: 96, stroke: 10 }) + V.legend(sid) + '</div>' + V.blocks(sid) + '<h4 style="margin-top:6px">Dernières leçons</h4><div class="hist">' + q.history(sid).slice(0, 4).map((l) => V.histItem(l)).join('') + '</div>';
      } else if (st.tab === 'heures') {
        body = V.hoursCard(sid) + '<div class="lessons">' + q.lessonsOf(sid).slice().sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)).slice(0, 12).map((l) => V.lessonRow(l)).join('') + '</div>';
      } else if (st.tab === 'documents') {
        body = '<div class="docs">' + s.docs.map((d, i) => '<div class="doc"><span class="doc-ic">' + icon('file') + '</span><span class="doc-name">' + esc(d.name) + '</span>' + V.docStatus(d.status) +
          (d.status !== 'valide' && d.status !== 'signe' ? '<button class="btn btn-ok btn-xs" data-docok="' + i + '">' + icon('check') + 'Valider</button>' : '') + '</div>').join('') + '</div>';
      } else {
        const par = q.parentsOf(sid);
        body = par.length ? par.map((pp) => '<div class="doc">' + FP.avatar(pp, 'sm', 'rose') + '<span class="doc-name">' + esc(pp.first + ' ' + pp.last) + '<span>' + esc(pp.relation) + ' · ' + esc(pp.email) + '</span></span>' + FP.badge(pp.access ? 'Accès actif' : 'Suspendu', pp.access ? 'ok' : 'mute') + '</div>').join('') + '<a class="btn btn-ghost btn-sm" href="#parents" data-close>Gérer les accès parents</a>'
          : '<p class="empty">Aucun parent rattaché.</p><button class="btn btn-dark btn-sm" data-invite="' + sid + '" data-close>' + icon('plus') + 'Inviter un parent</button>';
      }
      m.el.querySelector('.modal-body').innerHTML = '<div class="seg" style="flex-wrap:wrap">' + tabs.map((t) => '<button class="' + (st.tab === t[0] ? 'is-on' : '') + '" data-stab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' + body;
      m.el.querySelector('.modal-head h3').textContent = q.fullName(s);
      m.el.querySelector('.modal-head p').textContent = q.formation(s.formation).title + ' · ' + q.age(s) + ' ans · moniteur : ' + ins.first + ' ' + ins.last;
    };
    const m = FP.modal({ title: '…', sub: '…', wide: true, body: '', actions: [{ label: 'Ouvrir l’espace élève', icon: 'external', onClick: () => { if (sid === 'lucas') window.open('eleve.html', '_blank'); else FP.toast('Dans la démo, l’espace élève complet est celui de Lucas.', 'info'); return false; } }, { label: 'Fermer', cls: 'btn-dark' }] });
    render(m);
    m.el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-stab]'); if (t) { st.tab = t.dataset.stab; render(m); }
      const d = e.target.closest('[data-docok]'); if (d) { act.setDocStatus(sid, +d.dataset.docok, 'valide'); render(m); FP.toast('Document validé.'); }
    });
    m.el.addEventListener('change', (e) => {
      const f = e.target.closest('[data-sfield]'); if (!f) return;
      const s = q.student(sid); const k = f.dataset.sfield; s[k] = k === 'contract' ? Math.max(1, +f.value || s.contract) : f.value;
      FP.store.save(); render(m); FP.toast('Dossier mis à jour.');
    });
  }

  /* ---------------- Moniteurs ---------------- */
  function moniteurs(el) {
    const ws = weekStart(0);
    el.innerHTML = '<div class="page-head"><div><h2>Moniteurs</h2><p>Planning, élèves attribués et disponibilités — semaine du ' + fmt.day(ws) + '</p></div><div class="page-actions"><button class="btn btn-dark" data-absence>' + icon('ban') + 'Déclarer une absence</button></div></div>' +
      '<div class="g g-3">' + db().instructors.map((i) => {
        const studs = q.studentsOf(i.id), wk = lessonsWeek(0).filter((l) => l.instructor === i.id);
        const pend = q.pendingRequests(i.id).length;
        const abs = db().absences.filter((a) => a.type === 'moniteur' && a.who === i.id && a.date >= D.todayISO());
        const grid = '<div class="hours-grid"><span></span>' + Array.from({ length: 11 }, (_, h) => '<span style="text-align:center">' + (h % 2 ? '' : 8 + h) + '</span>').join('') +
          FP.ref.DAYS.map((d) => {
            const date = D.addDays(ws, d.n - 1); const hrs = i.hours[d.n] || []; const absent = q.isAbsent(i.id, date);
            return '<span>' + d.short + '</span>' + Array.from({ length: 11 }, (_, h) => {
              const hh = 8 + h; const on = hrs.some((r) => hh >= r[0] && hh < r[1]);
              const busy = wk.some((l) => l.date === date && D.toMin(l.start) < (hh + 1) * 60 && hh * 60 < D.toMin(l.start) + l.duration);
              return '<i class="' + (absent && on ? 'abs' : busy ? 'busy' : on ? 'on' : '') + '" title="' + d.label + ' ' + hh + 'h"></i>';
            }).join('');
          }).join('') + '</div>';
        return '<div class="card instr-card"><div class="instr-head">' + FP.avatar(i, 'lg', i.color) + '<div><strong>' + esc(i.first + ' ' + i.last) + '</strong><span>' + esc(i.role) + '</span></div></div>' +
          '<div class="mini-stats"><div><span>Élèves</span><strong>' + studs.length + '</strong></div><div><span>Leçons (sem.)</span><strong>' + wk.length + '</strong></div><div><span>Demandes</span><strong>' + pend + '</strong></div></div>' +
          '<div><span class="label">Disponibilités & planning de la semaine</span><div class="mt" style="margin-top:8px">' + grid + '</div><div class="cal-legend mt"><span><i style="background:#cfe0ff"></i>Disponible</span><span><i style="background:var(--night)"></i>Leçon</span><span><i style="background:#f4c7c1"></i>Absence</span></div></div>' +
          '<div><span class="label">Élèves attribués</span><div class="chips" style="margin-top:8px">' + studs.map((s) => '<button class="tag" data-student="' + s.id + '">' + esc(s.first + ' ' + s.last[0] + '.') + '</button>').join('') + '</div></div>' +
          (abs.length ? '<div class="stack">' + abs.map((a) => '<div class="note note-volt">' + icon('ban') + '<span><strong>' + fmt.dayCap(a.date) + '</strong> — ' + esc(a.label) + '</span></div>').join('') + '</div>' : '') +
          '</div>';
      }).join('') + '</div>';
  }

  /* ---------------- Planning ---------------- */
  function planning(el) {
    const ws = weekStart(st.week), HH = 50, H0 = 8, H1 = 19;
    const pend = q.pendingRequests();
    const days = FP.ref.DAYS.map((d) => D.addDays(ws, d.n - 1));
    const col = (i) => (q.instructor(i) || {}).color || 'blue';
    const filt = (x) => st.instr === 'all' || x.instructor === st.instr;
    const lessons = db().lessons.filter((l) => l.status !== 'annulee' && inWeek(l.date, st.week) && filt(l));
    const reqs = db().requests.filter((r) => r.status === 'en_attente' && inWeek(r.date, st.week) && filt(r));
    // Répartition en colonnes des événements qui se chevauchent
    const layout = (items) => {
      items.sort((a, b) => D.toMin(a.x.start) - D.toMin(b.x.start));
      let cluster = [], end = -1; const lanesEnd = [];
      const flush = () => { const n = Math.max(1, ...cluster.map((c) => c.lane + 1)); cluster.forEach((c) => { c.n = n; }); cluster = []; lanesEnd.length = 0; };
      items.forEach((it) => {
        const a = D.toMin(it.x.start), b = a + it.x.duration;
        if (a >= end && cluster.length) flush();
        let lane = lanesEnd.findIndex((e) => e <= a); if (lane < 0) { lane = lanesEnd.length; lanesEnd.push(b); } else lanesEnd[lane] = b;
        it.lane = lane; cluster.push(it); end = Math.max(end, b);
      });
      if (cluster.length) flush();
      return items;
    };
    const ev = (it) => {
      const x = it.x, kind = it.kind;
      const top = ((D.toMin(x.start) - H0 * 60) / 60) * HH, h = (x.duration / 60) * HH - 3;
      const pos = 'top:' + top + 'px;height:' + h + 'px;left:calc(' + (it.lane * 100 / it.n) + '% + 3px);right:auto;width:calc(' + (100 / it.n) + '% - 6px)';
      const s = q.student(x.student);
      if (kind === 'req') return '<button class="cal-ev ev-pending" style="' + pos + '" data-reqev="' + x.id + '" title="Demande de ' + esc(q.fullName(s)) + '"><strong>Demande · ' + esc(s.first) + '</strong><span>' + fmt.range(x.start, x.duration) + '</span></button>';
      return '<button class="cal-ev ev-' + col(x.instructor) + (x.status === 'terminee' ? ' ev-done' : '') + (x.status === 'a_completer' ? ' ev-todo' : '') + '" style="' + pos + '" data-lessonev="' + x.id + '" title="' + esc(q.fullName(s) + ' · ' + fmt.range(x.start, x.duration) + ' · ' + q.instructor(x.instructor).first) + '"><strong>' + esc(s.first + ' ' + s.last[0] + '.') + '</strong><span>' + fmt.time(x.start) + ' · ' + esc(q.instructor(x.instructor).first) + '</span></button>';
    };
    const dayEvents = (d) => layout(lessons.filter((l) => l.date === d).map((x) => ({ x })).concat(reqs.filter((r) => r.date === d).map((x) => ({ x, kind: 'req' })))).map(ev).join('');
    el.innerHTML =
      '<div class="page-head"><div><h2>Planning</h2><p>Calendrier, demandes de créneaux, validation, refus, contre-propositions et absences.</p></div><div class="page-actions"><button class="btn btn-ghost" data-absence>' + icon('ban') + 'Déclarer une absence</button></div></div>' +
      (pend.length ? '<div class="card" style="border-color:#f6dd8a"><div class="card-head"><span class="card-title">' + icon('inbox') + 'Demandes en attente de validation</span>' + FP.badge(pend.length + ' à traiter', 'pending', 'clock') + '</div><div class="g g-2">' +
        pend.map((r) => V.reqItem(r, { showStudent: true, actions: V.reqActions(r) })).join('') + '</div></div>' : '<div class="note">' + icon('checkCircle') + '<span>Aucune demande de créneau en attente.</span></div>') +
      '<div class="card mt"><div class="toolbar" style="justify-content:space-between"><div class="cal-nav"><button class="icon-btn" data-week="-1" aria-label="Semaine précédente">' + icon('left') + '</button><strong>Semaine du ' + D.parse(ws).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + '</strong><button class="icon-btn" data-week="1" aria-label="Semaine suivante">' + icon('right') + '</button>' + (st.week ? '<button class="btn btn-ghost btn-xs" data-week="0">Aujourd’hui</button>' : '') + '</div>' +
      '<div class="chips"><button class="chip ' + (st.instr === 'all' ? 'is-on' : '') + '" data-instr="all">Tous</button>' + db().instructors.map((i) => '<button class="chip ' + (st.instr === i.id ? 'is-on' : '') + '" data-instr="' + i.id + '"><span class="avatar av-' + i.color + '" style="width:16px;height:16px;font-size:0"></span>' + esc(i.first) + '</button>').join('') + '</div></div>' +
      '<div class="cal-legend" style="margin-bottom:12px">' + db().instructors.map((i) => '<span><i style="background:var(--c-' + i.color + ')"></i>' + esc(i.first) + '</span>').join('') + '<span><i style="background:repeating-linear-gradient(-45deg,#ffe066 0 3px,#fff8d6 3px 6px)"></i>Demande en attente</span><span><i style="box-shadow:inset 0 0 0 2px var(--warn-ic)"></i>Livret à compléter</span></div>' +
      '<div class="cal-wrap has-daylist"><div class="cal" style="--hh:' + HH + 'px;' + (st.instr === 'all' ? 'grid-template-columns:52px repeat(6,minmax(170px,1fr));min-width:1080px' : '') + '">' +
      '<div class="cal-head"></div>' + days.map((d) => '<div class="cal-head ' + (d === D.todayISO() ? 'today' : '') + '"><span>' + D.parse(d).toLocaleDateString('fr-FR', { weekday: 'short' }) + '</span><b>' + D.parse(d).getDate() + '</b></div>').join('') +
      '<div class="cal-times" style="height:' + (H1 - H0) * HH + 'px">' + Array.from({ length: H1 - H0 }, (_, i) => '<span style="top:' + (i * HH + (i ? 0 : 8)) + 'px">' + (H0 + i) + 'h</span>').join('') + '</div>' +
      days.map((d) => '<div class="cal-col ' + (db().absences.some((a) => a.type === 'moniteur' && a.date === d && (st.instr === 'all' || a.who === st.instr)) ? 'absent' : '') + '" style="height:' + (H1 - H0) * HH + 'px">' + dayEvents(d) + '</div>').join('') +
      '</div></div>' +
      '<div class="day-list">' + days.map((d) => { const ls = lessons.filter((l) => l.date === d); const rs = reqs.filter((r) => r.date === d); return '<div class="dl-day"><strong>' + fmt.dayCap(d) + '</strong><div class="lessons">' + (ls.map((l) => V.lessonRow(l, { showStudent: true })).join('') + rs.map((r) => '<div class="lesson">' + V.dateBlock(r.date) + '<div class="lesson-info"><strong>Demande · ' + esc(q.fullName(q.student(r.student))) + '</strong><span>' + fmt.range(r.start, r.duration) + '</span></div><div class="lesson-side">' + FP.reqBadge('en_attente') + '</div></div>').join('') || '<p class="small muted">Aucune leçon.</p>') + '</div></div>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="card mt"><div class="card-head"><span class="card-title">' + icon('ban') + 'Absences</span><button class="btn btn-ghost btn-sm" data-absence>' + icon('plus') + 'Ajouter</button></div><div class="docs">' +
      (db().absences.slice().sort((a, b) => b.date.localeCompare(a.date)).map((a) => '<div class="doc"><span class="doc-ic">' + icon(a.type === 'moniteur' ? 'wheel' : 'user') + '</span><span class="doc-name">' + esc(a.type === 'moniteur' ? q.instructor(a.who).first + ' ' + q.instructor(a.who).last : q.fullName(q.student(a.who))) + '<span>' + fmt.dayCap(a.date) + ' · ' + esc(a.label) + '</span></span>' + FP.badge(a.type === 'moniteur' ? 'Moniteur' : 'Élève', a.type === 'moniteur' ? 'warn' : 'mute') + '</div>').join('') || '<p class="empty">Aucune absence.</p>') + '</div></div>';
  }

  function openLesson(id) {
    const l = db().lessons.find((x) => x.id === id); if (!l) return;
    const s = q.student(l.student), i = q.instructor(l.instructor);
    FP.modal({
      title: l.theme, sub: fmt.dayCap(l.date) + ' · ' + fmt.range(l.start, l.duration),
      body: '<div class="docs"><div class="doc">' + FP.avatar(s, 'sm') + '<span class="doc-name">' + esc(q.fullName(s)) + '<span>' + esc(q.formation(s.formation).title) + ' · ' + q.progress(s.id).pct + ' %</span></span>' + V.lessonBadge(l) + '</div><div class="doc">' + FP.avatar(i, 'sm', i.color) + '<span class="doc-name">' + esc(i.first + ' ' + i.last) + '<span>Moniteur</span></span></div><div class="doc"><span class="doc-ic">' + icon('pin') + '</span><span class="doc-name">' + esc(l.meeting) + '<span>Rendez-vous</span></span></div></div>' +
        (l.comment ? '<div class="hist-comment">' + icon('message') + '<span>« ' + esc(l.comment) + ' »</span></div>' : ''),
      actions: (l.status === 'confirmee' ? [{ label: 'Annuler la leçon', cls: 'btn-danger', icon: 'ban', onClick: () => { act.cancelLesson(l.id, 'Annulée par l’agence'); FP.toast('Leçon annulée. L’élève a été notifié.', 'info'); } }] : []).concat([{ label: 'Dossier élève', icon: 'user', onClick: () => { setTimeout(() => openStudent(s.id), 250); } }, { label: 'Fermer', cls: 'btn-dark' }])
    });
  }

  function openAbsence() {
    FP.modal({
      title: 'Déclarer une absence', sub: 'Les leçons confirmées du moniteur ce jour-là seront annulées et les élèves notifiés.',
      body: '<div class="form-grid"><label class="field"><span>Type</span><select class="select" id="ab-type"><option value="moniteur">Moniteur</option><option value="eleve">Élève</option></select></label>' +
        '<label class="field"><span>Personne</span><select class="select" id="ab-who">' + db().instructors.map((i) => '<option value="' + i.id + '">' + esc(i.first + ' ' + i.last) + '</option>').join('') + '</select></label>' +
        '<label class="field"><span>Date</span><input class="input" type="date" id="ab-date" value="' + D.addDays(D.todayISO(), 1) + '"></label>' +
        '<label class="field"><span>Motif</span><input class="input" id="ab-label" value="Congé"></label></div>',
      onOpen: (w) => { w.querySelector('#ab-type').addEventListener('change', (e) => { const t = e.target.value; w.querySelector('#ab-who').innerHTML = (t === 'moniteur' ? db().instructors.map((i) => '<option value="' + i.id + '">' + esc(i.first + ' ' + i.last) + '</option>') : db().students.map((s) => '<option value="' + s.id + '">' + esc(q.fullName(s)) + '</option>')).join(''); }); },
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer', cls: 'btn-dark', icon: 'check', onClick: (w) => { const d = w.querySelector('#ab-date').value; if (!d) { FP.toast('Choisissez une date.', 'warn'); return false; } act.addAbsence({ type: w.querySelector('#ab-type').value, who: w.querySelector('#ab-who').value, date: d, label: w.querySelector('#ab-label').value || 'Absence' }); FP.toast('Absence enregistrée.'); } }]
    });
  }

  /* ---------------- Progression ---------------- */
  function progression(el) {
    const since = D.addDays(D.todayISO(), -7);
    const validated = db().students.reduce((t, s) => t + Object.values(q.skills(s.id)).filter((x) => x.s === 'acquis' && x.d && x.d >= since).length, 0);
    const done7 = db().lessons.filter((l) => l.status === 'terminee' && l.date >= since).length;
    const withComment = db().lessons.filter((l) => l.status === 'terminee' && l.comment).sort((a, b) => ((b.completedAt || b.date) + b.start).localeCompare((a.completedAt || a.date) + a.start)).slice(0, 6);
    el.innerHTML = '<div class="page-head"><div><h2>Progression pédagogique</h2><p>Compétences, remarques et historique des leçons de tous les élèves.</p></div></div>' +
      '<div class="g g-4 g-stats">' +
      kpi('trend', 'ok', 'Progression moyenne', avgProgress() + ' %', 'Tous élèves confondus') + kpi('checkCircle', 'volt', 'Compétences validées', validated, '7 derniers jours') + kpi('car', 'info', 'Leçons terminées', done7, '7 derniers jours') + kpi('edit', 'warn', 'Livrets à compléter', db().lessons.filter((l) => l.status === 'a_completer').length, 'Par les moniteurs') + '</div>' +
      '<div class="card mt"><div class="card-head"><span class="card-title">' + icon('grid') + 'Suivi par élève</span><span class="small muted">Étapes du livret</span></div><div class="table-wrap"><table class="table matrix"><thead><tr><th>Élève</th>' + FP.ref.BLOCKS.map((b) => '<th>' + b.n + '. ' + esc(b.title) + '</th>').join('') + '<th>Global</th><th>À retravailler</th><th>Dernière leçon</th></tr></thead><tbody>' +
      db().students.slice().sort((a, b) => q.progress(b.id).pct - q.progress(a.id).pct).map((s) => { const p = q.progress(s.id), last = q.lastCompleted(s.id); return '<tr class="clickable" data-student="' + s.id + '"><td>' + personCell(s, q.instructor(s.instructor).first) + '</td>' + FP.ref.BLOCKS.map((b) => { const bp = q.blockProgress(s.id, b.id); return '<td><div class="prog-cell" style="min-width:110px">' + FP.bar(bp.pct, bp.pct === 100 ? 'ok' : '') + '<b>' + bp.acquired + '/' + bp.total + '</b></div></td>'; }).join('') + '<td><b>' + p.pct + ' %</b></td><td>' + (p.counts.retravailler ? FP.badge(p.counts.retravailler + '', 'warn', 'alert') : '<span class="muted">—</span>') + '</td><td class="small">' + (last ? fmt.relShort(last.date) : '—') + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="g g-main mt"><div class="card"><div class="card-head"><span class="card-title">' + icon('message') + 'Dernières remarques des moniteurs</span></div><div class="hist">' + withComment.map((l) => V.histItem(l, { showStudent: true })).join('') + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('clipboard') + 'Référentiel de compétences</span></div><div class="skills">' +
      FP.ref.SKILLS.map((k) => { const n = db().students.filter((s) => q.skills(s.id)[k.id] && q.skills(s.id)[k.id].s === 'acquis').length; return '<div class="skill"><span class="skill-label">' + esc(k.label) + '<small>' + n + ' élève(s) sur ' + db().students.length + '</small></span><span style="width:90px">' + FP.bar((n / db().students.length) * 100, '', k.label) + '</span></div>'; }).join('') + '</div></div></div>';
  }

  /* ---------------- Code ---------------- */
  function code(el) {
    const rows = db().students.map((s) => ({ s, c: q.code(s.id) })).filter((x) => x.c.count).sort((a, b) => b.c.avg - a.c.avg);
    const since = D.addDays(D.todayISO(), -7);
    const series7 = db().students.reduce((t, s) => t + q.code(s.id).series.filter((x) => x.date >= since).length, 0);
    const status = (c) => c.goalHits >= 4 ? FP.badge('Résultats réguliers', 'ok', 'check') : c.avg >= 32 ? FP.badge('En progression', 'info', 'trend') : FP.badge('À encourager', 'warn', 'alert');
    el.innerHTML = '<div class="page-head"><div><h2>Code de la route</h2><p>Résultats, statistiques et progression de chaque élève.</p></div></div>' +
      '<div class="g g-4 g-stats">' + kpi('book', 'info', 'Moyenne générale', avgCode() + '<small>/40</small>', '3 dernières séries') + kpi('trophy', 'ok', 'Résultats réguliers', rows.filter((x) => x.c.goalHits >= 4).length, '≥ 35/40 sur 4 des 5 dernières séries') + kpi('flame', 'night', 'Séries réalisées', series7, '7 derniers jours') + kpi('users', 'volt', 'Élèves suivis', rows.length, 'Avec au moins une série') + '</div>' +
      '<div class="card mt"><div class="table-wrap"><table class="table"><thead><tr><th>Élève</th><th>Séries</th><th>Moyenne</th><th>Meilleure</th><th>Dernière</th><th>Tendance</th><th>Régularité</th><th>Statut</th><th></th></tr></thead><tbody>' +
      rows.map((x) => '<tr><td>' + personCell(x.s, q.formation(x.s.formation).title) + '</td><td class="num">' + x.c.count + '</td><td class="num"><b>' + x.c.avg + '/40</b></td><td class="num">' + x.c.best + '/40</td><td class="num">' + x.c.last + '/40</td><td>' + FP.spark(x.c.scores.slice(-8), { w: 90, h: 26 }) + '</td><td class="num">' + x.c.regular + ' j/7</td><td>' + status(x.c) + '</td><td><button class="btn btn-ghost btn-xs" data-addcode="' + x.s.id + '">' + icon('plus') + 'Résultat</button></td></tr>').join('') +
      '</tbody></table></div></div><p class="note mt">' + icon('info') + '<span>Ces indicateurs aident au suivi. La décision de présentation à l’examen reste celle de l’auto-école.</span></p>';
  }

  /* ---------------- Parents ---------------- */
  function parents(el) {
    const VIS = [['progression', 'Progression'], ['remarques', 'Remarques'], ['planning', 'Planning'], ['code', 'Code'], ['documents', 'Documents']];
    const NOT = [['lecons', 'Leçons'], ['remarques', 'Remarques'], ['competences', 'Compétences'], ['code', 'Code']];
    el.innerHTML = '<div class="page-head"><div><h2>Parents</h2><p>Gestion des accès, des informations visibles et des notifications.</p></div><div class="page-actions"><button class="btn btn-dark" data-invite>' + icon('plus') + 'Inviter un parent</button></div></div>' +
      '<p class="note" style="margin-bottom:16px">' + icon('shield') + '<span>Les parents ne voient que les informations que vous choisissez de partager. Les réglages s’appliquent immédiatement dans l’espace parents.</span></p>' +
      '<div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Parent</th><th>Élève</th><th>Accès</th><th>Informations visibles</th><th>Notifications</th></tr></thead><tbody>' +
      db().parents.map((p) => { const s = q.student(p.student); return '<tr><td><div class="person">' + FP.avatar(p, 'sm', 'rose') + '<div><strong>' + esc(p.first + ' ' + p.last) + '</strong><span>' + esc(p.relation) + ' · ' + esc(p.email) + '</span></div></div></td><td>' + esc(q.fullName(s)) + '</td>' +
        '<td><label class="switch"><input type="checkbox" data-pset="' + p.id + '|access" ' + (p.access ? 'checked' : '') + '><span class="switch-ui"></span><span class="sr-only">Accès</span></label></td>' +
        '<td><div class="chips">' + VIS.map((v) => '<button class="chip ' + (p.visible[v[0]] ? 'is-on' : '') + '" aria-pressed="' + !!p.visible[v[0]] + '" data-ptog="' + p.id + '|visible.' + v[0] + '" style="padding:5px 10px;font-size:12.5px">' + v[1] + '</button>').join('') + '</div></td>' +
        '<td><div class="chips">' + NOT.map((v) => '<button class="chip ' + (p.notif[v[0]] ? 'is-on' : '') + '" aria-pressed="' + !!p.notif[v[0]] + '" data-ptog="' + p.id + '|notif.' + v[0] + '" style="padding:5px 10px;font-size:12.5px">' + v[1] + '</button>').join('') + '</div></td></tr>'; }).join('') +
      '</tbody></table></div></div><p class="small muted mt">Astuce démo : désactivez « Remarques » pour Sophie Martin, puis ouvrez l’<a href="parent.html" target="_blank" rel="noopener" style="text-decoration:underline">espace parents</a>.</p>';
  }

  function openInvite(sid) {
    FP.modal({
      title: 'Inviter un parent', sub: 'Un accès à l’espace parents sera créé.',
      body: '<div class="form-grid"><label class="field"><span>Prénom</span><input class="input" id="pi-first"></label><label class="field"><span>Nom</span><input class="input" id="pi-last"></label>' +
        '<label class="field full"><span>E-mail</span><input class="input" type="email" id="pi-email"></label>' +
        '<label class="field"><span>Élève</span><select class="select" id="pi-student">' + db().students.map((s) => '<option value="' + s.id + '" ' + (sid === s.id ? 'selected' : '') + '>' + esc(q.fullName(s)) + '</option>').join('') + '</select></label>' +
        '<label class="field"><span>Lien</span><select class="select" id="pi-rel"><option>Mère</option><option>Père</option><option>Tuteur / tutrice</option><option>Parent</option></select></label></div>',
      actions: [{ label: 'Annuler' }, { label: 'Créer l’accès', cls: 'btn-dark', icon: 'send', onClick: (w) => { const f = w.querySelector('#pi-first').value.trim(), l = w.querySelector('#pi-last').value.trim(); if (!f || !l) { FP.toast('Renseignez le prénom et le nom.', 'warn'); return false; } act.addParent({ first: f, last: l, email: w.querySelector('#pi-email').value.trim(), relation: w.querySelector('#pi-rel').value, student: w.querySelector('#pi-student').value }); FP.toast('Accès parent créé. Une invitation serait envoyée par e-mail.'); } }]
    });
  }

  /* ---------------- Pré-inscriptions ---------------- */
  function inscriptions(el) {
    const list = db().inscriptions;
    el.innerHTML = '<div class="page-head"><div><h2>Pré-inscriptions</h2><p>Demandes reçues depuis le formulaire en ligne du site.</p></div><div class="page-actions"><a class="btn btn-ghost" href="inscription.html" target="_blank" rel="noopener">' + icon('external') + 'Ouvrir le formulaire</a></div></div>' +
      '<div class="stack">' + (list.map((i) => {
        const age = i.birth ? q.age({ birth: i.birth }) : null;
        return '<div class="card"><div class="req-top"><div class="person">' + FP.avatar({ first: i.first, last: i.last }, '') + '<div><strong style="font-size:16.5px">' + esc(i.first + ' ' + i.last) + '</strong><span>' + esc(q.formation(i.formation).title) + (age != null ? ' · ' + age + ' ans' : '') + ' · reçue ' + fmt.ago(i.createdAt).toLowerCase() + '</span></div></div>' +
          '<div class="row">' + (i.minor ? FP.badge('Mineur', 'info') : '') + '<select class="select input-sm" data-istatus="' + i.id + '" aria-label="Statut" style="width:auto">' + ['nouvelle', 'contactee', 'dossier', 'finalisee'].map((x) => '<option value="' + x + '" ' + (i.status === x ? 'selected' : '') + '>' + inscStatus(x) + '</option>').join('') + '</select></div></div>' +
          '<div class="g g-3 mt" style="gap:10px">' +
          '<div class="req-msg"><span class="card-kicker">Contact</span><br>' + icon('phone') + ' ' + esc(i.phone) + '<br>' + icon('mail') + ' ' + esc(i.email) + '</div>' +
          '<div class="req-msg"><span class="card-kicker">Disponibilités</span><br>' + esc((i.dispo || []).join(', ') || '—') + '</div>' +
          '<div class="req-msg"><span class="card-kicker">' + (i.minor ? 'Parent / représentant légal' : 'Message') + '</span><br>' + (i.minor && i.parent ? esc(i.parent.name) + '<br>' + esc(i.parent.phone || '') + ' · ' + esc(i.parent.email || '') : esc(i.message || '—')) + '</div></div>' +
          (i.minor && i.message ? '<p class="req-msg mt">« ' + esc(i.message) + ' »</p>' : '') +
          '<div class="req-actions mt">' + (i.studentId ? FP.badge('Dossier élève créé', 'ok', 'check') + '<button class="btn btn-ghost btn-sm" data-student="' + i.studentId + '">Voir le dossier</button>'
            : '<button class="btn btn-dark btn-sm" data-convert="' + i.id + '">' + icon('user') + 'Créer le dossier élève</button><a class="btn btn-ghost btn-sm" href="mailto:' + esc(i.email) + '">' + icon('mail') + 'Répondre</a>') + '</div></div>';
      }).join('') || '<div class="card"><p class="empty">Aucune pré-inscription.</p></div>') + '</div>';
  }

  /* ---------------- Contenus du site ---------------- */
  function contenus(el) {
    const s = db().content.school;
    el.innerHTML = '<div class="page-head"><div><h2>Contenus du site</h2><p>Zones modifiables : informations de l’agence et formations affichées sur le site.</p></div><div class="page-actions"><a class="btn btn-ghost" href="index.html#formations" target="_blank" rel="noopener">' + icon('external') + 'Voir le site</a></div></div>' +
      '<div class="g g-main-r"><div class="card"><div class="card-head"><span class="card-title">' + icon('building') + 'Informations de l’agence</span><span class="editable-tag">' + icon('edit') + 'Modifiable</span></div>' +
      '<form id="school-form" class="stack">' +
      '<label class="field"><span>Adresse</span><input class="input" name="address" value="' + esc(s.address) + '" placeholder="N° et rue — Gardanne"></label>' +
      '<label class="field"><span>Téléphone</span><input class="input" name="phone" value="' + esc(s.phone) + '" placeholder="04 •• •• •• ••"></label>' +
      '<label class="field"><span>E-mail</span><input class="input" name="email" value="' + esc(s.email) + '" placeholder="contact@…"></label>' +
      '<label class="field"><span>Horaires d’accueil</span><input class="input" name="hours" value="' + esc(s.hours) + '" placeholder="Ex. : du lundi au vendredi…"></label>' +
      '<p class="note">' + icon('info') + '<span>Tant qu’un champ est vide, le site affiche « à renseigner ». Aucune information n’est inventée.</span></p>' +
      '<button class="btn btn-dark" type="submit">' + icon('check') + 'Enregistrer</button></form>' +
      (s.legal ? '<div class="divider" style="margin:18px 0"></div><span class="card-kicker">Identité légale (source officielle INSEE / INPI)</span><div class="docs" style="margin-top:8px">' +
        [['Raison sociale', s.legal.name], ['Forme juridique', s.legal.form + ' au capital de ' + s.legal.capital], ['SIREN', s.legal.siren], ['SIRET (siège)', s.legal.siret], ['N° TVA', s.legal.tva], ['Code APE', s.legal.ape]].map((r) => '<div class="doc" style="padding:9px 0"><span class="doc-name" style="font-weight:600"><span>' + r[0] + '</span>' + esc(r[1]) + '</span></div>').join('') +
        '</div><p class="small muted" style="margin-top:6px">Affiché en mentions légales en bas du site.</p>' : '') + '</div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('cap') + 'Formations</span><span class="editable-tag">' + icon('edit') + 'Modifiable</span></div><div class="stack">' +
      db().content.formations.map((f) => '<div class="formation-edit"><span class="f-ic">' + icon(f.icon) + '</span><div style="flex:1;min-width:0"><div class="row wrap" style="gap:8px"><h4>' + esc(f.title) + '</h4>' + FP.badge(f.badge, 'mute') + (f.visible ? '' : FP.badge('Masquée', 'warn')) + '</div><p>' + esc(f.desc) + '</p><p class="small" style="margin-top:6px">' + (f.price ? '<b>Tarif affiché :</b> ' + esc(f.price) : '<span class="muted">Aucun tarif affiché</span>') + '</p></div><button class="btn btn-ghost btn-sm" data-editf="' + f.id + '">' + icon('edit') + 'Modifier</button></div>').join('') +
      '</div><button class="btn btn-ghost btn-sm mt" data-resetcontent>' + icon('refresh') + 'Restaurer les contenus par défaut</button></div></div>';
  }

  function editFormation(fid) {
    const f = db().content.formations.find((x) => x.id === fid);
    FP.modal({
      title: 'Modifier : ' + f.title, wide: true,
      body: '<div class="form-grid"><label class="field"><span>Titre</span><input class="input" id="f-title" value="' + esc(f.title) + '"></label><label class="field"><span>Badge</span><input class="input" id="f-badge" value="' + esc(f.badge) + '"></label>' +
        '<label class="field full"><span>Description</span><textarea class="textarea" id="f-desc">' + esc(f.desc) + '</textarea></label>' +
        '<label class="field full"><span>Points clés <em class="hint">(un par ligne)</em></span><textarea class="textarea" id="f-points">' + esc(f.points.join('\n')) + '</textarea></label>' +
        '<label class="field"><span>Tarif <em class="hint">(laisser vide pour ne pas l’afficher)</em></span><input class="input" id="f-price" value="' + esc(f.price) + '" placeholder="Ex. : à partir de …"></label>' +
        '<label class="switch" style="align-self:end;margin-bottom:12px"><input type="checkbox" id="f-visible" ' + (f.visible ? 'checked' : '') + '><span class="switch-ui"></span>Afficher sur le site</label></div>',
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer', cls: 'btn-dark', icon: 'check', onClick: (w) => { act.updateFormation(fid, { title: w.querySelector('#f-title').value.trim() || f.title, badge: w.querySelector('#f-badge').value.trim(), desc: w.querySelector('#f-desc').value.trim(), points: w.querySelector('#f-points').value.split('\n').map((x) => x.trim()).filter(Boolean), price: w.querySelector('#f-price').value.trim(), visible: w.querySelector('#f-visible').checked }); FP.toast('Formation mise à jour. Le site est modifié immédiatement.'); } }]
    });
  }

  /* ---------------- Notifications ---------------- */
  function notifications(el) {
    el.innerHTML = '<div class="page-head"><div><h2>Notifications & activité</h2><p>Tout ce qui se passe sur la plateforme Flash PERMIS.</p></div><div class="page-actions"><button class="btn btn-ghost" data-readall>' + icon('check') + 'Tout marquer comme lu</button></div></div>' +
      '<div class="g g-main"><div class="card"><div class="card-head"><span class="card-title">' + icon('bell') + 'Notifications du secrétariat</span></div><div class="feed">' + q.notifs(TO).map(FP.notifItem).join('') + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('list') + 'Journal d’activité</span></div><div class="feed">' + (db().log.map((l) => '<div class="notif"><span class="notif-ic">' + icon('clock') + '</span><span class="notif-body"><span class="notif-text">' + esc(l.text) + '</span><span class="notif-time">' + fmt.ago(l.at) + '</span></span></div>').join('') || '<p class="empty">Les actions réalisées pendant la démo apparaîtront ici.</p>') + '</div></div></div>';
  }

  const shell = FP.shell({
    role: 'admin', page: 'admin.html', roleLabel: 'Administration', roleIcon: 'layout',
    user: { first: 'Gérant', last: 'Flash', sub: 'Administrateur · Gardanne', color: 'night' },
    notifTo: TO,
    nav: [
      { id: 'dashboard', label: 'Tableau de bord', short: 'Accueil', icon: 'grid' },
      { id: 'eleves', label: 'Élèves', icon: 'users' },
      { id: 'moniteurs', label: 'Moniteurs', icon: 'wheel' },
      { id: 'planning', label: 'Planning', icon: 'calendar', badge: () => q.pendingRequests().length },
      { id: 'progression', label: 'Progression', icon: 'clipboard' },
      { id: 'code', label: 'Code', icon: 'book' },
      { id: 'parents', label: 'Parents', icon: 'heart' },
      { id: 'inscriptions', label: 'Pré-inscriptions', short: 'Inscriptions', icon: 'user', badge: () => db().inscriptions.filter((i) => i.status === 'nouvelle').length },
      { id: 'contenus', label: 'Contenus du site', icon: 'edit' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', badge: () => q.unread(TO) }
    ],
    tabs: ['dashboard', 'eleves', 'planning', 'inscriptions', 'notifications'],
    sideFoot: '<div class="side-card">' + icon('shield') + '<strong>Vous gardez le contrôle</strong>Chaque créneau proposé par un élève passe par votre validation.</div>',
    views: { dashboard, eleves, moniteurs, planning, progression, code, parents, inscriptions, contenus, notifications }
  });

  V.handleRequests('Secrétariat Flash PERMIS');

  document.addEventListener('input', (e) => {
    if (e.target.id === 's-search') { st.search = e.target.value; const pos = e.target.selectionStart; shell.render(true); const i = $('#s-search'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 's-form') { st.formation = t.value; shell.render(true); }
    if (t.id === 's-mon') { st.mon = t.value; shell.render(true); }
    if (t.dataset.pset) { const [pid, path] = t.dataset.pset.split('|'); act.setParent(pid, path, t.checked); FP.toast(t.checked ? 'Accès parent activé.' : 'Accès parent suspendu.', 'info'); }
    if (t.dataset.istatus) { act.setInscriptionStatus(t.dataset.istatus, t.value); FP.toast('Statut mis à jour.'); }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'school-form') {
      e.preventDefault(); const f = new FormData(e.target);
      act.updateSchool({ address: f.get('address').trim(), phone: f.get('phone').trim(), email: f.get('email').trim(), hours: f.get('hours').trim() });
      FP.toast('Informations enregistrées. Le site affiche désormais ces données.');
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('tr[data-student]')) { st.tab = 'dossier'; openStudent(e.target.dataset.student); } });
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.modal-wrap') && !t.closest('[data-invite]')) return;
    const sd = t.closest('[data-student]'); if (sd) { st.tab = 'dossier'; openStudent(sd.dataset.student); return; }
    const wk = t.closest('[data-week]'); if (wk) { const v = +wk.dataset.week; st.week = v === 0 ? 0 : st.week + v; shell.render(true); return; }
    const ins = t.closest('[data-instr]'); if (ins) { st.instr = ins.dataset.instr; shell.render(true); return; }
    const le = t.closest('[data-lessonev]'); if (le) { openLesson(le.dataset.lessonev); return; }
    const re = t.closest('[data-reqev]');
    if (re) {
      const r = db().requests.find((x) => x.id === re.dataset.reqev);
      FP.modal({ title: 'Demande de ' + q.student(r.student).first, sub: fmt.dayCap(r.date) + ' · ' + fmt.range(r.start, r.duration), body: V.reqItem(r, { showStudent: true, history: true, actions: V.reqActions(r).replace(/<button /g, '<button data-close ') }) });
      return;
    }
    if (t.closest('[data-absence]')) { openAbsence(); return; }
    const inv = t.closest('[data-invite]'); if (inv) { setTimeout(() => openInvite(inv.dataset.invite), inv.closest('.modal-wrap') ? 260 : 0); return; }
    const pt = t.closest('[data-ptog]'); if (pt) { const [pid, path] = pt.dataset.ptog.split('|'); const p = db().parents.find((x) => x.id === pid); const [a, b] = path.split('.'); act.setParent(pid, path, !p[a][b]); return; }
    const cv = t.closest('[data-convert]');
    if (cv) {
      const i = db().inscriptions.find((x) => x.id === cv.dataset.convert);
      FP.modal({
        title: 'Créer le dossier de ' + i.first + ' ' + i.last, sub: q.formation(i.formation).title,
        body: '<label class="field"><span>Moniteur référent</span><select class="select" id="cv-ins">' + db().instructors.map((x) => '<option value="' + x.id + '">' + esc(x.first + ' ' + x.last) + '</option>').join('') + '</select></label>' + (i.minor ? '<p class="note">' + icon('heart') + '<span>Un accès à l’espace parents sera créé pour ' + esc(i.parent ? i.parent.name : 'le représentant légal') + '.</span></p>' : ''),
        actions: [{ label: 'Annuler' }, { label: 'Créer le dossier', cls: 'btn-dark', icon: 'check', onClick: (w) => { act.convertInscription(i.id, w.querySelector('#cv-ins').value); FP.toast('Dossier élève créé. L’élève apparaît dans la liste des élèves.'); } }]
      });
      return;
    }
    const ac = t.closest('[data-addcode]');
    if (ac) {
      const s = q.student(ac.dataset.addcode);
      FP.modal({ title: 'Nouveau résultat · ' + s.first, body: '<label class="field"><span>Score sur 40</span><input class="input" type="number" min="0" max="40" id="ac-score" value="34"></label>', actions: [{ label: 'Annuler' }, { label: 'Enregistrer', cls: 'btn-dark', onClick: (w) => { const v = Math.round(+w.querySelector('#ac-score').value); if (!(v >= 0 && v <= 40)) { FP.toast('Score invalide.', 'warn'); return false; } act.addCodeResult(s.id, v, 'admin'); FP.toast('Résultat enregistré. ' + s.first + ' a été notifié.'); } }] });
      return;
    }
    const ef = t.closest('[data-editf]'); if (ef) { editFormation(ef.dataset.editf); return; }
    if (t.closest('[data-resetcontent]')) { act.resetContent(); FP.toast('Contenus par défaut restaurés.', 'info'); return; }
    if (t.closest('[data-readall]')) { act.markRead(TO); }
  });
})();
