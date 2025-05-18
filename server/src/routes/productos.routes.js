// src/routes/productos.router.js
import { Router } from 'express';
import * as ctrl from '../controllers/productos.controller.js';

const router = Router();

// Rutas REST estándar
router.get('/',     ctrl.listarProductos);
router.get('/:id',  ctrl.obtenerProducto);
router.post('/',    ctrl.crearProducto);
router.put('/:id',  ctrl.actualizarProducto);
router.delete('/:id', ctrl.borrarProducto);

// **Nueva** ruta PARA ORDENAR un producto:
router.post('/:id/ordenar', ctrl.ordenarProducto);

export default router;
