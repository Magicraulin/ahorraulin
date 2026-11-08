/* =====================================================================
   AHORRAULIN · Generador del Excel
   Crea un .xlsx con TODO ya calculado (se ve bien en Excel, Numbers,
   Google Sheets y la vista rápida del Mac/iPhone):
     · Resumen: todos los meses + gráfica + gastos por categoría
     · Una pestaña por mes: totales, categorías con gráfica y movimientos
     · Todos los movimientos
   ===================================================================== */
(function (root) {
  "use strict";

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const NARANJA = "EB6834", VERDE = "1A9E6F", OSCURO = "1F1A2E";

  /* ---------- utilidades XML ---------- */
  const x = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))
                                 .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const colL = n => { let s = ""; n++; while (n > 0){ const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const ref = (c, r) => colL(c) + (r + 1);
  const serial = f => { const [y,m,d] = f.split("-").map(Number); return Date.UTC(y, m - 1, d) / 86400000 + 25569; };
  const r2 = n => Math.round(n * 100) / 100;

  /* Estilos (índices de cellXfs) */
  const S = { normal:0, titulo:1, cab:2, fecha:3, eur:4, eurB:5, sub:6, cabNar:7, cabVer:8, txtB:9, eurVer:10, eurNar:11, pct:12, eurNeg:13 };
  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0.00\\ &quot;€&quot;"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="0%"/></numFmts>
<fonts count="8">
<font><sz val="11"/><name val="Arial"/></font>
<font><b/><sz val="18"/><color rgb="FF${OSCURO}"/><name val="Arial"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
<font><i/><sz val="10"/><color rgb="FF8F8B83"/><name val="Arial"/></font>
<font><b/><sz val="11"/><name val="Arial"/></font>
<font><b/><sz val="12"/><color rgb="FF${VERDE}"/><name val="Arial"/></font>
<font><b/><sz val="12"/><color rgb="FF${NARANJA}"/><name val="Arial"/></font>
<font><b/><sz val="12"/><color rgb="FFD6455A"/><name val="Arial"/></font>
</fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${OSCURO}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${NARANJA}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${VERDE}"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFE7E2D9"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="14">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="164" fontId="4" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="2" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
<xf numFmtId="164" fontId="5" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf numFmtId="164" fontId="6" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="164" fontId="7" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  /* ---------- una hoja ---------- */
  class Hoja {
    constructor(nombre){ this.nombre = nombre; this.filas = {}; this.anchos = []; this.alturas = {}; this.graficos = []; this.filtro = null; this.congelar = 0; }
    set(c, r, v, s){ (this.filas[r] = this.filas[r] || {})[c] = { v, s }; }
    txt(c, r, v, s){ this.set(c, r, { t:"s", v:String(v ?? "") }, s ?? S.normal); }
    num(c, r, v, s){ this.set(c, r, { t:"n", v:r2(Number(v) || 0) }, s ?? S.eur); }
    fecha(c, r, f){ this.set(c, r, { t:"n", v:serial(f) }, S.fecha); }
    xml(){
      const rows = Object.keys(this.filas).map(Number).sort((a,b) => a - b).map(r => {
        const cells = Object.keys(this.filas[r]).map(Number).sort((a,b) => a - b).map(c => {
          const { v, s } = this.filas[r][c];
          return v.t === "n" ? `<c r="${ref(c,r)}" s="${s}"><v>${v.v}</v></c>`
                             : `<c r="${ref(c,r)}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${x(v.v)}</t></is></c>`;
        }).join("");
        const h = this.alturas[r] ? ` ht="${this.alturas[r]}" customHeight="1"` : "";
        return `<row r="${r + 1}"${h}>${cells}</row>`;
      }).join("");
      const cols = this.anchos.length ? `<cols>${this.anchos.map((w,i) => `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("")}</cols>` : "";
      const pane = this.congelar ? `<pane ySplit="${this.congelar}" topLeftCell="A${this.congelar + 1}" activePane="bottomLeft" state="frozen"/>` : "";
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="16"/>${cols}<sheetData>${rows}</sheetData>${this.filtro ? `<autoFilter ref="${this.filtro}"/>` : ""}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>${this.graficos.length ? `<drawing r:id="rId1"/>` : ""}</worksheet>`;
    }
  }

  /* ---------- gráficos con los datos ya dentro (para que se vean sin recalcular) ---------- */
  function graficoXML(g, hoja){
    const q = `'${hoja.replace(/'/g, "''")}'`;
    const rng = (c, r0, r1) => `${q}!$${colL(c)}$${r0 + 1}:$${colL(c)}$${r1 + 1}`;
    const n = g.cats.length, horiz = g.tipo === "bar";
    const strCache = `<c:strCache><c:ptCount val="${n}"/>${g.cats.map((v,i) => `<c:pt idx="${i}"><c:v>${x(v)}</c:v></c:pt>`).join("")}</c:strCache>`;
    const series = g.series.map((s, k) => `<c:ser><c:idx val="${k}"/><c:order val="${k}"/><c:tx><c:v>${x(s.nombre)}</c:v></c:tx>
<c:spPr><a:solidFill><a:srgbClr val="${s.color}"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>
<c:cat><c:strRef><c:f>${rng(g.catCol, g.r0, g.r0 + n - 1)}</c:f>${strCache}</c:strRef></c:cat>
<c:val><c:numRef><c:f>${rng(s.col, g.r0, g.r0 + n - 1)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${n}"/>${s.vals.map((v,i) => `<c:pt idx="${i}"><c:v>${r2(v)}</c:v></c:pt>`).join("")}</c:numCache></c:numRef></c:val></c:ser>`).join("");
    const txtPr = `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"><a:latin typeface="Arial"/></a:defRPr></a:pPr><a:endParaRPr lang="es-ES"/></a:p></c:txPr>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:roundedCorners val="0"/><c:chart>
<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200" b="1"/></a:pPr><a:r><a:rPr lang="es-ES" sz="1200" b="1"><a:latin typeface="Arial"/></a:rPr><a:t>${x(g.titulo)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>
<c:barChart><c:barDir val="${horiz ? "bar" : "col"}"/><c:grouping val="clustered"/><c:varyColors val="0"/>${series}
<c:gapWidth val="60"/><c:axId val="111"/><c:axId val="222"/></c:barChart>
<c:catAx><c:axId val="111"/><c:scaling><c:orientation val="${horiz ? "maxMin" : "minMax"}"/></c:scaling><c:delete val="0"/><c:axPos val="${horiz ? "l" : "b"}"/>
<c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${txtPr}<c:crossAx val="222"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>
<c:valAx><c:axId val="222"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${horiz ? "b" : "l"}"/>
<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E7E2D9"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>
<c:numFmt formatCode="#,##0&quot; €&quot;" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${txtPr}<c:crossAx val="111"/><c:crosses val="${horiz ? "max" : "autoZero"}"/><c:crossBetween val="between"/></c:valAx>
</c:plotArea>${g.series.length > 1 ? `<c:legend><c:legendPos val="b"/><c:overlay val="0"/>${txtPr}</c:legend>` : ""}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr></c:chartSpace>`;
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

  /* ---------- construir el libro ---------- */
  async function crearExcel({ nombre, movs, catOf, generado, tipo }){
    const JSZip = root.JSZip; if (!JSZip) throw new Error("NOZIP");
    const lista = [...movs].sort((a,b) => a.fecha.localeCompare(b.fecha) || (a.creado || 0) - (b.creado || 0));
    const nomCat = m => catOf(m).n;
    const tot = (l,t) => l.filter(m => m.tipo === t).reduce((s,m) => s + m.importe, 0);
    const porCat = (l,t) => { const o = {}; l.filter(m => m.tipo === t).forEach(m => { const k = nomCat(m); o[k] = (o[k] || 0) + m.importe; }); return Object.entries(o).sort((a,b) => b[1] - a[1]); };
    const meses = [...new Set(lista.map(m => m.fecha.slice(0,7)))].sort();
    const nomMes = k => { const [y,m] = k.split("-").map(Number); return `${MESES[m-1]} ${y}`; };
    const fechaTxt = (generado || new Date()).toLocaleDateString("es-ES", { day:"numeric", month:"long", year:"numeric" });
    const hojas = [];

    /* RESUMEN */
    const R = new Hoja("Resumen"); hojas.push(R);
    R.anchos = [32, 15, 15, 15, 4, 12];
    R.txt(0,0, `Ahorraulin · ${nombre}`, S.titulo); R.alturas[0] = 28;
    R.txt(0,1, `Copia de tus cuentas · ${fechaTxt}`, S.sub);
    ["Mes","Ingresos","Gastos","Te queda"].forEach((h,i) => R.txt(i,3,h,S.cab));
    let r = 4;
    meses.forEach(k => {
      const l = lista.filter(m => m.fecha.startsWith(k)), i = tot(l,"ingreso"), g = tot(l,"gasto");
      R.txt(0,r,nomMes(k),S.txtB); R.num(1,r,i); R.num(2,r,g); R.num(3,r,i-g, i-g < 0 ? S.eurNeg : S.eurB); r++;
    });
    if (!meses.length){ R.txt(0,r,"Todavía no hay movimientos",S.sub); r++; }
    const tI = tot(lista,"ingreso"), tG = tot(lista,"gasto");
    R.txt(0,r,"TOTAL",S.txtB); R.num(1,r,tI,S.eurVer); R.num(2,r,tG,S.eurNar); R.num(3,r,tI-tG, tI-tG < 0 ? S.eurNeg : S.eurB);
    const finMeses = r;
    if (meses.length) R.graficos.push({ tipo:"col", titulo:"Ingresos y gastos por mes", catCol:0, r0:4, pos:[5,1,15,20],
      cats:meses.map(nomMes), series:[
        { nombre:"Gastos", col:2, color:NARANJA, vals:meses.map(k => tot(lista.filter(m => m.fecha.startsWith(k)),"gasto")) },
        { nombre:"Ingresos", col:1, color:VERDE, vals:meses.map(k => tot(lista.filter(m => m.fecha.startsWith(k)),"ingreso")) } ] });
    r = finMeses + 3;
    R.txt(0,r,"En qué se te va el dinero (todos los meses)",S.cabNar); R.txt(1,r,"€",S.cabNar); R.txt(2,r,"%",S.cabNar); r++;
    const cg = porCat(lista,"gasto");
    cg.forEach(([c,v]) => { R.txt(0,r,c); R.num(1,r,v); R.set(2,r,{t:"n",v:tG ? Math.round(v/tG*1000)/1000 : 0},S.pct); r++; });
    if (!cg.length){ R.txt(0,r,"Sin gastos",S.sub); r++; }

    /* UNA PESTAÑA POR MES (la más reciente primero) */
    [...meses].reverse().forEach(k => {
      const H = new Hoja(nomMes(k)); hojas.push(H);
      H.anchos = [26, 12, 24, 30, 26, 14];
      const l = lista.filter(m => m.fecha.startsWith(k)), i = tot(l,"ingreso"), g = tot(l,"gasto");
      H.txt(0,0,`${nomMes(k)} · ${nombre}`,S.titulo); H.alturas[0] = 28;
      H.txt(0,2,"Gastado",S.txtB); H.num(1,2,g,S.eurNar);
      H.txt(0,3,"Ingresado",S.txtB); H.num(1,3,i,S.eurVer);
      H.txt(0,4,"Te queda",S.txtB); H.num(1,4,i-g, i-g < 0 ? S.eurNeg : S.eurB);
      H.txt(0,6,"Gastos por categoría",S.cabNar); H.txt(1,6,"€",S.cabNar); H.txt(2,6,"%",S.cabNar);
      const gc = porCat(l,"gasto"); let rg = 7;
      gc.forEach(([c,v]) => { H.txt(0,rg,c); H.num(1,rg,v); H.set(2,rg,{t:"n",v:g ? Math.round(v/g*1000)/1000 : 0},S.pct); rg++; });
      if (!gc.length){ H.txt(0,rg,"Sin gastos",S.sub); rg++; }
      H.txt(4,6,"Ingresos por categoría",S.cabVer); H.txt(5,6,"€",S.cabVer);
      const ic = porCat(l,"ingreso"); let ri = 7;
      ic.forEach(([c,v]) => { H.txt(4,ri,c); H.num(5,ri,v); ri++; });
      if (!ic.length){ H.txt(4,ri,"Sin ingresos",S.sub); ri++; }
      let rm = Math.max(rg, ri) + 2;
      H.txt(0,rm,"Movimientos del mes",S.txtB); rm++;
      ["Fecha","Tipo","Categoría","Nota","Importe"].forEach((h,c) => H.txt(c,rm,h,S.cab)); rm++;
      [...l].reverse().forEach(m => {
        H.fecha(0,rm,m.fecha); H.txt(1,rm,m.tipo === "ingreso" ? "Ingreso" : "Gasto"); H.txt(2,rm,nomCat(m));
        H.txt(3,rm,(m.rec ? "🔁 " : "") + (m.nota || "")); H.num(4,rm, m.tipo === "ingreso" ? m.importe : -m.importe, m.tipo === "ingreso" ? S.eurVer : S.eur); rm++;
      });
      if (gc.length) H.graficos.push({ tipo:"bar", titulo:`¿En qué se te va el dinero? · ${nomMes(k)}`, catCol:0, r0:7, pos:[7,1,15,Math.max(18, 7 + gc.length * 2)],
        cats:gc.map(e => e[0]), series:[{ nombre:"Gastos", col:1, color:NARANJA, vals:gc.map(e => e[1]) }] });
    });

    /* TODOS LOS MOVIMIENTOS */
    const T = new Hoja("Todos los movimientos"); hojas.push(T);
    T.anchos = [13, 10, 26, 32, 14];
    ["Fecha","Tipo","Categoría","Nota","Importe"].forEach((h,c) => T.txt(c,0,h,S.cab));
    lista.forEach((m,i) => {
      const rr = i + 1;
      T.fecha(0,rr,m.fecha); T.txt(1,rr,m.tipo === "ingreso" ? "Ingreso" : "Gasto"); T.txt(2,rr,nomCat(m));
      T.txt(3,rr,(m.rec ? "🔁 " : "") + (m.nota || "")); T.num(4,rr, m.tipo === "ingreso" ? m.importe : -m.importe, m.tipo === "ingreso" ? S.eurVer : S.eur);
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
    zip.file("xl/styles.xml", STYLES);
    return zip.generateAsync({ type: tipo || "blob", mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression:"DEFLATE" });
  }

  root.crearExcelAhorraulin = crearExcel;
})(typeof window !== "undefined" ? window : globalThis);
