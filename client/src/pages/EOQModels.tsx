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

const numberFmt = (n: number, dec = 0) =>
  n.toLocaleString("es-BO", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const EOQModels: React.FC = () => {
  /* ───── datos de API ───── */
  const { data: productos = [], loading } = useApi(getProductos, []);

  /* ───── estados ───── */
  const [prodId, setProdId] = useState<number | "">("");
  const [basic,    setBasic]    = useState<ReturnType<typeof calculateEOQBasico>    | null>(null);
  const [shortage, setShortage] = useState<ReturnType<typeof calculateEOQFaltantes> | null>(null);

  const [formB, setFormB] = useState({ demanda:"", ordenar:"", mantener:"" });
  const [formS, setFormS] = useState({ demanda:"", ordenar:"", mantener:"", faltante:"" });

  const [outB, setOutB] = useState<typeof basic | null>(null);
  const [outS, setOutS] = useState<typeof shortage | null>(null);

  /* ───── cambio de producto ───── */
  useEffect(() => {
    if (prodId === "") { setBasic(null); setShortage(null); return; }
    const p = productos.find(x=>x.id===prodId);
    if (!p) return;

    const DA = p.demanda_anual;
    const SO = 50;
    const HM = p.costo * 0.2;
    const CF = p.precio * 0.1;

    setBasic   (calculateEOQBasico(DA, SO, HM));
    setShortage(calculateEOQFaltantes(DA, SO, HM, CF));

    setFormB({ demanda:DA+"", ordenar:SO+"", mantener:HM.toFixed(2) });
    setFormS({ demanda:DA+"", ordenar:SO+"", mantener:HM.toFixed(2), faltante:CF.toFixed(2) });

    setOutB(null); setOutS(null);
  }, [prodId, productos]);

  /* ───── helpers ───── */
  const handleChange =
    <T extends Record<string,string>>(setState:React.Dispatch<React.SetStateAction<T>>)=>
    (e:React.ChangeEvent<HTMLInputElement>) =>
      setState(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const calcBasic=(e:React.FormEvent)=>{e.preventDefault();
    const {demanda,ordenar,mantener}=formB;
    setOutB(calculateEOQBasico(+demanda,+ordenar,+mantener));};

  const calcShortage=(e:React.FormEvent)=>{e.preventDefault();
    const {demanda,ordenar,mantener,faltante}=formS;
    setOutS(calculateEOQFaltantes(+demanda,+ordenar,+mantener,+faltante));};

  if (loading) return <p>Cargando productos…</p>;

  /* ───── métricas derivadas para mostrar ───── */
  const prod = productos.find(x=>x.id===prodId);
  const DA   = prod?.demanda_anual ?? 0;
  const ciclosB = basic    ? DA / basic.qOptima         : 0;
  const ciclosS = shortage ? DA / shortage.qOptima      : 0;
  const costoCicloB = basic    ? 50 + (prod!.costo*0.2*basic.qOptima   )/2 : 0;
  const costoCicloS = shortage ? 50 + (prod!.costo*0.2*shortage.qOptima)/2 : 0;

  return (
    <main className="container-fluid p-4">
      <h1 className="h2 mb-4">Modelos EOQ</h1>

      {/* selector de producto */}
      <div className="row mb-4">
        <div className="col-md-6 col-lg-4">
          <label className="form-label fw-bold">Producto</label>
          <select className="form-select" value={prodId}
                  onChange={e=>setProdId(e.target.value===""?"":+e.target.value)}>
            <option value="">— Seleccione —</option>
            {productos.map(p=>(
              <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------- RESULTADO AUTOMÁTICO ---------- */}
      {basic && (
        <div className="row g-4 mb-4">
          {/* Básico */}
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-header bg-white"><h6 className="fw-semibold text-primary mb-0">EOQ Básico</h6></div>
              <div className="card-body">
                <ul className="list-group">
                  <li className="list-group-item">Q*: <strong>{numberFmt(basic.qOptima)}</strong> u</li>
                  <li className="list-group-item">Tiempo de ciclo: <strong>{numberFmt(basic.tiempoCiclo,2)}</strong> días</li>
                  <li className="list-group-item">Ciclos/año: <strong>{numberFmt(ciclosB,2)}</strong></li>
                  <li className="list-group-item">Costo/ciclo: <strong>BOB {numberFmt(costoCicloB,2)}</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Con faltantes */}
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-header bg-white"><h6 className="fw-semibold text-success mb-0">EOQ con Faltantes</h6></div>
              <div className="card-body">
                <ul className="list-group">
                  <li className="list-group-item">Q*: <strong>{numberFmt(shortage!.qOptima)}</strong> u</li>
                  <li className="list-group-item">Faltante máx.: <strong>{numberFmt(shortage!.faltanteMaximo)}</strong></li>
                  <li className="list-group-item">% sin faltantes: <strong>{(shortage!.fraccionTiempoSinFaltantes*100).toFixed(1)}%</strong></li>
                  <li className="list-group-item">Ciclos/año: <strong>{numberFmt(ciclosS,2)}</strong></li>
                  <li className="list-group-item">Costo/ciclo: <strong>BOB {numberFmt(costoCicloS,2)}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- CALCULADORAS MANUALES ---------- */}
      <div className="row g-4">
        {/* Calc Básico */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-white"><h5 className="mb-0"><i className="bi bi-tools me-2"/>Calculadora EOQ Básico</h5></div>
            <div className="card-body">
              <form onSubmit={calcBasic}>
                {(["demanda","ordenar","mantener"] as const).map((k,i)=>(
                  <div className="mb-3" key={k}>
                    <label className="form-label">{["Demanda anual","Costo ordenar (S)","Costo mantener (H)"][i]}</label>
                    <input name={k} type="number" step="0.01" className="form-control"
                           value={formB[k]} onChange={handleChange(setFormB)} required/>
                  </div>
                ))}
                <button className="btn btn-primary">Calcular</button>
              </form>

              {outB && (
                <ul className="list-group mt-3">
                  <li className="list-group-item">Q*: <strong>{numberFmt(outB.qOptima)}</strong></li>
                  <li className="list-group-item">Tiempo de ciclo: <strong>{numberFmt(outB.tiempoCiclo,2)}</strong> días</li>
                  <li className="list-group-item">Ciclos/año: <strong>{numberFmt(DA/outB.qOptima,2)}</strong></li>
                  <li className="list-group-item">Costo/ciclo: <strong>BOB {numberFmt(50+(prod!.costo*0.2*outB.qOptima)/2,2)}</strong></li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Calc Faltantes */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-white"><h5 className="mb-0"><i className="bi bi-tools me-2"/>Calculadora EOQ con Faltantes</h5></div>
            <div className="card-body">
              <form onSubmit={calcShortage}>
                {(["demanda","ordenar","mantener","faltante"] as const).map((k,i)=>(
                  <div className="mb-3" key={k}>
                    <label className="form-label">{["Demanda anual","Costo ordenar (S)","Costo mantener (H)","Costo faltante (P)"][i]}</label>
                    <input name={k} type="number" step="0.01" className="form-control"
                           value={formS[k]} onChange={handleChange(setFormS)} required/>
                  </div>
                ))}
                <button className="btn btn-primary">Calcular</button>
              </form>

              {outS && (
                <ul className="list-group mt-3">
                  <li className="list-group-item">Q*: <strong>{numberFmt(outS.qOptima)}</strong></li>
                  <li className="list-group-item">Nivel máx.: <strong>{numberFmt(outS.nivelMaxInventario)}</strong></li>
                  <li className="list-group-item">Faltante máx.: <strong>{numberFmt(outS.faltanteMaximo)}</strong></li>
                  <li className="list-group-item">% sin faltantes: <strong>{(outS.fraccionTiempoSinFaltantes*100).toFixed(1)}%</strong></li>
                  <li className="list-group-item">Ciclos/año: <strong>{numberFmt(DA/outS.qOptima,2)}</strong></li>
                  <li className="list-group-item">Costo/ciclo: <strong>BOB {numberFmt(50+(prod!.costo*0.2*outS.qOptima)/2,2)}</strong></li>
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
