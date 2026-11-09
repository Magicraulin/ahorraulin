/* =====================================================================
   AHORRAULIN · Tutorial para nuevos usuarios
   Una visita guiada que ilumina cada parte de la app con un globo.
   Sale sola la primera vez que entra alguien sin movimientos, y se
   puede repetir desde Ajustes → «📖 Ver el tutorial».
   ===================================================================== */
const PASOS_TUTO = [
  { e:"👋", t:"¡Bienvenid@ a Ahorraulin!", d:"Te enseño la app en un minuto. Es muy fácil, de verdad. Puedes saltarlo cuando quieras." },
  { sel:["#cats .cat:nth-child(1)","#cats .cat:nth-child(2)","#cats .cat:nth-child(3)"], vista:"add", e:"👆", t:"Apunta en dos toques", d:"Toca una categoría (por ejemplo ⛽ Gasolina), escribe cuánto ha sido y pulsa Guardar. ¡Listo!" },
  { sel:["#seg"], vista:"add", e:"💰", t:"¿Gasto o ingreso?", d:"Con este botón cambias a ingresos para apuntar lo que te entra: la nómina, unas clases, un bizum…" },
  { sel:["#balance"], vista:"add", e:"📊", t:"Lo que te queda", d:"Aquí ves de un vistazo lo que te queda este mes, lo que has gastado y lo que ha entrado." },
  { sel:["#ojoBtn"], vista:"add", e:"🙈", t:"Modo discreto", d:"¿En el metro o en una cola? Toca el mono para tapar o destapar tus cantidades." },
  { sel:["#rachaCard"], vista:"add", e:"🔥", t:"Tu racha", d:"Apunta cada día y suma días seguidos. Si un día no gastas nada, pulsa «Hoy nada» y no la pierdes." },
  { sel:["#v-list .month", "#list .row"], vista:"list", e:"📋", t:"Pestaña Lista", d:"Aquí están todos tus movimientos del mes. Cambia de mes con las flechas, toca uno para corregirlo o la ✕ para borrarlo." },
  { sel:["#byCat"], vista:"charts", e:"📊", t:"Pestaña Gráficas", d:"En qué se te va el dinero, día a día y comparado con los últimos meses. De un vistazo sabes dónde recortar." },
  { sel:["#saveBody .card"], vista:"save", e:"🐷", t:"Pestaña Ahorro", d:"Crea metas de ahorro (un viaje, un capricho…). Cuando apuntes algo en Ahorro, elige la meta y verás la barra crecer." },
  { sel:["#ideasBody .card"], vista:"ideas", e:"💡", t:"Pestaña Ideas", d:"Cómo vas este mes y trucos para gastar menos justo en lo que más gastas. También hay recetas baratas." },
  { sel:["#premiosBody .medallas"], vista:"premios", e:"🏆", t:"Pestaña Recompensas", d:"Gana medallas cada año y premios de verdad: una guía, un recetario, entradas de teatro… ¡y hasta un show de magia!" },
  { sel:["#presuFold"], vista:"set", e:"⚙️", t:"Pestaña Ajustes", d:"Pon límites de gasto al mes, activa el recordatorio diario, conecta tu hoja de Google y descarga tus copias de seguridad." },
  { sel:[".perfil-top"], vista:"perfil", e:"🎨", t:"Tu perfil", d:"Tocando tu emoticono o tu nombre de arriba llegas aquí: cambia tu foto, tu nombre y los colores de la app." },
  { e:"🎉", t:"¡Ya lo tienes!", d:"Empieza apuntando tu primer gasto de hoy. Si algún día lo necesitas, este tutorial está en Ajustes.", fin:"¡A apuntar! 💪" }
];
const kTuto = () => "ahorraulin_tuto_" + S.id;
// Para quien ya usaba la app: el tutorial sale una vez como «novedades» tras una actualización grande
const NOVEDADES = "3.9";
const kNov = () => "ahorraulin_novedades_" + S.id;
const PASO_NOVEDADES = { e:"✨", t:"¡Ahorraulin se ha actualizado!", d:"Hay un montón de cosas nuevas: recompensas con premios de verdad, rachas, modo discreto, resumen del mes… Te lo enseño todo en un minuto." };
let tuto = null;

function empezarTutorial(novedades){
  if (!S) return;
  if (typeof resumen !== "undefined" && resumen) cerrarResumen();
  $("valeModal").classList.remove("show");
  tuto = { i:0, novedades: !!novedades };
  $("tuto").classList.add("show");
  pasoTuto(0);
}
function terminarTutorial(confeti){
  if (!tuto) return;
  try { localStorage.setItem(kTuto(), "1"); localStorage.setItem(kNov(), NOVEDADES); } catch(e){}
  tuto = null; $("tuto").classList.remove("show");
  if (confeti) confetti();
  irA("add");
  if (valePendiente){ const v = valePendiente; valePendiente = null; setTimeout(() => { confetti(); abrirVale(v, true); }, 700); }
}
function rectDe(sels){
  const rs = sels.map(s => document.querySelector(s)).filter(el => el && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden")
    .map(el => el.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
  if (!rs.length) return null;
  const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top)), r = Math.max(...rs.map(r => r.right)), b = Math.max(...rs.map(r => r.bottom));
  return { left:l, top:t, width:r - l, height:b - t };
}
function pasoTuto(i){
  if (!tuto) return;
  tuto.i = Math.max(0, Math.min(PASOS_TUTO.length - 1, i));
  const p = tuto.i === 0 && tuto.novedades ? PASO_NOVEDADES : PASOS_TUTO[tuto.i];
  if (p.vista && view !== p.vista) irA(p.vista);
  const primero = p.sel && document.querySelector(p.sel[0]);
  if (primero && !primero.closest("nav") && primero.id !== "ojoBtn") primero.scrollIntoView({ block:"center", behavior:"instant" in document.documentElement.style ? "instant" : "auto" });
  $("tutoBurbuja").innerHTML = `
    <div class="tb-e">${p.e}</div>
    <b class="tb-t">${esc(p.t)}</b>
    <div class="tb-d">${esc(p.d)}</div>
    <div class="tb-puntos">${PASOS_TUTO.map((_, j) => `<i class="${j === tuto.i ? "on" : ""}"></i>`).join("")}</div>
    <div class="tb-btns">
      ${p.fin ? "" : `<button class="tb-saltar" id="tutoSaltar">Saltar</button>`}
      ${tuto.i > 0 && !p.fin ? `<button class="tb-atras" id="tutoAtras">‹ Atrás</button>` : ""}
      <button class="tb-sig" id="tutoSig">${p.fin || (tuto.i === 0 ? "¡Empezamos! ›" : "Siguiente ›")}</button>
    </div>`;
  requestAnimationFrame(() => colocarTuto());
  const b = $("tutoBurbuja"); b.classList.remove("entra"); void b.offsetWidth; b.classList.add("entra");
}
function colocarTuto(){
  if (!tuto) return;
  const p = PASOS_TUTO[tuto.i], foco = $("tutoFoco"), b = $("tutoBurbuja"), W = innerWidth, H = innerHeight;
  const r = p.sel ? rectDe(p.sel) : null;
  if (!r){
    foco.classList.add("centro"); foco.style.cssText = "";
    b.style.left = Math.max(12, (W - b.offsetWidth) / 2) + "px"; b.style.top = Math.max(20, (H - b.offsetHeight) / 2) + "px";
    b.classList.remove("arriba", "abajo"); return;
  }
  const m = 8;
  foco.classList.remove("centro");
  Object.assign(foco.style, { left:(r.left - m) + "px", top:(r.top - m) + "px", width:(r.width + m * 2) + "px", height:(r.height + m * 2) + "px" });
  const bw = Math.min(360, W - 24), bh = b.offsetHeight, debajo = r.top + r.height + m + 14, encima = r.top - m - 14 - bh;
  b.style.width = bw + "px";
  b.style.left = Math.max(12, Math.min(W - bw - 12, r.left + r.width / 2 - bw / 2)) + "px";
  if (debajo + bh < H - 10){ b.style.top = debajo + "px"; b.classList.add("abajo"); b.classList.remove("arriba"); }
  else { b.style.top = Math.max(10, encima) + "px"; b.classList.add("arriba"); b.classList.remove("abajo"); }
  const flecha = Math.max(20, Math.min(bw - 20, r.left + r.width / 2 - parseFloat(b.style.left)));
  b.style.setProperty("--flecha", flecha + "px");
}
addEventListener("resize", () => tuto && colocarTuto());
addEventListener("scroll", () => tuto && colocarTuto(), { passive:true });
$("tuto").addEventListener("click", e => {
  if (!tuto) return;
  if (e.target.closest("#tutoSaltar")){ terminarTutorial(false); toast("📖 Puedes ver el tutorial cuando quieras en Ajustes"); return; }
  if (e.target.closest("#tutoAtras")){ vibrar(); pasoTuto(tuto.i - 1); return; }
  if (e.target.closest("#tutoSig")){
    vibrar();
    if (tuto.i >= PASOS_TUTO.length - 1) terminarTutorial(true); else pasoTuto(tuto.i + 1);
  }
});
document.addEventListener("keydown", e => {
  if (!tuto) return;
  if (e.key === "Escape") terminarTutorial(false);
  if (e.key === "ArrowRight" || e.key === "Enter") tuto.i >= PASOS_TUTO.length - 1 ? terminarTutorial(true) : pasoTuto(tuto.i + 1);
  if (e.key === "ArrowLeft") pasoTuto(tuto.i - 1);
});
document.addEventListener("click", e => { if (e.target.closest("#verTutorial")){ vibrar(); empezarTutorial(); } });
// ¿Toca enseñarlo? A quien entra por primera vez sin nada apuntado (tutorial)
// o a Sara y Marta tras una actualización grande (novedades). Al administrador no.
function tutorialPendiente(){
  if (!S) return null;
  let visto = false, nov = ""; try { visto = localStorage.getItem(kTuto()) === "1"; nov = localStorage.getItem(kNov()) || ""; } catch(e){}
  if (!visto && !(S.movs || []).length) return "nuevo";
  if (S.id !== ADMIN && nov !== NOVEDADES) return "novedades";
  return null;
}
