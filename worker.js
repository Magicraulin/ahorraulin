/* =====================================================================
   PUENTE OPCIONAL · Cloudflare Worker
   - /consejos     → pide a la IA de Claude un plan de ahorro (POST)
   Variables que hay que crear en el Worker (Settings → Variables):
     ANTHROPIC_API_KEY  (Secret)  tu clave de la API de Claude
     ORIGEN             (Text)    la dirección de tu app, p. ej. https://tuusuario.github.io
   ===================================================================== */

const MODELO = "claude-haiku-5-5";   // el modelo más barato y rápido; suficiente para esto

export default {
  async fetch(request, env, ctx) {
    const origen = env.ORIGEN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origen,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // Solo tu app puede usar el puente
    const quien = request.headers.get("Origin") || "";
    if (env.ORIGEN && quien && quien !== env.ORIGEN) return new Response("No permitido", { status: 403, headers: cors });

    const url = new URL(request.url);

    /* ---------- Consejos con IA ---------- */
    if (url.pathname === "/consejos" && request.method === "POST") {
      if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta la clave" }, 500, cors);
      let datos;
      try { datos = await request.json(); } catch (e) { return json({ error: "Datos mal" }, 400, cors); }
      const resumen = JSON.stringify(datos).slice(0, 4000);   // límite para que nadie dispare el gasto

      const prompt = `Eres un asesor de ahorro cercano y práctico que habla español de España. ` +
        `Estos son los datos de gastos e ingresos de los últimos 3 meses de una persona (${String(datos.perfil || "").slice(0,60)}, vive en ${String(datos.provincia || "España").slice(0,40)}):\n${resumen}\n\n` +
        `Escribe un análisis breve (máximo 220 palabras) con este formato:\n` +
        `**Cómo vas** (1-2 frases con la tasa de ahorro y la tendencia)\n` +
        `**Dónde se te va el dinero** (las 2 categorías que más pesan y si suben o bajan)\n` +
        `**Tu plan para este mes** (4 consejos concretos en lista con guiones, con cifras en euros de cuánto ahorraría; ` +
        `si gasta mucho en comer fuera, incluye 2 ideas de recetas baratas)\n` +
        `**Reto de la semana** (1 reto sencillo y motivador)\n` +
        `Tono amable y animado, sin juzgar. No inventes datos que no estén arriba.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODELO, max_tokens: 700, messages: [{ role: "user", content: prompt }] })
      });
      if (!res.ok) return json({ error: "IA no disponible" }, 502, cors);
      const j = await res.json();
      const texto = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
      return json({ texto }, 200, cors);
    }

    return new Response("Ahorraulin · puente activo ✓", { headers: cors });
  }
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
