// src/App.tsx
import React from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard  from './pages/Dashboard'
import Inventory  from './pages/Inventory'
import EOQModels  from './pages/EOQModels'
import Reports    from './pages/Reports'
import DashboardDetail from './pages/DashboardDetail'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './App.css'

const App: React.FC = () => (
  <div className="app d-flex">
    {/* Sidebar fijo */}
    <nav id="sidebar">
      <div className="sidebar-header text-center py-4">
        <h4>
          <i className="bi bi-pc-display-horizontal logo" /> TechParts
        </h4>
        <p className="text-muted mb-0">Gestión de Inventario</p>
      </div>
      <ul className="nav flex-column">
        <li className="nav-item">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <i className="bi bi-speedometer2 me-2" /> Dashboard
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/inventario"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <i className="bi bi-box-seam me-2" /> Inventario
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/modelos"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <i className="bi bi-calculator me-2" /> Modelos EOQ
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/reportes"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <i className="bi bi-graph-up me-2" /> Reportes
          </NavLink>
        </li>
      </ul>
    </nav>

    {/* Contenido principal */}
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/modelos" element={<EOQModels />} />
        <Route path="/reportes" element={<Reports />} />
        <Route path="/dashboard/:id" element={<DashboardDetail />} />
      </Routes>
    </main>
  </div>
)

export default App
