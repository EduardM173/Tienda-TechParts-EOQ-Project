// src/pages/Reports.tsx
import React from 'react'
import {
  useApi,
  getProductos,
  getMovimientos,
  getBajoStock,
  getAgotados
} from '../hooks/useApi'
import type { Producto, Movimiento } from '../hooks/useApi'

interface Agotado extends Producto {
  ultima_entrada: string
}

export default function Reports(): JSX.Element {
  const { data: prods = [], loading: l1 } = useApi<Producto[]>(getProductos, [])
  const { data: movs = [], loading: l2 } = useApi<Movimiento[]>(getMovimientos, [])
  const { data: bajo = [], loading: l3 } = useApi<Producto[]>(getBajoStock, [])
  const { data: ag = [], loading: l4 } = useApi<Agotado[]>(getAgotados, [])

  if (l1 || l2 || l3 || l4) return <p>Cargando reportes…</p>

  return (
    <div className="fade-in">
      <div className="page-header d-flex justify-content-between align-items-center">
        <h1 className="h2">Reportes de Inventario</h1>
      </div>

      <div className="row mb-4">
        {/* Bajo Stock */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5><i className="bi bi-exclamation-triangle me-2" /> Productos Bajo Stock</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Stock Actual</th>
                      <th>Stock Mínimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bajo.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted">
                          No hay productos con bajo stock
                        </td>
                      </tr>
                    ) : (
                      bajo.map(p => (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td>{p.stock}</td>
                          <td>{p.stock_minimo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Agotados */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5><i className="bi bi-x-octagon me-2" /> Productos Agotados</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Última Compra</th>
                      <th>Días Agotado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ag.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted">
                          No hay productos agotados
                        </td>
                      </tr>
                    ) : (
                      ag.map(p => {
                        const dias = Math.floor(
                          (Date.now() - new Date(p.ultima_entrada).getTime()) /
                          (1000 * 60 * 60 * 24)
                        )
                        return (
                          <tr key={p.id}>
                            <td>{p.nombre}</td>
                            <td>{new Date(p.ultima_entrada).toLocaleDateString()}</td>
                            <td>{dias}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Movimientos */}
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5><i className="bi bi-clock-history me-2" /> Histórico de Movimientos</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  [...movs]
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map(m => {
                      const prod = prods.find(p => p.id === m.producto_id)
                      return (
                        <tr key={m.id}>
                          <td>{new Date(m.fecha).toLocaleDateString()}</td>
                          <td>{prod?.nombre ?? '–'}</td>
                          <td>
                            <span className={`badge ${m.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}`}>
                              {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                            </span>
                          </td>
                          <td>{m.cantidad}</td>
                          <td>{m.usuario}</td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
