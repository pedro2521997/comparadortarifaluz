// Textos de las páginas de gasolineras baratas por región y ciudad (lib/zonas.ts), por país (cada uno en su idioma).
// Los nombres de los carburantes son los del mapa (TEXTOS_M[lang].comb y combArt).

import { slugTexto } from "./carburantes";

export interface TextosZonas {
  slug: string;
  slugRegion: (nombre: string, codigo: string) => string;
  /** «Rhône (69)», «Lisboa» */
  regionNombre: (nombre: string, codigo: string) => string;
  /** «dans le 69 (Rhône)», «no distrito do Porto» */
  enRegion: (nombre: string, codigo: string) => string;
  /** «du 69 (Rhône)», «do distrito do Porto» */
  deRegion: (nombre: string, codigo: string) => string;
  /** «à Lyon», «au Mans», «no Porto», «em Lisboa» */
  enCiudad: (c: string) => string;
  /** «de Lyon», «du Mans», «do Porto» */
  deCiudad: (c: string) => string;
  enPais: string;
  /** Meta descripción: el precio más bajo de los dos carburantes principales y cuántas gasolineras hay. */
  desc: (o: { donde: string; gN: string; g: string; dN: string; d: string; n: string }) => string;
  miga: string;
  hubT: string;
  hubH1: string;
  hubLead: (o: { n: string; gArt: string; g: string; dArt: string; d: string }) => string;
  regionesT: string;
  colRegion: string;
  colCiudad: string;
  colN: string;
  colMin: string;
  colEstacion: string;
  /** Puesto de la región entre todas por precio medio */
  rankT: string;
  regionT: (nombre: string, codigo: string) => string;
  regionH1: (nombre: string, codigo: string) => string;
  regionLead: (o: { n: number; de: string; gArt: string; g: string; comp: string; dArt: string; d: string }) => string;
  /** Diferencia con la media nacional o de la región */
  comp: (dif: string, mas: boolean, region: boolean) => string;
  ciudadT: (enC: string) => string;
  ciudadTCorto: (enC: string) => string;
  ciudadH1: (enC: string) => string;
  ciudadLead: (o: { n: number; deC: string; gArt: string; g: string; dArt: string; d: string; comp: string }) => string;
  baratasT: (cArt: string, donde: string) => string;
  ciudadesT: string;
  cercaT: (deC: string) => string;
  todaRegion: (nombre: string, codigo: string) => string;
  verMapa: string;
  verRegiones: string;
  ordenadas: (c: string) => string;
  fuente: string;
  sinNombre: string;
  faqT: string;
  /** Línea de la sección de precios del país (/fr/prix-carburants/): hoy, en las gasolineras. */
  hoyT: string;
  /** Título y descripción de la página de precios del país (/fr/prix-carburants/) con el precio de hoy. */
  tituloHoy: (enP: string, c: string, precio: string) => string;
  descHoy: (o: { enP: string; gN: string; g: string; dN: string; d: string; n: string }) => string;
  hoyLead: (o: { n: string; fecha: string }) => string;
  pBarata: (cArt: string, donde: string) => string;
  rBarata: (o: { sitio: string; precio: string; media: string }) => string;
  pCuantas: (donde: string) => string;
  rCuantas: (n: number, donde: string) => string;
  pAhorro: string;
  rAhorro: (dif: string, cArt: string) => string;
  pRank: (donde: string) => string;
  rRank: (puesto: number, total: number, cArt: string) => string;
}

/** Francés: «à Lyon», «au Mans», «aux Herbiers», «à La Rochelle». */
const aFr = (c: string) => (/^Le /.test(c) ? `au ${c.slice(3)}` : /^Les /.test(c) ? `aux ${c.slice(4)}` : `à ${c}`);
const deFr = (c: string) => (/^Le /.test(c) ? `du ${c.slice(3)}` : /^Les /.test(c) ? `des ${c.slice(4)}` : /^[AEIOUYÉÈÂÎH]/i.test(c) ? `d'${c}` : `de ${c}`);

/** Portugués: nombres que llevan artículo («no Porto», «na Amadora»). El resto, «em Lisboa», «de Lisboa». */
const MASC = new Set(["Porto", "Seixal", "Barreiro", "Montijo", "Cartaxo", "Entroncamento", "Fundão", "Sabugal", "Bombarral", "Crato", "Redondo", "Alandroal", "Cadaval", "Marco de Canaveses"]);
const FEM = new Set([
  "Amadora", "Maia", "Marinha Grande", "Lourinhã", "Nazaré", "Batalha", "Mealhada", "Murtosa", "Golegã", "Chamusca", "Moita", "Trofa", "Covilhã", "Guarda", "Figueira da Foz",
  "Póvoa de Varzim", "Póvoa de Lanhoso", "Lousã", "Sertã", "Pampilhosa da Serra", "Vidigueira", "Mêda", "Azambuja",
]);
const emPt = (c: string) => (MASC.has(c) ? `no ${c}` : FEM.has(c) ? `na ${c}` : `em ${c}`);
const dePt = (c: string) => (MASC.has(c) ? `do ${c}` : FEM.has(c) ? `da ${c}` : `de ${c}`);
const ordFr = (n: number) => (n === 1 ? "1er" : `${n}e`);

export const TEXTOS_Z: Record<string, TextosZonas> = {
  fr: {
    slug: "stations-service-pas-cheres",
    slugRegion: (n, c) => slugTexto(`${n} ${c}`),
    regionNombre: (n, c) => `${n} (${c})`,
    enRegion: (n, c) => `dans le ${c} (${n})`,
    deRegion: (n, c) => `du ${c} (${n})`,
    enCiudad: aFr,
    deCiudad: deFr,
    enPais: "en France",
    desc: (o) => `Prix carburant ${o.donde} : ${o.gN} dès ${o.g}, ${o.dN} dès ${o.d} aujourd'hui. Les ${o.n} stations-service classées de la moins chère à la plus chère.`,
    miga: "Stations pas chères",
    hubT: "Stations-service pas chères par département : prix du jour",
    hubH1: "Stations-service les moins chères de France",
    hubLead: (o) => `Le prix du jour dans les ${o.n} stations-service de France métropolitaine, département par département et commune par commune. En moyenne, ${o.gArt} coûte ${o.g} et ${o.dArt} ${o.d}.`,
    regionesT: "Prix moyen par département",
    colRegion: "Département",
    colCiudad: "Commune",
    colN: "Stations",
    colMin: "Le moins cher",
    colEstacion: "Station",
    rankT: "Rang du département",
    regionT: (n, c) => `Prix carburant ${n} (${c}) : stations pas chères`,
    regionH1: (n, c) => `Stations-service pas chères : ${n} (${c})`,
    regionLead: (o) => `Les prix du jour dans les ${o.n} stations-service ${o.de}. En moyenne, ${o.gArt} coûte ${o.g}${o.comp ? ` (${o.comp})` : ""} et ${o.dArt} ${o.d}.`,
    comp: (dif, mas, region) => `${dif} ct de ${mas ? "plus" : "moins"} que la moyenne ${region ? "du département" : "nationale"}`,
    ciudadT: (a) => `Station essence pas chère ${a} : prix carburant du jour`,
    ciudadTCorto: (a) => `Prix carburant ${a}`,
    ciudadH1: (a) => `Prix des carburants ${a}`,
    ciudadLead: (o) => `Les ${o.n} stations-service ${o.deC} et leurs prix du jour, de la moins chère à la plus chère. En moyenne, ${o.gArt} y coûte ${o.g} et ${o.dArt} ${o.d}${o.comp ? `, soit ${o.comp}` : ""}.`,
    baratasT: (c, d) => `Les stations les moins chères ${d} pour ${c}`,
    ciudadesT: "Prix par commune",
    cercaT: (d) => `Communes proches ${d}`,
    todaRegion: (n, c) => `Tout le département : ${n} (${c}) →`,
    verMapa: "Voir sur la carte",
    verRegiones: "Tous les départements",
    ordenadas: (c) => `Classement selon le prix : ${c} (€/l TTC).`,
    fuente: "Prix déclarés par les stations sur prix-carburants.gouv.fr. Seul le prix affiché à la pompe fait foi.",
    sinNombre: "Station-service",
    faqT: "Questions fréquentes",
    hoyT: "Aujourd'hui dans les stations",
    tituloHoy: (e, c, x) => `Prix des carburants aujourd'hui ${e} : ${c} à ${x}`,
    descHoy: (o) => `Prix moyen aujourd'hui ${o.enP} : ${o.gN} à ${o.g}, ${o.dN} à ${o.d}. Les ${o.n} stations-service, les moins chères par département et la carte.`,
    hoyLead: (o) => `Moyenne des prix déclarés par les ${o.n} stations-service de France métropolitaine (mise à jour : ${o.fecha}). Les chiffres ci-dessus sont les moyennes hebdomadaires de la Commission européenne.`,
    pBarata: (c, d) => `Où trouver ${c} le moins cher ${d} ?`,
    rBarata: (o) => `En ce moment, c'est ici : ${o.sitio}, à ${o.precio}. La moyenne est de ${o.media}.`,
    pCuantas: (d) => `Combien y a-t-il de stations-service ${d} ?`,
    rCuantas: (n, d) => `On compte ${n} stations-service ${d} qui déclarent leurs prix sur le site officiel prix-carburants.gouv.fr.`,
    pAhorro: "Combien économise-t-on en choisissant la station la moins chère ?",
    rAhorro: (dif, c) => `Sur un plein de 50 litres, l'écart entre la station la plus chère et la moins chère est de ${dif} pour ${c}.`,
    pRank: (d) => `Le carburant est-il moins cher ${d} qu'ailleurs ?`,
    rRank: (p, t, c) => `Pour ${c}, ce département se classe ${ordFr(p)} sur ${t} (1er = le moins cher).`,
  },
  pt: {
    slug: "postos-combustivel-baratos",
    slugRegion: (n) => slugTexto(n),
    regionNombre: (n) => n,
    enRegion: (n) => `no distrito ${dePt(n)}`,
    deRegion: (n) => `do distrito ${dePt(n)}`,
    enCiudad: emPt,
    deCiudad: dePt,
    enPais: "em Portugal",
    desc: (o) => `Combustível ${o.donde}: ${o.gN} desde ${o.g}, ${o.dN} desde ${o.d} hoje. Os ${o.n} postos ordenados do mais barato ao mais caro.`,
    miga: "Postos baratos",
    hubT: "Postos de combustível baratos: preços de hoje por distrito",
    hubH1: "Postos de combustível mais baratos de Portugal",
    hubLead: (o) => `Os preços de hoje nos ${o.n} postos de combustível de Portugal continental, distrito a distrito e concelho a concelho. Em média, ${o.gArt} custa ${o.g} e ${o.dArt} ${o.d}.`,
    regionesT: "Preço médio por distrito",
    colRegion: "Distrito",
    colCiudad: "Concelho",
    colN: "Postos",
    colMin: "Mais barato",
    colEstacion: "Posto",
    rankT: "Posição do distrito",
    regionT: (n) => `Combustível mais barato no distrito ${dePt(n)}: preços hoje`,
    regionH1: (n) => `Postos de combustível baratos no distrito ${dePt(n)}`,
    regionLead: (o) => `Os preços de hoje nos ${o.n} postos ${o.de}. Em média, ${o.gArt} custa ${o.g}${o.comp ? ` (${o.comp})` : ""} e ${o.dArt} ${o.d}.`,
    comp: (dif, mas, region) => `${dif} cêntimos ${mas ? "acima" : "abaixo"} da média ${region ? "do distrito" : "nacional"}`,
    ciudadT: (e) => `Combustível mais barato ${e}: preços dos postos hoje`,
    ciudadTCorto: (e) => `Combustível mais barato ${e}`,
    ciudadH1: (e) => `Preço dos combustíveis ${e}`,
    ciudadLead: (o) => `Os ${o.n} postos de combustível ${o.deC} com os preços de hoje, do mais barato ao mais caro. Em média, ${o.gArt} custa ${o.g} e ${o.dArt} ${o.d}${o.comp ? `, ${o.comp}` : ""}.`,
    baratasT: (c, d) => `Os postos mais baratos ${d} para ${c}`,
    ciudadesT: "Preços por concelho",
    cercaT: (d) => `Concelhos perto ${d}`,
    todaRegion: (n) => `Todo o distrito ${dePt(n)} →`,
    verMapa: "Ver no mapa",
    verRegiones: "Todos os distritos",
    ordenadas: (c) => `Ordenados pelo preço: ${c} (€/l com impostos).`,
    fuente: "Preços comunicados pelos postos à DGEG (Preços dos Combustíveis Online). Vale sempre o preço afixado na bomba.",
    sinNombre: "Posto",
    faqT: "Perguntas frequentes",
    hoyT: "Hoje nos postos",
    tituloHoy: (e, c, x) => `Preço dos combustíveis hoje ${e}: ${c} a ${x}`,
    descHoy: (o) => `Preço médio hoje ${o.enP}: ${o.gN} a ${o.g}, ${o.dN} a ${o.d}. Os ${o.n} postos, os mais baratos por distrito e o mapa.`,
    hoyLead: (o) => `Média dos preços comunicados pelos ${o.n} postos de Portugal continental (atualizado: ${o.fecha}). Os valores acima são as médias semanais da Comissão Europeia.`,
    pBarata: (c, d) => `Qual é o posto mais barato ${d} para ${c}?`,
    rBarata: (o) => `Neste momento é este: ${o.sitio}, a ${o.precio}. A média é de ${o.media}.`,
    pCuantas: (d) => `Quantos postos de combustível há ${d}?`,
    rCuantas: (n, d) => `Há ${n} postos ${d} que comunicam os seus preços à Direção-Geral de Energia e Geologia (DGEG).`,
    pAhorro: "Quanto se poupa ao escolher o posto mais barato?",
    rAhorro: (dif, c) => `Num depósito de 50 litros, a diferença entre o posto mais caro e o mais barato é de ${dif} para ${c}.`,
    pRank: (d) => `O combustível é mais barato ${d} do que no resto do país?`,
    rRank: (p, t, c) => `Pelo preço médio d${c.slice(0, 1) === "a" ? "a" : "o"}${c.slice(1)}, este distrito está em ${p}.º lugar entre ${t} (1.º = o mais barato).`,
  },
};
