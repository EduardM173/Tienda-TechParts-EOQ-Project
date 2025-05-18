import React, { useEffect, useRef, useState } from "react";
import { useApi, getProductos } from "../hooks/useApi";
import { calculateEOQBasico, calculateEOQFaltantes } from "../utils/eoq";
import MetricCard from "../components/MetricCard";
import Chart from "chart.js/auto";
import { useNavigate } from 'react-router-dom';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  demanda_anual: number;
  costo: number;
  precio: number;
}

type Filter = "all" | "low" | "critical" | "out";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, refresh } = useApi(getProductos, []);
  const productos: Producto[] = data || [];

  const [filter, setFilter] = useState<Filter>("all");
  const [ordenes, setOrdenes] = useState<Record<number, number>>({});
  const [loadingOrders, setLoadingOrders] = useState<Record<number, boolean>>({});

  const chartRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const chartInstances = useRef<Record<number, Chart>>({});

  const fechaActual = new Date().toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // 1) Filtrar usando stock real + diff optimista
  const productosFiltrados = productos.filter(p => {
    const extra = ordenes[p.id] || 0;
    const s = p.stock + extra;
    if (filter === "low")      return s > 0 && s <= p.stock_minimo;
    if (filter === "critical") return s > 0 && s <= p.stock_minimo * 0.5;
    if (filter === "out")      return s === 0;
    return true;
  });

  // 2) Renderizar “medias lunas” con stock + diff
  useEffect(() => {
    Object.values(chartInstances.current).forEach(c => c.destroy());
    chartInstances.current = {};

    productosFiltrados.forEach(p => {
      const canvas = chartRefs.current[p.id];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const extra = ordenes[p.id] || 0;
      const stockMostrado = p.stock + extra;
      const { qOptima } = calculateEOQBasico(p.demanda_anual, 50, p.costo * 0.2);
      const porcentaje = Math.min(stockMostrado / qOptima, 1);

      chartInstances.current[p.id] = new Chart(ctx, {
        type: "doughnut",
        data: {
          datasets: [{
            data: [porcentaje, 1 - porcentaje],
            backgroundColor: ["#4fc3f7", "#e9ecef"],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: false,
          cutout: "80%",
          rotation: 180,
          circumference: 180,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
        },
      });
    });

    return () => Object.values(chartInstances.current).forEach(c => c.destroy());
  }, [productosFiltrados, ordenes]);

  if (loading) return <p>Cargando…</p>;

  // 3) Métricas recalculadas con stock optimista
  let total = productos.length;
  let enStock = 0, bajo = 0, criticos = 0, out = 0;
  productos.forEach(p => {
    const extra = ordenes[p.id] || 0;
    const s = p.stock + extra;
    if (s === 0) out++;
    else if (s <= p.stock_minimo * 0.5) criticos++;
    else if (s <= p.stock_minimo) bajo++;
    else enStock++;
  });

  // 4) Ordenar producto: leer el JSON de respuesta y aplicar diff
  const ordenarProducto = async (p: Producto) => {
    const cantidad = Math.round(
      calculateEOQBasico(p.demanda_anual, 50, p.costo * 0.2).qOptima
    );
    setLoadingOrders(lo => ({ ...lo, [p.id]: true }));

    try {
      const res = await fetch(`/api/productos/${p.id}/ordenar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'error desconocido' }));
        alert(`Error al ordenar: ${err.error}`);
      } else {
        // 1) obtenemos producto actualizado
        const updated: Producto = await res.json();
        // 2) calculamos diff frente al stock anterior
        const diff = updated.stock - p.stock;
        // 3) actualizamos optimistamente
        setOrdenes(o => ({ ...o, [p.id]: diff }));
      }
    } catch (e) {
      alert(`Error de red al ordenar: ${e}`);
    } finally {
      setLoadingOrders(lo => ({ ...lo, [p.id]: false }));
    }
  };

  return (
    <main>
      {/* ENCABEZADO Y FILTROS */}
      <div className="page-header d-flex justify-content-between align-items-center pt-3 pb-2 mb-3">
        <h1 className="h2">Panel de Control</h1>
        <div className="btn-toolbar mb-2 mb-md-0">
          <div className="btn-group me-2" role="group">
            {( ["all","low","critical","out"] as Filter[]).map((f,i) => {
              const labels = ["Todos","Bajo Stock","Críticos","Agotados"];
              return (
                <button
                  key={f}
                  className={`btn btn-sm ${filter===f?"btn-primary":"btn-outline-primary"}`}
                  onClick={()=>setFilter(f)}
                >{labels[i]}</button>
              );
            })}
          </div>
          <button className="btn btn-sm btn-primary" onClick={refresh}>
            <i className="bi bi-arrow-clockwise me-1"/> Actualizar
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="row mb-4">
        <MetricCard title="Productos Totales" value={total} icon="bi-box-seam" variant="primary" />
        <MetricCard title="En Stock" value={enStock} icon="bi-check-circle" variant="success" />
        <MetricCard title="Bajo Stock" value={bajo} icon="bi-exclamation-triangle" variant="warning" />
        <MetricCard title="Críticas" value={criticos} icon="bi-exclamation-octagon" variant="warning" />
        <MetricCard title="Agotados" value={out} icon="bi-x-circle" variant="danger" />
      </div>

      {/* TABLA DE ANÁLISIS */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">Análisis de Inventario Automático</h5>
            <p className="mb-0 text-muted">
              Los cálculos EOQ se generan automáticamente basados en los datos de cada producto
            </p>
          </div>
          <span className="badge bg-light text-dark">
            <i className="bi bi-info-circle me-1"/> {fechaActual}
          </span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>EOQ Básico</th>
                  <th>EOQ Faltantes</th>
                  <th>Estado</th>
                  <th>Gráfico</th>
                  <th>Detalle</th>
                  <th>Ordenar</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(p => {
                  const extra = ordenes[p.id] || 0;
                  const stockMostrado = p.stock + extra;
                  const eoqB = calculateEOQBasico(p.demanda_anual, 50, p.costo * 0.2);
                  const eoqS = calculateEOQFaltantes(p.demanda_anual, 50, p.costo * 0.2, p.precio * 0.1);
                  const costoCiclo = (p.demanda_anual / eoqB.qOptima) * 50 + (eoqB.qOptima / 2) * (p.costo * 0.2);

                  let label: string, color: string;
                  if      (stockMostrado === 0)                     { label="AGOTADO";    color="danger"; }
                  else if (stockMostrado <= p.stock_minimo * 0.5)    { label="CRÍTICO";    color="warning"; }
                  else if (stockMostrado <= p.stock_minimo)          { label="MONITORIZAR";color="info";    }
                  else                                              { label="NORMAL";     color="success"; }

                  const puedeOrdenar = label !== "NORMAL";
                  const isLoading    = !!loadingOrders[p.id];

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="product-name">{p.nombre}</div>
                        <small className="text-secondary">{p.categoria}</small>
                      </td>
                      <td>
                        {stockMostrado} <small className="text-secondary">/ {p.stock_minimo}</small>
                      </td>
                      <td>
                        <strong>Q*: {Math.round(eoqB.qOptima)}</strong><br/>
                        <small>C: ${costoCiclo.toFixed(2)}</small>
                      </td>
                      <td>
                        <strong>Q*: {Math.round(eoqS.qOptima)}</strong><br/>
                        <small>F: {Math.round(eoqS.faltanteMaximo)}</small>
                      </td>
                      <td>
                        <button className={`btn btn-sm btn-${color} text-white text-uppercase`}>{label}</button>
                      </td>
                      <td style={{ width:100, height:50 }}>
                        <canvas ref={el => chartRefs.current[p.id] = el} width={100} height={50}/>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/dashboard/${p.id}`)}>
                          Ver detalle
                        </button>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${puedeOrdenar ? "btn-danger" : "btn-secondary"}`}
                          disabled={!puedeOrdenar || isLoading}
                          onClick={() => ordenarProducto(p)}
                        >
                          {isLoading
                            ? <span className="spinner-border spinner-border-sm" role="status" />
                            : <i className="bi bi-cart-plus-fill" />}
                          {extra > 0 && (<span className="badge bg-light text-dark ms-1">{extra}</span>)}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
