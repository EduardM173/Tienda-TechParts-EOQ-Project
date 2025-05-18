import { pool } from '../config/db.js';

export async function productosBajoStock(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM productos WHERE stock <= stock_minimo AND stock > 0 ORDER BY stock'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos con bajo stock' });
  }
}

export async function productosAgotados(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,
              (SELECT MAX(fecha) FROM movimientos m
               WHERE m.producto_id = p.id AND m.tipo = 'entrada') AS ultima_entrada
       FROM productos p
       WHERE stock = 0`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos agotados' });
  }
}
