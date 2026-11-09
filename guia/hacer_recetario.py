import json, html, re
from recetas import SECCIONES
base=open('recetario-plantilla.html').read()
head=base[:base.index('<body>')+6]
# estilos extra para las fichas compactas
head=head.replace('</style>','''
.ficha{background:#fff;border-radius:5mm;padding:3.4mm 4.2mm 3mm;box-shadow:0 1mm 4mm rgba(60,40,140,.08);margin-bottom:3.2mm}
.ficha .ft{display:flex;align-items:center;gap:2.6mm}
.ficha .ft .e{font-size:17pt;line-height:1}
.ficha h3{font-size:11.2pt;line-height:1.12}
.ficha .etqs{margin:.8mm 0 1.6mm}
.ficha .ing{font-size:8.7pt;color:#4b4466;margin:0 0 1.2mm}
.ficha .ing b{color:#231c3d}
.ficha ol{margin:0;padding-left:4.2mm;font-size:8.8pt}
.ficha ol li{margin-bottom:.5mm}
.parte{background:linear-gradient(155deg,var(--p1) 0%,var(--p2) 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.parte .big{font-size:58pt;line-height:1}
.parte h1{font-size:40pt;font-weight:900;margin:5mm 0 3mm;letter-spacing:-.5pt}
.parte p{font-size:11.5pt;font-weight:600;opacity:.92;max-width:105mm;margin:0 0 2mm}
.parte ul{list-style:none;padding:0;margin:5mm 0 0;font-weight:800;font-size:11pt}
.parte li{margin-bottom:2mm}
</style>''')
def pagina(cuerpo, n, clase=""):
    pie=f'<div class="pie"><span>Recetario Ahorraulin · Comidas y cenas</span><span>{n}</span></div>' if not clase else ""
    return f'<section class="pag {clase}">{cuerpo}{pie}</section>\n'
def ficha(r):
    e,nom,mins,rac,etq,ing,pasos=r
    tags=[f"⏱ {mins} min", f"{rac} raciones"]+etq
    return f'''<div class="ficha"><div class="ft"><span class="e">{e}</span><div><h3>{html.escape(nom)}</h3>
<div class="etqs">{"".join(f'<span class="etq">{html.escape(t)}</span>' for t in tags)}</div></div></div>
<p class="ing"><b>Necesitas:</b> {html.escape(", ".join(ing))}.</p>
<ol>{"".join(f"<li>{html.escape(p)}</li>" for p in pasos)}</ol></div>'''
# extraer páginas fijas de la plantilla
secs=re.findall(r'<section class="pag[^"]*">.*?</section>', base, re.S)
portada, bienvenida, reglas, domingo = secs[0], secs[1], secs[2], secs[3]
# --- maquetación ---
paginas=[]   # (html, tipo)
plan=[]
n=1
out=[portada.replace('<h1>Táperes de<br>la semana</h1>','<h1>Comidas<br>y cenas</h1>').replace(
 'El recetario exclusivo de Ahorraulin: comidas ricas, baratas y fáciles para llevar al trabajo y olvidarte de comer fuera todos los días.',
 f'El recetario exclusivo de Ahorraulin: {sum(len(s[5]) for s in SECCIONES)} recetas baratas y fáciles, desde un buen plato de cuchara hasta la hamburguesa del viernes.')]
n=2
idx_pos=len(out); out.append(None)   # bienvenida con índice, se rellena luego
n=3; out.append(reglas.replace('<span>3</span>','<span>3</span>'))
n=4; out.append(domingo)
indice=[("Las reglas del buen táper 📦",3),("El domingo de cocina 👩‍🍳",4)]
n=5
parte_actual=None
for parte,em,tit,sub,color,recs in SECCIONES:
    if parte!=parte_actual:
        parte_actual=parte
        secciones_parte=[s for s in SECCIONES if s[0]==parte]
        texto = "Para el táper del trabajo o para comer en casa. Cunden, aguantan y la mayoría se congelan." if parte=="COMIDAS" else "Rápidas, ligeras o de capricho: para no acabar pidiendo comida a domicilio a las diez de la noche."
        lis="".join(f"<li>{s[1]} {s[2]}</li>" for s in secciones_parte)
        out.append(f'<section class="pag parte"><div class="big">{"🍽️" if parte=="COMIDAS" else "🌙"}</div><h1>{parte.capitalize()}</h1><p>{texto}</p><ul>{lis}</ul></section>\n')
        indice.append((f"<b>{parte.capitalize()}</b>",n)); n+=1
    indice.append((f"{em} {tit} · {len(recs)} recetas",n))
    cab=f'<div class="cab"><div class="e" style="background:{color}">{em}</div><div><h2>{html.escape(tit)}</h2><small>{html.escape(sub)}</small></div></div>'
    grupos=[recs[i:i+3] for i in range(0,len(recs),3)]
    for gi,g in enumerate(grupos):
        out.append(pagina((cab if gi==0 else "")+"".join(ficha(r) for r in g), n)); n+=1
# plan semanal (comidas y cenas)
nom=lambda s,i: [x for x in SECCIONES if x[2]==s][0][5][i][1]
dias=[("Lunes",nom("De cuchara",0),nom("Cenas ligeras",1)),("Martes",nom("Pasta y arroz",6),nom("Cenas en 15 minutos",1)),
      ("Miércoles",nom("Saludables",2),nom("Cenas ligeras",0)),("Jueves",nom("De cuchara",1),nom("Cenas en 15 minutos",3)),
      ("Viernes",nom("Pasta y arroz",0),nom("Fast food casero",0)),("Sábado",nom("Pasta y arroz",4),nom("Fast food casero",1)),
      ("Domingo",nom("De cuchara",3),nom("Cenas ligeras",5))]
filas="".join(f'<tr><td class="d">{d}</td><td><b>☀️</b> {html.escape(c)}<br><b>🌙</b> {html.escape(ce)}</td></tr>' for d,c,ce in dias)
indice.append(("Una semana de ejemplo 🗓️",n))
out.append(pagina(f'''<div class="cab"><div class="e" style="background:#ece5ff">🗓️</div><div><h2>Una semana de ejemplo</h2><small>Comidas y cenas, sin repetir y sin pedir a domicilio</small></div></div>
<table class="plan">{filas}</table>
<div class="caja"><h3>📲 Apúntalo</h3>Cada comida en casa en vez de fuera es dinero que se queda contigo. A final de mes mira en Ahorraulin cuánto ha bajado <b>🍔 Comer fuera</b>.</div>''', n)); n+=1
final=secs[-1].replace('Cada táper es una comida fuera que te ahorras.','Cada plato que haces en casa es una comida fuera que te ahorras.')
out.append(final)
lis="".join(f'<li><span>{t}</span><span>{p}</span></li>' for t,p in indice)
bien=f'''<section class="pag">
  <div class="cab"><div class="e" style="background:#e1f4e6">🥗</div><div><h2>¡Una semana entera!</h2><small>Siete días sin comer fuera. Eso merece un premio.</small></div></div>
  <p>Comer fuera cada día es de los gastos que más se notan a final de mes. Aquí tienes <b>{sum(len(s[5]) for s in SECCIONES)} recetas</b> para comidas y cenas: de cuchara, saludables, rápidas y hasta fast food casero para el viernes.</p>
  <div class="caja"><h3>📖 Qué hay dentro</h3><ul class="indice">{lis}</ul></div>
  <div class="pie"><span>Recetario Ahorraulin · Comidas y cenas</span><span>2</span></div>
</section>
'''
out[idx_pos]=bien
doc=head+"\n"+"".join(out)+"</body></html>"
doc=doc.replace('Recetario Ahorraulin · Táperes de la semana','Recetario Ahorraulin · Comidas y cenas').replace('<title>Táperes de la semana · Recetario Ahorraulin</title>','<title>Comidas y cenas · Recetario Ahorraulin</title>')
open('recetario-completo.html','w').write(doc)
print("páginas:", n, "recetas:", sum(len(s[5]) for s in SECCIONES))
