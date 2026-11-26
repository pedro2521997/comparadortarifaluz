# Genera las ilustraciones (SVG, 960x320) de las guías por tema y de los aparatos por grupo en
# apps/web/public/ilustraciones/. Son dibujos propios con la paleta de la web: pesan poco, no tienen
# derechos de terceros y se ven igual en cualquier pantalla.
#
# Uso: python scripts/ilustraciones.py

import os

DESTINO = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "ilustraciones")

C = "#104336"   # canopy
M = "#0fff87"   # mint
ML = "#dcfde9"  # mint claro
V = "#7c18d3"   # violeta
VL = "#f1e6fb"  # violeta claro
CR = "#f3f1ec"  # crema
SG = "#afc4bf"  # salvia
PS = "#c2cec8"  # salvia pálida
HW = "#e8e7f5"  # lavanda
W = "#ffffff"
BK = "#101f1e"
AM = "#ffd166"  # sol / monedas
AMO = "#e3a800"
AZ = "#5bc0eb"  # agua
RJ = "#ff7a59"  # calor


def svg(cuerpo: str, titulo: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 320" width="960" height="320" role="img" aria-label="{titulo}">
<title>{titulo}</title>
<defs><clipPath id="r"><rect width="960" height="320" rx="24"/></clipPath></defs>
<g clip-path="url(#r)">
<rect width="960" height="320" fill="{CR}"/>
<circle cx="110" cy="40" r="120" fill="{HW}"/>
<circle cx="880" cy="300" r="140" fill="{ML}"/>
<circle cx="800" cy="50" r="10" fill="{SG}"/><circle cx="170" cy="270" r="7" fill="{SG}"/><circle cx="60" cy="200" r="5" fill="{V}" opacity=".35"/>
<rect y="272" width="960" height="48" fill="#e4ebe7"/>
{cuerpo}
</g>
</svg>
"""


def rayo(x, y, s=1.0, fill=M):
    return f'<path transform="translate({x} {y}) scale({s})" d="M13 2 4 14h7l-1 8 9-12h-7z" fill="{fill}"/>'


def sol(x, y, r=34):
    rayos = "".join(
        f'<line x1="{x}" y1="{y - r - 10}" x2="{x}" y2="{y - r - 24}" stroke="{AM}" stroke-width="6" stroke-linecap="round" transform="rotate({a} {x} {y})"/>'
        for a in range(0, 360, 45)
    )
    return f'{rayos}<circle cx="{x}" cy="{y}" r="{r}" fill="{AM}"/>'


def moneda(x, y, r=26):
    return (
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="{AM}" stroke="{AMO}" stroke-width="4"/>'
        f'<text x="{x}" y="{y + r * 0.38}" font-family="Arial, sans-serif" font-weight="700" font-size="{r * 1.1:.0f}" text-anchor="middle" fill="{AMO}">€</text>'
    )


def enchufe(x, y, fill=C):
    return (
        f'<rect x="{x}" y="{y}" width="44" height="54" rx="10" fill="{fill}"/>'
        f'<rect x="{x + 10}" y="{y - 16}" width="7" height="18" rx="2" fill="{fill}"/><rect x="{x + 27}" y="{y - 16}" width="7" height="18" rx="2" fill="{fill}"/>'
    )


def barras(x, y, alturas, ancho=16, hueco=6, colores=None):
    out = []
    for i, h in enumerate(alturas):
        col = colores[i] if colores else (M if h < 50 else SG if h < 80 else V)
        out.append(f'<rect x="{x + i * (ancho + hueco)}" y="{y - h}" width="{ancho}" height="{h}" rx="3" fill="{col}"/>')
    return "".join(out)


def planta(x, y):
    return (
        f'<rect x="{x - 16}" y="{y - 34}" width="32" height="34" rx="6" fill="{V}"/>'
        f'<path d="M{x} {y - 34} C{x - 30} {y - 60} {x - 30} {y - 90} {x - 4} {y - 96} C{x - 10} {y - 70} {x} {y - 50} {x} {y - 34}Z" fill="{C}"/>'
        f'<path d="M{x} {y - 34} C{x + 26} {y - 54} {x + 34} {y - 84} {x + 10} {y - 92} C{x + 12} {y - 66} {x + 2} {y - 50} {x} {y - 34}Z" fill="#2f7a5f"/>'
    )


ESCENAS = {}

# ---------- Guías por tema ----------

ESCENAS["tu-factura"] = ("Factura de la luz con sus partes y una lupa", f"""
{moneda(250, 230, 30)}{moneda(292, 246, 26)}{moneda(232, 186, 24)}
<rect x="360" y="34" width="250" height="250" rx="16" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="384" y="58" width="34" height="34" rx="9" fill="{C}"/>{rayo(389, 63, 1.0)}
<rect x="430" y="62" width="120" height="10" rx="5" fill="{C}"/><rect x="430" y="80" width="80" height="8" rx="4" fill="{SG}"/>
<rect x="384" y="112" width="200" height="8" rx="4" fill="{PS}"/><rect x="384" y="130" width="170" height="8" rx="4" fill="{PS}"/><rect x="384" y="148" width="185" height="8" rx="4" fill="{PS}"/>
{barras(388, 240, [40, 62, 30, 75, 50, 88], 20, 8, [ML, ML, M, V, SG, V])}
<rect x="384" y="250" width="200" height="3" fill="{PS}"/>
<circle cx="640" cy="196" r="52" fill="{ML}" opacity=".7" stroke="{C}" stroke-width="12"/>
<line x1="678" y1="236" x2="730" y2="286" stroke="{C}" stroke-width="18" stroke-linecap="round"/>
{planta(800, 272)}
""")

ESCENAS["tarifas-y-companias"] = ("Tres tarifas de luz comparadas y la más barata marcada", f"""
<rect x="240" y="90" width="150" height="180" rx="16" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="262" y="112" width="80" height="10" rx="5" fill="{SG}"/><text x="262" y="180" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="{BK}">0,18</text><rect x="262" y="206" width="104" height="8" rx="4" fill="{PS}"/><rect x="262" y="224" width="70" height="8" rx="4" fill="{PS}"/>
<rect x="410" y="50" width="160" height="220" rx="18" fill="{C}"/>
<rect x="432" y="74" width="90" height="10" rx="5" fill="{M}"/><text x="432" y="160" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="{W}">0,12</text><rect x="432" y="190" width="112" height="8" rx="4" fill="{SG}"/><rect x="432" y="208" width="80" height="8" rx="4" fill="{SG}"/>
<circle cx="560" cy="58" r="28" fill="{M}"/><path d="M546 58l10 10 18-20" fill="none" stroke="{C}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="590" y="110" width="150" height="160" rx="16" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="612" y="132" width="80" height="10" rx="5" fill="{SG}"/><text x="612" y="196" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="{BK}">0,21</text><rect x="612" y="222" width="100" height="8" rx="4" fill="{PS}"/>
{rayo(140, 150, 3.4, V)}{rayo(790, 120, 2.6, C)}
""")

ESCENAS["tu-consumo-y-el-fichero"] = ("Ordenador con la gráfica del consumo por horas y un contador digital", f"""
<rect x="300" y="50" width="330" height="200" rx="14" fill="{C}"/>
<rect x="316" y="66" width="298" height="168" rx="8" fill="{W}"/>
<polyline points="330,200 360,180 390,190 420,140 450,160 480,110 510,130 540,90 570,120 600,100" fill="none" stroke="{V}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
<polyline points="330,215 360,212 390,214 420,205 450,208 480,198 510,204 540,196 570,200 600,194" fill="none" stroke="{M}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M270 250h390l-26 26H296z" fill="{SG}"/>
<rect x="690" y="90" width="120" height="170" rx="16" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="708" y="112" width="84" height="40" rx="6" fill="{BK}"/><text x="750" y="140" font-family="Courier New, monospace" font-size="20" font-weight="700" text-anchor="middle" fill="{M}">2.481</text>
<circle cx="725" cy="184" r="9" fill="{M}"/><circle cx="750" cy="184" r="9" fill="{SG}"/><circle cx="775" cy="184" r="9" fill="{SG}"/>
<rect x="716" y="214" width="68" height="8" rx="4" fill="{PS}"/>
<rect x="150" y="110" width="100" height="126" rx="10" fill="{W}" stroke="{PS}" stroke-width="3"/><path d="M220 110v30h30" fill="{HW}" stroke="{PS}" stroke-width="3"/>
<text x="200" y="196" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="{C}">CSV</text>
<path d="M200 252v24m-12-12 12 12 12-12" fill="none" stroke="{V}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
""")

ESCENAS["ahorrar-luz"] = ("Bombilla con una hoja, hucha y monedas: ahorrar luz", f"""
<circle cx="380" cy="130" r="78" fill="{AM}" opacity=".35"/>
<path d="M380 60a62 62 0 0 0-36 112c8 6 12 15 12 24v8h48v-8c0-9 4-18 12-24a62 62 0 0 0-36-112z" fill="{W}" stroke="{C}" stroke-width="6"/>
<rect x="356" y="210" width="48" height="12" rx="4" fill="{SG}"/><rect x="360" y="226" width="40" height="12" rx="4" fill="{SG}"/>
<path d="M380 180c0-40 20-66 46-72-2 34-20 58-46 72z" fill="{M}"/><path d="M380 180c-4-28-22-44-44-46 4 26 20 40 44 46z" fill="#2f7a5f"/>
<ellipse cx="600" cy="214" rx="96" ry="64" fill="{V}"/>
<circle cx="672" cy="196" r="6" fill="{W}"/><rect x="570" y="150" width="56" height="10" rx="5" fill="{BK}"/>
<rect x="540" y="262" width="22" height="22" rx="6" fill="{V}"/><rect x="636" y="262" width="22" height="22" rx="6" fill="{V}"/>
<path d="M690 210q24 0 20 18" fill="none" stroke="{V}" stroke-width="10" stroke-linecap="round"/>
{moneda(598, 112, 26)}{moneda(800, 244, 28)}{moneda(760, 262, 22)}
{planta(190, 272)}
""")

ESCENAS["precio-y-mercado"] = ("Gráfico del precio de la luz por horas con las horas baratas y caras", f"""
<rect x="250" y="44" width="460" height="230" rx="18" fill="{W}" stroke="{PS}" stroke-width="3"/>
{barras(280, 248, [70, 62, 58, 56, 60, 72, 96, 120, 104, 84, 66, 48, 40, 44, 58, 86, 140, 168, 176, 150, 120], 16, 4,
        [M] * 6 + [SG, V, SG, SG, M, M, M, M, M, SG, V, V, V, V, SG])}
<line x1="276" y1="249" x2="690" y2="249" stroke="{PS}" stroke-width="3"/>
<circle cx="160" cy="150" r="62" fill="{W}" stroke="{C}" stroke-width="8"/>
<line x1="160" y1="150" x2="160" y2="110" stroke="{C}" stroke-width="7" stroke-linecap="round"/><line x1="160" y1="150" x2="188" y2="164" stroke="{V}" stroke-width="7" stroke-linecap="round"/><circle cx="160" cy="150" r="6" fill="{C}"/>
{rayo(760, 120, 4.2, C)}
""")

ESCENAS["placas-solares-y-baterias"] = ("Casa con placas solares en el tejado, el sol y una batería", f"""
{sol(170, 90, 40)}
<rect x="380" y="150" width="240" height="122" fill="{W}" stroke="{PS}" stroke-width="3"/>
<path d="M350 158 500 60 650 158z" fill="{C}"/>
<g transform="skewX(-22) translate(70 0)">
<rect x="404" y="90" width="44" height="26" fill="#2b4c8c" stroke="{W}" stroke-width="2"/><rect x="450" y="90" width="44" height="26" fill="#2b4c8c" stroke="{W}" stroke-width="2"/>
<rect x="404" y="118" width="44" height="26" fill="#2b4c8c" stroke="{W}" stroke-width="2"/><rect x="450" y="118" width="44" height="26" fill="#2b4c8c" stroke="{W}" stroke-width="2"/>
</g>
<rect x="420" y="196" width="50" height="76" rx="4" fill="{V}"/><rect x="520" y="190" width="64" height="48" rx="4" fill="{HW}" stroke="{PS}" stroke-width="3"/>
<rect x="700" y="150" width="90" height="122" rx="14" fill="{W}" stroke="{C}" stroke-width="5"/><rect x="730" y="138" width="30" height="14" rx="4" fill="{C}"/>
<rect x="714" y="232" width="62" height="26" rx="4" fill="{M}"/><rect x="714" y="200" width="62" height="26" rx="4" fill="{M}"/><rect x="714" y="168" width="62" height="26" rx="4" fill="{ML}"/>
<path d="M650 230h48" stroke="{C}" stroke-width="5" stroke-dasharray="8 6"/>
""")

ESCENAS["coche-electrico"] = ("Coche eléctrico cargando de noche en un cargador de pared", f"""
<circle cx="170" cy="86" r="40" fill="{AM}"/><circle cx="190" cy="74" r="38" fill="{CR}"/>
<circle cx="260" cy="60" r="4" fill="{SG}"/><circle cx="300" cy="104" r="3" fill="{SG}"/><circle cx="110" cy="150" r="3" fill="{SG}"/>
<rect x="700" y="96" width="70" height="120" rx="14" fill="{C}"/><rect x="714" y="112" width="42" height="26" rx="5" fill="{M}"/>{rayo(723, 150, 1.2, M)}
<path d="M735 216c0 50-60 40-110 26" fill="none" stroke="{BK}" stroke-width="8" stroke-linecap="round"/>
<path d="M300 236c0-30 20-44 50-48l50-44c14-12 30-18 50-18h90c20 0 36 8 48 22l40 44c40 4 60 18 60 44v14H300z" fill="{V}"/>
<path d="M430 150c10-8 20-12 34-12h44v48h-108z" fill="{HW}"/><path d="M520 138h22c14 0 24 6 32 16l26 32h-80z" fill="{HW}"/>
<circle cx="380" cy="254" r="30" fill="{BK}"/><circle cx="380" cy="254" r="12" fill="{SG}"/>
<circle cx="580" cy="254" r="30" fill="{BK}"/><circle cx="580" cy="254" r="12" fill="{SG}"/>
<rect x="612" y="214" width="20" height="12" rx="3" fill="{M}"/>
""")

ESCENAS["hogar-y-aparatos"] = ("Cocina de una casa con lavadora, nevera y horno", f"""
<rect x="200" y="60" width="130" height="212" rx="14" fill="{W}" stroke="{PS}" stroke-width="3"/><line x1="200" y1="140" x2="330" y2="140" stroke="{PS}" stroke-width="3"/>
<rect x="306" y="80" width="8" height="40" rx="4" fill="{SG}"/><rect x="306" y="160" width="8" height="50" rx="4" fill="{SG}"/>
<rect x="360" y="120" width="160" height="152" rx="14" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="376" y="134" width="50" height="10" rx="5" fill="{PS}"/><circle cx="496" cy="140" r="7" fill="{M}"/>
<circle cx="440" cy="210" r="46" fill="{HW}" stroke="{C}" stroke-width="8"/><path d="M406 214q34 22 68 0v8q-34 22-68 0z" fill="{AZ}" opacity=".7"/>
<rect x="550" y="120" width="160" height="152" rx="14" fill="{W}" stroke="{PS}" stroke-width="3"/>
<circle cx="580" cy="140" r="7" fill="{SG}"/><circle cx="604" cy="140" r="7" fill="{SG}"/><rect x="650" y="134" width="44" height="12" rx="4" fill="{BK}"/>
<rect x="570" y="162" width="120" height="90" rx="10" fill="{BK}"/><rect x="582" y="174" width="96" height="66" rx="6" fill="{RJ}" opacity=".85"/>
{planta(780, 272)}{rayo(110, 140, 3, C)}
""")

ESCENAS["contratos-y-tramites"] = ("Contrato de la luz con firma, bolígrafo y calendario", f"""
<rect x="330" y="40" width="240" height="244" rx="14" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="356" y="66" width="120" height="12" rx="6" fill="{C}"/>
<rect x="356" y="98" width="188" height="8" rx="4" fill="{PS}"/><rect x="356" y="116" width="170" height="8" rx="4" fill="{PS}"/><rect x="356" y="134" width="180" height="8" rx="4" fill="{PS}"/><rect x="356" y="152" width="140" height="8" rx="4" fill="{PS}"/>
<path d="M360 232c20-30 30 10 50-8s20-20 34 0 24 6 36-6" fill="none" stroke="{V}" stroke-width="5" stroke-linecap="round"/>
<line x1="356" y1="250" x2="540" y2="250" stroke="{SG}" stroke-width="3"/>
<g transform="rotate(38 600 170)"><rect x="586" y="80" width="26" height="150" rx="8" fill="{C}"/><path d="M586 230h26l-13 26z" fill="{AM}"/><rect x="586" y="80" width="26" height="22" rx="6" fill="{M}"/></g>
<rect x="650" y="110" width="140" height="130" rx="14" fill="{W}" stroke="{PS}" stroke-width="3"/><rect x="650" y="110" width="140" height="34" rx="14" fill="{V}"/><rect x="650" y="130" width="140" height="14" fill="{V}"/>
<text x="720" y="210" font-family="Arial, sans-serif" font-size="54" font-weight="700" text-anchor="middle" fill="{C}">14</text>
<circle cx="190" cy="150" r="56" fill="{M}"/><path d="M164 152l18 18 34-38" fill="none" stroke="{C}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
""")

ESCENAS["gas-y-otros"] = ("Llama de gas, radiador y termómetro", f"""
<path d="M300 270c-50 0-80-36-70-80 8-34 40-50 44-90 30 26 40 52 36 74 14-10 18-24 16-40 34 30 50 70 34 102-10 20-30 34-60 34z" fill="{RJ}"/>
<path d="M300 270c-24 0-38-18-32-40 4-16 20-24 22-44 16 14 20 28 18 40 8-6 10-12 10-20 14 16 20 36 12 50-6 10-14 14-30 14z" fill="{AM}"/>
<path d="M290 272c-8 0-14-8-10-16 4-6 10-10 12-18 6 8 10 16 10 22 0 8-6 12-12 12z" fill="#2b4c8c" opacity=".8"/>
<rect x="430" y="110" width="240" height="140" rx="16" fill="{W}" stroke="{PS}" stroke-width="3"/>
{"".join(f'<rect x="{450 + i * 34}" y="124" width="22" height="112" rx="10" fill="{HW}" stroke="{SG}" stroke-width="3"/>' for i in range(6))}
<rect x="452" y="250" width="12" height="22" fill="{SG}"/><rect x="636" y="250" width="12" height="22" fill="{SG}"/>
<path d="M480 96q10-14 0-28t0-28M540 96q10-14 0-28t0-28M600 96q10-14 0-28t0-28" fill="none" stroke="{RJ}" stroke-width="5" stroke-linecap="round" opacity=".6"/>
<rect x="736" y="70" width="34" height="160" rx="17" fill="{W}" stroke="{C}" stroke-width="6"/><circle cx="753" cy="236" r="28" fill="{RJ}" stroke="{C}" stroke-width="6"/><rect x="746" y="130" width="14" height="100" rx="7" fill="{RJ}"/>
""")

# ---------- Aparatos por grupo ----------

ESCENAS["clima"] = ("Aire acondicionado en la pared enfriando una habitación", f"""
<rect x="300" y="60" width="360" height="90" rx="22" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="330" y="120" width="300" height="10" rx="5" fill="{SG}"/><circle cx="620" cy="88" r="6" fill="{M}"/><rect x="330" y="82" width="80" height="10" rx="5" fill="{PS}"/>
<path d="M360 170q20 20 0 40t0 40M430 170q20 20 0 40t0 40M500 170q20 20 0 40t0 40M570 170q20 20 0 40t0 40" fill="none" stroke="{AZ}" stroke-width="6" stroke-linecap="round"/>
<g stroke="{AZ}" stroke-width="6" stroke-linecap="round"><line x1="160" y1="110" x2="160" y2="210"/><line x1="117" y1="135" x2="203" y2="185"/><line x1="117" y1="185" x2="203" y2="135"/></g>
<rect x="736" y="70" width="34" height="160" rx="17" fill="{W}" stroke="{C}" stroke-width="6"/><circle cx="753" cy="236" r="28" fill="{AZ}" stroke="{C}" stroke-width="6"/><rect x="746" y="170" width="14" height="60" rx="7" fill="{AZ}"/>
<text x="800" y="140" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="{C}">26°</text>
""")

ESCENAS["lavado"] = ("Lavadora con ropa y un cesto de la colada", f"""
<rect x="370" y="60" width="220" height="212" rx="18" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="390" y="78" width="70" height="14" rx="7" fill="{PS}"/><circle cx="540" cy="85" r="10" fill="{M}"/><circle cx="566" cy="85" r="10" fill="{SG}"/>
<circle cx="480" cy="180" r="70" fill="{HW}" stroke="{C}" stroke-width="10"/><circle cx="480" cy="180" r="50" fill="{AZ}" opacity=".35"/>
<path d="M440 196q40 26 80 0" fill="none" stroke="{V}" stroke-width="10" stroke-linecap="round"/><circle cx="460" cy="166" r="8" fill="{W}"/><circle cx="500" cy="158" r="6" fill="{W}"/>
<path d="M160 180h150l-16 92H176z" fill="{AM}" opacity=".7"/><path d="M160 180h150" stroke="{AMO}" stroke-width="6"/>
<path d="M180 180q20-40 50-20t60-10" fill="{V}"/><path d="M200 180q30-30 70-6" fill="{M}"/>
<g transform="translate(660 110)"><rect width="140" height="10" rx="5" fill="{SG}"/><path d="M20 10v40l20 12 20-12V10" fill="{M}"/><path d="M80 10v60h40V10" fill="{V}" opacity=".8"/></g>
""")

ESCENAS["cocina"] = ("Placa de cocina con una olla hirviendo y un horno", f"""
<rect x="230" y="190" width="500" height="82" rx="10" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="250" y="176" width="460" height="20" rx="8" fill="{BK}"/>
<ellipse cx="350" cy="186" rx="60" ry="7" fill="{RJ}" opacity=".8"/>
<path d="M300 110h100v70h-100z" fill="{C}"/><rect x="290" y="100" width="120" height="14" rx="7" fill="#2f7a5f"/><rect x="340" y="86" width="20" height="14" rx="5" fill="{BK}"/>
<path d="M320 80q-10-16 0-32t0-32M350 76q-10-16 0-32t0-32M380 80q-10-16 0-32t0-32" fill="none" stroke="{SG}" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="560" cy="186" rx="60" ry="7" fill="{SG}"/>
<path d="M520 160h90a20 20 0 0 1-20 20h-50a20 20 0 0 1-20-20z" fill="{V}"/><line x1="610" y1="166" x2="660" y2="160" stroke="{V}" stroke-width="8" stroke-linecap="round"/>
<rect x="290" y="210" width="380" height="52" rx="8" fill="{BK}"/><rect x="306" y="220" width="348" height="32" rx="5" fill="{RJ}" opacity=".85"/>
{planta(820, 272)}
""")

ESCENAS["ocio-y-oficina"] = ("Escritorio con monitor, ordenador, mando de consola y router", f"""
<rect x="200" y="226" width="560" height="14" rx="6" fill="{C}"/>
<rect x="320" y="60" width="280" height="160" rx="12" fill="{BK}"/><rect x="334" y="74" width="252" height="132" rx="6" fill="{HW}"/>
{barras(350, 196, [30, 50, 42, 70, 60, 90, 80], 22, 10, [M, M, SG, V, SG, V, V])}
<rect x="446" y="220" width="28" height="8" fill="{SG}"/>
<rect x="640" y="120" width="70" height="106" rx="8" fill="{W}" stroke="{PS}" stroke-width="3"/><circle cx="675" cy="150" r="8" fill="{M}"/><rect x="656" y="176" width="38" height="6" rx="3" fill="{PS}"/><rect x="656" y="190" width="38" height="6" rx="3" fill="{PS}"/>
<path d="M230 196c0-16 14-24 30-24h40c16 0 30 8 30 24l6 20c2 10-12 16-20 8l-14-14h-44l-14 14c-8 8-22 2-20-8z" fill="{V}"/>
<circle cx="258" cy="190" r="5" fill="{W}"/><circle cx="306" cy="186" r="5" fill="{M}"/><circle cx="318" cy="196" r="5" fill="{AM}"/>
<rect x="140" y="140" width="80" height="26" rx="8" fill="{W}" stroke="{PS}" stroke-width="3"/><circle cx="160" cy="153" r="4" fill="{M}"/><circle cx="174" cy="153" r="4" fill="{M}"/>
<path d="M162 124q18-18 36 0M150 112q30-30 60 0" fill="none" stroke="{C}" stroke-width="5" stroke-linecap="round"/>
""")

ESCENAS["movilidad"] = ("Patinete y bicicleta eléctricos cargando en un enchufe", f"""
<g fill="none" stroke="{C}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
<circle cx="250" cy="236" r="36"/><circle cx="420" cy="236" r="36"/><path d="M250 236l60-80h70l40 80M310 156l-20-30h-30M380 156l20-40"/></g>
<rect x="396" y="108" width="36" height="12" rx="6" fill="{C}"/><rect x="300" y="170" width="70" height="26" rx="8" fill="{M}"/>
<g fill="none" stroke="{V}" stroke-width="8" stroke-linecap="round"><path d="M560 250h150M690 250l-30-170h-26"/><circle cx="560" cy="254" r="20"/><circle cx="712" cy="254" r="20"/></g>
<rect x="590" y="232" width="80" height="14" rx="6" fill="{M}"/>
{enchufe(800, 160)}
<path d="M822 214c0 50-60 50-90 34" fill="none" stroke="{BK}" stroke-width="6" stroke-linecap="round"/>
{rayo(130, 100, 2.4, M)}
""")

ESCENAS["iluminacion"] = ("Lámparas con bombillas LED encendidas", f"""
{"".join(f'''<line x1="{x}" y1="0" x2="{x}" y2="{y}" stroke="{BK}" stroke-width="4"/>
<path d="M{x - 50} {y + 40}a50 44 0 0 1 100 0z" fill="{c}"/>
<circle cx="{x}" cy="{y + 54}" r="18" fill="{AM}"/><path d="M{x - 60} {y + 120}l40-40M{x + 60} {y + 120}l-40-40M{x} {y + 136}v-50" stroke="{AM}" stroke-width="5" stroke-linecap="round" opacity=".6"/>'''
          for x, y, c in [(300, 70, C), (480, 40, V), (660, 90, C)])}
<path d="M800 140a40 40 0 0 0-24 72c5 4 8 10 8 16v6h32v-6c0-6 3-12 8-16a40 40 0 0 0-24-72z" fill="{W}" stroke="{C}" stroke-width="5"/>
<text x="800" y="186" font-family="Arial, sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="{C}">LED</text>
<rect x="786" y="240" width="28" height="10" rx="4" fill="{SG}"/>
""")

ESCENAS["cuidado-personal"] = ("Secador de pelo y espejo de baño", f"""
<ellipse cx="300" cy="150" rx="100" ry="120" fill="{W}" stroke="{PS}" stroke-width="6"/><ellipse cx="300" cy="150" rx="80" ry="100" fill="{HW}"/>
<path d="M250 110q20-30 50-20" fill="none" stroke="{W}" stroke-width="10" stroke-linecap="round"/>
<path d="M480 120h170a50 50 0 0 1 0 100H480z" fill="{V}"/><rect x="440" y="130" width="50" height="80" rx="10" fill="#5b0fa0"/>
<rect x="600" y="210" width="44" height="80" rx="16" fill="{V}"/><circle cx="650" cy="170" r="26" fill="#5b0fa0"/><circle cx="650" cy="170" r="12" fill="{SG}"/>
<path d="M420 150h-30M420 170h-46M420 190h-30" stroke="{RJ}" stroke-width="6" stroke-linecap="round" opacity=".7"/>
<rect x="614" y="230" width="16" height="10" rx="3" fill="{M}"/>
{planta(800, 272)}
""")

ESCENAS["agua-caliente"] = ("Termo eléctrico calentando el agua de la ducha", f"""
<rect x="300" y="40" width="150" height="232" rx="70" fill="{W}" stroke="{PS}" stroke-width="4"/>
<rect x="340" y="190" width="70" height="40" rx="8" fill="{HW}"/><circle cx="360" cy="210" r="8" fill="{RJ}"/><circle cx="390" cy="210" r="8" fill="{M}"/>
<path d="M340 90q30-14 70 0" fill="none" stroke="{RJ}" stroke-width="6" stroke-linecap="round"/><path d="M340 120q30-14 70 0" fill="none" stroke="{RJ}" stroke-width="6" stroke-linecap="round" opacity=".6"/>
<path d="M450 80h150v40" fill="none" stroke="{SG}" stroke-width="12" stroke-linecap="round"/>
<path d="M560 120h80l-14 20h-52z" fill="{C}"/>
{"".join(f'<line x1="{x}" y1="152" x2="{x + d}" y2="230" stroke="{AZ}" stroke-width="5" stroke-linecap="round"/>' for x, d in [(580, -16), (596, -6), (612, 6), (628, 16)])}
<text x="200" y="170" font-family="Arial, sans-serif" font-size="40" font-weight="700" text-anchor="middle" fill="{C}">55°</text>
{rayo(176, 196, 2, M)}
""")

ESCENAS["exterior"] = ("Piscina con la depuradora y el sol", f"""
{sol(160, 90, 40)}
<rect x="300" y="190" width="420" height="90" rx="18" fill="{AZ}"/>
<path d="M320 220q30-16 60 0t60 0 60 0 60 0 60 0 60 0" fill="none" stroke="{W}" stroke-width="5" stroke-linecap="round" opacity=".8"/>
<path d="M330 250q30-16 60 0t60 0 60 0 60 0 60 0" fill="none" stroke="{W}" stroke-width="5" stroke-linecap="round" opacity=".6"/>
<path d="M640 190v-70a20 20 0 0 1 40 0" fill="none" stroke="{SG}" stroke-width="8" stroke-linecap="round"/><path d="M680 190v-70a20 20 0 0 1 40 0" fill="none" stroke="{SG}" stroke-width="8" stroke-linecap="round"/>
<rect x="770" y="190" width="90" height="70" rx="12" fill="{C}"/><circle cx="815" cy="225" r="20" fill="{M}"/><path d="M720 230h50" stroke="{SG}" stroke-width="10"/>
<rect x="780" y="168" width="70" height="22" rx="6" fill="{W}" stroke="{PS}" stroke-width="3"/><text x="815" y="185" font-family="Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="{C}">13–15 h</text>
""")


# ---------- Web global (powerpricenow.com) ----------
# Sin textos ni cifras dentro del dibujo: valen para los 11 idiomas. Los textos alternativos traducidos
# están en apps/global/src/lib/textos-visual.ts; el <title> del SVG va en inglés.

DESTINO_GLOBAL = os.path.join(os.path.dirname(__file__), "..", "apps", "global", "public", "ilustraciones")


def aerogenerador(x, y, alto=150):
    return (
        f'<path d="M{x - 5} {y}l3-{alto}h4l3 {alto}z" fill="{W}" stroke="{PS}" stroke-width="2"/>'
        f'<g transform="translate({x} {y - alto})">'
        + "".join(f'<path transform="rotate({a})" d="M-5 0Q-4-60 0-70Q4-60 5 0z" fill="{W}" stroke="{PS}" stroke-width="2"/>' for a in (0, 120, 240))
        + f'<circle r="7" fill="{C}"/></g>'
    )


def chincheta(x, y, fill):
    return f'<path d="M{x} {y}c-16-22-26-34-26-48a26 26 0 0 1 52 0c0 14-10 26-26 48z" fill="{fill}"/><circle cx="{x}" cy="{y - 48}" r="10" fill="{W}"/>'


GLOBAL = {
    "electricidad": ("Chart of the electricity price for each hour, with cheap and expensive hours", ESCENAS["precio-y-mercado"][1]),
    "coche": ("Electric car charging at night from a wall charger", ESCENAS["coche-electrico"][1]),
    "mix": ("Wind turbines, solar panels and a hydroelectric dam producing electricity", f"""
{sol(830, 80, 34)}
{aerogenerador(200, 272, 170)}{aerogenerador(300, 272, 130)}
<g transform="skewX(-18) translate(90 0)">
{"".join(f'<rect x="{390 + c * 52}" y="{196 + r * 34}" width="48" height="30" fill="#2b4c8c" stroke="{W}" stroke-width="2"/>' for c in range(3) for r in range(2))}
</g>
<rect x="440" y="264" width="8" height="10" fill="{SG}"/><rect x="560" y="264" width="8" height="10" fill="{SG}"/>
<path d="M640 272V150h150v122z" fill="{SG}"/><path d="M650 272V164h130v108z" fill="{PS}"/>
<path d="M650 272c30-30 100-30 130 0z" fill="{AZ}"/><rect x="700" y="200" width="30" height="72" fill="{AZ}" opacity=".7"/>
<path d="M590 150h60" stroke="{C}" stroke-width="4"/><path d="M590 150v-60M590 90l-20 30M590 90l20 30" stroke="{C}" stroke-width="4" fill="none"/>
{rayo(470, 70, 3.4, M)}
"""),
    "negativos": ("Sun and wind pushing the electricity price below zero", f"""
{sol(170, 90, 40)}
{aerogenerador(820, 250, 150)}
<rect x="300" y="60" width="420" height="212" rx="18" fill="{W}" stroke="{PS}" stroke-width="3"/>
<line x1="320" y1="170" x2="700" y2="170" stroke="{BK}" stroke-width="3"/>
{"".join(f'<rect x="{330 + i * 30}" y="{170 - h if h > 0 else 170}" width="20" height="{abs(h)}" rx="3" fill="{(V if h > 70 else SG) if h > 0 else M}"/>' for i, h in enumerate([60, 70, 40, 10, -30, -60, -76, -50, -20, 30, 80, 90, 64]))}
<path d="M520 120v-40m-14 14 14-14 14 14" fill="none" stroke="{C}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 520 100)"/>
"""),
    "meses": ("Calendar and line chart of the monthly average electricity price", f"""
<rect x="200" y="60" width="230" height="200" rx="16" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="200" y="60" width="230" height="44" rx="16" fill="{C}"/><rect x="200" y="86" width="230" height="18" fill="{C}"/>
<rect x="240" y="44" width="12" height="32" rx="6" fill="{SG}"/><rect x="378" y="44" width="12" height="32" rx="6" fill="{SG}"/>
{"".join(f'<rect x="{220 + c * 40}" y="{120 + r * 34}" width="30" height="24" rx="5" fill="{M if (c, r) == (2, 1) else HW}"/>' for c in range(5) for r in range(4))}
<rect x="470" y="60" width="300" height="200" rx="16" fill="{W}" stroke="{PS}" stroke-width="3"/>
<polyline points="495,200 535,170 575,185 615,120 655,140 695,95 745,110" fill="none" stroke="{V}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
{"".join(f'<circle cx="{x}" cy="{y}" r="8" fill="{W}" stroke="{V}" stroke-width="5"/>' for x, y in [(495, 200), (535, 170), (575, 185), (615, 120), (655, 140), (695, 95), (745, 110)])}
<line x1="490" y1="232" x2="750" y2="232" stroke="{PS}" stroke-width="3"/>
"""),
    "carburantes": ("Fuel pump next to a car", f"""
<rect x="250" y="70" width="120" height="202" rx="14" fill="{C}"/><rect x="268" y="90" width="84" height="54" rx="8" fill="{BK}"/>
<rect x="276" y="100" width="68" height="14" rx="3" fill="{M}"/><rect x="276" y="122" width="44" height="12" rx="3" fill="{SG}"/>
<rect x="268" y="160" width="84" height="12" rx="6" fill="#2f7a5f"/><rect x="236" y="262" width="148" height="14" rx="6" fill="{SG}"/>
<path d="M370 120h30c14 0 20 8 20 20v80c0 12 8 18 18 18" fill="none" stroke="{BK}" stroke-width="8" stroke-linecap="round"/>
<path d="M428 222l30-10 8 20-30 10z" fill="{BK}"/>
<circle cx="300" cy="216" r="22" fill="{AM}"/><path d="M300 200c-8 12-12 16-12 22a12 12 0 0 0 24 0c0-6-4-10-12-22z" fill="{RJ}"/>
<path d="M480 236c0-30 20-44 50-48l50-44c14-12 30-18 50-18h90c20 0 36 8 48 22l40 44c40 4 60 18 60 44v14H480z" fill="{V}" transform="translate(0 0) scale(.92) translate(52 22)"/>
<circle cx="580" cy="256" r="26" fill="{BK}"/><circle cx="580" cy="256" r="10" fill="{SG}"/>
<circle cx="760" cy="256" r="26" fill="{BK}"/><circle cx="760" cy="256" r="10" fill="{SG}"/>
<path d="M600 158c10-8 18-10 30-10h40v42h-96z" fill="{HW}"/><path d="M682 148h20c12 0 22 6 30 14l22 28h-72z" fill="{HW}"/>
"""),
    "mapa": ("Map with petrol stations marked", f"""
<path d="M220 70l170-30 180 40 170-30v210l-170 30-180-40-170 30z" fill="{W}" stroke="{PS}" stroke-width="3"/>
<path d="M390 40v210M570 80v210" stroke="{PS}" stroke-width="3"/>
<path d="M240 200c60-40 120 10 180-30s130-10 190-40 100-10 130-30" fill="none" stroke="{AM}" stroke-width="10" stroke-linecap="round"/>
<path d="M260 110c40 20 80-10 120 20" fill="none" stroke="{SG}" stroke-width="6" stroke-linecap="round"/>
<circle cx="680" cy="230" r="34" fill="{AZ}" opacity=".5"/>
{chincheta(330, 200, M)}{chincheta(500, 150, V)}{chincheta(640, 140, C)}{chincheta(450, 250, M)}
"""),
    "tarifa": ("Smart meter and a phone app showing a dynamic electricity tariff", f"""
<rect x="230" y="70" width="150" height="200" rx="18" fill="{W}" stroke="{PS}" stroke-width="3"/>
<rect x="252" y="96" width="106" height="48" rx="8" fill="{BK}"/><rect x="262" y="110" width="86" height="20" rx="4" fill="{M}" opacity=".9"/>
<circle cx="275" cy="176" r="10" fill="{M}"/><circle cx="305" cy="176" r="10" fill="{SG}"/><circle cx="335" cy="176" r="10" fill="{SG}"/>
<rect x="262" y="210" width="86" height="10" rx="5" fill="{PS}"/><rect x="262" y="230" width="60" height="10" rx="5" fill="{PS}"/>
<path d="M400 160q40-40 80 0" fill="none" stroke="{C}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12"/>
<rect x="500" y="40" width="140" height="240" rx="24" fill="{BK}"/><rect x="510" y="62" width="120" height="196" rx="12" fill="{W}"/>
{barras(520, 240, [40, 34, 30, 52, 90, 120, 70, 44], 10, 4, [M, M, M, SG, V, V, SG, M])}
<rect x="550" y="48" width="40" height="6" rx="3" fill="#333"/>
{rayo(700, 100, 3.6, C)}
<circle cx="770" cy="220" r="40" fill="{W}" stroke="{C}" stroke-width="7"/><line x1="770" y1="220" x2="770" y2="194" stroke="{C}" stroke-width="6" stroke-linecap="round"/><line x1="770" y1="220" x2="790" y2="230" stroke="{V}" stroke-width="6" stroke-linecap="round"/>
"""),
}


if __name__ == "__main__":
    os.makedirs(DESTINO_GLOBAL, exist_ok=True)
    for nombre, (titulo, cuerpo) in GLOBAL.items():
        with open(os.path.join(DESTINO_GLOBAL, f"{nombre}.svg"), "w", encoding="utf-8", newline="\n") as f:
            f.write(svg(cuerpo.strip(), titulo))
    print(len(GLOBAL), "ilustraciones en", os.path.normpath(DESTINO_GLOBAL))
    os.makedirs(DESTINO, exist_ok=True)
    for nombre, (titulo, cuerpo) in ESCENAS.items():
        with open(os.path.join(DESTINO, f"{nombre}.svg"), "w", encoding="utf-8", newline="\n") as f:
            f.write(svg(cuerpo.strip(), titulo))
    # Textos alternativos para la web (los mismos que el <title> de cada SVG).
    import json
    indice = os.path.join(os.path.dirname(__file__), "..", "data", "ilustraciones.json")
    with open(indice, "w", encoding="utf-8", newline="\n") as f:
        json.dump({n: t for n, (t, _) in sorted(ESCENAS.items())}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(len(ESCENAS), "ilustraciones en", os.path.normpath(DESTINO))
