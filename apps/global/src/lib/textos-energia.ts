// Textos de las secciones de energía de la web global: mix de generación, previsión de eólica y solar,
// precios negativos y medias mensuales. Frases completas por idioma (sin «etiqueta: valor»).

import type { Idioma } from "./textos";

export type Grupo = "eolica" | "solar" | "hidraulica" | "nuclear" | "gas" | "carbon" | "biomasa" | "petroleo" | "otrasRenovables" | "otras";

export interface TextosEnergia {
  slugMix: string;
  slugNegativos: string;
  slugMes: string;
  grupos: Record<Grupo, string>;
  /** «Strommix» */
  mix: string;
  hoy: string;
  ayer: string;
  /** «bis 18:00 Uhr» */
  hasta: (h: string) => string;
  renovable: string;
  bajasEmisiones: string;
  co2: string;
  estimado: string;
  ultimos30: string;
  produccion: string;
  produccionHoras: string;
  /** Para el título: «69 % aus erneuerbaren Quellen» */
  pctRenovTitulo: (pct: string) => string;
  pMix: string;
  rMix: (renov: string, top: string) => string;
  pCo2: string;
  rCo2: (g: string) => string;
  fuenteMix: string;
  previsionT: string;
  prevTexto: (eol: string, sol: string, pct: string | null) => string;
  demanda: string;
  fuentePrev: string;
  negativosT: string;
  horasNegativas: string;
  diasNegativos: string;
  ultimaNegativa: string;
  minimo: string;
  ninguna: string;
  negPorMes: string;
  ultimoAno: string;
  /** «In den letzten zwölf Monaten war der Börsenstrompreis in Deutschland 452 Stunden lang negativ, an 86 Tagen.» */
  negTexto: (enP: string, horas: string, dias: string) => string;
  /** Sin precios negativos: «… nicht unter null gefallen; der tiefste Preis war X am Y.» */
  negCero: (enP: string, min: string, cuando: string) => string;
  pNegPorQue: string;
  rNegPorQue: string;
  pNegCuantas: string;
  pNegAprovechar: string;
  rNegAprovechar: string;
  mesesT: string;
  /** «Strompreis im Oktober 2026 in Deutschland» (`mes` en nominativo, «Oktober 2026») */
  mesT: (mes: string, lugar: string) => string;
  mediaMes: string;
  diaMasBarato: string;
  diaMasCaro: string;
  vsMesAnterior: string;
  vsAnoAnterior: string;
  perfilT: string;
  pMes: (mes: string) => string;
  /** `parcial` = días que van del mes en curso, o null si está completo */
  rMes: (mes: string, media: string, parcial: number | null) => string;
  rMesDias: (barato: string, pBarato: string, caro: string, pCaro: string) => string;
  mes: string;
  dias: string;
  /** Conjunción de las listas */
  y: string;
}

/** Finés: «lokakuu 2026» → «lokakuussa 2026» */
const inesivoMesFi = (m: string) => m.replace(/kuu\b/, "kuussa");

export const TEXTOS_E: Partial<Record<Idioma, TextosEnergia>> = {
  de: {
    slugMix: "strommix", slugNegativos: "negative-strompreise", slugMes: "strompreis-monat",
    grupos: { eolica: "Wind", solar: "Solar", hidraulica: "Wasserkraft", nuclear: "Kernkraft", gas: "Erdgas", carbon: "Kohle", biomasa: "Biomasse", petroleo: "Öl", otrasRenovables: "Sonstige Erneuerbare", otras: "Sonstige" },
    mix: "Strommix", hoy: "heute", ayer: "gestern", hasta: (h) => `bis ${h} Uhr`, renovable: "Erneuerbare", bajasEmisiones: "CO₂-arm (mit Kernkraft)",
    co2: "CO₂-Intensität", estimado: "geschätzt, nur direkte Emissionen", ultimos30: "Anteil der Erneuerbaren in den letzten 30 Tagen", produccion: "Erzeugung", produccionHoras: "Erzeugung nach Stunden",
    pctRenovTitulo: (p) => `${p} aus erneuerbaren Quellen`,
    pMix: "Woher kommt der Strom heute?", rMix: (r, t) => `Heute stammen ${r} des erzeugten Stroms aus erneuerbaren Quellen. Am meisten tragen ${t} bei.`,
    pCo2: "Wie klimafreundlich ist der Strom gerade?", rCo2: (g) => `Wir schätzen die CO₂-Intensität der heutigen Erzeugung auf ${g} g CO₂ pro kWh. Berücksichtigt sind nur die direkten Emissionen der Kraftwerke.`,
    fuenteMix: "Quelle: ENTSO-E, tatsächliche Erzeugung nach Energieträger.",
    previsionT: "Wind- und Solarprognose für morgen", prevTexto: (e, s, p) => `Für morgen werden ${e} Windstrom und ${s} Solarstrom erwartet${p ? `, das sind rund ${p} des prognostizierten Verbrauchs` : ""}. Je mehr Wind und Sonne, desto niedriger meist der Börsenpreis.`,
    demanda: "Verbrauch (Prognose)", fuentePrev: "Quelle: ENTSO-E, Day-Ahead-Prognosen für Wind, Solar und Last.",
    negativosT: "Negative Strompreise", horasNegativas: "Stunden mit negativem Preis", diasNegativos: "Tage mit negativen Preisen", ultimaNegativa: "Zuletzt negativ", minimo: "Tiefster Preis", ninguna: "keine", negPorMes: "Negative Stunden pro Monat", ultimoAno: "in den letzten 12 Monaten",
    negTexto: (p, h, d) => `In den letzten zwölf Monaten war der Börsenstrompreis ${p} ${h} Stunden lang negativ, verteilt auf ${d} Tage.`,
    negCero: (p, m, c) => `In den letzten zwölf Monaten ist der Börsenstrompreis ${p} nicht unter null gefallen. Am niedrigsten war er ${c} mit ${m}.`,
    pNegPorQue: "Warum gibt es negative Strompreise?", rNegPorQue: "Wenn viel Wind- und Solarstrom ins Netz fließt und gleichzeitig wenig verbraucht wird, etwa an sonnigen Wochenenden, an Feiertagen oder in windigen Nächten, laufen manche Kraftwerke trotzdem weiter. Dann zahlen Erzeuger dafür, ihren Strom loszuwerden, und der Preis rutscht unter null.",
    pNegCuantas: "Wie oft ist der Strompreis negativ?", pNegAprovechar: "Habe ich etwas von negativen Strompreisen?", rNegAprovechar: "Nur mit einem dynamischen Stromtarif. Netzentgelte, Abgaben und Steuern zahlst du trotzdem, aber die Energie selbst kostet dann nichts oder fast nichts. Ein guter Moment, um das E-Auto zu laden oder Warmwasser zu machen.",
    mesesT: "Strompreis pro Monat", mesT: (m, l) => `Strompreis im ${m} ${l}`, mediaMes: "Monatsdurchschnitt", diaMasBarato: "Günstigster Tag", diaMasCaro: "Teuerster Tag", vsMesAnterior: "Vormonat", vsAnoAnterior: "Vorjahresmonat", perfilT: "Durchschnittspreis nach Uhrzeit",
    pMes: (m) => `Wie hoch war der Börsenstrompreis im ${m}?`,
    rMes: (m, x, d) => `Im ${m} lag der durchschnittliche Börsenstrompreis${d ? ` bisher (${d} Tage)` : ""} bei ${x}, ohne Steuern, Abgaben und Netzentgelte.`,
    rMesDias: (b, pb, c, pc) => `Am günstigsten war der ${b} mit ${pb}, am teuersten der ${c} mit ${pc}.`,
    mes: "Monat", dias: "Tage", y: "und",
  },
  fr: {
    slugMix: "mix-electrique", slugNegativos: "prix-negatifs", slugMes: "prix-electricite-mois",
    grupos: { eolica: "éolien", solar: "solaire", hidraulica: "hydraulique", nuclear: "nucléaire", gas: "gaz", carbon: "charbon", biomasa: "biomasse", petroleo: "fioul", otrasRenovables: "autres renouvelables", otras: "autres" },
    mix: "Mix électrique", hoy: "aujourd'hui", ayer: "hier", hasta: (h) => `jusqu'à ${h}`, renovable: "Renouvelables", bajasEmisiones: "Bas carbone (avec le nucléaire)",
    co2: "Intensité carbone", estimado: "estimation, émissions directes", ultimos30: "Part des renouvelables sur les 30 derniers jours", produccion: "Production", produccionHoras: "Production heure par heure",
    pctRenovTitulo: (p) => `${p} d'énergies renouvelables`,
    pMix: "D'où vient l'électricité aujourd'hui ?", rMix: (r, t) => `Aujourd'hui, ${r} de l'électricité produite vient de sources renouvelables. Les principales sources sont ${t}.`,
    pCo2: "L'électricité est-elle peu carbonée en ce moment ?", rCo2: (g) => `Nous estimons l'intensité carbone de la production du jour à ${g} g de CO₂ par kWh, en ne comptant que les émissions directes des centrales.`,
    fuenteMix: "Source : ENTSO-E, production réelle par filière.",
    previsionT: "Prévision éolienne et solaire pour demain", prevTexto: (e, s, p) => `Pour demain, on attend ${e} d'éolien et ${s} de solaire${p ? `, soit environ ${p} de la consommation prévue` : ""}. Plus il y a de vent et de soleil, plus le prix spot a tendance à baisser.`,
    demanda: "Consommation (prévision)", fuentePrev: "Source : ENTSO-E, prévisions day-ahead de production éolienne et solaire et de consommation.",
    negativosT: "Prix négatifs de l'électricité", horasNegativas: "Heures à prix négatif", diasNegativos: "Jours avec des prix négatifs", ultimaNegativa: "Dernière fois", minimo: "Prix le plus bas", ninguna: "aucune", negPorMes: "Heures négatives par mois", ultimoAno: "sur les 12 derniers mois",
    negTexto: (p, h, d) => `Sur les douze derniers mois, le prix spot de l'électricité a été négatif ${p} pendant ${h} heures, réparties sur ${d} jours.`,
    negCero: (p, m, c) => `Sur les douze derniers mois, le prix spot n'est jamais passé sous zéro ${p}. Son plus bas a été atteint ${c}, à ${m}.`,
    pNegPorQue: "Pourquoi les prix de l'électricité deviennent-ils négatifs ?", rNegPorQue: "Quand l'éolien et le solaire produisent beaucoup alors que la demande est faible (week-ends ensoleillés, jours fériés, nuits venteuses), certaines centrales continuent malgré tout de tourner. Les producteurs paient alors pour écouler leur électricité et le prix passe sous zéro.",
    pNegCuantas: "Combien de fois le prix est-il négatif ?", pNegAprovechar: "Puis-je profiter des prix négatifs ?", rNegAprovechar: "Seulement avec une offre à prix dynamique. Vous payez toujours le réseau et les taxes, mais l'énergie elle-même ne coûte alors presque rien : c'est le bon moment pour recharger la voiture ou chauffer l'eau.",
    mesesT: "Prix de l'électricité par mois", mesT: (m, l) => `Prix de l'électricité en ${m} ${l}`, mediaMes: "Moyenne du mois", diaMasBarato: "Jour le moins cher", diaMasCaro: "Jour le plus cher", vsMesAnterior: "Mois précédent", vsAnoAnterior: "Même mois l'an dernier", perfilT: "Prix moyen selon l'heure",
    pMes: (m) => `Quel a été le prix spot de l'électricité en ${m} ?`,
    rMes: (m, x, d) => `En ${m}, le prix spot moyen a été de ${x}${d ? ` sur les ${d} premiers jours` : ""}, hors taxes, réseau et marge du fournisseur.`,
    rMesDias: (b, pb, c, pc) => `Le jour le moins cher a été le ${b} (${pb}), le plus cher le ${c} (${pc}).`,
    mes: "Mois", dias: "jours", y: "et",
  },
  it: {
    slugMix: "mix-energetico", slugNegativos: "prezzi-negativi", slugMes: "prezzo-luce-mese",
    grupos: { eolica: "eolico", solar: "solare", hidraulica: "idroelettrico", nuclear: "nucleare", gas: "gas", carbon: "carbone", biomasa: "biomasse", petroleo: "petrolio", otrasRenovables: "altre rinnovabili", otras: "altro" },
    mix: "Mix energetico", hoy: "oggi", ayer: "ieri", hasta: (h) => `fino alle ${h}`, renovable: "Rinnovabili", bajasEmisiones: "A basse emissioni",
    co2: "Intensità di CO₂", estimado: "stima, solo emissioni dirette", ultimos30: "Quota di rinnovabili negli ultimi 30 giorni", produccion: "Produzione", produccionHoras: "Produzione ora per ora",
    pctRenovTitulo: (p) => `${p} da rinnovabili`,
    pMix: "Da dove arriva l'elettricità oggi?", rMix: (r, t) => `Oggi ${r.startsWith("8") || r.startsWith("11") || r.startsWith("1%") ? "l'" : "il "}${r} dell'elettricità prodotta viene da fonti rinnovabili. Le fonti principali sono ${t}.`,
    pCo2: "Quanto è pulita l'elettricità in questo momento?", rCo2: (g) => `Stimiamo l'intensità di CO₂ della produzione di oggi in ${g} g di CO₂ per kWh, considerando solo le emissioni dirette delle centrali.`,
    fuenteMix: "Fonte: ENTSO-E, produzione effettiva per fonte.",
    previsionT: "Previsioni di eolico e solare per domani", prevTexto: (e, s, p) => `Per domani sono previsti ${e} da eolico e ${s} da solare${p ? `, circa ${p.startsWith("8") || p.startsWith("11") ? "l'" : "il "}${p} dei consumi attesi` : ""}. Più vento e sole ci sono, più il prezzo all'ingrosso tende a scendere.`,
    demanda: "Consumi (previsione)", fuentePrev: "Fonte: ENTSO-E, previsioni del giorno prima per eolico, solare e carico.",
    negativosT: "Prezzi negativi dell'elettricità", horasNegativas: "Ore a prezzo negativo", diasNegativos: "Giorni con prezzi negativi", ultimaNegativa: "Ultima volta", minimo: "Prezzo più basso", ninguna: "nessuna", negPorMes: "Ore a prezzo negativo per mese", ultimoAno: "negli ultimi 12 mesi",
    negTexto: (p, h, d) => `Negli ultimi dodici mesi il prezzo all'ingrosso dell'elettricità ${p} è stato negativo per ${h} ore, distribuite su ${d} giorni.`,
    negCero: (p, m, c) => `Negli ultimi dodici mesi il prezzo all'ingrosso ${p} non è mai sceso sotto zero. Il minimo è stato toccato ${c}, a ${m}.`,
    pNegPorQue: "Perché il prezzo dell'elettricità può diventare negativo?", rNegPorQue: "Quando eolico e solare producono molto e la domanda è bassa (fine settimana di sole, festivi, notti ventose), alcune centrali continuano comunque a funzionare. I produttori arrivano allora a pagare pur di immettere energia in rete e il prezzo scende sotto zero.",
    pNegCuantas: "Quante volte il prezzo è negativo?", pNegAprovechar: "Posso approfittare dei prezzi negativi?", rNegAprovechar: "Solo con un'offerta a prezzo orario indicizzato. Oneri, trasporto e imposte si pagano comunque, ma l'energia in quelle ore costa quasi nulla: è il momento giusto per ricaricare l'auto o scaldare l'acqua.",
    mesesT: "Prezzo della luce mese per mese", mesT: (m, l) => `Prezzo della luce a ${m} ${l}`, mediaMes: "Media del mese", diaMasBarato: "Giorno più economico", diaMasCaro: "Giorno più caro", vsMesAnterior: "Mese precedente", vsAnoAnterior: "Stesso mese dell'anno scorso", perfilT: "Prezzo medio per fascia oraria",
    pMes: (m) => `Quanto è costata l'elettricità all'ingrosso a ${m}?`,
    rMes: (m, x, d) => `A ${m} il prezzo medio del mercato del giorno prima è stato di ${x}${d ? ` nei primi ${d} giorni` : ""}, senza imposte, oneri e margine del fornitore.`,
    rMesDias: (b, pb, c, pc) => `Il giorno più economico è stato il ${b} (${pb}), il più caro il ${c} (${pc}).`,
    mes: "Mese", dias: "giorni", y: "e",
  },
  nl: {
    slugMix: "energiemix", slugNegativos: "negatieve-stroomprijzen", slugMes: "stroomprijs-per-maand",
    grupos: { eolica: "wind", solar: "zon", hidraulica: "waterkracht", nuclear: "kernenergie", gas: "aardgas", carbon: "kolen", biomasa: "biomassa", petroleo: "olie", otrasRenovables: "overig duurzaam", otras: "overig" },
    mix: "Energiemix", hoy: "vandaag", ayer: "gisteren", hasta: (h) => `tot ${h}`, renovable: "Duurzaam", bajasEmisiones: "CO₂-arm (met kernenergie)",
    co2: "CO₂-intensiteit", estimado: "schatting, alleen directe uitstoot", ultimos30: "Aandeel duurzame stroom in de afgelopen 30 dagen", produccion: "Opwek", produccionHoras: "Opwek per uur",
    pctRenovTitulo: (p) => `${p} duurzaam opgewekt`,
    pMix: "Waar komt de stroom vandaag vandaan?", rMix: (r, t) => `Vandaag is ${r} van de opgewekte stroom duurzaam. De grootste bronnen zijn ${t}.`,
    pCo2: "Hoe schoon is de stroom op dit moment?", rCo2: (g) => `Wij schatten de CO₂-intensiteit van de opwek vandaag op ${g} g CO₂ per kWh. Daarbij tellen we alleen de directe uitstoot van centrales mee.`,
    fuenteMix: "Bron: ENTSO-E, werkelijke opwek per bron.",
    previsionT: "Wind- en zonverwachting voor morgen", prevTexto: (e, s, p) => `Voor morgen wordt ${e} windstroom en ${s} zonnestroom verwacht${p ? `, ongeveer ${p} van het verwachte verbruik` : ""}. Hoe meer wind en zon, hoe lager de beursprijs meestal is.`,
    demanda: "Verbruik (verwachting)", fuentePrev: "Bron: ENTSO-E, day-aheadverwachtingen voor wind, zon en verbruik.",
    negativosT: "Negatieve stroomprijzen", horasNegativas: "Uren met een negatieve prijs", diasNegativos: "Dagen met negatieve prijzen", ultimaNegativa: "Laatste keer", minimo: "Laagste prijs", ninguna: "geen", negPorMes: "Negatieve uren per maand", ultimoAno: "in de afgelopen 12 maanden",
    negTexto: (p, h, d) => `In de afgelopen twaalf maanden was de stroomprijs op de beurs ${p} ${h} uur negatief, verspreid over ${d} dagen.`,
    negCero: (p, m, c) => `In de afgelopen twaalf maanden is de beursprijs ${p} niet onder nul gekomen. Het laagst was hij ${c}, met ${m}.`,
    pNegPorQue: "Waarom is de stroomprijs soms negatief?", rNegPorQue: "Als er veel wind- en zonnestroom is terwijl er weinig wordt verbruikt, bijvoorbeeld op zonnige weekenden, feestdagen of winderige nachten, blijven sommige centrales toch draaien. Producenten betalen dan om hun stroom kwijt te kunnen en de prijs zakt onder nul.",
    pNegCuantas: "Hoe vaak is de stroomprijs negatief?", pNegAprovechar: "Heb ik iets aan negatieve stroomprijzen?", rNegAprovechar: "Alleen met een dynamisch energiecontract. Energiebelasting en netbeheerkosten betaal je nog steeds, maar de stroom zelf kost dan bijna niets: een goed moment om de auto te laden of de boiler aan te zetten. Met zonnepanelen krijg je op die uren juist weinig of niets voor teruglevering.",
    mesesT: "Stroomprijs per maand", mesT: (m, l) => `Stroomprijs ${l} in ${m}`, mediaMes: "Maandgemiddelde", diaMasBarato: "Goedkoopste dag", diaMasCaro: "Duurste dag", vsMesAnterior: "Vorige maand", vsAnoAnterior: "Zelfde maand vorig jaar", perfilT: "Gemiddelde prijs per uur van de dag",
    pMes: (m) => `Wat was de beursprijs van stroom in ${m}?`,
    rMes: (m, x, d) => `In ${m} was de gemiddelde beursprijs${d ? ` tot nu toe (${d} dagen)` : ""} ${x}, zonder btw, energiebelasting en netbeheerkosten.`,
    rMesDias: (b, pb, c, pc) => `De goedkoopste dag was ${b} (${pb}), de duurste ${c} (${pc}).`,
    mes: "Maand", dias: "dagen", y: "en",
  },
  pt: {
    slugMix: "mix-eletrico", slugNegativos: "precos-negativos", slugMes: "preco-luz-mes",
    grupos: { eolica: "eólica", solar: "solar", hidraulica: "hídrica", nuclear: "nuclear", gas: "gás natural", carbon: "carvão", biomasa: "biomassa", petroleo: "petróleo", otrasRenovables: "outras renováveis", otras: "outras" },
    mix: "Mix elétrico", hoy: "hoje", ayer: "ontem", hasta: (h) => `até às ${h}`, renovable: "Renováveis", bajasEmisiones: "Baixo carbono",
    co2: "Intensidade de CO₂", estimado: "estimativa, só emissões diretas", ultimos30: "Peso das renováveis nos últimos 30 dias", produccion: "Produção", produccionHoras: "Produção hora a hora",
    pctRenovTitulo: (p) => `${p} de origem renovável`,
    pMix: "De onde vem a eletricidade hoje?", rMix: (r, t) => `Hoje, ${r} da eletricidade produzida vem de fontes renováveis. As principais fontes são ${t}.`,
    pCo2: "Quão limpa está a eletricidade neste momento?", rCo2: (g) => `Estimamos a intensidade de CO₂ da produção de hoje em ${g} g de CO₂ por kWh, contando apenas as emissões diretas das centrais.`,
    fuenteMix: "Fonte: ENTSO-E, produção real por tecnologia.",
    previsionT: "Previsão eólica e solar para amanhã", prevTexto: (e, s, p) => `Para amanhã prevê-se ${e} de eólica e ${s} de solar${p ? `, cerca de ${p} do consumo previsto` : ""}. Quanto mais vento e sol, mais baixo tende a ficar o preço no mercado.`,
    demanda: "Consumo (previsão)", fuentePrev: "Fonte: ENTSO-E, previsões para o dia seguinte de eólica, solar e consumo.",
    negativosT: "Preços negativos da eletricidade", horasNegativas: "Horas com preço negativo", diasNegativos: "Dias com preços negativos", ultimaNegativa: "Última vez", minimo: "Preço mais baixo", ninguna: "nenhuma", negPorMes: "Horas negativas por mês", ultimoAno: "nos últimos 12 meses",
    negTexto: (p, h, d) => `Nos últimos doze meses, o preço da eletricidade no mercado esteve negativo ${p} durante ${h} horas, repartidas por ${d} dias.`,
    negCero: (p, m, c) => `Nos últimos doze meses, o preço no mercado nunca desceu abaixo de zero ${p}. O valor mais baixo registou-se ${c}: ${m}.`,
    pNegPorQue: "Porque é que o preço da eletricidade fica negativo?", rNegPorQue: "Quando há muita produção eólica e solar e pouca procura, por exemplo em fins de semana de sol, feriados ou noites de vento, algumas centrais continuam a produzir. Os produtores chegam a pagar para escoar a eletricidade e o preço desce abaixo de zero.",
    pNegCuantas: "Quantas vezes o preço fica negativo?", pNegAprovechar: "Posso tirar partido dos preços negativos?", rNegAprovechar: "Só com um tarifário indexado ao preço horário. Continua a pagar as redes e os impostos, mas a energia em si quase não custa nada: é a altura certa para carregar o carro ou aquecer a água.",
    mesesT: "Preço da luz por mês", mesT: (m, l) => `Preço da luz ${l} em ${m}`, mediaMes: "Média do mês", diaMasBarato: "Dia mais barato", diaMasCaro: "Dia mais caro", vsMesAnterior: "Mês anterior", vsAnoAnterior: "Mesmo mês do ano passado", perfilT: "Preço médio por hora do dia",
    pMes: (m) => `Qual foi o preço da eletricidade no mercado em ${m}?`,
    rMes: (m, x, d) => `Em ${m}, o preço médio do mercado diário foi de ${x}${d ? ` nos primeiros ${d} dias` : ""}, sem impostos, redes nem margem do comercializador.`,
    rMesDias: (b, pb, c, pc) => `O dia mais barato foi ${b} (${pb}) e o mais caro ${c} (${pc}).`,
    mes: "Mês", dias: "dias", y: "e",
  },
  sv: {
    slugMix: "elmix", slugNegativos: "negativa-elpriser", slugMes: "elpris-per-manad",
    grupos: { eolica: "vindkraft", solar: "solkraft", hidraulica: "vattenkraft", nuclear: "kärnkraft", gas: "gas", carbon: "kol", biomasa: "biobränsle", petroleo: "olja", otrasRenovables: "annan förnybar", otras: "övrigt" },
    mix: "Elmix", hoy: "idag", ayer: "igår", hasta: (h) => `fram till kl. ${h}`, renovable: "Förnybart", bajasEmisiones: "Fossilfritt (med kärnkraft)",
    co2: "Koldioxidintensitet", estimado: "uppskattning, bara direkta utsläpp", ultimos30: "Andel förnybart de senaste 30 dagarna", produccion: "Produktion", produccionHoras: "Produktion timme för timme",
    pctRenovTitulo: (p) => `${p} förnybart`,
    pMix: "Var kommer elen ifrån idag?", rMix: (r, t) => `Idag kommer ${r} av elen från förnybara källor. Mest bidrar ${t}.`,
    pCo2: "Hur ren är elen just nu?", rCo2: (g) => `Vi uppskattar dagens koldioxidintensitet till ${g} g CO₂ per kWh. Då räknas bara kraftverkens direkta utsläpp.`,
    fuenteMix: "Källa: ENTSO-E, faktisk produktion per kraftslag.",
    previsionT: "Vind- och solprognos för imorgon", prevTexto: (e, s, p) => `Imorgon väntas ${e} vindkraft och ${s} solkraft${p ? `, ungefär ${p} av den beräknade förbrukningen` : ""}. Ju mer vind och sol, desto lägre brukar spotpriset bli.`,
    demanda: "Förbrukning (prognos)", fuentePrev: "Källa: ENTSO-E, prognoser för vind, sol och förbrukning dagen före.",
    negativosT: "Negativa elpriser", horasNegativas: "Timmar med negativt pris", diasNegativos: "Dagar med negativa priser", ultimaNegativa: "Senast", minimo: "Lägsta pris", ninguna: "ingen", negPorMes: "Negativa timmar per månad", ultimoAno: "de senaste 12 månaderna",
    negTexto: (p, h, d) => `De senaste tolv månaderna har spotpriset ${p} varit negativt i ${h} timmar, utspritt över ${d} dagar.`,
    negCero: (p, m, c) => `De senaste tolv månaderna har spotpriset ${p} aldrig gått under noll. Som lägst var det ${c}, ${m}.`,
    pNegPorQue: "Varför blir elpriset negativt?", rNegPorQue: "När vind och sol producerar mycket samtidigt som förbrukningen är låg, till exempel soliga helger, helgdagar eller blåsiga nätter, fortsätter vissa kraftverk ändå att producera. Producenterna betalar då för att bli av med elen och priset hamnar under noll.",
    pNegCuantas: "Hur ofta är elpriset negativt?", pNegAprovechar: "Kan jag tjäna på negativa elpriser?", rNegAprovechar: "Bara med timprisavtal. Elnät, energiskatt och moms betalar du ändå, men själva elen kostar nästan ingenting: ett bra läge att ladda elbilen eller värma varmvattnet.",
    mesesT: "Elpris per månad", mesT: (m, l) => `Elpris ${l} i ${m}`, mediaMes: "Månadens snittpris", diaMasBarato: "Billigaste dagen", diaMasCaro: "Dyraste dagen", vsMesAnterior: "Föregående månad", vsAnoAnterior: "Samma månad i fjol", perfilT: "Snittpris per timme",
    pMes: (m) => `Vad var spotpriset på el i ${m}?`,
    rMes: (m, x, d) => `I ${m} var snittpriset på elbörsen ${x}${d ? ` hittills (${d} dagar)` : ""}, exklusive moms, elnät och påslag.`,
    rMesDias: (b, pb, c, pc) => `Billigast var det den ${b} (${pb}) och dyrast den ${c} (${pc}).`,
    mes: "Månad", dias: "dagar", y: "och",
  },
  da: {
    slugMix: "elmix", slugNegativos: "negative-elpriser", slugMes: "elpris-pr-maaned",
    grupos: { eolica: "vind", solar: "sol", hidraulica: "vandkraft", nuclear: "atomkraft", gas: "naturgas", carbon: "kul", biomasa: "biomasse", petroleo: "olie", otrasRenovables: "anden vedvarende energi", otras: "andet" },
    mix: "Elmix", hoy: "i dag", ayer: "i går", hasta: (h) => `frem til kl. ${h}`, renovable: "Vedvarende", bajasEmisiones: "CO₂-fri",
    co2: "CO₂-intensitet", estimado: "skøn, kun direkte udledning", ultimos30: "Andel vedvarende energi de seneste 30 dage", produccion: "Produktion", produccionHoras: "Produktion time for time",
    pctRenovTitulo: (p) => `${p} vedvarende energi`,
    pMix: "Hvor kommer strømmen fra i dag?", rMix: (r, t) => `I dag kommer ${r} af strømmen fra vedvarende kilder. Mest kommer fra ${t}.`,
    pCo2: "Hvor grøn er strømmen lige nu?", rCo2: (g) => `Vi anslår dagens CO₂-intensitet til ${g} g CO₂ pr. kWh. Det tæller kun kraftværkernes direkte udledning.`,
    fuenteMix: "Kilde: ENTSO-E, faktisk produktion fordelt på energikilder.",
    previsionT: "Vind- og solprognose for i morgen", prevTexto: (e, s, p) => `I morgen ventes ${e} vindstrøm og ${s} solstrøm${p ? `, omkring ${p} af det forventede forbrug` : ""}. Jo mere vind og sol, jo lavere bliver spotprisen som regel.`,
    demanda: "Forbrug (prognose)", fuentePrev: "Kilde: ENTSO-E, prognoser for vind, sol og forbrug dagen før.",
    negativosT: "Negative elpriser", horasNegativas: "Timer med negativ pris", diasNegativos: "Dage med negative priser", ultimaNegativa: "Senest", minimo: "Laveste pris", ninguna: "ingen", negPorMes: "Negative timer pr. måned", ultimoAno: "de seneste 12 måneder",
    negTexto: (p, h, d) => `De seneste tolv måneder har spotprisen ${p} været negativ i ${h} timer fordelt på ${d} dage.`,
    negCero: (p, m, c) => `De seneste tolv måneder er spotprisen ${p} ikke kommet under nul. Lavest var den ${c}, ${m}.`,
    pNegPorQue: "Hvorfor bliver elprisen negativ?", rNegPorQue: "Når vind og sol producerer meget, samtidig med at forbruget er lavt, for eksempel i solrige weekender, på helligdage eller i blæsende nætter, kører nogle kraftværker videre alligevel. Producenterne betaler så for at komme af med strømmen, og prisen falder under nul.",
    pNegCuantas: "Hvor tit er elprisen negativ?", pNegAprovechar: "Kan jeg få glæde af negative elpriser?", rNegAprovechar: "Kun med en elaftale med timepris. Nettarif, elafgift og moms betaler du stadig, men selve strømmen koster næsten ingenting: et godt tidspunkt at oplade elbilen eller varme vand.",
    mesesT: "Elpris pr. måned", mesT: (m, l) => `Elpris ${l} i ${m}`, mediaMes: "Månedens gennemsnit", diaMasBarato: "Billigste dag", diaMasCaro: "Dyreste dag", vsMesAnterior: "Måneden før", vsAnoAnterior: "Samme måned sidste år", perfilT: "Gennemsnitspris time for time",
    pMes: (m) => `Hvad var spotprisen på el i ${m}?`,
    rMes: (m, x, d) => `I ${m} var gennemsnitsprisen på elbørsen ${x}${d ? ` indtil videre (${d} dage)` : ""}, uden moms, afgifter og nettarif.`,
    rMesDias: (b, pb, c, pc) => `Billigst var det den ${b} (${pb}) og dyrest den ${c} (${pc}).`,
    mes: "Måned", dias: "dage", y: "og",
  },
  fi: {
    slugMix: "sahkontuotanto", slugNegativos: "negatiivinen-sahkon-hinta", slugMes: "sahkon-hinta-kuukausittain",
    grupos: { eolica: "tuulivoima", solar: "aurinkovoima", hidraulica: "vesivoima", nuclear: "ydinvoima", gas: "maakaasu", carbon: "hiili", biomasa: "biomassa", petroleo: "öljy", otrasRenovables: "muu uusiutuva", otras: "muu" },
    mix: "Sähköntuotanto", hoy: "tänään", ayer: "eilen", hasta: (h) => `klo ${h} asti`, renovable: "Uusiutuva", bajasEmisiones: "Päästötön (ydinvoima mukana)",
    co2: "CO₂-päästöt", estimado: "arvio, vain suorat päästöt", ultimos30: "Uusiutuvan osuus viimeisten 30 päivän aikana", produccion: "Tuotanto", produccionHoras: "Tuotanto tunneittain",
    pctRenovTitulo: (p) => `${p} uusiutuvaa`,
    pMix: "Mistä sähkö tulee tänään?", rMix: (r, t) => `Tänään ${r} tuotetusta sähköstä on uusiutuvaa. Suurimmat lähteet ovat ${t}.`,
    pCo2: "Kuinka puhdasta sähkö on juuri nyt?", rCo2: (g) => `Arviomme mukaan tämänpäiväisen tuotannon päästöt ovat ${g} g CO₂ kilowattitunnilta. Mukana ovat vain voimaloiden suorat päästöt.`,
    fuenteMix: "Lähde: ENTSO-E, toteutunut tuotanto tuotantomuodoittain.",
    previsionT: "Tuuli- ja aurinkoennuste huomiselle", prevTexto: (e, s, p) => `Huomiseksi ennustetaan ${e} tuulivoimaa ja ${s} aurinkovoimaa${p ? `, noin ${p} ennustetusta kulutuksesta` : ""}. Mitä enemmän tuulee ja paistaa, sitä halvempaa pörssisähkö yleensä on.`,
    demanda: "Kulutus (ennuste)", fuentePrev: "Lähde: ENTSO-E, seuraavan päivän tuuli-, aurinko- ja kulutusennusteet.",
    negativosT: "Negatiiviset sähkön hinnat", horasNegativas: "Tunteja negatiivisella hinnalla", diasNegativos: "Päiviä negatiivisilla hinnoilla", ultimaNegativa: "Viimeksi", minimo: "Alin hinta", ninguna: "ei kertaakaan", negPorMes: "Negatiiviset tunnit kuukausittain", ultimoAno: "viimeisten 12 kuukauden aikana",
    negTexto: (p, h, d) => `Viimeisten kahdentoista kuukauden aikana pörssisähkön hinta on ollut ${p} negatiivinen ${h} tuntia ${d} eri päivänä.`,
    negCero: (p, m, c) => `Viimeisten kahdentoista kuukauden aikana pörssisähkön hinta ei ole ${p} käynyt nollan alapuolella. Alimmillaan se oli ${c}: ${m}.`,
    pNegPorQue: "Miksi sähkön hinta menee negatiiviseksi?", rNegPorQue: "Kun tuuli- ja aurinkovoimaa tuotetaan paljon ja kulutus on samaan aikaan vähäistä, esimerkiksi tuulisina öinä, viikonloppuisin tai pyhinä, osa voimaloista jatkaa silti tuotantoa. Tuottajat maksavat silloin päästäkseen sähköstä eroon, ja hinta painuu nollan alle.",
    pNegCuantas: "Kuinka usein sähkön hinta on negatiivinen?", pNegAprovechar: "Hyödynkö negatiivisista hinnoista?", rNegAprovechar: "Vain pörssisähkösopimuksella. Siirtomaksu ja sähkövero maksetaan silti, mutta itse energia on lähes ilmaista: hyvä hetki ladata sähköauto tai lämmittää käyttövesi.",
    mesesT: "Sähkön hinta kuukausittain", mesT: (m, l) => `Sähkön hinta ${l} ${inesivoMesFi(m)}`, mediaMes: "Kuukauden keskihinta", diaMasBarato: "Halvin päivä", diaMasCaro: "Kallein päivä", vsMesAnterior: "Edellinen kuukausi", vsAnoAnterior: "Sama kuukausi viime vuonna", perfilT: "Keskihinta tunneittain",
    pMes: (m) => `Mikä oli pörssisähkön keskihinta ${inesivoMesFi(m)}?`,
    rMes: (m, x, d) => `${inesivoMesFi(m).charAt(0).toUpperCase()}${inesivoMesFi(m).slice(1)} pörssisähkön keskihinta oli ${x}${d ? ` ensimmäisten ${d} päivän aikana` : ""} ilman arvonlisäveroa, siirtoa ja marginaalia.`,
    rMesDias: (b, pb, c, pc) => `Halvin päivä oli ${b} (${pb}) ja kallein ${c} (${pc}).`,
    mes: "Kuukausi", dias: "päivää", y: "ja",
  },
  no: {
    slugMix: "kraftproduksjon", slugNegativos: "negative-strompriser", slugMes: "strompris-per-maned",
    grupos: { eolica: "vindkraft", solar: "solkraft", hidraulica: "vannkraft", nuclear: "kjernekraft", gas: "gass", carbon: "kull", biomasa: "bioenergi", petroleo: "olje", otrasRenovables: "annen fornybar", otras: "annet" },
    mix: "Kraftproduksjon", hoy: "i dag", ayer: "i går", hasta: (h) => `fram til kl. ${h}`, renovable: "Fornybart", bajasEmisiones: "Utslippsfritt",
    co2: "CO₂-utslipp", estimado: "anslag, bare direkte utslipp", ultimos30: "Andel fornybart de siste 30 dagene", produccion: "Produksjon", produccionHoras: "Produksjon time for time",
    pctRenovTitulo: (p) => `${p} fornybart`,
    pMix: "Hvor kommer strømmen fra i dag?", rMix: (r, t) => `I dag er ${r} av strømmen som produseres fornybar. Mest kommer fra ${t}.`,
    pCo2: "Hvor ren er strømmen nå?", rCo2: (g) => `Vi anslår dagens CO₂-utslipp fra kraftproduksjonen til ${g} g CO₂ per kWh. Da er bare kraftverkenes direkte utslipp regnet med.`,
    fuenteMix: "Kilde: ENTSO-E, faktisk produksjon fordelt på energikilde.",
    previsionT: "Vind- og solprognose for i morgen", prevTexto: (e, s, p) => `I morgen ventes ${e} vindkraft og ${s} solkraft${p ? `, omtrent ${p} av forventet forbruk` : ""}. Jo mer vind, desto lavere blir strømprisen som regel.`,
    demanda: "Forbruk (prognose)", fuentePrev: "Kilde: ENTSO-E, prognoser for vind, sol og forbruk dagen før.",
    negativosT: "Negative strømpriser", horasNegativas: "Timer med negativ pris", diasNegativos: "Dager med negative priser", ultimaNegativa: "Sist", minimo: "Laveste pris", ninguna: "ingen", negPorMes: "Negative timer per måned", ultimoAno: "de siste 12 månedene",
    negTexto: (p, h, d) => `De siste tolv månedene har spotprisen ${p} vært negativ i ${h} timer, fordelt på ${d} dager.`,
    negCero: (p, m, c) => `De siste tolv månedene har spotprisen ${p} ikke vært under null. Lavest var den ${c}, ${m}.`,
    pNegPorQue: "Hvorfor blir strømprisen negativ?", rNegPorQue: "Når det produseres mye vind- og solkraft i Norden og Europa samtidig som forbruket er lavt, fortsetter noen kraftverk likevel å produsere. Produsentene betaler da for å bli kvitt strømmen, og prisen havner under null.",
    pNegCuantas: "Hvor ofte er strømprisen negativ?", pNegAprovechar: "Kan jeg få noe ut av negative strømpriser?", rNegAprovechar: "Bare med spotprisavtale. Nettleie, elavgift og mva. betaler du fortsatt, men selve strømmen koster nesten ingenting: et godt tidspunkt å lade elbilen eller varme vann.",
    mesesT: "Strømpris per måned", mesT: (m, l) => `Strømpris ${l} i ${m}`, mediaMes: "Månedens snittpris", diaMasBarato: "Billigste dag", diaMasCaro: "Dyreste dag", vsMesAnterior: "Måneden før", vsAnoAnterior: "Samme måned i fjor", perfilT: "Snittpris time for time",
    pMes: (m) => `Hva var spotprisen på strøm i ${m}?`,
    rMes: (m, x, d) => `I ${m} var snittprisen på kraftbørsen ${x}${d ? ` så langt (${d} dager)` : ""}, uten mva., nettleie og påslag.`,
    rMesDias: (b, pb, c, pc) => `Billigst var det den ${b} (${pb}) og dyrest den ${c} (${pc}).`,
    mes: "Måned", dias: "dager", y: "og",
  },
};

/** Factores de emisión directa aproximados (g CO₂ por kWh producido). Solo para una estimación orientativa. */
export const FACTOR_CO2: Record<Grupo, number> = { carbon: 950, gas: 400, petroleo: 750, otras: 300, biomasa: 0, eolica: 0, solar: 0, hidraulica: 0, nuclear: 0, otrasRenovables: 0 };
export const RENOVABLES: Grupo[] = ["eolica", "solar", "hidraulica", "biomasa", "otrasRenovables"];
export const COLOR_GRUPO: Record<Grupo, string> = { eolica: "#0aa65a", solar: "#f5c518", hidraulica: "#2b8bb3", nuclear: "#7c18d3", gas: "#e8743b", carbon: "#3d3d3d", biomasa: "#7fb069", petroleo: "#8c564b", otrasRenovables: "#5fd19a", otras: "#c2cec8" };
