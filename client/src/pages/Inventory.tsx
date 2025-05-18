// src/pages/Inventory.tsx
import React, { useState } from 'react'
// Importamos sólo los valores reales (hooks y funciones)
// y los tipos con `import type` para que no queden en el JS resultante
import {
  useApi,
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  registrarMovimiento
} from '../hooks/useApi'
import type { Producto } from '../hooks/useApi'

interface InventoryAdjust {
  producto_id: number
  tipo: 'entrada' | 'salida'
  cantidad: number
  motivo: string
}

// Puede ser un nuevo producto (sin id) o un ajuste de inventario
type FormState = Partial<Omit<Producto, 'id' | 'fecha_creacion'>> &
  InventoryAdjust & { id?: number }

const emptyProducto: Omit<Producto, 'id' | 'fecha_creacion'> = {
  nombre: '',
  categoria: '',
  stock: 0,
  stock_minimo: 0,
  precio: 0,
  costo: 0,
  proveedor: '',
  demanda_anual: 0
}
const emptyAdjust: InventoryAdjust = {
  producto_id: 0,
  tipo: 'entrada',
  cantidad: 0,
  motivo: ''
}

export default function Inventory(): JSX.Element {
  const { data: productos = [], loading, refresh } = useApi<Producto[]>(getProductos, [])
  const [modal, setModal] = useState<'add' | 'edit' | 'adjust' | null>(null)
  const [form, setForm] = useState<FormState>(emptyProducto)

  const openAdd = () => {
    setForm(emptyProducto)
    setModal('add')
  }
  const openEdit = (p: Producto) => {
    setForm(p)
    setModal('edit')
  }
  const openAdjust = (p: Producto) => {
    setForm({ ...emptyAdjust, producto_id: p.id })
    setModal('adjust')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (modal === 'add') {
      await crearProducto(form as Omit<Producto, 'id' | 'fecha_creacion'>)
    } else if (modal === 'edit') {
      await actualizarProducto((form as Producto).id!, form as Partial<Producto>)
    } else if (modal === 'adjust') {
      await registrarMovimiento(form as InventoryAdjust)
    }
    refresh()
    setModal(null)
  }

  if (loading) return <p>Cargando inventario…</p>

  return (
    <div className="fade-in">
      <div className="page-header d-flex justify-content-between align-items-center">
        <h1 className="h2">Gestión de Inventario</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-circle me-1" /> Agregar Producto
        </button>
      </div>

      <div className="table-responsive mb-4">
        <table className="table table-striped table-hover inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Proveedor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.nombre}</td>
                <td>{p.categoria}</td>
                <td
                  className={
                    p.stock === 0
                      ? 'text-danger fw-bold'
                      : p.stock <= p.stock_minimo
                      ? 'text-warning fw-bold'
                      : ''
                  }
                >
                  {p.stock}
                </td>
                <td>${p.precio.toFixed(2)}</td>
                <td>${p.costo.toFixed(2)}</td>
                <td>{p.proveedor}</td>
                <td>
                  <button className="btn-action edit me-1" onClick={() => openEdit(p)}>
                    <i className="bi bi-pencil" />
                  </button>
                  <button className="btn-action adjust me-1" onClick={() => openAdjust(p)}>
                    <i className="bi bi-box-arrow-in-down-right" />
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={async () => {
                      if (window.confirm('¿Eliminar producto?')) {
                        await eliminarProducto(p.id)
                        refresh()
                      }
                    }}
                  >
                    <i className="bi bi-trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    {modal === 'add' && 'Agregar Producto'}
                    {modal === 'edit' && 'Editar Producto'}
                    {modal === 'adjust' && 'Ajuste de Inventario'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setModal(null)}
                  />
                </div>
                <div className="modal-body">
                  {modal !== 'adjust' ? (
                    <>
                      {/* Formulario de producto */}
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Nombre</label>
                          <input
                            className="form-control"
                            required
                            value={form.nombre || ''}
                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Categoría</label>
                          <select
                            className="form-select"
                            required
                            value={form.categoria || ''}
                            onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                          >
                            <option value="">Seleccione…</option>
                            <option>Procesadores</option>
                            <option>Memorias RAM</option>
                            <option>Discos Duros</option>
                            <option>Tarjetas Madre</option>
                            <option>Tarjetas Gráficas</option>
                            <option>Fuentes de Poder</option>
                            <option>Refacciones</option>
                          </select>
                        </div>
                      </div>
                      <div className="row">
                        {(['stock', 'stock_minimo', 'demanda_anual'] as const).map(k => (
                          <div className="col-md-4 mb-3" key={k}>
                            <label className="form-label">
                              {k === 'stock'
                                ? 'Stock Inicial'
                                : k === 'stock_minimo'
                                ? 'Stock Mínimo'
                                : 'Demanda Anual'}
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              required
                              value={(form as any)[k] ?? 0}
                              onChange={e =>
                                setForm(f => ({ ...f, [k]: parseInt(e.target.value, 10) }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Precio</label>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              required
                              value={form.precio ?? 0}
                              onChange={e =>
                                setForm(f => ({ ...f, precio: parseFloat(e.target.value) }))
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Costo</label>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              required
                              value={form.costo ?? 0}
                              onChange={e =>
                                setForm(f => ({ ...f, costo: parseFloat(e.target.value) }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Proveedor</label>
                        <input
                          className="form-control"
                          required
                          value={form.proveedor || ''}
                          onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Formulario de ajuste */}
                      <div className="mb-3">
                        <label className="form-label">Tipo</label>
                        <select
                          className="form-select"
                          required
                          value={form.tipo}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              tipo: e.target.value as 'entrada' | 'salida'
                            }))
                          }
                        >
                          <option value="entrada">Entrada</option>
                          <option value="salida">Salida</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Cantidad</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          required
                          value={form.cantidad ?? 0}
                          onChange={e =>
                            setForm(f => ({ ...f, cantidad: parseInt(e.target.value, 10) }))
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Motivo</label>
                        <textarea
                          className="form-control"
                          value={form.motivo || ''}
                          onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modal === 'add'
                      ? 'Guardar Producto'
                      : modal === 'edit'
                      ? 'Actualizar Producto'
                      : 'Guardar Ajuste'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
