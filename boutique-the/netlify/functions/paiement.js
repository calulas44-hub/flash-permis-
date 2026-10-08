/*
 * Paiement par carte via Stripe Checkout (utilisé seulement si
 * BOUTIQUE.paiement.mode = "stripe" dans assets/js/config.js).
 *
 * Variables d'environnement Netlify :
 *   STRIPE_SECRET_KEY  clé secrète Stripe (sk_test_… pour tester, sk_live_… en production)
 *   URL                fournie automatiquement par Netlify (adresse du site)
 *
 * Les prix et frais de port sont recalculés ici à partir du catalogue et de
 * la configuration : le navigateur n'envoie que des identifiants et des quantités.
 */
const CATALOGUE = require("../../assets/js/catalogue.js");
const CONFIG = require("../../assets/js/config.js");

const json = (statusCode, corps) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(corps)
});

async function stripe(chemin, methode, params) {
  const res = await fetch("https://api.stripe.com/v1/" + chemin, {
    method: methode,
    headers: {
      Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params ? params.toString() : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || "Erreur Stripe");
  return data;
}

const centimes = (euros) => Math.round(euros * 100);

exports.handler = async (event) => {
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { erreur: "Paiement non configuré (STRIPE_SECRET_KEY manquante)" });

  // Vérification d'une session après retour de Stripe
  if (event.httpMethod === "GET") {
    const id = event.queryStringParameters && event.queryStringParameters.session_id;
    if (!id || !/^cs_[A-Za-z0-9_]+$/.test(id)) return json(400, { erreur: "Session invalide" });
    try {
      const s = await stripe("checkout/sessions/" + encodeURIComponent(id), "GET");
      return json(200, { payment_status: s.payment_status, status: s.status, montant: s.amount_total / 100 });
    } catch (e) {
      return json(502, { erreur: e.message });
    }
  }

  if (event.httpMethod !== "POST") return json(405, { erreur: "Méthode non autorisée" });

  let demande;
  try { demande = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { erreur: "Requête illisible" }); }

  const lignes = Array.isArray(demande.lignes) ? demande.lignes.slice(0, 50) : [];
  if (!lignes.length) return json(400, { erreur: "Panier vide" });

  const params = new URLSearchParams();
  let sousTotal = 0, n = 0;
  for (const l of lignes) {
    const p = CATALOGUE.produits.find((x) => x.id === l.id);
    const f = p && p.formats.find((x) => x.id === l.format);
    const qte = Math.max(1, Math.min(20, parseInt(l.qte, 10) || 1));
    if (!p || !f) return json(400, { erreur: "Produit inconnu : " + String(l.id).slice(0, 40) });
    if (!p.stock) return json(409, { erreur: p.famille + " " + p.nom + " est épuisé" });
    sousTotal += f.prix * qte;
    params.append(`line_items[${n}][quantity]`, qte);
    params.append(`line_items[${n}][price_data][currency]`, "eur");
    params.append(`line_items[${n}][price_data][unit_amount]`, centimes(f.prix));
    params.append(`line_items[${n}][price_data][product_data][name]`, `${p.famille} ${p.nom} — ${f.nom}`);
    n++;
  }

  const mode = CONFIG.livraison.modes.find((m) => m.id === demande.livraison && m.actif !== false);
  if (!mode) return json(400, { erreur: "Mode de livraison inconnu" });
  const frais = mode.gratuitDes != null && sousTotal >= mode.gratuitDes ? 0 : mode.prix;

  const site = process.env.URL || ("https://" + (event.headers.host || ""));
  const client = demande.client || {};
  params.append("mode", "payment");
  params.append("locale", "fr");
  params.append("success_url", site + "/confirmation.html?session_id={CHECKOUT_SESSION_ID}");
  params.append("cancel_url", site + "/commande.html");
  if (client.email) params.append("customer_email", String(client.email).slice(0, 200));
  params.append("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  params.append("shipping_options[0][shipping_rate_data][display_name]", mode.nom);
  params.append("shipping_options[0][shipping_rate_data][fixed_amount][amount]", centimes(frais));
  params.append("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "eur");
  params.append("metadata[numero]", String(demande.numero || "").slice(0, 40));
  params.append("metadata[livraison]", mode.nom);
  ["prenom", "nom", "adresse", "complement", "cp", "ville", "telephone"].forEach((k) => {
    if (client[k]) params.append(`metadata[${k}]`, String(client[k]).slice(0, 200));
  });

  try {
    const session = await stripe("checkout/sessions", "POST", params);
    return json(200, { url: session.url });
  } catch (e) {
    return json(502, { erreur: e.message });
  }
};
