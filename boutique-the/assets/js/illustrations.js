/*
 * Illustrations au trait (catégories) et icônes de l'interface, en SVG.
 * Tout est dessiné avec currentColor : la couleur se règle en CSS.
 */
(function () {
  var trait = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

  // Grandes illustrations (viewBox 120 × 120) — style gravure au trait fin.
  var ILLUS = {
    feuille:
      '<svg viewBox="0 0 120 120" ' + trait + ' stroke-width="1.6" aria-hidden="true">' +
      '<path d="M58 108 C59 88 58 66 62 42 C63 34 64 26 64 18"/>' +
      '<path d="M59 86 C44 86 30 76 25 58 C42 58 55 68 59 86Z"/><path d="M59 86 C49 78 37 68 25 58"/>' +
      '<path d="M33 66 l3 -7 M40 72 l4 -8 M47 77 l3 -8 M52 81 l2 -7" stroke-width="1"/>' +
      '<path d="M61 68 C76 68 90 57 94 40 C77 41 64 51 61 68Z"/><path d="M61 68 C71 59 83 49 94 40"/>' +
      '<path d="M86 48 l-6 -2 M79 54 l-7 -3 M72 59 l-7 -2 M66 64 l-5 -1" stroke-width="1"/>' +
      '<path d="M62 46 C50 43 42 34 41 21 C53 25 61 34 62 46Z"/><path d="M62 46 C55 38 48 30 41 21"/>' +
      '<path d="M64 18 C59 13 59 6 63 2 C67 7 68 13 64 18Z"/>' +
      '<path d="M63 30 C70 26 74 20 74 13 C68 16 64 22 63 30Z"/>' +
      '<path d="M40 104 C50 100 70 100 80 104" stroke-width="1"/>' +
      '<circle cx="30" cy="36" r="1"/><circle cx="88" cy="74" r="1"/><circle cx="92" cy="24" r="1.2"/>' +
      '</svg>',
    tasse:
      '<svg viewBox="0 0 120 120" ' + trait + ' stroke-width="1.6" aria-hidden="true">' +
      '<path d="M28 58 H88 C88 78 76 92 58 92 C40 92 28 78 28 58Z"/>' +
      '<path d="M30 66 C46 70 70 70 86 66" stroke-width="1"/>' +
      '<path d="M88 64 C98 62 103 68 101 75 C99 82 92 84 84 82"/>' +
      '<path d="M16 96 C30 104 88 104 102 96 C96 92 22 92 16 96Z"/>' +
      '<path d="M46 50 C40 44 52 38 46 30 C42 25 46 21 49 19"/>' +
      '<path d="M58 50 C52 42 64 36 58 26 C55 21 58 16 61 14"/>' +
      '<path d="M70 50 C64 44 76 38 70 30 C67 25 70 21 73 19"/>' +
      '<path d="M44 80 C50 72 62 71 68 77 C60 83 52 84 44 80Z" stroke-width="1.2"/><path d="M44 80 C52 78 60 77 68 77" stroke-width="1"/>' +
      '<circle cx="22" cy="40" r="1"/><circle cx="96" cy="36" r="1.2"/>' +
      '</svg>',
    bourgeon:
      '<svg viewBox="0 0 120 120" ' + trait + ' stroke-width="1.6" aria-hidden="true">' +
      '<path d="M60 110 C60 96 60 78 60 58"/>' +
      '<path d="M60 58 C51 47 50 30 60 12 C70 30 69 47 60 58Z"/>' +
      '<path d="M60 56 C58 44 58 30 60 16" stroke-width="1"/>' +
      '<path d="M55 26 l-3 -2 M54 34 l-4 -1 M54 42 l-4 0 M65 26 l3 -2 M66 34 l4 -1 M66 42 l4 0" stroke-width="0.9"/>' +
      '<path d="M60 88 C43 88 29 78 24 60 C42 60 55 70 60 88Z"/><path d="M60 88 C50 79 38 69 24 60"/>' +
      '<path d="M60 74 C77 74 91 64 96 46 C78 46 65 56 60 74Z"/><path d="M60 74 C70 65 82 55 96 46"/>' +
      '<path d="M34 70 l2 -6 M42 76 l3 -7 M50 80 l2 -6 M86 54 l-6 -2 M78 60 l-6 -2 M70 66 l-6 -1" stroke-width="1"/>' +
      '<circle cx="40" cy="30" r="1"/><circle cx="82" cy="24" r="1"/><circle cx="88" cy="84" r="1.2"/>' +
      '</svg>',
    fleur:
      '<svg viewBox="0 0 120 120" ' + trait + ' stroke-width="1.6" aria-hidden="true">' +
      '<g>' +
      [0, 72, 144, 216, 288].map(function (a) {
        return '<g transform="rotate(' + a + ' 60 58)"><path d="M60 56 C50 46 46 28 56 18 C58 22 62 22 64 18 C74 28 70 46 60 56Z"/><path d="M60 54 C58 42 58 32 60 22" stroke-width="0.9"/></g>';
      }).join("") +
      '</g>' +
      '<circle cx="60" cy="58" r="5"/>' +
      '<path d="M60 58 C66 70 74 78 86 84"/><circle cx="86" cy="84" r="2"/><circle cx="82" cy="78" r="1.4"/><circle cx="78" cy="83" r="1.4"/>' +
      '<path d="M40 104 C46 96 56 94 62 98" stroke-width="1"/><circle cx="20" cy="30" r="1"/><circle cx="100" cy="28" r="1.2"/>' +
      '</svg>',
    cadeau:
      '<svg viewBox="0 0 120 120" ' + trait + ' stroke-width="1.6" aria-hidden="true">' +
      '<rect x="26" y="56" width="68" height="46" rx="2"/>' +
      '<rect x="22" y="44" width="76" height="13" rx="2"/>' +
      '<path d="M60 44 V102"/><path d="M52 44 V102 M68 44 V102" stroke-width="0.9"/>' +
      '<path d="M60 44 C50 28 32 28 36 38 C40 46 52 46 60 44Z"/>' +
      '<path d="M60 44 C70 28 88 28 84 38 C80 46 68 46 60 44Z"/>' +
      '<path d="M60 44 C56 52 50 58 44 60 M60 44 C64 52 70 58 76 60" stroke-width="1.2"/>' +
      '<path d="M84 66 C92 62 98 66 100 72 C94 74 88 72 84 66Z" stroke-width="1.2"/><path d="M84 66 C90 68 95 70 100 72" stroke-width="0.9"/>' +
      '<circle cx="20" cy="30" r="1"/><circle cx="100" cy="26" r="1.2"/><circle cx="14" cy="80" r="1"/>' +
      '</svg>',
    theiere:
      '<svg viewBox="0 0 120 120" ' + trait + ' stroke-width="1.6" aria-hidden="true">' +
      '<path d="M32 66 C32 50 45 42 60 42 C75 42 88 50 88 66 C88 82 77 94 60 94 C43 94 32 82 32 66Z"/>' +
      '<path d="M44 44 C46 36 52 32 60 32 C68 32 74 36 76 44"/>' +
      '<path d="M57 32 C56 28 58 25 60 25 C62 25 64 28 63 32"/>' +
      '<path d="M33 70 C24 68 18 60 13 48 L18 47 C22 56 27 60 33 60"/>' +
      '<path d="M88 54 C100 52 105 62 103 70 C101 78 95 82 86 80"/>' +
      '<path d="M36 72 C48 78 72 78 84 72" stroke-width="1"/>' +
      '<path d="M48 62 C54 56 64 56 70 62 C64 66 54 66 48 62Z" stroke-width="1.1"/><path d="M48 62 H70" stroke-width="0.9"/>' +
      '<path d="M40 98 H80"/><circle cx="22" cy="28" r="1"/><circle cx="100" cy="30" r="1.2"/>' +
      '</svg>'
  };

  // Petites icônes d'interface (viewBox 24 × 24).
  function ico(d, extra) {
    return '<svg viewBox="0 0 24 24" ' + trait + ' stroke-width="1.5" aria-hidden="true"' + (extra || "") + '>' + d + '</svg>';
  }
  var ICONES = {
    recherche: ico('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>'),
    panier: ico('<path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
    menu: ico('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    fermer: ico('<path d="M6 6l12 12M18 6 6 18"/>'),
    fleche: ico('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    chevron: ico('<path d="m6 9 6 6 6-6"/>'),
    plus: ico('<path d="M12 5v14M5 12h14"/>'),
    moins: ico('<path d="M5 12h14"/>'),
    poubelle: ico('<path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"/>'),
    filtre: ico('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
    feuille: ico('<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15Z"/><path d="M5 19 14 10"/>'),
    terre: ico('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5Z"/>'),
    cuillere: ico('<ellipse cx="8.5" cy="8.5" rx="4" ry="5" transform="rotate(-45 8.5 8.5)"/><path d="m11.5 11.5 8 8"/>'),
    thermo: ico('<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0Z"/><path d="M12 10v7"/>'),
    sablier: ico('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>'),
    soleil: ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    tasse: ico('<path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3c-1 1 1 2 0 3M12 3c-1 1 1 2 0 3"/>'),
    colis: ico('<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.3l8.5 4.5"/>'),
    rapide: ico('<path d="M8 7.5 15 4l6 3.2v7.6L15 18l-7-3.4Z"/><path d="M8 7.5 15 11l6-3.8M15 11v7M2 10h4M3 13h3M2 16h4"/>'),
    cadenas: ico('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5"/>'),
    retour: ico('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
    bulle: ico('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z"/><path d="M12 15.5s-3.2-1.9-3.2-4a1.7 1.7 0 0 1 3.2-.9 1.7 1.7 0 0 1 3.2.9c0 2.1-3.2 4-3.2 4Z"/>'),
    loupe: ico('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M8 10.5h5M10.5 8v5"/>'),
    check: ico('<path d="m5 12.5 4.5 4.5L19 7"/>'),
    alerte: ico('<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17v.01"/>'),
    mail: ico('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>'),
    lune: ico('<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"/>'),
    cadeau: ico('<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M3 7h18v3H3ZM12 7v13M12 7c-2-3-5.5-3-5 0M12 7c2-3 5.5-3 5 0"/>'),
    partager: ico('<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>')
  };

  // Pictogrammes de format (onglets de la fiche produit).
  var FORMATS = {
    "sachet": '<svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M12 8h16l2 34H10Z"/><path d="M12 12h16"/><text x="20" y="31" font-size="8" font-style="italic" text-anchor="middle" fill="currentColor" stroke="none">S</text></svg>',
    "sachet-l": '<svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M10 4h20l3 40H7Z"/><path d="M10 9h20"/><text x="20" y="31" font-size="8" font-style="italic" text-anchor="middle" fill="currentColor" stroke="none">L</text></svg>',
    "boite": '<svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="12" width="22" height="30" rx="2"/><path d="M8 8h24v5H8Z"/><circle cx="20" cy="27" r="6"/></svg>',
    "cadeau": '<svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="20" width="24" height="22" rx="1"/><path d="M6 14h28v6H6ZM20 14v28M20 14c-3-6-9-6-8-1M20 14c3-6 9-6 8-1"/></svg>',
    "infuseur": '<svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M8 18h24l-3 16a9 9 0 0 1-18 0Z"/><path d="M5 18h30M14 24v8M20 24v10M26 24v8"/></svg>',
    "theiere": '<svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M10 26c0-6 4.5-9 10-9s10 3 10 9-4.5 12-10 12-10-6-10-12Z"/><path d="M14 17c1-3 3-4 6-4s5 1 6 4M10 28c-3-1-5-4-6-8M30 22c4 0 5 3 4 6s-3 4-5 4"/></svg>'
  };

  // Logo : médaillon corail, tasse fumante dont la vapeur dessine une feuille.
  var LOGO =
    '<svg viewBox="0 0 120 120" aria-hidden="true">' +
    '<circle cx="60" cy="60" r="58" fill="#fff" stroke="#F87C56" stroke-width="2"/>' +
    '<circle cx="60" cy="60" r="51" fill="#F87C56"/>' +
    '<circle cx="60" cy="60" r="46" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>' +
    '<g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M35 64h44c0 13-9 22-22 22s-22-9-22-22Z"/>' +
    '<path d="M79 68c7-1 10 3 9 8-1 4-6 6-11 5"/>' +
    '<path d="M30 90c8 4 46 4 56 0"/>' +
    '<path d="M57 58c-9-6-9-18 1-27 9 8 8 20-1 27Z"/>' +
    '<path d="M57 58c0-9 0-17 1-24" stroke-width="1.4"/>' +
    '<path d="M47 57c-4-4 2-7-1-11M68 57c-3-4 3-7 0-11" stroke-width="1.6"/>' +
    '</g></svg>';

  window.ILLUS = ILLUS;
  window.ICONES = ICONES;
  window.FORMATS = FORMATS;
  window.LOGO = LOGO;
})();
