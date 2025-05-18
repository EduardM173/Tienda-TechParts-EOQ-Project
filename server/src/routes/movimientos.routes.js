import { Router } from 'express';
import * as ctrl from '../controllers/movimientos.controller.js';

const router = Router();

router.get('/',  ctrl.listarMovimientos);
router.post('/', ctrl.crearMovimiento);

export default router;
