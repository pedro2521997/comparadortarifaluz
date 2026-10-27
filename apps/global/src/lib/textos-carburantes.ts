// Textos de las páginas de carburantes de la web global (datos semanales de la Comisión Europea).
// Un idioma por país; Bélgica usa neerlandés y Austria alemán. PENDIENTE: revisión por hablantes nativos.

import type { Idioma } from "./textos";
import type { ProductoUE } from "../../../web/src/lib/compartido/carburantes-ue";

/** Los nombres de país que reciben estas funciones ya llevan la preposición («in Deutschland», «au Portugal», «na Alemanha»), salvo comparadoCon. */
export interface TextosCarburantes {
  /** Segmentos de URL */
  slugPrecios: string;
  slugCalefaccion: string;
  slugEuropa: string;
  productos: Record<ProductoUE, string>;
  /** «Spritpreise in Deutschland» */
  tituloPais: (pais: string) => string;
  tituloCalefaccion: (pais: string) => string;
  tituloEuropa: string;
  /** «Spritpreise in Italien» (página de destino vista desde el país de origen) */
  tituloDestino: (destino: string) => string;
  semanaDel: (fecha: string) => string;
  porLitro: string;
  semanaAnterior: string;
  haceUnAno: string;
  impuestos: (pct: string) => string;
  puesto: (n: number, total: number) => string;
  tresAnos: string;
  vecinos: string;
  masBarato: string;
  masCaro: string;
  pais: string;
  comparadoCon: (pais: string) => string;
  deposito: (litros: number, dif: string, masCaro: boolean) => string;
  llenarAntes: (destino: string) => string;
  repostarAlli: (destino: string) => string;
  daIgual: string;
  litros1000: string;
  consejosCalefaccion: string[];
  mesBarato: (mes: string) => string;
  consejosCarburante: string[];
  consejosT: string;
  preguntasT: string;
  pPrecio: (pais: string) => string;
  pDiesel: (pais: string) => string;
  pImpuestos: (pais: string) => string;
  pBarato: string;
  /** «Wie viel kostet Heizöl in Deutschland?» */
  pCal: (pais: string) => string;
  /** «Wann ist Heizöl am günstigsten?» */
  pCuandoCal: string;
  rBarato: (paises: string, caro: string) => string;
  fuente: string;
  verTodos: string;
  aviso: string;
}

export const TEXTOS_C: Partial<Record<Idioma, TextosCarburantes>> = {
  de: {
    slugPrecios: "spritpreise", slugCalefaccion: "heizoelpreise", slugEuropa: "spritpreise-europa",
    productos: { euro95: "Super E5 (95)", diesel: "Diesel", calefaccion: "Heizöl", glp: "Autogas (LPG)" },
    tituloPais: (p) => `Spritpreise ${p}`, tituloCalefaccion: (p) => `Heizölpreise ${p}`, tituloEuropa: "Spritpreise in Europa",
    tituloDestino: (d) => `Spritpreise ${d}`, semanaDel: (f) => `Woche vom ${f}`, porLitro: "pro Liter",
    semanaAnterior: "Vorwoche", haceUnAno: "vor einem Jahr", impuestos: (p) => `${p} des Preises sind Steuern und Abgaben`,
    puesto: (n, t) => `Platz ${n} von ${t} in der EU (1 = am günstigsten)`, tresAnos: "Die letzten drei Jahre", vecinos: "Im Vergleich mit den Nachbarländern",
    masBarato: "günstiger", masCaro: "teurer", pais: "Land", comparadoCon: (p) => `im Vergleich zu ${p}`,
    deposito: (l, d, c) => `Eine Tankfüllung von ${l} Litern kostet ${d} ${c ? "mehr" : "weniger"}.`,
    llenarAntes: (d) => `Benzin ist ${d} teurer: am besten vollgetankt über die Grenze fahren und dort nur das Nötigste tanken.`,
    repostarAlli: (d) => `Benzin ist ${d} günstiger: es lohnt sich, dort zu tanken.`,
    daIgual: "Die Preise sind fast gleich: wichtiger ist die Wahl der Tankstelle (Autobahntankstellen sind am teuersten).",
    litros1000: "1.000 Liter",
    consejosCalefaccion: ["Außerhalb der Heizperiode bestellen: im Frühjahr und Sommer ist Heizöl meist günstiger.", "Sammelbestellung mit Nachbarn: größere Mengen senken den Literpreis.", "Mehrere Angebote am selben Tag vergleichen.", "Die Heizung jährlich warten lassen: ein schlecht eingestellter Brenner verbraucht 5–10 % mehr."],
    mesBarato: (m) => `In den letzten drei Jahren war ${m} im Schnitt der günstigste Monat.`,
    consejosCarburante: ["Langsamer fahren: 110 statt 130 km/h spart rund 15–20 % Kraftstoff.", "Reifendruck monatlich prüfen.", "Dachbox und Fahrradträger abnehmen, wenn sie nicht gebraucht werden.", "Preise vergleichen: zwischen Tankstellen einer Stadt liegen oft 10–20 Cent pro Liter."],
    consejosT: "So sparst du beim Tanken", preguntasT: "Häufige Fragen",
    pPrecio: (p) => `Wie viel kostet Benzin ${p}?`, pDiesel: (p) => `Wie viel kostet Diesel ${p}?`, pImpuestos: (p) => `Wie hoch ist der Steueranteil am Spritpreis ${p}?`,
    pCal: (p) => `Wie viel kostet Heizöl ${p}?`, pCuandoCal: "Wann ist Heizöl am günstigsten?",
    pBarato: "Wo ist Tanken in Europa am günstigsten?", rBarato: (ps, c) => `Am günstigsten ist Super derzeit ${ps}; am teuersten ${c}.`,
    fuente: "Quelle: Europäische Kommission, Weekly Oil Bulletin (Durchschnittspreise inkl. Steuern).", verTodos: "Alle Länder vergleichen", aviso: "Landesweite Durchschnittspreise; an der einzelnen Tankstelle kann der Preis abweichen.",
  },
  fr: {
    slugPrecios: "prix-carburants", slugCalefaccion: "prix-fioul", slugEuropa: "prix-carburants-europe",
    productos: { euro95: "Sans plomb 95", diesel: "Gazole", calefaccion: "Fioul domestique", glp: "GPL carburant" },
    tituloPais: (p) => `Prix des carburants ${p}`, tituloCalefaccion: (p) => `Prix du fioul domestique ${p}`, tituloEuropa: "Prix des carburants en Europe",
    tituloDestino: (d) => `Prix de l'essence ${d}`, semanaDel: (f) => `semaine du ${f}`, porLitro: "le litre",
    semanaAnterior: "semaine précédente", haceUnAno: "il y a un an", impuestos: (p) => `${p} du prix sont des taxes`,
    puesto: (n, t) => `${n}e sur ${t} dans l'UE (1 = le moins cher)`, tresAnos: "Les trois dernières années", vecinos: "Comparé aux pays voisins",
    masBarato: "moins cher", masCaro: "plus cher", pais: "Pays", comparadoCon: (p) => `par rapport à ${p}`,
    deposito: (l, d, c) => `Un plein de ${l} litres coûte ${d} de ${c ? "plus" : "moins"}.`,
    llenarAntes: (d) => `L'essence est plus chère ${d} : mieux vaut faire le plein avant de passer la frontière.`,
    repostarAlli: (d) => `L'essence est moins chère ${d} : il vaut la peine d'y faire le plein.`,
    daIgual: "Les prix sont presque identiques : choisir la bonne station compte davantage (les stations d'autoroute sont les plus chères).",
    litros1000: "1 000 litres",
    consejosCalefaccion: ["Commander hors saison : au printemps et en été, le fioul est souvent moins cher.", "Grouper la commande avec des voisins pour baisser le prix au litre.", "Comparer plusieurs devis le même jour.", "Faire entretenir la chaudière chaque année : un brûleur mal réglé consomme 5 à 10 % de plus."],
    mesBarato: (m) => `Sur les trois dernières années, ${m} a été en moyenne le mois le moins cher.`,
    consejosCarburante: ["Rouler moins vite : 110 au lieu de 130 km/h économise 15 à 20 % de carburant.", "Vérifier la pression des pneus chaque mois.", "Retirer le coffre de toit quand il ne sert pas.", "Comparer les stations : les écarts dépassent souvent 10 centimes par litre dans une même ville."],
    consejosT: "Pour payer moins cher à la pompe", preguntasT: "Questions fréquentes",
    pPrecio: (p) => `Combien coûte l'essence ${p} ?`, pDiesel: (p) => `Combien coûte le gazole ${p} ?`, pImpuestos: (p) => `Quelle part du prix des carburants sont des taxes ${p} ?`,
    pCal: (p) => `Combien coûte le fioul domestique ${p} ?`, pCuandoCal: "Quand le fioul est-il le moins cher ?",
    pBarato: "Où le carburant est-il le moins cher en Europe ?", rBarato: (ps, c) => `Le sans plomb 95 est actuellement le moins cher ${ps} et le plus cher ${c}.`,
    fuente: "Source : Commission européenne, Bulletin pétrolier hebdomadaire (prix moyens TTC).", verTodos: "Comparer tous les pays", aviso: "Prix moyens nationaux ; à la pompe, le prix peut varier.",
  },
  it: {
    slugPrecios: "prezzi-carburanti", slugCalefaccion: "prezzo-gasolio-riscaldamento", slugEuropa: "prezzi-carburanti-europa",
    productos: { euro95: "Benzina", diesel: "Gasolio", calefaccion: "Gasolio da riscaldamento", glp: "GPL" },
    tituloPais: (p) => `Prezzi dei carburanti ${p}`, tituloCalefaccion: (p) => `Prezzo del gasolio da riscaldamento ${p}`, tituloEuropa: "Prezzi dei carburanti in Europa",
    tituloDestino: (d) => `Prezzo della benzina ${d}`, semanaDel: (f) => `settimana del ${f}`, porLitro: "al litro",
    semanaAnterior: "settimana precedente", haceUnAno: "un anno fa", impuestos: (p) => `il ${p} del prezzo sono tasse e accise`,
    puesto: (n, t) => `${n}° su ${t} nell'UE (1 = il più economico)`, tresAnos: "Gli ultimi tre anni", vecinos: "Confronto con i paesi vicini",
    masBarato: "più economica", masCaro: "più cara", pais: "Paese", comparadoCon: (p) => `rispetto a ${p}`,
    deposito: (l, d, c) => `Un pieno di ${l} litri costa ${d} in ${c ? "più" : "meno"}.`,
    llenarAntes: (d) => `La benzina è più cara ${d}: meglio fare il pieno prima di passare il confine.`,
    repostarAlli: (d) => `La benzina è più economica ${d}: conviene fare rifornimento lì.`,
    daIgual: "I prezzi sono quasi uguali: conta di più scegliere il distributore giusto (in autostrada è più caro).",
    litros1000: "1.000 litri",
    consejosCalefaccion: ["Ordinare fuori stagione: in primavera ed estate il gasolio costa spesso meno.", "Fare un ordine collettivo con i vicini per abbassare il prezzo al litro.", "Confrontare più preventivi nello stesso giorno.", "Far controllare la caldaia ogni anno: un bruciatore mal regolato consuma il 5–10 % in più."],
    mesBarato: (m) => `Negli ultimi tre anni ${m} è stato in media il mese più economico.`,
    consejosCarburante: ["Andare più piano: 110 invece di 130 km/h fa risparmiare il 15–20 % di carburante.", "Controllare la pressione delle gomme ogni mese.", "Togliere il box da tetto quando non serve.", "Confrontare i distributori: nella stessa città ci sono spesso 10–20 centesimi di differenza al litro."],
    consejosT: "Come spendere meno di carburante", preguntasT: "Domande frequenti",
    pPrecio: (p) => `Quanto costa la benzina ${p}?`, pDiesel: (p) => `Quanto costa il gasolio ${p}?`, pImpuestos: (p) => `Quanta parte del prezzo dei carburanti sono tasse ${p}?`,
    pCal: (p) => `Quanto costa il gasolio da riscaldamento ${p}?`, pCuandoCal: "Quando conviene comprare il gasolio da riscaldamento?",
    pBarato: "Dove costa meno fare benzina in Europa?", rBarato: (ps, c) => `Oggi la benzina costa meno ${ps} e di più ${c}.`,
    fuente: "Fonte: Commissione europea, Weekly Oil Bulletin (prezzi medi con tasse).", verTodos: "Confronta tutti i paesi", aviso: "Prezzi medi nazionali; al distributore il prezzo può variare.",
  },
  nl: {
    slugPrecios: "brandstofprijzen", slugCalefaccion: "stookolieprijs", slugEuropa: "brandstofprijzen-europa",
    productos: { euro95: "Euro 95", diesel: "Diesel", calefaccion: "Huisbrandolie (stookolie)", glp: "LPG" },
    tituloPais: (p) => `Brandstofprijzen ${p}`, tituloCalefaccion: (p) => `Stookolieprijs ${p}`, tituloEuropa: "Brandstofprijzen in Europa",
    tituloDestino: (d) => `Benzineprijs ${d}`, semanaDel: (f) => `week van ${f}`, porLitro: "per liter",
    semanaAnterior: "vorige week", haceUnAno: "een jaar geleden", impuestos: (p) => `${p} van de prijs zijn belastingen en accijns`,
    puesto: (n, t) => `${n}e van ${t} in de EU (1 = goedkoopst)`, tresAnos: "De afgelopen drie jaar", vecinos: "Vergeleken met de buurlanden",
    masBarato: "goedkoper", masCaro: "duurder", pais: "Land", comparadoCon: (p) => `vergeleken met ${p}`,
    deposito: (l, d, c) => `Een volle tank van ${l} liter kost ${d} ${c ? "meer" : "minder"}.`,
    llenarAntes: (d) => `Benzine is ${d} duurder: tank vol vóór de grens en tank daar alleen het nodige.`,
    repostarAlli: (d) => `Benzine is ${d} goedkoper: daar tanken loont.`,
    daIgual: "De prijzen zijn bijna gelijk: het tankstation kiezen maakt meer uit (langs de snelweg is het duurst).",
    litros1000: "1.000 liter",
    consejosCalefaccion: ["Buiten het stookseizoen bestellen: in voorjaar en zomer is stookolie vaak goedkoper.", "Samen met buren bestellen voor een lagere literprijs.", "Meerdere offertes op dezelfde dag vergelijken.", "Laat de ketel jaarlijks onderhouden: een slecht afgestelde brander verbruikt 5–10 % meer."],
    mesBarato: (m) => `De afgelopen drie jaar was ${m} gemiddeld de goedkoopste maand.`,
    consejosCarburante: ["Rustiger rijden: 100 in plaats van 130 km/u bespaart al snel 20 % brandstof.", "Controleer elke maand de bandenspanning.", "Haal de dakkoffer eraf als je hem niet gebruikt.", "Vergelijk tankstations: in dezelfde stad scheelt het vaak 10–20 cent per liter."],
    consejosT: "Zo bespaar je op brandstof", preguntasT: "Veelgestelde vragen",
    pPrecio: (p) => `Wat kost benzine ${p}?`, pDiesel: (p) => `Wat kost diesel ${p}?`, pImpuestos: (p) => `Hoeveel belasting zit er in de brandstofprijs ${p}?`,
    pCal: (p) => `Wat kost stookolie ${p}?`, pCuandoCal: "Wanneer is stookolie het goedkoopst?",
    pBarato: "Waar is tanken in Europa het goedkoopst?", rBarato: (ps, c) => `Euro 95 is nu het goedkoopst ${ps} en het duurst ${c}.`,
    fuente: "Bron: Europese Commissie, Weekly Oil Bulletin (gemiddelde prijzen incl. belastingen).", verTodos: "Alle landen vergelijken", aviso: "Landelijke gemiddelden; aan de pomp kan de prijs afwijken.",
  },
  pt: {
    slugPrecios: "precos-combustiveis", slugCalefaccion: "preco-gasoleo-aquecimento", slugEuropa: "precos-combustiveis-europa",
    productos: { euro95: "Gasolina 95", diesel: "Gasóleo", calefaccion: "Gasóleo de aquecimento", glp: "GPL Auto" },
    tituloPais: (p) => `Preço dos combustíveis ${p}`, tituloCalefaccion: (p) => `Preço do gasóleo de aquecimento ${p}`, tituloEuropa: "Preço dos combustíveis na Europa",
    tituloDestino: (d) => `Preço da gasolina ${d}`, semanaDel: (f) => `semana de ${f}`, porLitro: "por litro",
    semanaAnterior: "semana anterior", haceUnAno: "há um ano", impuestos: (p) => `${p} do preço são impostos (ISP e IVA)`,
    puesto: (n, t) => `${n}.º de ${t} na UE (1 = o mais barato)`, tresAnos: "Os últimos três anos", vecinos: "Comparado com os países vizinhos",
    masBarato: "mais barata", masCaro: "mais cara", pais: "País", comparadoCon: (p) => `em comparação com ${p}`,
    deposito: (l, d, c) => `Um depósito de ${l} litros custa ${d} a ${c ? "mais" : "menos"}.`,
    llenarAntes: (d) => `A gasolina é mais cara ${d}: é melhor atestar antes de passar a fronteira.`,
    repostarAlli: (d) => `A gasolina é mais barata ${d}: compensa abastecer lá.`,
    daIgual: "Os preços são quase iguais: conta mais escolher o posto certo (os de autoestrada são os mais caros).",
    litros1000: "1.000 litros",
    consejosCalefaccion: ["Encomendar fora da época de frio: na primavera e no verão costuma ser mais barato.", "Juntar a encomenda com vizinhos para baixar o preço por litro.", "Pedir vários orçamentos no mesmo dia.", "Fazer a manutenção anual da caldeira: um queimador mal regulado gasta 5–10 % mais."],
    mesBarato: (m) => `Nos últimos três anos, ${m} foi em média o mês mais barato.`,
    consejosCarburante: ["Conduzir mais devagar: 100 em vez de 120 km/h poupa 15–20 % de combustível.", "Verificar a pressão dos pneus todos os meses.", "Tirar a mala de tejadilho quando não for precisa.", "Comparar postos: na mesma cidade há muitas vezes 10–20 cêntimos de diferença por litro."],
    consejosT: "Como gastar menos em combustível", preguntasT: "Perguntas frequentes",
    pPrecio: (p) => `Quanto custa a gasolina ${p}?`, pDiesel: (p) => `Quanto custa o gasóleo ${p}?`, pImpuestos: (p) => `Quanto do preço dos combustíveis são impostos ${p}?`,
    pCal: (p) => `Quanto custa o gasóleo de aquecimento ${p}?`, pCuandoCal: "Quando é mais barato comprar gasóleo de aquecimento?",
    pBarato: "Onde é mais barato abastecer na Europa?", rBarato: (ps, c) => `A gasolina 95 é agora mais barata ${ps} e mais cara ${c}.`,
    fuente: "Fonte: Comissão Europeia, Weekly Oil Bulletin (preços médios com impostos).", verTodos: "Comparar todos os países", aviso: "Preços médios nacionais; em cada posto o preço pode variar.",
  },
  sv: {
    slugPrecios: "bensinpris", slugCalefaccion: "eldningsolja-pris", slugEuropa: "bensinpris-europa",
    productos: { euro95: "Bensin 95", diesel: "Diesel", calefaccion: "Eldningsolja", glp: "Gasol (LPG)" },
    tituloPais: (p) => `Bensinpris och dieselpris ${p}`, tituloCalefaccion: (p) => `Pris på eldningsolja ${p}`, tituloEuropa: "Bensinpriser i Europa",
    tituloDestino: (d) => `Bensinpris ${d}`, semanaDel: (f) => `veckan ${f}`, porLitro: "per liter",
    semanaAnterior: "förra veckan", haceUnAno: "för ett år sedan", impuestos: (p) => `${p} av priset är skatter`,
    puesto: (n, t) => `Plats ${n} av ${t} i EU (1 = billigast)`, tresAnos: "De senaste tre åren", vecinos: "Jämfört med grannländerna",
    masBarato: "billigare", masCaro: "dyrare", pais: "Land", comparadoCon: (p) => `jämfört med ${p}`,
    deposito: (l, d, c) => `En full tank på ${l} liter kostar ${d} ${c ? "mer" : "mindre"}.`,
    llenarAntes: (d) => `Bensinen är dyrare ${d}: tanka fullt innan du passerar gränsen.`,
    repostarAlli: (d) => `Bensinen är billigare ${d}: det lönar sig att tanka där.`,
    daIgual: "Priserna är nästan lika: valet av mack betyder mer (vid motorvägen är det dyrast).",
    litros1000: "1 000 liter",
    consejosCalefaccion: ["Beställ utanför eldningssäsongen: på våren och sommaren är oljan ofta billigare.", "Samordna beställningen med grannar för lägre literpris.", "Jämför flera offerter samma dag.", "Låt service göras på pannan varje år: en feljusterad brännare drar 5–10 % mer."],
    mesBarato: (m) => `De senaste tre åren har ${m} i genomsnitt varit den billigaste månaden.`,
    consejosCarburante: ["Kör långsammare: 100 i stället för 120 km/h sparar 15–20 % bränsle.", "Kontrollera däcktrycket varje månad.", "Ta av takboxen när den inte används.", "Jämför mackar: i samma stad skiljer det ofta 1–2 kronor per liter."],
    consejosT: "Så sparar du på bränslet", preguntasT: "Vanliga frågor",
    pPrecio: (p) => `Vad kostar bensin ${p}?`, pDiesel: (p) => `Vad kostar diesel ${p}?`, pImpuestos: (p) => `Hur stor del av bensinpriset är skatt ${p}?`,
    pCal: (p) => `Vad kostar eldningsolja ${p}?`, pCuandoCal: "När är eldningsoljan billigast?",
    pBarato: "Var är det billigast att tanka i Europa?", rBarato: (ps, c) => `Bensin 95 är just nu billigast ${ps} och dyrast ${c}.`,
    fuente: "Källa: Europeiska kommissionen, Weekly Oil Bulletin (genomsnittspriser inkl. skatter), omräknat med ECB:s växelkurs.", verTodos: "Jämför alla länder", aviso: "Rikssnitt; på enskilda mackar kan priset skilja sig.",
  },
  da: {
    slugPrecios: "benzinpris", slugCalefaccion: "fyringsolie-pris", slugEuropa: "benzinpris-europa",
    productos: { euro95: "Blyfri 95", diesel: "Diesel", calefaccion: "Fyringsolie", glp: "Autogas (LPG)" },
    tituloPais: (p) => `Benzinpris og dieselpris ${p}`, tituloCalefaccion: (p) => `Pris på fyringsolie ${p}`, tituloEuropa: "Benzinpriser i Europa",
    tituloDestino: (d) => `Benzinpris ${d}`, semanaDel: (f) => `ugen ${f}`, porLitro: "pr. liter",
    semanaAnterior: "ugen før", haceUnAno: "for et år siden", impuestos: (p) => `${p} af prisen er afgifter og moms`,
    puesto: (n, t) => `Nr. ${n} af ${t} i EU (1 = billigst)`, tresAnos: "De seneste tre år", vecinos: "Sammenlignet med nabolandene",
    masBarato: "billigere", masCaro: "dyrere", pais: "Land", comparadoCon: (p) => `sammenlignet med ${p}`,
    deposito: (l, d, c) => `En fuld tank på ${l} liter koster ${d} ${c ? "mere" : "mindre"}.`,
    llenarAntes: (d) => `Benzinen er dyrere ${d}: tank fuldt op, før du kører over grænsen.`,
    repostarAlli: (d) => `Benzinen er billigere ${d}: det kan betale sig at tanke der.`,
    daIgual: "Priserne er næsten ens: valget af tankstation betyder mere (ved motorvejen er det dyrest).",
    litros1000: "1.000 liter",
    consejosCalefaccion: ["Bestil uden for fyringssæsonen: om foråret og sommeren er olien ofte billigere.", "Bestil sammen med naboerne for en lavere literpris.", "Sammenlign flere tilbud samme dag.", "Få fyret efterset hvert år: en dårligt indstillet brænder bruger 5–10 % mere."],
    mesBarato: (m) => `De seneste tre år har ${m} i gennemsnit været den billigste måned.`,
    consejosCarburante: ["Kør langsommere: 110 i stedet for 130 km/t sparer 15–20 % brændstof.", "Tjek dæktrykket hver måned.", "Tag tagboksen af, når den ikke bruges.", "Sammenlign tankstationer: i samme by er der tit 1 krone eller mere i forskel pr. liter."],
    consejosT: "Sådan sparer du på brændstof", preguntasT: "Ofte stillede spørgsmål",
    pPrecio: (p) => `Hvad koster benzin ${p}?`, pDiesel: (p) => `Hvad koster diesel ${p}?`, pImpuestos: (p) => `Hvor stor en del af benzinprisen er afgifter ${p}?`,
    pCal: (p) => `Hvad koster fyringsolie ${p}?`, pCuandoCal: "Hvornår er fyringsolie billigst?",
    pBarato: "Hvor er det billigst at tanke i Europa?", rBarato: (ps, c) => `Blyfri 95 er lige nu billigst ${ps} og dyrest ${c}.`,
    fuente: "Kilde: Europa-Kommissionen, Weekly Oil Bulletin (gennemsnitspriser inkl. afgifter), omregnet med ECB's valutakurs.", verTodos: "Sammenlign alle lande", aviso: "Landsgennemsnit; på den enkelte tankstation kan prisen afvige.",
  },
  fi: {
    slugPrecios: "polttoaineen-hinta", slugCalefaccion: "polttooljyn-hinta", slugEuropa: "bensan-hinta-euroopassa",
    productos: { euro95: "Bensiini 95E10", diesel: "Diesel", calefaccion: "Kevyt polttoöljy", glp: "Nestekaasu (LPG)" },
    tituloPais: (p) => `Bensan ja dieselin hinta – ${p}`, tituloCalefaccion: (p) => `Polttoöljyn hinta – ${p}`, tituloEuropa: "Bensan hinta Euroopassa",
    tituloDestino: (d) => `Bensan hinta – ${d}`, semanaDel: (f) => `viikko ${f}`, porLitro: "litralta",
    semanaAnterior: "edellinen viikko", haceUnAno: "vuosi sitten", impuestos: (p) => `${p} hinnasta on veroja`,
    puesto: (n, t) => `Sija ${n}/${t} EU:ssa (1 = halvin)`, tresAnos: "Kolme viime vuotta", vecinos: "Verrattuna naapurimaihin",
    masBarato: "halvempi", masCaro: "kalliimpi", pais: "Maa", comparadoCon: (p) => `verrattuna maahan ${p}`,
    deposito: (l, d, c) => `${l} litran tankillinen maksaa ${d} ${c ? "enemmän" : "vähemmän"}.`,
    llenarAntes: (d) => `Bensa on kalliimpaa (${d}): tankkaa täyteen ennen rajaa.`,
    repostarAlli: (d) => `Bensa on halvempaa (${d}): siellä kannattaa tankata.`,
    daIgual: "Hinnat ovat lähes samat: aseman valinta merkitsee enemmän.",
    litros1000: "1 000 litraa",
    consejosCalefaccion: ["Tilaa lämmityskauden ulkopuolella: keväällä ja kesällä öljy on usein halvempaa.", "Tee yhteistilaus naapureiden kanssa.", "Vertaile useita tarjouksia samana päivänä.", "Huollata poltin vuosittain: huonosti säädetty poltin kuluttaa 5–10 % enemmän."],
    mesBarato: (m) => `Kolmena viime vuonna ${m} on ollut keskimäärin halvin kuukausi.`,
    consejosCarburante: ["Aja hitaammin: 100 km/h 120:n sijaan säästää 15–20 % polttoainetta.", "Tarkista rengaspaineet kuukausittain.", "Poista kattoboksi, kun et tarvitse sitä.", "Vertaile asemia: saman kaupungin sisällä erot ovat usein 10–20 senttiä litralta."],
    consejosT: "Näin säästät polttoaineessa", preguntasT: "Usein kysyttyä",
    pPrecio: (p) => `Paljonko bensa maksaa (${p})?`, pDiesel: (p) => `Paljonko diesel maksaa (${p})?`, pImpuestos: (p) => `Kuinka suuri osa polttoaineen hinnasta on veroja (${p})?`,
    pCal: (p) => `Paljonko polttoöljy maksaa (${p})?`, pCuandoCal: "Milloin polttoöljy on halvinta?",
    pBarato: "Missä tankkaaminen on halvinta Euroopassa?", rBarato: (ps, c) => `Bensiini on nyt halvinta maissa ${ps} ja kalleinta maassa ${c}.`,
    fuente: "Lähde: Euroopan komissio, Weekly Oil Bulletin (keskihinnat veroineen).", verTodos: "Vertaile kaikkia maita", aviso: "Valtakunnalliset keskihinnat; asemakohtainen hinta voi poiketa.",
  },
};

/** «in Deutschland», «in den Niederlanden», «au Portugal», «na Alemanha»… (en finés, el nombre solo). */
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
      return `i ${nombre}`;
    case "nl":
      return `in ${nombre}`;
    default:
      return nombre;
  }
}
