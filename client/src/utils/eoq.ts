// client/src/utils/eoq.ts
export function calculateEOQBasico(
  demandaAnual: number,
  costoOrdenar: number,
  costoMantener: number
) {
  const qOptima = Math.sqrt((2 * demandaAnual * costoOrdenar) / costoMantener);
  const tiempoCiclo = (qOptima / demandaAnual) * 365;
  const costoTotalUnidadTiempo =
    (demandaAnual * costoOrdenar) / qOptima + (costoMantener * qOptima) / 2;
  const costoTotalCiclo = (costoTotalUnidadTiempo * qOptima) / demandaAnual;
  return { qOptima, tiempoCiclo, costoTotalUnidadTiempo, costoTotalCiclo };
}

export function calculateEOQFaltantes(
  demandaAnual: number,
  costoOrdenar: number,
  costoMantener: number,
  costoFaltante: number
) {
  const qOptima = Math.sqrt(
    (2 * demandaAnual * costoOrdenar) / costoMantener *
      ((costoMantener + costoFaltante) / costoFaltante)
  );
  const nivelMaxInventario = Math.sqrt(
    (2 * demandaAnual * costoOrdenar) / costoMantener *
      (costoFaltante / (costoMantener + costoFaltante))
  );
  const faltanteMaximo = qOptima - nivelMaxInventario;
  const costoTotalUnidadTiempo =
    (demandaAnual * costoOrdenar) / qOptima +
    (costoMantener * nivelMaxInventario ** 2) / (2 * qOptima) +
    (costoFaltante * faltanteMaximo ** 2) / (2 * qOptima);
  const costoTotalCiclo = (costoTotalUnidadTiempo * qOptima) / demandaAnual;
  const fraccionTiempoSinFaltantes = nivelMaxInventario / qOptima;
  return {
    qOptima,
    nivelMaxInventario,
    faltanteMaximo,
    costoTotalUnidadTiempo,
    costoTotalCiclo,
    fraccionTiempoSinFaltantes,
  };
  
}
