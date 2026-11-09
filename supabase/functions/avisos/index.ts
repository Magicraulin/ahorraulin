// =====================================================================
//  AHORRAULIN · Servicio de recordatorios (Supabase Edge Function «avisos»)
//  Cada 5 minutos la base de datos llama a esta función. Ella pregunta a
//  quién le toca el recordatorio y le manda una notificación al móvil.
//  La notificación lleva el texto dentro, cifrado (estándar Web Push aes128gcm).
//  Secretos necesarios (Edge Functions → Secrets):
//    VAPID_PRIVADA  →  {"x":"…","y":"…","d":"…"}   (no se sube a GitHub)
//  SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
// =====================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CONTACTO = "mailto:eventos@magoraulfernandez.com";

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlTxt = (s: string) => b64url(new TextEncoder().encode(s));
const deB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));

async function rpc(fn: string, args: Record<string, unknown> = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${fn}: ${r.status} ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// Firma VAPID (JWT ES256) para el servidor de notificaciones de cada móvil
async function cabeceraVapid(endpoint: string, clave: { x: string; y: string; d: string }) {
  const aud = new URL(endpoint).origin;
  const key = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: clave.x, y: clave.y, d: clave.d, ext: true },
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const cuerpo = `${b64urlTxt(JSON.stringify({ typ: "JWT", alg: "ES256" }))}.${b64urlTxt(JSON.stringify({
    aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: CONTACTO,
  }))}`;
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(cuerpo));
  const publica = b64url(new Uint8Array([4, ...deB64url(clave.x), ...deB64url(clave.y)]));
  return `vapid t=${cuerpo}.${b64url(firma)}, k=${publica}`;
}

// Cifrado estándar de Web Push (RFC 8291, aes128gcm) para mandar el texto dentro del aviso
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, bytes * 8));
}
const unir = (...p: Uint8Array[]) => { const o = new Uint8Array(p.reduce((s, x) => s + x.length, 0)); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; };
async function cifrar(texto: string, p256dh: string, auth: string) {
  const te = new TextEncoder();
  const uaPub = deB64url(p256dh), secreto = deB64url(auth);
  const efimera = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", efimera.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const comun = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, efimera.privateKey, 256));
  const ikm = await hkdf(secreto, comun, unir(te.encode("WebPush: info\0"), uaPub, asPub), 32);
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(sal, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(sal, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, unir(te.encode(texto), new Uint8Array([2]))));
  return unir(sal, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPub.length]), asPub, cifrado);
}

const TEXTOS = [
  "¿Has apuntado lo de hoy? 🐷 Son 10 segundos.",
  "¡Ey! Tu hucha quiere saber qué has gastado hoy 💸",
  "Un momento de cuentas claras: apunta lo de hoy ✍️",
  "¿Café, gasolina, cena…? Apúntalo antes de que se te olvide ☕",
  "Tus cuentas te echan de menos 🥺 ¿Apuntamos lo de hoy?",
  "Recordatorio mágico 🎩: lo que no se apunta, desaparece… ¡de la cartera!",
  "Hoy también cuenta. Apunta tus gastos e ingresos 💪",
  "¿Ha entrado o salido dinero hoy? Cuéntaselo a Ahorraulin 😉",
];

Deno.serve(async () => {
  try {
    const clave = JSON.parse(Deno.env.get("VAPID_PRIVADA") || "{}");
    if (!clave.d) return new Response("Falta el secreto VAPID_PRIVADA", { status: 500 });
    const pendientes: { endpoint: string; p256dh: string; auth: string }[] = (await rpc("avisos_pendientes")) || [];
    let enviados = 0, caducados = 0; const errores: string[] = [];
    for (const s of pendientes) {
      try {
        const texto = TEXTOS[Math.floor(Math.random() * TEXTOS.length)];
        const cuerpo = await cifrar(JSON.stringify({ titulo: "Ahorraulin", texto }), s.p256dh, s.auth);
        const r = await fetch(s.endpoint, {
          method: "POST",
          headers: { Authorization: await cabeceraVapid(s.endpoint, clave), TTL: "43200", Urgency: "high",
                     "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream" },
          body: cuerpo,
        });
        if (r.status === 404 || r.status === 410) { await rpc("quitar_aviso_caducado", { p_endpoint: s.endpoint }); caducados++; }
        else if (r.ok) enviados++;
        else { const t = await r.text(); console.log("Aviso no aceptado", r.status, t); errores.push(`${r.status} ${t.slice(0, 120)}`); }
      } catch (e) { console.log("Error enviando", e); errores.push(String(e).slice(0, 120)); }
    }
    return new Response(JSON.stringify({ pendientes: pendientes.length, enviados, caducados, errores }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.log(e);
    return new Response(String(e), { status: 500 });
  }
});
