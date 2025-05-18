//server/src/index.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import productosRouter from './routes/productos.routes.js';
import movimientosRouter from './routes/movimientos.routes.js';
import reportesRouter    from './routes/reportes.routes.js';


dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000','http://localhost:5173'], // ajusta tu front
  credentials: true
}));
app.use(express.json());

// API routes
app.use('/api/productos', productosRouter);
app.use('/api/movimientos', movimientosRouter);
app.use('/api/reportes', reportesRouter);

// Si quieres servir el build de React en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('../client/dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
