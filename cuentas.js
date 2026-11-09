/* =====================================================================
   AHORRAULIN · cuentas de clientes
   - Alta con código de acceso de un solo uso (lo vende el administrador)
   - El móvil queda recordado con una llave secreta: se entra sin código
   - Panel «Usuarios» del administrador
   ===================================================================== */
"use strict";
const APP_URL = "https://magicraulin.github.io/ahorraulin/";
const CUENTA_K = "ahorraulin_cuenta", FAMILIA_K = "ahorraulin_familia";
let saltarAuto = false, verFamiliaYa = false, avisoMenu = null;

/* ---------- La cuenta guardada en este móvil ---------- */
function cuentaGuardada(){ const c = lsGet(CUENTA_K); return c && c.id && c.llave ? c : null; }
function guardarCuenta(c){ lsSet(CUENTA_K, { ...(cuentaGuardada() || {}), ...c }); }
function borrarCuenta(){ try { localStorage.removeItem(CUENTA_K); } catch(e){} }

// Móviles de la familia (Raúl, Sara, Marta): los que ya usaban la app antes de las cuentas de clientes
(function migrar(){
  try {
    if (localStorage.getItem("ahorraulin_migr5")) return;
    const antes = Object.keys(localStorage).some(k => (k.startsWith("ahorraulin_") && k !== CUENTA_K) || k.startsWith("nc_frases_") || k === "nc_datos_v1");
    if (antes && !cuentaGuardada()) localStorage.setItem(FAMILIA_K, "1");
    localStorage.setItem("ahorraulin_migr5", "1");
  } catch(e){}
})();
function esFamilia(){ try { return localStorage.getItem(FAMILIA_K) === "1"; } catch(e){ return false; } }
function marcarFamilia(){ try { localStorage.setItem(FAMILIA_K, "1"); } catch(e){} }
function verFamilia(){ return !REMOTO || esFamilia() || verFamiliaYa; }

/* ---------- Entrar solo, sin código ---------- */
async function entrarCuentaGuardada(){
  const c = cuentaGuardada(); if (!c || !REMOTO) return false;
  if (saltarAuto){ saltarAuto = false; return false; }
  if (c.pinAbrir){
    aplicarTema(c.color || "violeta", false);
    pinState = { id:c.id, nombre:c.nombre || "", emoji:c.emoji || "🙂", mode:"enter", buf:"", llave:c.llave };
    pintarPin(); show("pin"); return true;
  }
  $("pcards").innerHTML = `<div class="skeleton"></div>`;
  try {
    const r = await Store.entrar(c.id, c.llave);
    if (r.ok){ recordarDatos(r.perfil); abrirSesion(c.id, c.llave, r); avisoCaducidad(); return true; }
    tratarErrorCuenta(r.error);
  } catch(e){
    avisoMenu = `📶 No hay conexión. Revisa internet y vuelve a intentarlo.<button class="btn p" onclick="avisoMenu=null;cargarMenu()">Reintentar</button>`;
  }
  return false;
}
function recordarDatos(P){ if (P && cuentaGuardada()) guardarCuenta({ nombre:P.nombre, emoji:P.emoji, color:P.color }); }
function tratarErrorCuenta(err){
  const c = cuentaGuardada() || {};
  const renovar = `<a class="btn p" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP_PREMIOS}?text=${encodeURIComponent(`¡Hola! Quiero renovar mi año de Ahorraulin. Soy ${c.nombre || ""}${c.codigo ? " (código " + c.codigo + ")" : ""} 😊`)}">💬 Renovar por WhatsApp</a>`;
  if (err === "CADUCADA") avisoMenu = `⏳ Tu año de Ahorraulin ha terminado.<br><span style="font-weight:700">Tus datos siguen guardados: en cuanto renueves, todo estará como lo dejaste.</span>${renovar}`;
  else if (err === "DESACTIVADA") avisoMenu = `⛔ Tu cuenta está desactivada.<br><span style="font-weight:700">Habla con el administrador para volver a activarla.</span>`;
  else {
    borrarCuenta();
    avisoMenu = err === "NO_EXISTE" ? "Esta cuenta ya no existe." : "🔒 Se ha cerrado la sesión en este móvil.<br><span style=\"font-weight:700\">Entra otra vez con tu código de acceso y tu código de 4 cifras.</span>";
  }
}

/* ---------- Menú de inicio ---------- */
function pintarMenuClientes(){
  const fam = verFamilia(), c = cuentaGuardada();
  $("clAviso").innerHTML = avisoMenu || ""; $("clAviso").classList.toggle("hidden", !avisoMenu);
  $("clienteBox").classList.toggle("hidden", !REMOTO || (fam && !c));
  $("tengoCodigo").textContent = c ? `${c.emoji || "🙂"} Entrar como ${c.nombre || "yo"}` : "🔑 Tengo un código de acceso";
  $("tengoCodigo").dataset.modo = c ? "entrar" : "codigo";
  $("menu").querySelector(".sub").textContent = fam ? "Tus cuentas claras · ¿Quién eres?" : "Tus cuentas claras, sin complicaciones";
  const link = $("clLink");
  link.classList.toggle("hidden", !REMOTO);
  link.textContent = fam ? (c ? "" : "¿Tienes un código de acceso? Toca aquí") : "¿Eres de la familia? Entra aquí";
  link.dataset.modo = fam ? "codigo" : "familia";
  if (fam && c) link.classList.add("hidden");
}
$("tengoCodigo").onclick = () => {
  vibrar();
  if ($("tengoCodigo").dataset.modo === "entrar"){ avisoMenu = null; cargarMenu(); return; }
  abrirCuenta("codigo");
};
$("yaCuenta").onclick = () => { vibrar(); abrirCuenta("entrar"); };
$("clLink").onclick = () => {
  vibrar();
  if ($("clLink").dataset.modo === "familia"){ verFamiliaYa = true; pintarMenu(); pintarMenuClientes(); return; }
  abrirCuenta("codigo");
};

/* ---------- Hoja de alta / entrada ---------- */
const CU_EMOJIS = ["🙂","😎","🦊","🐱","🐶","🦄","🌸","🌻","⭐","🌈","🚀","⚽","🎸","📚","☕","🍕"];
let cu = null;   // { paso, codigo, nombre, emoji }
function abrirCuenta(paso, codigo){
  cu = { paso, codigo: codigo || "", nombre:"", emoji:"🙂" };
  pintarCuenta(); $("cuentaModal").classList.add("show");
  setTimeout(() => { const i = $("cuentaBody").querySelector("input"); if (i && !codigo) i.focus(); }, 250);
}
function cerrarCuenta(){ $("cuentaModal").classList.remove("show"); cu = null; }
$("cuentaX").onclick = cerrarCuenta;
$("cuentaModal").addEventListener("click", e => { if (e.target.id === "cuentaModal") cerrarCuenta(); });
const campoPin = (id, ph) => `<input class="inp pin" id="${id}" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="${ph || "••••"}">`;
const campoCodigo = v => `<input class="inp code" id="cuCodigo" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="AHR-XXXX-XXXX" value="${esc(v || "")}">`;
function pintarCuenta(){
  if (!cu) return;
  const b = $("cuentaBody");
  if (cu.paso === "codigo") b.innerHTML = `<div class="cu-paso">
      <h3>🔑 Tu código de acceso</h3><p>Escribe el código que te ha mandado el administrador por WhatsApp.</p>
      ${campoCodigo(cu.codigo)}
      <button class="btn p" id="cuSeguir">Continuar</button><div class="err" id="cuErr"></div></div>`;
  if (cu.paso === "alta") b.innerHTML = `<div class="cu-paso">
      <h3>🎉 ¡Bienvenid@ a Ahorraulin!</h3><p>Crea tu cuenta en 20 segundos.</p>
      <label>¿Cómo te llamas?</label><input class="inp" id="cuNombre" maxlength="20" value="${esc(cu.nombre)}" placeholder="Tu nombre">
      <label>Elige tu emoticono</label><div class="cu-emojis" id="cuEmojis">${CU_EMOJIS.map(e => `<button data-cue="${e}" class="${e === cu.emoji ? "on" : ""}">${e}</button>`).join("")}</div>
      <label>Inventa un código de 4 cifras</label>${campoPin("cuPin1")}
      <label>Repítelo</label>${campoPin("cuPin2")}
      <div class="cu-nota">📱 Este móvil quedará recordado: la próxima vez entrarás directamente, sin escribir nada.<br>🔐 Guarda tu código de acceso y tus 4 cifras: los necesitarás si cambias de móvil.</div>
      <button class="btn p" id="cuSeguir">Crear mi cuenta</button><div class="err" id="cuErr"></div></div>`;
  if (cu.paso === "recuperar") b.innerHTML = `<div class="cu-paso">
      <h3>👋 Hola de nuevo, ${esc(cu.nombre)}</h3><p>Elige un código nuevo de 4 cifras. Tus apuntes siguen todos ahí.</p>
      <label>Código nuevo de 4 cifras</label>${campoPin("cuPin1")}
      <label>Repítelo</label>${campoPin("cuPin2")}
      <button class="btn p" id="cuSeguir">Entrar</button><div class="err" id="cuErr"></div></div>`;
  if (cu.paso === "entrar") b.innerHTML = `<div class="cu-paso">
      <h3>📱 Entrar en este móvil</h3><p>Usa el código de acceso que te mandaron por WhatsApp y tus 4 cifras.</p>
      <label>Código de acceso</label>${campoCodigo(cu.codigo)}
      <label>Tu código de 4 cifras</label>${campoPin("cuPin1")}
      <button class="btn p" id="cuSeguir">Entrar</button><div class="err" id="cuErr"></div>
      <div class="cu-nota">¿No te acuerdas de tus 4 cifras? Pide al administrador un acceso nuevo.</div></div>`;
}
$("cuentaBody").addEventListener("click", e => {
  const em = e.target.closest("[data-cue]");
  if (em){ vibrar(); cu.nombre = $("cuNombre").value; cu.emoji = em.dataset.cue; $("cuEmojis").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === em)); return; }
  if (e.target.closest("#cuSeguir")) seguirCuenta();
});
$("cuentaBody").addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); seguirCuenta(); } });
$("cuentaBody").addEventListener("input", e => { if (e.target.classList.contains("pin")) e.target.value = e.target.value.replace(/\D/g, "").slice(0,4); });
let cuOcupado = false;
async function seguirCuenta(){
  if (!cu || cuOcupado) return;
  const err = t => { $("cuErr").textContent = t || ""; if (t) sacudir($("cuErr")); };
  const val = id => ($(id) ? $(id).value.trim() : "");
  const btn = $("cuSeguir"), txt = btn.textContent;
  const pin1 = val("cuPin1"), pin2 = val("cuPin2");
  if (cu.paso === "codigo" || cu.paso === "entrar"){ cu.codigo = val("cuCodigo").toUpperCase(); if (cu.codigo.replace(/[^A-Z0-9]/g, "").length < 11) return err("Escribe el código completo: AHR-XXXX-XXXX"); }
  if (cu.paso === "alta"){ cu.nombre = val("cuNombre"); if (!cu.nombre) return err("Escribe tu nombre"); }
  if (cu.paso !== "codigo"){
    if (!/^\d{4}$/.test(pin1)) return err("El código tiene que ser de 4 números");
    if (cu.paso !== "entrar" && pin1 !== pin2) return err("Los dos códigos no coinciden");
  }
  cuOcupado = true; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>'; err("");
  try {
    if (cu.paso === "codigo"){
      const r = await Store.verCodigo(cu.codigo);
      if (!r.ok) throw new Error(r.error);
      cu.paso = r.tipo === "recuperar" ? "recuperar" : "alta"; cu.nombre = r.nombre || "";
      pintarCuenta(); setTimeout(() => { const i = $(cu.paso === "alta" ? "cuNombre" : "cuPin1"); if (i) i.focus(); }, 100);
      return;
    }
    const r = cu.paso === "entrar" ? await Store.entrarCuenta(cu.codigo, pin1) : await Store.activarCodigo(cu.codigo, cu.nombre, cu.emoji, pin1);
    if (!r.ok) throw new Error(r.error);
    guardarCuenta({ id:r.id, llave:r.llave, codigo:cu.codigo, pinAbrir:false });
    const r2 = await Store.entrar(r.id, r.llave); if (!r2.ok) throw new Error(r2.error);
    const nuevo = cu.paso === "alta";
    cerrarCuenta(); avisoMenu = null; recordarDatos(r2.perfil);
    try { history.replaceState(null, "", location.pathname); } catch(e){}
    abrirSesion(r.id, r.llave, r2);
    if (nuevo){ confetti(); toast(`🎉 ¡Bienvenid@, ${r2.perfil.nombre}!`, false, "Este móvil queda recordado: ya no tendrás que escribir nada para entrar."); }
    else toast(`👋 ¡Hola de nuevo, ${r2.perfil.nombre}!`, false, "Este móvil queda recordado.");
  } catch(e){
    const m = e.message || "RED";
    if (m === "CADUCADA" || m === "DESACTIVADA"){ tratarErrorCuenta(m); cerrarCuenta(); cargarMenu(); return; }
    err(errTxt(m));
  } finally {
    cuOcupado = false; if (btn.isConnected){ btn.disabled = false; btn.textContent = txt; }
  }
}

/* ---------- Ajustes del cliente: su cuenta en este móvil ---------- */
const fechaLarga = ms => new Date(ms).toLocaleDateString("es-ES", { day:"numeric", month:"long", year:"numeric" });
const diasHasta = ms => Math.ceil((ms - Date.now()) / 86400000);
function pintarCuentaCard(){
  const card = $("cuentaCard"), P = S.perfil;
  card.classList.toggle("hidden", !P.cliente);
  $("logout").innerHTML = P.cliente ? `<span class="e">🚪</span><span>Cerrar sesión en este móvil<small>Para volver a entrar necesitarás tu código de acceso y tus 4 cifras</small></span>`
                                    : `<span class="e">🚪</span><span>Salir<small>Tu cuenta se queda bloqueada</small></span>`;
  if (!P.cliente) return;
  const c = cuentaGuardada() || {}, dias = P.caduca ? diasHasta(P.caduca) : 999;
  const msg = encodeURIComponent(`¡Hola! Quiero renovar mi año de Ahorraulin. Soy ${P.nombre}${c.codigo ? " (código " + c.codigo + ")" : ""} 😊`);
  card.innerHTML = `<h2>📱 Tu cuenta</h2>
    <div class="muted small">${P.caduca ? `Tu acceso está activo hasta el <b>${fechaLarga(P.caduca)}</b>${dias <= 45 ? ` (quedan ${dias} días)` : ""}.` : "Tu acceso es ilimitado ♾️"}</div>
    ${c.codigo ? `<div class="muted small" style="margin-top:4px">Tu código de acceso: <b>${esc(c.codigo)}</b></div>` : ""}
    <div class="set-row" style="margin-top:8px"><label>Pedir mi código al abrir la app<small>Más privado: tendrás que escribir tus 4 cifras cada vez</small></label><button class="switch ${c.pinAbrir ? "on" : ""}" id="pinAbrirSw" role="switch" aria-checked="${!!c.pinAbrir}" aria-label="Pedir código al abrir"></button></div>
    ${dias <= 45 ? `<a class="opt" style="text-decoration:none;color:inherit" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP_PREMIOS}?text=${msg}"><span class="e">💬</span><span>Renovar otro año<small>Escribe al administrador por WhatsApp</small></span></a>` : ""}`;
}
document.addEventListener("click", e => {
  if (!e.target.closest("#pinAbrirSw")) return;
  vibrar(); const c = cuentaGuardada(); if (!c) return;
  guardarCuenta({ pinAbrir: !c.pinAbrir }); pintarCuentaCard(); pintarCabecera();
  toast(!c.pinAbrir ? "🔐 Te pediré tu código al abrir la app" : "📱 Entrarás directamente, sin código");
});
function avisoCaducidad(){
  if (!S || !S.perfil.cliente || !S.perfil.caduca) return;
  const d = diasHasta(S.perfil.caduca), k = "ahorraulin_avisocad_" + ymd(new Date());
  if (d > 30 || lsGet(k)) return;
  lsSet(k, 1);
  setTimeout(() => toast(`⏳ Tu acceso caduca en ${d} ${d === 1 ? "día" : "días"}`, false, "Puedes renovarlo desde ⚙️ Ajustes → Tu cuenta."), 1500);
}
async function olvidarMovil(){
  const c = cuentaGuardada();
  if (c) Store.salirMovil(c.id, c.llave).catch(() => {});
  borrarCuenta(); avisoMenu = "👋 Has cerrado la sesión en este móvil."; cerrarSesion();
}

/* =====================================================================
   PANEL «USUARIOS» DEL ADMINISTRADOR
   ===================================================================== */
let usDatos = null, usAbierto = null, usResultado = null;
const msgAlta = (nombre, c) => `¡Hola ${nombre}! 🎉 Aquí tienes tu acceso a *Ahorraulin*, la app para controlar tus gastos y ahorrar.\n\n` +
  `1️⃣ Abre este enlace: ${APP_URL}?codigo=${c}\n2️⃣ Crea tu cuenta (tu código ya viene puesto: *${c}*)\n3️⃣ Añádela a la pantalla de inicio del móvil para tenerla como una app\n\n` +
  `📌 Guarda este mensaje: si cambias de móvil, entrarás con este código y tus 4 cifras.\nTu acceso dura 1 año. ¡A ahorrar! 💸`;
const msgRecuperar = (nombre, c) => `¡Hola ${nombre}! 🔑 Aquí tienes tu acceso nuevo a *Ahorraulin*:\n\n${APP_URL}?codigo=${c}\n\nÁbrelo y elige un código nuevo de 4 cifras. Tus apuntes siguen todos ahí 😊\nTu código de acceso nuevo es *${c}*: guárdalo por si cambias de móvil.`;
const msgRenovar = (nombre, ms) => `¡Hola ${nombre}! ✅ Tu acceso a *Ahorraulin* ya está renovado ${ms ? "hasta el " + fechaLarga(ms) : "para siempre ♾️"}. ¡Gracias por seguir ahorrando! 💸`;
const waLink = t => `https://wa.me/?text=${encodeURIComponent(t)}`;

async function pintarUsuarios(){
  const box = $("usuariosBody"); if (!box || !S || S.id !== ADMIN) return;
  if (!usDatos) box.innerHTML = cabeceraUsuarios() + `<div class="card"><div class="skeleton"></div><div class="skeleton"></div></div>`;
  try {
    const r = await Store.adminUsuarios(S.pin); if (!r.ok) throw new Error(r.error);
    usDatos = r;
  } catch(e){
    if (!usDatos){ box.innerHTML = cabeceraUsuarios() + `<div class="card"><div class="empty" style="padding:10px">${errTxt(e.message || "RED")}</div></div>`; return; }
  }
  if (!S || view !== "usuarios") return;
  const foco = document.activeElement && document.activeElement.id === "usNombre" ? $("usNombre").value : null;
  box.innerHTML = cabeceraUsuarios() + listaCodigos() + listaUsuarios();
  if (foco !== null){ $("usNombre").value = foco; $("usNombre").focus(); }
}
function cabeceraUsuarios(){
  const u = usDatos ? usDatos.usuarios : [], act = u.filter(x => x.activo && (!x.caduca || x.caduca > Date.now())).length;
  return `<div class="card">
    <h2>👥 Usuarios de Ahorraulin</h2>
    <div class="muted small">${usDatos ? `${u.length} ${u.length === 1 ? "cuenta" : "cuentas"} · ${act} ${act === 1 ? "activa" : "activas"}. ` : ""}No ves sus gastos: solo su nombre, su fecha de alta y su estado.</div>
    <div class="sub-h">➕ Nuevo usuario</div>
    <div style="display:flex;gap:8px"><input class="inp" id="usNombre" maxlength="20" placeholder="¿Para quién?" autocomplete="off"><button class="btn p" id="usCrear" style="width:auto;margin:0;padding:0 16px;flex:none">Crear código</button></div>
    ${usResultado ? `<div class="us-card" style="margin-top:12px">
      <div style="font-weight:900;text-align:center">${usResultado.titulo}</div>
      ${usResultado.codigo ? `<div class="us-codigo">${esc(usResultado.codigo)}</div>` : ""}
      <div class="us-acc"><a href="${waLink(usResultado.msg)}" target="_blank" rel="noopener">💬 Enviar por WhatsApp</a><button data-us="copiar">📋 Copiar mensaje</button></div>
      <button class="cl-link" data-us="cerrarRes" style="margin-top:6px;color:var(--ink3)">Listo, cerrar</button></div>` : ""}
  </div>`;
}
function listaCodigos(){
  const l = usDatos ? usDatos.codigos : [];
  if (!l.length) return "";
  return `<div class="card"><h2>⏳ Códigos enviados sin usar</h2>
    <div class="muted small" style="margin-bottom:4px">Aún no han creado su cuenta con ellos.</div>
    ${l.map(c => `<div class="us-fila"><div class="cm"><b>${esc(c.codigo)}</b><small>${c.tipo === "recuperar" ? "🔑 Acceso nuevo para " : "Para "}${esc(c.nombre)} · ${new Date(c.creado).toLocaleDateString("es-ES",{day:"numeric",month:"short"})}</small></div>
      <a href="${waLink(c.tipo === "recuperar" ? msgRecuperar(c.nombre, c.codigo) : msgAlta(c.nombre, c.codigo))}" target="_blank" rel="noopener">💬</a>
      <button data-us="anular" data-c="${esc(c.codigo)}">Anular</button></div>`).join("")}</div>`;
}
function estadoUsuario(u){
  if (!u.activo) return ["mal","⛔ Desactivada"];
  if (!u.caduca) return ["","♾️ Ilimitada"];
  if (u.caduca < Date.now()) return ["mal","⏳ Caducada"];
  if (diasHasta(u.caduca) <= 30) return ["pronto",`⚠️ Caduca en ${diasHasta(u.caduca)} d`];
  return ["","✅ Activa"];
}
function haceCuanto(ms){
  if (!ms) return "sin usar aún";
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 2) return "usada ahora"; if (m < 60) return `usada hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `usada hace ${h} h`;
  const d = Math.round(h / 24); return `usada hace ${d} ${d === 1 ? "día" : "días"}`;
}
// Qué hace cada acción (se enseña antes de pedir el código)
const US_ACC = {
  renovar:      { t:"📅 Renovar el acceso", d:"Elige cuánto tiempo. Se suma a lo que le quede; si ya había caducado, cuenta desde hoy. Si estaba desactivada, se vuelve a activar.", b:"Renovar" },
  nuevo_acceso: { t:"🔑 Darle un acceso nuevo", d:"Para cuando olvida su código de 4 cifras. Se cierra la sesión en todos sus móviles y te sale un código nuevo para mandarle por WhatsApp. Al abrirlo elegirá 4 cifras nuevas. Sus apuntes no se tocan.", b:"Crear acceso nuevo" },
  echar:        { t:"📵 Echarle de todos sus móviles", d:"Para un móvil robado o perdido. Se cierra la sesión en todos los móviles donde tenga la app. Su cuenta y sus apuntes siguen intactos: volverá a entrar con su código de acceso y sus 4 cifras.", b:"Echar de sus móviles" },
  desactivar:   { t:"⛔ Desactivar la cuenta", d:"Deja de poder entrar (por ejemplo, si no paga). No se borra nada: cuando la actives, todo estará como lo dejó.", b:"Desactivar" },
  activar:      { t:"✅ Activar la cuenta", d:"Vuelve a poder entrar con todos sus datos.", b:"Activar" },
  eliminar:     { t:"🗑️ Eliminar la cuenta", d:"Se borra la cuenta con todos sus apuntes, metas y premios. Durante 30 días quedan en las copias de seguridad de cada noche (se pueden recuperar a mano); después, desaparecen para siempre.", b:"Eliminar para siempre", peligro:true }
};
const PLAZOS = [["renovar_1m","1 mes"],["renovar_6m","6 meses"],["renovar_1a","1 año"],["ilimitado","♾️ Ilimitado"]];
let usPend = null;   // { id, acc, plazo }
function listaUsuarios(){
  const l = usDatos ? usDatos.usuarios : [];
  if (!usDatos) return "";
  if (!l.length) return `<div class="card"><div class="empty" style="padding:10px"><span class="e">👥</span>Aún no hay usuarios. Crea un código arriba y mándalo por WhatsApp.</div></div>`;
  return `<div class="card"><h2>📋 Cuentas</h2><div class="muted small">Toca una cuenta para ver qué puedes hacer. Todo te pedirá tu código.</div>
    ${l.map(u => { const [cls, txt] = estadoUsuario(u), abierto = usAbierto === u.id, pend = usPend && usPend.id === u.id ? usPend : null, A = pend ? US_ACC[pend.acc] : null;
      return `<div class="us-card"><button class="us-top" data-us="abrir" data-id="${esc(u.id)}">
        <span class="em">${esc(u.emoji)}</span><span style="flex:1;min-width:0"><b>${esc(u.nombre)}</b>
        <small>${u.caduca ? "Hasta el " + fechaLarga(u.caduca) : "Sin fecha de fin"} · ${u.moviles} ${u.moviles === 1 ? "móvil" : "móviles"} · ${haceCuanto(u.ultimo)}</small></span>
        <span class="us-est ${cls}">${txt}</span></button>
        ${abierto && !pend ? `<div class="us-acc">
          <button data-us="pedir" data-acc="renovar" data-id="${esc(u.id)}">📅 Renovar</button>
          <button data-us="pedir" data-acc="nuevo_acceso" data-id="${esc(u.id)}">🔑 Acceso nuevo<br><small style="font-weight:700;color:var(--ink3)">si olvida su código</small></button>
          <button data-us="pedir" data-acc="echar" data-id="${esc(u.id)}">📵 Echar de sus móviles<br><small style="font-weight:700;color:var(--ink3)">móvil robado o perdido</small></button>
          <button data-us="pedir" data-acc="${u.activo ? "desactivar" : "activar"}" data-id="${esc(u.id)}">${u.activo ? "⛔ Desactivar" : "✅ Activar"}</button>
          <button class="peligro" data-us="pedir" data-acc="eliminar" data-id="${esc(u.id)}" style="grid-column:1/-1">🗑️ Eliminar cuenta</button>
        </div>${u.codigo ? `<div class="muted small" style="margin-top:8px;text-align:center">Código de acceso: <b>${esc(u.codigo)}</b></div>` : ""}` : ""}
        ${pend ? `<div class="us-borrar ${A.peligro ? "" : "suave"}"><b>${A.t} · ${esc(u.nombre)}</b>
          <div class="muted small">${A.d}</div>
          ${pend.acc === "renovar" ? `<div class="us-plazos">${PLAZOS.map(([k, n]) => `<button data-us="plazo" data-p="${k}" class="${pend.plazo === k ? "on" : ""}">${n}</button>`).join("")}</div>` : ""}
          ${campoPin("usPinAcc", "Tu código")}
          <div class="us-acc"><button data-us="cancelar">Cancelar</button><button class="${A.peligro ? "sure" : "ok"}" data-us="hacer" data-id="${esc(u.id)}">${A.b}</button></div></div>` : ""}</div>`; }).join("")}</div>`;
}
const US_HECHO = { renovar_1m:"📅 Renovada 1 mes más", renovar_6m:"📅 Renovada 6 meses más", renovar_1a:"📅 Renovada 1 año más", ilimitado:"♾️ Ahora tiene acceso ilimitado",
  activar:"✅ Cuenta activada", desactivar:"⛔ Cuenta desactivada. Ya no puede entrar", echar:"📵 Fuera de todos sus móviles. Volverá a entrar con su código y sus 4 cifras",
  nuevo_acceso:"🔑 Acceso nuevo creado: mándaselo por WhatsApp", eliminar:"🗑️ Cuenta eliminada" };
document.addEventListener("click", async e => {
  if (e.target.closest("#usCrear")){
    const n = $("usNombre").value.trim(); if (!n){ toast("Escribe el nombre de quien lo compra"); $("usNombre").focus(); return; }
    const b = $("usCrear"); b.disabled = true; b.innerHTML = '<span class="spin"></span>';
    try { const r = await Store.adminCrearCodigo(S.pin, n); if (!r.ok) throw new Error(r.error);
          vibrar(); usResultado = { titulo:`🎟️ Código para ${esc(n)}`, codigo:r.codigo, msg:msgAlta(n, r.codigo) }; $("usNombre").value = ""; }
    catch(err){ toast("⚠️ No se ha podido crear el código"); }
    pintarUsuarios(); return;
  }
  const b = e.target.closest("[data-us]"); if (!b || !S || S.id !== ADMIN) return;
  const acc = b.dataset.us, id = b.dataset.id;
  if (acc === "abrir"){ vibrar(); usAbierto = usAbierto === id ? null : id; usPend = null; pintarUsuarios(); return; }
  if (acc === "pedir"){ vibrar(); usPend = { id, acc:b.dataset.acc, plazo:"renovar_1a" }; pintarUsuarios(); setTimeout(() => $("usPinAcc") && $("usPinAcc").focus(), 100); return; }
  if (acc === "plazo"){ vibrar(); usPend.plazo = b.dataset.p; b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); return; }
  if (acc === "cancelar"){ usPend = null; pintarUsuarios(); return; }
  if (acc === "cerrarRes"){ usResultado = null; pintarUsuarios(); return; }
  if (acc === "copiar"){
    try { await navigator.clipboard.writeText(usResultado.msg); toast("📋 Mensaje copiado. Pégalo en WhatsApp"); } catch(err){ toast("⚠️ No se ha podido copiar"); }
    return;
  }
  if (acc === "anular"){
    if (!b.classList.contains("sure")){ b.classList.add("sure"); b.textContent = "¿Anular?"; b.style.background = "var(--warn)"; b.style.color = "#fff"; setTimeout(() => { if (b.isConnected) pintarUsuarios(); }, 3000); return; }
    try { const r = await Store.adminAnularCodigo(S.pin, b.dataset.c); if (!r.ok) throw new Error(r.error); toast("Código anulado: ya no sirve"); } catch(err){ toast("⚠️ No se ha podido anular"); }
    pintarUsuarios(); return;
  }
  if (acc !== "hacer" || !usPend) return;
  const pin = ($("usPinAcc") || {}).value || "";
  if (!/^\d{4}$/.test(pin)){ toast("Escribe tu código de 4 cifras"); sacudir($("usPinAcc")); return; }
  const accion = usPend.acc === "renovar" ? usPend.plazo : usPend.acc;
  b.disabled = true; b.innerHTML = '<span class="spin"></span>';
  try {
    const r = await Store.adminCliente(pin, id, accion); if (!r.ok) throw new Error(r.error);
    const u = (usDatos.usuarios || []).find(x => x.id === id) || {};
    if (accion === "nuevo_acceso") usResultado = { titulo:`🔑 Acceso nuevo para ${esc(r.nombre)}`, codigo:r.codigo, msg:msgRecuperar(r.nombre, r.codigo) };
    else if (accion.startsWith("renovar") || accion === "ilimitado") usResultado = { titulo:`📅 ${esc(u.nombre)}: ${r.caduca ? "acceso hasta el " + fechaLarga(r.caduca) : "acceso ilimitado ♾️"}`, msg:msgRenovar(u.nombre, r.caduca) };
    if (accion === "eliminar") usAbierto = null;
    usPend = null;
    toast(US_HECHO[accion] || "✓ Hecho"); vibrar(20);
    if (usResultado) window.scrollTo({ top:0, behavior:"smooth" });
  } catch(err){
    const m = err.message || "RED";
    b.disabled = false; b.textContent = US_ACC[usPend.acc].b;
    if (m === "PIN_MAL" || m === "BLOQUEADO"){ $("usPinAcc").value = ""; sacudir($("usPinAcc")); toast(m === "PIN_MAL" ? "❌ Código incorrecto. No se ha hecho nada" : errTxt(m)); return; }
    toast("⚠️ No se ha podido: " + errTxt(m)); return;
  }
  pintarUsuarios();
});

/* ---------- Arranque ---------- */
(function(){
  const cod = new URLSearchParams(location.search).get("codigo");
  cargarMenu().then(() => {
    if (cod && REMOTO && !S){ abrirCuenta("codigo", cod.toUpperCase()); seguirCuenta(); }
  });
})();
