// src/hooks/useApi.ts
import { useState, useEffect, useCallback } from 'react'

// Base URL de la API, lee de VITE_API_BASE o usa el default
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api'

// --- Tipos ---
export interface Producto {
  id: number
  nombre: string
  categoria: string
  stock: number
  stock_minimo: number
  precio: number
  costo: number
  proveedor: string
  demanda_anual: number
  fecha_creacion: string
}

export interface Movimiento {
  id: number
  producto_id: number
  tipo: 'entrada' | 'salida'
  cantidad: number
  motivo: string
  fecha: string
  usuario: string
}

export interface EOQResultBasic {
  qOptima: number
  tiempoCiclo: number
  costoTotalUnidadTiempo: number
  costoTotalCiclo: number
}

export interface EOQResultShortage {
  qOptima: number
  nivelMaxInventario: number
  faltanteMaximo: number
  fraccionTiempoSinFaltantes: number
  costoTotalUnidadTiempo: number
  costoTotalCiclo: number
}

// --- Funciones de API ---
export async function getProductos(): Promise<Producto[]> {
  const res = await fetch(`${API_BASE}/productos`)
  const arr = await res.json()
  return arr.map((p: any) => ({
    ...p,
    stock:         Number(p.stock),
    stock_minimo:  Number(p.stock_minimo),
    precio:        Number(p.precio),
    costo:         Number(p.costo),
    demanda_anual: Number(p.demanda_anual),
  }))
}

// **Nueva** función para obtener un solo producto
export async function getProducto(id: number): Promise<Producto> {
  const res = await fetch(`${API_BASE}/productos/${id}`)
  if (!res.ok) throw new Error(`Producto ${id} no encontrado`)
  const p = await res.json()
  return {
    ...p,
    stock:         Number(p.stock),
    stock_minimo:  Number(p.stock_minimo),
    precio:        Number(p.precio),
    costo:         Number(p.costo),
    demanda_anual: Number(p.demanda_anual),
  }
}

export async function getMovimientos(): Promise<Movimiento[]> {
  const res = await fetch(`${API_BASE}/movimientos`)
  const arr = await res.json()
  return arr.map((m: any) => ({
    ...m,
    cantidad: Number(m.cantidad),
  }))
}

export async function getBajoStock(): Promise<Producto[]> {
  const res = await fetch(`${API_BASE}/reportes/bajo-stock`)
  const arr = await res.json()
  return arr.map((p: any) => ({
    ...p,
    stock:         Number(p.stock),
    stock_minimo:  Number(p.stock_minimo),
    precio:        Number(p.precio),
    costo:         Number(p.costo),
    demanda_anual: Number(p.demanda_anual),
  }))
}

export async function getAgotados(): Promise<Producto[]> {
  const res = await fetch(`${API_BASE}/reportes/agotados`)
  const arr = await res.json()
  return arr.map((p: any) => ({
    ...p,
    stock:         Number(p.stock),
    stock_minimo:  Number(p.stock_minimo),
    precio:        Number(p.precio),
    costo:         Number(p.costo),
    demanda_anual: Number(p.demanda_anual),
  }))
}

export async function crearProducto(p: Omit<Producto, 'id' | 'fecha_creacion'>): Promise<Producto> {
  const res = await fetch(`${API_BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p)
  })
  return res.json()
}

export async function actualizarProducto(id: number, p: Partial<Producto>): Promise<Producto> {
  const res = await fetch(`${API_BASE}/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p)
  })
  return res.json()
}

export async function eliminarProducto(id: number): Promise<void> {
  await fetch(`${API_BASE}/productos/${id}`, { method: 'DELETE' })
}

export async function registrarMovimiento(m: Omit<Movimiento, 'id' | 'fecha'>): Promise<Movimiento> {
  const res = await fetch(`${API_BASE}/movimientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(m)
  })
  return res.json()
}

// --- Hook genérico ---
export function useApi<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fn()
      .then(d => setData(d))
      .catch(err => {
        console.error('API error:', err)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, /* eslint-disable-line react-hooks/exhaustive-deps */ deps)

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, refresh }
}
