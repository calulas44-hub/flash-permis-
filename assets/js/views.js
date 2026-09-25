/* ==========================================================================
   Flash PERMIS — Fragments de vues partagés entre les espaces
   ========================================================================== */
(function (global) {
  'use strict';
  const FP = global.FP;
  const { q, fmt, icon, esc } = FP;
  const D = FP.date;
  const v = {};

  const month = (s) => D.parse(s).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  v.dateBlock = (s, tone) => '<span class="date-block ' + (tone || '') + '"><b>' + D.parse(s).getDate() + '</b><span>' + month(s) + '</span></span>';

  const LESSON_STATUS = {
    confirmee: ['Confirmée', 'ok', 'checkCircle'],
    terminee: ['Terminée', 'mute', 'check'],
    a_completer: ['Compte-rendu en cours', 'pending', 'edit'],
    annulee: ['Annulée', 'danger', 'ban']
  };
  v.lessonBadge = (l) => { const s = LESSON_STATUS[l.status]; return FP.badge(s[0], s[1], s[2]); };

  v.lessonRow = (l, o) => {
    o = o || {};
    const ins = q.instructor(l.instructor), st = q.student(l.student);
    const who = o.showStudent ? q.fullName(st) : 'avec ' + ins.first;
    const tone = l.date === D.todayISO() ? 'volt' : (o.tone || '');
    return '<div class="lesson">' + v.dateBlock(l.date, tone) +
      '<div class="lesson-info"><strong>' + esc(l.theme) + '</strong><span>' + fmt.relShort(l.date) + ' · ' + fmt.range(l.start, l.duration) + ' · ' + esc(who) + '</span></div>' +
      '<div class="lesson-side">' + (o.noBadge ? '' : v.lessonBadge(l)) + (o.action || '') + '</div></div>';
  };

  v.histItem = (l, o) => {
    o = o || {};
    const ins = q.instructor(l.instructor);
    const skills = FP.ref.SKILLS;
    const lab = (k) => (skills.find((x) => x.id === k) || { label: k }).label;
    const worked = (l.worked || []).filter((k) => !(l.rework || []).includes(k));
    let tags = worked.map((k) => '<span class="tag tag-ok">' + icon('check') + esc(lab(k)) + '</span>').join('') +
      (l.rework || []).map((k) => '<span class="tag tag-warn">' + icon('alert') + 'À retravailler : ' + esc(lab(k)) + '</span>').join('') +
      (l.difficulties || []).map((d) => '<span class="tag">' + esc(d) + '</span>').join('');
    let comment = '';
    if (l.status === 'a_completer') comment = '<div class="hist-comment">' + icon('edit') + '<span class="muted">Votre moniteur complète le compte-rendu de cette leçon.</span></div>';
    else if (l.comment && o.showComment !== false) comment = '<div class="hist-comment">' + icon('message') + '<span>« ' + esc(l.comment) + ' »</span></div>';
    else if (l.comment && o.showComment === false) comment = '<div class="hist-comment">' + icon('lock') + '<span class="muted">Remarque non partagée par l’auto-école.</span></div>';
    return '<article class="hist-item"><div class="hist-top"><div><strong>' + esc(l.theme) + '</strong><span>' + fmt.dayCap(l.date) + ' · ' + fmt.range(l.start, l.duration) + ' · ' + esc(o.showStudent ? q.fullName(q.student(l.student)) : ins.first + ' ' + ins.last) + '</span></div>' + v.lessonBadge(l) + '</div>' +
      comment + (tags && o.showTags !== false ? '<div class="hist-tags">' + tags + '</div>' : '') + '</article>';
  };

  v.blocks = (sid) => {
    const m = q.skills(sid);
    return '<div class="blocks">' + FP.ref.BLOCKS.map((b) => {
      const bp = q.blockProgress(sid, b.id);
      const list = FP.ref.SKILLS.filter((k) => k.b === b.id);
      return '<section class="card"><div class="block-head"><span class="block-n">' + b.n + '</span><div><strong>' + esc(b.title) + '</strong><span>' + esc(b.sub) + '</span></div><span class="block-pct">' + bp.acquired + '/' + bp.total + '</span></div>' +
        FP.bar(bp.pct, bp.pct === 100 ? 'ok' : '', b.title) +
        '<div class="skills mt">' + list.map((k) => {
          const st = (m[k.id] && m[k.id].s) || 'non_aborde'; const S = FP.status.SKILL_STATUS[st];
          const sub = st === 'acquis' && m[k.id].d ? 'Validée le ' + fmt.dateLong(m[k.id].d) : st === 'retravailler' && m[k.id].note ? m[k.id].note : st === 'en_cours' ? 'Abordée, en cours d’acquisition' : '';
          return '<div class="skill">' + FP.skillBadge(st) + '<span class="skill-label">' + esc(k.label) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' + (st === 'acquis' ? '' : FP.badge(S.label, S.tone)) + '</div>';
        }).join('') + '</div></section>';
    }).join('') + '</div>';
  };

  v.legend = (sid) => {
    const c = q.progress(sid).counts;
    return '<div class="legend">' +
      '<span>' + FP.skillBadge('acquis') + '<b>' + c.acquis + '</b> maîtrisées</span>' +
      '<span>' + FP.skillBadge('en_cours') + '<b>' + c.en_cours + '</b> en cours</span>' +
      '<span>' + FP.skillBadge('retravailler') + '<b>' + c.retravailler + '</b> à retravailler</span>' +
      '<span>' + FP.skillBadge('non_aborde') + '<b>' + c.non_aborde + '</b> non abordées</span></div>';
  };

  v.reworkList = (sid) => {
    const m = q.skills(sid);
    const list = FP.ref.SKILLS.filter((k) => m[k.id] && m[k.id].s === 'retravailler');
    if (!list.length) return '';
    return list.map((k) => '<div class="rework">' + FP.skillBadge('retravailler') + '<div><strong>« ' + esc(k.label) + ' »</strong><span>' + esc(m[k.id].note || 'Point signalé par votre moniteur') + '</span></div></div>').join('');
  };

  v.steps = (sid) => {
    const s = q.student(sid); const idx = FP.ref.STEPS.findIndex((x) => x.id === s.step);
    const c = q.code(sid);
    const sub = {
      inscription: 'Dossier reçu le ' + fmt.dateLong(s.joined),
      dossier: idx > 1 ? 'Dossier complet' : 'En cours de vérification',
      code: c.count ? 'Moyenne récente : ' + c.avg + '/40' : 'À démarrer',
      conduite: q.hours(sid).done + ' h effectuées',
      evaluation: 'Décidée avec votre moniteur',
      examen: 'Présentation décidée par l’auto-école'
    };
    return '<div class="steps">' + FP.ref.STEPS.map((st, i) => {
      // Le code et la conduite se déroulent en parallèle
      let cls = i < idx ? 'done' : i === idx ? 'now' : '';
      if (st.id === 'code' && s.step === 'conduite') cls = 'now';
      return '<div class="step ' + cls + '"><span class="step-dot">' + (cls === 'done' ? icon('check') : '') + '</span><div><strong>' + esc(st.label) + '</strong><span>' + esc(sub[st.id]) + '</span></div></div>';
    }).join('') + '</div>';
  };

  v.hoursCard = (sid) => {
    const h = q.hours(sid);
    const pct = Math.min(100, (h.done / h.contract) * 100);
    return '<div class="card"><div class="stat"><span class="stat-label">' + icon('car') + 'Heures de conduite</span>' +
      '<span class="stat-value">' + fmt.hours(h.done) + ' <small>/ ' + h.contract + ' h prévues</small></span></div>' +
      '<div class="mt">' + FP.bar(pct, 'volt', 'Heures effectuées') + '</div>' +
      '<div class="row-between mt small"><span class="muted"><b class="num" style="color:var(--ink)">' + fmt.hours(h.remaining) + '</b> restantes</span><span class="muted"><b class="num" style="color:var(--ink)">' + fmt.hours(h.planned) + '</b> planifiées</span></div></div>';
  };

  v.codeStats = (sid) => {
    const c = q.code(sid);
    const d = c.delta > 0 ? '+' + String(c.delta).replace('.', ',') : String(c.delta).replace('.', ',');
    return '<div class="g g-4 g-stats">' +
      '<div class="card stat"><span class="stat-ic volt">' + icon('target') + '</span><span class="stat-label">Moyenne actuelle</span><span class="stat-value">' + c.avg + '<small>/40</small></span><span class="stat-sub">3 dernières séries' + (c.count > 3 ? ' · ' + d + ' pt' : '') + '</span></div>' +
      '<div class="card stat"><span class="stat-ic ok">' + icon('trophy') + '</span><span class="stat-label">Meilleure note</span><span class="stat-value">' + c.best + '<small>/40</small></span><span class="stat-sub">Sur ' + c.count + ' séries</span></div>' +
      '<div class="card stat"><span class="stat-ic info">' + icon('book') + '</span><span class="stat-label">Séries réalisées</span><span class="stat-value">' + c.count + '</span><span class="stat-sub">Dernière : ' + (c.last ? c.last + '/40' : '—') + '</span></div>' +
      '<div class="card stat"><span class="stat-ic night">' + icon('flame') + '</span><span class="stat-label">Régularité</span><span class="stat-value">' + c.regular + ' <small>j / 7</small></span><span class="stat-sub">Jours d’entraînement cette semaine</span></div></div>';
  };

  v.last5 = (sid) => {
    const c = q.code(sid); const best = Math.max.apply(null, c.last5.concat([0]));
    return '<div class="results-row">' + c.last5.map((s, i) => '<div class="result-pill ' + (s === best ? 'best' : s >= 35 ? 'ok' : '') + '"><strong>' + s + '/40</strong><span>Série ' + (c.count - c.last5.length + i + 1) + '</span></div>').join('') + '</div>';
  };

  v.themes = (sid) => {
    const c = q.code(sid);
    return '<div class="themes">' + FP.ref.CODE_THEMES.map((t, i) => { const p = c.themes[i] || 0; return '<div class="theme-row"><span>' + esc(t) + '</span>' + FP.bar(p, p >= 80 ? 'ok' : p >= 65 ? '' : 'warn', t) + '<b>' + p + ' %</b></div>'; }).join('') + '</div>';
  };

  v.activity = (sid) => {
    const c = q.code(sid);
    return '<div class="activity" aria-label="Activité des 14 derniers jours">' + c.activity.map((a, i) => '<span class="' + (a ? 'on' : '') + (i === c.activity.length - 1 ? ' today' : '') + '" title="' + (a ? 'Entraînement' : 'Pas d’entraînement') + '"></span>').join('') + '</div><div class="row-between small muted" style="margin-top:6px"><span>Il y a 14 jours</span><span>Aujourd’hui</span></div>';
  };

  v.codeMessage = (sid) => {
    const c = q.code(sid);
    return '<div class="card card-soft"><p style="font-size:17px;font-weight:700">Votre moyenne actuelle : ' + c.avg + '/40</p><p class="muted" style="margin-top:4px">' +
      (c.goalHits >= 4 ? 'Vos résultats sont réguliers. Parlez-en avec l’équipe Flash PERMIS.' : 'Continuez à vous entraîner pour obtenir des résultats réguliers.') + '</p>' +
      '<p class="note mt">' + icon('info') + '<span>L’auto-école conserve la décision finale concernant la présentation à l’examen.</span></p></div>';
  };

  v.reqItem = (r, o) => {
    o = o || {};
    const st = q.student(r.student), ins = q.instructor(r.instructor);
    const hist = r.history.map((h) => '<span>' + fmt.ago(h.at) + ' · ' + esc(h.by) + ' — ' + esc(h.action) + '</span>').join('');
    let body = '';
    if (r.status === 'en_attente' && o.role === 'eleve') body = '<div class="pending-box" style="padding:14px"><span class="pulse-ic" style="width:38px;height:38px">' + icon('clock') + '</span><div><strong style="font-size:15px">Demande envoyée — en attente de validation de Flash PERMIS.</strong></div></div>';
    if (r.status === 'contre_proposition' && r.counter) body = '<div class="req-counter">' + icon('swap') + '<span>Flash PERMIS vous propose : ' + fmt.dayCap(r.counter.date) + ' à ' + fmt.time(r.counter.start) + '</span></div>';
    if (r.status === 'refusee' && r.reason) body = '<div class="req-msg">Motif : ' + esc(r.reason) + '</div>';
    if (r.message && o.role !== 'eleve') body += '<div class="req-msg">« ' + esc(r.message) + ' »</div>';
    return '<div class="req" data-req="' + r.id + '"><div class="req-top"><div>' +
      (o.showStudent ? '<div class="person" style="margin-bottom:8px">' + FP.avatar(st, 'sm') + '<div><strong>' + esc(q.fullName(st)) + '</strong><span>' + esc(q.formation(st.formation).title) + ' · ' + esc(ins.first) + '</span></div></div>' : '') +
      '<strong>' + fmt.dayCap(r.date) + ' · ' + fmt.range(r.start, r.duration) + '</strong><span class="muted">' + (o.showStudent ? 'Demandé ' + fmt.ago(r.createdAt).toLowerCase() : 'Avec ' + esc(ins.first + ' ' + ins.last)) + '</span></div>' + FP.reqBadge(r.status) + '</div>' +
      body + (o.actions ? '<div class="req-actions">' + o.actions + '</div>' : '') +
      (o.history ? '<div class="req-hist">' + hist + '</div>' : '') + '</div>';
  };

  v.heroBlocks = (sid) => '<div class="hero-blocks">' + FP.ref.BLOCKS.map((b) => { const bp = q.blockProgress(sid, b.id); return '<div>' + esc(b.title) + '<b>' + bp.acquired + '/' + bp.total + '</b>' + FP.bar(bp.pct, '', b.title) + '</div>'; }).join('') + '</div>';

  v.agencyCard = () => {
    const s = FP.store.db.content.school;
    return '<div class="side-card">' + icon('building') + '<strong>Flash PERMIS · Gardanne</strong>' + (s.phone ? esc(s.phone) : 'Une question ? L’équipe de votre agence vous répond.') + '</div>';
  };

  v.docStatus = (st) => ({ valide: FP.badge('Validé', 'ok', 'check'), signe: FP.badge('Signé', 'ok', 'check'), attente: FP.badge('En vérification', 'pending', 'clock'), manquant: FP.badge('À fournir', 'warn', 'alert') }[st] || FP.badge(st, 'mute'));


  /* ---------- Traitement des demandes de créneaux (admin & moniteur) ---------- */
  v.reqActions = (r) => '<button class="btn btn-ok btn-sm" data-accept="' + r.id + '">' + icon('check') + 'Accepter</button>' +
    '<button class="btn btn-ghost btn-sm" data-counter-open="' + r.id + '">' + icon('swap') + 'Autre créneau</button>' +
    '<button class="btn btn-danger btn-sm" data-refuse="' + r.id + '">' + icon('x') + 'Refuser</button>';

  v.handleRequests = (by) => {
    document.addEventListener('click', (e) => {
      const acc = e.target.closest('[data-accept]');
      if (acc) {
        const r = FP.store.db.requests.find((x) => x.id === acc.dataset.accept); if (!r) return;
        const st = q.student(r.student);
        const conflict = q.conflict(r.instructor, r.student, r.date, r.start, r.duration, r.id);
        const doIt = (theme) => { FP.act.acceptRequest(r.id, by, theme); FP.toast('Créneau confirmé. ' + st.first + ' a été notifié' + (q.parentsOf(r.student).some((p) => p.access) ? ', ainsi que ses parents.' : '.')); };
        FP.modal({
          title: 'Confirmer le créneau de ' + st.first, sub: fmt.dayCap(r.date) + ' · ' + fmt.range(r.start, r.duration) + ' avec ' + q.instructor(r.instructor).first,
          body: (conflict ? '<p class="note note-volt">' + icon('alert') + '<span><strong>Attention :</strong> ' + esc(conflict) + '.</span></p>' : '<p class="note">' + icon('checkCircle') + '<span>Aucun conflit détecté dans le planning.</span></p>') +
            '<label class="field"><span>Objectif de la leçon <em class="hint">(visible par l’élève)</em></span><input class="input" id="acc-theme" value="Leçon de conduite" list="themes"><datalist id="themes"><option>Stationnement et manœuvres</option><option>Circulation en agglomération</option><option>Conduite hors agglomération</option><option>Insertion et voie rapide</option><option>Évaluation des acquis</option></datalist></label>',
          actions: [{ label: 'Annuler' }, { label: conflict ? 'Accepter malgré tout' : 'Accepter le créneau', cls: 'btn-ok', icon: 'check', onClick: (m) => doIt(m.querySelector('#acc-theme').value.trim() || 'Leçon de conduite') }]
        });
        return;
      }
      const ref = e.target.closest('[data-refuse]');
      if (ref) {
        const r = FP.store.db.requests.find((x) => x.id === ref.dataset.refuse); if (!r) return;
        FP.modal({
          title: 'Refuser la demande', sub: q.fullName(q.student(r.student)) + ' · ' + fmt.dayCap(r.date) + ' à ' + fmt.time(r.start),
          body: '<label class="field"><span>Motif communiqué à l’élève</span><select class="select" id="ref-reason"><option>Créneau déjà réservé</option><option>Moniteur indisponible</option><option>Véhicule indisponible</option><option>Merci de proposer un créneau plus tard dans la semaine</option></select></label>',
          actions: [{ label: 'Annuler' }, { label: 'Refuser la demande', cls: 'btn-danger', icon: 'x', onClick: (m) => { FP.act.refuseRequest(r.id, m.querySelector('#ref-reason').value, by); FP.toast('Demande refusée. L’élève a été notifié.', 'info'); } }]
        });
        return;
      }
      const co = e.target.closest('[data-counter-open]');
      if (co) {
        const r = FP.store.db.requests.find((x) => x.id === co.dataset.counterOpen); if (!r) return;
        const sug = q.compatibleSlots(r.student, { duration: r.duration, days: 14 }).filter((x) => !(x.date === r.date && x.start === r.start)).slice(0, 8);
        let pick = sug[0] || null;
        const m = FP.modal({
          title: 'Proposer un autre créneau', sub: 'Demande initiale : ' + fmt.dayCap(r.date) + ' à ' + fmt.time(r.start),
          body: '<p class="small muted">Créneaux compatibles avec les disponibilités de ' + esc(q.student(r.student).first) + ' et le planning du moniteur :</p>' +
            '<div class="slot-list" id="co-list">' + (sug.map((x, i) => '<button class="slot ' + (i === 0 ? 'is-on' : '') + '" data-co="' + i + '">' + cap(fmt.dayShort(x.date)) + ' · ' + fmt.time(x.start) + '</button>').join('') || '<p class="empty">Aucune suggestion automatique.</p>') + '</div>' +
            '<div class="form-grid"><label class="field"><span>Ou une date</span><input class="input" type="date" id="co-date"></label><label class="field"><span>Heure</span><input class="input" type="time" id="co-time" step="1800" value="10:00"></label></div>',
          actions: [{ label: 'Annuler' }, { label: 'Envoyer la proposition', cls: 'btn-primary', icon: 'send', onClick: (w) => {
            const d = w.querySelector('#co-date').value, t = w.querySelector('#co-time').value;
            const slot = d && t ? { date: d, start: t } : pick;
            if (!slot) { FP.toast('Choisissez un créneau.', 'warn'); return false; }
            FP.act.counterRequest(r.id, slot, by); FP.toast('Proposition envoyée à ' + q.student(r.student).first + '.');
          } }]
        });
        m.el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-co]'); if (!b) return; pick = sug[+b.dataset.co]; m.el.querySelectorAll('[data-co]').forEach((x) => x.classList.toggle('is-on', x === b)); m.el.querySelector('#co-date').value = ''; });
      }
    });
  };
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);

  FP.v = v;
})(window);
