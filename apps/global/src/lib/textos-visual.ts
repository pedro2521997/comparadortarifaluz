// Textos del gráfico interactivo, de las tarjetas que se dan la vuelta y de las ilustraciones
// (scripts/ilustraciones.py → public/ilustraciones/), en los 11 idiomas de la web global.

import type { Idioma } from "./textos";

export type Ilus = "electricidad" | "coche" | "mix" | "negativos" | "meses" | "carburantes" | "mapa" | "tarifa";

export interface TextosV {
  /** Etiqueta de la hora que el usuario ha tocado en el gráfico */
  elegida: string;
  ayuda: string;
  aria: string;
  /** Botón de las tarjetas: «Ver detalles de …» */
  ver: string;
  volver: string;
  alt: Record<Ilus, string>;
}

export const TEXTOS_V: Record<Idioma, TextosV> = {
  en: {
    elegida: "Selected hour",
    ayuda: "Tap or hover over a bar",
    aria: "Chart of the price for each hour. Use the left and right arrow keys to move through the hours.",
    ver: "Show details of",
    volver: "Back",
    alt: {
      electricidad: "Chart of the electricity price for each hour, with the cheap and expensive hours",
      coche: "Electric car charging at night from a wall charger",
      mix: "Wind turbines, solar panels and a hydroelectric dam producing electricity",
      negativos: "Sun and wind pushing the electricity price below zero",
      meses: "Calendar and line chart of the monthly average electricity price",
      carburantes: "Fuel pump next to a car",
      mapa: "Map with petrol stations marked",
      tarifa: "Smart meter and a phone app showing a dynamic electricity tariff",
    },
  },
  es: {
    elegida: "Hora elegida",
    ayuda: "Toca o pasa el ratón por una barra",
    aria: "Gráfico del precio de cada hora. Usa las flechas izquierda y derecha para recorrer las horas.",
    ver: "Ver detalles de",
    volver: "Volver",
    alt: {
      electricidad: "Gráfico del precio de la luz de cada hora, con las horas baratas y caras",
      coche: "Coche eléctrico cargando de noche en un cargador de pared",
      mix: "Aerogeneradores, placas solares y una presa hidroeléctrica produciendo electricidad",
      negativos: "El sol y el viento bajan el precio de la electricidad por debajo de cero",
      meses: "Calendario y gráfico de líneas del precio medio de la luz de cada mes",
      carburantes: "Surtidor de combustible junto a un coche",
      mapa: "Mapa con gasolineras marcadas",
      tarifa: "Contador inteligente y una aplicación móvil con una tarifa de luz dinámica",
    },
  },
  fr: {
    elegida: "Heure choisie",
    ayuda: "Touchez ou survolez une barre",
    aria: "Graphique du prix de chaque heure. Utilisez les flèches gauche et droite pour parcourir les heures.",
    ver: "Voir les détails de",
    volver: "Retour",
    alt: {
      electricidad: "Graphique du prix de l'électricité heure par heure, avec les heures bon marché et chères",
      coche: "Voiture électrique en recharge la nuit sur une borne murale",
      mix: "Éoliennes, panneaux solaires et barrage hydroélectrique produisant de l'électricité",
      negativos: "Le soleil et le vent font passer le prix de l'électricité sous zéro",
      meses: "Calendrier et courbe du prix moyen mensuel de l'électricité",
      carburantes: "Pompe à carburant à côté d'une voiture",
      mapa: "Carte avec des stations-service indiquées",
      tarifa: "Compteur communicant et application mobile affichant une offre d'électricité dynamique",
    },
  },
  de: {
    elegida: "Gewählte Stunde",
    ayuda: "Tippe auf einen Balken oder fahre mit der Maus darüber",
    aria: "Diagramm des Preises für jede Stunde. Mit den Pfeiltasten links und rechts gehst du durch die Stunden.",
    ver: "Details anzeigen:",
    volver: "Zurück",
    alt: {
      electricidad: "Diagramm des Strompreises für jede Stunde mit günstigen und teuren Stunden",
      coche: "Elektroauto lädt nachts an einer Wallbox",
      mix: "Windräder, Solaranlagen und ein Wasserkraftwerk erzeugen Strom",
      negativos: "Sonne und Wind drücken den Strompreis unter null",
      meses: "Kalender und Liniendiagramm des durchschnittlichen Strompreises pro Monat",
      carburantes: "Zapfsäule neben einem Auto",
      mapa: "Karte mit markierten Tankstellen",
      tarifa: "Smart Meter und eine Handy-App mit einem dynamischen Stromtarif",
    },
  },
  it: {
    elegida: "Ora scelta",
    ayuda: "Tocca o passa il mouse su una barra",
    aria: "Grafico del prezzo di ogni ora. Usa le frecce sinistra e destra per scorrere le ore.",
    ver: "Mostra i dettagli di",
    volver: "Indietro",
    alt: {
      electricidad: "Grafico del prezzo dell'elettricità ora per ora, con le ore economiche e quelle care",
      coche: "Auto elettrica in ricarica di notte da una wallbox",
      mix: "Pale eoliche, pannelli solari e una diga idroelettrica che producono elettricità",
      negativos: "Sole e vento spingono il prezzo dell'elettricità sotto zero",
      meses: "Calendario e grafico a linee del prezzo medio mensile dell'elettricità",
      carburantes: "Pompa di carburante accanto a un'auto",
      mapa: "Mappa con i distributori di carburante segnati",
      tarifa: "Contatore intelligente e un'app sul telefono con una tariffa luce dinamica",
    },
  },
  pt: {
    elegida: "Hora escolhida",
    ayuda: "Toque ou passe o rato sobre uma barra",
    aria: "Gráfico do preço de cada hora. Use as setas esquerda e direita para percorrer as horas.",
    ver: "Ver detalhes de",
    volver: "Voltar",
    alt: {
      electricidad: "Gráfico do preço da eletricidade hora a hora, com as horas baratas e caras",
      coche: "Carro elétrico a carregar à noite numa wallbox",
      mix: "Aerogeradores, painéis solares e uma barragem hidroelétrica a produzir eletricidade",
      negativos: "O sol e o vento levam o preço da eletricidade abaixo de zero",
      meses: "Calendário e gráfico de linhas do preço médio mensal da eletricidade",
      carburantes: "Bomba de combustível ao lado de um carro",
      mapa: "Mapa com postos de combustível assinalados",
      tarifa: "Contador inteligente e uma app no telemóvel com uma tarifa de eletricidade dinâmica",
    },
  },
  nl: {
    elegida: "Gekozen uur",
    ayuda: "Tik op een balk of beweeg er met de muis over",
    aria: "Grafiek van de prijs per uur. Gebruik de pijltjestoetsen links en rechts om door de uren te gaan.",
    ver: "Details bekijken van",
    volver: "Terug",
    alt: {
      electricidad: "Grafiek van de stroomprijs per uur, met de goedkope en dure uren",
      coche: "Elektrische auto die 's nachts laadt aan een laadpaal aan de muur",
      mix: "Windturbines, zonnepanelen en een waterkrachtcentrale die stroom opwekken",
      negativos: "Zon en wind duwen de stroomprijs onder nul",
      meses: "Kalender en lijngrafiek van de gemiddelde stroomprijs per maand",
      carburantes: "Brandstofpomp naast een auto",
      mapa: "Kaart met tankstations gemarkeerd",
      tarifa: "Slimme meter en een telefoonapp met een dynamisch energiecontract",
    },
  },
  sv: {
    elegida: "Vald timme",
    ayuda: "Tryck på eller håll muspekaren över en stapel",
    aria: "Diagram över priset för varje timme. Använd vänster- och högerpilen för att gå mellan timmarna.",
    ver: "Visa detaljer för",
    volver: "Tillbaka",
    alt: {
      electricidad: "Diagram över elpriset timme för timme, med billiga och dyra timmar",
      coche: "Elbil som laddas på natten vid en väggladdare",
      mix: "Vindkraftverk, solpaneler och en vattenkraftdamm som producerar el",
      negativos: "Sol och vind pressar elpriset under noll",
      meses: "Kalender och linjediagram över det genomsnittliga elpriset per månad",
      carburantes: "Bränslepump bredvid en bil",
      mapa: "Karta med bensinstationer utmärkta",
      tarifa: "Smart elmätare och en mobilapp med ett timprisavtal",
    },
  },
  no: {
    elegida: "Valgt time",
    ayuda: "Trykk på eller hold musepekeren over en stolpe",
    aria: "Diagram over prisen for hver time. Bruk venstre og høyre piltast for å gå gjennom timene.",
    ver: "Vis detaljer for",
    volver: "Tilbake",
    alt: {
      electricidad: "Diagram over strømprisen time for time, med billige og dyre timer",
      coche: "Elbil som lader om natten fra en vegglader",
      mix: "Vindturbiner, solcellepaneler og en vannkraftdam som produserer strøm",
      negativos: "Sol og vind presser strømprisen under null",
      meses: "Kalender og linjediagram over gjennomsnittlig strømpris per måned",
      carburantes: "Drivstoffpumpe ved siden av en bil",
      mapa: "Kart med bensinstasjoner markert",
      tarifa: "Smart strømmåler og en mobilapp med en spotprisavtale",
    },
  },
  da: {
    elegida: "Valgt time",
    ayuda: "Tryk på eller hold musen over en søjle",
    aria: "Diagram over prisen for hver time. Brug venstre og højre piletast til at gå gennem timerne.",
    ver: "Vis detaljer for",
    volver: "Tilbage",
    alt: {
      electricidad: "Diagram over elprisen time for time, med billige og dyre timer",
      coche: "Elbil der oplader om natten fra en vægboks",
      mix: "Vindmøller, solceller og en vandkraftdæmning der producerer strøm",
      negativos: "Sol og vind presser elprisen under nul",
      meses: "Kalender og kurve over den gennemsnitlige elpris pr. måned",
      carburantes: "Benzinstander ved siden af en bil",
      mapa: "Kort med tankstationer markeret",
      tarifa: "Fjernaflæst elmåler og en mobilapp med en timeafregnet elaftale",
    },
  },
  fi: {
    elegida: "Valittu tunti",
    ayuda: "Napauta pylvästä tai vie hiiri sen päälle",
    aria: "Kaavio kunkin tunnin hinnasta. Siirry tunnista toiseen vasemmalla ja oikealla nuolinäppäimellä.",
    ver: "Näytä tiedot:",
    volver: "Takaisin",
    alt: {
      electricidad: "Kaavio sähkön hinnasta tunneittain, halvat ja kalliit tunnit näkyvissä",
      coche: "Sähköauto latautuu yöllä seinälaturista",
      mix: "Tuulivoimalat, aurinkopaneelit ja vesivoimalan pato tuottavat sähköä",
      negativos: "Aurinko ja tuuli painavat sähkön hinnan alle nollan",
      meses: "Kalenteri ja viivakaavio sähkön keskihinnasta kuukausittain",
      carburantes: "Polttoainemittari auton vieressä",
      mapa: "Kartta, johon on merkitty huoltoasemat",
      tarifa: "Etäluettava sähkömittari ja puhelinsovellus, jossa näkyy pörssisähkösopimus",
    },
  },
};

/** Ilustración de cada guía según su tema («clave» en el frontmatter). */
export function ilusGuia(clave: string): Ilus {
  if (clave === "coche-electrico") return "coche";
  if (clave === "tarifa-dinamica") return "tarifa";
  if (clave === "horas-baratas") return "electricidad";
  return "carburantes";
}

// Banderas en SVG: los emojis de bandera no se ven en Windows (salen las letras del país).
const BANDERAS: Record<string, [string, string]> = {
  no: ["0 0 22 16", '<rect width="22" height="16" fill="#ba0c2f"/><path d="M6 0h4v16H6zM0 6h22v4H0z" fill="#fff"/><path d="M7 0h2v16H7zM0 7h22v2H0z" fill="#00205b"/>'],
  se: ["0 0 16 10", '<rect width="16" height="10" fill="#006aa7"/><path d="M5 0h2v10H5zM0 4h16v2H0z" fill="#fecc00"/>'],
  dk: ["0 0 37 28", '<rect width="37" height="28" fill="#c8102e"/><path d="M12 0h4v28h-4zM0 12h37v4H0z" fill="#fff"/>'],
  fi: ["0 0 18 11", '<rect width="18" height="11" fill="#fff"/><path d="M5 0h3v11H5zM0 4h18v3H0z" fill="#002f6c"/>'],
  de: ["0 0 5 3", '<rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#dd0000"/><rect y="2" width="5" height="1" fill="#ffce00"/>'],
  at: ["0 0 3 3", '<rect width="3" height="3" fill="#c8102e"/><rect y="1" width="3" height="1" fill="#fff"/>'],
  nl: ["0 0 3 3", '<rect width="3" height="1" fill="#ae1c28"/><rect y="1" width="3" height="1" fill="#fff"/><rect y="2" width="3" height="1" fill="#21468b"/>'],
  be: ["0 0 3 3", '<rect width="1" height="3" fill="#000"/><rect x="1" width="1" height="3" fill="#fdda24"/><rect x="2" width="1" height="3" fill="#ef3340"/>'],
  fr: ["0 0 3 3", '<rect width="1" height="3" fill="#0055a4"/><rect x="1" width="1" height="3" fill="#fff"/><rect x="2" width="1" height="3" fill="#ef4135"/>'],
  it: ["0 0 3 3", '<rect width="1" height="3" fill="#009246"/><rect x="1" width="1" height="3" fill="#fff"/><rect x="2" width="1" height="3" fill="#ce2b37"/>'],
  pt: ["0 0 30 20", '<rect width="30" height="20" fill="#ff0000"/><rect width="12" height="20" fill="#006600"/><circle cx="12" cy="10" r="4.6" fill="#ffcc00"/><path d="M10 7.6h4v3.6a2 2 0 0 1-4 0z" fill="#fff" stroke="#ff0000" stroke-width=".9"/>'],
  es: ["0 0 30 20", '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>'],
};

/** Bandera de un país (SVG en línea) a partir de su código ISO de dos letras; vacía si no la tenemos. */
export const bandera = (cc: string) => {
  const b = BANDERAS[cc.toLowerCase()];
  return b ? `<svg class="bandera" viewBox="${b[0]}" width="42" height="28" preserveAspectRatio="none" aria-hidden="true" focusable="false">${b[1]}</svg>` : "";
};
