// src/components/Sidebar.tsx
import React from 'react'
import { NavLink } from 'react-router-dom'

interface SidebarLink {
  to: string
  icon: string
  label: string
}

const links: SidebarLink[] = [
  { to: '/dashboard', icon: 'bi-speedometer2',       label: 'Dashboard' },
  { to: '/inventory', icon: 'bi-box-seam',           label: 'Inventario' },
  { to: '/eoq',       icon: 'bi-calculator',         label: 'Modelos EOQ' },
  { to: '/reports',   icon: 'bi-graph-up',           label: 'Reportes' },
]

const Sidebar: React.FC = () => {
  return (
    <nav id="sidebar" className="col-md-3 col-lg-2 d-md-block sidebar">
      <div className="position-sticky pt-0">
        <h4>
          <i className="bi bi-pc-display-horizontal logo" /> TechParts
        </h4>
        <p className="text-muted mb-0">Gestión de Inventario</p>
      </div>
      <ul className="nav flex-column">
        {links.map(({ to, icon, label }) => (
          <li className="nav-item" key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}`
              }
            >
              <i className={`bi ${icon} me-2`} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Sidebar
