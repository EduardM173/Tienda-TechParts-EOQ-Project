# 🎛️ TechParts - Gestión de Inventario y Modelos EOQ

TechParts es una **aplicación web** para la gestión de inventarios de una tienda de tecnologías y repuestos (PC, laptops, periféricos).

---

## 📋 Tabla de Contenidos
1. [Características](#✨-características)  
2. [📦 Estructura del Proyecto](#📦-estructura-del-proyecto)  
3. [🚀 Tecnologías](#🚀-tecnologías)  
4. [⚙️ Instalación y Ejecución](#⚙️-instalación-y-ejecución)  
5. [📄 Endpoints Principales](#📄-endpoints-principales)  
6. [🔧 Uso en Frontend](#🔧-uso-en-frontend)  
7. [🛠️ Personalización](#🛠️-personalización)  
8. [📄 Licencia](#📄-licencia)

---

## ✨ Características
- ✅ **CRUD** completo de productos  
- 📊 Registro y visualización de movimientos de inventario (entradas / salidas)  
- 🔢 Cálculo de EOQ (Cantidad Económica de Pedido):
  - EOQ Básico  
  - EOQ con Faltantes  
- 📈 Gráficos interactivos:
  - **Costo vs Tamaño de Lote**  
  - **Inventario vs Tiempo**  
- ⚠️ Reportes de stock bajo y productos agotados  

---

## 📦 Estructura del Proyecto
- **/** (root)
  - **config/**: Configuración de base de datos (MySQL)
  - **controllers/**: Lógica de negocio y endpoints Express
  - **hooks/**: Custom Hook `useApi` para llamadas HTTP
  - **pages/**: Componentes React (`Dashboard.tsx`, `EOQModels.tsx`, `Detalle.tsx`)
  - **routes/**: Definición de rutas REST (`productos.ts`, `movimientos.ts`)
  - **utils/**: Funciones de cálculo EOQ (`eoq.ts`)
  - **public/**: Recursos estáticos (favicon, logos, etc.)
  - **README.md**: Documentación de proyecto

---

## 🚀 Tecnologías
| Capa        | Tecnologías                             |
| ----------- | --------------------------------------- |
| **Frontend**| React · Bootstrap 5 · Chart.js          |
| **Backend** | Node.js · Express · MySQL (mysql2)      |
| **Hook API**| `useApi` para `fetch`                   |
| **Cálculos**| `calculateEOQBasico`, `calculateEOQFaltantes` en `utils/eoq.ts` |

---

## ⚙️ Instalación y Ejecución
1. **Clonar repositorio**  
   - `git clone <repo-url>`  
   - `cd techparts`  

2. **Configurar variables de entorno**  
   - Renombrar `.env.example` → `.env`  
   - Ajustar:
     - `VITE_API_BASE=http://localhost:3000/api`
     - `DB_HOST=localhost`
     - `DB_USER=root`
     - `DB_PASS=…`
     - `DB_NAME=inventario`

3. **Base de datos**  
   - Crear la base `inventario` en MySQL  
   - Importar esquema y seeds (config/db.js)

4. **Instalar dependencias & migrar**  
   - Backend:
     - `cd backend`
     - `npm install`
     - `npm run migrate && npm run seed`
     - `npm start`  → `http://localhost:3000`
   - Frontend:
     - `cd ../frontend`
     - `npm install`
     - `npm run dev`   → `http://localhost:5173`

---

## 📄 Endpoints Principales
| Método | Ruta                                | Descripción                                  |
| ------ | ----------------------------------- | -------------------------------------------- |
| GET    | `/api/productos`                    | Lista todos los productos                    |
| GET    | `/api/productos/:id`                | Detalle de un producto                       |
| POST   | `/api/productos`                    | Crear producto                               |
| PUT    | `/api/productos/:id`                | Actualizar producto (+ registra movimiento)  |
| DELETE | `/api/productos/:id`                | Eliminar producto                            |
| POST   | `/api/productos/:id/ordenar`        | Ordenar cantidad EOQ (movimiento entrada)    |
| GET    | `/api/movimientos`                  | Lista movimientos                            |
| GET    | `/api/reportes/bajo-stock`          | Productos con stock < mínimo                |
| GET    | `/api/reportes/agotados`            | Productos con stock = 0                      |

---

## 🔧 Uso en Frontend
- **Dashboard**: Vista general con gráficos de EOQ y ciclo de inventario.  
- **Inventario**: Gestión completa (CRUD + movimientos).  
- **Modelos EOQ**: Cálculo automático y herramientas manuales por producto.  
- **Reportes**: Listados de stock bajo y productos agotados.

---

## 🛠️ Personalización
- Ajustar **costos de ordenar (S)** y **mantener (H)** en `utils/eoq.ts`.  
- Cambiar apariencia con **Bootstrap** o migrar a **Tailwind CSS**.  
- Extender con **autenticación JWT** y gestión de **roles de usuario**.

---

## 📄 Licencia
Proyecto de ejemplo para fines educativos.  
