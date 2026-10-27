// Textos de las secciones de energía de la web global: mix de generación, previsión de eólica y solar,
// precios negativos y medias mensuales. PENDIENTE: revisión por hablantes nativos.

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
  /** «bis 15:00» */
  hasta: (h: string) => string;
  renovable: string;
  bajasEmisiones: string;
  co2: string;
  estimado: string;
  ultimos30: string;
  produccion: string;
  /** «Woher kommt der Strom heute?» */
  pMix: string;
  rMix: (renov: string, top: string) => string;
  pCo2: string;
  rCo2: (g: string) => string;
  previsionT: string;
  prevTexto: (eol: string, sol: string, pct: string | null) => string;
  demanda: string;
  pPrevision: string;
  negativosT: string;
  horasNegativas: string;
  diasNegativos: string;
  ultimaNegativa: string;
  minimo: string;
  ninguna: string;
  negTexto: (n: string, dias: string, periodo: string) => string;
  ultimoAno: string;
  pNegPorQue: string;
  rNegPorQue: string;
  pNegCuantas: string;
  pNegAprovechar: string;
  rNegAprovechar: string;
  mesesT: string;
  /** «Strompreis Oktober 2026» */
  mesT: (mes: string) => string;
  mediaMes: string;
  diaMasBarato: string;
  diaMasCaro: string;
  vsMesAnterior: string;
  vsAnoAnterior: string;
  perfilT: string;
  pMes: (mes: string) => string;
  rMes: (mes: string, media: string) => string;
  mes: string;
  dias: string;
}

export const TEXTOS_E: Partial<Record<Idioma, TextosEnergia>> = {
  de: {
    slugMix: "strommix", slugNegativos: "negative-strompreise", slugMes: "strompreis-monat",
    grupos: { eolica: "Wind", solar: "Solar", hidraulica: "Wasserkraft", nuclear: "Kernkraft", gas: "Erdgas", carbon: "Kohle", biomasa: "Biomasse", petroleo: "Öl", otrasRenovables: "Sonstige Erneuerbare", otras: "Sonstige" },
    mix: "Strommix", hoy: "heute", ayer: "gestern", hasta: (h) => `bis ${h} Uhr`, renovable: "Erneuerbare", bajasEmisiones: "CO₂-arm (inkl. Kernkraft)",
    co2: "CO₂-Intensität", estimado: "geschätzt, direkte Emissionen", ultimos30: "Anteil der Erneuerbaren in den letzten 30 Tagen", produccion: "Erzeugung",
    pMix: "Woher kommt der Strom heute?", rMix: (r, t) => `Heute stammen ${r} des erzeugten Stroms aus erneuerbaren Quellen. Größte Quellen: ${t}.`,
    pCo2: "Wie sauber ist der Strom gerade?", rCo2: (g) => `Die geschätzte CO₂-Intensität der Erzeugung liegt heute bei ${g} g CO₂ pro kWh (nur direkte Emissionen der Kraftwerke).`,
    previsionT: "Wind- und Solarprognose für morgen", prevTexto: (e, s, p) => `Erwartet werden ${e} Windstrom und ${s} Solarstrom${p ? `, rund ${p} des erwarteten Verbrauchs` : ""}. Viel Wind und Sonne drücken den Börsenpreis.`,
    demanda: "Verbrauch (Prognose)", pPrevision: "Warum ist Strom morgen günstig oder teuer?",
    negativosT: "Negative Strompreise", horasNegativas: "Stunden mit negativem Preis", diasNegativos: "Tage mit negativen Preisen", ultimaNegativa: "Letzte negative Stunde", minimo: "Tiefster Preis", ninguna: "keine",
    negTexto: (n, d, p) => `${p}: ${n} Stunden mit negativem Börsenstrompreis an ${d} Tagen.`, ultimoAno: "In den letzten 12 Monaten",
    pNegPorQue: "Warum gibt es negative Strompreise?", rNegPorQue: "Wenn viel Wind- und Solarstrom ins Netz fließt und die Nachfrage niedrig ist (sonnige Wochenenden, Feiertage, windige Nächte), produzieren manche Kraftwerke trotzdem weiter. Dann zahlen Erzeuger dafür, Strom abgeben zu dürfen: der Preis fällt unter null.",
    pNegCuantas: "Wie oft ist der Strompreis negativ?", pNegAprovechar: "Profitiere ich von negativen Strompreisen?", rNegAprovechar: "Nur mit einem dynamischen Stromtarif. Auch dann zahlst du Netzentgelte, Abgaben und Steuern, aber die Energie selbst kostet nichts oder fast nichts: ideal, um das E-Auto zu laden oder Warmwasser zu machen.",
    mesesT: "Strompreis pro Monat", mesT: (m) => `Strompreis ${m}`, mediaMes: "Monatsdurchschnitt", diaMasBarato: "Günstigster Tag", diaMasCaro: "Teuerster Tag", vsMesAnterior: "Vormonat", vsAnoAnterior: "Vorjahresmonat", perfilT: "Durchschnittspreis nach Uhrzeit",
    pMes: (m) => `Wie hoch war der Börsenstrompreis im ${m}?`, rMes: (m, x) => `Im ${m} lag der durchschnittliche Day-Ahead-Börsenpreis bei ${x} (ohne Steuern, Abgaben und Netzentgelte).`, mes: "Monat", dias: "Tage",
  },
  fr: {
    slugMix: "mix-electrique", slugNegativos: "prix-negatifs", slugMes: "prix-electricite-mois",
    grupos: { eolica: "Éolien", solar: "Solaire", hidraulica: "Hydraulique", nuclear: "Nucléaire", gas: "Gaz", carbon: "Charbon", biomasa: "Biomasse", petroleo: "Fioul", otrasRenovables: "Autres renouvelables", otras: "Autres" },
    mix: "Mix électrique", hoy: "aujourd'hui", ayer: "hier", hasta: (h) => `jusqu'à ${h}`, renovable: "Renouvelables", bajasEmisiones: "Bas carbone (avec nucléaire)",
    co2: "Intensité carbone", estimado: "estimation, émissions directes", ultimos30: "Part des renouvelables sur les 30 derniers jours", produccion: "Production",
    pMix: "D'où vient l'électricité aujourd'hui ?", rMix: (r, t) => `Aujourd'hui, ${r} de l'électricité produite est d'origine renouvelable. Principales sources : ${t}.`,
    pCo2: "L'électricité est-elle décarbonée en ce moment ?", rCo2: (g) => `L'intensité carbone estimée de la production est aujourd'hui de ${g} g de CO₂ par kWh (émissions directes des centrales uniquement).`,
    previsionT: "Prévision éolienne et solaire pour demain", prevTexto: (e, s, p) => `On attend ${e} d'éolien et ${s} de solaire${p ? `, soit environ ${p} de la consommation prévue` : ""}. Beaucoup de vent et de soleil font baisser le prix spot.`,
    demanda: "Consommation (prévision)", pPrevision: "Pourquoi l'électricité sera-t-elle bon marché ou chère demain ?",
    negativosT: "Prix négatifs de l'électricité", horasNegativas: "Heures à prix négatif", diasNegativos: "Jours avec prix négatifs", ultimaNegativa: "Dernière heure négative", minimo: "Prix le plus bas", ninguna: "aucune",
    negTexto: (n, d, p) => `${p} : ${n} heures à prix spot négatif, sur ${d} jours.`, ultimoAno: "Sur les 12 derniers mois",
    pNegPorQue: "Pourquoi les prix de l'électricité sont-ils négatifs ?", rNegPorQue: "Quand le vent et le soleil produisent beaucoup et que la demande est faible (week-ends ensoleillés, jours fériés, nuits venteuses), certaines centrales continuent de produire. Les producteurs paient alors pour injecter leur électricité : le prix passe sous zéro.",
    pNegCuantas: "Combien de fois le prix est-il négatif ?", pNegAprovechar: "Puis-je profiter des prix négatifs ?", rNegAprovechar: "Seulement avec une offre à prix dynamique. Vous payez toujours le réseau et les taxes, mais l'énergie elle-même ne coûte presque rien : c'est le moment idéal pour recharger la voiture ou chauffer l'eau.",
    mesesT: "Prix de l'électricité par mois", mesT: (m) => `Prix de l'électricité, ${m}`, mediaMes: "Moyenne du mois", diaMasBarato: "Jour le moins cher", diaMasCaro: "Jour le plus cher", vsMesAnterior: "Mois précédent", vsAnoAnterior: "Même mois l'an dernier", perfilT: "Prix moyen selon l'heure",
    pMes: (m) => `Quel a été le prix spot de l'électricité en ${m} ?`, rMes: (m, x) => `En ${m}, le prix spot moyen (day-ahead) a été de ${x}, hors taxes, réseau et marge du fournisseur.`, mes: "Mois", dias: "jours",
  },
  it: {
    slugMix: "mix-energetico", slugNegativos: "prezzi-negativi", slugMes: "prezzo-luce-mese",
    grupos: { eolica: "Eolico", solar: "Solare", hidraulica: "Idroelettrico", nuclear: "Nucleare", gas: "Gas", carbon: "Carbone", biomasa: "Biomasse", petroleo: "Petrolio", otrasRenovables: "Altre rinnovabili", otras: "Altro" },
    mix: "Mix energetico", hoy: "oggi", ayer: "ieri", hasta: (h) => `fino alle ${h}`, renovable: "Rinnovabili", bajasEmisiones: "A basse emissioni",
    co2: "Intensità di CO₂", estimado: "stima, emissioni dirette", ultimos30: "Quota di rinnovabili negli ultimi 30 giorni", produccion: "Produzione",
    pMix: "Da dove viene l'elettricità oggi?", rMix: (r, t) => `Oggi il ${r} dell'elettricità prodotta viene da fonti rinnovabili. Fonti principali: ${t}.`,
    pCo2: "Quanto è pulita l'elettricità adesso?", rCo2: (g) => `L'intensità di CO₂ stimata della produzione oggi è di ${g} g di CO₂ per kWh (solo emissioni dirette delle centrali).`,
    previsionT: "Previsione eolica e solare per domani", prevTexto: (e, s, p) => `Sono previsti ${e} di eolico e ${s} di solare${p ? `, circa il ${p} dei consumi previsti` : ""}. Tanto vento e sole abbassano il prezzo all'ingrosso.`,
    demanda: "Consumi (previsione)", pPrevision: "Perché domani la luce costerà poco o tanto?",
    negativosT: "Prezzi negativi dell'elettricità", horasNegativas: "Ore a prezzo negativo", diasNegativos: "Giorni con prezzi negativi", ultimaNegativa: "Ultima ora negativa", minimo: "Prezzo più basso", ninguna: "nessuna",
    negTexto: (n, d, p) => `${p}: ${n} ore con prezzo all'ingrosso negativo, in ${d} giorni.`, ultimoAno: "Negli ultimi 12 mesi",
    pNegPorQue: "Perché il prezzo dell'elettricità diventa negativo?", rNegPorQue: "Quando eolico e solare producono molto e la domanda è bassa (fine settimana di sole, festivi, notti ventose), alcune centrali continuano a produrre. I produttori pagano allora per immettere energia in rete e il prezzo scende sotto zero.",
    pNegCuantas: "Quante volte il prezzo è negativo?", pNegAprovechar: "Posso approfittare dei prezzi negativi?", rNegAprovechar: "Solo con un'offerta a prezzo orario indicizzato. Paghi comunque oneri, trasporto e imposte, ma l'energia costa quasi nulla: è il momento ideale per ricaricare l'auto o scaldare l'acqua.",
    mesesT: "Prezzo della luce per mese", mesT: (m) => `Prezzo luce ${m}`, mediaMes: "Media del mese", diaMasBarato: "Giorno più economico", diaMasCaro: "Giorno più caro", vsMesAnterior: "Mese precedente", vsAnoAnterior: "Stesso mese anno scorso", perfilT: "Prezzo medio per ora del giorno",
    pMes: (m) => `Quanto è costata l'elettricità all'ingrosso a ${m}?`, rMes: (m, x) => `A ${m} il prezzo medio del mercato del giorno prima è stato di ${x}, senza imposte, oneri e margine del fornitore.`, mes: "Mese", dias: "giorni",
  },
  nl: {
    slugMix: "energiemix", slugNegativos: "negatieve-stroomprijzen", slugMes: "stroomprijs-per-maand",
    grupos: { eolica: "Wind", solar: "Zon", hidraulica: "Waterkracht", nuclear: "Kernenergie", gas: "Aardgas", carbon: "Kolen", biomasa: "Biomassa", petroleo: "Olie", otrasRenovables: "Overig duurzaam", otras: "Overig" },
    mix: "Energiemix", hoy: "vandaag", ayer: "gisteren", hasta: (h) => `tot ${h}`, renovable: "Duurzaam", bajasEmisiones: "CO₂-arm (met kernenergie)",
    co2: "CO₂-intensiteit", estimado: "schatting, directe uitstoot", ultimos30: "Aandeel duurzaam in de afgelopen 30 dagen", produccion: "Productie",
    pMix: "Waar komt de stroom vandaag vandaan?", rMix: (r, t) => `Vandaag komt ${r} van de opgewekte stroom uit duurzame bronnen. Grootste bronnen: ${t}.`,
    pCo2: "Hoe schoon is de stroom nu?", rCo2: (g) => `De geschatte CO₂-intensiteit van de opwek is vandaag ${g} g CO₂ per kWh (alleen directe uitstoot van centrales).`,
    previsionT: "Wind- en zonprognose voor morgen", prevTexto: (e, s, p) => `Verwacht wordt ${e} windstroom en ${s} zonnestroom${p ? `, ongeveer ${p} van het verwachte verbruik` : ""}. Veel wind en zon drukken de beursprijs.`,
    demanda: "Verbruik (prognose)", pPrevision: "Waarom is stroom morgen goedkoop of duur?",
    negativosT: "Negatieve stroomprijzen", horasNegativas: "Uren met negatieve prijs", diasNegativos: "Dagen met negatieve prijzen", ultimaNegativa: "Laatste negatieve uur", minimo: "Laagste prijs", ninguna: "geen",
    negTexto: (n, d, p) => `${p}: ${n} uur met een negatieve beursprijs, verdeeld over ${d} dagen.`, ultimoAno: "In de afgelopen 12 maanden",
    pNegPorQue: "Waarom is de stroomprijs soms negatief?", rNegPorQue: "Als er veel wind- en zonnestroom is en de vraag laag is (zonnige weekenden, feestdagen, winderige nachten), blijven sommige centrales toch draaien. Producenten betalen dan om stroom te mogen leveren: de prijs zakt onder nul.",
    pNegCuantas: "Hoe vaak is de stroomprijs negatief?", pNegAprovechar: "Heb ik voordeel van negatieve stroomprijzen?", rNegAprovechar: "Alleen met een dynamisch energiecontract. Je betaalt nog wel energiebelasting en netbeheerkosten, maar de stroom zelf kost bijna niets: ideaal om de auto te laden of de boiler aan te zetten. Met zonnepanelen krijg je voor teruglevering op die uren juist niets of moet je betalen.",
    mesesT: "Stroomprijs per maand", mesT: (m) => `Stroomprijs ${m}`, mediaMes: "Maandgemiddelde", diaMasBarato: "Goedkoopste dag", diaMasCaro: "Duurste dag", vsMesAnterior: "Vorige maand", vsAnoAnterior: "Zelfde maand vorig jaar", perfilT: "Gemiddelde prijs per uur van de dag",
    pMes: (m) => `Wat was de beursprijs van stroom in ${m}?`, rMes: (m, x) => `In ${m} was de gemiddelde day-ahead-beursprijs ${x}, zonder btw, energiebelasting en netbeheerkosten.`, mes: "Maand", dias: "dagen",
  },
  pt: {
    slugMix: "mix-eletrico", slugNegativos: "precos-negativos", slugMes: "preco-luz-mes",
    grupos: { eolica: "Eólica", solar: "Solar", hidraulica: "Hídrica", nuclear: "Nuclear", gas: "Gás natural", carbon: "Carvão", biomasa: "Biomassa", petroleo: "Petróleo", otrasRenovables: "Outras renováveis", otras: "Outras" },
    mix: "Mix elétrico", hoy: "hoje", ayer: "ontem", hasta: (h) => `até às ${h}`, renovable: "Renováveis", bajasEmisiones: "Baixo carbono",
    co2: "Intensidade de CO₂", estimado: "estimativa, emissões diretas", ultimos30: "Peso das renováveis nos últimos 30 dias", produccion: "Produção",
    pMix: "De onde vem a eletricidade hoje?", rMix: (r, t) => `Hoje, ${r} da eletricidade produzida vem de fontes renováveis. Principais fontes: ${t}.`,
    pCo2: "Quão limpa é a eletricidade agora?", rCo2: (g) => `A intensidade de CO₂ estimada da produção é hoje de ${g} g de CO₂ por kWh (apenas emissões diretas das centrais).`,
    previsionT: "Previsão eólica e solar para amanhã", prevTexto: (e, s, p) => `Prevê-se ${e} de eólica e ${s} de solar${p ? `, cerca de ${p} do consumo previsto` : ""}. Muito vento e sol fazem baixar o preço do mercado.`,
    demanda: "Consumo (previsão)", pPrevision: "Porque é que a luz vai estar barata ou cara amanhã?",
    negativosT: "Preços negativos da eletricidade", horasNegativas: "Horas com preço negativo", diasNegativos: "Dias com preços negativos", ultimaNegativa: "Última hora negativa", minimo: "Preço mais baixo", ninguna: "nenhuma",
    negTexto: (n, d, p) => `${p}: ${n} horas com preço de mercado negativo, em ${d} dias.`, ultimoAno: "Nos últimos 12 meses",
    pNegPorQue: "Porque é que o preço da eletricidade fica negativo?", rNegPorQue: "Quando há muita produção eólica e solar e pouca procura (fins de semana de sol, feriados, noites de vento), algumas centrais continuam a produzir. Os produtores pagam então para injetar eletricidade na rede e o preço desce abaixo de zero.",
    pNegCuantas: "Quantas vezes o preço é negativo?", pNegAprovechar: "Posso aproveitar os preços negativos?", rNegAprovechar: "Só com um tarifário indexado ao preço horário. Continua a pagar redes e impostos, mas a energia quase não custa nada: é a altura ideal para carregar o carro ou aquecer a água.",
    mesesT: "Preço da luz por mês", mesT: (m) => `Preço da luz em ${m}`, mediaMes: "Média do mês", diaMasBarato: "Dia mais barato", diaMasCaro: "Dia mais caro", vsMesAnterior: "Mês anterior", vsAnoAnterior: "Mesmo mês do ano passado", perfilT: "Preço médio por hora do dia",
    pMes: (m) => `Qual foi o preço da eletricidade no mercado em ${m}?`, rMes: (m, x) => `Em ${m}, o preço médio do mercado diário (OMIE) foi de ${x}, sem impostos, redes nem margem do comercializador.`, mes: "Mês", dias: "dias",
  },
  sv: {
    slugMix: "elmix", slugNegativos: "negativa-elpriser", slugMes: "elpris-per-manad",
    grupos: { eolica: "Vind", solar: "Sol", hidraulica: "Vattenkraft", nuclear: "Kärnkraft", gas: "Gas", carbon: "Kol", biomasa: "Biobränsle", petroleo: "Olja", otrasRenovables: "Annan förnybar", otras: "Övrigt" },
    mix: "Elmix", hoy: "idag", ayer: "igår", hasta: (h) => `till kl. ${h}`, renovable: "Förnybart", bajasEmisiones: "Fossilfritt (med kärnkraft)",
    co2: "Koldioxidintensitet", estimado: "uppskattning, direkta utsläpp", ultimos30: "Andel förnybart de senaste 30 dagarna", produccion: "Produktion",
    pMix: "Var kommer elen ifrån idag?", rMix: (r, t) => `Idag kommer ${r} av den producerade elen från förnybara källor. Största källorna: ${t}.`,
    pCo2: "Hur ren är elen just nu?", rCo2: (g) => `Den uppskattade koldioxidintensiteten är idag ${g} g CO₂ per kWh (bara kraftverkens direkta utsläpp).`,
    previsionT: "Vind- och solprognos för imorgon", prevTexto: (e, s, p) => `Prognosen är ${e} vindkraft och ${s} solkraft${p ? `, ungefär ${p} av den väntade förbrukningen` : ""}. Mycket vind och sol pressar spotpriset.`,
    demanda: "Förbrukning (prognos)", pPrevision: "Varför blir elen billig eller dyr imorgon?",
    negativosT: "Negativa elpriser", horasNegativas: "Timmar med negativt pris", diasNegativos: "Dagar med negativa priser", ultimaNegativa: "Senaste negativa timme", minimo: "Lägsta pris", ninguna: "ingen",
    negTexto: (n, d, p) => `${p}: ${n} timmar med negativt spotpris, fördelat på ${d} dagar.`, ultimoAno: "De senaste 12 månaderna",
    pNegPorQue: "Varför blir elpriset negativt?", rNegPorQue: "När vind och sol producerar mycket och efterfrågan är låg (soliga helger, helgdagar, blåsiga nätter) fortsätter vissa kraftverk att producera. Producenterna betalar då för att få leverera el och priset hamnar under noll.",
    pNegCuantas: "Hur ofta är elpriset negativt?", pNegAprovechar: "Kan jag tjäna på negativa elpriser?", rNegAprovechar: "Bara med timprisavtal. Du betalar fortfarande elnät, energiskatt och moms, men själva elen kostar nästan ingenting: perfekt läge att ladda elbilen eller värma varmvattnet.",
    mesesT: "Elpris per månad", mesT: (m) => `Elpris ${m}`, mediaMes: "Månadens medelpris", diaMasBarato: "Billigaste dagen", diaMasCaro: "Dyraste dagen", vsMesAnterior: "Föregående månad", vsAnoAnterior: "Samma månad i fjol", perfilT: "Medelpris per timme",
    pMes: (m) => `Vad var spotpriset på el i ${m}?`, rMes: (m, x) => `I ${m} var det genomsnittliga spotpriset ${x}, exklusive moms, elnät och påslag.`, mes: "Månad", dias: "dagar",
  },
  da: {
    slugMix: "elmix", slugNegativos: "negative-elpriser", slugMes: "elpris-pr-maaned",
    grupos: { eolica: "Vind", solar: "Sol", hidraulica: "Vandkraft", nuclear: "Atomkraft", gas: "Naturgas", carbon: "Kul", biomasa: "Biomasse", petroleo: "Olie", otrasRenovables: "Anden vedvarende", otras: "Andet" },
    mix: "Elmix", hoy: "i dag", ayer: "i går", hasta: (h) => `til kl. ${h}`, renovable: "Vedvarende", bajasEmisiones: "CO₂-fri",
    co2: "CO₂-intensitet", estimado: "skøn, direkte udledning", ultimos30: "Andel vedvarende energi de seneste 30 dage", produccion: "Produktion",
    pMix: "Hvor kommer strømmen fra i dag?", rMix: (r, t) => `I dag kommer ${r} af den producerede strøm fra vedvarende kilder. Største kilder: ${t}.`,
    pCo2: "Hvor grøn er strømmen lige nu?", rCo2: (g) => `Den skønnede CO₂-intensitet er i dag ${g} g CO₂ pr. kWh (kun kraftværkernes direkte udledning).`,
    previsionT: "Vind- og solprognose for i morgen", prevTexto: (e, s, p) => `Der ventes ${e} vindstrøm og ${s} solstrøm${p ? `, omkring ${p} af det forventede forbrug` : ""}. Meget vind og sol presser spotprisen ned.`,
    demanda: "Forbrug (prognose)", pPrevision: "Hvorfor bliver strømmen billig eller dyr i morgen?",
    negativosT: "Negative elpriser", horasNegativas: "Timer med negativ pris", diasNegativos: "Dage med negative priser", ultimaNegativa: "Seneste negative time", minimo: "Laveste pris", ninguna: "ingen",
    negTexto: (n, d, p) => `${p}: ${n} timer med negativ spotpris fordelt på ${d} dage.`, ultimoAno: "De seneste 12 måneder",
    pNegPorQue: "Hvorfor bliver elprisen negativ?", rNegPorQue: "Når vind og sol producerer meget, og forbruget er lavt (solrige weekender, helligdage, blæsende nætter), fortsætter nogle kraftværker med at producere. Producenterne betaler så for at levere strøm, og prisen falder under nul.",
    pNegCuantas: "Hvor tit er elprisen negativ?", pNegAprovechar: "Kan jeg få glæde af negative elpriser?", rNegAprovechar: "Kun med en elaftale med timepris. Du betaler stadig nettarif, elafgift og moms, men selve strømmen koster næsten intet: perfekt til at oplade elbilen eller varme vand.",
    mesesT: "Elpris pr. måned", mesT: (m) => `Elpris ${m}`, mediaMes: "Månedens gennemsnit", diaMasBarato: "Billigste dag", diaMasCaro: "Dyreste dag", vsMesAnterior: "Måneden før", vsAnoAnterior: "Samme måned sidste år", perfilT: "Gennemsnitspris pr. time",
    pMes: (m) => `Hvad var spotprisen på el i ${m}?`, rMes: (m, x) => `I ${m} var den gennemsnitlige spotpris ${x}, uden moms, afgifter og nettarif.`, mes: "Måned", dias: "dage",
  },
  fi: {
    slugMix: "sahkontuotanto", slugNegativos: "negatiivinen-sahkon-hinta", slugMes: "sahkon-hinta-kuukausittain",
    grupos: { eolica: "Tuulivoima", solar: "Aurinkovoima", hidraulica: "Vesivoima", nuclear: "Ydinvoima", gas: "Maakaasu", carbon: "Hiili", biomasa: "Biomassa", petroleo: "Öljy", otrasRenovables: "Muu uusiutuva", otras: "Muu" },
    mix: "Sähköntuotanto", hoy: "tänään", ayer: "eilen", hasta: (h) => `klo ${h} asti`, renovable: "Uusiutuva", bajasEmisiones: "Päästötön (ydinvoima mukaan lukien)",
    co2: "CO₂-intensiteetti", estimado: "arvio, suorat päästöt", ultimos30: "Uusiutuvan osuus viimeisten 30 päivän aikana", produccion: "Tuotanto",
    pMix: "Mistä sähkö tulee tänään?", rMix: (r, t) => `Tänään ${r} tuotetusta sähköstä on uusiutuvaa. Suurimmat lähteet: ${t}.`,
    pCo2: "Kuinka puhdasta sähkö on nyt?", rCo2: (g) => `Tuotannon arvioitu CO₂-intensiteetti on tänään ${g} g CO₂ / kWh (vain voimaloiden suorat päästöt).`,
    previsionT: "Tuuli- ja aurinkoennuste huomiselle", prevTexto: (e, s, p) => `Ennuste: tuulivoimaa ${e} ja aurinkovoimaa ${s}${p ? `, noin ${p} odotetusta kulutuksesta` : ""}. Runsas tuuli ja aurinko laskevat pörssihintaa.`,
    demanda: "Kulutus (ennuste)", pPrevision: "Miksi sähkö on huomenna halpaa tai kallista?",
    negativosT: "Negatiiviset sähkön hinnat", horasNegativas: "Tunnit negatiivisella hinnalla", diasNegativos: "Päivät, joina hinta oli negatiivinen", ultimaNegativa: "Viimeisin negatiivinen tunti", minimo: "Alin hinta", ninguna: "ei yhtään",
    negTexto: (n, d, p) => `${p}: ${n} tuntia negatiivisella pörssihinnalla ${d} päivänä.`, ultimoAno: "Viimeisten 12 kuukauden aikana",
    pNegPorQue: "Miksi sähkön hinta menee negatiiviseksi?", rNegPorQue: "Kun tuuli- ja aurinkovoimaa tuotetaan paljon ja kulutus on vähäistä (tuuliset yöt, viikonloput, pyhät), osa voimaloista jatkaa tuotantoa. Tuottajat maksavat silloin sähkön syöttämisestä verkkoon, ja hinta laskee alle nollan.",
    pNegCuantas: "Kuinka usein sähkön hinta on negatiivinen?", pNegAprovechar: "Hyödynkö negatiivisista hinnoista?", rNegAprovechar: "Vain pörssisähkösopimuksella. Siirtomaksu ja sähkövero maksetaan silti, mutta itse energia on lähes ilmaista: hyvä hetki ladata sähköauto tai lämmittää vesi.",
    mesesT: "Sähkön hinta kuukausittain", mesT: (m) => `Sähkön hinta: ${m}`, mediaMes: "Kuukauden keskihinta", diaMasBarato: "Halvin päivä", diaMasCaro: "Kallein päivä", vsMesAnterior: "Edellinen kuukausi", vsAnoAnterior: "Sama kuukausi viime vuonna", perfilT: "Keskihinta tunneittain",
    pMes: (m) => `Mikä oli pörssisähkön keskihinta (${m})?`, rMes: (m, x) => `Pörssisähkön keskihinta oli ${x} (${m}), ilman arvonlisäveroa, siirtoa ja marginaalia.`, mes: "Kuukausi", dias: "päivää",
  },
  no: {
    slugMix: "kraftproduksjon", slugNegativos: "negative-strompriser", slugMes: "strompris-per-maned",
    grupos: { eolica: "Vind", solar: "Sol", hidraulica: "Vannkraft", nuclear: "Kjernekraft", gas: "Gass", carbon: "Kull", biomasa: "Biobrensel", petroleo: "Olje", otrasRenovables: "Annen fornybar", otras: "Annet" },
    mix: "Kraftproduksjon", hoy: "i dag", ayer: "i går", hasta: (h) => `fram til kl. ${h}`, renovable: "Fornybart", bajasEmisiones: "Utslippsfritt",
    co2: "CO₂-intensitet", estimado: "anslag, direkte utslipp", ultimos30: "Andel fornybart de siste 30 dagene", produccion: "Produksjon",
    pMix: "Hvor kommer strømmen fra i dag?", rMix: (r, t) => `I dag kommer ${r} av strømmen som produseres fra fornybare kilder. Største kilder: ${t}.`,
    pCo2: "Hvor ren er strømmen nå?", rCo2: (g) => `Anslått CO₂-intensitet er i dag ${g} g CO₂ per kWh (bare kraftverkenes direkte utslipp).`,
    previsionT: "Vind- og solprognose for i morgen", prevTexto: (e, s, p) => `Det ventes ${e} vindkraft og ${s} solkraft${p ? `, omtrent ${p} av forventet forbruk` : ""}. Mye vind presser strømprisen ned.`,
    demanda: "Forbruk (prognose)", pPrevision: "Hvorfor blir strømmen billig eller dyr i morgen?",
    negativosT: "Negative strømpriser", horasNegativas: "Timer med negativ pris", diasNegativos: "Dager med negative priser", ultimaNegativa: "Siste negative time", minimo: "Laveste pris", ninguna: "ingen",
    negTexto: (n, d, p) => `${p}: ${n} timer med negativ spotpris fordelt på ${d} dager.`, ultimoAno: "De siste 12 månedene",
    pNegPorQue: "Hvorfor blir strømprisen negativ?", rNegPorQue: "Når det produseres mye vind- og solkraft i Norden og Europa og forbruket er lavt, fortsetter noen kraftverk å produsere. Produsentene betaler da for å levere strøm, og prisen havner under null.",
    pNegCuantas: "Hvor ofte er strømprisen negativ?", pNegAprovechar: "Kan jeg dra nytte av negative strømpriser?", rNegAprovechar: "Bare med spotprisavtale. Du betaler fortsatt nettleie, elavgift og mva., men selve strømmen koster nesten ingenting: perfekt for å lade elbilen eller varme vann.",
    mesesT: "Strømpris per måned", mesT: (m) => `Strømpris ${m}`, mediaMes: "Månedens snitt", diaMasBarato: "Billigste dag", diaMasCaro: "Dyreste dag", vsMesAnterior: "Måneden før", vsAnoAnterior: "Samme måned i fjor", perfilT: "Snittpris per time",
    pMes: (m) => `Hva var spotprisen på strøm i ${m}?`, rMes: (m, x) => `I ${m} var gjennomsnittlig spotpris ${x}, uten mva., nettleie og påslag.`, mes: "Måned", dias: "dager",
  },
};

/** Factores de emisión directa aproximados (g CO₂ por kWh producido). Solo para una estimación orientativa. */
export const FACTOR_CO2: Record<Grupo, number> = { carbon: 950, gas: 400, petroleo: 750, otras: 300, biomasa: 0, eolica: 0, solar: 0, hidraulica: 0, nuclear: 0, otrasRenovables: 0 };
export const RENOVABLES: Grupo[] = ["eolica", "solar", "hidraulica", "biomasa", "otrasRenovables"];
export const COLOR_GRUPO: Record<Grupo, string> = { eolica: "#0aa65a", solar: "#f5c518", hidraulica: "#2b8bb3", nuclear: "#7c18d3", gas: "#e8743b", carbon: "#3d3d3d", biomasa: "#7fb069", petroleo: "#8c564b", otrasRenovables: "#5fd19a", otras: "#c2cec8" };
