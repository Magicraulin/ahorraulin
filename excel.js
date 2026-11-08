/* =====================================================================
   AHORRAULIN · Generador del Excel
   Crea un .xlsx con TODO ya calculado (se ve bien en Excel, Numbers,
   Google Sheets y la vista rápida del Mac/iPhone), con el color y el
   emoticono de cada perfil:
     · Resumen: tarjetas, todos los meses, gráfica y categorías
     · Una pestaña por mes: tarjetas, gastos comparados con el mes
       anterior, ahorro e inversión aparte, ingresos, gráfica y movimientos
     · Todos los movimientos
   ===================================================================== */
(function (root) {
  "use strict";

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const VERDE = "1A9E6F", AMBAR = "E8A33D", ROJO = "D6455A", TINTA = "1F1A2E", GRIS = "8F8B83";
  const GUARDADO = ["ahorro", "inversion"];

  /* ---------- utilidades ---------- */
  const x = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))
                                 .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const colL = n => { let s = ""; n++; while (n > 0){ const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const ref = (c, r) => colL(c) + (r + 1);
  const serial = f => { const [y,m,d] = f.split("-").map(Number); return Date.UTC(y, m - 1, d) / 86400000 + 25569; };
  const r2 = n => Math.round(n * 100) / 100;
  const hex = h => String(h || "6250D6").replace("#", "").toUpperCase().slice(0, 6);
  const tinte = (h, t) => { const n = parseInt(h, 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * t));
                            return c.map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase(); };

  /* ---------- estilos (dependen del color del perfil) ---------- */
  const S = { normal:0, banda:1, cab:2, fecha:3, eur:4, eurB:5, sub:6, cabVer:7, cabAmb:8, txtB:9, eurVer:10, eurCol:11, pct:12, eurRojo:13,
              tLab:14, tEur:15, tPct:16, sube:17, baja:18, igual:19, tEurRojo:20, eurAmb:21, seccion:22, fechaCorta:23, tEurVer:24, tEurAmb:25 };
  function estilos(C){
    const T = tinte(C, 0.88);
    const fonts = [
      `<font><sz val="11"/><color rgb="FF${TINTA}"/><name val="Arial"/></font>`,                 //0
      `<font><b/><sz val="20"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>`,               //1
      `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>`,               //2
      `<font><i/><sz val="10"/><color rgb="FF${GRIS}"/><name val="Arial"/></font>`,              //3
      `<font><b/><sz val="11"/><color rgb="FF${TINTA}"/><name val="Arial"/></font>`,             //4
      `<font><b/><sz val="11"/><color rgb="FF${VERDE}"/><name val="Arial"/></font>`,             //5
      `<font><b/><sz val="11"/><color rgb="FF${C}"/><name val="Arial"/></font>`,                 //6
      `<font><b/><sz val="11"/><color rgb="FF${ROJO}"/><name val="Arial"/></font>`,              //7
      `<font><b/><sz val="9"/><color rgb="FF5B5670"/><name val="Arial"/></font>`,                //8
      `<font><b/><sz val="17"/><color rgb="FF${TINTA}"/><name val="Arial"/></font>`,             //9
      `<font><b/><sz val="17"/><color rgb="FF${ROJO}"/><name val="Arial"/></font>`,              //10
      `<font><b/><sz val="11"/><color rgb="FF${AMBAR}"/><name val="Arial"/></font>`,             //11
      `<font><b/><sz val="13"/><color rgb="FF${C}"/><name val="Arial"/></font>`,                 //12
      `<font><b/><sz val="10"/><color rgb="FF${GRIS}"/><name val="Arial"/></font>`,              //13
      `<font><b/><sz val="17"/><color rgb="FF${VERDE}"/><name val="Arial"/></font>`,             //14
      `<font><b/><sz val="17"/><color rgb="FF${AMBAR}"/><name val="Arial"/></font>`,             //15
    ];
    const fills = [`<fill><patternFill patternType="none"/></fill>`, `<fill><patternFill patternType="gray125"/></fill>`,
      ...[C, VERDE, AMBAR, T].map(c => `<fill><patternFill patternType="solid"><fgColor rgb="FF${c}"/><bgColor indexed="64"/></patternFill></fill>`)];
    // fills: 2 perfil, 3 verde, 4 ámbar, 5 tinte
    const borders = `<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FFEAE6EF"/></bottom><diagonal/></border>
<border><left style="medium"><color rgb="FFFFFFFF"/></left><right style="medium"><color rgb="FFFFFFFF"/></right><top/><bottom/><diagonal/></border></borders>`;
    const xf = (num, font, fill, border, al) => `<xf numFmtId="${num}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"${al ? ` applyAlignment="1"><alignment ${al}/></xf>` : "/>"}`;
    const V = 'vertical="center"', VC = 'horizontal="center" vertical="center"';
    const xfs = [
      xf(0,0,0,1,V),        //0 normal
      xf(0,1,2,0,'vertical="center" indent="1"'), //1 banda
      xf(0,2,2,0,V),        //2 cabecera color perfil
      xf(165,0,0,1,'horizontal="left" vertical="center"'), //3 fecha
      xf(164,0,0,1,V),      //4 €
      xf(164,4,0,1,V),      //5 € negrita
      xf(0,3,0,0),          //6 subtítulo
      xf(0,2,3,0,V),        //7 cabecera verde
      xf(0,2,4,0,V),        //8 cabecera ámbar
      xf(0,4,0,1,V),        //9 texto negrita
      xf(164,5,0,1,V),      //10 € verde
      xf(164,6,0,1,V),      //11 € color perfil
      xf(166,0,0,1,V),      //12 %
      xf(164,7,0,1,V),      //13 € rojo
      xf(0,8,5,2,'horizontal="center" vertical="bottom"'),   //14 etiqueta tarjeta
      xf(167,9,5,2,VC),     //15 valor tarjeta €
      xf(166,9,5,2,VC),     //16 valor tarjeta %
      xf(0,7,0,1,'horizontal="center" vertical="center"'),   //17 sube (rojo)
      xf(0,5,0,1,'horizontal="center" vertical="center"'),   //18 baja (verde)
      xf(0,13,0,1,'horizontal="center" vertical="center"'),  //19 igual (gris)
      xf(167,10,5,2,VC),    //20 valor tarjeta € rojo
      xf(164,11,0,1,V),     //21 € ámbar
      xf(0,12,0,0,'vertical="bottom"'),                     //22 sección
      xf(168,0,0,1,'horizontal="left" vertical="center"'),  //23 fecha corta
      xf(167,14,5,2,VC),    //24 valor tarjeta € verde
      xf(167,15,5,2,VC),    //25 valor tarjeta € ámbar
    ];
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="5"><numFmt numFmtId="164" formatCode="#,##0.00\\ &quot;€&quot;"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="0%"/><numFmt numFmtId="167" formatCode="#,##0\\ &quot;€&quot;"/><numFmt numFmtId="168" formatCode="dd/mm"/></numFmts>
<fonts count="${fonts.length}">${fonts.join("")}</fonts><fills count="${fills.length}">${fills.join("")}</fills>${borders}
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${xfs.length}">${xfs.join("")}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }

  /* ---------- una hoja ---------- */
  class Hoja {
    constructor(nombre){ this.nombre = nombre; this.filas = {}; this.anchos = []; this.alturas = {}; this.graficos = []; this.filtro = null; this.congelar = 0; this.uniones = []; }
    set(c, r, v, s){ (this.filas[r] = this.filas[r] || {})[c] = { v, s }; }
    txt(c, r, v, s){ this.set(c, r, { t:"s", v:String(v ?? "") }, s ?? S.normal); }
    num(c, r, v, s){ this.set(c, r, { t:"n", v:Number.isFinite(v) ? Math.round(v * 1000) / 1000 : 0 }, s ?? S.eur); }
    fecha(c, r, f, s){ this.set(c, r, { t:"n", v:serial(f) }, s ?? S.fecha); }
    unir(c0, r0, c1, r1){ this.uniones.push(`${ref(c0,r0)}:${ref(c1,r1)}`); }
    vacia(c, r, s){ this.set(c, r, { t:"s", v:"" }, s); }
    xml(){
      const rows = Object.keys(this.filas).map(Number).sort((a,b) => a - b).map(r => {
        const cells = Object.keys(this.filas[r]).map(Number).sort((a,b) => a - b).map(c => {
          const { v, s } = this.filas[r][c];
          if (v.t === "n") return `<c r="${ref(c,r)}" s="${s}"><v>${v.v}</v></c>`;
          if (v.v === "") return `<c r="${ref(c,r)}" s="${s}"/>`;
          return `<c r="${ref(c,r)}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${x(v.v)}</t></is></c>`;
        }).join("");
        const h = this.alturas[r] ? ` ht="${this.alturas[r]}" customHeight="1"` : "";
        return `<row r="${r + 1}"${h}>${cells}</row>`;
      }).join("");
      const cols = this.anchos.length ? `<cols>${this.anchos.map((w,i) => `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("")}</cols>` : "";
      const pane = this.congelar ? `<pane ySplit="${this.congelar}" topLeftCell="A${this.congelar + 1}" activePane="bottomLeft" state="frozen"/>` : "";
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView workbookViewId="0" showGridLines="0" zoomScale="110" zoomScaleNormal="110">${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18" customHeight="1"/>${cols}<sheetData>${rows}</sheetData>${this.filtro ? `<autoFilter ref="${this.filtro}"/>` : ""}${this.uniones.length ? `<mergeCells count="${this.uniones.length}">${this.uniones.map(u => `<mergeCell ref="${u}"/>`).join("")}</mergeCells>` : ""}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>${this.graficos.length ? `<drawing r:id="rId1"/>` : ""}</worksheet>`;
    }
  }

  /* ---------- gráficos con los datos ya dentro ---------- */
  function graficoXML(g, hoja){
    const q = `'${hoja.replace(/'/g, "''")}'`;
    const rng = (c, r0, r1) => `${q}!$${colL(c)}$${r0 + 1}:$${colL(c)}$${r1 + 1}`;
    const n = g.cats.length, horiz = g.tipo === "bar";
    const strCache = `<c:strCache><c:ptCount val="${n}"/>${g.cats.map((v,i) => `<c:pt idx="${i}"><c:v>${x(v)}</c:v></c:pt>`).join("")}</c:strCache>`;
    const series = g.series.map((s, k) => `<c:ser><c:idx val="${k}"/><c:order val="${k}"/><c:tx><c:v>${x(s.nombre)}</c:v></c:tx>
<c:spPr><a:solidFill><a:srgbClr val="${s.color}"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>
<c:cat><c:strRef><c:f>${rng(g.catCol, g.r0, g.r0 + n - 1)}</c:f>${strCache}</c:strRef></c:cat>
<c:val><c:numRef><c:f>${rng(s.col, g.r0, g.r0 + n - 1)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${n}"/>${s.vals.map((v,i) => `<c:pt idx="${i}"><c:v>${r2(v)}</c:v></c:pt>`).join("")}</c:numCache></c:numRef></c:val></c:ser>`).join("");
    const txtPr = `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"><a:solidFill><a:srgbClr val="5B5670"/></a:solidFill><a:latin typeface="Arial"/></a:defRPr></a:pPr><a:endParaRPr lang="es-ES"/></a:p></c:txPr>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:roundedCorners val="0"/><c:chart>
<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200" b="1"/></a:pPr><a:r><a:rPr lang="es-ES" sz="1200" b="1"><a:solidFill><a:srgbClr val="${TINTA}"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>${x(g.titulo)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>
<c:barChart><c:barDir val="${horiz ? "bar" : "col"}"/><c:grouping val="clustered"/><c:varyColors val="0"/>${series}
<c:gapWidth val="${horiz ? 50 : 70}"/><c:axId val="111"/><c:axId val="222"/></c:barChart>
<c:catAx><c:axId val="111"/><c:scaling><c:orientation val="${horiz ? "maxMin" : "minMax"}"/></c:scaling><c:delete val="0"/><c:axPos val="${horiz ? "l" : "b"}"/>
<c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:solidFill><a:srgbClr val="EAE6EF"/></a:solidFill></a:ln></c:spPr>${txtPr}<c:crossAx val="222"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>
<c:valAx><c:axId val="222"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${horiz ? "b" : "l"}"/>
<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="EAE6EF"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>
<c:numFmt formatCode="#,##0&quot; €&quot;" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${txtPr}<c:crossAx val="111"/><c:crosses val="${horiz ? "max" : "autoZero"}"/><c:crossBetween val="between"/></c:valAx>
<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:plotArea>${g.series.length > 1 ? `<c:legend><c:legendPos val="b"/><c:overlay val="0"/>${txtPr}</c:legend>` : ""}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="EAE6EF"/></a:solidFill></a:ln></c:spPr></c:chartSpace>`;
  }
  function dibujoXML(graficos){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
${graficos.map((g,i) => `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${g.pos[0]}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${g.pos[1]}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:to><xdr:col>${g.pos[2]}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${g.pos[3]}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Gráfico ${i + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="rId${i + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`).join("")}
</xdr:wsDr>`;
  }

  /* ---------- piezas comunes ---------- */
  function banda(H, texto, sub, ancho){
    for (let c = 0; c < ancho; c++) H.vacia(c, 0, S.banda);
    H.txt(0, 0, texto, S.banda); H.unir(0, 0, ancho - 1, 0); H.alturas[0] = 38;
    H.txt(0, 1, sub, S.sub); H.alturas[1] = 20;
  }
  // 5 tarjetas en las columnas 0..4, filas r y r+1
  function tarjetas(H, r, d){
    const t = [["INGRESADO", d.i, S.tEurVer], ["GASTADO", d.g, S.tEur], ["AHORRADO", d.a, S.tEurAmb],
               ["TE QUEDA", d.i - d.g - d.a, d.i - d.g - d.a < 0 ? S.tEurRojo : S.tEur], ["% QUE AHORRAS", d.i ? (d.i - d.g) / d.i : 0, S.tPct]];
    t.forEach(([lab, v, s], c) => { H.txt(c, r, lab, S.tLab); H.num(c, r + 1, v, s); });
    H.alturas[r] = 22; H.alturas[r + 1] = 34;
  }
  function tendencia(H, c, r, v, antes){
    if (!antes){ H.txt(c, r, v ? "nuevo" : "—", S.igual); return; }
    const d = Math.round((v - antes) / antes * 100);
    if (Math.abs(d) < 3) H.txt(c, r, "= igual", S.igual);
    else H.txt(c, r, d > 0 ? `▲ +${d} %` : `▼ ${d} %`, d > 0 ? S.sube : S.baja);
  }

  /* ---------- construir el libro ---------- */
  async function crearExcel({ nombre, emoji, color, movs, catOf, generado, tipo }){
    const JSZip = root.JSZip; if (!JSZip) throw new Error("NOZIP");
    const C = hex(color), EM = emoji ? emoji + "  " : "";
    const lista = [...movs].sort((a,b) => a.fecha.localeCompare(b.fecha) || (a.creado || 0) - (b.creado || 0));
    const etiq = m => { const c = catOf(m); return `${c.e ? c.e + " " : ""}${c.n}`; };
    const esGuardado = m => m.tipo === "gasto" && GUARDADO.includes(m.cat);
    const esGasto = m => m.tipo === "gasto" && !GUARDADO.includes(m.cat);
    const suma = (l, f) => l.filter(f).reduce((s,m) => s + m.importe, 0);
    const datos = l => ({ i: suma(l, m => m.tipo === "ingreso"), g: suma(l, esGasto), a: suma(l, esGuardado) });
    const agrupar = (l, f) => { const o = {}; l.filter(f).forEach(m => { const k = etiq(m); o[k] = (o[k] || 0) + m.importe; }); return Object.entries(o).sort((a,b) => b[1] - a[1]); };
    const meses = [...new Set(lista.map(m => m.fecha.slice(0,7)))].sort();
    const nomMes = k => { const [y,m] = k.split("-").map(Number); return `${MESES[m-1]} ${y}`; };
    const mesAnt = k => { const [y,m] = k.split("-").map(Number); const d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
    const delMes = k => lista.filter(m => m.fecha.startsWith(k));
    const fechaTxt = (generado || new Date()).toLocaleDateString("es-ES", { day:"numeric", month:"long", year:"numeric" });
    const hojas = [];

    /* ===== RESUMEN ===== */
    const R = new Hoja("Resumen"); hojas.push(R);
    R.anchos = [24, 16, 16, 20, 16, 16, 3];
    banda(R, `${EM}Ahorraulin · ${nombre}`, `Tus cuentas hasta el ${fechaTxt} · todo lo apuntado en la app`, 6);
    R.txt(0, 3, "DESDE QUE EMPEZASTE", S.seccion); R.alturas[3] = 22;
    tarjetas(R, 4, datos(lista));
    let r = 8;
    R.txt(0, r, "Mes a mes", S.seccion); R.alturas[r] = 24; r++;
    ["Mes","Ingresos","Gastos","Ahorrado / invertido","Te queda","% que ahorras"].forEach((h,i) => R.txt(i, r, h, S.cab)); r++;
    const r0Meses = r;
    meses.forEach(k => {
      const d = datos(delMes(k)), queda = d.i - d.g - d.a;
      R.txt(0,r,nomMes(k),S.txtB); R.num(1,r,d.i,S.eurVer); R.num(2,r,d.g,S.eurCol); R.num(3,r,d.a,S.eurAmb);
      R.num(4,r,queda, queda < 0 ? S.eurRojo : S.eurB); R.num(5,r,d.i ? (d.i - d.g) / d.i : 0, S.pct); r++;
    });
    if (!meses.length){ R.txt(0,r,"Todavía no hay movimientos",S.sub); r++; }
    const dt = datos(lista);
    R.txt(0,r,"TOTAL",S.txtB); R.num(1,r,dt.i,S.eurVer); R.num(2,r,dt.g,S.eurCol); R.num(3,r,dt.a,S.eurAmb);
    R.num(4,r,dt.i - dt.g - dt.a, dt.i - dt.g - dt.a < 0 ? S.eurRojo : S.eurB); R.num(5,r,dt.i ? (dt.i - dt.g) / dt.i : 0, S.pct);
    if (meses.length) R.graficos.push({ tipo:"col", titulo:"Ingresos, gastos y ahorro por mes", catCol:0, r0:r0Meses, pos:[7, 3, 16, 22],
      cats:meses.map(nomMes), series:[
        { nombre:"Ingresos", col:1, color:VERDE, vals:meses.map(k => datos(delMes(k)).i) },
        { nombre:"Gastos", col:2, color:C, vals:meses.map(k => datos(delMes(k)).g) },
        { nombre:"Ahorrado / invertido", col:3, color:AMBAR, vals:meses.map(k => datos(delMes(k)).a) } ] });
    r += 3;
    R.txt(0, r, "En qué se te va el dinero (desde el principio)", S.seccion); R.alturas[r] = 24; r++;
    R.txt(0,r,"Categoría",S.cab); R.txt(1,r,"Total",S.cab); R.txt(2,r,"% del gasto",S.cab); r++;
    const cgT = agrupar(lista, esGasto);
    cgT.forEach(([c,v]) => { R.txt(0,r,c); R.num(1,r,v); R.num(2,r,dt.g ? v / dt.g : 0, S.pct); r++; });
    if (!cgT.length){ R.txt(0,r,"Sin gastos",S.sub); r++; }
    const caT = agrupar(lista, esGuardado);
    if (caT.length){
      r++; R.txt(0,r,"🐷 Ahorro e inversión",S.cabAmb); R.txt(1,r,"Total",S.cabAmb); R.vacia(2,r,S.cabAmb); r++;
      caT.forEach(([c,v]) => { R.txt(0,r,c); R.num(1,r,v,S.eurAmb); r++; });
    }

    /* ===== UNA PESTAÑA POR MES (la más reciente primero) ===== */
    [...meses].reverse().forEach(k => {
      const H = new Hoja(nomMes(k)); hojas.push(H);
      H.anchos = [26, 15, 14, 16, 15, 3, 26, 15];
      const l = delMes(k), d = datos(l), lAnt = delMes(mesAnt(k));
      banda(H, `${EM}${nomMes(k)} · ${nombre}`, `${l.length} movimientos · comparado con ${nomMes(mesAnt(k)).toLowerCase()}`, 8);
      tarjetas(H, 3, d);
      // Gastos con comparación
      let rg = 7;
      H.txt(0, rg, "Gastos por categoría", S.seccion); H.alturas[rg] = 24; rg++;
      ["Categoría","Este mes","% del gasto","Mes anterior","Cambio"].forEach((h,i) => H.txt(i, rg, h, S.cab)); rg++;
      const cg = agrupar(l, esGasto), antes = Object.fromEntries(agrupar(lAnt, esGasto));
      const r0Cat = rg;
      cg.forEach(([c,v]) => {
        H.txt(0,rg,c); H.num(1,rg,v,S.eurB); H.num(2,rg,d.g ? v / d.g : 0, S.pct);
        H.num(3,rg,antes[c] || 0); tendencia(H, 4, rg, v, antes[c] || 0); rg++;
      });
      if (!cg.length){ H.txt(0,rg,"Sin gastos este mes",S.sub); rg++; }
      // categorías que el mes pasado tenían gasto y este no
      Object.keys(antes).filter(c => !cg.some(e => e[0] === c)).forEach(c => {
        H.txt(0,rg,c); H.num(1,rg,0); H.num(2,rg,0,S.pct); H.num(3,rg,antes[c]); H.txt(4,rg,"▼ −100 %",S.baja); rg++;
      });
      const tg = datos(lAnt).g;
      H.txt(0,rg,"TOTAL GASTOS",S.txtB); H.num(1,rg,d.g,S.eurCol); H.vacia(2,rg,S.normal); H.num(3,rg,tg,S.eurB); tendencia(H, 4, rg, d.g, tg); rg++;

      // Columna derecha: ingresos y ahorro
      let ri = 7;
      H.txt(6, ri, "Ingresos", S.seccion); H.alturas[ri] = 24; ri++;
      H.txt(6,ri,"Categoría",S.cabVer); H.txt(7,ri,"€",S.cabVer); ri++;
      const ic = agrupar(l, m => m.tipo === "ingreso");
      ic.forEach(([c,v]) => { H.txt(6,ri,c); H.num(7,ri,v,S.eurVer); ri++; });
      if (!ic.length){ H.txt(6,ri,"Sin ingresos este mes",S.sub); ri++; }
      ri++;
      H.txt(6, ri, "Ahorro e inversión", S.seccion); H.alturas[ri] = 24; ri++;
      H.txt(6,ri,"Categoría",S.cabAmb); H.txt(7,ri,"€",S.cabAmb); ri++;
      const ac = agrupar(l, esGuardado);
      ac.forEach(([c,v]) => { H.txt(6,ri,c); H.num(7,ri,v,S.eurAmb); ri++; });
      if (!ac.length){ H.txt(6,ri,"Nada apartado este mes",S.sub); ri++; }

      // Movimientos
      let rm = Math.max(rg, ri) + 2;
      H.txt(0, rm, "Movimientos del mes", S.seccion); H.alturas[rm] = 24; rm++;
      ["Categoría","Importe","Día","Tipo","Nota"].forEach((h,c) => H.txt(c, rm, h, S.cab)); H.vacia(5,rm,S.cab); H.vacia(6,rm,S.cab); H.vacia(7,rm,S.cab); rm++;
      [...l].reverse().forEach(m => {
        const ing = m.tipo === "ingreso", guard = esGuardado(m);
        H.txt(0,rm,etiq(m)); H.num(1,rm, ing ? m.importe : -m.importe, ing ? S.eurVer : guard ? S.eurAmb : S.eur);
        H.fecha(2,rm,m.fecha,S.fechaCorta); H.txt(3,rm, ing ? "Ingreso" : guard ? "Ahorro" : "Gasto");
        H.txt(4,rm,(m.rec ? "🔁 " : "") + (m.nota || "")); rm++;
      });
      if (cg.length) H.graficos.push({ tipo:"bar", titulo:`¿En qué se te va el dinero? · ${nomMes(k)}`, catCol:0, r0:r0Cat, pos:[9, 2, 17, Math.max(20, 9 + cg.length * 2)],
        cats:cg.map(e => e[0]), series:[{ nombre:"Gastos", col:1, color:C, vals:cg.map(e => e[1]) }] });
    });

    /* ===== TODOS LOS MOVIMIENTOS ===== */
    const T = new Hoja("Todos los movimientos"); hojas.push(T);
    T.anchos = [13, 26, 11, 34, 15];
    ["Fecha","Categoría","Tipo","Nota","Importe"].forEach((h,c) => T.txt(c,0,h,S.cab)); T.alturas[0] = 24;
    lista.forEach((m,i) => {
      const rr = i + 1, ing = m.tipo === "ingreso", guard = esGuardado(m);
      T.fecha(0,rr,m.fecha); T.txt(1,rr,etiq(m)); T.txt(2,rr, ing ? "Ingreso" : guard ? "Ahorro" : "Gasto");
      T.txt(3,rr,(m.rec ? "🔁 " : "") + (m.nota || "")); T.num(4,rr, ing ? m.importe : -m.importe, ing ? S.eurVer : guard ? S.eurAmb : S.eur);
    });
    T.congelar = 1; T.filtro = `A1:E${Math.max(2, lista.length + 1)}`;

    /* ---------- empaquetar ---------- */
    const zip = new JSZip();
    let nGraf = 0, nDib = 0;
    const ctOver = [];
    hojas.forEach((h, idx) => {
      const n = idx + 1;
      zip.file(`xl/worksheets/sheet${n}.xml`, h.xml());
      ctOver.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
      if (h.graficos.length){
        nDib++;
        zip.file(`xl/worksheets/_rels/sheet${n}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${nDib}.xml"/></Relationships>`);
        zip.file(`xl/drawings/drawing${nDib}.xml`, dibujoXML(h.graficos));
        ctOver.push(`<Override PartName="/xl/drawings/drawing${nDib}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
        const rels = h.graficos.map((g,i) => {
          nGraf++;
          zip.file(`xl/charts/chart${nGraf}.xml`, graficoXML(g, h.nombre));
          ctOver.push(`<Override PartName="/xl/charts/chart${nGraf}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`);
          return `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${nGraf}.xml"/>`;
        }).join("");
        zip.file(`xl/drawings/_rels/drawing${nDib}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`);
      }
    });
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${ctOver.join("")}</Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
    zip.file("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Ahorraulin · ${x(nombre)}</dc:title><dc:creator>Ahorraulin</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0,19)}Z</dcterms:created></cp:coreProperties>`);
    zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>
${hojas.map((h,i) => `<sheet name="${x(h.nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="${hojas.length - 1}" hidden="1">'Todos los movimientos'!$A$1:$E$${Math.max(2, lista.length + 1)}</definedName></definedNames></workbook>`);
    zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${hojas.map((h,i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}
<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    zip.file("xl/styles.xml", estilos(C));
    return zip.generateAsync({ type: tipo || "blob", mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression:"DEFLATE" });
  }

  root.crearExcelAhorraulin = crearExcel;
})(typeof window !== "undefined" ? window : globalThis);
