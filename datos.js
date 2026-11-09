/* Datos fijos de la app: categorías, colores, emoticonos, consejos y recetas. */

const GASTOS_BASE = [
  ["gasolina","⛽","Gasolina","#fff1d6"], ["comer","🍔","Comer fuera","#ffe4dc"], ["super","🛒","Súper","#e1f4e6"],
  ["casa","🏠","Casa","#e3ecff"], ["transporte","🚗","Coche y transporte","#e6f2fb"], ["ocio","🎉","Ocio","#fbe3f1"], ["viajes","✈️","Viajes","#dff1fb"],
  ["ropa","👕","Ropa","#ece5ff"], ["salud","💊","Salud","#ffe3e6"], ["regalos","🎁","Regalos","#fff0dc"],
  ["suscripciones","📱","Suscripciones","#e0f5f5"], ["trabajo","✏️","Material de clase","#fff7cf"],
  ["ahorro","🐷","Ahorro","#ffe3ef"], ["inversion","📈","Inversión","#e1f4e6"], ["otros","✨","Otros gastos","#f0eef5"]
];
const BELLEZA = ["belleza","💅","Belleza","#fde3f3"];
const DEPORTE = ["deporte","🏓","Pádel","#e6f6df"];   // se guarda como "deporte"
// Mete una categoría justo detrás de otra
const meterDetras = (lista, id, cat) => { const i = lista.findIndex(c => c[0] === id); return [...lista.slice(0, i + 1), cat, ...lista.slice(i + 1)]; };
const CATEGORIAS = {
  mago: {
    // Raúl: con Pádel (detrás de Viajes)
    gasto: meterDetras(GASTOS_BASE.map(c => c[0] === "trabajo" ? ["trabajo","🪄","Material de magia","#efe6ff"] : c), "viajes", DEPORTE),
    ingreso: [["bolos","🎩","Actuaciones","#ece5ff"],["bodas","💍","Bodas y eventos","#fbe3f1"],["teatro","🎭","Teatro","#ffe4dc"],
              ["sueldo","💰","Sueldo","#e1f4e6"],["bizum","💸","Bizum / me devuelven","#e0f5f5"],["ventas","🏷️","Ventas","#fff1d6"],
              ["regalo","🎁","Regalo","#fff0dc"],["otros_in","✨","Otros ingresos","#f0eef5"]]
  },
  profe: {
    // Sara y Marta: con Belleza (antes de Ahorro)
    gasto: meterDetras(GASTOS_BASE, "trabajo", BELLEZA),
    ingreso: [["sueldo","💰","Nómina","#e1f4e6"],["clases","📚","Clases particulares","#e3ecff"],["academia","🏫","Academia / extraescolares","#ece5ff"],
              ["paga","🎄","Paga extra","#ffe4dc"],["bizum","💸","Bizum / me devuelven","#e0f5f5"],["regalo","🎁","Regalo","#fff0dc"],
              ["ventas","🏷️","Ventas","#fff1d6"],["otros_in","✨","Otros ingresos","#f0eef5"]]
  }
};
// Qué tipo de categorías usa cada perfil
const TIPO_PERFIL = { p1:"mago", p2:"profe", p3:"profe", p4:"profe" };   // p4 = perfil de prueba del administrador

const PALETAS = {
  violeta:  ["#6250d6","#9a7cf3","Violeta"],
  rosa:     ["#d6457a","#f28bb0","Rosa"],
  azul:     ["#2a78d6","#5fb0f0","Azul"],
  menta:    ["#13a383","#5fd4b4","Menta"],
  naranja:  ["#e0622a","#f6a35c","Naranja"],
  coral:    ["#e04f5f","#f7878f","Coral"],
  turquesa: ["#0f8fa8","#4cc6d9","Turquesa"],
  noche:    ["#2d2a4a","#5f5a94","Noche"],
  oro:      ["#a87a12","#e2b84a","Dorado ✨"]   // solo para quien gana «Apuntador de oro»
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
  viajes: [
    "Reserva con tiempo: vuelos y hoteles suelen ser bastante más baratos con 2-3 meses de antelación.",
    "Viaja entre semana o fuera de temporada alta: mismo sitio, mucho menos dinero.",
    "Pon alertas de precio en las webs de vuelos y compara antes de comprar.",
    "Apartamento con cocina: desayunar y cenar algún día en casa ahorra muchísimo.",
    "Crea una hucha solo para viajes y aparta un poco cada mes (categoría Ahorro)."
  ],
  deporte: [
    "Reserva pista en horas valle (mañanas o mediodía): suelen ser bastante más baratas.",
    "Si jugáis 4, repartid siempre la pista a partes iguales con Bizum al momento.",
    "Las bolas duran más de lo que parece: no abras bote nuevo cada partido.",
    "Pala nueva solo cuando la vieja esté de verdad gastada; mira modelos de temporadas anteriores, salen mucho más baratas.",
    "Mira si tu club tiene bono de varias horas o cuota mensual: si juegas mucho, compensa."
  ],
  belleza: [
    "Peluquería cada 6-8 semanas en vez de cada 4: se nota poco y se ahorra mucho.",
    "Busca academias de peluquería o estética: hacen servicios a precio reducido.",
    "Compra los productos que más usas en tamaño grande o en packs.",
    "Las marcas blancas de cosmética del súper son muy buenas y mucho más baratas.",
    "Manicura en casa una semana sí y otra no: mismo resultado, mitad de gasto."
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
   lim = [importe a partir del cual es "medio", a partir del cual es "alto"], por apunte.
   Calibrado con precios reales en España (2025): ticket medio del súper 19,4 €, menú del día 14,2 €,
   manicura 15-20 €, corte de pelo mujer 20-35 €, cine ~9 €, depósito de gasolina 50-70 €…
   El tono empuja siempre a ahorrar: «bajo» = vale, pero ojo; «medio» = frena; «alto» = alarma
   Puedes añadir o cambiar las que quieras. No se repite ninguna frase
   hasta que han salido todas las de su grupo.
   --------------------------------------------------------------------- */
const FRASES = {
  gasolina: { lim:[25, 55],
    bajo: ["Repostaje cortito. Ahora, que te dure: pie suave. 🐢", "Poco gasto… pero cada repostaje suma al mes. Ojo. 👀", "Lo justo. Si juntas recados en un solo viaje, aún menos. 🗺️", "Bien de cantidad. ¿Era la gasolinera más barata de la zona? 🔍", "Gasolina mínima. Lo cerquita, andando, y esto baja más. 🚶", "Repostaje pequeño, pero mira cuántos llevas este mes. 📅"],
    medio:["Depósito majo. Conduce suave y que te dure el doble. 🐢", "Esto ya pica. ¿Compartes coche alguna vez? 🚗", "Unos céntimos más por litro son euros al mes: compara gasolineras. 🔍", "Presión de ruedas bien y maletero vacío: gastas menos. 🛞", "Repostaje serio. Esta semana, lo cerca andando. 🚶", "Cada acelerón es dinero. Pie ligero, cartera llena. 🦶", "Repostaje normal… pero normal no es barato. A estirarlo. 💪", "El aire acondicionado a tope también gasta. Solo lo dejo ahí. ❄️"],
    alto: ["¡JOOOODER, vaya palo! ¡Tenías el coche seco! 😱", "Eso no es repostar, es invertir en petróleo. 🛢️", "Tu coche bebe más que tú en Nochevieja. ¡Vigila esos kilómetros!",
           "Con esto podrías haber ido en burro y te sobraba para la alfalfa. 🫏", "¡Madre mía! Ese depósito tiene más hambre que tú a las 2 de la tarde.",
           "¿Has ido a Cádiz y vuelto? Porque lo parece. 🏖️", "Gasolinazo. Esta semana, bici y paseítos. 🚲", "Ufff… el surtidor te ha mirado y se ha reído.",
           "Depósito lleno, alma vacía. Mañana a conducir con cariño. 🥲", "El coche te lo agradece. Tu cuenta te ha retirado el saludo."] },
  comer: { lim:[10, 25],
    bajo: ["Pequeño, pero ¿café fuera cada día? Al año son cientos. ☕", "Barato, sí. Ahora que no sea costumbre diaria. 😉", "Con esto en casa te salía por la mitad. Solo lo dejo caer. 🍳", "Capricho pequeño. Los pequeños son los que más se repiten. 🔁", "Bocata fuera… el de casa sale a 1 €. 🥪", "Poquito, pero si mañana llevas táper, mejor. 🥡"],
    medio:["Esto ya es un menú del día. Mañana, táper y lo compensas. 🥡", "Comer fuera mola, pero en casa te costaba un tercio. 🍳", "¿Otra vez fuera? Tu nevera está celosa. 🥺", "Cocina doble el domingo y congela: semana sin gastar fuera. 🧊", "Agua del grifo y sin postre la próxima: ahorras un pico. 💧", "Si esto lo haces 3 veces por semana, son más de 150 € al mes. 😬", "Rico, pero la tortilla de casa no tiene rival. 🥔", "Mira las recetas de «Ahorro»: más ricas y más baratas. 🍲"],
    alto: ["¡Eso no es una cena, es una boda! 💸", "Con lo que has gastado comías una semana en casa. 🥲", "Rico, ¿eh? Tu cartera no opina lo mismo.",
           "Esta semana toca cocinar: mira las recetas en «Ahorro». 🍲", "¡Has comido como un rey… y has pagado como un rey! 👑", "Banquete nivel Masterchef. Ahora, una semanita de lentejas. 🫘",
           "¿Invitabas tú? Porque eso parece una ronda para todo el bar. 🍻", "Cena de lujo apuntada. Tu yo del futuro te mira con cara rara. 🤨",
           "Con eso tenías para 15 tortillas de patatas. Solo lo dejo caer. 🥔"] },
  super: { lim:[25, 60],
    bajo: ["Compra cortita. Ojo: muchas compras pequeñas acaban siendo una grande. 🛒", "Lo justo. ¿Llevabas lista? Así, siempre. 📝", "Bien: entrar, coger y salir. Que no sean 5 visitas por semana. 🥷", "Compra pequeña. Mira marca blanca la próxima y aún menos. 🏷️"],
    medio:["Compra normal. ¿Has mirado la marca blanca? Ahorra mucho. 🏷️", "Planifica menús y verás cómo baja esto. 📝", "Revisa fechas y congela lo que sobre: tirar comida es tirar dinero. ♻️", "¿De verdad hacían falta las galletas? 🍪", "Cuidado con los 3×2 que no necesitas. 🙈", "Mira el precio por kilo, no el de la etiqueta grande. 🔍", "Lo barato está en las baldas de abajo. 👇", "Compra apañada. Ahora, que no se pierda nada en la nevera. 🥫"],
    alto: ["¡Has vaciado el súper! Que no se te pase nada de fecha. 🥫", "Compra de búnker. Aprovecha todo y no tires nada.", "¿Ibas con hambre al súper? Se nota. 😅",
           "Compra para un regimiento. ¿Seguro que sois tantos? 🪖", "El carro iba más cargado que el camión de la mudanza. 🚚", "Compra XXL. Congela lo que no vayas a usar ya.",
           "Nunca vayas al súper con hambre. Nunca. 🙃"] },
  casa: { lim:[50, 200],
    bajo: ["Pequeño gasto de casa, todo bajo control. 🏠", "Casa cuidada, cartera también. 👍", "Gastito de hogar, nada grave."],
    medio:["Las facturas no perdonan… compara tarifas de vez en cuando. 💡", "Apaga luces que no uses y pon lavadoras llenas. 🔌", "Factura apuntada. Pregunta a tu compañía por ofertas, a veces cuela."],
    alto: ["Gasto gordo de casa. Al menos tienes techo. 🏡", "Apaga luces y pon lavadoras llenas: cada euro cuenta.", "Golpe de casa. Este mes, menos caprichos para compensar.",
           "Hogar, dulce (y caro) hogar. 🥲"] },
  transporte: { lim:[10, 40],
    bajo: ["Moverse barato está bien. Andar está mejor (y es gratis). 🚶", "Poquito. ¿Tienes abono? Si lo usas mucho, sale a cuenta. 🚇", "Gasto pequeño, pero los parkings sueltos suman. 🅿️", "Bien. Si se puede ir en bici, aún mejor. 🚲"],
    medio:["¿Parking otra vez? Busca zonas gratis la próxima. 🅿️", "El abono suele salir más barato que el coche. Haz cuentas. 🚇", "Moverse cuesta. Junta viajes y ahorras. 🗺️", "Taxi o VTC… ¿había bus? 🚌", "Gasto de moverse apuntado. Este mes, más paseos. 🚶"],
    alto: ["Ese coche te está saliendo más caro que un hijo. 🚗💸", "Taller, seguro o multa… sea lo que sea, duele.", "Golpe gordo. Compara seguros al renovar, se ahorra un pico.",
           "Tu coche ha decidido que este mes es suyo. 😩"] },
  ocio: { lim:[12, 35],
    bajo: ["Plan barato. Y el próximo, uno gratis: parque, playa o peli en casa. 🌳", "Poco gasto, bien. Que no se junten muchos así. 🔁", "Barato, sí. Hay planes gratis en tu ciudad, ¡búscalos! 🔍", "Diversión sin arruinarse. Así, y no más. 😉"],
    medio:["Buen plan. El próximo, uno gratis para compensar. 🌳", "¿Cine? El día del espectador sale más barato. 🎬", "Diversión apuntada. Ahora, unos días de sofá y peli. 🛋️", "Pasarlo bien es necesario. Pasarse, no tanto. 😉", "Este plan ya cuesta. ¿Cuántos llevas este mes? 📅", "La próxima: picnic en vez de terraza. 🧺"],
    alto: ["¡Fiestón! Esta semana toca plan de sofá y peli. 🛋️", "Has vivido la vida. Tu cuenta, un poco menos. 😅", "¡Qué nivelazo de plan! Ahora, modo ermitaño unos días. 🧘",
           "Te lo has pasado bomba… y tu cartera ha explotado. 💥", "Noche épica, cuenta trágica. 🎭"] },
  ropa: { lim:[20, 50],
    bajo: ["Barato… pero ¿lo necesitabas o solo era barato? 🤔", "Una prenda pequeña. Regla: entra una, sale otra (a Vinted). ⚖️", "Los chollos también vacían la cuenta. Ojo. 👀", "Poco gasto. Que no se convierta en compra semanal. 🛍️"],
    medio:["¿Lo necesitabas o te miró con ojitos? 👀", "Espera 48 h antes de comprar: si lo sigues queriendo, adelante. ⏳", "Vende algo en Vinted y compensas. 💰", "¿Tienes algo parecido en el armario? Solo pregunto. 🚪", "Si no lo usas en un mes, a la venta. Regla de oro. 🏷️", "Este mes, a lucir lo que ya tienes. 💪"],
    alto: ["¡Fashion week en tu armario! 💃 Este mes, a lucir lo que tienes.", "Modelazo, sí. Pero tu cuenta va en chándal. 😬", "Vas a ir más guapo/a que nadie… y más pobre que nadie. 😅",
           "Tu armario ya no cierra. Tu cartera tampoco. 🚪"] },
  salud: { lim:[20, 80],
    bajo: ["La salud es lo primero. 💊", "Cuidarse siempre es buena inversión.", "Pregunta por el genérico, suele ser más barato. 😉"],
    medio:["Cuídate, que es la mejor inversión. ❤️", "Salud ante todo. ¡Ánimo!"],
    alto: ["Gasto gordo pero necesario. ¡Que te mejores! 🩺", "La salud no tiene precio… aunque a veces lo parezca. 💪"] },
  regalos: { lim:[15, 40],
    bajo: ["Detalle con cariño, y sin pasarse. Así. 💝", "Lo que cuenta es el detalle, no el precio. 🎁", "Apunta los cumpleaños del año y planifícalos: ahorro seguro. 📅"],
    medio:["Buen regalo. Para el próximo, juntaos varios y sale más barato. 🤝", "Generoso/a. Planifica los regalos del año y no habrá sustos. 📅", "Un regalo hecho a mano vale más y cuesta menos. 🏠", "Regalar es precioso. Fijarte un tope, también. 🎯"],
    alto: ["¡Regalazo! La próxima vez, regalo hecho a mano. 😉", "Generosidad nivel Papá Noel. 🎅"] },
  suscripciones: { lim:[8, 15],
    bajo: ["Cuota pequeña, pero se cobra cada mes. ¿La usas de verdad? 📺", "Las suscripciones pequeñas suman. Haz recuento. 🧮", "¿Y si turnas plataformas en vez de tenerlas todas? 🔄"],
    medio:["¿Cuántas plataformas tienes ya? Haz repaso. 🧐", "Plan familiar compartido = mitad de precio. 🤝", "Si llevas un mes sin usarla, ¡fuera! ✂️", "Esto al año son más de 100 €. ¿Compensa? 🤔"],
    alto: ["Suscripción cara. Si no la usas todas las semanas, ¡fuera! ✂️", "Esa cuota pesa. ¿Hay un plan más barato?"] },
  trabajo: { lim:[20, 80],
    bajo: ["Material de trabajo: inversión, no gasto. 💼", "Herramienta pequeña, gran ayuda.", "Bien. Guarda el ticket, que puede desgravar. 🧾"],
    medio:["Herramientas nuevas, más ganas de trabajar. 💪", "Inversión en lo tuyo. Que dé frutos. 🌱"],
    alto: ["Inversión potente. ¡Que se note en los bolsillos pronto! 📈", "Gasto de trabajo gordo: guarda la factura. 🧾", "A por más trabajo para amortizarlo. 💼🔥"] },
  belleza: { lim:[10, 25],
    bajo: ["Mimo pequeño. Que no se convierta en costumbre semanal. 😉", "Barato, bien. ¿Probaste a hacerlo en casa? 💅", "Poco gasto. Las marcas blancas de cosmética son buenísimas. 🧴", "Gasto pequeño, pero los mimos sueltos suman al mes. 👀", "Bien de precio. Que el próximo sea casero. 🌸"],
    medio:["Ojo, esto ya suma. ¿Y la próxima en casa? 💅", "Mimo apuntado. Espacia las citas y ahorrarás un pico. 📅", "¿Has probado en una academia? Mucho más barato. 💇‍♀️", "Las marcas blancas de cosmética son buenísimas. 🧴", "Guapa sí, pero que no sea cada semana. 😉", "Esto cada mes es mucho al año. Piénsalo. 🧮"],
    alto: ["¡Sesión de belleza nivel alfombra roja! 🌟 Este mes, mimos caseros.", "Vas a estar espectacular… y tu cuenta, en recuperación. 😅",
           "Eso es un tratamiento de estrella de Hollywood. 🎬", "Guapísima, pero ese gasto pide una semanita de manicura casera. 💅"] },
  ahorro: { lim:[50, 200],
    bajo: ["¡Bien! Todo lo que se guarda, cuenta. 🐷", "Pequeño ahorro, gran hábito. 👏", "La hucha sonríe. 😊", "Poco a poco se llena el cerdito. 🐖"],
    medio:["¡Eso es ahorrar con cabeza! 💪", "Tu yo del futuro te está aplaudiendo. 👏👏", "¡Qué disciplina! Sigue así. 🏆", "Ahorro serio. ¡Crack total! 😎"],
    alto: ["¡OLÉ! Ahorro de campeón/a. 🏆🐷", "¡Madre mía, qué hucha! Eres un ejemplo. 🌟", "Ese ahorro es para enmarcarlo. 🖼️", "¡Así se construye un colchón! 🛏️💰"] },
  inversion: { lim:[50, 300],
    bajo: ["Toda inversión empieza con un primer paso. 📈", "¡Poner el dinero a trabajar mola! 💼", "Pequeña inversión, grandes intenciones. 🌱"],
    medio:["Inversión apuntada. ¡A esperar que crezca! 🌳", "Pensando en el futuro, así me gusta. 🔮", "Dinero trabajando para ti. 💪"],
    alto: ["¡Inversor/a de los buenos! 📈🚀", "Gran inversión. Paciencia y a largo plazo. ⏳", "¡Eso es mirar al futuro con ganas! 🌟"] },
  otros: { lim:[15, 40],
    bajo: ["Gastito apuntado. Los «otros» pequeños son los que se escapan. 👀", "Todo apuntado. ¿Era necesario? Solo pregunto. 🤔", "Bien por apuntarlo. Ponle nota y sabrás dónde se va. ✍️"],
    medio:["¿Qué ha sido esto? Ponle nota, detective. 🔎", "Gasto «otros»… sospechoso. 🤨", "Revisa si era necesario. Lo que no tiene categoría suele sobrar. 🤔"],
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
/* Frases de Viajes y Deporte */
FRASES.viajes = { lim:[50, 200],
  bajo: ["Escapada barata. ¡Así se viaja! Y para la próxima, hucha de viajes. 🐷", "Poco gasto de viaje. Reservar con tiempo ayuda a que siga así. 📅", "Bien. Desayunar en el alojamiento y comer de súper te lo deja aún más bajo. ☕", "Viajar barato es posible. Que siga así. 🎒"],
  medio:["Viaje apuntado. ¿Comparaste precios? A veces cambia mucho. 🔍", "Reservar con tiempo la próxima vez sale más barato. 📅", "Desayunar en el alojamiento y llevar agua: ahorro fácil. ☕", "Abre una meta «Viajes» y ve guardando antes. 🐷✈️", "Maleta lista, cartera más ligera. A la vuelta, modo ahorro. 🔋"],
  alto: ["¡Viaje de los gordos! 🌍 Ahora, unos meses de ahorro.", "Eso no es un viaje, es una expedición. 🗺️💸", "¡Qué pasada de viaje! Tu cuenta también se ha ido de vacaciones. 🏝️",
         "Recuerdos para toda la vida… y gasto para todo el trimestre. 😅", "¡Vuelta al mundo! O casi. 🌎", "Viajazo apuntado. Para el próximo, abre una hucha de viajes. 🐷✈️",
         "Has viajado a lo grande. A la vuelta, modo ahorro ON. 🔋"] };
FRASES.deporte = { lim:[10, 30],
  bajo: ["Partido barato. Pista a medias, ¡así sí! 🎾", "Poco gasto. Reserva en horas valle y aún menos. 🕐", "Bien: deporte sin arruinarse. Que las cañas de después no lo estropeen. 🍻"],
  medio:["Reserva en horas valle y te sale más barato. 🕐", "Partido apuntado. ¿Ganaste o pagaste las cañas? 🍻", "¡Que no se te escape ninguna bola, que cuestan! 🎾", "Esto cada semana es un pico al mes. Ojo. 🧮", "Divide pista entre 4 siempre. Siempre. 🤝"],
  alto: ["¡Pala nueva! Ahora no hay excusa para perder. 🏓🔥", "Eso cuesta más que la pista de Galán y Lebrón. 😂",
         "Equipación de profesional… ahora juega como uno. 🏆", "Si no ganas el próximo partido con esto, es culpa tuya, no de la pala. 😜",
         "Gasto de World Padel Tour. Este mes, el resto con calma. 🧘", "¡Menudo fichaje de material! A rentabilizarlo en la pista. 💪",
         "Con eso alquilabas pista para medio año. Solo lo dejo caer. 👀"] };

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

/* ---------------------------------------------------------------------
   MÁS FRASES (se suman a las de arriba)
   --------------------------------------------------------------------- */
const FRASES_EXTRA = {
  gasolina: {
    bajo: [],
    medio:[],
    alto: ["¡Ay, mi madre! El surtidor ha hecho caja contigo. 💸", "Ese coche no tiene depósito, tiene una piscina. 🏊",
           "Has llenado el depósito… y vaciado la cartera. Empate técnico. 🥲", "¿Gasolina o perfume caro? Porque el precio es parecido. 💎",
           "Este repostaje merece un minuto de silencio. 🕯️", "Con lo que has echado, el coche debería hacer la compra solo. 🤖",
           "Uff, de aquí a la luna y vuelta. 🌙", "Vale, ahora toca transporte público una temporadita. 🚇",
           "Tu coche acaba de cenar mejor que tú esta semana. 🍽️"] },
  comer: {
    bajo: [],
    medio:[],
    alto: ["¡Qué fiestorro gastronómico! Mañana, arroz blanco. 🍚", "¿Has pedido toda la carta? Porque lo parece. 📜",
           "Esa cuenta ha engordado más que tú. 😂", "Comilona épica apuntada. Ahora, semana de táper sí o sí.",
           "Michelin estaría orgulloso. Tu banco, no tanto. ⭐", "Con eso hacías la compra de la semana. Lo digo y me voy. 🏃",
           "Restaurante 1 – Cartera 0. ⚽",
           "Rico, pero esta semana cocinas tú. Sin excusas. 👩‍🍳"] },
  super: {
    bajo: [],
    medio:[],
    alto: ["¡Has comprado como si viniera el apocalipsis! 🧟", "Carro lleno hasta arriba. A cocinar todo, ¿eh?",
           "¿Te has llevado el súper entero a casa? 🏪➡️🏠", "Compra gorda. Que nada acabe en la basura. 🗑️❌",
           "Esa compra da para un mes de cenas. ¡Aprovéchala!", "Ticket kilométrico. Revísalo, a veces cuelan errores. 🧾"] },
  casa: {
    bajo: ["Mantener la casa a punto sin gastar mucho. ¡Bravo! 🧹", "Gastillo de hogar, todo en orden.", "Casa feliz por poco. 😊"],
    medio:["La casa siempre pide algo. ¡Paciencia! 🏠", "¿Has comparado tarifas de luz este año? ⚡",
           "Bombillas LED y regletas con interruptor: ahorro asegurado. 💡", "Factura normalita. Que no suba, ¿eh?"],
    alto: ["El piso se ha llevado un buen bocado. 🦈", "Mes de facturas gordas. Toca apretarse un poco.",
           "Ese gasto de casa duele, pero hay que pagarlo. 💪", "Tu casa te quiere… pero te sale cara. 🏡💸",
           "Revisa si se puede negociar alguna de esas facturas. 📞"] },
  transporte: {
    bajo: [],
    medio:[],
    alto: ["¡Ese coche está más mimado que un bebé! 👶🚗", "Multa, ITV o taller… duele igual. 😣",
           "Mes de coche caro. Que no se repita pronto. 🤞", "Transporte de lujo. ¿Ibas en limusina? 🥂",
           "Compara seguros y talleres: hay mucha diferencia. 🔍"] },
  ocio: {
    bajo: [],
    medio:[],
    alto: ["¡Fiesta nivel festival! 🎪 Ahora, unos días tranquilitos.", "Has vivido a lo grande. Ahora, a vivir a lo pequeño. 🐜",
           "Planazo carísimo. Que haya merecido la pena. 🤩", "Tu cartera ha salido de fiesta y no ha vuelto. 🍾",
           "Esta semana: paseos, pelis en casa y juegos de mesa. 🎲", "¡Menudo despliegue! Mañana, modo ahorro activado. 🔋"] },
  ropa: {
    bajo: [],
    medio:[],
    alto: ["Has renovado el armario entero, ¿no? 🛍️🛍️🛍️", "Ropa para un año… y gasto para un mes. 😬",
           "Pasarela de moda en casa, crisis en la cartera. 💸", "Ese armario va a necesitar ampliación. 🚪",
           "Ahora toca lucir lo que tienes. Cero compras este mes. 🙅", "¡Qué estilazo! A ver si dura hasta fin de mes. 😅"] },
  salud: {
    bajo: ["Cuidarse siempre merece la pena. 🌿", "Pequeño gasto de salud, gran inversión.", "Salud primero, siempre. 🍀"],
    medio:["La salud no se negocia. ¡Ánimo! 💪", "Pregunta siempre por el genérico en la farmacia. 💊", "Bien hecho por cuidarte. ❤️"],
    alto: ["Gasto gordo, pero la salud es lo primero. 🙏", "¡Que te mejores pronto! Eso es lo importante. 🌈",
           "Revisa si el seguro cubre algo de esto. 📋", "Cuídate mucho. El dinero va y viene. 💚"] },
  regalos: {
    bajo: [],
    medio:[],
    alto: ["¡Regalazo nivel Reyes Magos! 👑👑👑", "Qué generosidad… tu cartera está llorando de emoción. 😭",
           "Ese regalo se recordará años. Y tu cuenta, también. 😅", "El próximo, una experiencia casera: vale más y cuesta menos. 🏠",
           "¡Te has pasado de bueno/a! 😇"] },
  suscripciones: {
    bajo: [],
    medio:[],
    alto: ["Suscripción de lujo. ¿De verdad compensa? 💎", "Esa cuota es más cara que un menú del día. 🍽️",
           "Revisa si hay plan anual más barato. 📆", "Cuota gorda cada mes… ¡vigílala de cerca! 👀"] },
  trabajo: {
    bajo: ["Material para currar. ¡Bien invertido! 🛠️", "Pequeña herramienta, gran trabajo.", "Inversión en lo tuyo. ¡Bravo! 👏"],
    medio:["Herramienta de trabajo apuntada. Guarda la factura. 🧾", "Invertir en tu trabajo siempre suma. 📈",
           "Material nuevo, ganas nuevas. 💪", "¡A sacarle partido desde mañana!"],
    alto: ["Inversión fuerte en tu trabajo. ¡Que dé frutos! 🍎", "Gasto gordo de curro. Seguro que lo amortizas. 💼",
           "Esto es apostar por ti. ¡Bien! 🏆", "Guarda bien la factura, que esto desgrava seguro. 🧾"] },
  belleza: {
    bajo: [],
    medio:[],
    alto: ["¡Tratamiento VIP! Ahora, mascarillas caseras una temporada. 🥒", "Belleza de revista, gasto de revista también. 📰",
           "¡Estás para portada! Tu cuenta, para urgencias. 🚑😂", "Gasto de princesa. Este mes, modo cenicienta. 👠",
           "Esto es un spa, no una peluquería. 🧖‍♀️", "Divina… y con la cartera a dieta a partir de hoy. 🥗"] },
  ahorro: {
    bajo: ["¡Cada euro guardado es una victoria! 🥇", "Ahorrar poco también es ahorrar. 💚", "La hucha lo nota. ¡Gracias! 🐷",
           "Paso a paso se llega lejos. 👣", "¡Así empiezan los grandes ahorradores! 🌱"],
    medio:["¡Ahorro del bueno! Sigue así. 🚀", "Tu cerdito está feliz. 🐷💕", "Qué fuerza de voluntad. ¡Admirable! 🦸",
           "Guardar dinero es la mejor inversión en tranquilidad. 😌", "¡Eso es tener la cabeza bien amueblada! 🧠"],
    alto: ["¡ESPECTACULAR! Esto es ahorrar de verdad. 🎉🐷", "¡Has alimentado al cerdito para todo el año! 🐖",
           "Ahorro de récord. ¡Medalla de oro! 🥇", "Tu yo del futuro te va a invitar a algo muy rico. 🍾",
           "¡Qué crack! Así se consigue lo que te propongas. 💪", "Colchón de seguridad: ON. 🛡️"] },
  inversion: {
    bajo: ["Primer paso del inversor. ¡A por ello! 🚀", "Invertir poco a poco es de sabios. 🦉", "La constancia es la clave. 🔑"],
    medio:["¡Dinero trabajando mientras tú descansas! 😴💰", "Invertir con cabeza y paciencia. 🧘", "Buena aportación. ¡A largo plazo! 📅"],
    alto: ["¡Inversión potente! Wall Street tiembla. 🏦", "Eso es pensar a lo grande. 🌍", "¡Gran movimiento! Paciencia y no mires cada día. 🙈",
           "Futuro millonario en construcción. 🏗️💰"] },
  otros: {
    bajo: [],
    medio:[],
    alto: ["Gasto misterioso XL. ¿Algo que contarme? 👀", "Eso no es un gasto, es un enigma. 🧩", "«Otros» de los gordos. ¡Ponle nota! ✍️"] }
};
const FRASES_INGRESO_EXTRA = {
  bajo: ["¡Bienvenido, dinerito! 👋💶", "Poco, pero alegra. 😊", "Ingreso pequeñito, gran sonrisa. 😁", "¡Al cerdito directo! 🐷",
         "Todo cuenta, hasta lo más pequeño. 🧮", "¡Eso suma para el mes! ➕"],
  medio:["¡Dinero fresquito! Ahora a cuidarlo. 🌿", "¡Bien trabajado! Te lo has ganado. 🏅", "¡Qué gusto ver esto entrar! 🤩",
         "Guarda un poquito antes de gastarlo. 😉", "¡Ingreso apuntado! El mes pinta mejor. 📈", "¡Eso es! A seguir así. 💪",
         "Tus cuentas sonríen hoy. 😃"],
  alto: ["¡LLUVIA DE EUROS! ☔💶💶💶", "¡Día de cobro, día de alegría! 🥳", "¡Vaya ingreso! Primero ahorra, luego celebra. 🐷🎉",
         "¡El trabajo duro da sus frutos! 🍇", "¡Mes salvado! Ahora, a gastarlo con cabeza. 🧠", "¡Qué subidón! Aparta un trozo para ti del futuro. 🔮",
         "¡Cuenta llena, corazón contento! ❤️", "¡Ingreso de los buenos! No lo fundas en dos días, ¿eh? 😜"]
};
// Junta las frases extra con las de arriba
for (const cat in FRASES_EXTRA) for (const n of ["bajo","medio","alto"]) if (FRASES[cat]) FRASES[cat][n] = FRASES[cat][n].concat(FRASES_EXTRA[cat][n] || []);
for (const n of ["bajo","medio","alto"]) FRASES_INGRESO[n] = FRASES_INGRESO[n].concat(FRASES_INGRESO_EXTRA[n]);
