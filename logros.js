/* =====================================================================
   AHORRAULIN · Rachas, medallas y «Tu mes en resumen»
   Todo se calcula con los movimientos que ya hay (S.movs). Lo único que
   se guarda en el móvil es: días marcados como «hoy no he gastado nada»,
   qué medallas ya se celebraron y qué resúmenes ya se vieron.
   ===================================================================== */

const LS = {
  get(k, def){ try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch(e){ return def; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
const kNada = () => "ahorraulin_nada_" + S.id;
const TEMPORADA = () => new Date().getFullYear();
const kMedallas = () => "ahorraulin_medallas_" + S.id + "_" + TEMPORADA();
const kResumen = () => "ahorraulin_resumen_" + S.id;

/* ---------- Días con actividad y rachas ---------- */
function diasActivos(){
  const s = new Set(LS.get(kNada(), []));
  S.movs.forEach(m => {
    if (m.rec) return;                                   // los fijos se apuntan solos: no cuentan
    s.add(m.fecha);
    if (m.creado) s.add(ymd(new Date(Number(m.creado))));
  });
  const hoy = ymd(new Date());
  return [...s].filter(d => d <= hoy).sort();
}
const diaMas = (d, n) => { const [y,m,dd] = d.split("-").map(Number); return ymd(new Date(y, m-1, dd + n)); };
function racha(){
  const set = new Set(diasActivos()), hoy = ymd(new Date()), ayer = diaMas(hoy, -1);
  const hoyHecho = set.has(hoy);
  let d = hoyHecho ? hoy : ayer, n = 0;
  while (set.has(d)){ n++; d = diaMas(d, -1); }
  return { n, hoyHecho };
}
function rachaMaxima(dias){
  let max = 0, cur = 0, prev = null;
  (dias || diasActivos()).forEach(d => { cur = prev && diaMas(prev, 1) === d ? cur + 1 : 1; max = Math.max(max, cur); prev = d; });
  return max;
}

function pintarRacha(){
  const { n, hoyHecho } = racha();
  let fuego, tit, sub, boton = "";
  if (hoyHecho){ fuego = n >= 7 ? "🔥" : "✅"; tit = n === 1 ? "¡Racha empezada!" : `${n} días seguidos`; sub = "Hoy ya has apuntado. ¡Racha a salvo!"; }
  else if (n > 0){ fuego = "🔥"; tit = n === 1 ? "1 día de racha" : `${n} días seguidos`; sub = "Apunta algo hoy para no romperla"; boton = `<button class="nada" id="nadaHoy">🙌 Hoy nada</button>`; }
  else { fuego = "🌱"; tit = "Empieza tu racha hoy"; sub = "Apunta cada día y mira cómo crece el fuego"; boton = `<button class="nada" id="nadaHoy">🙌 Hoy nada</button>`; }
  $("rachaCard").innerHTML = `<div class="fuego ${n >= 7 ? "vivo" : ""}">${fuego}</div><div class="rt"><b>${tit}</b><small>${sub}</small></div>${boton}`;
}
document.addEventListener("click", e => {
  if (!e.target.closest("#nadaHoy")) return;
  const l = LS.get(kNada(), []), hoy = ymd(new Date());
  if (!l.includes(hoy)) l.push(hoy);
  LS.set(kNada(), l.slice(-400));
  vibrar(); toast("🙌 ¡Día sin gastos! Eso también cuenta para la racha", false, "Tu cartera te lo agradece. 💜"); pintarTodo();
});

/* ---------- Medallas (por temporada: cada año empiezan de cero) ---------- */
const delAno = () => S.movs.filter(m => m.fecha.startsWith(String(TEMPORADA())));
const diasDelAno = () => diasActivos().filter(d => d.startsWith(String(TEMPORADA())));
function mesesCompletos(){
  const hoyK = monthKey(new Date()), ks = [...new Set(delAno().map(m => m.fecha.slice(0,7)))].filter(k => k < hoyK);
  return ks.sort();
}
function tasaAhorroMes(k){
  const l = ofMonth(S.movs, k), i = total(l, "ingreso"), g = total(l, "gasto") - l.filter(m => m.tipo === "gasto" && CATS_GUARDADO.includes(m.cat)).reduce((a,m) => a + m.importe, 0);
  return i > 0 ? (i - g) / i : null;
}
function semanaSinComerFuera(){
  const dias = diasDelAno(); if (dias.length < 3) return false;
  const comer = new Set(S.movs.filter(m => m.tipo === "gasto" && m.cat === "comer").map(m => m.fecha));
  const act = new Set(dias), ayer = diaMas(ymd(new Date()), -1);
  for (let d = dias[0]; d <= diaMas(ayer, -6); d = diaMas(d, 1)){
    let ok = true, activos = 0;
    for (let j = 0; j < 7; j++){ const x = diaMas(d, j); if (comer.has(x)){ ok = false; break; } if (act.has(x)) activos++; }
    if (ok && activos >= 3) return true;
  }
  return false;
}
function presupuestoDeHierro(){
  const l = Object.entries(S.presu || {}); if (!l.length) return false;
  const k = shiftMonth(monthKey(new Date()), -1); if (!k.startsWith(String(TEMPORADA())) || !ofMonth(S.movs, k).length) return false;
  return l.every(([cat, lim]) => ofMonth(S.movs, k).filter(m => m.tipo === "gasto" && m.cat === cat).reduce((a,m) => a + m.importe, 0) <= lim);
}
const MEDALLAS = [
  { id:"primer",   e:"🌱", n:"Primer paso",           c:"Apunta tu primer movimiento del año",         ok: () => delAno().some(m => !m.rec) },
  { id:"racha7",   e:"🔥", n:"Una semana on fire",    c:"Apunta 7 días seguidos",                       ok: () => rachaMaxima(diasDelAno()) >= 7 },
  { id:"racha30",  e:"☄️", n:"Un mes imparable",      c:"Apunta 30 días seguidos",                      ok: () => rachaMaxima(diasDelAno()) >= 30 },
  { id:"racha50",  e:"🌋", n:"Medio centenar",        c:"Apunta 50 días seguidos",                      ok: () => rachaMaxima(diasDelAno()) >= 50 },
  { id:"cien",     e:"🥇", n:"Apuntador de oro",      c:"Llega a 100 apuntes en el año",                ok: () => delAno().filter(m => !m.rec).length >= 100 },
  { id:"hucha",    e:"🐷", n:"Primera hucha",         c:"Aparta dinero en Ahorro o Inversión",          ok: () => delAno().some(m => m.tipo === "gasto" && CATS_GUARDADO.includes(m.cat)) },
  { id:"meta",     e:"🎯", n:"Meta cumplida",         c:"Completa una meta de ahorro",                  ok: () => (S.metas || []).some(t => ahorradoMeta(t.id) >= t.objetivo) },
  { id:"verde",    e:"💚", n:"Mes en verde",          c:"Termina un mes con más ingresos que gastos",   ok: () => mesesCompletos().some(k => { const l = ofMonth(S.movs, k); return total(l,"ingreso") > total(l,"gasto"); }) },
  { id:"pro",      e:"🏆", n:"Ahorrador pro",         c:"Ahorra al menos el 20 % en un mes",            ok: () => mesesCompletos().some(k => (tasaAhorroMes(k) || 0) >= .2) },
  { id:"tupper",   e:"🥗", n:"Semana de táper",       c:"Pasa 7 días sin comer fuera",                  ok: semanaSinComerFuera },
  { id:"hierro",   e:"🛡️", n:"Presupuesto de hierro", c:"Pon un límite de gasto en Ajustes → Presupuestos (p. ej. 100 € en Comer fuera) y termina un mes sin pasarte de ninguno",         ok: presupuestoDeHierro },
  { id:"repaso",   e:"🎬", n:"Repaso hecho",          c:"Mira tu resumen del mes",                      ok: () => Object.keys(LS.get(kResumen(), {})).some(k => k.startsWith(String(TEMPORADA()))) }
];

/* ---------- Premios de la temporada ---------- */
const WHATSAPP_PREMIOS = "34646881395";   // WhatsApp del administrador para canjear premios
const PREMIOS = [
  { tipo:"guia",      medalla:"racha7",  e:"📘", n:"Guía «Trucos para ahorrar»", reto:"7 días seguidos usando la app", descarga:"guias/guia",
    d:"La guía exclusiva de Ahorraulin con los mejores trucos para gastar menos en casa, en el súper, en el coche y en el ocio." },
  { tipo:"recetario", medalla:"tupper",  e:"🥗", n:"Recetario «Comidas y cenas»", reto:"Pasar 7 días sin comer fuera", descarga:"recetarios/recetario",
    d:"54 recetas baratas y fáciles: de cuchara, pasta y arroz, saludables, cenas en 15 minutos, cenas ligeras y fast food casero para el viernes." },
  { tipo:"teatro",    medalla:"racha30", e:"🎭", n:"2x1 en el Teatro Escondido", reto:"30 días seguidos usando la app",
    d:"Entradas 2x1 para cualquier función del Teatro Escondido (Gran Vía, Madrid). Te recomiendo «Contagia tu Magia» 🎩✨" },
  { tipo:"oro",       medalla:"cien",    e:"👑", n:"Tema dorado exclusivo", reto:"Llegar a 100 apuntes en el año", tema:true,
    d:"Desbloquea el color Dorado ✨ en Mi perfil y una corona 👑 junto a tu nombre durante toda la temporada." },
  { tipo:"show",      medalla:"todas",   e:"🎩", n:"Show de magia privado en tu casa", reto:"Conseguir todas las medallas del año",
    d:"Un show de magia de 30 minutos en tu casa con Raúl Fernández. ¡El premio gordo de la temporada!" }
];
const tieneOro = () => !!(S && S.id !== ADMIN && valeDe("oro"));
const ganadoPremio = (p, g) => p.medalla === "todas" ? MEDALLAS.every(m => g.has(m.id)) : g.has(p.medalla);
const valeDe = tipo => (S.premios || []).find(v => v.tipo === tipo && v.temporada === TEMPORADA());
async function cargarPremios(){
  S.premios = null;
  try { const r = await Store.misPremios(S.id, S.pin); if (r.ok){ S.premios = r.premios || []; pintarCabecera(); revisarMedallas(); if (view === "premios") pintarRecompensas(); if (view === "perfil") pintarPerfil(); } } catch(e){}
}
async function reclamarPremios(g){
  if (!S || S.id === ADMIN || !Array.isArray(S.premios) || reclamarPremios.ocupado) return;
  const nuevos = PREMIOS.filter(p => ganadoPremio(p, g) && !valeDe(p.tipo));
  if (!nuevos.length) return;
  reclamarPremios.ocupado = true;
  try {
    for (const p of nuevos){ const r = await Store.reclamarPremio(S.id, S.pin, p.tipo, TEMPORADA()); if (r.ok) S.premios = r.premios; }
    const tipo = nuevos[nuevos.length - 1].tipo;
    setTimeout(() => { if (resumen || $("resumen").classList.contains("show")) valePendiente = tipo; else { confetti(); abrirVale(tipo, true); } }, 1200);
    pintarCabecera(); if (view === "premios") pintarRecompensas(); if (view === "perfil") pintarPerfil();
  } catch(e){} finally { reclamarPremios.ocupado = false; }
}
function premiosHTML(g){
  if (S.id === ADMIN) return `<div class="sub-h">🎁 Premios ${TEMPORADA()}</div><div class="muted small">Eres el mago: estos premios los das tú 🎩. Los vales que ganen Sara y Marta los ves en Mi perfil → Administrador.</div>`;
  return `<div class="sub-h">🎁 Premios ${TEMPORADA()}</div>` + PREMIOS.map(p => {
    const v = valeDe(p.tipo), si = ganadoPremio(p, g) || !!v;
    const estado = v && v.usado ? "✅ Canjeado" : si ? (p.descarga ? "📥 Descargar" : p.tema ? (S.perfil.color === "oro" ? "✨ Activado" : "✨ Activar") : "🎟️ Ver vale") : "🔒 " + p.reto;
    return `<button class="premio ${si ? "si" : ""} ${v && v.usado ? "usado" : ""}" data-premio="${p.tipo}"><span class="pe">${si ? p.e : "🎁"}</span>
      <span class="pt"><b>${esc(p.n)}</b><small>${esc(estado)}</small></span><span class="pa">${si ? "›" : ""}</span></button>`;
  }).join("");
}
function abrirVale(tipo, nuevo){
  const p = PREMIOS.find(x => x.tipo === tipo), v = valeDe(tipo);
  const g = new Set(medallasGanadas());
  if (!v){ vibrar(); toast(`🔒 ${p.n}`, false, "Cómo conseguirlo: " + p.reto.charAt(0).toLowerCase() + p.reto.slice(1)); return; }
  const mensaje = encodeURIComponent(`¡Hola! Gracias a mi constancia en Ahorraulin he conseguido el premio: ${p.n} ${p.e} (código ${v.codigo})`);
  $("valeBody").innerHTML = `
    ${nuevo ? `<div class="vale-nuevo">🎉 ¡Has ganado un premio! 🎉</div>` : ""}
    <div class="vale ${v.usado ? "usado" : ""}">
      <div class="vale-e">${p.e}</div>
      <b class="vale-n">${esc(p.n)}</b>
      <div class="vale-d">${esc(p.d)}</div>
      <div class="vale-corte"></div>
      <small>Tu código</small>
      <div class="vale-c">${esc(v.codigo)}</div>
      <small>Temporada ${v.temporada} · ${v.usado ? "✅ Ya canjeado" : "Válido hasta el 31 de diciembre de " + (v.temporada + 1)}</small>
    </div>
    ${p.descarga
      ? `<a class="btn p" href="${p.descarga}-${PALETAS[S.perfil.color] ? S.perfil.color : "violeta"}.pdf?v=${VERSION}" download="${esc(p.n.replace(/[«»]/g, ""))} - Ahorraulin.pdf" target="_blank" rel="noopener">📥 Descargar (PDF)</a>`
      : p.tema
      ? (S.perfil.color === "oro" ? `<div class="muted small" style="text-align:center">✨ Ya lo llevas puesto. Puedes cambiarlo cuando quieras en Mi perfil → Colores.</div>`
                                  : `<button class="btn p" id="ponerOro">✨ Ponerme el dorado</button>`)
      : v.usado ? "" : `<a class="btn p" href="https://wa.me/${WHATSAPP_PREMIOS}?text=${mensaje}" target="_blank" rel="noopener">💬 Pedir mi premio por WhatsApp</a>
         <div class="muted small" style="text-align:center;margin-top:8px">O enséñale este vale al administrador. Él lo marcará como canjeado.</div>`}`;
  $("valeModal").classList.add("show");
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-premio]"); if (b){ vibrar(); abrirVale(b.dataset.premio); return; }
  if (e.target.closest("#valeCerrar") || e.target.id === "valeModal") $("valeModal").classList.remove("show");
  if (e.target.closest("#ponerOro")){ $("valeModal").classList.remove("show"); guardarAjustes({ color:"oro" }, true); toast("👑 ¡Ya eres Apuntador de oro!", false, "Tema dorado activado ✨"); confetti(); }
});

/* ---------- Panel de Raúl: vales de premios ---------- */
async function pintarAdminPremios(){
  const box = $("adminPremios"); if (!box || S.id !== ADMIN) return;
  try {
    const r = await Store.adminPremios(S.pin); if (!r.ok) throw new Error(r.error);
    const l = r.premios || [];
    box.innerHTML = l.length ? l.map(v => { const p = PREMIOS.find(x => x.tipo === v.tipo) || { e:"🎁", n:v.tipo };
      return `<div class="copia adm"><div class="ci" style="background:var(--soft)">${esc(v.emoji)}</div>
        <div class="cm"><b>${esc(v.nombre)} · ${p.e} ${esc(p.n)}</b><span>${esc(v.codigo)} · ${v.temporada} · ${["guia","recetario","oro"].includes(v.tipo) ? "⚡ Se activa solo" : v.usado ? "✅ Canjeado" : "⏳ Pendiente"}</span></div>
        ${["guia","recetario","oro"].includes(v.tipo) ? "" : `<button class="reset" data-usar="${esc(v.codigo)}" data-u="${v.usado ? 0 : 1}">${v.usado ? "Deshacer" : "Canjear"}</button>`}</div>`; }).join("")
      : `<div class="empty" style="padding:10px">Aún nadie ha ganado premios esta temporada.</div>`;
  } catch(e){ box.innerHTML = `<div class="empty" style="padding:10px">No se pueden cargar los premios ahora mismo.</div>`; }
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-usar]"); if (!b) return;
  b.disabled = true;
  try { const r = await Store.adminUsarPremio(S.pin, b.dataset.usar, b.dataset.u === "1"); if (!r.ok) throw new Error(r.error);
        vibrar(); toast(b.dataset.u === "1" ? `✅ Vale ${b.dataset.usar} canjeado` : `↩️ Vale ${b.dataset.usar} pendiente otra vez`); }
  catch(err){ toast("⚠️ No se ha podido cambiar el vale"); }
  pintarAdminPremios();
});
function medallasGanadas(){ return MEDALLAS.filter(m => { try { return m.ok(); } catch(e){ return false; } }).map(m => m.id); }
// Celebra las medallas nuevas (la primera vez solo las apunta, sin fiesta)
function revisarMedallas(){
  if (!S) return;
  const guardadas = LS.get(kMedallas(), null), ahora = medallasGanadas();
  reclamarPremios(new Set(ahora));
  if (guardadas === null){ LS.set(kMedallas(), Object.fromEntries(ahora.map(id => [id, monthKey(new Date())]))); return; }
  const nuevas = ahora.filter(id => !guardadas[id]);
  if (!nuevas.length) return;
  nuevas.forEach(id => guardadas[id] = monthKey(new Date()));
  LS.set(kMedallas(), guardadas);
  const m = MEDALLAS.find(x => x.id === nuevas[0]);
  setTimeout(() => { toast(m.c + " ✔", false, `🏅 ¡Nueva medalla! ${m.e} ${m.n}`); confetti(); }, 900);
}
function medallasHTML(){
  const g = new Set(medallasGanadas());
  return `<div class="card"><h2>🏅 Medallas ${TEMPORADA()} <small>${g.size} de ${MEDALLAS.length}</small></h2>
    <div class="muted small" style="margin:-6px 0 10px">Cada año, medallas y premios nuevos. ¡Consíguelas todas! 🎩</div>
    <div class="medallas">${MEDALLAS.map(m => `<button class="medalla ${g.has(m.id) ? "si" : ""}" data-medalla="${m.id}">
      <span class="me">${g.has(m.id) ? m.e : "🔒"}</span><span class="mn">${esc(m.n)}</span></button>`).join("")}</div>
    ${premiosHTML(g)}</div>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-medalla]"); if (!b) return;
  const m = MEDALLAS.find(x => x.id === b.dataset.medalla), si = b.classList.contains("si");
  vibrar(); toast(si ? `${m.e} ${m.n}: ¡conseguida!` : `🔒 ${m.n}`, false, si ? m.c + " ✔" : "Cómo conseguirla: " + m.c.charAt(0).toLowerCase() + m.c.slice(1));
});

/* ---------- Tu mes en resumen ---------- */
const COMENTARIO_CAT = {
  comer:"Tus papilas gustativas te lo agradecen. Tu cartera, no tanto. 🍔", super:"Nevera llena, corazón contento. 🛒", gasolina:"El coche ha comido más que tú. ⛽",
  casa:"Tener techo es caro, pero no hay nada como tu sofá. 🏠", ocio:"¡Te lo has pasado bien! Y se nota. 🎉", ropa:"Vas hecho un pincel. 👕",
  viajes:"Viajar nunca es gastar, es invertir en recuerdos. ✈️", deporte:"Pádel, pádel y más pádel. 🏓", belleza:"Divina de la muerte. 💅",
  suscripciones:"¿De verdad ves todas esas plataformas? 📱", transporte:"Moverse cuesta, literalmente. 🚗", regalos:"Qué generosidad, que te lo devuelvan en abrazos. 🎁",
  salud:"Lo primero es lo primero. 💊", trabajo:"Invertir en tu trabajo siempre suma. ✏️", otros:"Un poco de todo, como en botica. ✨"
};
function datosResumen(k){
  const l = ofMonth(S.movs, k), guard = l.filter(m => m.tipo === "gasto" && CATS_GUARDADO.includes(m.cat)).reduce((a,m) => a + m.importe, 0);
  const g = total(l, "gasto") - guard, i = total(l, "ingreso"), rows = porCategoria(l, true);
  const porDia = {}; l.filter(m => m.tipo === "gasto" && !CATS_GUARDADO.includes(m.cat)).forEach(m => porDia[m.fecha] = (porDia[m.fecha] || 0) + m.importe);
  const diaTop = Object.entries(porDia).sort((a,b) => b[1] - a[1])[0];
  const lp = ofMonth(S.movs, shiftMonth(k, -1)), gp = total(lp, "gasto") - lp.filter(m => m.tipo === "gasto" && CATS_GUARDADO.includes(m.cat)).reduce((a,m) => a + m.importe, 0);
  const dias = diasActivos().filter(d => d.startsWith(k));
  return { k, g, i, guard, quedan: i - g, tasa: i > 0 ? Math.round((i - g) / i * 100) : null, top: rows[0], n: l.filter(m => !m.rec).length,
           diasN: dias.length, rachaMes: rachaMaxima(dias), diaTop, cambio: gp > 0 ? Math.round((g - gp) / gp * 100) : null, mesPrev: monthOnly(shiftMonth(k, -1)) };
}
let resumen = null;
const RS_DUR = 6000;   // ms por tarjeta
// Números que cuentan solos (si son euros, se tapan con el modo discreto)
const cnt = (v, t) => `<b class="cnt${t === "eur" ? " m" : ""}" data-v="${v}" data-t="${t}">${t === "eur" ? eur(0) : t === "pct" ? "0 %" : "0"}</b>`;
function contar(slide){
  slide.querySelectorAll(".cnt").forEach(el => {
    const fin = Number(el.dataset.v), t = el.dataset.t, ini = performance.now(), dur = 1300;
    const pinta = x => el.textContent = t === "eur" ? eur(Math.round(x * 100) / 100) : t === "pct" ? Math.round(x) + " %" : String(Math.round(x));
    const paso = now => { const k = Math.min(1, (now - ini) / dur), e = 1 - Math.pow(1 - k, 3); pinta(fin * e); if (k < 1 && resumen) requestAnimationFrame(paso); else pinta(fin); };
    requestAnimationFrame(paso);
  });
}
function abrirResumen(k){
  const d = datosResumen(k), mes = monthOnly(k), P = S.perfil, ganadas = medallasGanadas(), C = PALETAS[P.color] || PALETAS.violeta;
  const sl = [];   // { fondo:[color1,color2], flota:"emojis", html, fiesta }
  sl.push({ fondo:[C[0], C[1]], flota:"✨💸🪙", html:`<div class="rs-big gira">${esc(P.emoji)}</div><div class="rs-pre">Tu resumen de</div><h3 class="rs-mes">${mes}</h3><p>Prepárate, que vienen datos 👀</p>` });
  sl.push({ fondo: d.quedan >= 0 ? ["#0f9b6c","#4fd1a5"] : ["#c0392b","#f5876b"], flota: d.quedan >= 0 ? "💚🪙✨" : "💸🔥😅", fiesta: d.quedan >= 0,
    html:`<div class="rs-big rebota">${d.quedan >= 0 ? "🤑" : "😬"}</div><p>Entraron ${cnt(d.i,"eur")}<br>y se fueron ${cnt(d.g,"eur")}</p>
      <h3>${d.quedan >= 0 ? "Te quedaron" : "Te pasaste"}<br><span class="rs-gigante">${cnt(Math.abs(d.quedan),"eur")}</span></h3>
      ${d.tasa !== null ? `<p class="rs-chip">${d.tasa >= 20 ? `🏆 Ahorraste el ${cnt(d.tasa,"pct")} · ¡nivel pro!` : d.tasa >= 0 ? `Ahorraste el ${cnt(d.tasa,"pct")} de lo que entró` : "Tocó tirar de colchón. ¡El próximo, mejor! 💪"}</p>` : ""}
      ${d.guard > 0 ? `<p class="rs-sm">Y además apartaste ${cnt(d.guard,"eur")} en ahorro 🐷</p>` : ""}` });
  if (d.top){ const c = catOf({ tipo:"gasto", cat:d.top[0] }), p = d.g ? Math.round(d.top[1] / d.g * 100) : 0;
    sl.push({ fondo:["#ff7a59","#ffb347"], flota: c.e.repeat(3),
      html:`<p class="rs-pre">Tu categoría estrella fue…</p><div class="rs-big zoom">${c.e}</div><h3>${esc(c.n)}</h3>
        <div class="rs-anillo" style="--p:${p}"><span>${cnt(p,"pct")}</span></div><p>${cnt(d.top[1],"eur")} de tus gastos</p><p class="rs-sm">${esc(COMENTARIO_CAT[d.top[0]] || COMENTARIO_CAT.otros)}</p>` }); }
  if (d.diaTop) sl.push({ fondo:["#2a78d6","#9a7cf3"], flota:"📅💳🛍️",
    html:`<p class="rs-pre">Tu día más gastón fue el…</p><div class="rs-big rebota">📅</div><h3>${esc(dayLabel(d.diaTop[0]))}</h3><p>Ese día se fueron ${cnt(d.diaTop[1],"eur")}</p><p class="rs-sm">¿Qué pasó ese día? 👀</p>` });
  if (d.cambio !== null) sl.push({ fondo: d.cambio <= 0 ? ["#13a383","#a8e063"] : ["#e04f5f","#f7b267"], flota: d.cambio <= 0 ? "📉👏✨" : "📈😅💸", fiesta: d.cambio <= -10,
    html:`<div class="rs-big ${d.cambio <= 0 ? "baja" : "sube"}">${d.cambio <= 0 ? "📉" : "📈"}</div><h3>Gastaste un<br><span class="rs-gigante">${cnt(Math.abs(d.cambio),"pct")}</span><br>${d.cambio <= 0 ? "menos" : "más"}</h3><p>que en ${esc(d.mesPrev)}</p>
      <p class="rs-sm">${d.cambio <= -10 ? "¡Eso es mejorar! 👏" : d.cambio <= 0 ? "Poco a poco, en la buena dirección." : d.cambio < 15 ? "Un pelín más… nada que no se arregle." : "Este mes se te fue un poco de las manos 😅"}</p>` });
  sl.push({ fondo:["#f12711","#f5af19"], flota:"🔥🔥✨",
    html:`<div class="rs-big latido">🔥</div><h3><span class="rs-gigante">${cnt(d.n,"int")}</span><br>apuntes</h3><p>en ${cnt(d.diasN,"int")} días distintos</p><p class="rs-chip">Tu mejor racha: ${cnt(d.rachaMes,"int")} ${d.rachaMes === 1 ? "día" : "días"}</p><p class="rs-sm">🏅 Llevas ${ganadas.length} de ${MEDALLAS.length} medallas</p>` });
  sl.push({ fondo:[C[0], "#e04fa0"], flota:"🎉🥳✨", fiesta:true, ultima:true,
    html:`<div class="rs-big gira">💪</div><h3>¡A por<br>${monthOnly(shiftMonth(k, 1))}!</h3><p>Cada euro que apuntas es un euro que controlas.</p>
      <div class="rs-btns"><button class="rs-b" id="rsCompartir">📤 Compartir</button><button class="rs-b blanco" id="rsCerrar">Cerrar</button></div>
      <p class="rs-sm">Al compartir solo salen porcentajes, nunca tus cantidades.</p>` });
  resumen = { k, i:0, n: sl.length, d, sl, pausa:false };
  $("rsSlides").innerHTML = sl.map((x, i) => `<div class="rs-slide" data-i="${i}">${x.html}</div>`).join("");
  $("rsBarras").innerHTML = sl.map(() => `<i><b></b></i>`).join("");
  $("resumen").classList.add("show"); irSlide(0);
  const vistos = LS.get(kResumen(), {}); vistos[k] = 1; LS.set(kResumen(), vistos);
}
function pintarFlota(emojis){
  const l = [...emojis]; let h = "";
  for (let i = 0; i < 14; i++) h += `<span style="left:${(i * 7.3 + Math.random() * 6) % 100}%;animation-delay:${(-Math.random() * 9).toFixed(1)}s;animation-duration:${(7 + Math.random() * 6).toFixed(1)}s;font-size:${(18 + Math.random() * 22) | 0}px">${l[i % l.length]}</span>`;
  $("rsFlota").innerHTML = h;
}
function irSlide(i){
  if (!resumen) return;
  if (i >= resumen.n){ cerrarResumen(); return; }
  resumen.i = Math.max(0, i);
  const x = resumen.sl[resumen.i];
  // Fondo: se funde con el siguiente color
  const capa = $("rsFondo"), nueva = document.createElement("div");
  nueva.className = "rs-capa"; nueva.style.background = `linear-gradient(160deg,${x.fondo[0]} 0%,${x.fondo[1]} 100%)`;
  capa.appendChild(nueva); requestAnimationFrame(() => nueva.classList.add("on"));
  setTimeout(() => { while (capa.children.length > 1) capa.firstChild.remove(); }, 700);
  pintarFlota(x.flota || "✨");
  document.querySelectorAll("#rsSlides .rs-slide").forEach((s, j) => s.classList.toggle("on", j === resumen.i));
  const slide = document.querySelector(`#rsSlides .rs-slide[data-i="${resumen.i}"]`);
  contar(slide);
  if (x.fiesta) setTimeout(() => { if (resumen && resumen.i === i) confetti(); }, 500);
  // Barras tipo «historias»: la actual se llena sola y pasa a la siguiente
  document.querySelectorAll("#rsBarras b").forEach((b, j) => {
    b.style.animation = "none"; void b.offsetWidth;
    if (j < resumen.i) b.style.width = "100%";
    else if (j > resumen.i) b.style.width = "0";
    else { b.style.width = "0"; b.style.animation = `rsLlena ${RS_DUR}ms linear forwards`; b.style.animationPlayState = resumen.pausa ? "paused" : "running";
           b.onanimationend = () => { if (resumen && resumen.i === j && !x.ultima) irSlide(j + 1); }; }
  });
}
function pausarResumen(p){
  if (!resumen) return; resumen.pausa = p;
  const b = document.querySelectorAll("#rsBarras b")[resumen.i]; if (b) b.style.animationPlayState = p ? "paused" : "running";
  $("resumen").classList.toggle("pausa", p);
}
let valePendiente = null;
function cerrarResumen(){
  $("resumen").classList.remove("show"); resumen = null; $("rsFlota").innerHTML = "";
  revisarMedallas(); if (S) pintarTodo();
  if (valePendiente && S){ const t = valePendiente; valePendiente = null; setTimeout(() => { confetti(); abrirVale(t, true); }, 400); }
}
// Tocar a la izquierda = atrás, a la derecha = adelante; mantener pulsado = pausa
let rsToque = null;
$("resumen").addEventListener("pointerdown", e => {
  if (!resumen || e.target.closest("button")) return;
  rsToque = { t: Date.now(), x: e.clientX }; pausarResumen(true);
});
$("resumen").addEventListener("pointerup", e => {
  if (!resumen || !rsToque) return;
  const largo = Date.now() - rsToque.t > 280, x = rsToque.x; rsToque = null; pausarResumen(false);
  if (largo) return;
  if (TAPADO && e.target.closest(".m")){ ponerTapado(false, true); return; }
  const r = $("resumen").getBoundingClientRect();
  irSlide(resumen.i + (x < r.left + r.width * .3 ? -1 : 1));
});
$("resumen").addEventListener("pointercancel", () => { rsToque = null; pausarResumen(false); });
$("resumen").addEventListener("click", e => {
  if (!resumen) return;
  if (e.target.closest("#rsCerrar") || e.target.closest("#rsX")){ cerrarResumen(); return; }
  if (e.target.closest("#rsCompartir")){ compartirResumen(); return; }
});
document.addEventListener("keydown", e => { if (!resumen) return; if (e.key === "Escape") cerrarResumen(); if (e.key === "ArrowRight") irSlide(resumen.i + 1); if (e.key === "ArrowLeft") irSlide(resumen.i - 1); });
document.addEventListener("click", e => { if (e.target.closest("#verResumen")){ vibrar(); abrirResumen(e.target.closest("#verResumen").dataset.k); } });

// Imagen para compartir: solo porcentajes y logros, nunca cantidades
async function compartirResumen(){
  const d = resumen.d, P = PALETAS[S.perfil.color] || PALETAS.violeta, cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
  const x = cv.getContext("2d"), gr = x.createLinearGradient(0, 0, 1080, 1350); gr.addColorStop(0, P[0]); gr.addColorStop(1, P[1]);
  x.fillStyle = gr; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = "rgba(255,255,255,.12)"; x.beginPath(); x.arc(980, 120, 260, 0, 7); x.fill(); x.beginPath(); x.arc(80, 1300, 200, 0, 7); x.fill();
  x.fillStyle = "#fff"; x.textAlign = "center";
  const t = (s, y, px, w) => { x.font = `${w || 800} ${px}px Nunito, system-ui, sans-serif`; x.fillText(s, 540, y); };
  t(S.perfil.emoji, 230, 150);
  t(`Mi ${monthOnly(d.k)}`, 380, 84, 900); t("en Ahorraulin", 470, 56);
  const lineas = [];
  if (d.tasa !== null) lineas.push(d.tasa >= 0 ? `💰 Ahorré el ${d.tasa} %` : "💸 Mes de tirar de colchón");
  if (d.top){ const c = catOf({ tipo:"gasto", cat:d.top[0] }); lineas.push(`${c.e} Estrella: ${c.n}`); }
  if (d.cambio !== null) lineas.push(d.cambio <= 0 ? `📉 Gasté un ${-d.cambio} % menos` : `📈 Gasté un ${d.cambio} % más`);
  lineas.push(`🔥 Racha: ${d.rachaMes} ${d.rachaMes === 1 ? "día" : "días"}`);
  lineas.push(`🏅 ${medallasGanadas().length} de ${MEDALLAS.length} medallas`);
  lineas.forEach((l, i) => { x.fillStyle = "rgba(255,255,255,.16)"; x.beginPath(); x.roundRect(120, 560 + i * 130, 840, 104, 52); x.fill(); x.fillStyle = "#fff"; t(l, 628 + i * 130, 50); });
  t("ahorraulin 🐷", 1290, 40, 700);
  const blob = await new Promise(r => cv.toBlob(r, "image/png")), nombre = `Mi ${monthOnly(d.k)} en Ahorraulin.png`;
  try {
    const f = new File([blob], nombre, { type:"image/png" });
    if (navigator.canShare && navigator.canShare({ files:[f] })){ await navigator.share({ files:[f], title:`Mi ${monthOnly(d.k)} en Ahorraulin` }); return; }
  } catch(e){ if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("📥 Imagen guardada");
}
// Al entrar en un mes nuevo, enseña el resumen del anterior una sola vez
function resumenPendiente(){
  const k = shiftMonth(monthKey(new Date()), -1);
  return ofMonth(S.movs, k).filter(m => !m.rec).length >= 3 && !LS.get(kResumen(), {})[k] ? k : null;
}
function resumenBotonHTML(){
  const k = shiftMonth(monthKey(new Date()), -1);
  if (!ofMonth(S.movs, k).length) return "";
  return `<button class="btn-ideas rs-cta" id="verResumen" data-k="${k}"><span>🎬</span>Ver tu ${monthOnly(k)} en resumen ›</button>`;
}

/* ---------- Pestaña Recompensas ---------- */
function pintarRecompensas(){
  const { n, hoyHecho } = racha(), max = rachaMaxima(diasDelAno());
  let h = `<div class="card rachagrande"><div class="fuego ${n >= 7 ? "vivo" : ""}">${n > 0 ? "🔥" : "🌱"}</div>
    <div class="rt"><b>${n} ${n === 1 ? "día" : "días"}</b><small>${hoyHecho ? "Racha actual · hoy ya has apuntado ✅" : n ? "Racha actual · apunta hoy para no perderla" : "Apunta hoy y empieza tu racha"}</small>
    <small>Tu mejor racha de ${TEMPORADA()}: <b>${max} ${max === 1 ? "día" : "días"}</b></small></div></div>`;
  h += resumenBotonHTML();
  h += medallasHTML();
  $("premiosBody").innerHTML = h;
}
