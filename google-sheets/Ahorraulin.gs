/* =====================================================================
   AHORRAULIN · Hoja de Google que se actualiza sola
   ---------------------------------------------------------------------
   Pega este código en tu hoja: Extensiones → Apps Script.
   Luego recarga la hoja y usa el menú «💸 Ahorraulin».
   · Se actualiza sola cada noche a las 00:00 y cada vez que abres la hoja
   · Menú «💸 Ahorraulin → 🔄 Refrescar ahora» para actualizarla al momento
   Es siempre la MISMA hoja: no se crean archivos nuevos.
   ===================================================================== */

/** @OnlyCurrentDoc  ← solo puede tocar ESTA hoja, ninguna otra de tu Drive */

const SUPABASE_URL = "https://fbjwnfvmrfaqyvvproyv.supabase.co";
const SUPABASE_KEY = "sb_publishable_mI68ZSEPKber-LPoMai5Wg_Qq1YTs5G";   // clave pública de la app

const PERFILES = { "Raúl":"p1", "Sara":"p2", "Marta":"p3" };
const TIPO_PERFIL = { p1:"mago", p2:"profe", p3:"profe" };
const PALETAS = { violeta:"#6250d6", rosa:"#d6457a", azul:"#2a78d6", menta:"#13a383", naranja:"#e0622a", coral:"#e04f5f", turquesa:"#0f8fa8", noche:"#2d2a4a" };
const VERDE = "#1a9e6f", AMBAR = "#e8a33d", ROJO = "#d6455a", TINTA = "#1f1a2e", GRIS = "#8f8b83";
const GUARDADO = ["ahorro","inversion"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const EUR = '#,##0.00 "€"', EUR0 = '#,##0 "€"';

// Mismas categorías que la app
const CATS_GASTO = { gasolina:"⛽ Gasolina", comer:"🍔 Comer fuera", super:"🛒 Súper", casa:"🏠 Casa", transporte:"🚗 Coche y transporte",
  ocio:"🎉 Ocio", viajes:"✈️ Viajes", deporte:"🏓 Pádel", ropa:"👕 Ropa", salud:"💊 Salud", regalos:"🎁 Regalos", suscripciones:"📱 Suscripciones",
  belleza:"💅 Belleza", ahorro:"🐷 Ahorro", inversion:"📈 Inversión", otros:"✨ Otros gastos" };
const CATS_INGRESO = {
  mago:  { bolos:"🎩 Actuaciones", bodas:"💍 Bodas y eventos", teatro:"🎭 Teatro", sueldo:"💰 Sueldo", bizum:"💸 Bizum / me devuelven", ventas:"🏷️ Ventas", regalo:"🎁 Regalo", otros_in:"✨ Otros ingresos" },
  profe: { sueldo:"💰 Nómina", clases:"📚 Clases particulares", academia:"🏫 Academia / extraescolares", paga:"🎄 Paga extra", bizum:"💸 Bizum / me devuelven", regalo:"🎁 Regalo", ventas:"🏷️ Ventas", otros_in:"✨ Otros ingresos" }
};

/* ---------------- menú ---------------- */
function onOpen(){
  SpreadsheetApp.getUi().createMenu("💸 Ahorraulin")
    .addItem("🔄 Refrescar ahora", "refrescarAhora")
    .addSeparator()
    .addItem("🔑 Configurar mi perfil y código", "configurar")
    .addItem("❌ Desconectar esta hoja", "desconectar")
    .addToUi();
}

function configurar(){
  const ui = SpreadsheetApp.getUi();
  const r1 = ui.prompt("Ahorraulin · 1 de 2", "¿Quién eres? Escribe: Raúl, Sara o Marta", ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  const nombre = Object.keys(PERFILES).find(n => quitarTildes(n) === quitarTildes(r1.getResponseText()));
  if (!nombre){ ui.alert("No te encuentro. Escribe exactamente Raúl, Sara o Marta."); return; }
  const r2 = ui.prompt("Ahorraulin · 2 de 2", `Hola, ${nombre}. Escribe tu código de 4 números de la app:`, ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  const pin = r2.getResponseText().trim();
  const res = llamar("entrar", { p_id: PERFILES[nombre], p_pin: pin });
  if (!res.ok){ ui.alert(mensajeError(res.error)); return; }
  const props = PropertiesService.getDocumentProperties();
  props.setProperties({ perfil: PERFILES[nombre], pin: pin });
  SpreadsheetApp.getActive().setSpreadsheetTimeZone("Europe/Madrid");
  activarAutomatico();
  dibujar(res);
  ui.alert(`✅ ¡Listo, ${nombre}!\n\nTu hoja se actualizará sola cada noche a las 00:00 y cada vez que la abras.\nPara actualizarla al momento: menú «💸 Ahorraulin → 🔄 Refrescar ahora».`);
}

function desconectar(){
  PropertiesService.getDocumentProperties().deleteAllProperties();
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  SpreadsheetApp.getUi().alert("Hoja desconectada. Tus datos de la app no se han tocado.");
}

function activarAutomatico(){
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("refrescar").timeBased().atHour(0).nearMinute(5).everyDays(1).inTimezone("Europe/Madrid").create();
  ScriptApp.newTrigger("refrescar").forSpreadsheet(SpreadsheetApp.getActive()).onOpen().create();
}

/* ---------------- actualizar ---------------- */
function refrescarAhora(){
  const r = refrescar();
  if (r === true) SpreadsheetApp.getActive().toast("Hoja actualizada con todo lo de la app ✅", "Ahorraulin", 5);
  else SpreadsheetApp.getUi().alert(r);
}

function refrescar(){
  const props = PropertiesService.getDocumentProperties();
  const perfil = props.getProperty("perfil"), pin = props.getProperty("pin");
  if (!perfil || !pin) return "Primero configura tu perfil: menú «💸 Ahorraulin → 🔑 Configurar mi perfil y código».";
  let res;
  try { res = llamar("entrar", { p_id: perfil, p_pin: pin }); }
  catch(e){ return "No se ha podido conectar con la app. Inténtalo en un rato."; }
  if (!res.ok){
    // Si el código ya no vale, paramos para no gastar intentos
    if (res.error === "PIN_MAL" || res.error === "SIN_PIN"){ props.deleteProperty("pin"); }
    return mensajeError(res.error) + "\n\nVuelve a poner tu código en «💸 Ahorraulin → 🔑 Configurar mi perfil y código».";
  }
  dibujar(res);
  return true;
}

function llamar(fn, args){
  const resp = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/rpc/" + fn, {
    method: "post", contentType: "application/json", payload: JSON.stringify(args),
    headers: { apikey: SUPABASE_KEY }, muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) throw new Error("RED " + resp.getResponseCode());
  return JSON.parse(resp.getContentText());
}

function mensajeError(e){
  return ({ PIN_MAL:"❌ El código no es correcto.", BLOQUEADO:"⏳ Demasiados intentos. Espera 5 minutos.",
            SIN_PIN:"Ese perfil todavía no tiene código: créalo primero en la app." })[e] || "Algo ha fallado: " + e;
}
function quitarTildes(s){ return String(s).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

/* =====================================================================
   DIBUJAR LA HOJA (mismo diseño que el Excel de la app)
   ===================================================================== */
function dibujar(res){
  const ss = SpreadsheetApp.getActive();
  const P = res.perfil, C = PALETAS[P.color] || PALETAS.violeta, tipo = TIPO_PERFIL[P.id] || "profe";
  const T = tinte(C, 0.88);
  const etiq = m => (m.tipo === "ingreso" ? CATS_INGRESO[tipo][m.cat] : CATS_GASTO[m.cat]) || (m.tipo === "ingreso" ? "✨ Otros ingresos" : "✨ Otros gastos");
  const movs = (res.movs || []).map(m => ({ tipo:m.tipo, cat:m.cat, importe:Number(m.importe) || 0, fecha:String(m.fecha).slice(0,10), nota:m.nota || "", rec:!!m.rec }))
                               .sort((a,b) => a.fecha.localeCompare(b.fecha));
  const esGuardado = m => m.tipo === "gasto" && GUARDADO.indexOf(m.cat) >= 0;
  const esGasto = m => m.tipo === "gasto" && GUARDADO.indexOf(m.cat) < 0;
  const suma = (l, f) => l.filter(f).reduce((s,m) => s + m.importe, 0);
  const datos = l => ({ i: suma(l, m => m.tipo === "ingreso"), g: suma(l, esGasto), a: suma(l, esGuardado) });
  const agrupar = (l, f) => { const o = {}; l.filter(f).forEach(m => { const k = etiq(m); o[k] = (o[k] || 0) + m.importe; }); return Object.keys(o).map(k => [k, o[k]]).sort((a,b) => b[1] - a[1]); };
  const meses = Array.from(new Set(movs.map(m => m.fecha.slice(0,7)))).sort();
  const nomMes = k => MESES[Number(k.slice(5,7)) - 1] + " " + k.slice(0,4);
  const mesAnt = k => { const y = Number(k.slice(0,4)), m = Number(k.slice(5,7)); const d = new Date(y, m - 2, 1); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2); };
  const delMes = k => movs.filter(m => m.fecha.indexOf(k) === 0);
  const fecha = f => { const p = f.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const ahora = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy 'a las' HH:mm");

  // La hoja se redibuja entera: hoja temporal para poder borrar las demás sin dejar el libro vacío
  const tmp = ss.getSheetByName("_ahorraulin_tmp") || ss.insertSheet("_ahorraulin_tmp");
  ss.getSheets().forEach(s => { if (s.getName() !== "_ahorraulin_tmp") ss.deleteSheet(s); });

  /* ---------- piezas ---------- */
  function hoja(nombre, anchos){
    const sh = ss.insertSheet(nombre, ss.getSheets().length);
    sh.setHiddenGridlines(true);
    anchos.forEach((w, i) => sh.setColumnWidth(i + 1, w));
    sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setFontFamily("Arial").setFontSize(10).setFontColor(TINTA).setVerticalAlignment("middle");
    return sh;
  }
  function banda(sh, texto, sub, ancho){
    sh.getRange(1, 1, 1, ancho).merge().setValue(texto).setBackground(C).setFontColor("#ffffff").setFontSize(18).setFontWeight("bold");
    sh.setRowHeight(1, 46);
    sh.getRange(2, 1).setValue(sub).setFontStyle("italic").setFontColor(GRIS);
  }
  function tarjetas(sh, fila, d){
    const queda = d.i - d.g - d.a;
    const t = [["INGRESADO", d.i, VERDE, EUR0], ["GASTADO", d.g, TINTA, EUR0], ["AHORRADO", d.a, AMBAR, EUR0],
               ["TE QUEDA", queda, queda < 0 ? ROJO : TINTA, EUR0], ["% QUE AHORRAS", d.i ? (d.i - d.g) / d.i : 0, TINTA, "0%"]];
    t.forEach((x, c) => {
      sh.getRange(fila, c + 1).setValue(x[0]).setBackground(T).setFontSize(8).setFontWeight("bold").setFontColor("#5b5670").setHorizontalAlignment("center").setVerticalAlignment("bottom");
      sh.getRange(fila + 1, c + 1).setValue(x[1]).setNumberFormat(x[3]).setBackground(T).setFontSize(16).setFontWeight("bold").setFontColor(x[2]).setHorizontalAlignment("center");
    });
    sh.getRange(fila, 1, 2, 5).setBorder(null, null, null, null, true, null, "#ffffff", SpreadsheetApp.BorderStyle.SOLID_THICK);
    sh.setRowHeight(fila, 24); sh.setRowHeight(fila + 1, 40);
  }
  function seccion(sh, fila, texto){ sh.getRange(fila, 1).setValue(texto).setFontSize(12).setFontWeight("bold").setFontColor(C); sh.setRowHeight(fila, 28); }
  function cabecera(sh, fila, col, titulos, color){
    sh.getRange(fila, col, 1, titulos.length).setValues([titulos]).setBackground(color || C).setFontColor("#ffffff").setFontWeight("bold");
  }
  function lineas(sh, fila, col, filas, cols){ if (filas > 0) sh.getRange(fila, col, filas, cols).setBorder(null, null, true, null, null, true, "#eae6ef", SpreadsheetApp.BorderStyle.SOLID); }
  function cambio(v, antes){
    if (!antes) return [v ? "nuevo" : "—", GRIS];
    const d = Math.round((v - antes) / antes * 100);
    if (Math.abs(d) < 3) return ["= igual", GRIS];
    return d > 0 ? ["▲ +" + d + " %", ROJO] : ["▼ " + d + " %", VERDE];
  }

  /* ===== RESUMEN ===== */
  const R = hoja("Resumen", [190, 120, 120, 150, 120, 120, 20]);
  banda(R, (P.emoji || "") + "  Ahorraulin · " + P.nombre, "Actualizada el " + ahora + " · se actualiza sola cada noche a las 00:00 y al abrirla", 6);
  seccion(R, 4, "DESDE QUE EMPEZASTE");
  tarjetas(R, 5, datos(movs));
  let f = 9;
  seccion(R, f, "Mes a mes"); f++;
  cabecera(R, f, 1, ["Mes","Ingresos","Gastos","Ahorrado / invertido","Te queda","% que ahorras"]); f++;
  const f0 = f;
  const filasMes = meses.map(k => { const d = datos(delMes(k)); return [nomMes(k), d.i, d.g, d.a, d.i - d.g - d.a, d.i ? (d.i - d.g) / d.i : 0]; });
  if (filasMes.length){
    R.getRange(f, 1, filasMes.length, 6).setValues(filasMes);
    R.getRange(f, 2, filasMes.length, 4).setNumberFormat(EUR); R.getRange(f, 6, filasMes.length, 1).setNumberFormat("0%");
    R.getRange(f, 1, filasMes.length, 1).setFontWeight("bold"); R.getRange(f, 2, filasMes.length, 1).setFontColor(VERDE).setFontWeight("bold");
    R.getRange(f, 3, filasMes.length, 1).setFontColor(C).setFontWeight("bold"); R.getRange(f, 4, filasMes.length, 1).setFontColor(AMBAR).setFontWeight("bold");
    lineas(R, f, 1, filasMes.length, 6); f += filasMes.length;
  } else { R.getRange(f, 1).setValue("Todavía no hay movimientos").setFontStyle("italic").setFontColor(GRIS); f++; }
  const dt = datos(movs);
  R.getRange(f, 1, 1, 6).setValues([["TOTAL", dt.i, dt.g, dt.a, dt.i - dt.g - dt.a, dt.i ? (dt.i - dt.g) / dt.i : 0]]).setFontWeight("bold");
  R.getRange(f, 2, 1, 4).setNumberFormat(EUR); R.getRange(f, 6).setNumberFormat("0%");
  if (filasMes.length){
    R.insertChart(R.newChart().asColumnChart().addRange(R.getRange(f0 - 1, 1, filasMes.length + 1, 4))
      .setNumHeaders(1).setPosition(4, 8, 0, 0).setOption("title", "Ingresos, gastos y ahorro por mes")
      .setOption("colors", [VERDE, C, AMBAR]).setOption("legend", { position: "bottom" }).setOption("width", 620).setOption("height", 340).build());
  }
  f += 3;
  seccion(R, f, "En qué se te va el dinero (desde el principio)"); f++;
  cabecera(R, f, 1, ["Categoría","Total","% del gasto"]); f++;
  const cgT = agrupar(movs, esGasto);
  if (cgT.length){
    R.getRange(f, 1, cgT.length, 3).setValues(cgT.map(x => [x[0], x[1], dt.g ? x[1] / dt.g : 0]));
    R.getRange(f, 2, cgT.length, 1).setNumberFormat(EUR); R.getRange(f, 3, cgT.length, 1).setNumberFormat("0%");
    lineas(R, f, 1, cgT.length, 3); f += cgT.length;
  }
  const caT = agrupar(movs, esGuardado);
  if (caT.length){
    f++; cabecera(R, f, 1, ["🐷 Ahorro e inversión","Total"], AMBAR); f++;
    R.getRange(f, 1, caT.length, 2).setValues(caT); R.getRange(f, 2, caT.length, 1).setNumberFormat(EUR).setFontColor(AMBAR).setFontWeight("bold");
    lineas(R, f, 1, caT.length, 2);
  }

  /* ===== UNA PESTAÑA POR MES ===== */
  meses.slice().reverse().forEach(k => {
    const H = hoja(nomMes(k), [190, 110, 100, 115, 100, 20, 190, 110]);
    const l = delMes(k), d = datos(l), lAnt = delMes(mesAnt(k));
    banda(H, (P.emoji || "") + "  " + nomMes(k) + " · " + P.nombre, l.length + " movimientos · comparado con " + nomMes(mesAnt(k)).toLowerCase(), 8);
    tarjetas(H, 4, d);
    let r = 8;
    seccion(H, r, "Gastos por categoría"); r++;
    cabecera(H, r, 1, ["Categoría","Este mes","% del gasto","Mes anterior","Cambio"]); r++;
    const cg = agrupar(l, esGasto), antes = {}; agrupar(lAnt, esGasto).forEach(x => antes[x[0]] = x[1]);
    const r0 = r;
    const filas = cg.map(x => [x[0], x[1], d.g ? x[1] / d.g : 0, antes[x[0]] || 0, cambio(x[1], antes[x[0]] || 0)]);
    Object.keys(antes).filter(c => !cg.some(x => x[0] === c)).forEach(c => filas.push([c, 0, 0, antes[c], ["▼ −100 %", VERDE]]));
    if (filas.length){
      H.getRange(r, 1, filas.length, 5).setValues(filas.map(x => [x[0], x[1], x[2], x[3], x[4][0]]));
      H.getRange(r, 2, filas.length, 1).setNumberFormat(EUR).setFontWeight("bold"); H.getRange(r, 3, filas.length, 1).setNumberFormat("0%");
      H.getRange(r, 4, filas.length, 1).setNumberFormat(EUR); H.getRange(r, 5, filas.length, 1).setHorizontalAlignment("center").setFontWeight("bold");
      H.getRange(r, 5, filas.length, 1).setFontColors(filas.map(x => [x[4][1]]));
      lineas(H, r, 1, filas.length, 5); r += filas.length;
    } else { H.getRange(r, 1).setValue("Sin gastos este mes").setFontStyle("italic").setFontColor(GRIS); r++; }
    const tg = datos(lAnt).g, ct = cambio(d.g, tg);
    H.getRange(r, 1, 1, 5).setValues([["TOTAL GASTOS", d.g, "", tg, ct[0]]]).setFontWeight("bold");
    H.getRange(r, 2).setNumberFormat(EUR).setFontColor(C); H.getRange(r, 4).setNumberFormat(EUR); H.getRange(r, 5).setFontColor(ct[1]).setHorizontalAlignment("center"); r++;

    let ri = 8;
    H.getRange(ri, 7).setValue("Ingresos").setFontSize(12).setFontWeight("bold").setFontColor(C); ri++;
    cabecera(H, ri, 7, ["Categoría","€"], VERDE); ri++;
    const ic = agrupar(l, m => m.tipo === "ingreso");
    if (ic.length){ H.getRange(ri, 7, ic.length, 2).setValues(ic); H.getRange(ri, 8, ic.length, 1).setNumberFormat(EUR).setFontColor(VERDE).setFontWeight("bold"); lineas(H, ri, 7, ic.length, 2); ri += ic.length; }
    else { H.getRange(ri, 7).setValue("Sin ingresos este mes").setFontStyle("italic").setFontColor(GRIS); ri++; }
    ri++;
    H.getRange(ri, 7).setValue("Ahorro e inversión").setFontSize(12).setFontWeight("bold").setFontColor(C); ri++;
    cabecera(H, ri, 7, ["Categoría","€"], AMBAR); ri++;
    const ac = agrupar(l, esGuardado);
    if (ac.length){ H.getRange(ri, 7, ac.length, 2).setValues(ac); H.getRange(ri, 8, ac.length, 1).setNumberFormat(EUR).setFontColor(AMBAR).setFontWeight("bold"); lineas(H, ri, 7, ac.length, 2); ri += ac.length; }
    else { H.getRange(ri, 7).setValue("Nada apartado este mes").setFontStyle("italic").setFontColor(GRIS); ri++; }

    let rm = Math.max(r, ri) + 2;
    H.getRange(rm, 1).setValue("Movimientos del mes").setFontSize(12).setFontWeight("bold").setFontColor(C); rm++;
    cabecera(H, rm, 1, ["Categoría","Importe","Día","Tipo","Nota"]); rm++;
    const mv = l.slice().reverse().map(m => [etiq(m), m.tipo === "ingreso" ? m.importe : -m.importe, fecha(m.fecha),
                                             m.tipo === "ingreso" ? "Ingreso" : esGuardado(m) ? "Ahorro" : "Gasto", (m.rec ? "🔁 " : "") + m.nota]);
    if (mv.length){
      H.getRange(rm, 1, mv.length, 5).setValues(mv);
      H.getRange(rm, 2, mv.length, 1).setNumberFormat(EUR).setFontColors(mv.map(x => [x[3] === "Ingreso" ? VERDE : x[3] === "Ahorro" ? AMBAR : TINTA]));
      H.getRange(rm, 3, mv.length, 1).setNumberFormat("dd/mm").setHorizontalAlignment("left");
      lineas(H, rm, 1, mv.length, 5);
    }
    if (cg.length){
      H.insertChart(H.newChart().asBarChart().addRange(H.getRange(r0, 1, cg.length, 2)).setNumHeaders(0)
        .setPosition(3, 10, 0, 0).setOption("title", "¿En qué se te va el dinero? · " + nomMes(k))
        .setOption("colors", [C]).setOption("legend", { position: "none" }).setOption("width", 560).setOption("height", Math.max(300, 60 + cg.length * 36)).build());
    }
  });

  /* ===== TODOS LOS MOVIMIENTOS ===== */
  const TM = hoja("Todos los movimientos", [100, 190, 90, 260, 110]);
  cabecera(TM, 1, 1, ["Fecha","Categoría","Tipo","Nota","Importe"]);
  if (movs.length){
    const filas = movs.map(m => [fecha(m.fecha), etiq(m), m.tipo === "ingreso" ? "Ingreso" : esGuardado(m) ? "Ahorro" : "Gasto", (m.rec ? "🔁 " : "") + m.nota, m.tipo === "ingreso" ? m.importe : -m.importe]);
    TM.getRange(2, 1, filas.length, 5).setValues(filas);
    TM.getRange(2, 1, filas.length, 1).setNumberFormat("dd/mm/yyyy").setHorizontalAlignment("left");
    TM.getRange(2, 5, filas.length, 1).setNumberFormat(EUR).setFontColors(filas.map(x => [x[2] === "Ingreso" ? VERDE : x[2] === "Ahorro" ? AMBAR : TINTA]));
    lineas(TM, 2, 1, filas.length, 5);
    TM.getRange(1, 1, filas.length + 1, 5).createFilter();
  }
  TM.setFrozenRows(1);

  ss.deleteSheet(tmp);
  ss.setActiveSheet(ss.getSheetByName("Resumen"));
  ss.moveActiveSheet(1);
}

function tinte(hex, t){
  const n = parseInt(hex.replace("#", ""), 16);
  return "#" + [n >> 16, (n >> 8) & 255, n & 255].map(v => ("0" + Math.round(v + (255 - v) * t).toString(16)).slice(-2)).join("");
}
