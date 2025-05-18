// src/pages/EOQModels.tsx
import React, { useState, useEffect } from "react";
import { useApi, getProductos } from "../hooks/useApi";
import { calculateEOQBasico, calculateEOQFaltantes } from "../utils/eoq";

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  demanda_anual: number;
  costo: number;
  precio: number;
}

// formatea números con separador de miles y decimales
const numberFmt = (n: number, dec = 0) =>
  n.toLocaleString("es-BO", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

const EOQModels: React.FC = () => {
  // — datos remotos
  const { data: productos = [], loading } = useApi(getProductos, []);

  // — estado UI
  const [prodId, setProdId] = useState<number | "">("");
  const [basic, setBasic] = useState<ReturnType<typeof calculateEOQBasico> | null>(null);
  const [shortage, setShortage] = useState<ReturnType<typeof calculateEOQFaltantes> | null>(null);

  // formularios (se rellenan tras seleccionar)
  const [formB, setFormB] = useState({ demanda: "", ordenar: "", mantener: "" });
  const [formS, setFormS] = useState({ demanda: "", ordenar: "", mantener: "", faltante: "" });

  // resultados calculadora manual
  const [outB, setOutB] = useState<typeof basic | null>(null);
  const [outS, setOutS] = useState<typeof shortage | null>(null);

  // al cambiar de producto, recarga todo
  useEffect(() => {
    if (prodId === "") {
      setBasic(null);
      setShortage(null);
      return;
    }
    const p = productos.find((x) => x.id === prodId);
    if (!p) return;

    const DA = p.demanda_anual;
    const SO = 50;          // costo ordenar fijo
    const HM = p.costo * 0.2;
    const CF = p.precio * 0.1;

    // resultados automáticos
    const b = calculateEOQBasico(DA, SO, HM);
    const s = calculateEOQFaltantes(DA, SO, HM, CF);
    setBasic(b);
    setShortage(s);

    // precarga formularios
    setFormB({
      demanda: DA.toString(),
      ordenar: SO.toString(),
      mantener: HM.toFixed(2),
    });
    setFormS({
      demanda: DA.toString(),
      ordenar: SO.toString(),
      mantener: HM.toFixed(2),
      faltante: CF.toFixed(2),
    });

    // limpia resultados manuales
    setOutB(null);
    setOutS(null);
  }, [prodId, productos]);

  // handler genérico para inputs
  const handleChange =
    <T extends Record<string, string>>(setState: React.Dispatch<React.SetStateAction<T>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setState((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const calcBasic = (e: React.FormEvent) => {
    e.preventDefault();
    const { demanda, ordenar, mantener } = formB;
    setOutB(calculateEOQBasico(+demanda, +ordenar, +mantener));
  };
  const calcShortage = (e: React.FormEvent) => {
    e.preventDefault();
    const { demanda, ordenar, mantener, faltante } = formS;
    setOutS(calculateEOQFaltantes(+demanda, +ordenar, +mantener, +faltante));
  };

  if (loading) return <p>Cargando productos…</p>;

  // valores derivados para mostrar
  const p = productos.find((x) => x.id === prodId);
  const DA = p?.demanda_anual || 0;
  // ciclos por año y costo por ciclo para básico
  const ciclosB = basic ? DA / basic.qOptima : 0;
  const costoCicloB = basic ? 50 + (p!.costo * 0.2 * basic.qOptima) / 2 : 0;
  // ciclos por año y costo por ciclo para con faltantes
  const ciclosS = shortage ? DA / shortage.qOptima : 0;
  const costoCicloS = shortage ? 50 + (p!.costo * 0.2 * shortage.qOptima) / 2 : 0;

  return (
    <main className="container-fluid p-4">
      <div className="page-header mb-4">
        <h1 className="h2">Modelos EOQ</h1>
      </div>

      {/* Selector de producto */}
      <div className="row mb-4">
        <div className="col-md-6 col-lg-4">
          <label className="form-label fw-bold">Producto</label>
          <select
            className="form-select"
            value={prodId}
            onChange={(e) => setProdId(e.target.value === "" ? "" : +e.target.value)}
          >
            <option value="">— Seleccione —</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.categoria})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resultado automático */}
      {basic && (
        <div className="row mb-4">
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-lightning-charge me-2" /> Resultado automático
                </h5>
              </div>
              <div className="card-body">
                <h6 className="fw-semibold text-primary">EOQ Básico</h6>
                <ul className="list-group mb-3">
                  <li className="list-group-item">
                    Q*: <strong>{numberFmt(basic.qOptima)}</strong> unidades
                  </li>
                  <li className="list-group-item">
                    Tiempo de ciclo: <strong>{numberFmt(basic.tiempoCiclo, 2)}</strong> dias
                  </li>
                  <li className="list-group-item">
                    Ciclos/año: <strong>{numberFmt(ciclosB, 2)}</strong>
                  </li>
                  <li className="list-group-item">
                    Costo/ciclo: <strong>BOB {numberFmt(costoCicloB, 2)}</strong>
                  </li>
                </ul>

                <h6 className="fw-semibold text-success">EOQ con Faltantes</h6>
                <ul className="list-group">
                  <li className="list-group-item">
                    Q*: <strong>{numberFmt(shortage!.qOptima)}</strong> unidades
                  </li>
                  <li className="list-group-item">
                    Faltante máx.: <strong>{numberFmt(shortage!.faltanteMaximo)}</strong>
                  </li>
                  <li className="list-group-item">
                    % sin faltantes:{" "}
                    <strong>{(shortage!.fraccionTiempoSinFaltantes * 100).toFixed(1)}%</strong>
                  </li>
                  <li className="list-group-item">
                    Ciclos/año: <strong>{numberFmt(ciclosS, 2)}</strong>
                  </li>
                  <li className="list-group-item">
                    Costo/ciclo: <strong>BOB {numberFmt(costoCicloS, 2)}</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculadoras manuales */}
      <div className="row">
        {/* EOQ Básico */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header bg-white">
              <h5>
                <i className="bi bi-tools me-2" /> Calculadora EOQ Básico
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={calcBasic}>
                {(["demanda", "ordenar", "mantener"] as const).map((k, i) => (
                  <div className="mb-3" key={k}>
                    <label className="form-label">
                      {["Demanda anual", "Costo ordenar (S)", "Costo mantener (H)"][i]}
                    </label>
                    <input
                      name={k}
                      type="number"
                      className="form-control"
                      step="0.01"
                      required
                      value={formB[k]}
                      onChange={handleChange(setFormB)}
                    />
                  </div>
                ))}
                <button className="btn btn-primary">Calcular</button>
              </form>
              {outB && (
                <ul className="list-group mt-3">
                  <li className="list-group-item">
                    Q*: <strong>{numberFmt(outB.qOptima)}</strong>
                  </li>
                  <li className="list-group-item">
                    Tiempo de ciclo: <strong>{numberFmt(outB.tiempoCiclo, 2)}</strong> dias
                  </li>
                  <li className="list-group-item">
                    Ciclos/año: <strong>{numberFmt(DA / outB.qOptima, 2)}</strong>
                  </li>
                  <li className="list-group-item">
                    Costo/ciclo: <strong>BOB {numberFmt(50 + (p!.costo * 0.2 * outB.qOptima) / 2, 2)}</strong>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* EOQ con Faltantes */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header bg-white">
              <h5>
                <i className="bi bi-tools me-2" /> Calculadora EOQ con Faltantes
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={calcShortage}>
                {(
                  ["demanda", "ordenar", "mantener", "faltante"] as const
                ).map((k, i) => (
                  <div className="mb-3" key={k}>
                    <label className="form-label">
                      {[
                        "Demanda anual",
                        "Costo ordenar (S)",
                        "Costo mantener (H)",
                        "Costo faltante (P)",
                      ][i]}
                    </label>
                    <input
                      name={k}
                      type="number"
                      className="form-control"
                      step="0.01"
                      required
                      value={formS[k]}
                      onChange={handleChange(setFormS)}
                    />
                  </div>
                ))}
                <button className="btn btn-primary">Calcular</button>
              </form>
              {outS && (
                <ul className="list-group mt-3">
                  <li className="list-group-item">
                    Q*: <strong>{numberFmt(outS.qOptima)}</strong>
                  </li>
                  <li className="list-group-item">
                    Nivel máx.: <strong>{numberFmt(outS.nivelMaxInventario)}</strong>
                  </li>
                  <li className="list-group-item">
                    Faltante máx.: <strong>{numberFmt(outS.faltanteMaximo)}</strong>
                  </li>
                  <li className="list-group-item">
                    % sin faltantes:{" "}
                    <strong>{(outS.fraccionTiempoSinFaltantes * 100).toFixed(1)}%</strong>
                  </li>
                  <li className="list-group-item">
                    Ciclos/año: <strong>{numberFmt(DA / outS.qOptima, 2)}</strong>
                  </li>
                  <li className="list-group-item">
                    Costo/ciclo:{" "}
                    <strong>BOB {numberFmt(50 + (p!.costo * 0.2 * outS.qOptima) / 2, 2)}</strong>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EOQModels;
