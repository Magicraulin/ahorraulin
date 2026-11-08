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
