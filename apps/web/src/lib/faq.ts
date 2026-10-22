// Preguntas frecuentes de las herramientas: las mismas que se ven en la página van al JSON-LD.

export interface Pregunta {
  p: string;
  r: string;
}

export function esquemaFaq(preguntas: Pregunta[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
}

/** Herramienta web gratuita (schema.org/WebApplication). */
export function esquemaHerramienta(nombre: string, descripcion: string, ruta: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: nombre,
    description: descripcion,
    url: new URL(ruta, url).href,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Cualquiera (navegador)",
    inLanguage: "es-ES",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };
}
