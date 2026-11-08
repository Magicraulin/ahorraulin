/* Datos fijos de la app: categorías, colores, emoticonos, consejos y recetas. */

const GASTOS_BASE = [
  ["gasolina","⛽","Gasolina","#fff1d6"], ["comer","🍔","Comer fuera","#ffe4dc"], ["super","🛒","Súper","#e1f4e6"],
  ["casa","🏠","Casa","#e3ecff"], ["transporte","🚗","Coche y transporte","#e6f2fb"], ["ocio","🎉","Ocio","#fbe3f1"],
  ["ropa","👕","Ropa","#ece5ff"], ["salud","💊","Salud","#ffe3e6"], ["regalos","🎁","Regalos","#fff0dc"],
  ["suscripciones","📱","Suscripciones","#e0f5f5"], ["trabajo","✏️","Material de clase","#fff7cf"], ["otros","✨","Otros gastos","#f0eef5"]
];
const CATEGORIAS = {
  mago: {
    gasto: GASTOS_BASE.map(c => c[0] === "trabajo" ? ["trabajo","🪄","Material de magia","#efe6ff"] : c),
    ingreso: [["bolos","🎩","Actuaciones","#ece5ff"],["bodas","💍","Bodas y eventos","#fbe3f1"],["teatro","🎭","Teatro","#ffe4dc"],
              ["sueldo","💰","Sueldo","#e1f4e6"],["bizum","💸","Bizum / me devuelven","#e0f5f5"],["ventas","🏷️","Ventas","#fff1d6"],
              ["regalo","🎁","Regalo","#fff0dc"],["otros_in","✨","Otros ingresos","#f0eef5"]]
  },
  profe: {
    gasto: GASTOS_BASE,
    ingreso: [["sueldo","💰","Nómina","#e1f4e6"],["clases","📚","Clases particulares","#e3ecff"],["academia","🏫","Academia / extraescolares","#ece5ff"],
              ["paga","🎄","Paga extra","#ffe4dc"],["bizum","💸","Bizum / me devuelven","#e0f5f5"],["regalo","🎁","Regalo","#fff0dc"],
              ["ventas","🏷️","Ventas","#fff1d6"],["otros_in","✨","Otros ingresos","#f0eef5"]]
  }
};
// Qué tipo de categorías usa cada perfil
const TIPO_PERFIL = { p1:"mago", p2:"profe", p3:"profe" };

const PALETAS = {
  violeta:  ["#6250d6","#9a7cf3","Violeta"],
  rosa:     ["#d6457a","#f28bb0","Rosa"],
  azul:     ["#2a78d6","#5fb0f0","Azul"],
  menta:    ["#13a383","#5fd4b4","Menta"],
  naranja:  ["#e0622a","#f6a35c","Naranja"],
  coral:    ["#e04f5f","#f7878f","Coral"],
  turquesa: ["#0f8fa8","#4cc6d9","Turquesa"],
  noche:    ["#2d2a4a","#5f5a94","Noche"]
};

const EMOJIS = ["🎩","🪄","🃏","🐰","📚","✏️","🍎","🎓","🌸","🌻","🌈","⭐","🦄","🐱","🐶","🦊",
                "🐼","🐨","🦋","🐢","🍓","🍕","🧁","☕","⚽","🎸","🎨","📸","✈️","🏖️","💃","🕺",
                "😎","🤓","😊","🥳","🤠","👑","💎","🔥","🍀","🌙","☀️","❤️","💜","💙","💚","🧡"];

const PROVINCIAS = [["01","Álava"],["02","Albacete"],["03","Alicante"],["04","Almería"],["33","Asturias"],["05","Ávila"],["06","Badajoz"],
  ["07","Baleares"],["08","Barcelona"],["48","Bizkaia"],["09","Burgos"],["10","Cáceres"],["11","Cádiz"],["39","Cantabria"],["12","Castellón"],
  ["51","Ceuta"],["13","Ciudad Real"],["14","Córdoba"],["15","A Coruña"],["16","Cuenca"],["20","Gipuzkoa"],["17","Girona"],["18","Granada"],
  ["19","Guadalajara"],["21","Huelva"],["22","Huesca"],["23","Jaén"],["24","León"],["25","Lleida"],["27","Lugo"],["28","Madrid"],["29","Málaga"],
  ["52","Melilla"],["30","Murcia"],["31","Navarra"],["32","Ourense"],["34","Palencia"],["35","Las Palmas"],["36","Pontevedra"],["26","La Rioja"],
  ["37","Salamanca"],["38","Santa Cruz de Tenerife"],["40","Segovia"],["41","Sevilla"],["42","Soria"],["43","Tarragona"],["44","Teruel"],
  ["45","Toledo"],["46","Valencia"],["47","Valladolid"],["49","Zamora"],["50","Zaragoza"]];

const CONSEJOS = {
  gasolina: [
    "Compara precios antes de repostar: entre gasolineras de la misma zona puede haber varios céntimos por litro.",
    "Conduce suave y a velocidad constante: acelerar y frenar de golpe puede gastar hasta un 20 % más.",
    "Revisa la presión de las ruedas una vez al mes: unas ruedas bajas gastan más.",
    "Junta recados en un solo viaje y comparte coche cuando puedas.",
    "Las tarjetas de descuento de las gasolineras (y las del súper) suelen rebajar unos céntimos por litro."
  ],
  comer: [
    "Ponte un límite de comidas fuera a la semana (por ejemplo, 2) y guárdalas para planes que te hagan ilusión.",
    "Cocina doble los domingos y congela raciones: así no tiras de comida a domicilio entre semana.",
    "Lleva táper al trabajo: un menú del día ronda 12-15 €, un táper casero 2-3 €.",
    "Si sales, mira el menú del día en vez de pedir a la carta, y el agua del grifo es gratis.",
    "Desinstala las apps de comida a domicilio o quita la tarjeta guardada: el pedido de capricho baja mucho."
  ],
  super: [
    "Haz la lista antes de ir y no vayas con hambre.",
    "Compara el precio por kilo o por litro (la etiqueta pequeña), no el del paquete.",
    "Prueba la marca blanca en lo básico: suele ser igual y bastante más barata.",
    "Planifica los menús de la semana y compra solo lo que vas a cocinar.",
    "Apps como Too Good To Go venden packs de comida a buen precio al final del día."
  ],
  casa: [
    "Revisa tu tarifa de luz y gas: compara en el comparador de la CNMC.",
    "Pon lavadoras y lavavajillas en las horas más baratas y siempre llenos.",
    "Cambia a bombillas LED y apaga los aparatos en standby con una regleta.",
    "Llama a tu compañía de internet y móvil: preguntar por una oferta suele bajar la factura."
  ],
  transporte: [
    "Si vives en Madrid, el abono transporte suele salir más barato que ir en coche al centro.",
    "Compara el seguro del coche al renovarlo: cambiar de compañía puede ahorrar bastante.",
    "Busca aparcamientos gratuitos o disuasorios en vez de pagar zona SER o parking.",
    "Haz el mantenimiento a tiempo: un problema pequeño sale mucho más caro si se deja."
  ],
  ocio: [
    "Busca planes gratis: museos con entrada gratuita a ciertas horas, parques, rutas, conciertos al aire libre.",
    "Mira las ofertas de entradas con descuento en apps y webs de planes.",
    "Fija un presupuesto mensual de ocio y, cuando se acabe, toca plan casero.",
    "Las cenas en casa con amigos (cada uno lleva algo) salen mucho más baratas que salir."
  ],
  ropa: [
    "Espera a rebajas para lo que no es urgente y haz una lista de lo que de verdad necesitas.",
    "Aplica la regla de las 48 horas: si sigues queriéndolo dos días después, cómpralo.",
    "Vende la ropa que no usas en Vinted o Wallapop y compra de segunda mano.",
    "Date de baja de los correos de tiendas: menos tentaciones."
  ],
  salud: [
    "Pregunta en la farmacia por el genérico: mismo principio activo, menos precio.",
    "Compara precios del dentista o del fisio y pregunta por bonos de varias sesiones.",
    "Si tienes seguro privado, revisa qué cubre antes de pagar de tu bolsillo."
  ],
  regalos: [
    "Haz una lista de cumpleaños y fechas del año y ponles un presupuesto.",
    "Los regalos hechos a mano o las experiencias (una cena casera, una tarde de plan) se recuerdan más.",
    "Juntaos varios para un regalo grande en vez de muchos pequeños.",
    "Compra con tiempo: las prisas de última hora salen caras."
  ],
  suscripciones: [
    "Haz repaso: apunta todas tus suscripciones y quita las que no hayas usado este mes.",
    "Rota plataformas: un mes una, el siguiente otra, en vez de pagarlas todas a la vez.",
    "Comparte planes familiares cuando la plataforma lo permita.",
    "Pasa al plan anual solo en lo que usas todo el año: sale más barato."
  ],
  trabajo: [
    "Compra el material en packs grandes o en tiendas al por mayor.",
    "Antes de comprar, mira si puedes reutilizar o fabricar tú el material.",
    "Guarda los tickets: si eres autónomo, muchos gastos de trabajo se pueden desgravar."
  ],
  otros: [
    "Apunta una nota en cada gasto de «Otros»: así verás en qué se va de verdad.",
    "Antes de una compra no prevista, espera un día y pregúntate si la necesitas.",
    "Ponte un tope semanal de pequeños caprichos (cafés, chucherías…)."
  ]
};

const RECETAS = [
  { e:"🥔", n:"Tortilla de patatas", c:"≈ 0,90 €/ración", t:"35 min",
    i:"4 patatas, 5 huevos, 1 cebolla, aceite y sal.",
    p:"Pocha patata y cebolla en láminas a fuego medio 20 min. Escurre, mezcla con los huevos batidos y cuaja 3 min por cada lado." },
  { e:"🍲", n:"Lentejas con verduras", c:"≈ 0,80 €/ración", t:"40 min",
    i:"300 g de lentejas, 1 zanahoria, 1 pimiento, 1 cebolla, 1 patata, pimentón.",
    p:"Sofríe las verduras picadas, añade pimentón, lentejas, la patata en trozos y agua. Cuece 30 min. Salen 4 raciones: congela 2." },
  { e:"🍝", n:"Pasta con atún y tomate", c:"≈ 1,00 €/ración", t:"15 min",
    i:"Pasta, tomate triturado, 2 latas de atún, ajo, orégano.",
    p:"Cuece la pasta. Mientras, sofríe ajo, añade el tomate 8 min y el atún al final. Mezcla y listo." },
  { e:"🍛", n:"Arroz con pollo al curry", c:"≈ 1,40 €/ración", t:"30 min",
    i:"Arroz, 2 contramuslos, 1 cebolla, curry, un chorrito de leche o nata.",
    p:"Dora el pollo en dados con la cebolla, añade curry y leche 10 min. Sirve con arroz blanco." },
  { e:"🎃", n:"Crema de calabaza", c:"≈ 0,70 €/ración", t:"30 min",
    i:"1/2 calabaza, 1 patata, 1 cebolla, 1 zanahoria, sal y aceite.",
    p:"Cuece todo troceado con agua justa 20 min, tritura y ajusta de sal. Aguanta 4 días en la nevera." },
  { e:"🌯", n:"Wraps caseros", c:"≈ 1,30 €/ración", t:"15 min",
    i:"Tortillas de trigo, pollo o pavo, lechuga, tomate, queso, salsa de yogur.",
    p:"Saltea el pollo en tiras, rellena las tortillas con todo y enrolla. Perfecto como táper." },
  { e:"🥗", n:"Ensalada de garbanzos", c:"≈ 0,90 €/ración", t:"10 min",
    i:"1 bote de garbanzos cocidos, tomate, pepino, cebolla, huevo duro, atún.",
    p:"Lava los garbanzos, trocea todo y aliña con aceite, vinagre y sal. Sin fuego." },
  { e:"🍳", n:"Huevos rotos con pimientos", c:"≈ 1,10 €/ración", t:"25 min",
    i:"Patatas, 2 huevos, pimientos verdes, aceite y sal.",
    p:"Fríe o asa las patatas en gajos con los pimientos, pon los huevos fritos encima y rómpelos." },
  { e:"🍕", n:"Pizza casera de sartén", c:"≈ 1,20 €/ración", t:"25 min",
    i:"Base de pizza (o pan de pita), tomate, mozzarella, jamón york, orégano.",
    p:"Monta la pizza y hazla en sartén tapada a fuego medio 8-10 min. Más barata que pedirla." }
];

/* ---------------------------------------------------------------------
   FRASES al apuntar. Por categoría y según lo grande que sea el gasto:
   lim = [importe a partir del cual es "medio", a partir del cual es "alto"]
   Puedes añadir o cambiar las que quieras. No se repite ninguna frase
   hasta que han salido todas las de su grupo.
   --------------------------------------------------------------------- */
const FRASES = {
  gasolina: { lim:[30, 70],
    bajo: ["Un repostaje de aperitivo. ¡Así me gusta! ⛽", "Poquito a poco… y el depósito contento.", "Gasolina justa y necesaria. Bien jugado.",
           "Repostaje de francotirador: lo justo y al grano. 🎯", "Media rayita de gasolina y a seguir. ¡Ahorro on!", "Así, sin pasarse. El coche y tu cartera, amigos.",
           "Gasolina low cost, conductor high level. 😎", "Echar poquito también es de listos. 🧠"],
    medio:["Repostaje serio. ¿Y si compartes coche alguna vez? 🚗", "Conduce suave y este depósito te dura más.", "Junta recados en un viaje y le sacas más jugo a esto.",
           "Revisa la presión de las ruedas: gastan menos. 🛞", "Pie ligero, cartera llena. Ese es el truco.", "Depósito majo. Ahora a no acelerar como en Fórmula 1. 🏎️",
           "¿Esa gasolinera era la más barata? Unos céntimos al litro suman. 🔍", "Ni mucho ni poco. Pero vigila los kilómetros tontos."],
    alto: ["¡JOOOODER, vaya palo! ¡Tenías el coche seco! 😱", "Eso no es repostar, es invertir en petróleo. 🛢️", "Tu coche bebe más que tú en Nochevieja. ¡Vigila esos kilómetros!",
           "Con esto podrías haber ido en burro y te sobraba para la alfalfa. 🫏", "¡Madre mía! Ese depósito tiene más hambre que tú a las 2 de la tarde.",
           "¿Has ido a Cádiz y vuelto? Porque lo parece. 🏖️", "Gasolinazo. Esta semana, bici y paseítos. 🚲", "Ufff… el surtidor te ha mirado y se ha reído.",
           "Depósito lleno, alma vacía. Mañana a conducir con cariño. 🥲", "El coche te lo agradece. Tu cuenta te ha retirado el saludo."] },
  comer: { lim:[15, 40],
    bajo: ["Un caprichito pequeño, permitido. 😋", "Bien medido. Disfrútalo sin remordimientos.", "Comer fuera barato también es un arte. 👌",
           "Bocata digno a precio digno. Respect. 🥪", "Capricho controlado, conciencia tranquila.", "Rico, barato y sin culpa. Combo perfecto. 🙌",
           "Pequeño homenaje. Que no se convierta en costumbre. 😉", "Un antojito así cualquiera lo perdona."],
    medio:["¡Menos comida rápida y más gimnasio! 💪", "Esto en casa te salía por la mitad… solo lo digo. 🍳", "Mañana táper y lo compensamos, ¿trato?",
           "¿Menú del día o carta? La carta muerde. 🦈", "Rico, pero tu nevera está muy sola. 🥺", "La próxima vez, cocina doble y congela. ¡Te lo agradecerás!",
           "Ni tan mal… pero ese postre sobraba, eh. 🍰", "Comer fuera mola. Ahorrar también mola. Equilibrio, compi.",
           "Tu tupper está celoso. Hazle caso mañana. 🥡"],
    alto: ["¡Eso no es una cena, es una boda! 💸", "Con lo que has gastado comías una semana en casa. 🥲", "Rico, ¿eh? Tu cartera no opina lo mismo.",
           "Esta semana toca cocinar: mira las recetas en «Ahorro». 🍲", "¡Has comido como un rey… y has pagado como un rey! 👑", "Banquete nivel Masterchef. Ahora, una semanita de lentejas. 🫘",
           "¿Invitabas tú? Porque eso parece una ronda para todo el bar. 🍻", "Cena de lujo apuntada. Tu yo del futuro te mira con cara rara. 🤨",
           "Con eso tenías para 15 tortillas de patatas. Solo lo dejo caer. 🥔"] },
  super: { lim:[40, 100],
    bajo: ["Compra cortita y al grano. ¡Crack! 🛒", "Ir con lista se nota. Bien hecho.", "Entrar, coger lo justo y salir: ninja del súper. 🥷",
           "Compra exprés sin caprichos. Así se hace.", "Poquito y bien elegido. 👌"],
    medio:["Compra decente. ¿Has mirado la marca blanca? 😉", "Nevera llena, corazón contento.", "Compra apañada. Ahora a no tirar nada. ♻️",
           "Planifica menús y verás cómo baja esto. 📝", "Bien… pero ¿de verdad hacían falta las galletas? 🍪", "Compra normalita. Mira el precio por kilo la próxima vez."],
    alto: ["¡Has vaciado el súper! Que no se te pase nada de fecha. 🥫", "Compra de búnker. Aprovecha todo y no tires nada.", "¿Ibas con hambre al súper? Se nota. 😅",
           "Compra para un regimiento. ¿Seguro que sois tantos? 🪖", "El carro iba más cargado que el camión de la mudanza. 🚚", "Compra XXL. Congela lo que no vayas a usar ya.",
           "Nunca vayas al súper con hambre. Nunca. 🙃"] },
  casa: { lim:[60, 300],
    bajo: ["Pequeño gasto de casa, todo bajo control. 🏠", "Casa cuidada, cartera también. 👍", "Gastito de hogar, nada grave."],
    medio:["Las facturas no perdonan… compara tarifas de vez en cuando. 💡", "Apaga luces que no uses y pon lavadoras llenas. 🔌", "Factura apuntada. Pregunta a tu compañía por ofertas, a veces cuela."],
    alto: ["Gasto gordo de casa. Al menos tienes techo. 🏡", "Apaga luces y pon lavadoras llenas: cada euro cuenta.", "Golpe de casa. Este mes, menos caprichos para compensar.",
           "Hogar, dulce (y caro) hogar. 🥲"] },
  transporte: { lim:[20, 80],
    bajo: ["Moverse barato es de listos. 🚌", "Transporte apañado. Bien hecho.", "Así se viaja: barato y sin dramas."],
    medio:["El coche es un pozo sin fondo… ¡ánimo!", "¿Aparcamiento? Busca zonas gratis la próxima vez. 🅿️", "Moverse cuesta. Andar es gratis y sano. 🚶"],
    alto: ["Ese coche te está saliendo más caro que un hijo. 🚗💸", "Taller, seguro o multa… sea lo que sea, duele.", "Golpe gordo. Compara seguros al renovar, se ahorra un pico.",
           "Tu coche ha decidido que este mes es suyo. 😩"] },
  ocio: { lim:[20, 60],
    bajo: ["¡Divertirse barato también vale! 🎉", "Plan top a precio mini. Así sí.", "Ocio low cost, risas high cost. 😂", "Pasarlo bien sin arruinarse: nivel experto."],
    medio:["La vida hay que disfrutarla… con cabeza. 😉", "Buen plan. ¿El próximo uno gratis?", "Disfruta, pero la próxima, plan de parque y bocata. 🌳",
           "Diversión apuntada. Mira planes gratis en tu ciudad, hay muchos."],
    alto: ["¡Fiestón! Esta semana toca plan de sofá y peli. 🛋️", "Has vivido la vida. Tu cuenta, un poco menos. 😅", "¡Qué nivelazo de plan! Ahora, modo ermitaño unos días. 🧘",
           "Te lo has pasado bomba… y tu cartera ha explotado. 💥", "Noche épica, cuenta trágica. 🎭"] },
  ropa: { lim:[30, 80],
    bajo: ["Un capricho pequeñito, te lo has ganado. 👕", "Ropa barata y bonita: chollo detectado. 🕵️", "Detallito para el armario, sin pasarse."],
    medio:["¿Lo necesitabas o te miró con ojitos? 👀", "Regla de oro: si no lo usas en un mes, a Vinted.", "Prenda nueva… ¿y una vieja a la venta? Equilibrio. ⚖️",
           "Espera 48 horas antes de comprar: si lo sigues queriendo, adelante."],
    alto: ["¡Fashion week en tu armario! 💃 Este mes, a lucir lo que tienes.", "Modelazo, sí. Pero tu cuenta va en chándal. 😬", "Vas a ir más guapo/a que nadie… y más pobre que nadie. 😅",
           "Tu armario ya no cierra. Tu cartera tampoco. 🚪"] },
  salud: { lim:[20, 80],
    bajo: ["La salud es lo primero. 💊", "Cuidarse siempre es buena inversión.", "Pregunta por el genérico, suele ser más barato. 😉"],
    medio:["Cuídate, que es la mejor inversión. ❤️", "Salud ante todo. ¡Ánimo!"],
    alto: ["Gasto gordo pero necesario. ¡Que te mejores! 🩺", "La salud no tiene precio… aunque a veces lo parezca. 💪"] },
  regalos: { lim:[20, 60],
    bajo: ["Detallazo sin arruinarte. 🎁", "Lo que cuenta es el detalle. ¡Y este cuenta!", "Regalo bonito y barato: la combinación perfecta."],
    medio:["Qué generos@. ¡Alguien va a sonreír! 😊", "Buen regalo. Apunta los cumpleaños del año y así lo planificas."],
    alto: ["¡Regalazo! La próxima vez, regalo hecho a mano. 😉", "Generosidad nivel Papá Noel. 🎅", "Quien lo reciba te va a querer para siempre. Tu cuenta, no tanto. 😅"] },
  suscripciones: { lim:[10, 30],
    bajo: ["Una suscri más… ¿la usas de verdad? 📺", "Pequeña cuota, pero suman. Revisa cuántas tienes.", "¿Y si turnas plataformas en vez de tenerlas todas?"],
    medio:["¿Cuántas plataformas tienes ya? Haz repaso. 🧐", "Comparte plan familiar y la pagas a medias. 🤝"],
    alto: ["Suscripción cara. Si no la usas todas las semanas, ¡fuera! ✂️", "Esa cuota pesa. ¿Hay un plan más barato?"] },
  trabajo: { lim:[20, 80],
    bajo: ["Material de trabajo: inversión, no gasto. 💼", "Herramienta pequeña, gran ayuda.", "Bien. Guarda el ticket, que puede desgravar. 🧾"],
    medio:["Herramientas nuevas, más ganas de trabajar. 💪", "Inversión en lo tuyo. Que dé frutos. 🌱"],
    alto: ["Inversión potente. ¡Que se note en los bolsillos pronto! 📈", "Gasto de trabajo gordo: guarda la factura. 🧾", "A por más trabajo para amortizarlo. 💼🔥"] },
  otros: { lim:[20, 60],
    bajo: ["Gastito anotado. Así se lleva el control. ✍️", "Todo apuntado, todo controlado. 👀", "Pequeño gasto, gran disciplina por apuntarlo. 👏"],
    medio:["Ponle nota a los «otros» y sabrás dónde se va. 😉", "¿Qué ha sido esto? Ponle nota, detective. 🔎"],
    alto: ["Gasto misterioso y gordo… ¿Qué ha sido? 🕵️", "Eso no es un «otro», eso es un «¡ostras!». 😳", "Gasto grande sin categoría. Revisa si era necesario."] }
};
const FRASES_INGRESO = {
  lim:[50, 500],
  bajo: ["¡Todo suma! 🪙", "Pequeñito pero honrado. 💚", "Euro a euro se llena la hucha. 🐷", "Poquito, pero mejor dentro que fuera. 😄",
         "Un ingresito alegra el día. ☀️", "Las gotas hacen el mar. 🌊"],
  medio:["¡Eso es! Dinerito fresco. 💸", "Bien ganado. Guarda un trocito, ¿eh? 😉", "¡A la hucha una parte, que luego vuelan!", "¡Qué bien sienta ver dinero entrar! 🤑",
         "Trabajo bien pagado. Ahora, a no fundirlo. 💪", "Ingreso apuntado. Tu yo del futuro te aplaude. 👏"],
  alto: ["¡BOOM! 💰 Hoy invitas tú… ¡pero no te pases!", "¡Qué alegría! Aparta un 20 % antes de que se escape.", "¡Cobrado! Ahora el reto es que llegue a fin de mes. 💪",
         "¡Lluvia de billetes! 🌧️💶 Guarda paraguas para los gastos.", "¡Nómina/bolo top! Primero ahorra, luego disfruta. 🏆", "¡Toma ya! Este mes empieza fuerte. 🚀"]
};
// Elige una frase sin repetir hasta que hayan salido todas las de ese grupo
function fraseApunte(tipo, cat, importe){
  const f = tipo === "ingreso" ? FRASES_INGRESO : (FRASES[cat] || FRASES.otros);
  const nivel = importe >= f.lim[1] ? "alto" : importe >= f.lim[0] ? "medio" : "bajo";
  const lista = f[nivel] || f.bajo, clave = "nc_frases_" + (tipo === "ingreso" ? "ingreso" : cat) + "_" + nivel;
  let usadas = [];
  try { usadas = JSON.parse(localStorage.getItem(clave)) || []; } catch(e){}
  let libres = lista.map((_, i) => i).filter(i => !usadas.includes(i));
  if (!libres.length){ usadas = usadas.slice(-1); libres = lista.map((_, i) => i).filter(i => !usadas.includes(i)); }
  const i = libres[Math.floor(Math.random() * libres.length)];
  try { localStorage.setItem(clave, JSON.stringify(usadas.concat(i))); } catch(e){}
  return lista[i];
}
