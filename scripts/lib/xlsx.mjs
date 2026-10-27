// Lector mínimo de .xlsx sin dependencias: un xlsx es un zip con XML dentro. Solo lee valores (no formatos).
// Uso: const hojas = leerXlsx(buffer) → Map nombreHoja → filas (arrays de celdas: número, texto o null).

import { inflateRawSync } from "node:zlib";

function unzip(buf) {
  // Fin del directorio central: firma 0x06054b50 cerca del final.
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("xlsx: no es un zip");
  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const ficheros = new Map();
  for (let i = 0; i < total; i++) {
    const metodo = buf.readUInt16LE(p + 10);
    const tamComp = buf.readUInt32LE(p + 20);
    const lNombre = buf.readUInt16LE(p + 28);
    const lExtra = buf.readUInt16LE(p + 30);
    const lComent = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nombre = buf.toString("utf8", p + 46, p + 46 + lNombre);
    const inicio = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const datos = buf.subarray(inicio, inicio + tamComp);
    ficheros.set(nombre, () => (metodo === 0 ? datos : inflateRawSync(datos)));
    p += 46 + lNombre + lExtra + lComent;
  }
  return ficheros;
}

const desescapar = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const columna = (ref) => [...ref.replace(/\d+/g, "")].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

export function leerXlsx(buf) {
  const zip = unzip(buf);
  const texto = (n) => zip.get(n)?.().toString("utf8") ?? "";
  const compartidas = [...texto("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    desescapar([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
  );
  const rels = new Map([...texto("xl/_rels/workbook.xml.rels").matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((m) => [m[1], m[2].replace(/^\/?xl\//, "")]));
  const hojas = new Map();
  for (const m of texto("xl/workbook.xml").matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    const xml = texto(`xl/${rels.get(m[2])}`);
    const filas = [];
    for (const f of xml.matchAll(/<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const fila = [];
      for (const c of f[2].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /r="([A-Z]+\d+)"/.exec(c[1])?.[1];
        const tipo = /t="(\w+)"/.exec(c[1])?.[1];
        const v = c[2] ? /<v>([\s\S]*?)<\/v>/.exec(c[2])?.[1] ?? /<t[^>]*>([\s\S]*?)<\/t>/.exec(c[2])?.[1] : undefined;
        if (!ref || v === undefined) continue;
        fila[columna(ref)] = tipo === "s" ? compartidas[Number(v)] : tipo === "str" || tipo === "inlineStr" ? desescapar(v) : Number(v);
      }
      filas[Number(f[1]) - 1] = Array.from(fila, (x) => x ?? null);
    }
    hojas.set(desescapar(m[1]), Array.from(filas, (x) => x ?? []));
  }
  return hojas;
}
