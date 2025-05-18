import { Router } from 'express';
import * as ctrl from '../controllers/reportes.controller.js';

const router = Router();

router.get('/bajo-stock', ctrl.productosBajoStock);
router.get('/agotados',    ctrl.productosAgotados);

export default router;
