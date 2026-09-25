/* ==========================================================================
   Flash PERMIS — Formulaire de pré-inscription
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon, q } = FP;
  FP.hydrate(document);

  const form = $('#insc-form');
  const DISPOS = ['En semaine, en journée', 'En semaine, en fin de journée', 'Mercredi après-midi', 'Samedi matin', 'Pendant les vacances scolaires'];
  const params = new URLSearchParams(location.search);

  // Formations (issues des contenus modifiables)
  const sel = $('#formation');
  sel.innerHTML = '<option value="">Choisir une formation</option>' + FP.store.db.content.formations.filter((f) => f.visible).map((f) => '<option value="' + esc(f.id) + '">' + esc(f.title) + '</option>').join('') + '<option value="conseil">Je ne sais pas encore — besoin de conseils</option>';
  if (params.get('formation')) sel.value = params.get('formation');

  $('#dispo').innerHTML = DISPOS.map((d, i) => '<label><input type="checkbox" name="dispo" value="' + esc(d) + '" id="d' + i + '"><span class="chip">' + esc(d) + '</span></label>').join('');

  // Statut mineur / majeur : proposé automatiquement à partir de la date de naissance
  const parentBox = $('#parent-box');
  const syncMinor = () => { const minor = form.minor.value === '1'; parentBox.hidden = !minor; };
  $$('input[name="minor"]').forEach((r) => r.addEventListener('change', syncMinor));
  form.birth.addEventListener('change', () => {
    if (!form.birth.value) return;
    const age = q.age({ birth: form.birth.value });
    if (age >= 0 && age < 120) { form.minor.value = age < 18 ? '1' : '0'; syncMinor(); }
  });

  const setErr = (input, msg) => {
    const field = input.closest('.field');
    let e = field.querySelector('.err');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (!e) { e = document.createElement('span'); e.className = 'err'; field.appendChild(e); }
      e.textContent = msg; e.id = e.id || 'err-' + input.name; input.setAttribute('aria-describedby', e.id);
    } else { input.removeAttribute('aria-invalid'); if (e) e.remove(); }
  };

  function validate() {
    let first = null;
    const check = (input, ok, msg) => { setErr(input, ok ? '' : msg); if (!ok && !first) first = input; };
    const phoneOk = (v) => /^(\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/.test(v.trim());
    const mailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    check(form.first, form.first.value.trim().length > 1, 'Indiquez votre prénom.');
    check(form.last, form.last.value.trim().length > 1, 'Indiquez votre nom.');
    check(form.phone, phoneOk(form.phone.value), 'Numéro de téléphone invalide (ex. : 06 12 34 56 78).');
    check(form.email, mailOk(form.email.value), 'Adresse e-mail invalide.');
    const age = form.birth.value ? q.age({ birth: form.birth.value }) : -1;
    check(form.birth, age >= 14 && age <= 99, form.birth.value ? 'Vérifiez la date de naissance.' : 'Indiquez votre date de naissance.');
    check(form.formation, !!form.formation.value, 'Choisissez une formation.');
    if (form.minor.value === '1') {
      check(form.pname, form.pname.value.trim().length > 3, 'Indiquez le nom du parent.');
      check(form.pphone, phoneOk(form.pphone.value), 'Téléphone du parent invalide.');
      check(form.pemail, mailOk(form.pemail.value), 'E-mail du parent invalide.');
    } else { ['pname', 'pphone', 'pemail'].forEach((n) => setErr(form[n], '')); }
    $('#consent-err').hidden = form.consent.checked;
    if (!form.consent.checked && !first) first = form.consent;
    if (first) first.focus();
    return !first;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const minor = form.minor.value === '1';
    FP.act.submitInscription({
      first: form.first.value.trim(), last: form.last.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(),
      birth: form.birth.value, formation: form.formation.value, minor,
      parent: minor ? { name: form.pname.value.trim(), phone: form.pphone.value.trim(), email: form.pemail.value.trim() } : null,
      dispo: $$('input[name="dispo"]:checked').map((i) => i.value), message: form.message.value.trim()
    });
    $('#form-card').innerHTML = '<div class="success" role="status"><span class="success-ic">' + icon('check') + '</span>' +
      '<h2>Votre demande a bien été reçue par Flash PERMIS. Notre équipe reviendra vers vous pour finaliser votre inscription.</h2>' +
      '<p>Merci ' + esc(form.first.value.trim()) + ' ! À très vite à l’agence de Gardanne.</p>' +
      '<div class="row"><a class="btn btn-dark" href="index.html">Retour au site</a><a class="btn btn-ghost" href="admin.html#inscriptions">' + icon('layout') + 'Démo : voir la demande côté administration</a></div></div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid')) setErr(e.target, ''); if (e.target.name === 'consent') $('#consent-err').hidden = true; });
})();
