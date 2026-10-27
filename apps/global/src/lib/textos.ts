// Textos de la web global en cada idioma. Las frases se montan con etiquetas cortas (precio medio, hora más
// barata…) para que haya pocas plantillas que traducir y revisar. PENDIENTE: revisión por hablantes nativos.

export type Idioma = "no" | "sv" | "da" | "fi" | "de" | "pt" | "fr" | "it" | "nl" | "en";

export interface Textos {
  /** Sustantivo de búsqueda: «Strømpris», «Strompreis»… */
  precio: string;
  hoy: string;
  manana: string;
  /** Segmento de la URL de mañana */
  slugManana: string;
  /** «billigst kl. 03:00» (va en el título) */
  baratoA: (h: string) => string;
  /** «den 27. oktober 2026» (en las preguntas) */
  elDia: (fecha: string) => string;
  ahora: string;
  horaBarata: string;
  horaCara: string;
  media: string;
  vsAyer: (pct: string, sube: boolean) => string;
  igualAyer: string;
  mejoresHoras: string;
  usos: [string, string, string, string];
  evitar: string;
  porHora: string;
  niveles: { barata: string; normal: string; cara: string };
  leyenda: (barata: string, cara: string) => string;
  tramosT: string;
  tramos: [string, string, string, string];
  tramoBarato: string;
  noPublicado: string;
  nota: string;
  fuente: string;
  otrosDias: string;
  zonas: string;
  verDia: string;
  preguntasT: string;
  pBarata: (cuando: string) => string;
  rBarata: (franja: string, p: string, dos: string | null) => string;
  pMedia: (cuando: string) => string;
  rMedia: (media: string) => string;
  pCara: (cuando: string) => string;
  rCara: (franja: string, p: string) => string;
  otrosPaises: string;
  enlaceFijo: string;
  aviso: string;
  legal: string;
  cuandoSeca: string;
}

const pct = (n: string) => `${n} %`;

export const TEXTOS: Record<Idioma, Textos> = {
  no: {
    precio: "Strømpris", hoy: "i dag", manana: "i morgen", slugManana: "i-morgen",
    baratoA: (h) => `billigst kl. ${h}`, elDia: (f) => f,
    ahora: "Nå", horaBarata: "Billigste time", horaCara: "Dyreste time", media: "Døgnsnitt",
    vsAyer: (n, s) => `${pct(n)} ${s ? "høyere" : "lavere"} enn dagen før`, igualAyer: "omtrent som dagen før",
    mejoresHoras: "De beste timene til …", usos: ["Vaskemaskin", "Oppvaskmaskin", "Stekeovn", "Lade elbilen"], evitar: "Unngå",
    porHora: "Pris time for time", niveles: { barata: "billig", normal: "normal", cara: "dyr" },
    leyenda: (b, c) => `${b}: den billigste tredjedelen av døgnet · ${c}: den dyreste`,
    tramosT: "Prisen gjennom døgnet", tramos: ["Natt", "Morgen", "Ettermiddag", "Kveld"], tramoBarato: "billigst",
    noPublicado: "Prisen for denne dagen er ikke publisert ennå. Morgendagens priser kommer vanligvis rundt kl. 13.",
    nota: "Spotpris fra day-ahead-markedet, uten mva., nettleie og strømleverandørens påslag.",
    fuente: "Kilde", otrosDias: "Andre dager", zonas: "Prisområder", verDia: "Fast lenke til denne dagen",
    preguntasT: "Spørsmål om strømprisen",
    pBarata: (c) => `Når er strømmen billigst ${c}?`,
    rBarata: (f, p, d) => `Den billigste timen er ${f}, med ${p}.${d ? ` Trenger du to timer på rad, er ${d} best.` : ""}`,
    pMedia: (c) => `Hva er snittprisen på strøm ${c}?`, rMedia: (m) => `Døgnsnittet er ${m} (spotpris uten mva. og nettleie).`,
    pCara: (c) => `Når er strømmen dyrest ${c}?`, rCara: (f, p) => `Den dyreste timen er ${f}, med ${p}. Unngå da det som bruker mest strøm.`,
    otrosPaises: "Strømpris i andre land", enlaceFijo: "Fast lenke", aviso: "Beregningene er veiledende.", legal: "Juridisk informasjon og personvern", cuandoSeca: "dato",
  },
  sv: {
    precio: "Elpris", hoy: "idag", manana: "imorgon", slugManana: "imorgon",
    baratoA: (h) => `billigast kl. ${h}`, elDia: (f) => `den ${f}`,
    ahora: "Nu", horaBarata: "Billigaste timmen", horaCara: "Dyraste timmen", media: "Dygnsmedel",
    vsAyer: (n, s) => `${pct(n)} ${s ? "högre" : "lägre"} än dagen innan`, igualAyer: "ungefär som dagen innan",
    mejoresHoras: "Bästa timmarna att …", usos: ["Köra tvättmaskinen", "Köra diskmaskinen", "Använda ugnen", "Ladda elbilen"], evitar: "Undvik",
    porHora: "Pris timme för timme", niveles: { barata: "billig", normal: "normal", cara: "dyr" },
    leyenda: (b, c) => `${b}: dygnets billigaste tredjedel · ${c}: den dyraste`,
    tramosT: "Priset under dygnet", tramos: ["Natt", "Morgon", "Eftermiddag", "Kväll"], tramoBarato: "billigast",
    noPublicado: "Priset för den här dagen är inte publicerat än. Morgondagens priser kommer vanligtvis runt kl. 13.",
    nota: "Spotpris från day-ahead-marknaden, exklusive moms, elnät, energiskatt och elhandlarens påslag.",
    fuente: "Källa", otrosDias: "Andra dagar", zonas: "Elområden", verDia: "Fast länk till den här dagen",
    preguntasT: "Frågor om elpriset",
    pBarata: (c) => `När är elen billigast ${c}?`,
    rBarata: (f, p, d) => `Den billigaste timmen är ${f}, med ${p}.${d ? ` Behöver du två timmar i följd är ${d} bäst.` : ""}`,
    pMedia: (c) => `Vad är medelpriset på el ${c}?`, rMedia: (m) => `Dygnsmedlet är ${m} (spotpris exklusive moms och elnät).`,
    pCara: (c) => `När är elen dyrast ${c}?`, rCara: (f, p) => `Den dyraste timmen är ${f}, med ${p}. Undvik då det som drar mest el.`,
    otrosPaises: "Elpris i andra länder", enlaceFijo: "Fast länk", aviso: "Beräkningarna är vägledande.", legal: "Juridisk information och integritet", cuandoSeca: "datum",
  },
  da: {
    precio: "Elpris", hoy: "i dag", manana: "i morgen", slugManana: "i-morgen",
    baratoA: (h) => `billigst kl. ${h}`, elDia: (f) => `den ${f}`,
    ahora: "Nu", horaBarata: "Billigste time", horaCara: "Dyreste time", media: "Døgngennemsnit",
    vsAyer: (n, s) => `${pct(n)} ${s ? "højere" : "lavere"} end dagen før`, igualAyer: "omtrent som dagen før",
    mejoresHoras: "De bedste timer til …", usos: ["Vaskemaskine", "Opvaskemaskine", "Ovn", "Opladning af elbil"], evitar: "Undgå",
    porHora: "Pris time for time", niveles: { barata: "billig", normal: "normal", cara: "dyr" },
    leyenda: (b, c) => `${b}: døgnets billigste tredjedel · ${c}: den dyreste`,
    tramosT: "Prisen hen over døgnet", tramos: ["Nat", "Morgen", "Eftermiddag", "Aften"], tramoBarato: "billigst",
    noPublicado: "Prisen for denne dag er ikke offentliggjort endnu. Morgendagens priser kommer normalt omkring kl. 13.",
    nota: "Spotpris fra day-ahead-markedet, uden moms, nettarif, elafgift og elselskabets tillæg.",
    fuente: "Kilde", otrosDias: "Andre dage", zonas: "Prisområder", verDia: "Fast link til denne dag",
    preguntasT: "Spørgsmål om elprisen",
    pBarata: (c) => `Hvornår er strømmen billigst ${c}?`,
    rBarata: (f, p, d) => `Den billigste time er ${f}, med ${p}.${d ? ` Skal du bruge to timer i træk, er ${d} bedst.` : ""}`,
    pMedia: (c) => `Hvad er gennemsnitsprisen på el ${c}?`, rMedia: (m) => `Døgngennemsnittet er ${m} (spotpris uden moms og nettarif).`,
    pCara: (c) => `Hvornår er strømmen dyrest ${c}?`, rCara: (f, p) => `Den dyreste time er ${f}, med ${p}. Undgå da det, der bruger mest strøm.`,
    otrosPaises: "Elpris i andre lande", enlaceFijo: "Fast link", aviso: "Beregningerne er vejledende.", legal: "Juridisk information og privatliv", cuandoSeca: "dato",
  },
  fi: {
    precio: "Pörssisähkön hinta", hoy: "tänään", manana: "huomenna", slugManana: "huomenna",
    baratoA: (h) => `halvin klo ${h}`, elDia: (f) => f,
    ahora: "Nyt", horaBarata: "Halvin tunti", horaCara: "Kallein tunti", media: "Vuorokauden keskihinta",
    vsAyer: (n, s) => `${pct(n)} ${s ? "kalliimpi" : "halvempi"} kuin edellisenä päivänä`, igualAyer: "suunnilleen sama kuin edellisenä päivänä",
    mejoresHoras: "Parhaat tunnit …", usos: ["Pyykinpesukone", "Astianpesukone", "Uuni", "Sähköauton lataus"], evitar: "Vältä",
    porHora: "Hinta tunneittain", niveles: { barata: "halpa", normal: "tavallinen", cara: "kallis" },
    leyenda: (b, c) => `${b}: vuorokauden halvin kolmannes · ${c}: kallein`,
    tramosT: "Hinta vuorokauden aikana", tramos: ["Yö", "Aamupäivä", "Iltapäivä", "Ilta"], tramoBarato: "halvin",
    noPublicado: "Tämän päivän hintaa ei ole vielä julkaistu. Huomisen hinnat julkaistaan yleensä noin klo 14.",
    nota: "Day-ahead-markkinan pörssihinta ilman arvonlisäveroa, siirtomaksua ja myyjän marginaalia.",
    fuente: "Lähde", otrosDias: "Muut päivät", zonas: "Hinta-alueet", verDia: "Pysyvä linkki tähän päivään",
    preguntasT: "Kysymyksiä sähkön hinnasta",
    pBarata: (c) => `Milloin sähkö on halvinta ${c}?`,
    rBarata: (f, p, d) => `Halvin tunti on ${f}, hinta ${p}.${d ? ` Jos tarvitset kaksi tuntia peräkkäin, paras aika on ${d}.` : ""}`,
    pMedia: (c) => `Mikä on sähkön keskihinta ${c}?`, rMedia: (m) => `Vuorokauden keskihinta on ${m} (pörssihinta ilman arvonlisäveroa ja siirtoa).`,
    pCara: (c) => `Milloin sähkö on kalleinta ${c}?`, rCara: (f, p) => `Kallein tunti on ${f}, hinta ${p}. Vältä silloin eniten sähköä kuluttavia laitteita.`,
    otrosPaises: "Sähkön hinta muissa maissa", enlaceFijo: "Pysyvä linkki", aviso: "Laskelmat ovat suuntaa antavia.", legal: "Oikeudelliset tiedot ja tietosuoja", cuandoSeca: "päivä",
  },
  de: {
    precio: "Strompreis", hoy: "heute", manana: "morgen", slugManana: "morgen",
    baratoA: (h) => `am günstigsten um ${h} Uhr`, elDia: (f) => `am ${f}`,
    ahora: "Jetzt", horaBarata: "Günstigste Stunde", horaCara: "Teuerste Stunde", media: "Tagesdurchschnitt",
    vsAyer: (n, s) => `${pct(n)} ${s ? "teurer" : "günstiger"} als am Vortag`, igualAyer: "etwa wie am Vortag",
    mejoresHoras: "Die besten Stunden für …", usos: ["Waschmaschine", "Geschirrspüler", "Backofen", "E-Auto laden"], evitar: "Meiden",
    porHora: "Preis Stunde für Stunde", niveles: { barata: "günstig", normal: "mittel", cara: "teuer" },
    leyenda: (b, c) => `${b}: günstigstes Drittel des Tages · ${c}: teuerstes Drittel`,
    tramosT: "Der Preis über den Tag", tramos: ["Nacht", "Vormittag", "Nachmittag", "Abend"], tramoBarato: "am günstigsten",
    noPublicado: "Der Preis für diesen Tag ist noch nicht veröffentlicht. Die Preise für morgen erscheinen meist gegen 13 Uhr.",
    nota: "Börsenstrompreis (Day-Ahead) ohne Mehrwertsteuer, Netzentgelte, Abgaben und Aufschlag des Anbieters.",
    fuente: "Quelle", otrosDias: "Andere Tage", zonas: "Preiszonen", verDia: "Fester Link zu diesem Tag",
    preguntasT: "Fragen zum Strompreis",
    pBarata: (c) => `Wann ist Strom ${c} am günstigsten?`,
    rBarata: (f, p, d) => `Die günstigste Stunde ist ${f} mit ${p}.${d ? ` Für zwei Stunden am Stück ist ${d} am besten.` : ""}`,
    pMedia: (c) => `Wie hoch ist der durchschnittliche Strompreis ${c}?`, rMedia: (m) => `Der Tagesdurchschnitt liegt bei ${m} (Börsenpreis ohne Mehrwertsteuer und Netzentgelte).`,
    pCara: (c) => `Wann ist Strom ${c} am teuersten?`, rCara: (f, p) => `Die teuerste Stunde ist ${f} mit ${p}. Dann besser keine großen Verbraucher einschalten.`,
    otrosPaises: "Strompreis in anderen Ländern", enlaceFijo: "Fester Link", aviso: "Alle Berechnungen sind Schätzungen.", legal: "Impressum und Datenschutz", cuandoSeca: "Datum",
  },
  pt: {
    precio: "Preço da luz", hoy: "hoje", manana: "amanhã", slugManana: "amanha",
    baratoA: (h) => `mais barata às ${h}`, elDia: (f) => `a ${f}`,
    ahora: "Agora", horaBarata: "Hora mais barata", horaCara: "Hora mais cara", media: "Média do dia",
    vsAyer: (n, s) => `${pct(n)} ${s ? "mais cara" : "mais barata"} do que no dia anterior`, igualAyer: "quase igual ao dia anterior",
    mejoresHoras: "As melhores horas para …", usos: ["Máquina de lavar roupa", "Máquina de lavar loiça", "Forno", "Carregar o carro elétrico"], evitar: "Evitar",
    porHora: "Preço hora a hora", niveles: { barata: "barata", normal: "normal", cara: "cara" },
    leyenda: (b, c) => `${b}: o terço mais barato do dia · ${c}: o mais caro`,
    tramosT: "O preço ao longo do dia", tramos: ["Madrugada", "Manhã", "Tarde", "Noite"], tramoBarato: "mais barato",
    noPublicado: "O preço deste dia ainda não foi publicado. Os preços de amanhã costumam sair por volta das 12h.",
    nota: "Preço do mercado diário (MIBEL/OMIE), sem IVA, tarifas de acesso às redes nem margem do comercializador.",
    fuente: "Fonte", otrosDias: "Outros dias", zonas: "Zonas", verDia: "Ligação fixa para este dia",
    preguntasT: "Perguntas sobre o preço da luz",
    pBarata: (c) => `A que horas é mais barata a luz ${c}?`,
    rBarata: (f, p, d) => `A hora mais barata é ${f}, a ${p}.${d ? ` Se precisar de duas horas seguidas, o melhor é ${d}.` : ""}`,
    pMedia: (c) => `Qual é o preço médio da luz ${c}?`, rMedia: (m) => `A média do dia é ${m} (preço de mercado sem IVA nem tarifas de acesso).`,
    pCara: (c) => `A que horas é mais cara a luz ${c}?`, rCara: (f, p) => `A hora mais cara é ${f}, a ${p}. Evite então os aparelhos que mais gastam.`,
    otrosPaises: "Preço da luz noutros países", enlaceFijo: "Ligação fixa", aviso: "Os cálculos são indicativos.", legal: "Informação legal e privacidade", cuandoSeca: "data",
  },
  fr: {
    precio: "Prix de l'électricité", hoy: "aujourd'hui", manana: "demain", slugManana: "demain",
    baratoA: (h) => `le moins cher à ${h}`, elDia: (f) => `le ${f}`,
    ahora: "Maintenant", horaBarata: "Heure la moins chère", horaCara: "Heure la plus chère", media: "Moyenne du jour",
    vsAyer: (n, s) => `${pct(n)} ${s ? "plus cher" : "moins cher"} que la veille`, igualAyer: "à peu près comme la veille",
    mejoresHoras: "Les meilleures heures pour …", usos: ["Lave-linge", "Lave-vaisselle", "Four", "Recharger la voiture électrique"], evitar: "À éviter",
    porHora: "Prix heure par heure", niveles: { barata: "bon marché", normal: "moyen", cara: "cher" },
    leyenda: (b, c) => `${b} : le tiers le moins cher de la journée · ${c} : le plus cher`,
    tramosT: "Le prix au fil de la journée", tramos: ["Nuit", "Matin", "Après-midi", "Soir"], tramoBarato: "le moins cher",
    noPublicado: "Le prix de cette journée n'est pas encore publié. Les prix du lendemain paraissent en général vers 13 h.",
    nota: "Prix spot du marché day-ahead (EPEX), hors TVA, TURPE, taxes et marge du fournisseur.",
    fuente: "Source", otrosDias: "Autres jours", zonas: "Zones", verDia: "Lien fixe vers cette journée",
    preguntasT: "Questions sur le prix de l'électricité",
    pBarata: (c) => `Quand l'électricité est-elle la moins chère ${c} ?`,
    rBarata: (f, p, d) => `L'heure la moins chère est ${f}, à ${p}.${d ? ` Pour deux heures de suite, le mieux est ${d}.` : ""}`,
    pMedia: (c) => `Quel est le prix moyen de l'électricité ${c} ?`, rMedia: (m) => `La moyenne du jour est de ${m} (prix spot hors TVA et hors réseau).`,
    pCara: (c) => `Quand l'électricité est-elle la plus chère ${c} ?`, rCara: (f, p) => `L'heure la plus chère est ${f}, à ${p}. Évitez alors les appareils les plus gourmands.`,
    otrosPaises: "Prix de l'électricité dans d'autres pays", enlaceFijo: "Lien fixe", aviso: "Les calculs sont indicatifs.", legal: "Mentions légales et confidentialité", cuandoSeca: "date",
  },
  it: {
    precio: "Prezzo luce", hoy: "oggi", manana: "domani", slugManana: "domani",
    baratoA: (h) => `più conveniente alle ${h}`, elDia: (f) => `il ${f}`,
    ahora: "Adesso", horaBarata: "Ora più conveniente", horaCara: "Ora più cara", media: "Media del giorno",
    vsAyer: (n, s) => `${pct(n)} ${s ? "più cara" : "più conveniente"} del giorno prima`, igualAyer: "quasi uguale al giorno prima",
    mejoresHoras: "Le ore migliori per …", usos: ["Lavatrice", "Lavastoviglie", "Forno", "Ricaricare l'auto elettrica"], evitar: "Da evitare",
    porHora: "Prezzo ora per ora", niveles: { barata: "conveniente", normal: "nella media", cara: "cara" },
    leyenda: (b, c) => `${b}: il terzo più economico della giornata · ${c}: il più caro`,
    tramosT: "Il prezzo durante la giornata", tramos: ["Notte", "Mattina", "Pomeriggio", "Sera"], tramoBarato: "più conveniente",
    noPublicado: "Il prezzo di questo giorno non è ancora stato pubblicato. I prezzi di domani escono di solito verso le 13.",
    nota: "Prezzo zonale del mercato del giorno prima (MGP), senza IVA, oneri di rete e di sistema né margine del fornitore.",
    fuente: "Fonte", otrosDias: "Altri giorni", zonas: "Zone di mercato", verDia: "Link fisso a questo giorno",
    preguntasT: "Domande sul prezzo della luce",
    pBarata: (c) => `A che ora costa meno la luce ${c}?`,
    rBarata: (f, p, d) => `L'ora più conveniente è ${f}, a ${p}.${d ? ` Se ti servono due ore di fila, la fascia migliore è ${d}.` : ""}`,
    pMedia: (c) => `Qual è il prezzo medio della luce ${c}?`, rMedia: (m) => `La media del giorno è ${m} (prezzo all'ingrosso senza IVA e oneri).`,
    pCara: (c) => `A che ora costa di più la luce ${c}?`, rCara: (f, p) => `L'ora più cara è ${f}, a ${p}. Meglio evitare allora gli apparecchi che consumano di più.`,
    otrosPaises: "Prezzo della luce in altri paesi", enlaceFijo: "Link fisso", aviso: "I calcoli sono indicativi.", legal: "Note legali e privacy", cuandoSeca: "data",
  },
  nl: {
    precio: "Stroomprijs", hoy: "vandaag", manana: "morgen", slugManana: "morgen",
    baratoA: (h) => `goedkoopst om ${h}`, elDia: (f) => `op ${f}`,
    ahora: "Nu", horaBarata: "Goedkoopste uur", horaCara: "Duurste uur", media: "Daggemiddelde",
    vsAyer: (n, s) => `${pct(n)} ${s ? "duurder" : "goedkoper"} dan de dag ervoor`, igualAyer: "ongeveer gelijk aan de dag ervoor",
    mejoresHoras: "De beste uren voor …", usos: ["Wasmachine", "Vaatwasser", "Oven", "Elektrische auto laden"], evitar: "Vermijden",
    porHora: "Prijs per uur", niveles: { barata: "goedkoop", normal: "gemiddeld", cara: "duur" },
    leyenda: (b, c) => `${b}: het goedkoopste derde van de dag · ${c}: het duurste`,
    tramosT: "De prijs door de dag heen", tramos: ["Nacht", "Ochtend", "Middag", "Avond"], tramoBarato: "goedkoopst",
    noPublicado: "De prijs voor deze dag is nog niet gepubliceerd. De prijzen voor morgen verschijnen meestal rond 13 uur.",
    nota: "Kale beursprijs (day-ahead, EPEX), zonder btw, energiebelasting, netbeheerkosten en opslag van de leverancier.",
    fuente: "Bron", otrosDias: "Andere dagen", zonas: "Prijszones", verDia: "Vaste link naar deze dag",
    preguntasT: "Vragen over de stroomprijs",
    pBarata: (c) => `Wanneer is stroom ${c} het goedkoopst?`,
    rBarata: (f, p, d) => `Het goedkoopste uur is ${f}, met ${p}.${d ? ` Heb je twee uur achter elkaar nodig, dan is ${d} het best.` : ""}`,
    pMedia: (c) => `Wat is de gemiddelde stroomprijs ${c}?`, rMedia: (m) => `Het daggemiddelde is ${m} (kale beursprijs zonder btw en netbeheerkosten).`,
    pCara: (c) => `Wanneer is stroom ${c} het duurst?`, rCara: (f, p) => `Het duurste uur is ${f}, met ${p}. Zet dan liever geen grote verbruikers aan.`,
    otrosPaises: "Stroomprijs in andere landen", enlaceFijo: "Vaste link", aviso: "Alle berekeningen zijn indicatief.", legal: "Juridische informatie en privacy", cuandoSeca: "datum",
  },
  en: {
    precio: "Electricity price", hoy: "today", manana: "tomorrow", slugManana: "tomorrow",
    baratoA: (h) => `cheapest at ${h}`, elDia: (f) => `on ${f}`,
    ahora: "Now", horaBarata: "Cheapest hour", horaCara: "Most expensive hour", media: "Daily average",
    vsAyer: (n, s) => `${pct(n)} ${s ? "higher" : "lower"} than the day before`, igualAyer: "about the same as the day before",
    mejoresHoras: "The best hours to …", usos: ["Run the washing machine", "Run the dishwasher", "Use the oven", "Charge the electric car"], evitar: "Avoid",
    porHora: "Price hour by hour", niveles: { barata: "cheap", normal: "average", cara: "expensive" },
    leyenda: (b, c) => `${b}: cheapest third of the day · ${c}: most expensive third`,
    tramosT: "The price through the day", tramos: ["Night", "Morning", "Afternoon", "Evening"], tramoBarato: "cheapest",
    noPublicado: "The price for this day has not been published yet. Tomorrow's prices usually come out around 13:00 CET.",
    nota: "Day-ahead wholesale spot price, excluding VAT, grid fees, taxes and supplier margin.",
    fuente: "Source", otrosDias: "Other days", zonas: "Price zones", verDia: "Permanent link to this day",
    preguntasT: "Questions about the electricity price",
    pBarata: (c) => `When is electricity cheapest ${c}?`,
    rBarata: (f, p, d) => `The cheapest hour is ${f}, at ${p}.${d ? ` If you need two hours in a row, ${d} is best.` : ""}`,
    pMedia: (c) => `What is the average electricity price ${c}?`, rMedia: (m) => `The daily average is ${m} (spot price excluding VAT and grid fees).`,
    pCara: (c) => `When is electricity most expensive ${c}?`, rCara: (f, p) => `The most expensive hour is ${f}, at ${p}. Avoid running heavy appliances then.`,
    otrosPaises: "Electricity prices in other countries", enlaceFijo: "Permanent link", aviso: "All figures are estimates.", legal: "Legal notice and privacy", cuandoSeca: "date",
  },
};
