/* ==========================================================================
   Flash PERMIS — composants d'interface partagés
   ========================================================================== */
(function (global) {
  'use strict';
  const FP = (global.FP = global.FP || {});
  const D = FP.date;

  /* ---------- Utilitaires ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  FP.esc = esc; FP.$ = $; FP.$$ = $$;

  /* ---------- Formats (français) ---------- */
  const fmt = {};
  fmt.day = (s) => D.parse(s).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  fmt.dayCap = (s) => cap(fmt.day(s));
  fmt.dayShort = (s) => D.parse(s).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  fmt.dateNum = (s) => D.parse(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  fmt.dateLong = (s) => D.parse(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  fmt.rel = (s) => {
    const n = D.diffDays(D.todayISO(), s);
    if (n === 0) return 'Aujourd’hui';
    if (n === 1) return 'Demain';
    if (n === -1) return 'Hier';
    return fmt.dayCap(s);
  };
  fmt.relShort = (s) => {
    const n = D.diffDays(D.todayISO(), s);
    if (n === 0) return 'Aujourd’hui';
    if (n === 1) return 'Demain';
    if (n === -1) return 'Hier';
    if (n < 0 && n > -7) return 'Il y a ' + -n + ' jours';
    return cap(fmt.dayShort(s));
  };
  fmt.time = (t) => t.replace(':', 'h');
  fmt.range = (start, dur) => fmt.time(start) + ' – ' + fmt.time(D.toHHMM(D.toMin(start) + dur));
  fmt.dur = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? h + ' h' + (r ? ' ' + r : '') : r + ' min'; };
  fmt.hours = (h) => (Math.round(h * 10) / 10).toString().replace('.', ',') + ' h';
  fmt.ago = (stamp) => {
    const s = (Date.now() - new Date(stamp).getTime()) / 1000;
    if (s < 60) return 'À l’instant';
    if (s < 3600) return 'Il y a ' + Math.floor(s / 60) + ' min';
    const d = new Date(stamp); const today = D.todayISO(); const di = D.iso(d);
    if (di === today) return 'Aujourd’hui, ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    const n = D.diffDays(di, today);
    if (n === 1) return 'Hier, ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    if (n < 7) return 'Il y a ' + n + ' jours';
    return fmt.dateLong(di);
  };
  fmt.initials = (p) => ((p.first || ' ')[0] + (p.last || ' ')[0]).toUpperCase();
  FP.fmt = fmt;

  /* ---------- Icônes (SVG en ligne, trait 2px) ---------- */
  const P = {
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="none"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 5-5"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    wheel: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2.5"/><path d="M12 14.5V22M9.6 11.3 2.5 9.5M14.4 11.3l7.1-1.8"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17v4M17 19h4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    swap: '<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    phoneDevice: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 18h.01"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    half: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    minus: '<path d="M5 12h14"/>',
    play: '<path d="m6 3 14 9-14 9V3z"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
  };
  const icon = (n, cls) => '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.circle) + '</svg>';
  FP.icon = icon;

  /* ---------- Logo ---------- */
  const BOLT = '<svg class="logo-bolt" viewBox="0 0 20 30" aria-hidden="true"><path d="M13.5 0 1 17.2h7.3L5.6 30 19 11.6h-7.6L13.5 0z"/></svg>';
  FP.logo = (opts) => {
    opts = opts || {};
    return '<a class="logo ' + (opts.cls || '') + '" href="' + (opts.href || 'index.html') + '" aria-label="Flash PERMIS Gardanne — accueil">' +
      '<span class="logo-word"><span class="logo-l1">FL' + BOLT + 'SH</span><span class="logo-l2">PERMIS</span></span>' +
      (opts.noCity ? '' : '<span class="logo-city"><span>Auto-école</span><span>Gardanne</span></span>') + '</a>';
  };

  /* ---------- Statuts ---------- */
  const SKILL_STATUS = {
    acquis: { label: 'Maîtrisée', icon: 'check', tone: 'ok' },
    en_cours: { label: 'En cours', icon: 'half', tone: 'info' },
    retravailler: { label: 'À retravailler', icon: 'alert', tone: 'warn' },
    non_aborde: { label: 'Non abordée', icon: 'circle', tone: 'mute' }
  };
  const REQ_STATUS = {
    en_attente: { label: 'En attente de validation', tone: 'pending', icon: 'clock' },
    acceptee: { label: 'Confirmé', tone: 'ok', icon: 'checkCircle' },
    refusee: { label: 'Non retenu', tone: 'danger', icon: 'x' },
    contre_proposition: { label: 'Autre créneau proposé', tone: 'info', icon: 'swap' },
    annulee: { label: 'Annulée', tone: 'mute', icon: 'ban' }
  };
  FP.status = { SKILL_STATUS, REQ_STATUS };
  FP.skillBadge = (s) => { const x = SKILL_STATUS[s] || SKILL_STATUS.non_aborde; return '<span class="sk sk-' + x.tone + '" title="' + x.label + '">' + icon(x.icon) + '</span>'; };
  FP.badge = (text, tone, ic) => '<span class="badge badge-' + (tone || 'mute') + '">' + (ic ? icon(ic) : '') + esc(text) + '</span>';
  FP.reqBadge = (st) => { const x = REQ_STATUS[st]; return FP.badge(x.label, x.tone, x.icon); };

  /* ---------- Avatars ---------- */
  const COLORS = ['blue', 'violet', 'teal', 'rose', 'amber', 'green', 'slate'];
  FP.avatar = (p, size, color) => {
    if (!p) return '';
    const c = color || (p.color) || COLORS[(p.first.charCodeAt(0) + p.last.charCodeAt(0)) % COLORS.length];
    return '<span class="avatar av-' + c + ' ' + (size ? 'avatar-' + size : '') + '" aria-hidden="true">' + esc(fmt.initials(p)) + '</span>';
  };

  /* ---------- Jauge circulaire ---------- */
  FP.ring = (pct, opts) => {
    opts = opts || {};
    const size = opts.size || 132, sw = opts.stroke || 12, r = (size - sw) / 2, c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return '<div class="ring ' + (opts.cls || '') + '" style="--size:' + size + 'px" role="img" aria-label="' + pct + ' %' + (opts.aria ? ' ' + esc(opts.aria) : '') + '">' +
      '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
      '<circle class="ring-track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + sw + '" fill="none"/>' +
      '<circle class="ring-bar" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + sw + '" fill="none" stroke-linecap="round" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" style="--c:' + c.toFixed(1) + ';--off:' + off.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '</svg><div class="ring-center"><span class="ring-val">' + pct + '<small>%</small></span>' + (opts.label ? '<span class="ring-label">' + esc(opts.label) + '</span>' : '') + '</div></div>';
  };

  FP.bar = (pct, tone, label) => '<div class="bar ' + (tone ? 'bar-' + tone : '') + '" role="progressbar" aria-valuenow="' + Math.round(pct) + '" aria-valuemin="0" aria-valuemax="100"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '><span style="width:' + Math.max(0, Math.min(100, pct)) + '%"></span></div>';

  FP.spark = (vals, opts) => {
    opts = opts || {};
    const w = opts.w || 96, h = opts.h || 28, min = opts.min != null ? opts.min : Math.min.apply(null, vals), max = opts.max != null ? opts.max : Math.max.apply(null, vals);
    if (!vals.length) return '';
    const x = (i) => (vals.length === 1 ? w / 2 : 2 + (i * (w - 4)) / (vals.length - 1));
    const y = (v) => h - 3 - ((v - min) / (max - min || 1)) * (h - 6);
    const pts = vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + x(vals.length - 1).toFixed(1) + '" cy="' + y(vals[vals.length - 1]).toFixed(1) + '" r="3.5" class="spark-end"/></svg>';
  };

  /* ---------- Courbe d'évolution (résultats du code) ---------- */
  FP.lineChart = (el, series, opts) => {
    opts = opts || {};
    const draw = () => {
      const W = Math.max(280, el.clientWidth || 600), H = opts.height || 240;
      const m = { t: 16, r: 18, b: 30, l: 34 };
      const min = opts.min != null ? opts.min : 0, max = opts.max != null ? opts.max : 40;
      const n = series.length;
      const x = (i) => m.l + (n === 1 ? (W - m.l - m.r) / 2 : (i * (W - m.l - m.r)) / (n - 1));
      const y = (v) => m.t + (1 - (v - min) / (max - min)) * (H - m.t - m.b);
      const ticks = opts.ticks || [20, 25, 30, 35, 40];
      let g = '';
      ticks.forEach((t) => { g += '<line class="lc-grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="lc-tick" x="' + (m.l - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + t + '</text>'; });
      if (opts.goal) g += '<line class="lc-goal" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(opts.goal) + '" y2="' + y(opts.goal) + '"/><text class="lc-goal-label" x="' + (W - m.r) + '" y="' + (y(opts.goal) - 7) + '" text-anchor="end">Objectif ' + opts.goal + '/40</text>';
      const pts = series.map((p, i) => [x(i), y(p.score)]);
      const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      const area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + y(min) + ' L' + pts[0][0].toFixed(1) + ' ' + y(min) + ' Z';
      let dots = '';
      pts.forEach((p, i) => { const last = i === pts.length - 1; dots += '<circle class="lc-dot' + (last ? ' lc-last' : '') + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (last ? 6 : 4) + '"/>'; });
      const lastP = pts[pts.length - 1];
      const lab = '<text class="lc-end" x="' + Math.min(lastP[0], W - m.r - 4) + '" y="' + (lastP[1] - 14) + '" text-anchor="end">' + series[n - 1].score + '/40</text>';
      let xl = '';
      const every = Math.ceil(n / Math.max(3, Math.floor((W - 60) / 70)));
      series.forEach((p, i) => { if (i % every === 0 || i === n - 1) xl += '<text class="lc-tick" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + fmt.dateNum(p.date) + '</text>'; });
      el.innerHTML = '<div class="lc-wrap"><svg class="lc" viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" role="img" aria-label="' + esc(opts.aria || 'Évolution des résultats') + '">' +
        g + '<path class="lc-area" d="' + area + '"/><path class="lc-line" d="' + line + '"/>' + dots + lab + xl +
        '<line class="lc-cross" x1="0" x2="0" y1="' + m.t + '" y2="' + (H - m.b) + '" style="opacity:0"/><rect class="lc-hit" x="' + m.l + '" y="0" width="' + (W - m.l - m.r) + '" height="' + H + '" fill="transparent"/></svg>' +
        '<div class="lc-tip" role="status" aria-live="polite" hidden></div></div>';
      const svg = el.querySelector('svg'), tip = el.querySelector('.lc-tip'), cross = el.querySelector('.lc-cross'), hit = el.querySelector('.lc-hit');
      const move = (ev) => {
        const r = svg.getBoundingClientRect(); const px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) * (W / r.width);
        let bi = 0, bd = Infinity; pts.forEach((p, i) => { const d = Math.abs(p[0] - px); if (d < bd) { bd = d; bi = i; } });
        const p = pts[bi], s = series[bi];
        cross.setAttribute('x1', p[0]); cross.setAttribute('x2', p[0]); cross.style.opacity = 1;
        tip.hidden = false; tip.innerHTML = '<strong>' + s.score + '/40</strong><span>' + cap(fmt.dayShort(s.date)) + ' · série ' + (bi + 1) + '</span>';
        const lx = (p[0] / W) * r.width, ly = (p[1] / H) * r.height;
        tip.style.left = Math.min(Math.max(lx, 60), r.width - 60) + 'px'; tip.style.top = ly + 'px';
        svg.querySelectorAll('.lc-dot').forEach((d, i) => d.classList.toggle('is-hover', i === bi));
      };
      const leave = () => { tip.hidden = true; cross.style.opacity = 0; svg.querySelectorAll('.lc-dot').forEach((d) => d.classList.remove('is-hover')); };
      hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('touchmove', move, { passive: true });
      hit.addEventListener('mouseleave', leave); hit.addEventListener('touchend', leave);
    };
    draw();
    if (global.ResizeObserver) { let lw = el.clientWidth; const ro = new ResizeObserver(() => { if (Math.abs(el.clientWidth - lw) > 8) { lw = el.clientWidth; draw(); } }); ro.observe(el); }
  };

  /* ---------- Toast ---------- */
  FP.toast = (msg, tone) => {
    let host = $('.toasts');
    if (!host) { host = document.createElement('div'); host.className = 'toasts'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = 'toast toast-' + (tone || 'ok');
    t.innerHTML = icon(tone === 'warn' ? 'alert' : tone === 'info' ? 'info' : 'checkCircle') + '<span>' + msg + '</span>';
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 3600);
  };

  /* ---------- Modale / feuille ---------- */
  FP.modal = (o) => {
    const wrap = document.createElement('div');
    const mid = 'mt-' + Date.now().toString(36);
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal ' + (o.wide ? 'modal-wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + mid + '">' +
      '<div class="modal-head"><div><h3 id="' + mid + '">' + esc(o.title) + '</h3>' + (o.sub ? '<p>' + esc(o.sub) + '</p>' : '') + '</div><button class="icon-btn" data-close aria-label="Fermer">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + (o.body || '') + '</div>' +
      (o.actions ? '<div class="modal-foot">' + o.actions.map((a, i) => '<button class="btn ' + (a.cls || 'btn-ghost') + '" data-act="' + i + '">' + (a.icon ? icon(a.icon) : '') + esc(a.label) + '</button>').join('') + '</div>' : '') +
      '</div>';
    document.body.appendChild(wrap);
    document.body.classList.add('no-scroll');
    const prev = document.activeElement;
    const close = () => { wrap.classList.remove('in'); document.body.classList.remove('no-scroll'); setTimeout(() => wrap.remove(), 220); if (prev && prev.focus) prev.focus(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-close]')) { close(); return; }
      const b = e.target.closest('[data-act]');
      if (b) { const a = o.actions[+b.dataset.act]; if (a.onClick && a.onClick(wrap) === false) return; close(); }
    });
    requestAnimationFrame(() => { wrap.classList.add('in'); const f = wrap.querySelector('input,select,textarea,button:not([data-close])'); if (f) f.focus(); });
    if (o.onOpen) o.onOpen(wrap);
    return { el: wrap, close };
  };

  /* ---------- Notifications ---------- */
  const NICON = { slot: 'calendar', lesson: 'car', comment: 'message', skill: 'checkCircle', code: 'book', inscription: 'user', info: 'info' };
  FP.notifItem = (n) => '<button class="notif ' + (n.read ? '' : 'is-unread') + '" data-notif="' + n.id + '" data-link="' + esc(n.link) + '">' +
    '<span class="notif-ic nt-' + n.type + '">' + icon(NICON[n.type] || 'bell') + '</span>' +
    '<span class="notif-body"><span class="notif-text">' + esc(n.text) + '</span><span class="notif-time">' + fmt.ago(n.at) + '</span></span>' +
    (n.read ? '' : '<span class="notif-dot" aria-label="Non lue"></span>') + '</button>';

  /* ---------- Sélecteur d'espace de démonstration ---------- */
  FP.demoMenu = (current) => {
    const items = [
      ['index.html', 'home', 'Site Flash PERMIS'],
      ['eleve.html', 'user', 'Espace élève'],
      ['parent.html', 'heart', 'Espace parents'],
      ['moniteur.html', 'wheel', 'Espace moniteur'],
      ['admin.html', 'layout', 'Administration'],
      ['espace.html', 'play', 'Visite guidée']
    ];
    return '<div class="demo-switch"><button class="demo-btn" aria-haspopup="true" aria-expanded="false">' + icon('sparkles') + '<span>Démo</span>' + icon('down') + '</button>' +
      '<div class="demo-menu" role="menu"><p class="demo-menu-title">Changer d’espace</p>' +
      items.map((i) => '<a role="menuitem" href="' + i[0] + '" class="' + (current === i[0] ? 'is-current' : '') + '">' + icon(i[1]) + i[2] + '</a>').join('') +
      '<button role="menuitem" class="demo-reset">' + icon('refresh') + 'Réinitialiser la démo</button>' +
      '<p class="demo-menu-note">Données fictives, enregistrées uniquement dans ce navigateur.</p></div></div>';
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.demo-btn');
    $$('.demo-switch.open').forEach((d) => { if (!b || d !== b.parentNode) { d.classList.remove('open'); d.querySelector('.demo-btn').setAttribute('aria-expanded', 'false'); } });
    if (b) { const open = b.parentNode.classList.toggle('open'); b.setAttribute('aria-expanded', String(open)); }
    if (e.target.closest('.demo-reset')) {
      FP.store.reset(); FP.toast('Démo réinitialisée : toutes les données fictives ont été régénérées.');
    }
  });

  /* ---------- Coquille applicative (élève, parent, moniteur, admin) ---------- */
  FP.shell = (o) => {
    const root = document.getElementById('app');
    const navHTML = (cls) => o.nav.map((n) => '<a class="' + cls + '" href="#' + n.id + '" data-route="' + n.id + '">' + icon(n.icon) + '<span>' + esc(n.label) + '</span><em class="nav-badge" data-badge="' + n.id + '" hidden></em></a>').join('');
    const tabs = o.nav.filter((n) => (o.tabs || []).includes(n.id));
    root.innerHTML =
      '<div class="app app-' + o.role + '">' +
      '<aside class="app-side" id="side">' +
      '<div class="side-head">' + FP.logo({ href: 'index.html' }) + '<button class="icon-btn side-close" aria-label="Fermer le menu">' + icon('x') + '</button></div>' +
      '<div class="side-role">' + icon(o.roleIcon) + esc(o.roleLabel) + '</div>' +
      '<nav class="side-nav" aria-label="Navigation principale">' + navHTML('side-link') + '</nav>' +
      '<div class="side-foot">' + (o.sideFoot || '') + '<div class="side-user">' + FP.avatar(o.user, 'sm', o.user.color) + '<div><strong>' + esc(o.user.first + ' ' + o.user.last) + '</strong><span>' + esc(o.user.sub) + '</span></div></div></div>' +
      '</aside><div class="side-scrim"></div>' +
      '<div class="app-main">' +
      '<header class="app-top">' +
      '<button class="icon-btn top-menu" aria-label="Ouvrir le menu">' + icon('menu') + '</button>' +
      '<div class="top-brand">' + FP.logo({ href: 'index.html', noCity: true, cls: 'logo-sm' }) + '</div>' +
      '<div class="top-title"><span class="top-kicker">' + esc(o.roleLabel) + '</span><h1 id="view-title">&nbsp;</h1></div>' +
      '<div class="top-actions">' + FP.demoMenu(o.page) +
      '<div class="bell-wrap"><button class="icon-btn bell" aria-label="Notifications" aria-haspopup="true">' + icon('bell') + '<em class="bell-count" hidden></em></button>' +
      '<div class="notif-panel" role="dialog" aria-label="Notifications"><div class="np-head"><strong>Notifications</strong><button class="link-btn np-read">Tout marquer comme lu</button></div><div class="np-list"></div></div></div>' +
      '<span class="top-avatar">' + FP.avatar(o.user, 'sm', o.user.color) + '</span></div>' +
      '</header>' +
      '<div class="demo-ribbon">' + icon('info') + '<span>Démonstration interactive — données fictives. Les actions sont synchronisées entre les espaces.</span></div>' +
      '<main class="app-content" id="view" tabindex="-1"></main>' +
      '</div>' +
      (tabs.length ? '<nav class="app-tabbar" aria-label="Navigation">' + tabs.map((n) => '<a class="tab-link" href="#' + n.id + '" data-route="' + n.id + '">' + icon(n.icon) + '<span>' + esc(n.short || n.label) + '</span><em class="nav-badge" data-badge="' + n.id + '" hidden></em></a>').join('') + '</nav>' : '') +
      '</div>';

    const view = $('#view');
    const side = $('.app');
    const current = () => { const h = location.hash.replace('#', '').split('/')[0]; return o.nav.some((n) => n.id === h) || (o.hidden || []).includes(h) ? h : o.nav[0].id; };
    const param = () => location.hash.replace('#', '').split('/').slice(1).join('/');

    function badges() {
      o.nav.forEach((n) => {
        const v = n.badge ? n.badge() : 0;
        $$('[data-badge="' + n.id + '"]').forEach((b) => { b.hidden = !v; b.textContent = v; });
      });
      if (o.notifTo) {
        const u = FP.q.unread(o.notifTo); const c = $('.bell-count');
        c.hidden = !u; c.textContent = u > 9 ? '9+' : u;
        $('.np-list').innerHTML = FP.q.notifs(o.notifTo).slice(0, 12).map(FP.notifItem).join('') || '<p class="empty">Aucune notification.</p>';
      }
    }
    function render(keepScroll) {
      const r = current();
      const nav = o.nav.find((n) => n.id === r) || { label: (o.hiddenTitles && o.hiddenTitles[r]) || o.roleLabel };
      const act = (o.hiddenParent && o.hiddenParent[r]) || r;
      $$('[data-route]').forEach((a) => a.classList.toggle('is-active', a.dataset.route === act));
      if (o.onRender) o.onRender(r);
      $('#view-title').textContent = nav.title || nav.label;
      document.title = (nav.title || nav.label) + ' · ' + o.roleLabel + ' · Flash PERMIS Gardanne';
      const y = global.scrollY;
      if (!keepScroll) { view.classList.add('anim'); clearTimeout(view._anim); view._anim = setTimeout(() => view.classList.remove('anim'), 450); }
      view.innerHTML = '';
      view.dataset.view = r;
      o.views[r](view, param());
      badges();
      if (keepScroll) global.scrollTo(0, y);
    }
    global.addEventListener('hashchange', () => { side.classList.remove('side-open'); render(); global.scrollTo(0, 0); });
    FP.store.on(() => render(true));

    root.addEventListener('click', (e) => {
      if (e.target.closest('.top-menu')) side.classList.add('side-open');
      if (e.target.closest('.side-close') || e.target.closest('.side-scrim')) side.classList.remove('side-open');
      const bell = e.target.closest('.bell');
      const wrap = $('.bell-wrap');
      if (bell) { wrap.classList.toggle('open'); return; }
      if (!e.target.closest('.notif-panel')) wrap.classList.remove('open');
      if (e.target.closest('.np-read')) { FP.act.markRead(o.notifTo); return; }
      const n = e.target.closest('[data-notif]');
      if (n) {
        wrap.classList.remove('open');
        const link = n.dataset.link;
        FP.act.markRead(o.notifTo, n.dataset.notif);
        if (link) location.hash = link;
      }
    });
    render();
    return { render, badges };
  };

  /* ---------- Hydratation des pages statiques ---------- */
  FP.hydrate = (root) => {
    $$('[data-i]', root).forEach((el) => { const cls = el.className; const tmp = document.createElement('span'); tmp.innerHTML = icon(el.dataset.i, cls); el.replaceWith(tmp.firstChild); });
    $$('[data-ring]', root).forEach((el) => { el.outerHTML = FP.ring(+el.dataset.ring, { size: +el.dataset.size || 120, stroke: +el.dataset.stroke || 12, label: el.dataset.label || '' }); });
    $$('[data-spark]', root).forEach((el) => { el.innerHTML = FP.spark(el.dataset.spark.split(',').map(Number)); });
  };

  /* ---------- Révélation au défilement (site vitrine) ---------- */
  FP.reveal = () => {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in global) || global.matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach((e) => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e) => io.observe(e));
  };
})(window);
