/* ==========================================================================
   Flash PERMIS — Espace parents (démo : Sophie Martin, mère de Lucas)
   ========================================================================== */
(function () {
  'use strict';
  const { q, act, fmt, icon, esc, $ } = FP;
  const V = FP.v;
  const PID = 'sophie', SID = 'lucas', TO = 'parent:lucas';
  const par = () => FP.store.db.parents.find((p) => p.id === PID);
  const vis = (k) => { const p = par(); return p && p.access && p.visible[k]; };
  const hiddenInfo = (label) => '<div class="hidden-info">' + icon('lock') + '<span>' + label + ' n’est pas partagé(e) par l’auto-école pour le moment.</span></div>';

  function noAccess(el) {
    el.innerHTML = '<div class="card" style="max-width:560px"><div class="stat-ic warn">' + icon('lock') + '</div><h2 style="font-size:22px">Accès parent désactivé</h2><p class="muted mt">L’accès à l’espace parents a été suspendu par l’agence Flash PERMIS. Contactez l’agence pour le réactiver.</p><p class="note mt">' + icon('sparkles') + '<span>Démo : réactivez l’accès depuis <a href="admin.html#parents" style="text-decoration:underline">Administration › Parents</a>.</span></p></div>';
  }
  const guard = (fn) => (el, p) => { if (!par().access) return noAccess(el); fn(el, p); };

  /* ---------------- Vue d'ensemble ---------------- */
  function apercu(el) {
    const s = q.student(SID), p = q.progress(SID), c = q.code(SID), ins = q.instructor(s.instructor);
    const last = q.lastCompleted(SID), next = q.upcoming(SID)[0];
    const m = q.skills(SID);
    const recent = FP.ref.SKILLS.filter((k) => m[k.id].s === 'acquis' && m[k.id].d).sort((a, b) => m[b.id].d.localeCompare(m[a.id].d)).slice(0, 4);
    const docsOk = s.docs.every((d) => d.status === 'valide' || d.status === 'signe');

    el.innerHTML =
      '<div class="page-head"><div><h2>Progression de ' + esc(s.first) + '</h2><p>Bonjour ' + esc(par().first) + ' — voici les grandes étapes de la formation de ' + esc(s.first) + '.</p></div></div>' +
      '<div class="parent-banner"><div><strong>Plus de visibilité. <span>Moins de stress.</span></strong><p>Les informations sont mises à jour par l’équipe Flash PERMIS après chaque leçon.</p></div>' + FP.avatar(s, 'lg', 'blue') + '</div>' +

      '<div class="g g-4 mt">' +
      (vis('progression')
        ? '<a class="card card-dark span-2 hero-card" href="#competences">' + FP.ring(p.pct, { size: 132, stroke: 13, label: p.acquired + ' / ' + p.total }) +
          '<div class="hero-body"><span class="card-kicker">Progression de ' + esc(s.first) + '</span><h3>' + p.pct + ' % des compétences maîtrisées</h3>' + V.heroBlocks(SID) + '<span class="link-arrow" style="margin-top:14px">Voir les compétences ' + icon('arrow') + '</span></div></a>'
        : '<div class="card span-2">' + hiddenInfo('La progression') + '</div>') +
      V.hoursCard(SID) +
      '<div class="card"><span class="stat-label">' + icon('calendar') + 'Prochaine leçon</span>' +
      (vis('planning') ? (next ? '<p class="next-date mt">« ' + esc(next.theme) + ' »</p><div class="next-meta"><span>' + icon('clock') + fmt.dayCap(next.date) + ' — ' + fmt.time(next.start) + '</span><span>' + icon('user') + 'avec ' + esc(ins.first + ' ' + ins.last) + '</span></div>' : '<p class="muted mt">Aucune leçon planifiée.</p>') : hiddenInfo('Le planning')) + '</div>' +
      '</div>' +

      '<div class="g g-main mt"><div class="stack">' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('car') + 'Dernière leçon</span>' + (last ? '<span class="small muted">' + fmt.relShort(last.date) + '</span>' : '') + '</div>' +
      (last ? '<p style="font-size:18px;font-weight:800;letter-spacing:-.02em">« ' + esc(last.theme) + ' »</p><p class="small muted">' + fmt.dayCap(last.date) + ' · ' + fmt.dur(last.duration) + ' avec ' + esc(ins.first) + '</p>' +
        (vis('remarques') && last.shareParent && last.comment ? '<div class="remark mt">' + FP.avatar(ins, 'sm', ins.color) + '<div><span class="card-kicker">Commentaire du moniteur</span><blockquote style="margin-top:4px">« ' + esc(last.comment) + ' »</blockquote></div></div>' : '<div class="mt">' + hiddenInfo('Le commentaire du moniteur') + '</div>')
        : '<p class="empty">Aucune leçon terminée pour le moment.</p>') + '</div>' +

      (vis('progression') ? '<div class="card"><div class="card-head"><span class="card-title">' + icon('checkCircle') + 'Compétences validées récemment</span><a class="link-arrow" href="#competences">Tout voir ' + icon('arrow') + '</a></div><div class="skills">' +
        recent.map((k) => '<div class="skill">' + FP.skillBadge('acquis') + '<span class="skill-label">' + esc(k.label) + '<small>Validée le ' + fmt.dateLong(m[k.id].d) + '</small></span></div>').join('') + '</div>' +
        (V.reworkList(SID) ? '<div class="stack mt">' + V.reworkList(SID) + '</div>' : '') + '</div>' : '') +

      (vis('planning') ? '<div class="card"><div class="card-head"><span class="card-title">' + icon('calendar') + 'Prochaines leçons</span><a class="link-arrow" href="#lecons">Toutes les leçons ' + icon('arrow') + '</a></div><div class="lessons">' + (q.upcoming(SID).slice(0, 3).map((l) => V.lessonRow(l)).join('') || '<p class="empty">Aucune leçon à venir.</p>') + '</div></div>' : '') +
      '</div>' +

      '<div class="stack">' +
      (vis('code') ? '<a class="card" href="#code"><div class="card-head"><span class="card-title">' + icon('book') + 'Progression du code</span>' + (c.delta >= 0 ? FP.badge('En progression', 'ok', 'trend') : FP.badge('À consolider', 'warn')) + '</div>' +
        '<div class="row-between"><div class="stat"><span class="stat-value">' + c.avg + '<small>/40</small></span><span class="stat-sub">Moyenne récente · ' + c.count + ' séries</span></div>' + FP.spark(c.scores.slice(-8), { w: 120, h: 44 }) + '</div></a>'
        : '<div class="card">' + hiddenInfo('Le suivi du code') + '</div>') +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('route') + 'Prochaines étapes</span></div>' + V.steps(SID) +
      '<div class="next-step mt">' + icon('target') + '<span>Prochaine étape : <strong>' + esc(q.nextStep(SID).label.toLowerCase()) + '</strong></span></div></div>' +
      '<div class="card"><div class="card-head"><span class="card-title">' + icon('info') + 'Informations importantes</span></div><div class="stack">' +
      (vis('documents') ? '<div class="row">' + (docsOk ? FP.skillBadge('acquis') + '<span class="small"><b>Dossier d’inscription complet</b></span>' : FP.skillBadge('retravailler') + '<span class="small"><b>Un document reste à fournir</b></span>') + '</div>' : '') +
      '<div class="row">' + FP.skillBadge('acquis') + '<span class="small"><b>Moniteur référent :</b> ' + esc(ins.first + ' ' + ins.last) + '</span></div>' +
      '<p class="note">' + icon('shield') + '<span>La progression affichée est un outil pédagogique : l’auto-école conserve la décision concernant la présentation à l’examen.</span></p></div></div>' +
      '<div class="card card-soft"><div class="card-head"><span class="card-title">' + icon('eye') + 'Informations partagées avec vous</span></div><div class="chips">' +
      [['progression', 'Progression'], ['remarques', 'Remarques'], ['planning', 'Planning'], ['code', 'Code'], ['documents', 'Documents']].map((x) => '<span class="tag ' + (vis(x[0]) ? 'tag-ok' : '') + '">' + icon(vis(x[0]) ? 'check' : 'lock') + x[1] + '</span>').join('') +
      '</div><p class="small muted mt">Paramétré par l’agence Flash PERMIS.</p></div>' +
      '</div></div>';
  }

  function competences(el) {
    if (!vis('progression')) { el.innerHTML = hiddenInfo('La progression'); return; }
    const p = q.progress(SID), s = q.student(SID);
    el.innerHTML = '<div class="card livret-hero">' + FP.ring(p.pct, { size: 150, stroke: 14, label: p.acquired + ' / ' + p.total }) +
      '<div class="stack"><span class="card-kicker">Livret de progression de ' + esc(s.first) + '</span><div><span class="big">' + p.pct + ' %</span><h2>des compétences maîtrisées</h2></div>' + V.legend(SID) +
      '<div class="next-step">' + icon('target') + '<span>Prochaine étape : <strong>' + esc(q.nextStep(SID).label.toLowerCase()) + '</strong></span></div></div></div>' +
      '<p class="note mt">' + icon('info') + '<span>Cette progression est un outil pédagogique. Flash PERMIS conserve la décision concernant la présentation à l’examen.</span></p>' +
      '<div class="section-title"><h3>Compétences par étape</h3></div>' + V.blocks(SID);
  }

  function lecons(el) {
    const s = q.student(SID);
    el.innerHTML = '<div class="page-head"><div><h2>Leçons de ' + esc(s.first) + '</h2><p>' + fmt.hours(q.hours(SID).done) + ' effectuées · ' + fmt.hours(q.hours(SID).planned) + ' planifiées</p></div></div>' +
      '<div class="g g-main"><div class="stack"><div class="card"><div class="card-head"><span class="card-title">' + icon('clock') + 'Historique</span></div><div class="hist">' +
      q.history(SID).map((l) => V.histItem(l, { showComment: vis('remarques') && l.shareParent })).join('') + '</div></div></div>' +
      '<div class="stack"><div class="card"><div class="card-head"><span class="card-title">' + icon('calendar') + 'Prochaines leçons</span></div>' +
      (vis('planning') ? '<div class="lessons">' + (q.upcoming(SID).map((l) => V.lessonRow(l)).join('') || '<p class="empty">Aucune leçon à venir.</p>') + '</div>' : hiddenInfo('Le planning')) + '</div>' + V.hoursCard(SID) + '</div></div>';
  }

  function code(el) {
    if (!vis('code')) { el.innerHTML = hiddenInfo('Le suivi du code'); return; }
    const c = q.code(SID);
    el.innerHTML = '<div class="page-head"><div><h2>Progression du code</h2><p>Résultats des séries d’entraînement de ' + esc(q.student(SID).first) + '.</p></div></div>' + V.codeStats(SID) +
      '<div class="g g-main mt"><div class="stack"><div class="card"><div class="card-head"><span class="card-title">' + icon('chart') + 'Évolution des résultats</span></div><div id="p-chart"></div></div>' + V.codeMessage(SID) + '</div>' +
      '<div class="stack"><div class="card"><div class="card-head"><span class="card-title">' + icon('list') + '5 derniers résultats</span></div>' + V.last5(SID) + '</div><div class="card"><div class="card-head"><span class="card-title">' + icon('grid') + 'Par thème</span></div>' + V.themes(SID) + '</div></div></div>';
    FP.lineChart($('#p-chart'), c.series, { min: 15, max: 40, goal: 35, ticks: [15, 20, 25, 30, 35, 40], height: 250, aria: 'Évolution des résultats de code' });
  }

  function notifications(el) {
    el.innerHTML = '<div class="page-head"><div><h2>Notifications</h2><p>Vous êtes prévenu(e) des événements importants de la formation.</p></div><div class="page-actions"><button class="btn btn-ghost" data-readall>' + icon('check') + 'Tout marquer comme lu</button></div></div>' +
      '<div class="card"><div class="feed">' + (q.notifs(TO).map(FP.notifItem).join('') || '<p class="empty">Aucune notification.</p>') + '</div></div>';
  }

  FP.shell({
    role: 'parent', page: 'parent.html', roleLabel: 'Espace parents', roleIcon: 'heart',
    user: { first: 'Sophie', last: 'Martin', sub: 'Mère de Lucas', color: 'rose' },
    notifTo: TO,
    nav: [
      { id: 'apercu', label: 'Vue d’ensemble', short: 'Accueil', icon: 'home' },
      { id: 'competences', label: 'Compétences', short: 'Livret', icon: 'clipboard' },
      { id: 'lecons', label: 'Leçons', short: 'Leçons', icon: 'car' },
      { id: 'code', label: 'Code de la route', short: 'Code', icon: 'book' },
      { id: 'notifications', label: 'Notifications', short: 'Alertes', icon: 'bell', badge: () => q.unread(TO) }
    ],
    tabs: ['apercu', 'competences', 'lecons', 'code', 'notifications'],
    sideFoot: V.agencyCard(),
    views: { apercu: guard(apercu), competences: guard(competences), lecons: guard(lecons), code: guard(code), notifications: guard(notifications) }
  });

  document.addEventListener('click', (e) => { if (e.target.closest('[data-readall]')) act.markRead(TO); });
})();
