// Valores regulados con fecha de vigencia (data/regulados.json).

export interface Vigencia {
  vigente_desde: string;
  vigente_hasta: string | null;
}

export interface Regulados {
  iva: (Vigencia & { valor: number })[];
  iee: (Vigencia & { valor: number; minimo_eur_mwh: number })[];
  bono_social_eur_dia: (Vigencia & { valor: number })[];
  alquiler_contador_eur_dia: (Vigencia & { valor: number })[];
  pvpc_potencia_eur_kw_dia: (Vigencia & { p1: number; p2: number })[];
  /** Peajes + cargos del término de energía 2.0TD (€/kWh) — para las tarifas indexadas */
  peajes_cargos_energia_eur_kwh?: (Vigencia & { p1: number; p2: number; p3: number })[];
  /** Coeficientes de pérdidas 2.0TD (tanto por uno) */
  perdidas_2_0td?: (Vigencia & { p1: number; p2: number; p3: number })[];
  fnee_eur_kwh?: (Vigencia & { valor: number })[];
}

/** Devuelve la entrada vigente en `fecha`. Si no hay ninguna, usa la más cercana y lo indica. */
export function vigenteEn<T extends Vigencia>(lista: T[], fecha: string): { valor: T; exacto: boolean } {
  const exacta = lista.find(
    (v) => v.vigente_desde <= fecha && (v.vigente_hasta === null || fecha <= v.vigente_hasta),
  );
  if (exacta) return { valor: exacta, exacto: true };
  const ordenadas = [...lista].sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde));
  const anterior = fecha < ordenadas[0].vigente_desde ? ordenadas[0] : ordenadas[ordenadas.length - 1];
  return { valor: anterior, exacto: false };
}
