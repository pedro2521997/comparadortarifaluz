// Textos de las páginas de carburantes de la web global (datos semanales de la Comisión Europea).
// Un idioma por país; Bélgica usa neerlandés y Austria alemán. Las frases son plantillas completas por idioma.

import type { Idioma } from "./textos";
import type { ProductoUE } from "../../../web/src/lib/compartido/carburantes-ue";

/**
 * Los países que reciben estas funciones ya llevan la preposición o el caso («in Deutschland», «au Portugal»,
 * «na Alemanha», «Suomessa»): ver enPais().
 */
export interface TextosCarburantes {
  slugPrecios: string;
  slugCalefaccion: string;
  slugEuropa: string;
  productos: Record<ProductoUE, string>;
  tituloPais: (enP: string) => string;
  tituloCalefaccion: (enP: string) => string;
  tituloEuropa: string;
  tituloDestino: (enD: string) => string;
  /** «Woche vom 19. Oktober 2026», «vecka 43» */
  semanaDel: (fecha: string, numero: number) => string;
  porLitro: string;
  semanaAnterior: string;
  haceUnAno: string;
  tresAnos: string;
  vecinos: string;
  pais: string;
  litros1000: string;
  /** Conjunción de las listas («und», «et») */
  y: string;
  leadPais: (o: { enP: string; precio: string; puesto: number; total: number; imp: string | null }) => string;
  leadCal: (o: { enP: string; precio: string; mil: string }) => string;
  leadDestino: (o: { enD: string; precio: string; casaEn: string; precioCasa: string; consejo: string }) => string;
  llenarAntes: string;
  repostarAlli: string;
  daIgual: string;
  rankDestino: (nombre: string, n: number, total: number) => string;
  pPrecio: (enP: string) => string;
  rPrecio: (o: { enP: string; precio: string; semana: string; puesto: number; total: number }) => string;
  pDiesel: (enP: string) => string;
  rDiesel: (o: { enP: string; precio: string; semana: string }) => string;
  pImpuestos: (enP: string) => string;
  rImpuestos: (enP: string, pct: string) => string;
  rDestino: (o: { dif: string; mas: boolean; casaEn: string }) => string;
  pBarato: string;
  rBarato: (lista: string, caro: string) => string;
  pCal: (enP: string) => string;
  rCal: (o: { enP: string; precio: string; semana: string; mil: string }) => string;
  pCuandoCal: string;
  /** `mes` en nominativo («Dezember», «joulukuu») */
  rCuandoCal: (mes: string) => string;
  consejosCalefaccion: string[];
  consejosCarburante: string[];
  consejosT: string;
  consejosCalT: string;
  preguntasT: string;
  fuente: string;
  fuenteNombre: string;
  verTodos: string;
  aviso: string;
  avisoCal: string;
}

const may = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ordFr = (n: number) => (n === 1 ? "1er" : `${n}e`);
const artIt = (pct: string) => (/^(1|8|11|18|8\d)(\D|$)/.test(pct) ? `l'${pct}` : `il ${pct}`);
/** Francés: «que» + «en France» → «qu'en France» */
const queFr = (x: string) => (/^[aàeéiou]/i.test(x) ? `qu'${x}` : `que ${x}`);

export const TEXTOS_C: Partial<Record<Idioma, TextosCarburantes>> = {
  // España: las URL son las que tenía la web española (comparadortarifaluz.es), que redirige aquí.
  es: {
    slugPrecios: "precio-gasolina-hoy", slugCalefaccion: "precio-gasoleo-calefaccion", slugEuropa: "carburantes-europa",
    productos: { euro95: "Gasolina 95", diesel: "Gasóleo", calefaccion: "Gasóleo de calefacción", glp: "GLP (autogás)" },
    tituloPais: (p) => `Precio de la gasolina ${p}`, tituloCalefaccion: (p) => `Precio del gasóleo de calefacción ${p}`, tituloEuropa: "Precio de la gasolina en Europa", tituloDestino: (d) => `Precio de la gasolina ${d}`,
    semanaDel: (f) => `semana del ${f}`, porLitro: "Precio por litro", semanaAnterior: "Semana anterior", haceUnAno: "Hace un año", tresAnos: "Los últimos tres años",
    vecinos: "Precio en los países vecinos", pais: "País", litros1000: "1.000 litros", y: "y",
    leadPais: (o) => `La gasolina 95 cuesta ${o.enP} ${o.precio} de media, el puesto ${o.puesto} de ${o.total} en la UE${o.imp ? `. Los impuestos se llevan el ${o.imp} del precio` : ""}.`,
    leadCal: (o) => `El gasóleo de calefacción cuesta ${o.enP} ${o.precio} de media: unos ${o.mil} por 1.000 litros.`,
    leadDestino: (o) => `La gasolina 95 cuesta ${o.enD} ${o.precio} de media, frente a ${o.precioCasa} ${o.casaEn}. ${o.consejo}`,
    llenarAntes: "Lo mejor es cruzar la frontera con el depósito lleno y repostar allí solo lo justo.",
    repostarAlli: "Merece la pena llenar allí.",
    daIgual: "La diferencia es pequeña. Importa más la gasolinera que elijas: en la autopista casi siempre es más cara.",
    rankDestino: (_n, k, t) => `Es el puesto ${k} de ${t} en la UE (el 1 es el más barato).`,
    pPrecio: (p) => `¿Cuánto cuesta la gasolina ${p}?`,
    rPrecio: (o) => `La gasolina 95 cuesta ahora ${o.enP} ${o.precio} de media (${o.semana}). Es el puesto ${o.puesto} de ${o.total} en la UE, donde el 1 es el más barato.`,
    pDiesel: (p) => `¿Cuánto cuesta el gasóleo ${p}?`,
    rDiesel: (o) => `El gasóleo cuesta ${o.enP} ${o.precio} de media (${o.semana}).`,
    pImpuestos: (p) => `¿Cuántos impuestos lleva la gasolina ${p}?`,
    rImpuestos: (p, x) => `${may(p)}, el impuesto de hidrocarburos y el IVA se llevan alrededor del ${x} de lo que se paga por la gasolina 95.`,
    rDestino: (o) => `Llenar un depósito de 50 litros de gasolina 95 cuesta allí unos ${o.dif} ${o.mas ? "más" : "menos"} que ${o.casaEn}.`,
    pBarato: "¿Dónde es más barato repostar en Europa?",
    rBarato: (l, c) => `Ahora mismo la gasolina 95 es más barata ${l}, y más cara ${c}.`,
    pCal: (p) => `¿Cuánto cuesta el gasóleo de calefacción ${p}?`,
    rCal: (o) => `El gasóleo de calefacción cuesta ahora ${o.enP} ${o.precio} de media (${o.semana}). 1.000 litros salen por unos ${o.mil}.`,
    pCuandoCal: "¿Cuándo está más barato el gasóleo de calefacción?",
    rCuandoCal: (m) => `En los últimos tres años, el mes más barato de media ha sido ${m}. En general compensa llenar el depósito fuera de la temporada de calefacción.`,
    consejosCalefaccion: ["Comprar fuera de temporada: en primavera y verano suele estar más barato.", "Pedirlo junto con los vecinos: los pedidos grandes bajan el precio por litro.", "Pedir varios presupuestos el mismo día.", "Revisar la caldera cada año: una caldera mal ajustada gasta un 5–10 % más."],
    consejosCarburante: ["Ir más despacio: a 100 km/h en vez de 120 se gasta un 15–20 % menos.", "Revisar la presión de las ruedas una vez al mes.", "Quitar el cofre del techo y el portabicis cuando no se usan.", "Comparar gasolineras: en la misma ciudad suele haber 10–20 céntimos por litro de diferencia."],
    consejosT: "Cómo gastar menos en carburante", consejosCalT: "Cómo pagar menos por el gasóleo de calefacción", preguntasT: "Preguntas frecuentes",
    fuente: "Fuente: Comisión Europea, Boletín Petrolero semanal (precios medios con impuestos).", fuenteNombre: "Comisión Europea (Boletín Petrolero)",
    verTodos: "Comparar todos los países", aviso: "Precios medios nacionales: en cada gasolinera el precio puede variar.", avisoCal: "Precios medios nacionales: el precio final depende del distribuidor y de la cantidad.",
  },
  de: {
    slugPrecios: "spritpreise", slugCalefaccion: "heizoelpreise", slugEuropa: "spritpreise-europa",
    productos: { euro95: "Super E5", diesel: "Diesel", calefaccion: "Heizöl", glp: "Autogas (LPG)" },
    tituloPais: (p) => `Spritpreise ${p}`, tituloCalefaccion: (p) => `Heizölpreise ${p}`, tituloEuropa: "Spritpreise in Europa", tituloDestino: (d) => `Spritpreise ${d}`,
    semanaDel: (f) => `Woche vom ${f}`, porLitro: "Preis pro Liter", semanaAnterior: "Vorwoche", haceUnAno: "vor einem Jahr", tresAnos: "Die letzten drei Jahre",
    vecinos: "Spritpreise in den Nachbarländern", pais: "Land", litros1000: "1.000 Liter", y: "und",
    leadPais: (o) => `Super E5 kostet ${o.enP} im Schnitt ${o.precio}. Im EU-Vergleich ist das Platz ${o.puesto} von ${o.total}${o.imp ? `, und ${o.imp} des Preises entfallen auf Steuern und Abgaben` : ""}.`,
    leadCal: (o) => `Heizöl kostet ${o.enP} im Schnitt ${o.precio}. Für 1.000 Liter sind das rund ${o.mil}.`,
    leadDestino: (o) => `Super E5 kostet ${o.enD} im Schnitt ${o.precio}, ${o.casaEn} ${o.precioCasa}. ${o.consejo}`,
    llenarAntes: "Am besten fährt man vollgetankt über die Grenze und tankt dort nur, was man wirklich braucht.",
    repostarAlli: "Es lohnt sich also, dort zu tanken.",
    daIgual: "Der Unterschied ist gering. Mehr macht die Wahl der Tankstelle aus: An der Autobahn ist es fast immer am teuersten.",
    rankDestino: (_n, k, t) => `Im EU-Vergleich ist das Platz ${k} von ${t} (Platz 1 ist am günstigsten).`,
    pPrecio: (p) => `Was kostet Benzin ${p}?`,
    rPrecio: (o) => `Super E5 kostet ${o.enP} derzeit im Schnitt ${o.precio} (${o.semana}). Damit liegt das Land auf Platz ${o.puesto} von ${o.total} in der EU, wobei Platz 1 der günstigste ist.`,
    pDiesel: (p) => `Was kostet Diesel ${p}?`,
    rDiesel: (o) => `Diesel kostet ${o.enP} im Schnitt ${o.precio} (${o.semana}).`,
    pImpuestos: (p) => `Wie hoch ist der Steueranteil am Benzinpreis ${p}?`,
    rImpuestos: (p, x) => `Bei Super E5 entfallen ${p} rund ${x} des Preises auf Energiesteuer, CO₂-Abgabe und Mehrwertsteuer.`,
    rDestino: (o) => `Eine Tankfüllung mit 50 Litern Super E5 kostet dort etwa ${o.dif} ${o.mas ? "mehr" : "weniger"} als ${o.casaEn}.`,
    pBarato: "Wo ist Tanken in Europa am günstigsten?",
    rBarato: (l, c) => `Super E5 ist derzeit ${l} am günstigsten, ${c} am teuersten.`,
    pCal: (p) => `Was kostet Heizöl ${p}?`,
    rCal: (o) => `Heizöl kostet ${o.enP} derzeit im Schnitt ${o.precio} (${o.semana}). 1.000 Liter kosten damit rund ${o.mil}.`,
    pCuandoCal: "Wann ist Heizöl am günstigsten?",
    rCuandoCal: (m) => `In den letzten drei Jahren war Heizöl im ${m} im Schnitt am günstigsten. Grundsätzlich lohnt es sich, außerhalb der Heizperiode zu bestellen.`,
    consejosCalefaccion: ["Außerhalb der Heizperiode bestellen: Im Frühjahr und Sommer ist Heizöl oft günstiger.", "Mit den Nachbarn gemeinsam bestellen: Größere Mengen drücken den Literpreis.", "Am selben Tag mehrere Angebote einholen.", "Den Brenner jedes Jahr warten lassen: Ein schlecht eingestellter Brenner verbraucht 5 bis 10 % mehr."],
    consejosCarburante: ["Langsamer fahren: Mit 110 statt 130 km/h verbraucht man 15 bis 20 % weniger.", "Einmal im Monat den Reifendruck prüfen.", "Dachbox und Fahrradträger abnehmen, wenn sie nicht gebraucht werden.", "Preise vergleichen: Zwischen Tankstellen in derselben Stadt liegen oft 10 bis 20 Cent pro Liter."],
    consejosT: "So sparst du beim Tanken", consejosCalT: "So zahlst du weniger für Heizöl", preguntasT: "Häufige Fragen",
    fuente: "Quelle: Europäische Kommission, Weekly Oil Bulletin (Durchschnittspreise inklusive Steuern).", fuenteNombre: "Europäische Kommission (Weekly Oil Bulletin)",
    verTodos: "Alle Länder vergleichen", aviso: "Landesweite Durchschnittspreise; an der einzelnen Tankstelle kann der Preis abweichen.", avisoCal: "Landesweite Durchschnittspreise; je nach Händler und Liefermenge kann der Preis abweichen.",
  },
  fr: {
    slugPrecios: "prix-carburants", slugCalefaccion: "prix-fioul", slugEuropa: "prix-carburants-europe",
    productos: { euro95: "Sans plomb 95", diesel: "Gazole", calefaccion: "Fioul domestique", glp: "GPL" },
    tituloPais: (p) => `Prix des carburants ${p}`, tituloCalefaccion: (p) => `Prix du fioul domestique ${p}`, tituloEuropa: "Prix des carburants en Europe", tituloDestino: (d) => `Prix de l'essence ${d}`,
    semanaDel: (f) => `semaine du ${f}`, porLitro: "Prix au litre", semanaAnterior: "semaine précédente", haceUnAno: "il y a un an", tresAnos: "Les trois dernières années",
    vecinos: "Dans les pays voisins", pais: "Pays", litros1000: "1 000 litres", y: "et",
    leadPais: (o) => `${may(o.enP)}, le sans plomb 95 coûte en moyenne ${o.precio}, ce qui place le pays au ${ordFr(o.puesto)} rang sur ${o.total} dans l'UE${o.imp ? `. Les taxes représentent ${o.imp} du prix` : ""}.`,
    leadCal: (o) => `${may(o.enP)}, le fioul domestique coûte en moyenne ${o.precio}, soit environ ${o.mil} pour 1 000 litres.`,
    leadDestino: (o) => `${may(o.enD)}, le sans plomb 95 coûte en moyenne ${o.precio}, contre ${o.precioCasa} ${o.casaEn}. ${o.consejo}`,
    llenarAntes: "Mieux vaut faire le plein avant de passer la frontière.",
    repostarAlli: "Il vaut donc la peine d'y faire le plein.",
    daIgual: "L'écart est faible : le choix de la station compte davantage, et les stations d'autoroute restent les plus chères.",
    rankDestino: (_n, k, t) => `Avec ce prix, le pays se classe ${ordFr(k)} sur ${t} dans l'UE, du moins cher au plus cher.`,
    pPrecio: (p) => `Combien coûte l'essence ${p} ?`,
    rPrecio: (o) => `${may(o.enP)}, le sans plomb 95 coûte en ce moment ${o.precio} en moyenne (${o.semana}), ce qui classe le pays ${ordFr(o.puesto)} sur ${o.total} dans l'UE, du moins cher au plus cher.`,
    pDiesel: (p) => `Combien coûte le gazole ${p} ?`,
    rDiesel: (o) => `${may(o.enP)}, le gazole coûte en moyenne ${o.precio} (${o.semana}).`,
    pImpuestos: (p) => `Quelle part du prix de l'essence correspond aux taxes ${p} ?`,
    rImpuestos: (p, x) => `${may(p)}, les taxes (accise et TVA) représentent environ ${x} du prix du sans plomb 95.`,
    rDestino: (o) => `Un plein de 50 litres de sans plomb 95 y coûte environ ${o.dif} de ${o.mas ? "plus" : "moins"} ${queFr(o.casaEn)}.`,
    pBarato: "Où le carburant est-il le moins cher en Europe ?",
    rBarato: (l, c) => `Le sans plomb 95 est actuellement le moins cher ${l}, et le plus cher ${c}.`,
    pCal: (p) => `Combien coûte le fioul domestique ${p} ?`,
    rCal: (o) => `${may(o.enP)}, le fioul domestique coûte en moyenne ${o.precio} (${o.semana}), soit environ ${o.mil} pour 1 000 litres.`,
    pCuandoCal: "Quand le fioul est-il le moins cher ?",
    rCuandoCal: (m) => `Sur les trois dernières années, c'est en ${m} que le fioul a été le moins cher en moyenne. De manière générale, mieux vaut commander en dehors de la saison de chauffe.`,
    consejosCalefaccion: ["Commander hors saison : au printemps et en été, le fioul est souvent moins cher.", "Grouper sa commande avec des voisins pour faire baisser le prix au litre.", "Demander plusieurs devis le même jour.", "Faire entretenir la chaudière chaque année : un brûleur mal réglé consomme 5 à 10 % de plus."],
    consejosCarburante: ["Rouler moins vite : à 110 km/h au lieu de 130, on consomme 15 à 20 % de moins.", "Vérifier la pression des pneus une fois par mois.", "Retirer le coffre de toit quand il ne sert pas.", "Comparer les stations : dans une même ville, l'écart dépasse souvent 10 centimes par litre."],
    consejosT: "Pour payer moins cher à la pompe", consejosCalT: "Pour payer son fioul moins cher", preguntasT: "Questions fréquentes",
    fuente: "Source : Commission européenne, Weekly Oil Bulletin (prix moyens TTC).", fuenteNombre: "Commission européenne (Weekly Oil Bulletin)",
    verTodos: "Comparer tous les pays", aviso: "Prix moyens nationaux : à la pompe, le prix varie d'une station à l'autre.", avisoCal: "Prix moyens nationaux : le prix réel dépend du fournisseur et de la quantité livrée.",
  },
  it: {
    slugPrecios: "prezzi-carburanti", slugCalefaccion: "prezzo-gasolio-riscaldamento", slugEuropa: "prezzi-carburanti-europa",
    productos: { euro95: "Benzina", diesel: "Gasolio", calefaccion: "Gasolio da riscaldamento", glp: "GPL" },
    tituloPais: (p) => `Prezzi dei carburanti ${p}`, tituloCalefaccion: (p) => `Prezzo del gasolio da riscaldamento ${p}`, tituloEuropa: "Prezzi dei carburanti in Europa", tituloDestino: (d) => `Prezzo della benzina ${d}`,
    semanaDel: (f) => `settimana del ${f}`, porLitro: "Prezzo al litro", semanaAnterior: "settimana precedente", haceUnAno: "un anno fa", tresAnos: "Gli ultimi tre anni",
    vecinos: "Nei paesi vicini", pais: "Paese", litros1000: "1.000 litri", y: "e",
    leadPais: (o) => `${may(o.enP)} la benzina costa in media ${o.precio}: ${o.puesto}° posto su ${o.total} nell'UE, dal più economico al più caro${o.imp ? `. Tasse e accise pesano per ${artIt(o.imp)} del prezzo` : ""}.`,
    leadCal: (o) => `${may(o.enP)} il gasolio da riscaldamento costa in media ${o.precio}, cioè circa ${o.mil} per 1.000 litri.`,
    leadDestino: (o) => `${may(o.enD)} la benzina costa in media ${o.precio}, ${o.casaEn} ${o.precioCasa}. ${o.consejo}`,
    llenarAntes: "Conviene fare il pieno prima di passare il confine.",
    repostarAlli: "Conviene quindi fare rifornimento lì.",
    daIgual: "La differenza è minima: conta di più scegliere il distributore giusto, e quelli in autostrada sono i più cari.",
    rankDestino: (_n, k, t) => `Con questo prezzo il paese è al ${k}° posto su ${t} nell'UE, dal più economico al più caro.`,
    pPrecio: (p) => `Quanto costa la benzina ${p}?`,
    rPrecio: (o) => `${may(o.enP)} la benzina costa in questo momento ${o.precio} in media (${o.semana}): ${o.puesto}° posto su ${o.total} nell'UE, dal più economico al più caro.`,
    pDiesel: (p) => `Quanto costa il gasolio ${p}?`,
    rDiesel: (o) => `${may(o.enP)} il gasolio costa in media ${o.precio} (${o.semana}).`,
    pImpuestos: (p) => `Quanto pesano le tasse sul prezzo della benzina ${p}?`,
    rImpuestos: (p, x) => `${may(p)} accise e IVA valgono circa ${artIt(x)} del prezzo della benzina.`,
    rDestino: (o) => `Un pieno da 50 litri di benzina lì costa circa ${o.dif} in ${o.mas ? "più" : "meno"} che ${o.casaEn}.`,
    pBarato: "Dove costa meno fare benzina in Europa?",
    rBarato: (l, c) => `In questo momento la benzina costa meno ${l}, e di più ${c}.`,
    pCal: (p) => `Quanto costa il gasolio da riscaldamento ${p}?`,
    rCal: (o) => `${may(o.enP)} il gasolio da riscaldamento costa in media ${o.precio} (${o.semana}), circa ${o.mil} per 1.000 litri.`,
    pCuandoCal: "Quando conviene comprare il gasolio da riscaldamento?",
    rCuandoCal: (m) => `Negli ultimi tre anni il mese più conveniente è stato in media ${m}. In generale conviene ordinare fuori stagione.`,
    consejosCalefaccion: ["Ordinare fuori stagione: in primavera e in estate il gasolio costa spesso meno.", "Fare un ordine insieme ai vicini per spuntare un prezzo al litro più basso.", "Chiedere più preventivi nello stesso giorno.", "Far controllare la caldaia ogni anno: un bruciatore mal regolato consuma il 5–10% in più."],
    consejosCarburante: ["Andare più piano: a 110 km/h invece di 130 si consuma il 15–20% in meno.", "Controllare la pressione delle gomme una volta al mese.", "Togliere il box da tetto quando non serve.", "Confrontare i distributori: nella stessa città la differenza arriva spesso a 10–20 centesimi al litro."],
    consejosT: "Come spendere meno di carburante", consejosCalT: "Come spendere meno per il riscaldamento", preguntasT: "Domande frequenti",
    fuente: "Fonte: Commissione europea, Weekly Oil Bulletin (prezzi medi comprensivi di tasse).", fuenteNombre: "Commissione europea (Weekly Oil Bulletin)",
    verTodos: "Confronta tutti i paesi", aviso: "Prezzi medi nazionali: al distributore il prezzo può variare.", avisoCal: "Prezzi medi nazionali: il prezzo effettivo dipende dal fornitore e dalla quantità.",
  },
  nl: {
    slugPrecios: "brandstofprijzen", slugCalefaccion: "stookolieprijs", slugEuropa: "brandstofprijzen-europa",
    productos: { euro95: "Euro 95", diesel: "Diesel", calefaccion: "Stookolie", glp: "LPG" },
    tituloPais: (p) => `Brandstofprijzen ${p}`, tituloCalefaccion: (p) => `Stookolieprijs ${p}`, tituloEuropa: "Brandstofprijzen in Europa", tituloDestino: (d) => `Benzineprijs ${d}`,
    semanaDel: (f) => `week van ${f}`, porLitro: "Prijs per liter", semanaAnterior: "vorige week", haceUnAno: "een jaar geleden", tresAnos: "De afgelopen drie jaar",
    vecinos: "In de buurlanden", pais: "Land", litros1000: "1.000 liter", y: "en",
    leadPais: (o) => `Euro 95 kost ${o.enP} gemiddeld ${o.precio}. Daarmee staat het land op plek ${o.puesto} van ${o.total} in de EU${o.imp ? `, en ${o.imp} van de prijs bestaat uit belastingen en accijns` : ""}.`,
    leadCal: (o) => `Stookolie kost ${o.enP} gemiddeld ${o.precio}. Voor 1.000 liter betaal je zo'n ${o.mil}.`,
    leadDestino: (o) => `Euro 95 kost ${o.enD} gemiddeld ${o.precio}, ${o.casaEn} ${o.precioCasa}. ${o.consejo}`,
    llenarAntes: "Tank dus vol vóór de grens en tank daar alleen wat je echt nodig hebt.",
    repostarAlli: "Daar tanken loont dus.",
    daIgual: "Het verschil is klein: het tankstation zelf maakt meer uit, en langs de snelweg is het meestal het duurst.",
    rankDestino: (_n, k, t) => `Daarmee staat het land op plek ${k} van ${t} in de EU (1 is het goedkoopst).`,
    pPrecio: (p) => `Wat kost benzine ${p}?`,
    rPrecio: (o) => `Euro 95 kost ${o.enP} op dit moment gemiddeld ${o.precio} (${o.semana}). Dat is plek ${o.puesto} van ${o.total} in de EU, waarbij 1 het goedkoopst is.`,
    pDiesel: (p) => `Wat kost diesel ${p}?`,
    rDiesel: (o) => `Diesel kost ${o.enP} gemiddeld ${o.precio} (${o.semana}).`,
    pImpuestos: (p) => `Hoeveel belasting zit er ${p} in de benzineprijs?`,
    rImpuestos: (p, x) => `Van de prijs van een liter Euro 95 gaat ${p} zo'n ${x} naar accijns en btw.`,
    rDestino: (o) => `Een volle tank van 50 liter Euro 95 kost daar ongeveer ${o.dif} ${o.mas ? "meer" : "minder"} dan ${o.casaEn}.`,
    pBarato: "Waar is tanken in Europa het goedkoopst?",
    rBarato: (l, c) => `Euro 95 is nu het goedkoopst ${l} en het duurst ${c}.`,
    pCal: (p) => `Wat kost stookolie ${p}?`,
    rCal: (o) => `Stookolie kost ${o.enP} gemiddeld ${o.precio} (${o.semana}); 1.000 liter kost dus zo'n ${o.mil}.`,
    pCuandoCal: "Wanneer is stookolie het goedkoopst?",
    rCuandoCal: (m) => `De afgelopen drie jaar was stookolie gemiddeld het goedkoopst in ${m}. Bestel bij voorkeur buiten het stookseizoen.`,
    consejosCalefaccion: ["Bestel buiten het stookseizoen: in het voorjaar en de zomer is stookolie vaak goedkoper.", "Bestel samen met de buren voor een lagere literprijs.", "Vraag op dezelfde dag een paar offertes op.", "Laat de ketel elk jaar onderhouden: een slecht afgestelde brander verbruikt 5 tot 10% meer."],
    consejosCarburante: ["Rustiger rijden: met 100 in plaats van 130 km/u verbruik je al snel 20% minder.", "Controleer elke maand de bandenspanning.", "Haal de dakkoffer eraf als je hem niet gebruikt.", "Vergelijk tankstations: in dezelfde stad scheelt het vaak 10 tot 20 cent per liter."],
    consejosT: "Zo bespaar je op brandstof", consejosCalT: "Zo betaal je minder voor stookolie", preguntasT: "Veelgestelde vragen",
    fuente: "Bron: Europese Commissie, Weekly Oil Bulletin (gemiddelde prijzen inclusief belastingen).", fuenteNombre: "Europese Commissie (Weekly Oil Bulletin)",
    verTodos: "Alle landen vergelijken", aviso: "Landelijke gemiddelden: aan de pomp kan de prijs afwijken.", avisoCal: "Landelijke gemiddelden: de werkelijke prijs hangt af van leverancier en hoeveelheid.",
  },
  pt: {
    slugPrecios: "precos-combustiveis", slugCalefaccion: "preco-gasoleo-aquecimento", slugEuropa: "precos-combustiveis-europa",
    productos: { euro95: "Gasolina 95", diesel: "Gasóleo", calefaccion: "Gasóleo de aquecimento", glp: "GPL Auto" },
    tituloPais: (p) => `Preço dos combustíveis ${p}`, tituloCalefaccion: (p) => `Preço do gasóleo de aquecimento ${p}`, tituloEuropa: "Preço dos combustíveis na Europa", tituloDestino: (d) => `Preço da gasolina ${d}`,
    semanaDel: (f) => `semana de ${f}`, porLitro: "Preço por litro", semanaAnterior: "semana anterior", haceUnAno: "há um ano", tresAnos: "Os últimos três anos",
    vecinos: "Nos países vizinhos", pais: "País", litros1000: "1.000 litros", y: "e",
    leadPais: (o) => `${may(o.enP)}, a gasolina 95 custa em média ${o.precio}, o que coloca o país em ${o.puesto}.º lugar entre ${o.total} na UE${o.imp ? `. Os impostos (ISP e IVA) representam ${o.imp} do preço` : ""}.`,
    leadCal: (o) => `${may(o.enP)}, o gasóleo de aquecimento custa em média ${o.precio}, ou seja, cerca de ${o.mil} por 1.000 litros.`,
    leadDestino: (o) => `${may(o.enD)}, a gasolina 95 custa em média ${o.precio}, contra ${o.precioCasa} ${o.casaEn}. ${o.consejo}`,
    llenarAntes: "Compensa atestar antes de passar a fronteira.",
    repostarAlli: "Compensa, por isso, abastecer lá.",
    daIgual: "A diferença é pequena: conta mais escolher bem o posto, e os de autoestrada são os mais caros.",
    rankDestino: (_n, k, t) => `Com este preço, o país fica em ${k}.º lugar entre ${t} países da UE, do mais barato para o mais caro.`,
    pPrecio: (p) => `Quanto custa a gasolina ${p}?`,
    rPrecio: (o) => `${may(o.enP)}, a gasolina 95 custa neste momento ${o.precio} em média (${o.semana}). Na UE, o país está em ${o.puesto}.º lugar entre ${o.total}, do mais barato para o mais caro.`,
    pDiesel: (p) => `Quanto custa o gasóleo ${p}?`,
    rDiesel: (o) => `${may(o.enP)}, o gasóleo custa em média ${o.precio} (${o.semana}).`,
    pImpuestos: (p) => `Quanto pesam os impostos no preço da gasolina ${p}?`,
    rImpuestos: (p, x) => `${may(p)}, os impostos (ISP e IVA) representam cerca de ${x} do preço da gasolina 95.`,
    rDestino: (o) => `Um depósito de 50 litros de gasolina 95 custa lá cerca de ${o.dif} a ${o.mas ? "mais" : "menos"} do que ${o.casaEn}.`,
    pBarato: "Onde é mais barato abastecer na Europa?",
    rBarato: (l, c) => `Neste momento, a gasolina 95 é mais barata ${l}, e mais cara ${c}.`,
    pCal: (p) => `Quanto custa o gasóleo de aquecimento ${p}?`,
    rCal: (o) => `${may(o.enP)}, o gasóleo de aquecimento custa em média ${o.precio} (${o.semana}), cerca de ${o.mil} por 1.000 litros.`,
    pCuandoCal: "Quando é mais barato comprar gasóleo de aquecimento?",
    rCuandoCal: (m) => `Nos últimos três anos, o mês mais barato foi, em média, ${m}. Em geral, compensa encomendar fora da época de frio.`,
    consejosCalefaccion: ["Encomendar fora da época de frio: na primavera e no verão costuma ser mais barato.", "Juntar a encomenda com os vizinhos para baixar o preço por litro.", "Pedir vários orçamentos no mesmo dia.", "Fazer a manutenção anual da caldeira: um queimador mal regulado gasta 5 a 10% mais."],
    consejosCarburante: ["Conduzir mais devagar: a 100 km/h em vez de 120 gasta-se 15 a 20% menos.", "Verificar a pressão dos pneus todos os meses.", "Tirar a mala de tejadilho quando não for precisa.", "Comparar postos: na mesma cidade, a diferença chega muitas vezes a 10–20 cêntimos por litro."],
    consejosT: "Como gastar menos em combustível", consejosCalT: "Como pagar menos pelo aquecimento", preguntasT: "Perguntas frequentes",
    fuente: "Fonte: Comissão Europeia, Weekly Oil Bulletin (preços médios com impostos).", fuenteNombre: "Comissão Europeia (Weekly Oil Bulletin)",
    verTodos: "Comparar todos os países", aviso: "Preços médios nacionais: em cada posto o preço pode variar.", avisoCal: "Preços médios nacionais: o preço final depende do fornecedor e da quantidade.",
  },
  sv: {
    slugPrecios: "bensinpris", slugCalefaccion: "eldningsolja-pris", slugEuropa: "bensinpris-europa",
    productos: { euro95: "Bensin 95", diesel: "Diesel", calefaccion: "Eldningsolja", glp: "Gasol (LPG)" },
    tituloPais: (p) => `Bensinpris och dieselpris ${p}`, tituloCalefaccion: (p) => `Pris på eldningsolja ${p}`, tituloEuropa: "Bensinpriser i Europa", tituloDestino: (d) => `Bensinpris ${d}`,
    semanaDel: (_f, n) => `vecka ${n}`, porLitro: "Pris per liter", semanaAnterior: "förra veckan", haceUnAno: "för ett år sedan", tresAnos: "De senaste tre åren",
    vecinos: "I grannländerna", pais: "Land", litros1000: "1 000 liter", y: "och",
    leadPais: (o) => `Bensin 95 kostar ${o.enP} i snitt ${o.precio}. Det ger plats ${o.puesto} av ${o.total} i EU${o.imp ? `, och ${o.imp} av priset är skatt` : ""}.`,
    leadCal: (o) => `Eldningsolja kostar ${o.enP} i snitt ${o.precio}. För 1 000 liter blir det ungefär ${o.mil}.`,
    leadDestino: (o) => `Bensin 95 kostar ${o.enD} i snitt ${o.precio}, jämfört med ${o.precioCasa} ${o.casaEn}. ${o.consejo}`,
    llenarAntes: "Tanka alltså fullt innan du kör över gränsen och tanka bara det du behöver där.",
    repostarAlli: "Det lönar sig alltså att tanka där.",
    daIgual: "Skillnaden är liten. Valet av mack betyder mer, och vid motorvägen är det oftast dyrast.",
    rankDestino: (_n, k, t) => `Det ger landet plats ${k} av ${t} i EU (1 är billigast).`,
    pPrecio: (p) => `Vad kostar bensin ${p}?`,
    rPrecio: (o) => `Bensin 95 kostar ${o.enP} just nu i snitt ${o.precio} (${o.semana}). Det är plats ${o.puesto} av ${o.total} i EU, där 1 är billigast.`,
    pDiesel: (p) => `Vad kostar diesel ${p}?`,
    rDiesel: (o) => `Diesel kostar ${o.enP} i snitt ${o.precio} (${o.semana}).`,
    pImpuestos: (p) => `Hur stor del av bensinpriset är skatt ${p}?`,
    rImpuestos: (p, x) => `${may(p)} går ungefär ${x} av bensinpriset till skatter: energiskatt, koldioxidskatt och moms.`,
    rDestino: (o) => `En full tank på 50 liter bensin 95 kostar där ungefär ${o.dif} ${o.mas ? "mer" : "mindre"} än ${o.casaEn}.`,
    pBarato: "Var är det billigast att tanka i Europa?",
    rBarato: (l, c) => `Bensin 95 är just nu billigast ${l} och dyrast ${c}.`,
    pCal: (p) => `Vad kostar eldningsolja ${p}?`,
    rCal: (o) => `Eldningsolja kostar ${o.enP} i snitt ${o.precio} (${o.semana}); 1 000 liter kostar ungefär ${o.mil}.`,
    pCuandoCal: "När är eldningsoljan billigast?",
    rCuandoCal: (m) => `De senaste tre åren har eldningsoljan i snitt varit billigast i ${m}. Beställ gärna utanför eldningssäsongen.`,
    consejosCalefaccion: ["Beställ utanför eldningssäsongen: på våren och sommaren är oljan ofta billigare.", "Samordna beställningen med grannarna för ett lägre literpris.", "Be om flera offerter samma dag.", "Låt serva pannan varje år: en feljusterad brännare drar 5–10 % mer."],
    consejosCarburante: ["Kör långsammare: i 100 km/h i stället för 120 drar bilen 15–20 % mindre.", "Kontrollera däcktrycket en gång i månaden.", "Ta av takboxen när den inte används.", "Jämför mackar: i samma stad skiljer det ofta en krona eller två per liter."],
    consejosT: "Så sparar du på bränslet", consejosCalT: "Så betalar du mindre för eldningsoljan", preguntasT: "Frågor och svar",
    fuente: "Källa: Europeiska kommissionen, Weekly Oil Bulletin (snittpriser inklusive skatter), omräknat till kronor med ECB:s växelkurs.", fuenteNombre: "Europeiska kommissionen (Weekly Oil Bulletin)",
    verTodos: "Jämför alla länder", aviso: "Rikssnitt: på den enskilda macken kan priset skilja sig.", avisoCal: "Rikssnitt: det faktiska priset beror på leverantör och mängd.",
  },
  da: {
    slugPrecios: "benzinpris", slugCalefaccion: "fyringsolie-pris", slugEuropa: "benzinpris-europa",
    productos: { euro95: "Blyfri 95", diesel: "Diesel", calefaccion: "Fyringsolie", glp: "Autogas (LPG)" },
    tituloPais: (p) => `Benzinpris og dieselpris ${p}`, tituloCalefaccion: (p) => `Pris på fyringsolie ${p}`, tituloEuropa: "Benzinpriser i Europa", tituloDestino: (d) => `Benzinpris ${d}`,
    semanaDel: (_f, n) => `uge ${n}`, porLitro: "Pris pr. liter", semanaAnterior: "ugen før", haceUnAno: "for et år siden", tresAnos: "De seneste tre år",
    vecinos: "I nabolandene", pais: "Land", litros1000: "1.000 liter", y: "og",
    leadPais: (o) => `Blyfri 95 koster ${o.enP} i gennemsnit ${o.precio}. Det giver en ${o.puesto}.-plads ud af ${o.total} i EU${o.imp ? `, og ${o.imp} af prisen er afgifter og moms` : ""}.`,
    leadCal: (o) => `Fyringsolie koster ${o.enP} i gennemsnit ${o.precio}. 1.000 liter koster dermed omkring ${o.mil}.`,
    leadDestino: (o) => `Blyfri 95 koster ${o.enD} i gennemsnit ${o.precio} mod ${o.precioCasa} ${o.casaEn}. ${o.consejo}`,
    llenarAntes: "Tank derfor op, før du kører over grænsen, og tank kun det nødvendige på den anden side.",
    repostarAlli: "Det kan altså betale sig at tanke der.",
    daIgual: "Forskellen er lille. Valget af tankstation betyder mere, og ved motorvejen er det som regel dyrest.",
    rankDestino: (_n, k, t) => `Det giver landet en ${k}.-plads ud af ${t} i EU (1 er billigst).`,
    pPrecio: (p) => `Hvad koster benzin ${p}?`,
    rPrecio: (o) => `Blyfri 95 koster ${o.enP} lige nu i gennemsnit ${o.precio} (${o.semana}). Det er en ${o.puesto}.-plads ud af ${o.total} i EU, hvor 1 er billigst.`,
    pDiesel: (p) => `Hvad koster diesel ${p}?`,
    rDiesel: (o) => `Diesel koster ${o.enP} i gennemsnit ${o.precio} (${o.semana}).`,
    pImpuestos: (p) => `Hvor meget af benzinprisen er afgifter ${p}?`,
    rImpuestos: (p, x) => `${may(p)} går omkring ${x} af benzinprisen til afgifter og moms.`,
    rDestino: (o) => `En fuld tank på 50 liter blyfri 95 koster der omkring ${o.dif} ${o.mas ? "mere" : "mindre"} end ${o.casaEn}.`,
    pBarato: "Hvor er det billigst at tanke i Europa?",
    rBarato: (l, c) => `Blyfri 95 er lige nu billigst ${l} og dyrest ${c}.`,
    pCal: (p) => `Hvad koster fyringsolie ${p}?`,
    rCal: (o) => `Fyringsolie koster ${o.enP} i gennemsnit ${o.precio} (${o.semana}); 1.000 liter koster omkring ${o.mil}.`,
    pCuandoCal: "Hvornår er fyringsolie billigst?",
    rCuandoCal: (m) => `De seneste tre år har fyringsolien i gennemsnit været billigst i ${m}. Bestil gerne uden for fyringssæsonen.`,
    consejosCalefaccion: ["Bestil uden for fyringssæsonen: om foråret og sommeren er olien ofte billigere.", "Bestil sammen med naboerne og få en lavere literpris.", "Indhent flere tilbud samme dag.", "Få fyret efterset hvert år: en dårligt indstillet brænder bruger 5–10 % mere."],
    consejosCarburante: ["Kør langsommere: ved 110 km/t i stedet for 130 bruger bilen 15–20 % mindre.", "Tjek dæktrykket en gang om måneden.", "Tag tagboksen af, når den ikke bruges.", "Sammenlign tankstationer: i samme by er der tit en krone eller mere i forskel pr. liter."],
    consejosT: "Sådan sparer du på brændstof", consejosCalT: "Sådan betaler du mindre for fyringsolie", preguntasT: "Spørgsmål og svar",
    fuente: "Kilde: Europa-Kommissionen, Weekly Oil Bulletin (gennemsnitspriser inkl. afgifter), omregnet til kroner med ECB's valutakurs.", fuenteNombre: "Europa-Kommissionen (Weekly Oil Bulletin)",
    verTodos: "Sammenlign alle lande", aviso: "Landsgennemsnit: på den enkelte tankstation kan prisen afvige.", avisoCal: "Landsgennemsnit: den faktiske pris afhænger af leverandør og mængde.",
  },
  fi: {
    slugPrecios: "polttoaineen-hinta", slugCalefaccion: "polttooljyn-hinta", slugEuropa: "bensan-hinta-euroopassa",
    productos: { euro95: "Bensiini 95E10", diesel: "Diesel", calefaccion: "Kevyt polttoöljy", glp: "Nestekaasu" },
    tituloPais: (p) => `Bensan ja dieselin hinta ${p}`, tituloCalefaccion: (p) => `Polttoöljyn hinta ${p}`, tituloEuropa: "Bensan hinta Euroopassa", tituloDestino: (d) => `Bensan hinta ${d}`,
    semanaDel: (_f, n) => `viikko ${n}`, porLitro: "Litrahinta", semanaAnterior: "edellinen viikko", haceUnAno: "vuosi sitten", tresAnos: "Kolme viime vuotta",
    vecinos: "Naapurimaissa", pais: "Maa", litros1000: "1 000 litraa", y: "ja",
    leadPais: (o) => `${may(o.enP)} bensiini 95E10 maksaa keskimäärin ${o.precio}. EU-maiden vertailussa sija on ${o.puesto}/${o.total}${o.imp ? `, ja hinnasta noin ${o.imp} on veroja` : ""}.`,
    leadCal: (o) => `${may(o.enP)} kevyt polttoöljy maksaa keskimäärin ${o.precio}, joten 1 000 litraa maksaa noin ${o.mil}.`,
    leadDestino: (o) => `${may(o.enD)} bensiini maksaa keskimäärin ${o.precio}, ${o.casaEn} ${o.precioCasa}. ${o.consejo}`,
    llenarAntes: "Tankkaa siis täyteen ennen rajaa.",
    repostarAlli: "Siellä kannattaa siis tankata.",
    daIgual: "Ero on pieni, joten aseman valinta merkitsee enemmän.",
    rankDestino: (_n, k, t) => `EU-maiden vertailussa sija on ${k}/${t}, kun 1 on halvin.`,
    pPrecio: (p) => `Paljonko bensa maksaa ${p}?`,
    rPrecio: (o) => `${may(o.enP)} bensiini maksaa nyt keskimäärin ${o.precio} (${o.semana}). EU-maiden vertailussa sija on ${o.puesto}/${o.total}, kun 1 on halvin.`,
    pDiesel: (p) => `Paljonko diesel maksaa ${p}?`,
    rDiesel: (o) => `${may(o.enP)} diesel maksaa keskimäärin ${o.precio} (${o.semana}).`,
    pImpuestos: (p) => `Kuinka suuri osa bensan hinnasta on veroja ${p}?`,
    rImpuestos: (p, x) => `${may(p)} bensiinin hinnasta noin ${x} on veroja (valmistevero ja arvonlisävero).`,
    rDestino: (o) => `50 litran tankillinen bensiiniä maksaa siellä noin ${o.dif} ${o.mas ? "enemmän" : "vähemmän"} kuin ${o.casaEn}.`,
    pBarato: "Missä tankkaaminen on halvinta Euroopassa?",
    rBarato: (l, c) => `Bensiini on tällä hetkellä halvinta ${l} ja kalleinta ${c}.`,
    pCal: (p) => `Paljonko polttoöljy maksaa ${p}?`,
    rCal: (o) => `${may(o.enP)} kevyt polttoöljy maksaa keskimäärin ${o.precio} (${o.semana}); 1 000 litraa maksaa noin ${o.mil}.`,
    pCuandoCal: "Milloin polttoöljy on halvinta?",
    rCuandoCal: (m) => `Kolmen viime vuoden aikana polttoöljy on ollut keskimäärin halvinta ${m.replace(/kuu$/, "kuussa")}. Tilaus kannattaa tehdä lämmityskauden ulkopuolella.`,
    consejosCalefaccion: ["Tilaa lämmityskauden ulkopuolella: keväällä ja kesällä öljy on usein halvempaa.", "Tee yhteistilaus naapurien kanssa, niin litrahinta laskee.", "Pyydä useampi tarjous samana päivänä.", "Huollata poltin joka vuosi: huonosti säädetty poltin kuluttaa 5–10 % enemmän."],
    consejosCarburante: ["Aja hitaammin: 100 km/h nopeudella kulutus on 15–20 % pienempi kuin 120 km/h nopeudella.", "Tarkista rengaspaineet kerran kuussa.", "Ota kattoboksi pois, kun et tarvitse sitä.", "Vertaile asemia: saman kaupungin sisällä ero on usein 10–20 senttiä litralta."],
    consejosT: "Näin säästät polttoaineessa", consejosCalT: "Näin maksat lämmityksestä vähemmän", preguntasT: "Kysymyksiä ja vastauksia",
    fuente: "Lähde: Euroopan komissio, Weekly Oil Bulletin (keskihinnat veroineen).", fuenteNombre: "Euroopan komissio (Weekly Oil Bulletin)",
    verTodos: "Vertaile kaikkia maita", aviso: "Valtakunnalliset keskihinnat: asemakohtainen hinta voi poiketa.", avisoCal: "Valtakunnalliset keskihinnat: lopullinen hinta riippuu toimittajasta ja määrästä.",
  },
};

/** Inesivo finés de los países de la UE («Suomessa», «Virossa», «Alankomaissa»). */
const INESIVO_FI: Record<string, string> = {
  AT: "Itävallassa", BE: "Belgiassa", BG: "Bulgariassa", CY: "Kyproksella", CZ: "Tšekissä", DE: "Saksassa", DK: "Tanskassa", EE: "Virossa",
  ES: "Espanjassa", FI: "Suomessa", FR: "Ranskassa", GR: "Kreikassa", HR: "Kroatiassa", HU: "Unkarissa", IE: "Irlannissa", IT: "Italiassa",
  LT: "Liettuassa", LU: "Luxemburgissa", LV: "Latviassa", MT: "Maltalla", NL: "Alankomaissa", PL: "Puolassa", PT: "Portugalissa",
  RO: "Romaniassa", SE: "Ruotsissa", SI: "Sloveniassa", SK: "Slovakiassa", NO: "Norjassa",
};

/** «in Deutschland», «in den Niederlanden», «au Portugal», «na Alemanha», «Suomessa»… */
export function enPais(lang: Idioma, cc: string, nombre: string): string {
  switch (lang) {
    case "de":
      return cc === "NL" ? "in den Niederlanden" : cc === "SK" ? "in der Slowakei" : `in ${nombre}`;
    case "fr":
      return cc === "NL" ? "aux Pays-Bas" : ["PT", "DK", "LU"].includes(cc) ? `au ${nombre}` : ["CY", "MT"].includes(cc) ? `à ${nombre}` : `en ${nombre}`;
    case "it":
      return cc === "NL" ? "nei Paesi Bassi" : ["CY", "MT"].includes(cc) ? `a ${nombre}` : `in ${nombre}`;
    case "pt":
      if (cc === "NL") return "nos Países Baixos";
      if (cc === "LU") return `no ${nombre}`;
      if (["PT", "ES", "FR", "IT", "MT", "CY"].includes(cc)) return `em ${nombre}`;
      return `na ${nombre}`;
    case "sv":
    case "da":
    case "no":
      return `i ${nombre}`;
    case "nl":
      return `in ${nombre}`;
    case "es":
      return cc === "NL" ? "en los Países Bajos" : `en ${nombre}`;
    case "fi":
      return INESIVO_FI[cc] ?? nombre;
    default:
      return `in ${nombre}`;
  }
}

/** Lista con conjunción: «in Malta, Polen und Schweden»; «à Malte, en Pologne et en Suède». */
export function lista(lang: Idioma, partes: string[], y: string): string {
  if (partes.length <= 1) return partes.join("");
  // En alemán, neerlandés y nórdicos, si todas llevan la misma preposición, solo se pone en la primera.
  const pre = /^(in|i|en) /.exec(partes[0])?.[0];
  const p = pre && ["de", "nl", "sv", "da", "no", "es"].includes(lang) && partes.every((x) => x.startsWith(pre)) ? [partes[0], ...partes.slice(1).map((x) => x.slice(pre.length))] : partes;
  // Español: «Francia e Italia», no «y Italia».
  const conj = lang === "es" && /^(i|hi)(?!e)/i.test(p.at(-1)!) ? "e" : y;
  return `${p.slice(0, -1).join(", ")} ${conj} ${p.at(-1)}`;
}

/** Número de semana ISO («vecka 43»). */
export function semanaIso(iso: string): number {
  const d = new Date(`${iso}T12:00:00Z`);
  const dia = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dia + 3);
  const primerJueves = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - primerJueves.getTime()) / 86400000 - 3 + ((primerJueves.getUTCDay() + 6) % 7)) / 7);
}
