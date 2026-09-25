/* ==========================================================================
   Flash PERMIS — Site vitrine
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, q, fmt, icon } = FP;

  FP.hydrate(document);

  /* En-tête : fond au défilement + menu mobile */
  const header = $('.site-header');
  const mcta = $('.mobile-cta');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    if (mcta) mcta.classList.toggle('is-on', y > 520);
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = $('.burger'), mnav = $('#mobile-nav');
  if (burger) {
    const toggle = (open) => {
      mnav.hidden = !open; burger.setAttribute('aria-expanded', String(open));
      burger.innerHTML = icon(open ? 'x' : 'menu');
      document.body.classList.toggle('no-scroll', open);
      header.classList.toggle('is-scrolled', open || window.scrollY > 20);
    };
    burger.addEventListener('click', () => toggle(mnav.hidden));
    $$('a', mnav).forEach((a) => a.addEventListener('click', () => toggle(false)));
  }

  /* Données dynamiques (issues de la démo) */
  function bindDemo() {
    const next = q.upcoming('lucas')[0];
    if (next) {
      $$('[data-bind="next-lesson"]').forEach((el) => { el.textContent = fmt.dayCap(next.date) + ' — ' + fmt.time(next.start); });
      $$('[data-bind="next-lesson-short"]').forEach((el) => { el.textContent = fmt.dayShort(next.date).replace(/^./, (c) => c.toUpperCase()); });
    }
    const slots = q.compatibleSlots('lucas').slice(0, 3);
    slots.forEach((s, i) => { const el = $('[data-bind="slot-' + (i + 1) + '"]'); if (el) el.textContent = fmt.dayShort(s.date).replace(/^./, (c) => c.toUpperCase()).replace(/\.$/, '') + ' · ' + fmt.time(s.start); });
  }

  function renderFormations() {
    const grid = $('#formation-grid'); if (!grid) return;
    const list = FP.store.db.content.formations.filter((f) => f.visible);
    grid.innerHTML = list.map((f, i) =>
      '<article class="formation reveal ' + (i % 3 ? 'd' + (i % 3) : '') + '">' +
      '<div class="f-top"><span class="f-ic">' + icon(f.icon) + '</span><span class="badge badge-mute">' + esc(f.badge) + '</span></div>' +
      '<h3>' + esc(f.title) + '</h3><p>' + esc(f.desc) + '</p>' +
      '<ul class="f-points">' + f.points.map((p) => '<li>' + icon('check') + esc(p) + '</li>').join('') + '</ul>' +
      (f.price ? '<p class="f-price">' + esc(f.price) + '</p>' : '') +
      '<a class="btn btn-ghost btn-block" href="inscription.html?formation=' + encodeURIComponent(f.id) + '">Demander des informations' + icon('arrow') + '</a>' +
      '</article>').join('');
    const fl = $('#footer-formations');
    if (fl) fl.innerHTML = list.map((f) => '<li><a href="inscription.html?formation=' + encodeURIComponent(f.id) + '">' + esc(f.title) + '</a></li>').join('');
  }

  function renderContact() {
    const s = FP.store.db.content.school;
    const todo = (label) => '<span class="todo">' + icon('edit') + label + '</span>';
    const set = (k, val, empty) => { $$('[data-school="' + k + '"]').forEach((el) => { el.innerHTML = val ? esc(val) : todo(empty); }); };
    set('address', s.address ? s.address + ', ' + s.cp + ' ' + s.city : '', 'Adresse à renseigner — Gardanne (13120)');
    set('phone', s.phone, 'À renseigner dans l’administration');
    set('email', s.email, 'À renseigner dans l’administration');
    set('hours', s.hours, 'À renseigner dans l’administration');
  }

  function renderCodeChart() {
    const el = $('#home-code-chart'); if (!el) return;
    const series = FP.store.db.code.lucas.series.slice(-10);
    FP.lineChart(el, series, { min: 20, max: 40, goal: 35, height: 220, ticks: [20, 25, 30, 35, 40], aria: 'Évolution des résultats de code de Lucas sur les 10 dernières séries' });
  }

  /* Pile de notifications animée */
  function animateNotifs() {
    const items = $$('#notif-stack .ns-item'); if (!items.length) return;
    let i = 0;
    const tick = () => { items.forEach((it, k) => it.classList.toggle('is-hot', k === i)); i = (i + 1) % items.length; };
    tick(); setInterval(tick, 2200);
  }

  function renderAll() { bindDemo(); renderFormations(); renderContact(); FP.hydrate(document); FP.reveal(); }
  renderAll();
  renderCodeChart();
  animateNotifs();
  FP.store.on(() => { renderAll(); });
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
