// =====================================================================
//  AHORRAULIN · Servicio de recordatorios (Supabase Edge Function «avisos»)
//  Cada 5 minutos la base de datos llama a esta función. Ella pregunta a
//  quién le toca el recordatorio y le manda una notificación al móvil.
//  La notificación va sin contenido: el texto lo pone la propia app (sw.js).
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

Deno.serve(async () => {
  try {
    const clave = JSON.parse(Deno.env.get("VAPID_PRIVADA") || "{}");
    if (!clave.d) return new Response("Falta el secreto VAPID_PRIVADA", { status: 500 });
    const pendientes: { endpoint: string }[] = (await rpc("avisos_pendientes")) || [];
    let enviados = 0, caducados = 0;
    for (const s of pendientes) {
      try {
        const r = await fetch(s.endpoint, {
          method: "POST",
          headers: { Authorization: await cabeceraVapid(s.endpoint, clave), TTL: "43200", Urgency: "normal", "Content-Length": "0" },
        });
        if (r.status === 404 || r.status === 410) { await rpc("quitar_aviso_caducado", { p_endpoint: s.endpoint }); caducados++; }
        else if (r.ok) enviados++;
        else console.log("Aviso no aceptado", r.status, await r.text());
      } catch (e) { console.log("Error enviando", e); }
    }
    return new Response(JSON.stringify({ pendientes: pendientes.length, enviados, caducados }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.log(e);
    return new Response(String(e), { status: 500 });
  }
});
