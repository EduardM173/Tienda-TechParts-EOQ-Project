// src/pages/DashboardDetail.tsx
import React, { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi, getProducto } from "../hooks/useApi";
import { calculateEOQBasico } from "../utils/eoq";
import Chart from "chart.js/auto";

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

const DashboardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: producto, loading } = useApi<Producto>(
    () => getProducto(Number(id)),
    [id]
  );
  const navigate = useNavigate();

  const costRef  = useRef<HTMLCanvasElement | null>(null);
  const cycleRef = useRef<HTMLCanvasElement | null>(null);
  const costChart  = useRef<Chart>();
  const cycleChart = useRef<Chart>();

  useEffect(() => {
    if (!producto || loading) return;

    const D    = producto.demanda_anual;
    const S    = 50;
    const H    = producto.costo * 0.2;
    const { qOptima: qOpt } = calculateEOQBasico(D, S, H);

    // —– GRAFICO DE COSTES —–
    costChart.current?.destroy();
    if (costRef.current) {
      const minQ   = qOpt / 2;
      const maxQ   = qOpt * 2;
      const steps  = 60;
      const quantities = Array.from({ length: steps }, (_, i) =>
        minQ + (i / (steps - 1)) * (maxQ - minQ)
      );
      const emission = quantities.map(q => (D / q) * S);
      const holding  = quantities.map(q => (q / 2) * H);
      const total    = quantities.map((_, i) => emission[i] + holding[i]);
      const minCost  = Math.min(...total);
      const maxCost  = Math.max(...total);

      costChart.current = new Chart(
        costRef.current.getContext("2d")!,
        {
          type: "line",
          data: {
            datasets: [
              { label: "Costo de Emisión",        data: quantities.map((q,i)=>({x:q,y:emission[i]})),      borderColor:"#fbc02d", pointRadius:0, tension:0.2 },
              { label: "Costo de Almacenamiento", data: quantities.map((q,i)=>({x:q,y:holding[i]})),        borderColor:"#1976d2", pointRadius:0, tension:0.2 },
              { label: "Costo Total",             data: quantities.map((q,i)=>({x:q,y:total[i]})),          borderColor:"#d32f2f", pointRadius:0, tension:0.2 },
              { label: "Costo Mínimo",            data:[{x:minQ,y:minCost},{x:maxQ,y:minCost}],            borderColor:"gray",    borderDash:[6,4], pointRadius:0 },
              { label: "EOQ (Q*)",                data:[{x:qOpt,y:0},{x:qOpt,y:maxCost}],                 borderColor:"gray",    borderDash:[6,4], pointRadius:0 },
              { label: "Punto EOQ",               data:[{x:qOpt,y:(D/qOpt)*S + (qOpt/2)*H}],               backgroundColor:"green", pointRadius:8, showLine:false }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend:{ position:"bottom" }, tooltip:{ mode:"index", intersect:false } },
            scales: {
              x: { type:"linear", title:{ display:true, text:"Tamaño del Lote (u/Pedido)" } },
              y: { title:{ display:true, text:"Costo Anual (TRC)" } }
            }
          }
        }
      );
    }

    // —– GRAFICO DE CICLO DE INVENTARIO —–
    // —– GRAFICO DE CICLO DE INVENTARIO —–
cycleChart.current?.destroy();
if (cycleRef.current) {
  const cycles = 3;            // cuántos triángulos mostrar
  const Tdays  = (qOpt / D) * 365;   // duración de un ciclo en días
  const data: { x: number; y: number }[] = [];

  for (let c = 0; c < cycles; c++) {
    const t0 = c * Tdays;         // inicio del ciclo c
    const t1 = (c + 1) * Tdays;   // fin del ciclo c (= inicio del siguiente)

    /*  descenso Q* → 0  */
    data.push({ x: t0, y: qOpt });
    data.push({ x: t1, y: 0   });

    /*  salto vertical instantáneo  */
    data.push({ x: t1, y: qOpt });
  }

  cycleChart.current = new Chart(
    cycleRef.current.getContext("2d")!,
    {
      type: "line",
      data: {
        datasets: [
          {
            label: "Inventario vs Tiempo",
            data,
            borderColor: "#26c6da",
            fill: false,
            tension: 0,
            pointRadius: 0,
          },
          {
            label: "Inventario Promedio (Q/2)",
            data: [
              { x: 0,            y: qOpt / 2 },
              { x: cycles*Tdays, y: qOpt / 2 }
            ],
            borderColor: "#ef5350",
            borderDash: [4,4],
            pointRadius: 0,
            tension: 0,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "Tiempo (días)" },
            min: 0,
            max: cycles * Tdays,
            ticks: {
              callback: v => Number(v).toFixed(0)   // quita decimales del eje
            }
          },
          y: {
            title: { display: true, text: "Nivel de Inventario (unidades)" },
            min: 0,
            max: qOpt * 1.1
          }
        }
      }
    }
  );
}



    return () => {
      costChart.current?.destroy();
      cycleChart.current?.destroy();
    };
  }, [producto, loading]);

  if (loading) return <p>Cargando detalle…</p>;
  if (!producto) return <p>Producto no encontrado</p>;

  return (
    <main className="main-content">
      <button className="btn btn-link mb-3" onClick={()=>navigate(-1)}>
        &larr; Volver
      </button>
      <h2>Detalle: {producto.nombre}</h2>
      <p>Categoría: {producto.categoria}</p>
      <p>Stock actual: {producto.stock}</p>

      {/* Costes */}
      <div className="card mb-4 w-100" style={{ height: 400 }}>
        <div className="card-header">Curvas de Costo vs Cantidad</div>
        <div className="card-body" style={{ position:"relative", height:"340px" }}>
          <canvas ref={costRef}/>
        </div>
      </div>

      {/* Ciclo de inventario */}
      <div className="card mb-4 w-100" style={{ height: 360 }}>
        <div className="card-header">Perfil de Inventario vs Tiempo</div>
        <div className="card-body" style={{ position:"relative", height:"300px" }}>
          <canvas ref={cycleRef}/>
        </div>
      </div>
    </main>
  );
};

export default DashboardDetail;
