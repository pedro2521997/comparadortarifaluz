// Mapa de gasolineras en el navegador (MapLibre + teselas de OpenFreeMap, gratis y sin clave). Carga el JSON del
// país y pinta cada gasolinera con la insignia de su marca dentro de un aro del color de su precio (verde barato,
// rojo caro). Tiene buscador de localidades y direcciones, y tres listas: las más baratas de lo que se ve, las
// más cercanas (a ti o al sitio buscado) y las que pillan de camino en una ruta (calculada con OSRM sobre
// OpenStreetMap). En el móvil se abre a pantalla completa, como una aplicación.

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { insignia, nombreMarca, type Marca } from "../lib/marcas";

/** [lat, lon, nombre, dirección, municipio, cp, precios, fecha, autopista, ficha (solo España)] */
type Fila = [number, number, string, string, string, string, (number | null)[], string, 0 | 1, string?];
interface Datos { combustibles: string[]; e: Fila[] }
interface Config {
  datos: string;
  cc: string;
  locale: string;
  limites: [number, number, number, number];
  inicial: string;
  combustibles: Record<string, string>;
  /** «/es/gasolinera/» si las gasolineras tienen ficha propia en este idioma */
  fichas: string | null;
  t: {
    vacio: string; ruta: string; precioDel: string; autopista: string; sinDatos: string; sinUbicacion: string; baratasZona: string;
    estacion: string; lugares: string; estaciones: [string, string]; nada: string; gestos: [string, string, string];
    app: Record<string, string>;
  };
}

/** Servidor de rutas de OpenStreetMap (FOSSGIS): gratis, sin clave, para uso moderado. */
const OSRM = "https://routing.openstreetmap.de/routed-car/route/v1/driving/";
const CERCANAS = 15;
const EN_RUTA = 40;

const raiz = document.querySelector<HTMLElement>("[data-mapa]");
const cfgEl = document.getElementById("mapa-config");
if (raiz && cfgEl) iniciar(raiz, JSON.parse(cfgEl.textContent ?? "{}") as Config);

function iniciar(raiz: HTMLElement, cfg: Config) {
  const $ = <T extends HTMLElement>(sel: string) => raiz.querySelector<T>(sel)!;
  const lienzo = $<HTMLDivElement>("[data-lienzo]");
  const estado = $<HTMLParagraphElement>("[data-estado]");
  const lista = $<HTMLOListElement>("[data-lista]");
  const titulo = $<HTMLHeadingElement>("[data-titulo]");
  const resumen = $<HTMLParagraphElement>("[data-resumen]");
  const buscar = $<HTMLInputElement>("[data-buscar]");
  const leyenda = $<HTMLDivElement>("[data-leyenda]");
  const formRuta = $<HTMLFormElement>("[data-ruta]");
  const origen = $<HTMLInputElement>("[data-origen]");
  const destino = $<HTMLInputElement>("[data-destino]");
  const desvio = $<HTMLSelectElement>("[data-desvio]");
  const quitar = $<HTMLButtonElement>("[data-quitar]");
  const trayecto = $<HTMLSpanElement>("[data-trayecto]");
  const ordenRutaEl = $<HTMLDivElement>("[data-orden]");
  const T = cfg.t;
  const A = T.app;

  const nf = new Intl.NumberFormat(cfg.locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const nf0 = new Intl.NumberFormat(cfg.locale);
  const nf1 = new Intl.NumberFormat(cfg.locale, { maximumFractionDigits: 1 });
  const euros = (x: number) => `${nf.format(x)} €`;
  const distancia = (km: number) => (km < 1 ? `${nf0.format(Math.round((km * 1000) / 50) * 50)} m` : `${(km < 10 ? nf1 : nf0).format(km)} km`);
  const fechaCorta = new Intl.DateTimeFormat(cfg.locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const nEst = (n: number) => (n === 1 ? T.estaciones[0] : T.estaciones[1].replace("{n}", nf0.format(n)));
  const rellenar = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? "");
  const movil = () => matchMedia("(max-width: 860px)").matches;

  let comb = cfg.inicial;
  try {
    const guardado = localStorage.getItem(`mapa-comb-${cfg.cc}`);
    if (guardado && cfg.combustibles[guardado]) comb = guardado;
  } catch {
    /* sin almacenamiento: se usa el carburante por defecto */
  }

  const mapa = new maplibregl.Map({
    container: lienzo,
    style: "https://tiles.openfreemap.org/styles/positron",
    bounds: cfg.limites,
    fitBoundsOptions: { padding: 10 },
    cooperativeGestures: true,
    attributionControl: { compact: true },
    locale: {
      "CooperativeGesturesHandler.WindowsHelpText": T.gestos[0],
      "CooperativeGesturesHandler.MacHelpText": T.gestos[1],
      "CooperativeGesturesHandler.MobileHelpText": T.gestos[2],
    },
  });
  // El hueco del mapa cambia de tamaño sin que cambie la ventana (pantalla completa, hoja de la lista que sube o baja).
  new ResizeObserver(() => mapa.resize()).observe(lienzo);
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  mapa.addControl(
    {
      onAdd() {
        const div = document.createElement("div");
        div.className = "maplibregl-ctrl maplibregl-ctrl-group";
        div.innerHTML = `<button type="button" class="mapa__ctrl-app" title="${esc(A.pantalla)}" aria-label="${esc(A.pantalla)}"><span aria-hidden="true">⤢</span></button>`;
        div.querySelector("button")!.addEventListener("click", () => (raiz.classList.contains("mapa--app") ? salirApp() : entrarApp()));
        return div;
      },
      onRemove() {},
    },
    "top-right",
  );

  let datos: Datos | null = null;
  /** Insignia de cada gasolinera (mismo orden que datos.e). */
  let marcas: Marca[] = [];
  /** Gasolineras que venden el carburante elegido, con su precio. */
  let visibles: { i: number; p: number }[] = [];
  const precioDe = new Map<number, number>();
  let escala = { q10: 0, q50: 0, q90: 0 };
  let popup: maplibregl.Popup | null = null;
  let yo: maplibregl.Marker | null = null;

  type Modo = "baratas" | "cerca" | "ruta";
  let modo: Modo = "baratas";
  /** Punto de referencia de «más cercanas»: tu ubicación, el sitio buscado o el centro del mapa. */
  let ref: { c: [number, number]; tipo: "yo" | "lugar" | "centro"; nombre?: string } | null = null;
  let ruta: { km: number; en: Map<number, { d: number; km: number }> } | null = null;
  let ordenRuta: "precio" | "paso" = "precio";

  const cargaDatos = fetch(cfg.datos).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<Datos>;
  });
  const cargaMapa = new Promise<void>((ok) => mapa.on("load", () => ok()));

  Promise.all([cargaDatos, cargaMapa])
    .then(([d]) => {
      datos = d;
      marcas = d.e.map((f) => insignia(f[2]));
      estado.hidden = true;
      // La atribución empieza plegada (en el móvil tapaba media parte de abajo del mapa).
      raiz.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      prepararCapas();
      pintar();
      indexar();
      desdeUrl();
    })
    .catch(() => {
      estado.textContent = T.sinDatos;
      estado.hidden = false;
    });

  // ---------------- Capas ----------------

  /** Dibuja la insignia de una marca (la pide MapLibre la primera vez que la necesita). */
  function dibujarInsignia(id: string) {
    const m = marcas.find((x) => `m-${x.id}` === id) ?? insignia("");
    const px = 48;
    const c = document.createElement("canvas");
    c.width = c.height = px;
    const g = c.getContext("2d")!;
    // Borde blanco fino que separa la insignia del aro de color.
    g.beginPath();
    g.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
    g.fillStyle = "#ffffff";
    g.fill();
    g.beginPath();
    g.arc(px / 2, px / 2, px / 2 - 3, 0, Math.PI * 2);
    g.fillStyle = m.bg;
    g.fill();
    g.fillStyle = m.fg;
    if (m.t) {
      g.font = `700 ${m.t.length === 1 ? 26 : m.t.length === 2 ? 20 : 15}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(m.t, px / 2, px / 2 + 1);
    } else {
      // Surtidor: cuerpo, ventanita y manguera.
      g.fillRect(15, 13, 13, 22);
      g.fillStyle = m.bg;
      g.fillRect(17.5, 16, 8, 6);
      g.strokeStyle = m.fg;
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(28, 17);
      g.lineTo(33, 21);
      g.lineTo(33, 31);
      g.stroke();
    }
    mapa.addImage(id, g.getImageData(0, 0, px, px), { pixelRatio: 2 });
  }

  function prepararCapas() {
    // Nombres de países y ciudades en el idioma de la página («Spanien», «Espagne»…), si el mapa los tiene.
    const lang = cfg.locale.slice(0, 2);
    for (const capa of mapa.getStyle().layers) {
      if (capa.type !== "symbol") continue;
      const campo = JSON.stringify(mapa.getLayoutProperty(capa.id, "text-field") ?? "");
      if (campo.includes("name") && !/ref|housenumber/.test(campo)) mapa.setLayoutProperty(capa.id, "text-field", ["coalesce", ["get", `name:${lang}`], ["get", "name"]]);
    }
    mapa.on("styleimagemissing", (ev) => {
      if (ev.id.startsWith("m-")) dibujarInsignia(ev.id);
    });
    mapa.addSource("ruta", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    mapa.addLayer({ id: "ruta-borde", type: "line", source: "ruta", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#ffffff", "line-width": 9 } });
    mapa.addLayer({ id: "ruta", type: "line", source: "ruta", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#2f6fde", "line-width": 5, "line-opacity": 0.85 } });
    mapa.addSource("gasolineras", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    const opacidad = ["case", ["==", ["get", "r"], 1], 1, 0.22];
    // Aro de color (y, de lejos, el punto entero).
    mapa.addLayer({
      id: "gasolineras",
      type: "circle",
      source: "gasolineras",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 2.5, 8, 4, 11.2, 6, 11.5, 15, 15, 18],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 4, 0.3, 10, 1, 11.5, 1.5],
        "circle-color": "#888888",
        "circle-opacity": opacidad as never,
        "circle-stroke-opacity": opacidad as never,
      },
      layout: { "circle-sort-key": ["-", 0, ["get", "p"]] },
    });
    // Insignia de la marca dentro del aro.
    mapa.addLayer({
      id: "marcas",
      type: "symbol",
      source: "gasolineras",
      minzoom: 11.5,
      layout: {
        "icon-image": ["get", "m"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 11.5, 0.9, 15, 1.08],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "symbol-sort-key": ["-", 0, ["get", "p"]],
      },
      paint: { "icon-opacity": opacidad as never },
    });
    mapa.addLayer({
      id: "precios",
      type: "symbol",
      source: "gasolineras",
      minzoom: 12,
      layout: {
        "text-field": ["get", "t"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-offset": [0, -2.4],
        "symbol-sort-key": ["get", "p"],
      },
      paint: { "text-color": "#1d2b25", "text-halo-color": "#ffffff", "text-halo-width": 1.8, "text-opacity": opacidad as never },
    });
    mapa.addLayer({
      id: "elegida",
      type: "circle",
      source: "gasolineras",
      filter: ["==", ["get", "i"], -1],
      paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 10, 11.5, 19, 15, 22], "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#104336", "circle-stroke-width": 3 },
    });
    for (const capa of ["gasolineras", "marcas"]) {
      mapa.on("click", capa, (ev) => {
        const f = ev.features?.[0];
        if (f) abrir(Number(f.properties.i));
      });
      mapa.on("mouseenter", capa, () => (mapa.getCanvas().style.cursor = "pointer"));
      mapa.on("mouseleave", capa, () => (mapa.getCanvas().style.cursor = ""));
    }
    mapa.on("moveend", () => {
      if (modo === "baratas") listar();
    });
  }

  const COLORES: [number, number, number][] = [
    [0x1a, 0x98, 0x50],
    [0xf2, 0xc9, 0x4c],
    [0xd7, 0x30, 0x27],
  ];
  /** Mismo degradado que el mapa, para las listas y la ventanita. */
  function colorPrecio(p: number): string {
    const { q10, q50, q90 } = escala;
    const [a, b, t] = p <= q50 ? [0, 1, (p - q10) / (q50 - q10)] : [1, 2, (p - q50) / (q90 - q50)];
    const k = Math.min(1, Math.max(0, t));
    const c = COLORES[a].map((x, j) => Math.round(x + (COLORES[b][j] - x) * k));
    return `rgb(${c.join(",")})`;
  }

  /** Vuelve a pintar las gasolineras con el carburante elegido y recalcula colores y leyenda. */
  function pintar() {
    if (!datos) return;
    const k = datos.combustibles.indexOf(comb);
    visibles = [];
    precioDe.clear();
    datos.e.forEach((f, i) => {
      const p = f[6][k];
      if (p != null) {
        visibles.push({ i, p });
        precioDe.set(i, p);
      }
    });
    const orden = visibles.map((v) => v.p).sort((a, b) => a - b);
    const q = (x: number) => orden[Math.min(orden.length - 1, Math.floor(x * orden.length))] ?? 0;
    const q10 = q(0.1);
    const q50 = Math.max(q(0.5), q10 + 0.001);
    const q90 = Math.max(q(0.9), q50 + 0.001);
    escala = { q10, q50, q90 };
    actualizarFuente();
    mapa.setPaintProperty("gasolineras", "circle-color", ["interpolate", ["linear"], ["get", "p"], q10, "#1a9850", q50, "#f2c94c", q90, "#d73027"]);
    leyenda.querySelector("[data-min]")!.textContent = euros(q10);
    leyenda.querySelector("[data-max]")!.textContent = euros(q90);
    leyenda.hidden = !visibles.length;
    raiz.querySelectorAll<HTMLButtonElement>("[data-comb]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.comb === comb)));
    if (popup) popup.remove();
    listar();
  }

  function actualizarFuente() {
    (mapa.getSource("gasolineras") as maplibregl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: visibles.map(({ i, p }) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [datos!.e[i][1], datos!.e[i][0]] },
        properties: { i, p, t: nf.format(p), m: `m-${marcas[i].id}`, r: !ruta || ruta.en.has(i) ? 1 : 0 },
      })),
    });
  }

  // ---------------- Listas ----------------

  const nombre = (f: Fila) => (f[2] ? nombreMarca(f[2]) : f[3] || T.estacion);
  const htmlInsignia = (i: number, p: number | undefined) => {
    const m = marcas[i];
    return `<span class="ins" style="--bg:${m.bg};--fg:${m.fg};--aro:${p != null ? colorPrecio(p) : "#888"}" aria-hidden="true">${esc(m.t || "⛽")}</span>`;
  };

  interface Item { i: number; extra?: string; tag?: string }

  function pintarLista(items: Item[], vacio = T.vacio) {
    lista.replaceChildren(
      ...(items.length
        ? items.map(({ i, extra, tag }) => {
            const f = datos!.e[i];
            const p = precioDe.get(i)!;
            const li = document.createElement("li");
            const btn = document.createElement("button");
            btn.type = "button";
            const donde = [extra, [f[2] ? f[3] : "", f[4]].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
            btn.innerHTML = `${htmlInsignia(i, p)}<span class="txt"><span class="nom">${esc(nombre(f))}${tag ? ` <em class="tag">${esc(tag)}</em>` : ""}</span><span class="donde">${esc(donde)}</span></span><span class="precio">${esc(euros(p))}</span>`;
            btn.addEventListener("click", () => {
              mapa.flyTo({ center: [f[1], f[0]], zoom: Math.max(mapa.getZoom(), 14.5) });
              abrir(i);
              if (raiz.classList.contains("mapa--app") && movil()) raiz.classList.add("mapa--plegado");
            });
            li.append(btn);
            return li;
          })
        : [Object.assign(document.createElement("li"), { className: "vacio", textContent: vacio })]),
    );
    lista.scrollTop = 0;
  }

  function listar() {
    if (!datos) return;
    raiz.querySelectorAll<HTMLButtonElement>("[data-modo]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.modo === modo)));
    formRuta.hidden = modo !== "ruta";
    ordenRutaEl.hidden = !(modo === "ruta" && ruta);
    resumen.textContent = "";
    if (modo === "baratas") {
      titulo.textContent = T.baratasZona;
      const b = mapa.getBounds();
      const dentro = visibles.filter(({ i }) => b.contains([datos!.e[i][1], datos!.e[i][0]])).sort((a, c) => a.p - c.p).slice(0, 10);
      pintarLista(dentro.map(({ i }) => ({ i })));
    } else if (modo === "cerca") {
      if (!ref) return;
      titulo.textContent = ref.tipo === "yo" ? A.cercaTi : ref.tipo === "lugar" ? rellenar(A.cercaDe, { l: ref.nombre ?? "" }) : A.cercaCentro;
      const [lon, lat] = ref.c;
      const cercanas = visibles
        .map(({ i, p }) => ({ i, p, d: km([lon, lat], [datos!.e[i][1], datos!.e[i][0]]) }))
        .sort((a, c) => a.d - c.d)
        .slice(0, CERCANAS);
      const barata = [...cercanas].sort((a, c) => a.p - c.p || a.d - c.d)[0];
      if (barata) resumen.textContent = rellenar(A.laMasBarata, { n: nombre(datos.e[barata.i]), p: euros(barata.p), d: rellenar(A.a, { d: distancia(barata.d) }) });
      pintarLista(cercanas.map(({ i, d }) => ({ i, extra: rellenar(A.a, { d: distancia(d) }), tag: i === barata?.i ? A.masBarata : undefined })));
    } else {
      titulo.textContent = A.pestRuta;
      if (!ruta) return lista.replaceChildren();
      const en = visibles.filter(({ i }) => ruta!.en.has(i)).map(({ i, p }) => ({ i, p, ...ruta!.en.get(i)! }));
      const barata = [...en].sort((a, c) => a.p - c.p || a.km - c.km)[0];
      resumen.textContent = rellenar(A.rutaResumen, { km: `${nf0.format(Math.round(ruta.km))} km`, n: nEst(en.length), d: desvio.selectedOptions[0]?.textContent ?? "" });
      const orden = ordenRuta === "precio" ? en.sort((a, c) => a.p - c.p || a.km - c.km) : en.sort((a, c) => a.km - c.km);
      raiz.querySelectorAll<HTMLButtonElement>("[data-orden-ruta]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ordenRuta === ordenRuta)));
      pintarLista(
        orden.slice(0, EN_RUTA).map(({ i, km: k, d }) => ({ i, extra: `${rellenar(A.km, { k: nf0.format(Math.round(k)) })} · ${rellenar(A.a, { d: distancia(d) })}`, tag: i === barata?.i ? A.masBarata : undefined })),
        A.rutaNada,
      );
    }
  }

  function abrir(i: number) {
    if (!datos) return;
    const f = datos.e[i];
    const precios = datos.combustibles
      .map((k, j) => [k, f[6][j]] as const)
      .filter(([k, p]) => p != null && cfg.combustibles[k])
      .map(([k, p]) => `<li class="${k === comb ? "actual" : ""}"><span>${esc(cfg.combustibles[k])}</span><span>${esc(euros(p!))}</span></li>`)
      .join("");
    const fecha = f[7] ? T.precioDel.replace("{f}", fechaCorta.format(new Date(`${f[7]}T12:00:00Z`))) : "";
    const pie = [fecha, f[8] ? T.autopista : "", ref?.tipo === "yo" ? rellenar(A.a, { d: distancia(km(ref.c, [f[1], f[0]])) }) : ""].filter(Boolean).join(" · ");
    const ficha = cfg.fichas && f[9] ? `<a href="${cfg.fichas}${encodeURIComponent(f[9])}/">${esc(A.ficha)}</a>` : "";
    const html = `<div class="popup__cab">${htmlInsignia(i, precioDe.get(i))}<strong>${esc(f[2] ? nombreMarca(f[2]) : T.estacion)}</strong></div>${esc(f[3])}<br>${esc([f[5], f[4]].filter(Boolean).join(" "))}
      <ul class="popup__precios">${precios}</ul>
      <div class="popup__pie">${esc(pie)}</div>
      <div class="popup__acciones"><a href="https://www.google.com/maps/dir/?api=1&destination=${f[0]},${f[1]}" target="_blank" rel="noopener">${esc(T.ruta)} →</a>${ficha}</div>`;
    if (popup) popup.remove();
    popup = new maplibregl.Popup({ offset: 14, maxWidth: "290px" }).setLngLat([f[1], f[0]]).setHTML(html).addTo(mapa);
    mapa.setFilter("elegida", ["==", ["get", "i"], i]);
    popup.on("close", () => mapa.setFilter("elegida", ["==", ["get", "i"], -1]));
  }

  /** ?b=oeste,sur,este,norte encuadra una zona; ?q= busca un sitio; ?e= abre una gasolinera (por su ficha). */
  function desdeUrl() {
    const u = new URLSearchParams(location.search);
    const e = u.get("e");
    const i = e ? datos!.e.findIndex((f) => f[9] === e) : -1;
    if (i >= 0) {
      const f = datos!.e[i];
      if (!precioDe.has(i)) cambiarA(i);
      mapa.jumpTo({ center: [f[1], f[0]], zoom: 15 });
      abrir(i);
      return;
    }
    const b = (u.get("b") ?? "").split(",").map(Number);
    if (b.length === 4 && b.every(Number.isFinite)) {
      mapa.fitBounds([b[0], b[1], b[2], b[3]], { padding: 40, maxZoom: 14, duration: 0 });
      return;
    }
    const q = u.get("q");
    if (q) {
      const o = buscador.proponer(q)[0];
      if (o) buscador.elegir(o, false);
    }
  }

  /** Si una gasolinera no vende el carburante elegido, se cambia a uno que sí venda para poder enseñarla. */
  function cambiarA(i: number) {
    const f = datos!.e[i];
    const otro = datos!.combustibles.find((c, j) => f[6][j] != null && cfg.combustibles[c]);
    if (otro) {
      comb = otro;
      pintar();
    }
  }

  // ---------------- Carburante y pestañas ----------------

  raiz.querySelectorAll<HTMLButtonElement>("[data-comb]").forEach((b) =>
    b.addEventListener("click", () => {
      comb = b.dataset.comb!;
      try {
        localStorage.setItem(`mapa-comb-${cfg.cc}`, comb);
      } catch {
        /* nada */
      }
      pintar();
    }),
  );
  raiz.querySelectorAll<HTMLButtonElement>("[data-comb]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.comb === comb)));

  raiz.querySelectorAll<HTMLButtonElement>("[data-modo]").forEach((b) =>
    b.addEventListener("click", () => {
      raiz.classList.remove("mapa--plegado");
      const m = b.dataset.modo as Modo;
      if (m === "cerca") return cerca(false);
      modo = m;
      listar();
      if (m === "ruta" && !ruta) destino.focus({ preventScroll: true });
    }),
  );
  raiz.querySelectorAll<HTMLButtonElement>("[data-orden-ruta]").forEach((b) =>
    b.addEventListener("click", () => {
      ordenRuta = b.dataset.ordenRuta as "precio" | "paso";
      listar();
    }),
  );
  $<HTMLButtonElement>("[data-plegar]").addEventListener("click", () => raiz.classList.toggle("mapa--plegado"));

  // ---------------- Más cercanas ----------------

  /** Distancia en km entre dos puntos [lon, lat]. */
  function km(a: [number, number], b: [number, number]) {
    const r = Math.PI / 180;
    const dLat = (b[1] - a[1]) * r;
    const dLon = (b[0] - a[0]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  }

  function ubicar(): Promise<[number, number]> {
    return new Promise((ok, mal) => {
      if (!navigator.geolocation) return mal(new Error("sin geolocalización"));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          yo?.remove();
          yo = new maplibregl.Marker({ color: "#2f6fde", scale: 0.8 }).setLngLat(c).addTo(mapa);
          ok(c);
        },
        mal,
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
      );
    });
  }

  /** Pestaña «más cercanas». Con `pedir`, o si no hay otro punto de referencia, pregunta dónde estás. */
  async function cerca(pedir: boolean) {
    modo = "cerca";
    if (pedir || !ref) {
      try {
        ref = { c: await ubicar(), tipo: "yo" };
      } catch {
        aviso(T.sinUbicacion);
        if (!ref) {
          const c = mapa.getCenter();
          ref = { c: [c.lng, c.lat], tipo: "centro" };
        }
      }
    }
    listar();
    encuadrarCercanas();
  }

  function encuadrarCercanas() {
    if (!ref || !datos) return;
    const [lon, lat] = ref.c;
    const puntos = visibles
      .map(({ i }) => ({ i, d: km(ref!.c, [datos!.e[i][1], datos!.e[i][0]]) }))
      .sort((a, c) => a.d - c.d)
      .slice(0, 6)
      .map(({ i }) => [datos!.e[i][1], datos!.e[i][0]]);
    const b = new maplibregl.LngLatBounds([lon, lat], [lon, lat]);
    for (const p of puntos) b.extend(p as [number, number]);
    encuadrar(b, { padding: 60, maxZoom: 14.5 });
  }

  /** Encuadra cuando la lista ya ha cambiado de alto (en el móvil, la hoja de abajo encoge el mapa). */
  function encuadrar(b: maplibregl.LngLatBoundsLike, o: maplibregl.FitBoundsOptions) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        mapa.resize();
        mapa.fitBounds(b, o);
      }),
    );
  }

  $<HTMLButtonElement>("[data-cerca]").addEventListener("click", () => {
    if (movil()) entrarApp();
    raiz.classList.remove("mapa--plegado");
    cerca(true);
  });

  let avisoT: number | undefined;
  function aviso(texto: string) {
    estado.textContent = texto;
    estado.hidden = false;
    clearTimeout(avisoT);
    avisoT = window.setTimeout(() => (estado.hidden = true), 4500);
  }

  // ---------------- Buscador ----------------

  interface Lugar { nombre: string; clave: string; cp: Set<string>; n: number; b: [number, number, number, number] }
  let lugares: Lugar[] = [];
  let claves: string[] = [];

  function indexar() {
    const m = new Map<string, Lugar>();
    for (const f of datos!.e) {
      const clave = norm(f[4]);
      if (!clave) continue;
      const l = m.get(clave) ?? { nombre: f[4], clave, cp: new Set<string>(), n: 0, b: [f[1], f[0], f[1], f[0]] };
      l.n++;
      if (f[5]) l.cp.add(f[5]);
      l.b = [Math.min(l.b[0], f[1]), Math.min(l.b[1], f[0]), Math.max(l.b[2], f[1]), Math.max(l.b[3], f[0])];
      m.set(clave, l);
    }
    lugares = [...m.values()].sort((a, b) => b.n - a.n);
    claves = datos!.e.map((f) => norm(`${f[2]} ${f[3]} ${f[4]} ${f[5]}`));
  }
  const centro = (l: Lugar): [number, number] => [(l.b[0] + l.b[2]) / 2, (l.b[1] + l.b[3]) / 2];

  type Opcion = { tipo: "lugar"; l: Lugar } | { tipo: "estacion"; i: number } | { tipo: "yo" };

  /** Desplegable de sugerencias para un campo de texto (buscador principal y salida/destino de la ruta). */
  function autocompletar(input: HTMLInputElement, o: { estaciones: boolean; yo: boolean; alElegir: (op: Opcion, desplazar: boolean) => void }) {
    const ul = document.getElementById(input.getAttribute("aria-controls")!) as HTMLUListElement;
    let opciones: Opcion[] = [];
    let activa = -1;

    function proponer(texto: string): Opcion[] {
      const q = norm(texto);
      const r: Opcion[] = [];
      if (o.yo && (!q || norm(A.miUbicacion).startsWith(q))) r.push({ tipo: "yo" });
      if (q.length < 2 || !datos) return r;
      const porLugar = lugares
        .map((l) => ({ l, r: l.clave === q ? 0 : l.clave.startsWith(q) ? 1 : [...l.cp].some((c) => norm(c).startsWith(q)) ? 1 : ` ${l.clave}`.includes(` ${q}`) ? 2 : 9 }))
        .filter((x) => x.r < 9)
        .sort((a, b) => a.r - b.r || b.l.n - a.l.n)
        .slice(0, 6);
      r.push(...porLugar.map((x) => ({ tipo: "lugar" as const, l: x.l })));
      if (o.estaciones) {
        const palabras = q.split(" ");
        for (let i = 0, n = 0; i < claves.length && n < 5; i++)
          if (palabras.every((w) => claves[i].includes(w))) {
            r.push({ tipo: "estacion", i });
            n++;
          }
      }
      return r;
    }

    function pintarOpciones() {
      const items: HTMLLIElement[] = [];
      let ultimoTipo = "";
      opciones.forEach((op, k) => {
        if (op.tipo !== ultimoTipo && op.tipo !== "yo") {
          ultimoTipo = op.tipo;
          const cab = document.createElement("li");
          cab.className = "cab";
          cab.setAttribute("role", "presentation");
          cab.textContent = op.tipo === "lugar" ? T.lugares : T.estacion;
          items.push(cab);
        }
        const li = document.createElement("li");
        li.id = `${ul.id}-${k}`;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(k === activa));
        if (op.tipo === "yo") li.innerHTML = `<span>⌖ ${esc(A.miUbicacion)}</span>`;
        else if (op.tipo === "lugar") li.innerHTML = `<span>${esc(op.l.nombre)}</span><small>${esc(nEst(op.l.n))}</small>`;
        else {
          const f = datos!.e[op.i];
          li.innerHTML = `<span>${esc([f[2] ? nombreMarca(f[2]) : "", f[3]].filter(Boolean).join(", "))}</span><small>${esc(f[4])}</small>`;
        }
        li.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          elegir(op);
        });
        items.push(li);
      });
      if (!opciones.length) items.push(Object.assign(document.createElement("li"), { className: "cab", textContent: T.nada }));
      ul.replaceChildren(...items);
      ul.hidden = false;
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-activedescendant", activa >= 0 ? `${ul.id}-${activa}` : "");
    }

    function cerrar() {
      ul.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }

    function elegir(op: Opcion, desplazar = true) {
      cerrar();
      input.value = op.tipo === "yo" ? A.miUbicacion : op.tipo === "lugar" ? op.l.nombre : [datos!.e[op.i][3], datos!.e[op.i][4]].filter(Boolean).join(", ");
      o.alElegir(op, desplazar);
    }

    let espera: number | undefined;
    input.addEventListener("input", () => {
      clearTimeout(espera);
      espera = window.setTimeout(() => {
        opciones = proponer(input.value);
        activa = -1;
        if (norm(input.value).length < 2 && !opciones.length) return cerrar();
        pintarOpciones();
      }, 120);
    });
    input.addEventListener("focus", () => {
      if (o.yo && !input.value) {
        opciones = proponer("");
        pintarOpciones();
      }
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        if (!opciones.length) return;
        ev.preventDefault();
        activa = (activa + (ev.key === "ArrowDown" ? 1 : -1) + opciones.length) % opciones.length;
        pintarOpciones();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        if (!opciones.length) opciones = proponer(input.value);
        const op = opciones[activa >= 0 ? activa : 0];
        if (op) elegir(op);
      } else if (ev.key === "Escape") cerrar();
    });
    input.addEventListener("blur", () => setTimeout(cerrar, 150));
    return { proponer, elegir };
  }

  const buscador = autocompletar(buscar, {
    estaciones: true,
    yo: false,
    alElegir(op, desplazar) {
      if (op.tipo === "lugar") {
        const [a, b, c, d] = op.l.b;
        mapa.fitBounds([a, b, c, d], { padding: 40, maxZoom: 13.5 });
        ref = { c: centro(op.l), tipo: "lugar", nombre: op.l.nombre };
        if (modo === "cerca") listar();
      } else if (op.tipo === "estacion") {
        const f = datos!.e[op.i];
        mapa.flyTo({ center: [f[1], f[0]], zoom: 15 });
        if (!precioDe.has(op.i)) cambiarA(op.i);
        abrir(op.i);
      }
      if (desplazar && !raiz.classList.contains("mapa--app")) raiz.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });

  // ---------------- Ruta ----------------

  let selOrigen: Opcion | null = null;
  let selDestino: Opcion | null = null;
  autocompletar(origen, { estaciones: false, yo: true, alElegir: (op) => (selOrigen = op) });
  autocompletar(destino, { estaciones: false, yo: false, alElegir: (op) => (selDestino = op) });
  origen.addEventListener("input", () => (selOrigen = null));
  destino.addEventListener("input", () => (selDestino = null));

  /** Lo elegido en la lista o, si solo se ha escrito, la primera localidad que encaje. La salida en blanco es «mi ubicación». */
  function resolver(input: HTMLInputElement, sel: Opcion | null, vacio: Opcion | null = null): Opcion | null {
    if (sel) return sel;
    const q = norm(input.value);
    if (!q) return vacio;
    const l = lugares.find((x) => x.clave === q) ?? lugares.find((x) => x.clave.startsWith(q));
    return l ? { tipo: "lugar", l } : null;
  }

  async function punto(op: Opcion): Promise<[number, number]> {
    if (op.tipo === "lugar") return centro(op.l);
    if (op.tipo === "estacion") return [datos!.e[op.i][1], datos!.e[op.i][0]];
    const c = await ubicar();
    ref = { c, tipo: "yo" };
    return c;
  }

  formRuta.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!datos) return;
    const o = resolver(origen, selOrigen, { tipo: "yo" });
    const d = resolver(destino, selDestino);
    if (!o || !d) return aviso(A.rutaFalta);
    const boton = formRuta.querySelector<HTMLButtonElement>("button[type=submit]")!;
    boton.disabled = true;
    resumen.textContent = A.calculando;
    try {
      let a: [number, number];
      try {
        a = await punto(o);
      } catch {
        aviso(T.sinUbicacion);
        resumen.textContent = "";
        return;
      }
      const b = await punto(d);
      const r = await fetch(`${OSRM}${a.map((x) => x.toFixed(5)).join(",")};${b.map((x) => x.toFixed(5)).join(",")}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(20000) });
      const j = (await r.json()) as { code: string; routes?: { distance: number; geometry: { coordinates: [number, number][] } }[] };
      const rt = j.routes?.[0];
      if (!r.ok || j.code !== "Ok" || !rt) throw new Error(j.code);
      const coords = rt.geometry.coordinates;
      ruta = { km: rt.distance / 1000, en: corredor(coords, Number(desvio.value), rt.distance / 1000) };
      (mapa.getSource("ruta") as maplibregl.GeoJSONSource).setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
      const caja = coords.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
      encuadrar(caja, { padding: movil() ? 30 : 50 });
      trayecto.textContent = `${origen.value || A.miUbicacion} → ${destino.value}`;
      formRuta.classList.add("mapa__ruta--hecha");
      actualizarFuente();
      modo = "ruta";
      listar();
      if (movil()) (document.activeElement as HTMLElement | null)?.blur();
    } catch {
      resumen.textContent = "";
      aviso(A.rutaError);
    } finally {
      boton.disabled = false;
    }
  });

  quitar.addEventListener("click", () => {
    ruta = null;
    formRuta.classList.remove("mapa__ruta--hecha");
    (mapa.getSource("ruta") as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features: [] });
    actualizarFuente();
    listar();
  });
  $<HTMLButtonElement>("[data-editar]").addEventListener("click", () => {
    formRuta.classList.remove("mapa__ruta--hecha");
    destino.focus({ preventScroll: true });
  });
  desvio.addEventListener("change", () => {
    if (ruta) formRuta.requestSubmit();
  });

  /**
   * Gasolineras a menos de `maxKm` (en línea recta) de la ruta, con su distancia a la carretera y el punto
   * kilométrico donde quedan. Proyección plana alrededor de la latitud media (sobra para unos pocos km) y una
   * rejilla de tramos para no comparar cada gasolinera con todos los puntos de la ruta.
   */
  function corredor(coords: [number, number][], maxKm: number, totalKm: number) {
    const lat0 = ((coords.reduce((s, c) => s + c[1], 0) / coords.length) * Math.PI) / 180;
    const kx = 111.32 * Math.cos(lat0);
    const ky = 110.574;
    const P = coords.map(([lo, la]) => [lo * kx, la * ky]);
    const acum = [0];
    for (let s = 1; s < P.length; s++) acum.push(acum[s - 1] + Math.hypot(P[s][0] - P[s - 1][0], P[s][1] - P[s - 1][1]));
    const escalaKm = acum[acum.length - 1] ? totalKm / acum[acum.length - 1] : 1;
    const celda = Math.max(5, maxKm * 2);
    const rejilla = new Map<string, number[]>();
    for (let s = 0; s < P.length - 1; s++) {
      const [x1, y1] = P[s];
      const [x2, y2] = P[s + 1];
      for (let cx = Math.floor((Math.min(x1, x2) - maxKm) / celda); cx <= Math.floor((Math.max(x1, x2) + maxKm) / celda); cx++)
        for (let cy = Math.floor((Math.min(y1, y2) - maxKm) / celda); cy <= Math.floor((Math.max(y1, y2) + maxKm) / celda); cy++) {
          const k = `${cx},${cy}`;
          const l = rejilla.get(k);
          if (l) l.push(s);
          else rejilla.set(k, [s]);
        }
    }
    const en = new Map<number, { d: number; km: number }>();
    datos!.e.forEach((f, i) => {
      const x = f[1] * kx;
      const y = f[0] * ky;
      const tramos = rejilla.get(`${Math.floor(x / celda)},${Math.floor(y / celda)}`);
      if (!tramos) return;
      let mejor = Infinity;
      let pk = 0;
      for (const s of tramos) {
        const [x1, y1] = P[s];
        const dx = P[s + 1][0] - x1;
        const dy = P[s + 1][1] - y1;
        const l2 = dx * dx + dy * dy;
        const t = l2 ? Math.min(1, Math.max(0, ((x - x1) * dx + (y - y1) * dy) / l2)) : 0;
        const dist = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
        if (dist < mejor) {
          mejor = dist;
          pk = acum[s] + t * Math.sqrt(l2);
        }
      }
      if (mejor <= maxKm) en.set(i, { d: mejor, km: pk * escalaKm });
    });
    return en;
  }

  // ---------------- Pantalla completa (modo aplicación) ----------------

  function entrarApp() {
    if (raiz.classList.contains("mapa--app")) return;
    raiz.classList.add("mapa--app");
    document.documentElement.classList.add("mapa-abierto");
    mapa.cooperativeGestures.disable();
    history.pushState({ mapaApp: true }, "");
    requestAnimationFrame(() => mapa.resize());
  }

  function salirApp(desdeHistorial = false) {
    if (!raiz.classList.contains("mapa--app")) return;
    raiz.classList.remove("mapa--app", "mapa--plegado");
    document.documentElement.classList.remove("mapa-abierto");
    mapa.cooperativeGestures.enable();
    if (!desdeHistorial && history.state?.mapaApp) history.back();
    requestAnimationFrame(() => mapa.resize());
  }

  window.addEventListener("popstate", () => salirApp(true));
  $<HTMLButtonElement>("[data-salir]").addEventListener("click", () => salirApp());
  $<HTMLButtonElement>("[data-abrir-app]").addEventListener("click", () => entrarApp());
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && raiz.classList.contains("mapa--app") && !(ev.target instanceof HTMLInputElement)) salirApp();
  });
}
