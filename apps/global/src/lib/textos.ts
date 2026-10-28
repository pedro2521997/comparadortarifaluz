// Textos de la web global en cada idioma. Las frases con datos (entradilla, preguntas) son plantillas completas
// por idioma, no etiquetas pegadas: así se leen como escritas a mano. Las horas, los rangos horarios y los
// porcentajes siguen la costumbre de cada país («12 Uhr», «12 h», «klo 12», «06.00», «79%» / «79 %»).

export type Idioma = "no" | "sv" | "da" | "fi" | "de" | "pt" | "fr" | "it" | "nl" | "es" | "en";

/** Cuándo es el dato de la frase: hoy, mañana o una fecha del archivo (en pasado). */
export type Cuando = "hoy" | "manana" | "fecha";

export interface DatosFrase {
  cuando: Cuando;
  /** «27. Oktober 2026» */
  fecha: string;
  media: string;
  /** «33 % mehr als am Vortag» o null */
  vs: string | null;
  rangoMin: string;
  pMin: string;
  rangoMax: string;
  pMax: string;
}

export interface Textos {
  /** Sustantivo de búsqueda: «Strømpris», «Strompreis»… */
  precio: string;
  hoy: string;
  manana: string;
  /** Segmento de la URL de mañana */
  slugManana: string;
  /** Hora en tablas y gráficos: «06:00» o «06.00» */
  reloj: (h: number) => string;
  /** Rango de horas en una frase: «von 12 bis 13 Uhr», «de 12 h à 13 h», «klo 12–13» */
  rango: (desde: number, hasta: number) => string;
  /** Para el título: «am günstigsten um 12 Uhr» */
  baratoA: (h: number) => string;
  /** «am 27. Oktober 2026» (en las preguntas) */
  elDia: (fecha: string) => string;
  /** «33 % mehr als am Vortag»; `ref` es el día con el que se compara */
  vsAyer: (pct: string, sube: boolean, ref: "ayer" | "hoy") => string;
  igualAyer: (ref: "ayer" | "hoy") => string;
  /** Entradilla de la página (y base de la meta descripción) */
  frase: (d: DatosFrase) => string;
  ahora: string;
  horaBarata: string;
  horaCara: string;
  media: string;
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
  preguntasT: string;
  pBarata: (cuando: string) => string;
  rBarata: (cuando: string, rango: string, p: string, dos: string | null) => string;
  pMedia: (cuando: string) => string;
  rMedia: (cuando: string, media: string) => string;
  pCara: (cuando: string) => string;
  rCara: (rango: string, p: string) => string;
  otrosPaises: string;
  enlaceFijo: string;
  aviso: string;
  legal: string;
  /** Enlace a los precios de carburantes del país */
  carburantes: string;
}

const pad = (h: number) => String(h % 24 === 0 && h > 0 ? 24 : h % 24).padStart(2, "0");
const relojDosPuntos = (h: number) => `${pad(h)}:00`;
const relojPunto = (h: number) => `${pad(h)}.00`;
const may = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Italiano: «l'8%», «l'11%», «l'80%» pero «il 5%» */
const artIt = (pct: string) => (/^(1|8|11|18|8\d)(\D|$)/.test(pct) ? `l'${pct}` : `il ${pct}`);
/** Italiano: «dalle 12», pero «dall'1» y «all'1» */
const dalle = (h: number) => (h === 1 ? "dall'1" : `dalle ${h}`);
const alle = (h: number) => (h === 1 ? "all'1" : `alle ${h}`);
/** Portugués: «às 12h», pero «à 1h» */
const asPt = (h: number) => (h === 1 ? "a 1h" : `as ${h}h`);

export const TEXTOS: Record<Idioma, Textos> = {
  no: {
    precio: "Strømpris", hoy: "i dag", manana: "i morgen", slugManana: "i-morgen",
    reloj: relojPunto, rango: (a, b) => `mellom kl. ${pad(a)} og ${pad(b)}`, baratoA: (h) => `billigst kl. ${pad(h)}`,
    elDia: (f) => `den ${f}`,
    vsAyer: (p, s, r) => `${p} ${s ? "dyrere" : "billigere"} enn ${r === "hoy" ? "i dag" : "dagen før"}`,
    igualAyer: (r) => `omtrent som ${r === "hoy" ? "i dag" : "dagen før"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `Den ${d.fecha} kostet strømmen i snitt ${d.media} på kraftbørsen${d.vs ? `, ${d.vs}` : ""}. Billigst var den ${d.rangoMin} (${d.pMin}), dyrest ${d.rangoMax} (${d.pMax}).`
        : `${d.cuando === "hoy" ? "I dag" : "I morgen"} koster strømmen i snitt ${d.media} på kraftbørsen${d.vs ? `, ${d.vs}` : ""}. Billigst er den ${d.rangoMin} (${d.pMin}), dyrest ${d.rangoMax} (${d.pMax}).`,
    ahora: "Nå", horaBarata: "Billigste time", horaCara: "Dyreste time", media: "Snittpris",
    mejoresHoras: "Beste tidspunkt for …", usos: ["Vaskemaskin", "Oppvaskmaskin", "Stekeovn", "Lade elbilen"], evitar: "Unngå",
    porHora: "Pris time for time", niveles: { barata: "billig", normal: "middels", cara: "dyr" },
    leyenda: (b, c) => `${b}: den billigste tredjedelen av døgnet · ${c}: den dyreste`,
    tramosT: "Prisen gjennom døgnet", tramos: ["Natt", "Formiddag", "Ettermiddag", "Kveld"], tramoBarato: "billigst",
    noPublicado: "Prisene for denne dagen er ikke publisert ennå. Morgendagens strømpriser kommer vanligvis litt over kl. 13.",
    nota: "Spotpris fra kraftbørsen (day-ahead), uten mva., nettleie og påslag fra strømselskapet.",
    fuente: "Kilde", otrosDias: "Andre dager", zonas: "Prisområder", preguntasT: "Spørsmål og svar",
    pBarata: (c) => `Når er strømmen billigst ${c}?`,
    rBarata: (c, r, p, d) => `${may(c)} er strømmen billigst ${r}, ${p}.${d ? ` Trenger du to timer på rad, er ${d} det beste.` : ""}`,
    pMedia: (c) => `Hva koster strømmen i snitt ${c}?`,
    rMedia: (c, m) => `${may(c)} er snittprisen på kraftbørsen ${m}. Da er mva., nettleie og avgifter ikke regnet med.`,
    pCara: (c) => `Når er strømmen dyrest ${c}?`,
    rCara: (r, p) => `Dyrest er den ${r}, ${p}. Da lønner det seg å vente med det som bruker mye strøm.`,
    otrosPaises: "Strømpriser i andre land", enlaceFijo: "Lenke til denne dagen", aviso: "Alle tall er veiledende.", legal: "Om nettstedet og personvern",
    carburantes: "Drivstoffpriser",
  },
  sv: {
    precio: "Elpris", hoy: "idag", manana: "imorgon", slugManana: "imorgon",
    reloj: relojDosPuntos, rango: (a, b) => `mellan kl. ${pad(a)} och ${pad(b)}`, baratoA: (h) => `billigast kl. ${pad(h)}`,
    elDia: (f) => `den ${f}`,
    vsAyer: (p, s, r) => `${p} ${s ? "dyrare" : "billigare"} än ${r === "hoy" ? "idag" : "dagen innan"}`,
    igualAyer: (r) => `ungefär som ${r === "hoy" ? "idag" : "dagen innan"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `Den ${d.fecha} kostade elen i snitt ${d.media} på elbörsen${d.vs ? `, ${d.vs}` : ""}. Billigast var den ${d.rangoMin} (${d.pMin}) och dyrast ${d.rangoMax} (${d.pMax}).`
        : `${d.cuando === "hoy" ? "Idag" : "Imorgon"} kostar elen i snitt ${d.media} på elbörsen${d.vs ? `, ${d.vs}` : ""}. Billigast är den ${d.rangoMin} (${d.pMin}) och dyrast ${d.rangoMax} (${d.pMax}).`,
    ahora: "Nu", horaBarata: "Billigaste timmen", horaCara: "Dyraste timmen", media: "Snittpris",
    mejoresHoras: "Bästa tiden att …", usos: ["Köra tvättmaskinen", "Köra diskmaskinen", "Använda ugnen", "Ladda elbilen"], evitar: "Undvik",
    porHora: "Pris timme för timme", niveles: { barata: "billig", normal: "mellan", cara: "dyr" },
    leyenda: (b, c) => `${b}: dygnets billigaste tredjedel · ${c}: den dyraste`,
    tramosT: "Priset under dygnet", tramos: ["Natt", "Förmiddag", "Eftermiddag", "Kväll"], tramoBarato: "billigast",
    noPublicado: "Priserna för den här dagen är inte publicerade än. Morgondagens elpriser brukar komma strax efter kl. 13.",
    nota: "Spotpris från elbörsen (day-ahead), exklusive moms, elnät, energiskatt och elhandlarens påslag.",
    fuente: "Källa", otrosDias: "Andra dagar", zonas: "Elområden", preguntasT: "Frågor och svar",
    pBarata: (c) => `När är elen billigast ${c}?`,
    rBarata: (c, r, p, d) => `${may(c)} är elen billigast ${r}, ${p}.${d ? ` Behöver du två timmar i följd är ${d} bäst.` : ""}`,
    pMedia: (c) => `Vad kostar elen i snitt ${c}?`,
    rMedia: (c, m) => `${may(c)} är snittpriset på elbörsen ${m}, exklusive moms, energiskatt och elnät.`,
    pCara: (c) => `När är elen dyrast ${c}?`,
    rCara: (r, p) => `Dyrast är den ${r}, ${p}. Vänta gärna med det som drar mycket el till dess.`,
    otrosPaises: "Elpriser i andra länder", enlaceFijo: "Länk till den här dagen", aviso: "Alla siffror är ungefärliga.", legal: "Om webbplatsen och integritet",
    carburantes: "Bensinpris",
  },
  da: {
    precio: "Elpris", hoy: "i dag", manana: "i morgen", slugManana: "i-morgen",
    reloj: relojPunto, rango: (a, b) => `mellem kl. ${a % 24} og ${b === 24 ? 24 : b % 24}`, baratoA: (h) => `billigst kl. ${h}`,
    elDia: (f) => `den ${f}`,
    vsAyer: (p, s, r) => `${p} ${s ? "dyrere" : "billigere"} end ${r === "hoy" ? "i dag" : "dagen før"}`,
    igualAyer: (r) => `omtrent som ${r === "hoy" ? "i dag" : "dagen før"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `Den ${d.fecha} kostede strømmen i gennemsnit ${d.media} på elbørsen${d.vs ? `, ${d.vs}` : ""}. Billigst var den ${d.rangoMin} (${d.pMin}) og dyrest ${d.rangoMax} (${d.pMax}).`
        : `${d.cuando === "hoy" ? "I dag" : "I morgen"} koster strømmen i gennemsnit ${d.media} på elbørsen${d.vs ? `, ${d.vs}` : ""}. Billigst er den ${d.rangoMin} (${d.pMin}) og dyrest ${d.rangoMax} (${d.pMax}).`,
    ahora: "Nu", horaBarata: "Billigste time", horaCara: "Dyreste time", media: "Gennemsnit",
    mejoresHoras: "Bedste tidspunkt til …", usos: ["Vaskemaskine", "Opvaskemaskine", "Ovn", "Opladning af elbil"], evitar: "Undgå",
    porHora: "Pris time for time", niveles: { barata: "billig", normal: "middel", cara: "dyr" },
    leyenda: (b, c) => `${b}: døgnets billigste tredjedel · ${c}: den dyreste`,
    tramosT: "Prisen hen over døgnet", tramos: ["Nat", "Formiddag", "Eftermiddag", "Aften"], tramoBarato: "billigst",
    noPublicado: "Priserne for denne dag er ikke offentliggjort endnu. Morgendagens elpriser kommer normalt lidt over kl. 13.",
    nota: "Spotpris fra elbørsen (day-ahead), uden moms, nettarif, elafgift og elselskabets tillæg.",
    fuente: "Kilde", otrosDias: "Andre dage", zonas: "Prisområder", preguntasT: "Spørgsmål og svar",
    pBarata: (c) => `Hvornår er strømmen billigst ${c}?`,
    rBarata: (c, r, p, d) => `${may(c)} er strømmen billigst ${r}, til ${p}.${d ? ` Skal du bruge to timer i træk, er ${d} det bedste tidspunkt.` : ""}`,
    pMedia: (c) => `Hvad koster strømmen i gennemsnit ${c}?`,
    rMedia: (c, m) => `${may(c)} er gennemsnitsprisen på elbørsen ${m}, uden moms, elafgift og nettarif.`,
    pCara: (c) => `Hvornår er strømmen dyrest ${c}?`,
    rCara: (r, p) => `Dyrest er den ${r}, til ${p}. Vent helst med det, der bruger meget strøm.`,
    otrosPaises: "Elpriser i andre lande", enlaceFijo: "Link til denne dag", aviso: "Alle tal er vejledende.", legal: "Om siden og privatliv",
    carburantes: "Benzinpris",
  },
  fi: {
    precio: "Pörssisähkön hinta", hoy: "tänään", manana: "huomenna", slugManana: "huomenna",
    reloj: relojPunto, rango: (a, b) => `klo ${a % 24}–${b === 24 ? 24 : b % 24}`, baratoA: (h) => `halvin klo ${h}`,
    elDia: (f) => f,
    vsAyer: (p, s, r) => `${p} ${s ? "kalliimpi" : "halvempi"} kuin ${r === "hoy" ? "tänään" : "edellisenä päivänä"}`,
    igualAyer: (r) => `suunnilleen sama kuin ${r === "hoy" ? "tänään" : "edellisenä päivänä"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `${d.fecha} pörssisähkön keskihinta oli ${d.media}${d.vs ? ` (${d.vs})` : ""}. Halvinta sähkö oli ${d.rangoMin} (${d.pMin}) ja kalleinta ${d.rangoMax} (${d.pMax}).`
        : `${d.cuando === "hoy" ? "Tänään" : "Huomenna"} pörssisähkön keskihinta on ${d.media}${d.vs ? ` (${d.vs})` : ""}. Halvinta sähkö on ${d.rangoMin} (${d.pMin}) ja kalleinta ${d.rangoMax} (${d.pMax}).`,
    ahora: "Nyt", horaBarata: "Halvin tunti", horaCara: "Kallein tunti", media: "Keskihinta",
    mejoresHoras: "Paras aika …", usos: ["Pyykinpesukone", "Astianpesukone", "Uuni", "Sähköauton lataus"], evitar: "Vältä",
    porHora: "Hinta tunneittain", niveles: { barata: "halpa", normal: "keskitaso", cara: "kallis" },
    leyenda: (b, c) => `${b}: vuorokauden halvin kolmannes · ${c}: kallein`,
    tramosT: "Hinta vuorokauden aikana", tramos: ["Yö", "Aamupäivä", "Iltapäivä", "Ilta"], tramoBarato: "halvin",
    noPublicado: "Tämän päivän hintoja ei ole vielä julkaistu. Huomisen pörssisähkön hinnat tulevat yleensä vähän kello 14 jälkeen.",
    nota: "Pörssisähkön hinta (day-ahead) ilman arvonlisäveroa, siirtomaksua, sähköveroa ja myyjän marginaalia.",
    fuente: "Lähde", otrosDias: "Muut päivät", zonas: "Hinta-alueet", preguntasT: "Kysymyksiä ja vastauksia",
    pBarata: (c) => `Milloin sähkö on halvinta ${c}?`,
    rBarata: (c, r, p, d) => `${may(c)} sähkö on halvinta ${r}, ${p}.${d ? ` Jos tarvitset kaksi tuntia peräkkäin, paras aika on ${d}.` : ""}`,
    pMedia: (c) => `Mikä on pörssisähkön keskihinta ${c}?`,
    rMedia: (c, m) => `${may(c)} pörssisähkön keskihinta on ${m}. Hintaan ei sisälly arvonlisäveroa, siirtoa eikä sähköveroa.`,
    pCara: (c) => `Milloin sähkö on kalleinta ${c}?`,
    rCara: (r, p) => `Kalleinta sähkö on ${r}, ${p}. Silloin kannattaa siirtää isot sähkölaitteet myöhemmäksi.`,
    otrosPaises: "Sähkön hinta muissa maissa", enlaceFijo: "Linkki tähän päivään", aviso: "Luvut ovat suuntaa antavia.", legal: "Tietoa sivustosta ja tietosuoja",
    carburantes: "Polttoaineen hinta",
  },
  de: {
    precio: "Strompreis", hoy: "heute", manana: "morgen", slugManana: "morgen",
    reloj: relojDosPuntos, rango: (a, b) => `von ${a % 24} bis ${b === 24 ? 24 : b % 24} Uhr`, baratoA: (h) => `am günstigsten um ${h} Uhr`,
    elDia: (f) => `am ${f}`,
    vsAyer: (p, s, r) => `${p} ${s ? "mehr" : "weniger"} als ${r === "hoy" ? "heute" : "am Vortag"}`,
    igualAyer: (r) => `etwa so viel wie ${r === "hoy" ? "heute" : "am Vortag"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `Am ${d.fecha} kostete Strom an der Börse im Schnitt ${d.media}${d.vs ? `, ${d.vs}` : ""}. Am günstigsten war er ${d.rangoMin} (${d.pMin}), am teuersten ${d.rangoMax} (${d.pMax}).`
        : `${d.cuando === "hoy" ? "Heute" : "Morgen"} kostet Strom an der Börse im Schnitt ${d.media}${d.vs ? `, ${d.vs}` : ""}. Am günstigsten ist er ${d.rangoMin} (${d.pMin}), am teuersten ${d.rangoMax} (${d.pMax}).`,
    ahora: "Jetzt", horaBarata: "Günstigste Stunde", horaCara: "Teuerste Stunde", media: "Tagesdurchschnitt",
    mejoresHoras: "Die besten Zeiten für …", usos: ["Waschmaschine", "Geschirrspüler", "Backofen", "E-Auto laden"], evitar: "Lieber meiden",
    porHora: "Preis Stunde für Stunde", niveles: { barata: "günstig", normal: "mittel", cara: "teuer" },
    leyenda: (b, c) => `${b}: günstigstes Drittel des Tages · ${c}: teuerstes Drittel`,
    tramosT: "So verteilt sich der Preis über den Tag", tramos: ["Nacht", "Vormittag", "Nachmittag", "Abend"], tramoBarato: "am günstigsten",
    noPublicado: "Die Preise für diesen Tag sind noch nicht veröffentlicht. Die Strompreise für morgen gibt es meist kurz nach 13 Uhr.",
    nota: "Börsenstrompreis (Day-Ahead) ohne Mehrwertsteuer, Netzentgelte, Abgaben und Aufschlag des Anbieters.",
    fuente: "Quelle", otrosDias: "Andere Tage", zonas: "Preiszonen", preguntasT: "Häufige Fragen",
    pBarata: (c) => `Wann ist Strom ${c} am günstigsten?`,
    rBarata: (c, r, p, d) => `${may(c)} ist Strom ${r} am günstigsten, mit ${p}.${d ? ` Wer zwei Stunden am Stück braucht, wählt am besten die Zeit ${d}.` : ""}`,
    pMedia: (c) => `Was kostet Strom ${c} im Durchschnitt?`,
    rMedia: (c, m) => `${may(c)} liegt der Börsenstrompreis im Schnitt bei ${m}. Mehrwertsteuer, Netzentgelte und Abgaben kommen noch dazu.`,
    pCara: (c) => `Wann ist Strom ${c} am teuersten?`,
    rCara: (r, p) => `Am teuersten ist er ${r}, mit ${p}. Große Verbraucher schaltest du dann besser nicht ein.`,
    otrosPaises: "Strompreise in anderen Ländern", enlaceFijo: "Link zu diesem Tag", aviso: "Alle Angaben ohne Gewähr.", legal: "Impressum und Datenschutz",
    carburantes: "Spritpreise",
  },
  pt: {
    precio: "Preço da luz", hoy: "hoje", manana: "amanhã", slugManana: "amanha",
    reloj: relojDosPuntos, rango: (a, b) => `entre ${asPt(a % 24)} e ${asPt(b === 24 ? 24 : b % 24)}`, baratoA: (h) => `mais barata às ${h}h`,
    elDia: (f) => `a ${f}`,
    vsAyer: (p, s, r) => `${s ? "mais" : "menos"} ${p} do que ${r === "hoy" ? "hoje" : "no dia anterior"}`,
    igualAyer: (r) => `praticamente o mesmo que ${r === "hoy" ? "hoje" : "no dia anterior"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `A ${d.fecha}, a eletricidade custou em média ${d.media} no mercado grossista${d.vs ? `, ${d.vs}` : ""}. A hora mais barata foi ${d.rangoMin} (${d.pMin}) e a mais cara ${d.rangoMax} (${d.pMax}).`
        : d.cuando === "hoy"
          ? `Hoje, a eletricidade custa em média ${d.media} no mercado grossista${d.vs ? `, ${d.vs}` : ""}. A hora mais barata é ${d.rangoMin} (${d.pMin}) e a mais cara ${d.rangoMax} (${d.pMax}).`
          : `Amanhã, a eletricidade vai custar em média ${d.media} no mercado grossista${d.vs ? `, ${d.vs}` : ""}. A hora mais barata será ${d.rangoMin} (${d.pMin}) e a mais cara ${d.rangoMax} (${d.pMax}).`,
    ahora: "Agora", horaBarata: "Hora mais barata", horaCara: "Hora mais cara", media: "Média do dia",
    mejoresHoras: "As melhores horas para …", usos: ["Máquina de lavar roupa", "Máquina de lavar loiça", "Forno", "Carregar o carro elétrico"], evitar: "Evitar",
    porHora: "Preço hora a hora", niveles: { barata: "barata", normal: "média", cara: "cara" },
    leyenda: (b, c) => `${b}: o terço mais barato do dia · ${c}: o mais caro`,
    tramosT: "O preço ao longo do dia", tramos: ["Madrugada", "Manhã", "Tarde", "Noite"], tramoBarato: "mais barato",
    noPublicado: "Os preços deste dia ainda não foram publicados. Os preços de amanhã costumam sair pouco depois do meio-dia.",
    nota: "Preço do mercado diário (OMIE), sem IVA, tarifas de acesso às redes nem margem do comercializador.",
    fuente: "Fonte", otrosDias: "Outros dias", zonas: "Zonas", preguntasT: "Perguntas frequentes",
    pBarata: (c) => `A que horas é mais barata a luz ${c}?`,
    rBarata: (c, r, p, d) => `${may(c)}, a hora mais barata é ${r}, a ${p}.${d ? ` Se precisar de duas horas seguidas, o melhor é ${d}.` : ""}`,
    pMedia: (c) => `Quanto custa a luz em média ${c}?`,
    rMedia: (c, m) => `${may(c)}, o preço médio no mercado é de ${m}, sem IVA nem tarifas de acesso às redes.`,
    pCara: (c) => `A que horas é mais cara a luz ${c}?`,
    rCara: (r, p) => `A mais cara é ${r}, a ${p}. Nessa altura convém deixar para depois os aparelhos que gastam mais.`,
    otrosPaises: "Preço da luz noutros países", enlaceFijo: "Ligação para este dia", aviso: "Valores meramente indicativos.", legal: "Informação legal e privacidade",
    carburantes: "Combustíveis",
  },
  fr: {
    precio: "Prix de l'électricité", hoy: "aujourd'hui", manana: "demain", slugManana: "demain",
    reloj: (h) => `${h % 24 === 0 && h > 0 ? 24 : h % 24} h`, rango: (a, b) => `de ${a % 24} h à ${b === 24 ? 24 : b % 24} h`, baratoA: (h) => `le moins cher à ${h} h`,
    elDia: (f) => `le ${f}`,
    vsAyer: (p, s, r) => `${p} de ${s ? "plus" : "moins"} ${r === "hoy" ? "qu'aujourd'hui" : "que la veille"}`,
    igualAyer: (r) => `à peu près autant ${r === "hoy" ? "qu'aujourd'hui" : "que la veille"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `Le ${d.fecha}, l'électricité a coûté en moyenne ${d.media} sur le marché spot${d.vs ? `, soit ${d.vs}` : ""}. Elle était la moins chère ${d.rangoMin} (${d.pMin}) et la plus chère ${d.rangoMax} (${d.pMax}).`
        : d.cuando === "hoy"
          ? `Aujourd'hui, l'électricité coûte en moyenne ${d.media} sur le marché spot${d.vs ? `, soit ${d.vs}` : ""}. Elle est la moins chère ${d.rangoMin} (${d.pMin}) et la plus chère ${d.rangoMax} (${d.pMax}).`
          : `Demain, l'électricité coûtera en moyenne ${d.media} sur le marché spot${d.vs ? `, soit ${d.vs}` : ""}. Elle sera la moins chère ${d.rangoMin} (${d.pMin}) et la plus chère ${d.rangoMax} (${d.pMax}).`,
    ahora: "En ce moment", horaBarata: "Heure la moins chère", horaCara: "Heure la plus chère", media: "Moyenne du jour",
    mejoresHoras: "Les meilleurs créneaux pour …", usos: ["Lave-linge", "Lave-vaisselle", "Four", "Recharge de la voiture"], evitar: "À éviter",
    porHora: "Prix heure par heure", niveles: { barata: "bon marché", normal: "moyen", cara: "cher" },
    leyenda: (b, c) => `${b} : le tiers le moins cher de la journée · ${c} : le tiers le plus cher`,
    tramosT: "Le prix au fil de la journée", tramos: ["Nuit", "Matinée", "Après-midi", "Soirée"], tramoBarato: "le moins cher",
    noPublicado: "Les prix de cette journée ne sont pas encore publiés. Ceux du lendemain sont en général disponibles peu après 13 h.",
    nota: "Prix spot du marché day-ahead (EPEX), hors TVA, TURPE, taxes et marge du fournisseur.",
    fuente: "Source", otrosDias: "Autres jours", zonas: "Zones", preguntasT: "Questions fréquentes",
    pBarata: (c) => `Quand l'électricité est-elle la moins chère ${c} ?`,
    rBarata: (c, r, p, d) => `${may(c)}, l'électricité est la moins chère ${r}, à ${p}.${d ? ` Pour deux heures d'affilée, le meilleur créneau est ${d}.` : ""}`,
    pMedia: (c) => `Combien coûte l'électricité en moyenne ${c} ?`,
    rMedia: (c, m) => `${may(c)}, le prix spot moyen est de ${m}, hors TVA, TURPE et taxes.`,
    pCara: (c) => `Quand l'électricité est-elle la plus chère ${c} ?`,
    rCara: (r, p) => `Elle est la plus chère ${r}, à ${p} : mieux vaut éviter de lancer les gros appareils à ce moment-là.`,
    otrosPaises: "Prix de l'électricité dans d'autres pays", enlaceFijo: "Lien vers cette journée", aviso: "Chiffres donnés à titre indicatif.", legal: "Mentions légales et confidentialité",
    carburantes: "Prix des carburants",
  },
  it: {
    precio: "Prezzo luce", hoy: "oggi", manana: "domani", slugManana: "domani",
    reloj: relojDosPuntos, rango: (a, b) => `${dalle(a % 24)} ${alle(b === 24 ? 24 : b % 24)}`, baratoA: (h) => `più conveniente ${alle(h)}`,
    elDia: (f) => `il ${f}`,
    vsAyer: (p, s, r) => `${artIt(p)} in ${s ? "più" : "meno"} rispetto ${r === "hoy" ? "a oggi" : "al giorno prima"}`,
    igualAyer: (r) => `più o meno come ${r === "hoy" ? "oggi" : "il giorno prima"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `Il ${d.fecha} l'energia elettrica all'ingrosso è costata in media ${d.media}${d.vs ? `, ${d.vs}` : ""}. L'ora più conveniente è stata ${d.rangoMin} (${d.pMin}), la più cara ${d.rangoMax} (${d.pMax}).`
        : d.cuando === "hoy"
          ? `Oggi l'energia elettrica all'ingrosso costa in media ${d.media}${d.vs ? `, ${d.vs}` : ""}. L'ora più conveniente è ${d.rangoMin} (${d.pMin}), la più cara ${d.rangoMax} (${d.pMax}).`
          : `Domani l'energia elettrica all'ingrosso costerà in media ${d.media}${d.vs ? `, ${d.vs}` : ""}. L'ora più conveniente sarà ${d.rangoMin} (${d.pMin}), la più cara ${d.rangoMax} (${d.pMax}).`,
    ahora: "Adesso", horaBarata: "Ora più conveniente", horaCara: "Ora più cara", media: "Media del giorno",
    mejoresHoras: "Gli orari migliori per …", usos: ["Lavatrice", "Lavastoviglie", "Forno", "Ricarica dell'auto elettrica"], evitar: "Da evitare",
    porHora: "Prezzo ora per ora", niveles: { barata: "conveniente", normal: "nella media", cara: "cara" },
    leyenda: (b, c) => `${b}: il terzo più economico della giornata · ${c}: il terzo più caro`,
    tramosT: "Il prezzo nell'arco della giornata", tramos: ["Notte", "Mattina", "Pomeriggio", "Sera"], tramoBarato: "più conveniente",
    noPublicado: "I prezzi di questo giorno non sono ancora stati pubblicati. Quelli di domani escono di solito poco dopo le 13.",
    nota: "Prezzo zonale del mercato del giorno prima (MGP), senza IVA, oneri di rete e di sistema né margine del fornitore.",
    fuente: "Fonte", otrosDias: "Altri giorni", zonas: "Zone di mercato", preguntasT: "Domande frequenti",
    pBarata: (c) => `A che ora costa meno la luce ${c}?`,
    rBarata: (c, r, p, d) => `${may(c)} l'ora più conveniente è ${r}, a ${p}.${d ? ` Se ti servono due ore di fila, la fascia migliore è ${d}.` : ""}`,
    pMedia: (c) => `Quanto costa in media la luce ${c}?`,
    rMedia: (c, m) => `${may(c)} il prezzo medio all'ingrosso è di ${m}, senza IVA, oneri e imposte.`,
    pCara: (c) => `A che ora costa di più la luce ${c}?`,
    rCara: (r, p) => `L'ora più cara è ${r}, a ${p}: meglio rimandare l'uso degli elettrodomestici che consumano di più.`,
    otrosPaises: "Prezzo della luce in altri paesi", enlaceFijo: "Link a questo giorno", aviso: "Valori puramente indicativi.", legal: "Note legali e privacy",
    carburantes: "Prezzi carburanti",
  },
  nl: {
    precio: "Stroomprijs", hoy: "vandaag", manana: "morgen", slugManana: "morgen",
    reloj: relojDosPuntos, rango: (a, b) => `van ${a % 24} tot ${b === 24 ? 24 : b % 24} uur`, baratoA: (h) => `goedkoopst om ${h} uur`,
    elDia: (f) => `op ${f}`,
    vsAyer: (p, s, r) => `${p} ${s ? "duurder" : "goedkoper"} dan ${r === "hoy" ? "vandaag" : "de dag ervoor"}`,
    igualAyer: (r) => `ongeveer even duur als ${r === "hoy" ? "vandaag" : "de dag ervoor"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `Op ${d.fecha} kostte stroom op de beurs gemiddeld ${d.media}${d.vs ? `, ${d.vs}` : ""}. Het goedkoopst was het ${d.rangoMin} (${d.pMin}), het duurst ${d.rangoMax} (${d.pMax}).`
        : `${d.cuando === "hoy" ? "Vandaag" : "Morgen"} kost stroom op de beurs gemiddeld ${d.media}${d.vs ? `, ${d.vs}` : ""}. Het goedkoopst is het ${d.rangoMin} (${d.pMin}), het duurst ${d.rangoMax} (${d.pMax}).`,
    ahora: "Nu", horaBarata: "Goedkoopste uur", horaCara: "Duurste uur", media: "Daggemiddelde",
    mejoresHoras: "De beste momenten voor …", usos: ["Wasmachine", "Vaatwasser", "Oven", "Elektrische auto laden"], evitar: "Liever niet",
    porHora: "Prijs per uur", niveles: { barata: "goedkoop", normal: "gemiddeld", cara: "duur" },
    leyenda: (b, c) => `${b}: het goedkoopste derde van de dag · ${c}: het duurste derde`,
    tramosT: "De prijs door de dag heen", tramos: ["Nacht", "Ochtend", "Middag", "Avond"], tramoBarato: "goedkoopst",
    noPublicado: "De prijzen voor deze dag zijn nog niet bekend. De stroomprijzen voor morgen verschijnen meestal kort na 13.00 uur.",
    nota: "Kale beursprijs (day-ahead, EPEX), zonder btw, energiebelasting, netbeheerkosten en opslag van de leverancier.",
    fuente: "Bron", otrosDias: "Andere dagen", zonas: "Prijszones", preguntasT: "Veelgestelde vragen",
    pBarata: (c) => `Wanneer is stroom ${c} het goedkoopst?`,
    rBarata: (c, r, p, d) => `${may(c)} is stroom het goedkoopst ${r}, voor ${p}.${d ? ` Heb je twee uur achter elkaar nodig, kies dan ${d}.` : ""}`,
    pMedia: (c) => `Wat kost stroom ${c} gemiddeld?`,
    rMedia: (c, m) => `${may(c)} kost stroom op de beurs gemiddeld ${m}. Btw, energiebelasting en netbeheerkosten komen daar nog bij.`,
    pCara: (c) => `Wanneer is stroom ${c} het duurst?`,
    rCara: (r, p) => `Het duurst is stroom ${r}, voor ${p}. Zet grote verbruikers dan liever niet aan.`,
    otrosPaises: "Stroomprijzen in andere landen", enlaceFijo: "Link naar deze dag", aviso: "Alle cijfers zijn indicatief.", legal: "Colofon en privacy",
    carburantes: "Brandstofprijzen",
  },
  es: {
    precio: "Precio de la luz", hoy: "hoy", manana: "mañana", slugManana: "manana",
    reloj: relojDosPuntos, rango: (a, b) => `de ${pad(a)}:00 a ${pad(b)}:00`, baratoA: (h) => `más barata a las ${pad(h)}:00`,
    elDia: (f) => `el ${f}`,
    vsAyer: (p, s, r) => `un ${p} ${s ? "más" : "menos"} que ${r === "hoy" ? "hoy" : "el día anterior"}`,
    igualAyer: (r) => `casi lo mismo que ${r === "hoy" ? "hoy" : "el día anterior"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `El ${d.fecha}, la luz costó de media ${d.media} en el mercado mayorista${d.vs ? `, ${d.vs}` : ""}. La hora más barata fue ${d.rangoMin} (${d.pMin}) y la más cara ${d.rangoMax} (${d.pMax}).`
        : `${d.cuando === "hoy" ? "Hoy" : "Mañana"}, la luz cuesta de media ${d.media} en el mercado mayorista${d.vs ? `, ${d.vs}` : ""}. La hora más barata es ${d.rangoMin} (${d.pMin}) y la más cara ${d.rangoMax} (${d.pMax}).`,
    ahora: "Ahora", horaBarata: "Hora más barata", horaCara: "Hora más cara", media: "Media del día",
    mejoresHoras: "Las mejores horas para…", usos: ["Poner la lavadora", "Poner el lavavajillas", "Usar el horno", "Cargar el coche"], evitar: "Mejor evitar",
    porHora: "Precio hora a hora", niveles: { barata: "barata", normal: "normal", cara: "cara" },
    leyenda: (b, c) => `${b}: el tercio más barato del día · ${c}: el más caro`,
    tramosT: "Cómo cambia el precio a lo largo del día", tramos: ["Noche", "Mañana", "Tarde", "Noche (tarde)"], tramoBarato: "el más barato",
    noPublicado: "Los precios de este día aún no se han publicado. Los de mañana suelen salir poco después de las 13:00.",
    nota: "Precio del mercado mayorista (día siguiente), sin IVA, peajes, cargos ni margen de la comercializadora.",
    fuente: "Fuente", otrosDias: "Otros días", zonas: "Zonas de precio", preguntasT: "Preguntas frecuentes",
    pBarata: (c) => `¿Cuándo es más barata la luz ${c}?`,
    rBarata: (c, r, p, d) => `${may(c)}, la luz es más barata ${r}, a ${p}.${d ? ` Si necesitas dos horas seguidas, lo mejor es ${d}.` : ""}`,
    pMedia: (c) => `¿Cuánto cuesta la luz de media ${c}?`,
    rMedia: (c, m) => `${may(c)}, el precio medio del mercado mayorista es ${m}, antes de IVA, peajes y cargos.`,
    pCara: (c) => `¿Cuándo es más cara la luz ${c}?`,
    rCara: (r, p) => `La hora más cara es ${r}, a ${p}: mejor no encender entonces los aparatos que más gastan.`,
    otrosPaises: "Precio de la luz en otros países", enlaceFijo: "Enlace a este día", aviso: "Datos orientativos.", legal: "Aviso legal y privacidad",
    carburantes: "Carburantes",
  },
  en: {
    precio: "Electricity price", hoy: "today", manana: "tomorrow", slugManana: "tomorrow",
    reloj: relojDosPuntos, rango: (a, b) => `between ${pad(a)}:00 and ${pad(b)}:00`, baratoA: (h) => `cheapest at ${pad(h)}:00`,
    elDia: (f) => `on ${f}`,
    vsAyer: (p, s, r) => `${p} ${s ? "more" : "less"} than ${r === "hoy" ? "today" : "the day before"}`,
    igualAyer: (r) => `about the same as ${r === "hoy" ? "today" : "the day before"}`,
    frase: (d) =>
      d.cuando === "fecha"
        ? `On ${d.fecha}, electricity cost an average of ${d.media} on the spot market${d.vs ? `, ${d.vs}` : ""}. It was cheapest ${d.rangoMin} (${d.pMin}) and most expensive ${d.rangoMax} (${d.pMax}).`
        : `${d.cuando === "hoy" ? "Today" : "Tomorrow"}, electricity costs an average of ${d.media} on the spot market${d.vs ? `, ${d.vs}` : ""}. It is cheapest ${d.rangoMin} (${d.pMin}) and most expensive ${d.rangoMax} (${d.pMax}).`,
    ahora: "Now", horaBarata: "Cheapest hour", horaCara: "Most expensive hour", media: "Daily average",
    mejoresHoras: "Best times to …", usos: ["Run the washing machine", "Run the dishwasher", "Use the oven", "Charge the car"], evitar: "Avoid",
    porHora: "Price hour by hour", niveles: { barata: "cheap", normal: "average", cara: "expensive" },
    leyenda: (b, c) => `${b}: cheapest third of the day · ${c}: most expensive third`,
    tramosT: "The price through the day", tramos: ["Night", "Morning", "Afternoon", "Evening"], tramoBarato: "cheapest",
    noPublicado: "Prices for this day have not been published yet. Tomorrow's prices usually come out shortly after 13:00 CET.",
    nota: "Day-ahead wholesale spot price, excluding VAT, grid fees, taxes and supplier margin.",
    fuente: "Source", otrosDias: "Other days", zonas: "Price zones", preguntasT: "Questions and answers",
    pBarata: (c) => `When is electricity cheapest ${c}?`,
    rBarata: (c, r, p, d) => `${may(c)}, electricity is cheapest ${r}, at ${p}.${d ? ` If you need two hours in a row, go for ${d}.` : ""}`,
    pMedia: (c) => `What does electricity cost on average ${c}?`,
    rMedia: (c, m) => `${may(c)}, the average spot price is ${m}, before VAT, grid fees and taxes.`,
    pCara: (c) => `When is electricity most expensive ${c}?`,
    rCara: (r, p) => `It is most expensive ${r}, at ${p}, so that is the time to hold off on heavy appliances.`,
    otrosPaises: "Electricity prices in other countries", enlaceFijo: "Link to this day", aviso: "All figures are estimates.", legal: "Legal notice and privacy",
    carburantes: "Fuel prices",
  },
};
