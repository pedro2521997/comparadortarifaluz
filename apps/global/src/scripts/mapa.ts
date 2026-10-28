// Mapa de gasolineras en el navegador (MapLibre + teselas de OpenFreeMap, gratis y sin clave). Carga el JSON del
// país, pinta cada gasolinera con un color según su precio (verde barato, rojo caro), y añade buscador de
// localidades y direcciones, «cerca de mí» y la lista de las más baratas de lo que se ve en el mapa.

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Fila = [number, number, string, string, string, string, (number | null)[], string, 0 | 1];
interface Datos { combustibles: string[]; e: Fila[] }
interface Config {
  datos: string;
  cc: string;
  locale: string;
  limites: [number, number, number, number];
  inicial: string;
  combustibles: Record<string, string>;
  t: {
    vacio: string; ruta: string; precioDel: string; autopista: string; sinDatos: string; sinUbicacion: string;
    estacion: string; lugares: string; estaciones: [string, string]; nada: string; gestos: [string, string, string];
  };
}

const raiz = document.querySelector<HTMLElement>("[data-mapa]");
const cfgEl = document.getElementById("mapa-config");
if (raiz && cfgEl) iniciar(raiz, JSON.parse(cfgEl.textContent ?? "{}") as Config);

function iniciar(raiz: HTMLElement, cfg: Config) {
  const $ = <T extends HTMLElement>(sel: string) => raiz.querySelector<T>(sel)!;
  const lienzo = $<HTMLDivElement>("[data-lienzo]");
  const estado = $<HTMLParagraphElement>("[data-estado]");
  const lista = $<HTMLOListElement>("[data-lista]");
  const buscar = $<HTMLInputElement>("[data-buscar]");
  const resultados = $<HTMLUListElement>("[data-resultados]");
  const leyenda = $<HTMLDivElement>("[data-leyenda]");
  const T = cfg.t;

  const nf = new Intl.NumberFormat(cfg.locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const nf0 = new Intl.NumberFormat(cfg.locale);
  const euros = (x: number) => `${nf.format(x)} €`;
  const fechaCorta = new Intl.DateTimeFormat(cfg.locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const nEst = (n: number) => (n === 1 ? T.estaciones[0] : T.estaciones[1].replace("{n}", nf0.format(n)));

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
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  mapa.addControl(new maplibregl.FullscreenControl(), "top-right");

  let datos: Datos | null = null;
  /** Gasolineras que venden el carburante elegido, con su precio. */
  let visibles: { i: number; p: number }[] = [];
  let popup: maplibregl.Popup | null = null;
  let yo: maplibregl.Marker | null = null;

  const cargaDatos = fetch(cfg.datos).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<Datos>;
  });
  const cargaMapa = new Promise<void>((ok) => mapa.on("load", () => ok()));

  Promise.all([cargaDatos, cargaMapa])
    .then(([d]) => {
      datos = d;
      estado.hidden = true;
      prepararCapas();
      pintar();
      indexar();
      desdeUrl();
    })
    .catch(() => {
      estado.textContent = T.sinDatos;
      estado.hidden = false;
    });

  function prepararCapas() {
    // Nombres de países y ciudades en el idioma de la página («Spanien», «Espagne»…), si el mapa los tiene.
    const lang = cfg.locale.slice(0, 2);
    for (const capa of mapa.getStyle().layers) {
      if (capa.type !== "symbol") continue;
      const campo = JSON.stringify(mapa.getLayoutProperty(capa.id, "text-field") ?? "");
      if (campo.includes("name") && !/ref|housenumber/.test(campo)) mapa.setLayoutProperty(capa.id, "text-field", ["coalesce", ["get", `name:${lang}`], ["get", "name"]]);
    }
    mapa.addSource("gasolineras", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    mapa.addLayer({
      id: "gasolineras",
      type: "circle",
      source: "gasolineras",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 2.5, 8, 4, 12, 7, 15, 9],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 4, 0.3, 10, 1, 14, 1.5],
        "circle-color": "#888888",
      },
      layout: { "circle-sort-key": ["-", 0, ["get", "p"]] },
    });
    mapa.addLayer({
      id: "precios",
      type: "symbol",
      source: "gasolineras",
      minzoom: 11.5,
      layout: {
        "text-field": ["get", "t"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-offset": [0, -1.35],
        "symbol-sort-key": ["get", "p"],
      },
      paint: { "text-color": "#1d2b25", "text-halo-color": "#ffffff", "text-halo-width": 1.6 },
    });
    mapa.addLayer({
      id: "elegida",
      type: "circle",
      source: "gasolineras",
      filter: ["==", ["get", "i"], -1],
      paint: { "circle-radius": 12, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#104336", "circle-stroke-width": 3 },
    });
    mapa.on("click", "gasolineras", (ev) => {
      const f = ev.features?.[0];
      if (f) abrir(Number(f.properties.i));
    });
    mapa.on("mouseenter", "gasolineras", () => (mapa.getCanvas().style.cursor = "pointer"));
    mapa.on("mouseleave", "gasolineras", () => (mapa.getCanvas().style.cursor = ""));
    mapa.on("moveend", listar);
  }

  /** Vuelve a pintar las gasolineras con el carburante elegido y recalcula colores y leyenda. */
  function pintar() {
    if (!datos) return;
    const k = datos.combustibles.indexOf(comb);
    visibles = [];
    datos.e.forEach((f, i) => {
      const p = f[6][k];
      if (p != null) visibles.push({ i, p });
    });
    const orden = visibles.map((v) => v.p).sort((a, b) => a - b);
    const q = (x: number) => orden[Math.min(orden.length - 1, Math.floor(x * orden.length))] ?? 0;
    const q10 = q(0.1);
    const q50 = Math.max(q(0.5), q10 + 0.001);
    const q90 = Math.max(q(0.9), q50 + 0.001);
    const fuente = mapa.getSource("gasolineras") as maplibregl.GeoJSONSource;
    fuente.setData({
      type: "FeatureCollection",
      features: visibles.map(({ i, p }) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [datos!.e[i][1], datos!.e[i][0]] },
        properties: { i, p, t: nf.format(p) },
      })),
    });
    mapa.setPaintProperty("gasolineras", "circle-color", ["interpolate", ["linear"], ["get", "p"], q10, "#1a9850", q50, "#f2c94c", q90, "#d73027"]);
    leyenda.querySelector("[data-min]")!.textContent = euros(q10);
    leyenda.querySelector("[data-max]")!.textContent = euros(q90);
    leyenda.hidden = !visibles.length;
    raiz.querySelectorAll<HTMLButtonElement>("[data-comb]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.comb === comb)));
    if (popup) popup.remove();
    listar();
  }

  /** Las 10 más baratas de lo que se ve en el mapa. */
  function listar() {
    if (!datos) return;
    const b = mapa.getBounds();
    const dentro = visibles.filter(({ i }) => b.contains([datos!.e[i][1], datos!.e[i][0]])).sort((a, c) => a.p - c.p).slice(0, 10);
    lista.replaceChildren(
      ...(dentro.length
        ? dentro.map(({ i, p }) => {
            const f = datos!.e[i];
            const li = document.createElement("li");
            const btn = document.createElement("button");
            btn.type = "button";
            btn.innerHTML = `<span class="precio">${esc(euros(p))}</span><span>${esc(f[2] || f[3] || T.estacion)}</span><span class="donde">${esc([f[2] ? f[3] : "", f[4]].filter(Boolean).join(", "))}</span>`;
            btn.addEventListener("click", () => {
              mapa.flyTo({ center: [f[1], f[0]], zoom: Math.max(mapa.getZoom(), 14) });
              abrir(i);
            });
            li.append(btn);
            return li;
          })
        : [Object.assign(document.createElement("li"), { className: "vacio", textContent: T.vacio })]),
    );
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
    const pie = [fecha, f[8] ? T.autopista : ""].filter(Boolean).join(" · ");
    const html = `<strong>${esc(f[2] || T.estacion)}</strong><br>${esc(f[3])}<br>${esc([f[5], f[4]].filter(Boolean).join(" "))}
      <ul class="popup__precios">${precios}</ul>
      <div class="popup__pie">${esc(pie)}</div>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${f[0]},${f[1]}" target="_blank" rel="noopener">${esc(T.ruta)} →</a>`;
    if (popup) popup.remove();
    popup = new maplibregl.Popup({ offset: 10, maxWidth: "280px" }).setLngLat([f[1], f[0]]).setHTML(html).addTo(mapa);
    mapa.setFilter("elegida", ["==", ["get", "i"], i]);
    popup.on("close", () => mapa.setFilter("elegida", ["==", ["get", "i"], -1]));
  }

  /** ?b=oeste,sur,este,norte encuadra una zona (enlaces desde provincias y municipios); ?q= busca un sitio. */
  function desdeUrl() {
    const u = new URLSearchParams(location.search);
    const b = (u.get("b") ?? "").split(",").map(Number);
    if (b.length === 4 && b.every(Number.isFinite)) {
      mapa.fitBounds([b[0], b[1], b[2], b[3]], { padding: 40, maxZoom: 14, duration: 0 });
      return;
    }
    const q = u.get("q");
    if (q) {
      buscar.value = q;
      proponer();
      const k = opciones.findIndex((o) => o.tipo === "lugar");
      if (k >= 0) elegir(k, false);
      else cerrar();
    }
  }

  // ---------------- Carburante ----------------

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

  // ---------------- Cerca de mí ----------------

  $<HTMLButtonElement>("[data-cerca]").addEventListener("click", () => {
    if (!navigator.geolocation) return aviso(T.sinUbicacion);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        yo?.remove();
        yo = new maplibregl.Marker({ color: "#2f6fde" }).setLngLat(c).addTo(mapa);
        mapa.flyTo({ center: c, zoom: 12 });
      },
      () => aviso(T.sinUbicacion),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });

  function aviso(texto: string) {
    estado.textContent = texto;
    estado.hidden = false;
    setTimeout(() => (estado.hidden = true), 4000);
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

  type Opcion = { tipo: "lugar"; l: Lugar } | { tipo: "estacion"; i: number };
  let opciones: Opcion[] = [];
  let activa = -1;

  function proponer() {
    const q = norm(buscar.value);
    opciones = [];
    activa = -1;
    if (q.length < 2 || !datos) return cerrar();
    const porLugar = lugares
      .map((l) => ({ l, r: l.clave === q ? 0 : l.clave.startsWith(q) ? 1 : [...l.cp].some((c) => norm(c).startsWith(q)) ? 1 : ` ${l.clave}`.includes(` ${q}`) ? 2 : 9 }))
      .filter((x) => x.r < 9)
      .sort((a, b) => a.r - b.r || b.l.n - a.l.n)
      .slice(0, 6);
    opciones.push(...porLugar.map((x) => ({ tipo: "lugar" as const, l: x.l })));
    const palabras = q.split(" ");
    const porEstacion: number[] = [];
    for (let i = 0; i < claves.length && porEstacion.length < 5; i++) if (palabras.every((w) => claves[i].includes(w))) porEstacion.push(i);
    opciones.push(...porEstacion.map((i) => ({ tipo: "estacion" as const, i })));
    pintarOpciones();
  }

  function pintarOpciones() {
    const items: HTMLLIElement[] = [];
    let ultimoTipo = "";
    opciones.forEach((o, k) => {
      if (o.tipo !== ultimoTipo) {
        ultimoTipo = o.tipo;
        const cab = document.createElement("li");
        cab.className = "cab";
        cab.setAttribute("role", "presentation");
        cab.textContent = o.tipo === "lugar" ? T.lugares : T.estacion;
        items.push(cab);
      }
      const li = document.createElement("li");
      li.id = `mapa-op-${k}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(k === activa));
      if (o.tipo === "lugar") li.innerHTML = `<span>${esc(o.l.nombre)}</span><small>${esc(nEst(o.l.n))}</small>`;
      else {
        const f = datos!.e[o.i];
        li.innerHTML = `<span>${esc([f[2], f[3]].filter(Boolean).join(", "))}</span><small>${esc(f[4])}</small>`;
      }
      li.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        elegir(k);
      });
      items.push(li);
    });
    if (!opciones.length) items.push(Object.assign(document.createElement("li"), { className: "cab", textContent: T.nada }));
    resultados.replaceChildren(...items);
    resultados.hidden = false;
    buscar.setAttribute("aria-expanded", "true");
    buscar.setAttribute("aria-activedescendant", activa >= 0 ? `mapa-op-${activa}` : "");
  }

  function cerrar() {
    resultados.hidden = true;
    buscar.setAttribute("aria-expanded", "false");
  }

  function elegir(k: number, desplazar = true) {
    const o = opciones[k];
    if (!o) return;
    cerrar();
    if (o.tipo === "lugar") {
      buscar.value = o.l.nombre;
      const [a, b, c, d] = o.l.b;
      mapa.fitBounds([a, b, c, d], { padding: 40, maxZoom: 13.5 });
    } else {
      const f = datos!.e[o.i];
      buscar.value = [f[3], f[4]].filter(Boolean).join(", ");
      mapa.flyTo({ center: [f[1], f[0]], zoom: 15 });
      const k2 = datos!.combustibles.indexOf(comb);
      if (f[6][k2] == null) {
        // Si no vende el carburante elegido, se cambia a uno que sí venda para poder enseñarla.
        const otro = datos!.combustibles.find((c, j) => f[6][j] != null && cfg.combustibles[c]);
        if (otro) {
          comb = otro;
          pintar();
        }
      }
      abrir(o.i);
    }
    if (desplazar) raiz.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  let espera: number | undefined;
  buscar.addEventListener("input", () => {
    clearTimeout(espera);
    espera = window.setTimeout(proponer, 120);
  });
  buscar.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      if (!opciones.length) return;
      ev.preventDefault();
      activa = (activa + (ev.key === "ArrowDown" ? 1 : -1) + opciones.length) % opciones.length;
      pintarOpciones();
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      if (!opciones.length) proponer();
      elegir(activa >= 0 ? activa : 0);
    } else if (ev.key === "Escape") cerrar();
  });
  buscar.addEventListener("blur", () => setTimeout(cerrar, 150));
}
