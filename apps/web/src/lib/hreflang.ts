// hreflang recíproco con PowerPriceNow (la web hermana, apps/global): sus páginas de precio de hoy y de
// mañana de cada país declaran estas páginas como la versión es-ES. Si no se devuelve el enlace, Google
// ignora el grupo y trata /precio-luz-hoy/ como una página suelta. scripts/test/hreflang.test.ts comprueba
// que esta lista coincide con la que genera la web global.

const GLOBAL = "https://powerpricenow.com";
/** [hreflang, ruta de hoy, ruta de mañana] de cada país en PowerPriceNow. */
const PAISES: [string, string, string][] = [
  ["nb-NO", "/no/", "/no/i-morgen/"],
  ["sv-SE", "/se/", "/se/imorgon/"],
  ["da-DK", "/dk/", "/dk/i-morgen/"],
  ["fi-FI", "/fi/", "/fi/huomenna/"],
  ["de-DE", "/de/", "/de/morgen/"],
  ["de-AT", "/at/", "/at/morgen/"],
  ["pt-PT", "/pt/", "/pt/amanha/"],
  ["fr-FR", "/fr/", "/fr/demain/"],
  ["it-IT", "/it/", "/it/domani/"],
  ["nl-NL", "/nl/", "/nl/morgen/"],
  ["nl-BE", "/be/", "/be/morgen/"],
];

export function alternativas(pag: "hoy" | "manana"): { lang: string; href: string }[] {
  return [
    ...PAISES.map(([lang, hoy, manana]) => ({ lang, href: GLOBAL + (pag === "hoy" ? hoy : manana) })),
    { lang: "es-ES", href: `https://comparadortarifaluz.es${pag === "hoy" ? "/precio-luz-hoy/" : "/precio-luz-manana/"}` },
    { lang: "x-default", href: `${GLOBAL}/` },
  ];
}
