import { pool } from '../config/db.js';

export async function listarMovimientos(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, p.nombre AS producto_nombre
       FROM movimientos m
       LEFT JOIN productos p ON m.producto_id = p.id
       ORDER BY m.fecha DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
}

export async function crearMovimiento(req, res) {
  const { producto_id, tipo, cantidad, motivo } = req.body;
  try {
    const [prod] = await pool.query('SELECT stock FROM productos WHERE id = ?', [producto_id]);
    if (!prod.length) return res.status(404).json({ error: 'Producto no encontrado' });

    // ajustar stock
    if (tipo === 'entrada') {
      await pool.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, producto_id]);
    } else {
      if (prod[0].stock < cantidad) {
        return res.status(400).json({ error: 'Stock insuficiente para la salida' });
      }
      await pool.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, producto_id]);
    }

    // insertar movimiento
    const [result] = await pool.query(
      `INSERT INTO movimientos(producto_id,tipo,cantidad,motivo,usuario)
       VALUES(?,?,?,?,?)`,
      [producto_id, tipo, cantidad, motivo||'Ajuste de inventario','Admin']
    );
    const [newMov] = await pool.query('SELECT * FROM movimientos WHERE id = ?', [result.insertId]);
    res.json(newMov[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
}
