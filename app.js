/* =====================================================================
   AHORRAULIN · lógica de la app
   ===================================================================== */
"use strict";
const CFG = window.CONFIG || {};
const VERSION = "1.4";
const ADMIN = "p1";   // Raúl es el administrador
const REMOTO = !!(CFG.supabaseUrl && CFG.supabaseKey);
const IA = !!CFG.workerUrl;

/* ---------------- utilidades ---------------- */
const $ = id => document.getElementById(id);
function pad(n){ return String(n).padStart(2,"0"); }
function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function monthKey(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1); }
function shiftMonth(k,n){ const [y,m] = k.split("-").map(Number); return monthKey(new Date(y,m-1+n,1)); }
function monthName(k){ const [y,m] = k.split("-").map(Number); const s = new Date(y,m-1,1).toLocaleDateString("es-ES",{month:"long"}); return s.charAt(0).toUpperCase() + s.slice(1) + " " + y; }
function monthOnly(k){ const [y,m] = k.split("-").map(Number); return new Date(y,m-1,1).toLocaleDateString("es-ES",{month:"long"}); }
const fmt = new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:2,minimumFractionDigits:0});
const fmt0 = new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0,useGrouping:true});
const fmt2 = new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true});
const eur = n => (Math.round(n*100) % 100 === 0 ? fmt0 : fmt2).format(n);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function dayLabel(s){
  const t = ymd(new Date()), y = new Date(); y.setDate(y.getDate()-1);
  if (s === t) return "Hoy"; if (s === ymd(y)) return "Ayer";
  const [a,b,c] = s.split("-").map(Number);
  return new Date(a,b-1,c).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
}
function vibrar(ms){ try { navigator.vibrate && navigator.vibrate(ms || 10); } catch(e){} }
function lsGet(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } }
function lsSet(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }

/* =====================================================================
   ALMACÉN DE DATOS: Supabase (nube) o modo prueba (este móvil)
   Las dos versiones devuelven exactamente lo mismo.
   ===================================================================== */
const Nube = {
  async rpc(fn, args){
    const key = CFG.supabaseKey, h = { "apikey": key, "Content-Type": "application/json" };
    if (!key.startsWith("sb_")) h["Authorization"] = "Bearer " + key;
    const r = await fetch(CFG.supabaseUrl.replace(/\/+$/,"") + "/rest/v1/rpc/" + fn, { method:"POST", headers:h, body:JSON.stringify(args || {}) });
    if (!r.ok) throw new Error("RED_" + r.status);
    return r.json();
  },
  menu(){ return this.rpc("perfiles_menu"); },
  crearPin(id,pin){ return this.rpc("crear_pin",{p_id:id,p_pin:pin}); },
  entrar(id,pin){ return this.rpc("entrar",{p_id:id,p_pin:pin}); },
  cambiarPin(id,pin,nuevo){ return this.rpc("cambiar_pin",{p_id:id,p_pin:pin,p_nuevo:nuevo}); },
  guardarMov(id,pin,m){ return this.rpc("guardar_mov",{p_id:id,p_pin:pin,p_tipo:m.tipo,p_cat:m.cat,p_importe:m.importe,p_fecha:m.fecha,p_nota:m.nota}); },
  borrarMov(id,pin,mov){ return this.rpc("borrar_mov",{p_id:id,p_pin:pin,p_mov:mov}); },
  ultimaCopia(){ return this.rpc("ultima_copia"); },
  adminEstado(pin){ return this.rpc("admin_estado",{p_pin:pin}); },
  adminResetear(pin,obj){ return this.rpc("admin_resetear_pin",{p_pin:pin,p_objetivo:obj}); },
  guardarRecurrente(id,pin,r){ return this.rpc("guardar_recurrente",{p_id:id,p_pin:pin,p_tipo:r.tipo,p_cat:r.cat,p_importe:r.importe,p_dia:r.dia,p_nota:r.nota}); },
  pararRecurrente(id,pin,rec){ return this.rpc("parar_recurrente",{p_id:id,p_pin:pin,p_rec:rec}); },
  misCopias(id,pin){ return this.rpc("mis_copias",{p_id:id,p_pin:pin}); },
  copiaExcel(id,pin,c){ return this.rpc("copia_excel",{p_id:id,p_pin:pin,p_copia:c}); },
  guardarAjustes(id,pin,a){ return this.rpc("guardar_ajustes",{p_id:id,p_pin:pin,p_nombre:a.nombre,p_emoji:a.emoji,p_color:a.color,p_oscuro:a.oscuro,p_provincia:a.provincia,p_combustible:a.combustible}); }
};

const Local = {
  KEY: "nc_datos_v1",
  db(){
    let d = lsGet(this.KEY);
    if (!d){
      d = { perfiles: {
        p1:{nombre:"Raúl",emoji:"🎩",color:"violeta",oscuro:false,provincia:"28",combustible:"1"},
        p2:{nombre:"Sara",emoji:"📚",color:"rosa",oscuro:false,provincia:"28",combustible:"1"},
        p3:{nombre:"Marta",emoji:"✏️",color:"azul",oscuro:false,provincia:"28",combustible:"1"} }, movs:[] };
      lsSet(this.KEY, d);
    }
    return d;
  },
  save(d){ lsSet(this.KEY, d); },
  async ultimaCopia(){ return null; },
  async adminEstado(pin){
    const d = this.db(), e = await this.check(d,ADMIN,pin); if (e !== "OK") return {error:e};
    return {ok:true, perfiles:Object.keys(d.perfiles).filter(id => id !== ADMIN).map(id => ({ id, nombre:d.perfiles[id].nombre, emoji:d.perfiles[id].emoji,
      tiene_pin:!!d.perfiles[id].pin, bloqueado:!!(d.perfiles[id].bloq && d.perfiles[id].bloq > Date.now()) }))};
  },
  async adminResetear(pin,obj){
    const d = this.db(), e = await this.check(d,ADMIN,pin); if (e !== "OK") return {error:e};
    if (obj === ADMIN || !d.perfiles[obj]) return {error:"NO_PERMITIDO"};
    Object.assign(d.perfiles[obj], {pin:null, salt:null, fallos:0, bloq:0}); this.save(d); return {ok:true};
  },
  generar(d,id){
    const hoy = ymd(new Date());
    (d.recurrentes || []).filter(r => r.activo && r.persona === id).forEach(r => {
      let [y,m] = (r.ultimo ? shiftMonth(r.ultimo.slice(0,7), 1) : r.creado.slice(0,7)).split("-").map(Number);
      for (let i = 0; i < 60; i++){
        const ult = new Date(y, m, 0).getDate(), f = `${y}-${pad(m)}-${pad(Math.min(r.dia, ult))}`;
        if (f > hoy) break;
        d.movs.push({ id:"l" + Date.now() + Math.random().toString(36).slice(2,6), persona:id, tipo:r.tipo, cat:r.cat, importe:r.importe, fecha:f, nota:r.nota, creado:Date.now(), rec:r.id });
        r.ultimo = f; m++; if (m > 12){ m = 1; y++; }
      }
    });
  },
  async guardarRecurrente(id,pin,r){
    const d = this.db(), e = await this.check(d,id,pin); if (e !== "OK") return {error:e};
    d.recurrentes = d.recurrentes || [];
    d.recurrentes.push({ id:"r" + Date.now(), persona:id, ...r, activo:true, ultimo:null, creado:ymd(new Date()) });
    this.generar(d,id); this.save(d); return {ok:true};
  },
  async pararRecurrente(id,pin,rec){
    const d = this.db(), e = await this.check(d,id,pin); if (e !== "OK") return {error:e};
    (d.recurrentes || []).forEach(r => { if (r.id === rec && r.persona === id) r.activo = false; }); this.save(d); return {ok:true};
  },
  async misCopias(){ return {ok:true, copias:[]}; },
  async copiaExcel(){ return {error:"NO_EXISTE"}; },
  async hash(pin, salt){
    const data = new TextEncoder().encode(salt + ":" + pin);
    if (window.crypto && crypto.subtle){
      const h = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2,"0")).join("");
    }
    let h = 5381; for (const b of data) h = ((h << 5) + h + b) | 0; return "x" + (h >>> 0).toString(16);
  },
  perfil(d,id){ const p = d.perfiles[id]; return { id, nombre:p.nombre, emoji:p.emoji, color:p.color, oscuro:p.oscuro, provincia:p.provincia, combustible:p.combustible }; },
  async check(d,id,pin){
    const p = d.perfiles[id]; if (!p) return "NO_EXISTE";
    if (!p.pin) return "SIN_PIN";
    if (p.bloq && p.bloq > Date.now()) return "BLOQUEADO";
    if (await this.hash(pin, p.salt) === p.pin){ p.fallos = 0; this.save(d); return "OK"; }
    p.fallos = (p.fallos || 0) + 1;
    if (p.fallos >= 5){ p.fallos = 0; p.bloq = Date.now() + 5*60000; this.save(d); return "BLOQUEADO"; }
    this.save(d); return "PIN_MAL";
  },
  async menu(){ const d = this.db(); return Object.keys(d.perfiles).map(id => ({ ...this.perfil(d,id), tiene_pin: !!d.perfiles[id].pin })); },
  async crearPin(id,pin){
    const d = this.db(), p = d.perfiles[id];
    if (!/^\d{4}$/.test(pin)) return {error:"PIN_FORMATO"};
    if (p.pin) return {error:"YA_TIENE_PIN"};
    p.salt = Math.random().toString(36).slice(2); p.pin = await this.hash(pin, p.salt); this.save(d); return {ok:true};
  },
  async entrar(id,pin){
    const d = this.db(), e = await this.check(d,id,pin); if (e !== "OK") return {error:e};
    this.generar(d,id); this.save(d);
    return { ok:true, perfil:this.perfil(d,id), movs:d.movs.filter(m => m.persona === id),
             recurrentes:(d.recurrentes || []).filter(r => r.persona === id && r.activo).sort((x,y) => x.dia - y.dia) };
  },
  async cambiarPin(id,pin,nuevo){
    const d = this.db(), e = await this.check(d,id,pin); if (e !== "OK") return {error:e};
    const p = d.perfiles[id]; p.salt = Math.random().toString(36).slice(2); p.pin = await this.hash(nuevo, p.salt); this.save(d); return {ok:true};
  },
  async guardarMov(id,pin,m){
    const d = this.db(), e = await this.check(d,id,pin); if (e !== "OK") return {error:e};
    const nuevo = { id:"l" + Date.now() + Math.random().toString(36).slice(2,6), persona:id, ...m, creado:Date.now() };
    d.movs.push(nuevo); this.save(d); return {ok:true, id:nuevo.id, creado:nuevo.creado};
  },
  async borrarMov(id,pin,mov){
    const d = this.db(), e = await this.check(d,id,pin); if (e !== "OK") return {error:e};
    d.movs = d.movs.filter(m => !(m.id === mov && m.persona === id)); this.save(d); return {ok:true};
  },
  async guardarAjustes(id,pin,a){
    const d = this.db(), e = await this.check(d,id,pin); if (e !== "OK") return {error:e};
    Object.assign(d.perfiles[id], a); this.save(d); return {ok:true, perfil:this.perfil(d,id)};
  }
};
const Store = REMOTO ? Nube : Local;

const ERRORES = {
  PIN_MAL: "Código incorrecto, prueba otra vez",
  BLOQUEADO: "Demasiados intentos. Espera 5 minutos 🙏",
  SIN_PIN: "Este perfil aún no tiene código",
  YA_TIENE_PIN: "Este perfil ya tiene código",
  PIN_FORMATO: "El código tiene que ser de 4 números",
  RED: "Sin conexión. Revisa internet e inténtalo otra vez."
};
const errTxt = e => ERRORES[e] || (String(e).startsWith("RED") ? ERRORES.RED : "Algo ha fallado, inténtalo otra vez");

/* =====================================================================
   ESTADO
   ===================================================================== */
let perfilesMenu = [];
let S = null;                    // sesión: {id, pin, perfil, movs}
let view = "add", tipo = "gasto", viewMonth = monthKey(new Date());
let pinState = null, pinBusy = false;
let entry = null;                // apuntado en curso
let lastAdded = null, ocultoDesde = 0;

const cats = (t) => CATEGORIAS[TIPO_PERFIL[S.id] || "profe"][t].map(a => ({id:a[0], e:a[1], n:a[2], bg:a[3]}));
function catOf(m){
  const c = cats(m.tipo).find(c => c.id === m.cat);
  return c || (m.tipo === "ingreso" ? {e:"✨", n:"Otros ingresos", bg:"#f0eef5"} : {e:"✨", n:"Otros gastos", bg:"#f0eef5"});
}
function limpiar(m){
  return { id:String(m.id), tipo: m.tipo === "ingreso" ? "ingreso" : "gasto", cat:String(m.cat || "otros"),
    importe: Math.max(0, Number(m.importe) || 0), fecha: /^\d{4}-\d{2}-\d{2}/.test(m.fecha) ? String(m.fecha).slice(0,10) : ymd(new Date()),
    nota: String(m.nota || "").slice(0,80), creado: Number(m.creado) || 0, rec: m.rec ? String(m.rec) : null };
}
function limpiarRecs(l){
  return (Array.isArray(l) ? l : []).map(r => ({ id:String(r.id), tipo: r.tipo === "ingreso" ? "ingreso" : "gasto", cat:String(r.cat || "otros"),
    importe: Math.max(0, Number(r.importe) || 0), dia: Math.min(31, Math.max(1, Number(r.dia) || 1)), nota:String(r.nota || "").slice(0,80) }));
}
const ofMonth = (l,k) => l.filter(m => m.fecha.startsWith(k));
const total = (l,t) => l.filter(m => m.tipo === t).reduce((a,m) => a + m.importe, 0);

function aplicarTema(color, oscuro){
  const P = PALETAS[color] || PALETAS.violeta, r = document.documentElement.style;
  r.setProperty("--p", P[0]); r.setProperty("--p2", P[1]); r.setProperty("--p-soft", P[0] + (oscuro ? "40" : "1f"));
  document.body.classList.toggle("dark", !!oscuro);
  document.querySelector('meta[name="theme-color"]').content = P[0];
}
function show(screen){
  ["menu","pin","app"].forEach(s => $(s).classList.toggle("hidden", s !== screen));
  $("nav").classList.toggle("hidden", screen !== "app");
  if (screen !== "app") document.body.classList.remove("dark");
  if (screen === "menu") document.querySelector('meta[name="theme-color"]').content = "#f7f3ff";
  window.scrollTo(0,0);
}
function confetti(){
  const em = ["💸","✨","🪙","🎉"];
  for (let i = 0; i < 16; i++){
    const s = document.createElement("span"); s.className = "confetti"; s.textContent = em[i % em.length];
    s.style.left = Math.random()*100 + "vw"; s.style.animationDelay = Math.random()*.3 + "s";
    document.body.appendChild(s); setTimeout(() => s.remove(), 1700);
  }
}
let toastT;
function toast(txt, undo, frase){
  $("toastTxt").textContent = txt; $("undo").classList.toggle("hidden", !undo);
  $("toastFrase").textContent = frase || ""; $("toastFrase").classList.toggle("hidden", !frase);
  const t = $("toast"); t.classList.remove("frase"); void t.offsetWidth; t.classList.toggle("frase", !!frase);
  t.classList.add("show"); clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), frase ? 5500 : 3800);
}
function banner(t){ $("banner").textContent = t || ""; $("banner").classList.toggle("hidden", !t); }

/* =====================================================================
   MENÚ
   ===================================================================== */
async function cargarMenu(){
  if (!REMOTO){ $("modeNote").textContent = "🧪 Modo prueba: los datos se guardan solo en este móvil. Para compartirlos entre móviles, configura Supabase (mira README.md)."; $("modeNote").classList.remove("hidden"); }
  try {
    const r = await Store.menu();
    perfilesMenu = Array.isArray(r) ? r : [];
    pintarMenu();
  } catch(e){
    $("pcards").innerHTML = `<div class="mode-note">No se puede conectar. Revisa internet y vuelve a abrir la app.<br><button class="btn" style="margin-top:10px" onclick="cargarMenu()">Reintentar</button></div>`;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (!standalone){
    $("installTip").textContent = ios ? "📲 Para tenerla como app: botón Compartir → «Añadir a pantalla de inicio»" : "📲 Para tenerla como app: menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio»";
    $("installTip").classList.remove("hidden");
  }
}
function pintarMenu(){
  $("pcards").innerHTML = perfilesMenu.map(p => {
    const P = PALETAS[p.color] || PALETAS.violeta;
    return `<button class="pcard" data-p="${esc(p.id)}" style="--c1:${P[0]};--c2:${P[1]}">
      <span class="em">${esc(p.emoji)}</span><span><div class="nm">${esc(p.nombre)}</div>
      <div class="st">${p.tiene_pin ? "🔒 Entrar con tu código" : "✨ Primera vez: crea tu código"}</div></span><span class="go">›</span></button>`;
  }).join("");
}
$("pcards").addEventListener("click", e => {
  const b = e.target.closest(".pcard"); if (!b) return;
  const p = perfilesMenu.find(x => x.id === b.dataset.p); if (!p) return;
  aplicarTema(p.color, false); document.body.classList.remove("dark");
  pinState = { id:p.id, nombre:p.nombre, emoji:p.emoji, mode: p.tiene_pin ? "enter" : "create", buf:"" };
  pintarPin(); show("pin");
});

/* =====================================================================
   CÓDIGO
   ===================================================================== */
function pintarPin(msg, err){
  const s = pinState;
  $("pinEm").textContent = s.emoji;
  const titles = { enter:`Hola, ${s.nombre}`, create:"Crea tu código", confirm:"Repite tu código", change:"Tu código nuevo" };
  const subs = { enter:"Escribe tu código privado", create:"4 números que solo sepas tú", confirm:"Para asegurarnos 😉", change:"4 números que solo sepas tú" };
  $("pinTitle").textContent = titles[s.mode];
  $("pinMsg").textContent = msg || subs[s.mode]; $("pinMsg").classList.toggle("err", !!err);
  [...$("dots").children].forEach((d,i) => d.classList.toggle("on", i < s.buf.length));
}
function sacudir(el){ el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); vibrar([30,40,30]); }
$("keys").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !pinState || pinBusy) return;
  vibrar();
  if (b.dataset.k === "del"){ pinState.buf = pinState.buf.slice(0,-1); pintarPin(); return; }
  if (pinState.buf.length >= 4) return;
  pinState.buf += b.textContent; pintarPin();
  if (pinState.buf.length === 4){
    const s = pinState;
    if (s.mode === "create" || s.mode === "change"){   // paso inmediato, sin bloquear el teclado
      s.first = s.buf; s.prev = s.mode; s.mode = "confirm"; s.buf = ""; pintarPin(); return;
    }
    pinBusy = true; setTimeout(async () => { try { await pinListo(); } finally { pinBusy = false; } }, 120);
  }
});
document.addEventListener("keydown", e => {
  if (!$("pin").classList.contains("hidden") && pinState){
    if (/^\d$/.test(e.key)) [...$("keys").querySelectorAll("button")].find(x => x.textContent === e.key)?.click();
    if (e.key === "Backspace") $("keys").querySelector('[data-k="del"]').click();
  }
});
async function pinListo(){
  const s = pinState, pin = s.buf; s.buf = "";
  $("pinMsg").innerHTML = '<span class="spin"></span>';
  try {
    if (s.mode === "enter"){
      const r = await Store.entrar(s.id, pin);
      if (r.ok){ abrirSesion(s.id, pin, r); return; }
      sacudir($("dots")); pintarPin(errTxt(r.error), true); return;
    }
    if (s.mode === "create" || s.mode === "change"){ s.first = pin; s.prev = s.mode; s.mode = "confirm"; pintarPin(); return; }
    if (s.mode === "confirm"){
      if (pin !== s.first){ s.mode = s.prev; sacudir($("dots")); pintarPin("No coinciden. Empieza otra vez", true); return; }
      if (s.prev === "create"){
        const r = await Store.crearPin(s.id, pin);
        if (!r.ok && r.error === "YA_TIENE_PIN"){
          // El perfil ya tenía código (creado antes o desde otro móvil): pedimos el de verdad
          s.mode = "enter"; s.first = null; s.prev = null; pintarPin("Este perfil ya tiene código. Escríbelo para entrar", true);
          const p = perfilesMenu.find(x => x.id === s.id); if (p) p.tiene_pin = true;
          return;
        }
        if (!r.ok){ s.mode = "create"; pintarPin(errTxt(r.error), true); return; }
        const r2 = await Store.entrar(s.id, pin);
        if (!r2.ok){ pintarPin(errTxt(r2.error), true); return; }
        abrirSesion(s.id, pin, r2); toast("🎉 ¡Código creado! Bienvenid@"); confetti(); return;
      }
      const r = await Store.cambiarPin(S.id, S.pin, pin);
      if (!r.ok){ s.mode = "change"; pintarPin(errTxt(r.error), true); return; }
      S.pin = pin; pinState = null; show("app"); toast("🔑 Código cambiado"); return;
    }
  } catch(e){ s.mode = s.prev && s.mode === "confirm" ? s.prev : s.mode; pintarPin(errTxt("RED"), true); }
}
$("pinBack").onclick = () => {
  if (S && pinState && (pinState.mode === "change" || pinState.prev === "change")){ pinState = null; show("app"); aplicarTema(S.perfil.color, S.perfil.oscuro); return; }
  pinState = null; show("menu"); cargarMenu();
};

/* =====================================================================
   SESIÓN
   ===================================================================== */
function abrirSesion(id, pin, r){
  S = { id, pin, perfil:r.perfil, movs:(r.movs || []).map(limpiar), recs:limpiarRecs(r.recurrentes) };
  pinState = null; view = "add"; tipo = "gasto"; viewMonth = monthKey(new Date());
  aplicarTema(S.perfil.color, S.perfil.oscuro);
  document.querySelectorAll("#seg button").forEach(x => x.classList.toggle("on", x.dataset.t === "gasto"));
  document.querySelectorAll("nav button").forEach(x => x.classList.toggle("on", x.dataset.v === "add"));
  show("app"); pintarCabecera(); pintarCats(); pintarTodo();
}
function cerrarSesion(){
  if (window.__actualizar){ window.__actualizar(); return; }
  S = null; copiasCache = null; $("adminCard").classList.add("hidden"); $("adminList").innerHTML = ""; cerrarEntry(); show("menu"); cargarMenu();
}
$("lockBtn").onclick = cerrarSesion; $("logout").onclick = cerrarSesion;

async function refrescar(){
  if (!S || !REMOTO) return;
  try {
    const r = await Store.entrar(S.id, S.pin);
    if (r.ok){ S.perfil = r.perfil; S.movs = r.movs.map(limpiar); S.recs = limpiarRecs(r.recurrentes); banner(""); pintarCabecera(); pintarTodo(); }
    else if (r.error === "PIN_MAL" || r.error === "SIN_PIN"){ cerrarSesion(); }
  } catch(e){ banner("Sin conexión: lo que ves puede no estar al día."); }
}
// Al volver a la app: sincroniza y, si ha pasado mucho rato, bloquea.
document.addEventListener("visibilitychange", () => {
  if (document.hidden){ ocultoDesde = Date.now(); return; }
  if (S && ocultoDesde && Date.now() - ocultoDesde > 10*60000){ cerrarSesion(); return; }
  refrescar();
});

function pintarCabecera(){
  const h = new Date().getHours(), P = S.perfil;
  $("hAv").textContent = P.emoji;
  $("hHi").innerHTML = `${h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches"}, ${esc(P.nombre)}<small>${REMOTO ? "Guardado en la nube ☁️" : "Modo prueba · solo en este móvil"}</small>`;
}

/* =====================================================================
   APUNTAR
   ===================================================================== */
function pintarCats(){
  $("cats").innerHTML = cats(tipo).map(c => `<button class="cat" data-c="${c.id}" style="--cb:${c.bg}"><span class="e">${c.e}</span>${esc(c.n)}</button>`).join("");
}
$("seg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  tipo = b.dataset.t; vibrar(); [...$("seg").children].forEach(x => x.classList.toggle("on", x === b)); pintarCats();
});
$("cats").addEventListener("click", e => {
  const b = e.target.closest(".cat"); if (!b) return;
  vibrar(); abrirEntry(cats(tipo).find(c => c.id === b.dataset.c));
});

function abrirEntry(c){
  entry = { cat:c, tipo, txt:"", dateMode:"hoy", custom:null, rep: c.id === "suscripciones" };
  $("eEm").textContent = c.e; $("eEm").parentElement.style.setProperty("--cb", c.bg);
  $("eEm").style.setProperty("--cb", c.bg);
  $("eName").textContent = c.n;
  $("eType").textContent = tipo === "gasto" ? "Gasto" : "Ingreso";
  $("eType").style.color = tipo === "gasto" ? "var(--gasto)" : "var(--ingreso)";
  $("eNote").value = ""; $("eDate").value = "";
  $("eSave").className = "btn save-btn " + tipo;
  pintarEntry(); $("entry").classList.add("show");
}
function cerrarEntry(){ $("entry").classList.remove("show"); entry = null; }
function importeEntry(){ const n = Number((entry.txt || "0").replace(",", ".")); return isFinite(n) ? Math.round(n*100)/100 : 0; }
function pintarEntry(){
  const t = entry.txt || "0";
  $("eAmt").innerHTML = esc(t) + '<span class="eur">€</span>';
  $("eAmt").classList.toggle("zero", !entry.txt);
  document.querySelectorAll("#eDates [data-d]").forEach(b => b.classList.toggle("on", b.dataset.d === entry.dateMode));
  $("eOther").classList.toggle("on", entry.dateMode === "otro");
  $("eOther").firstElementChild.textContent = entry.dateMode === "otro" && entry.custom ? "📅 " + dayLabel(entry.custom) : "📅 Otro día";
  const v = importeEntry();
  $("eRep").classList.toggle("on", entry.rep); $("eRepSw").classList.toggle("on", entry.rep); $("eRep").setAttribute("aria-pressed", entry.rep);
  $("eRepTxt").textContent = entry.rep ? `Se apuntará solo el día ${Number(fechaEntry().slice(8))} de cada mes` : "Para Netflix, gimnasio, alquiler, nómina…";
  $("eSave").disabled = !(v > 0);
  $("eSave").textContent = v > 0 ? (entry.rep ? `Guardar ${eur(v)} cada mes` : `Guardar ${eur(v)}`) : "Escribe la cantidad";
}
$("ePad").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !entry) return;
  vibrar(); let t = entry.txt;
  if (b.dataset.k === "del") t = t.slice(0,-1);
  else if (b.dataset.k === ","){ if (!t.includes(",")) t = (t || "0") + ","; }
  else {
    const [ent, dec] = t.split(",");
    if (dec !== undefined && dec.length >= 2) return;
    if (dec === undefined && ent.length >= 6) return;
    t = (t === "0" ? "" : t) + b.textContent;
  }
  entry.txt = t; pintarEntry();
});
$("eDates").addEventListener("click", e => { const b = e.target.closest("[data-d]"); if (!b || !entry) return; entry.dateMode = b.dataset.d; entry.custom = null; pintarEntry(); });
$("eDate").addEventListener("change", e => { if (!entry || !e.target.value) return; entry.dateMode = "otro"; entry.custom = e.target.value; pintarEntry(); });
$("eClose").onclick = cerrarEntry;
$("eRep").onclick = () => { if (!entry) return; vibrar(); entry.rep = !entry.rep; pintarEntry(); };
function fechaEntry(){
  if (!entry) return ymd(new Date());
  if (entry.dateMode === "ayer"){ const d = new Date(); d.setDate(d.getDate()-1); return ymd(d); }
  if (entry.dateMode === "otro" && entry.custom) return entry.custom;
  return ymd(new Date());
}
$("entry").addEventListener("click", e => { if (e.target.id === "entry") cerrarEntry(); });
document.addEventListener("keydown", e => {
  if (!entry || document.activeElement === $("eNote")) return;
  if (/^\d$/.test(e.key)) [...$("ePad").querySelectorAll("button")].find(x => x.textContent === e.key)?.click();
  if (e.key === "," || e.key === ".") $("ePad").querySelector('[data-k=","]').click();
  if (e.key === "Backspace") $("ePad").querySelector('[data-k="del"]').click();
  if (e.key === "Enter" && !$("eSave").disabled) $("eSave").click();
  if (e.key === "Escape") cerrarEntry();
});
$("eSave").onclick = async () => {
  if (!entry) return;
  const v = importeEntry(); if (!(v > 0)) return;
  const fecha = fechaEntry();
  if (entry.rep){
    const r = { tipo:entry.tipo, cat:entry.cat.id, importe:v, dia:Number(fecha.slice(8)), nota:$("eNote").value.trim().slice(0,80) };
    const c = entry.cat; cerrarEntry(); vibrar(20);
    try {
      const res = await Store.guardarRecurrente(S.id, S.pin, r);
      if (!res.ok) throw new Error(res.error);
      const r2 = await Store.entrar(S.id, S.pin);
      if (r2.ok){ S.movs = r2.movs.map(limpiar); S.recs = limpiarRecs(r2.recurrentes); }
      pintarTodo(); toast(`🔁 ${c.e} ${eur(v)} el día ${r.dia} de cada mes ✓`, false, fraseApunte(r.tipo, r.cat, v));
    } catch(err){ toast("⚠️ No se ha guardado: " + errTxt(err.message || "RED")); }
    return;
  }
  const m = { tipo:entry.tipo, cat:entry.cat.id, importe:v, fecha, nota:$("eNote").value.trim().slice(0,80) };
  const temp = { id:"tmp" + Date.now(), ...m, creado:Date.now() };
  S.movs.push(temp); cerrarEntry(); pintarTodo(); vibrar(20);
  const c = catOf(m); toast(`${c.e} ${eur(v)} · ${c.n} ✓`, true, fraseApunte(m.tipo, m.cat, v)); lastAdded = temp.id;
  try {
    const r = await Store.guardarMov(S.id, S.pin, m);
    if (!r.ok) throw new Error(r.error);
    const tmpId = temp.id; temp.id = String(r.id);
    temp.tmpId = tmpId;
    if (!S.movs.includes(temp)){ Store.borrarMov(S.id, S.pin, temp.id).catch(() => {}); return; }   // se deshizo mientras se guardaba
    if (lastAdded === tmpId) lastAdded = temp.id;
    pintarTodo();   // los botones ✕ pasan a llevar el id definitivo
  } catch(err){
    S.movs = S.movs.filter(x => x !== temp); pintarTodo();
    toast("⚠️ No se ha guardado: " + errTxt(err.message || "RED"));
  }
};
$("undo").onclick = () => { if (lastAdded) borrar(lastAdded); lastAdded = null; $("toast").classList.remove("show"); };

async function pararFijo(rec){
  const r = (S.recs || []).find(x => x.id === rec); if (!r) return;
  S.recs = S.recs.filter(x => x !== r); pintarTodo();
  try { const res = await Store.pararRecurrente(S.id, S.pin, rec); if (!res.ok) throw new Error(res.error); toast("🔁 Ya no se repetirá. Lo apuntado se queda."); }
  catch(err){ S.recs.push(r); pintarTodo(); toast("⚠️ No se ha podido cambiar"); }
}
async function borrar(id){
  const m = S.movs.find(x => x.id === id || x.tmpId === id); if (!m) return;
  id = m.id;
  S.movs = S.movs.filter(x => x !== m); pintarTodo();
  if (id.startsWith("tmp")) return;
  try { const r = await Store.borrarMov(S.id, S.pin, id); if (!r.ok) throw new Error(r.error); }
  catch(err){ S.movs.push(m); pintarTodo(); toast("⚠️ No se ha podido borrar"); }
}
document.addEventListener("click", e => {
  const b = e.target.closest(".del"); if (!b) return;
  if (b.classList.contains("sure")){ if (b.dataset.fijo) pararFijo(b.dataset.fijo); else borrar(b.dataset.id); return; }
  document.querySelectorAll(".del.sure").forEach(x => { x.classList.remove("sure"); x.textContent = "✕"; });
  b.classList.add("sure"); b.textContent = b.dataset.fijo ? "¿Dejar de repetir?" : "¿Borrar?"; vibrar();
  setTimeout(() => { if (b.isConnected){ b.classList.remove("sure"); b.textContent = "✕"; } }, 3000);
});

/* =====================================================================
   PINTAR VISTAS
   ===================================================================== */
function fila(m, conFecha){
  const c = catOf(m), sub = m.nota ? esc(m.nota) : (conFecha ? dayLabel(m.fecha) : "");
  return `<div class="row"><div class="e" style="--cb:${c.bg}">${c.e}</div>
    <div class="mid"><div class="t">${esc(c.n)}${m.rec ? '<span class="badge">🔁 fijo</span>' : ""}</div>${sub ? `<div class="s">${sub}</div>` : ""}</div>
    <div class="v ${m.tipo === "ingreso" ? "in" : ""}">${m.tipo === "ingreso" ? "+" : "−"}${eur(m.importe)}</div>
    <button class="del" data-id="${esc(m.id)}" aria-label="Borrar">✕</button></div>`;
}
const ordenados = l => [...l].sort((a,b) => b.fecha.localeCompare(a.fecha) || b.creado - a.creado);

function pintarBalance(){
  const k = (view === "list" || view === "charts") ? viewMonth : monthKey(new Date());
  const l = ofMonth(S.movs, k), g = total(l,"gasto"), i = total(l,"ingreso");
  $("balLbl").textContent = `Te queda en ${monthOnly(k)}`;
  $("balN").textContent = eur(i - g); $("balN").style.color = i - g < 0 ? "var(--warn)" : "var(--ink)";
  $("balG").textContent = eur(g); $("balI").textContent = eur(i);
}
function pintarFijos(){
  const l = S.recs || [];
  const g = l.filter(r => r.tipo === "gasto").reduce((a,r) => a + r.importe, 0);
  $("recTot").textContent = g ? `${eur(g)}/mes en gastos` : "";
  $("recList").innerHTML = l.length ? l.map(r => {
    const c = catOf(r);
    return `<div class="row"><div class="e" style="--cb:${c.bg}">${c.e}</div>
      <div class="mid"><div class="t">${esc(r.nota || c.n)}</div><div class="s">Día ${r.dia} de cada mes${r.nota ? " · " + esc(c.n) : ""}</div></div>
      <div class="v ${r.tipo === "ingreso" ? "in" : ""}">${r.tipo === "ingreso" ? "+" : "−"}${eur(r.importe)}</div>
      <button class="del" data-fijo="${esc(r.id)}" aria-label="Dejar de repetir">✕</button></div>`;
  }).join("") : `<div class="empty" style="padding:10px">Al apuntar Netflix, el gimnasio o la nómina, marca <b>🔁 Repetir cada mes</b> y se apuntará solo.</div>`;
}
function pintarApuntar(){
  pintarFijos();
  const r = ordenados(S.movs).slice(0,6);
  $("recent").innerHTML = r.length ? r.map(m => fila(m,true)).join("") : `<div class="empty"><span class="e">🪄</span>Aún no hay nada apuntado.<br>Toca una categoría para empezar.</div>`;
}
function pintarLista(){
  const l = ordenados(ofMonth(S.movs, viewMonth));
  if (!l.length){ $("list").innerHTML = `<div class="empty"><span class="e">📭</span>Nada apuntado este mes.</div>`; return; }
  let h = "", d = "";
  for (const m of l){ if (m.fecha !== d){ d = m.fecha; h += `<div class="day-h">${esc(dayLabel(d))}</div>`; } h += fila(m,false); }
  $("list").innerHTML = h;
}
const CATS_GUARDADO = ["ahorro","inversion"];
function porCategoria(l, sinGuardado){
  const by = {};
  l.filter(m => m.tipo === "gasto" && !(sinGuardado && CATS_GUARDADO.includes(m.cat))).forEach(m => { by[m.cat] = (by[m.cat] || 0) + m.importe; });
  return Object.entries(by).sort((a,b) => b[1] - a[1]);
}
function pintarGraficas(){
  const l = ofMonth(S.movs, viewMonth), g = total(l,"gasto"), rows = porCategoria(l), max = rows.length ? rows[0][1] : 1;
  $("byCat").innerHTML = rows.length ? rows.map(([cat,v]) => {
    const c = catOf({tipo:"gasto", cat});
    return `<div class="hbar"><span class="lab">${c.e} ${esc(c.n)}</span><span><span class="fill" style="width:${Math.max(1, v/max*100)}%"></span></span><span class="val">${eur(v)}<span class="pct">${g ? Math.round(v/g*100) : 0}%</span></span></div>`;
  }).join("") : `<div class="empty"><span class="e">🌱</span>Sin gastos este mes.</div>`;
  const [y,mo] = viewMonth.split("-").map(Number), days = new Date(y,mo,0).getDate();
  const daily = Array.from({length:days}, (_,d) => {
    const key = viewMonth + "-" + pad(d+1), v = l.filter(m => m.tipo === "gasto" && m.fecha === key).reduce((a,m) => a + m.importe, 0);
    return { label:String(d+1), tip:`${dayLabel(key)}: ${eur(v)}`, vals:[v] };
  });
  barras($("daily"), daily, ["var(--gasto)"], i => i === 0 || (i+1) % 5 === 0);
  const ms = [];
  for (let n = 5; n >= 0; n--){
    const k = shiftMonth(viewMonth,-n), ll = ofMonth(S.movs,k), gg = total(ll,"gasto"), ii = total(ll,"ingreso");
    const [yy,mm] = k.split("-").map(Number);
    ms.push({ label:new Date(yy,mm-1,1).toLocaleDateString("es-ES",{month:"short"}).replace(".",""), tip:`${monthOnly(k)}: −${eur(gg)} / +${eur(ii)}`, vals:[gg,ii] });
  }
  barras($("months"), ms, ["var(--gasto)","var(--ingreso)"], () => true);
}
function maxBonito(v){ if (v <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(v))), f = v/p; return (f<=1?1:f<=2?2:f<=5?5:10)*p; }
function barras(el, data, colors, showLabel){
  const W = 360, H = 170, padL = 40, padB = 20, padT = 8, iw = W - padL, ih = H - padB - padT;
  const max = maxBonito(Math.max(0, ...data.flatMap(d => d.vals)));
  const slot = iw / data.length, gw = slot * (data.length > 12 ? .72 : .62), bw = (gw - (colors.length-1)*2) / colors.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let t = 0; t <= 4; t += 2){
    const yy = padT + ih - ih*t/4;
    s += `<line class="grid" x1="${padL}" x2="${W}" y1="${yy}" y2="${yy}"/><text class="axis" x="${padL-5}" y="${yy+4}" text-anchor="end">${fmt0.format(max*t/4).replace(/\s?€/,"€")}</text>`;
  }
  data.forEach((d,i) => {
    const x0 = padL + i*slot + (slot-gw)/2;
    d.vals.forEach((v,j) => {
      const h = v > 0 ? Math.max(2, ih*v/max) : 0, x = x0 + j*(bw+2), yy = padT + ih - h, r = Math.min(3, bw/2, h);
      if (h > 0) s += `<path d="M${x},${padT+ih} V${yy+r} Q${x},${yy} ${x+r},${yy} H${x+bw-r} Q${x+bw},${yy} ${x+bw},${yy+r} V${padT+ih} Z" fill="${colors[j]}"/>`;
    });
    if (showLabel(i)) s += `<text class="axis" x="${padL + i*slot + slot/2}" y="${H-4}" text-anchor="middle">${esc(d.label)}</text>`;
    s += `<rect class="hit" data-i="${i}" x="${padL + i*slot}" y="${padT}" width="${slot}" height="${ih}" fill="transparent"/>`;
  });
  el.innerHTML = s + `</svg><div class="tip"></div>`;
  const tip = el.querySelector(".tip"), svg = el.querySelector("svg");
  const ver = e => {
    const r = e.target.closest && e.target.closest(".hit"); if (!r){ tip.style.opacity = 0; return; }
    const d = data[+r.dataset.i], box = svg.getBoundingClientRect(), sc = box.width / W;
    tip.textContent = d.tip;
    tip.style.left = Math.min(Math.max((+r.getAttribute("x") + slot/2)*sc, 80), box.width - 80) + "px";
    tip.style.top = (padT*sc + 2) + "px"; tip.style.opacity = 1;
  };
  svg.addEventListener("pointermove", ver); svg.addEventListener("pointerdown", ver);
  svg.addEventListener("pointerleave", () => tip.style.opacity = 0);
}

/* =====================================================================
   AHORRO: análisis + consejos + recetas + IA opcional
   ===================================================================== */
function pintarAhorro(){
  const k = monthKey(new Date()), prev = shiftMonth(k,-1);
  // Si este mes casi no hay datos, analizamos el anterior
  let mes = k, l = ofMonth(S.movs, k);
  if (total(l,"gasto") === 0 && total(ofMonth(S.movs, prev),"gasto") > 0){ mes = prev; l = ofMonth(S.movs, prev); }
  const lPrev = ofMonth(S.movs, shiftMonth(mes,-1));
  const guardado = l.filter(m => m.tipo === "gasto" && CATS_GUARDADO.includes(m.cat)).reduce((s,m) => s + m.importe, 0);
  const g = total(l,"gasto") - guardado, i = total(l,"ingreso"), rows = porCategoria(l, true);
  const prevBy = Object.fromEntries(porCategoria(lPrev, true));
  let h = "";

  // Veredicto
  let em, tit, txt;
  if (!g){ em = "🌱"; tit = "Aún no hay gastos que analizar"; txt = "Apunta tus gastos unos días y aquí verás en qué se te va el dinero y cómo ahorrar."; }
  else if (!i){ em = "📝"; tit = `Llevas ${eur(g)} gastados en ${monthOnly(mes)}`; txt = "Apunta también tus ingresos para saber cuánto te queda y qué porcentaje ahorras."; }
  else {
    const tasa = Math.round((i - g) / i * 100);
    if (tasa >= 20){ em = "🏆"; tit = `¡Genial! Ahorras el ${tasa} %`; txt = `De cada 100 € que entran, guardas ${tasa}. Lo recomendable es al menos un 20 %: lo estás bordando.`; }
    else if (tasa >= 5){ em = "👍"; tit = `Ahorras el ${tasa} %`; txt = `Vas bien. Si llegas al 20 % (${eur(i*0.2)} al mes) tendrás un buen colchón. Mira abajo dónde recortar.`; }
    else if (tasa >= 0){ em = "⚖️"; tit = "Vas muy justo este mes"; txt = `Solo te sobran ${eur(i-g)}. Un pequeño recorte en lo que más gastas marca la diferencia.`; }
    else { em = "🚨"; tit = `Has gastado ${eur(g-i)} más de lo que ha entrado`; txt = "Toca frenar un poco. Empieza por la categoría de arriba del todo: es donde más se nota."; }
  }
  h += `<div class="card"><div class="verdict"><div class="big">${em}</div><div><b>${esc(tit)}</b><div class="muted small">${esc(txt)}</div></div></div></div>`;
  if (guardado > 0) h += `<div class="card"><div class="verdict"><div class="big">🐷</div><div><b>Has apartado ${eur(guardado)} en ahorro e inversión</b><div class="muted small">¡Así se hace! Ese dinero no cuenta como gasto en tus consejos: es dinero que trabaja para ti.</div></div></div></div>`;

  // Tarjetas de las 3 categorías donde más se gasta
  let recetasPuestas = false;
  rows.slice(0,3).forEach(([cat, v], idx) => {
    const c = catOf({tipo:"gasto", cat}), p = g ? Math.round(v/g*100) : 0, antes = prevBy[cat] || 0;
    let trend = "";
    if (antes > 0){ const d = Math.round((v - antes)/antes*100); if (Math.abs(d) >= 5) trend = `<span class="trend ${d > 0 ? "up" : "down"}">${d > 0 ? "▲" : "▼"} ${Math.abs(d)} %</span>`; }
    const tips = (CONSEJOS[cat] || CONSEJOS.otros).slice(0,3);
    h += `<div class="tcard" style="--cb:${c.bg};--cbd:${idx === 0 ? "var(--gasto)" : "var(--line)"}">
      <div class="thead"><div class="e">${c.e}</div><div><b>${esc(c.n)}</b><small>${eur(v)} · el ${p} % de tus gastos</small></div>${trend}</div>
      <div class="save">✂️ Recortando un 20 % ahorrarías ${eur(v*0.2)} al mes (${eur(v*0.2*12)} al año)</div>
      <ul class="tips">${tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      ${(cat === "comer" || cat === "super") && !recetasPuestas && (recetasPuestas = true) ? recetasHTML() : ""}
    </div>`;
  });

  if (!rows.slice(0,3).some(r => r[0] === "comer" || r[0] === "super")){
    h += `<div class="tcard" style="--cb:#ffe4dc;--cbd:var(--line)"><div class="thead"><div class="e">🍳</div><div><b>Recetas baratas y fáciles</b><small>Para comer bien gastando poco</small></div></div>${recetasHTML()}</div>`;
  }

  // IA (solo si está configurada)
  if (IA){
    h += `<div class="card"><h2>✨ Análisis con IA</h2><div class="muted small">La IA mira tus últimos meses y te da un plan de ahorro personalizado.</div>
      <button class="btn p" id="aiBtn">✨ Pedir consejos a la IA</button><div class="ai-out" id="aiOut"></div></div>`;
  }
  $("saveBody").innerHTML = h;
}

function recetasHTML(){
  return `<div class="sub-h">🍳 Recetas baratas para hacer en casa</div><div class="hscroll">${RECETAS.map((r,i) => `
    <div class="recipe"><div class="re">${r.e}</div><b>${esc(r.n)}</b><div class="meta">${esc(r.c)} · ⏱ ${esc(r.t)}</div>
    <div class="more hidden" id="rec${i}"><b style="font-size:13px">Necesitas:</b> ${esc(r.i)}<br><b style="font-size:13px">Cómo:</b> ${esc(r.p)}</div>
    <button class="tog" data-rec="${i}">Ver receta ›</button></div>`).join("")}</div>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-rec]"); if (!b) return;
  document.querySelectorAll(`[id="rec${b.dataset.rec}"]`).forEach(m => {
    m.classList.toggle("hidden"); b.textContent = m.classList.contains("hidden") ? "Ver receta ›" : "Ocultar";
  });
});

/* ---------- IA opcional (Cloudflare Worker) ---------- */
function mdLite(t){
  return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(^|\n)[-•] (.+)/g, "$1<li>$2</li>").replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>").replace(/<\/ul>\s*<ul>/g, "")
    .replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");
}
document.addEventListener("click", async e => {
  if (!e.target.closest("#aiBtn")) return;
  const out = $("aiOut"), btn = $("aiBtn");
  btn.disabled = true; out.innerHTML = '<span class="spin"></span> Pensando en tus cuentas…';
  const meses = [];
  for (let n = 2; n >= 0; n--){
    const k = shiftMonth(monthKey(new Date()), -n), l = ofMonth(S.movs, k);
    meses.push({ mes:monthName(k), ingresos:Math.round(total(l,"ingreso")), gastos:Math.round(total(l,"gasto")),
      categorias: porCategoria(l).map(([c,v]) => ({ categoria:catOf({tipo:"gasto",cat:c}).n, euros:Math.round(v) })) });
  }
  const prov = (PROVINCIAS.find(p => p[0] === S.perfil.provincia) || [,"Madrid"])[1];
  try {
    const r = await fetch(CFG.workerUrl.replace(/\/+$/,"") + "/consejos", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ perfil: TIPO_PERFIL[S.id] === "mago" ? "mago profesional autónomo" : "profesora", provincia: prov, meses }) });
    const j = await r.json();
    if (!r.ok || !j.texto) throw new Error();
    out.innerHTML = mdLite(j.texto);
  } catch(err){ out.textContent = "No he podido hablar con la IA ahora mismo. Inténtalo en un rato."; }
  btn.disabled = false;
});

/* =====================================================================
   AJUSTES
   ===================================================================== */
function pintarAjustes(){
  const P = S.perfil;
  if (document.activeElement !== $("setName")) $("setName").value = P.nombre;
  $("emojiGrid").innerHTML = EMOJIS.map(e => `<button data-em="${e}" class="${e === P.emoji ? "on" : ""}" aria-label="${e}">${e}</button>`).join("");
  $("swatches").innerHTML = Object.entries(PALETAS).map(([k,v]) => `<button class="sw ${k === P.color ? "on" : ""}" data-col="${k}" style="background:linear-gradient(135deg,${v[0]},${v[1]})">${v[2]}</button>`).join("");
  $("darkSw").classList.toggle("on", !!P.oscuro); $("darkSw").setAttribute("aria-checked", !!P.oscuro);
  $("xlSub").textContent = `${S.movs.length === 1 ? "1 movimiento" : S.movs.length + " movimientos"} · resumen y gráficas`;
  pintarCopias();
  pintarAdmin();
  $("foot").textContent = (REMOTO ? "☁️ Tus datos se guardan en la nube y se sincronizan entre móviles" : "🧪 Modo prueba: datos guardados solo en este móvil") + ` · versión ${VERSION}`;
  if (REMOTO) Store.ultimaCopia().then(t => {
    if (!t || view !== "set") return;
    const d = new Date(t), hoy = ymd(new Date()), cuando = ymd(d) === hoy ? "hoy" : dayLabel(ymd(d)).toLowerCase();
    $("foot").innerHTML = `☁️ Tus datos se guardan en la nube y se sincronizan entre móviles · versión ${VERSION}<br>🛡️ Copia de seguridad automática cada noche a las 00:00 · última: ${esc(cuando)} a las ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }).catch(() => {});
}
let copiasCache = null;
async function pintarCopias(){
  const box = $("copias");
  if (!REMOTO){ box.innerHTML = `<div class="empty">🧪 Las copias nocturnas funcionan cuando la app está conectada a la nube.</div>`; return; }
  if (!copiasCache || copiasCache.id !== S.id) box.innerHTML = `<div class="empty"><span class="spin"></span></div>`;
  try {
    const r = await Store.misCopias(S.id, S.pin);
    if (!r.ok) throw new Error(r.error);
    copiasCache = { id:S.id, lista:r.copias || [] };
  } catch(e){ if (!copiasCache){ box.innerHTML = `<div class="empty">No se pueden cargar las copias ahora mismo.</div>`; return; } }
  if (!S || view !== "set") return;
  const l = copiasCache.lista;
  box.innerHTML = l.length ? l.slice(0,30).map(c => {
    const d = new Date(Number(c.hecha)), dia = ymd(d);
    const t = dia === ymd(new Date()) ? "Hoy" : dayLabel(dia).replace(/^./, x => x.toUpperCase());
    return `<div class="copia"><div class="ci">🛡️</div><div class="cm"><b>${esc(t)}</b><span>${pad(d.getHours())}:${pad(d.getMinutes())} · ${Number(c.n) === 1 ? "1 movimiento" : (Number(c.n) || 0) + " movimientos"}</span></div>
      <button data-copia="${esc(c.id)}">📗 Excel</button></div>`;
  }).join("") : `<div class="empty">La primera copia se hará esta noche a las 00:00 🌙</div>`;
}
$("copias").addEventListener("click", async e => {
  const b = e.target.closest("[data-copia]"); if (!b) return;
  b.disabled = true; const txt = b.textContent; b.innerHTML = '<span class="spin"></span>';
  try {
    const r = await Store.copiaExcel(S.id, S.pin, Number(b.dataset.copia));
    if (!r.ok) throw new Error(r.error);
    const d = new Date(Number(r.hecha));
    const blob = await crearExcel((r.movs || []).map(limpiar), d);
    await entregarExcel(blob, `Ahorraulin - ${S.perfil.nombre} - copia ${ymd(d)}.xlsx`);
  } catch(err){ toast(err.message === "NOZIP" ? "⚠️ Falta conexión para preparar el Excel" : "⚠️ No se ha podido descargar la copia"); }
  b.disabled = false; b.textContent = txt;
});
async function pintarAdmin(){
  const card = $("adminCard");
  card.classList.toggle("hidden", S.id !== ADMIN);
  if (S.id !== ADMIN) return;
  const box = $("adminList");
  try {
    const r = await Store.adminEstado(S.pin);
    if (!r.ok) throw new Error(r.error);
    if (!S || view !== "set") return;
    box.innerHTML = r.perfiles.map(p => `<div class="copia adm"><div class="ci" style="background:var(--soft)">${esc(p.emoji)}</div>
      <div class="cm"><b>${esc(p.nombre)}</b><span>${p.bloqueado ? "🔒 Bloqueado por intentos fallidos" : p.tiene_pin ? "Tiene código" : "Sin código: lo creará al entrar"}</span></div>
      ${p.tiene_pin ? `<button class="reset" data-reset="${esc(p.id)}" data-nombre="${esc(p.nombre)}">Restablecer</button>` : ""}</div>`).join("");
  } catch(e){ box.innerHTML = `<div class="empty">No se puede cargar ahora mismo.</div>`; }
}
$("adminList").addEventListener("click", async e => {
  const b = e.target.closest("[data-reset]"); if (!b) return;
  if (!b.classList.contains("sure")){
    b.classList.add("sure"); b.textContent = "¿Seguro?"; vibrar();
    setTimeout(() => { if (b.isConnected){ b.classList.remove("sure"); b.textContent = "Restablecer"; } }, 3000); return;
  }
  b.disabled = true; b.innerHTML = '<span class="spin"></span>';
  try {
    const r = await Store.adminResetear(S.pin, b.dataset.reset);
    if (!r.ok) throw new Error(r.error);
    toast(`👑 Código de ${b.dataset.nombre} restablecido. Creará uno nuevo al entrar.`);
  } catch(err){ toast("⚠️ No se ha podido restablecer"); }
  pintarAdmin();
});
let ajustesT;
async function guardarAjustes(cambios, inmediato){
  Object.assign(S.perfil, cambios);
  aplicarTema(S.perfil.color, S.perfil.oscuro); pintarCabecera(); pintarAjustes();
  clearTimeout(ajustesT);
  ajustesT = setTimeout(async () => {
    try {
      const r = await Store.guardarAjustes(S.id, S.pin, S.perfil);
      if (!r.ok) throw new Error(r.error);
      toast("✓ Guardado");
    } catch(err){ toast("⚠️ No se han guardado los ajustes. Revisa la conexión."); }
  }, inmediato ? 50 : 700);
}
$("emojiGrid").addEventListener("click", e => { const b = e.target.closest("[data-em]"); if (b){ vibrar(); guardarAjustes({emoji:b.dataset.em}, true); } });
$("swatches").addEventListener("click", e => { const b = e.target.closest("[data-col]"); if (b){ vibrar(); guardarAjustes({color:b.dataset.col}, true); } });
$("darkSw").onclick = () => { vibrar(); guardarAjustes({oscuro:!S.perfil.oscuro}, true); };
$("setName").addEventListener("input", e => { const v = e.target.value.trim(); if (v) guardarAjustes({nombre:v.slice(0,20)}); });
$("chPin").onclick = () => { pinState = { id:S.id, nombre:S.perfil.nombre, emoji:S.perfil.emoji, mode:"change", buf:"" }; pintarPin(); show("pin"); };

/* =====================================================================
   EXCEL
   ===================================================================== */
async function crearExcel(movs, generado){
  return crearExcelAhorraulin({ nombre:S.perfil.nombre, movs:(movs || S.movs), catOf, generado });
}
async function entregarExcel(blob, nombre){
  const file = new File([blob], nombre, { type: blob.type });
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios && navigator.canShare && navigator.canShare({ files:[file] })){
    try { await navigator.share({ files:[file], title:nombre }); } catch(e){ if (e.name !== "AbortError") throw e; }
  } else {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("📗 Excel descargado");
  }
}
$("xlBtn").onclick = async () => {
  const btn = $("xlBtn"); btn.disabled = true; $("xlSub").innerHTML = '<span class="spin"></span> Preparando tu Excel…';
  try {
    const blob = await crearExcel();
    await entregarExcel(blob, `Ahorraulin - ${S.perfil.nombre} ${ymd(new Date())}.xlsx`);
  } catch(err){ toast(err.message === "NOZIP" ? "⚠️ Falta conexión para preparar el Excel" : "⚠️ No se ha podido crear el Excel"); }
  btn.disabled = false; pintarAjustes();
};

/* =====================================================================
   NAVEGACIÓN
   ===================================================================== */
document.querySelector("nav").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  vibrar(); view = b.dataset.v;
  document.querySelectorAll("nav button").forEach(x => x.classList.toggle("on", x === b));
  window.scrollTo({top:0}); pintarTodo();
});
document.querySelectorAll(".mPrev").forEach(b => b.onclick = () => { viewMonth = shiftMonth(viewMonth,-1); pintarTodo(); });
document.querySelectorAll(".mNext").forEach(b => b.onclick = () => { viewMonth = shiftMonth(viewMonth, 1); pintarTodo(); });

function pintarTodo(){
  if (!S) return;
  ["add","list","charts","save","set"].forEach(v => $("v-"+v).classList.toggle("hidden", v !== view));
  $("balance").classList.toggle("hidden", view === "set");
  document.querySelectorAll(".mName").forEach(x => x.textContent = monthName(viewMonth));
  pintarBalance();
  if (view === "add") pintarApuntar();
  if (view === "list") pintarLista();
  if (view === "charts") pintarGraficas();
  if (view === "save") pintarAhorro();
  if (view === "set") pintarAjustes();
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */
show("menu");
cargarMenu();
if ("serviceWorker" in navigator && location.protocol === "https:"){
  let recargando = false;
  const habia = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Hay versión nueva: recarga sola, pero sin cortar a nadie que esté apuntando
    if (!habia || recargando) return;
    const recargar = () => { if (recargando) return; recargando = true; location.reload(); };
    if (!S && !entry) recargar();
    else { banner("✨ Hay una versión nueva de Ahorraulin. Se pondrá sola la próxima vez que la abras."); window.__actualizar = recargar; }
  });
  navigator.serviceWorker.register("sw.js").then(reg => {
    document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}
