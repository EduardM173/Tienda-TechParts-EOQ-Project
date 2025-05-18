import { pool } from '../config/db.js';

export async function listarProductos(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM productos ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}

export async function obtenerProducto(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM productos WHERE id = ?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
}

export async function crearProducto(req, res) {
  const { nombre, categoria, stock, stock_minimo, precio, costo, proveedor, demanda_anual } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO productos
       (nombre, categoria, stock, stock_minimo, precio, costo, proveedor, demanda_anual)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, categoria, stock, stock_minimo, precio, costo, proveedor, demanda_anual]
    );
    const [newProd] = await pool.query('SELECT * FROM productos WHERE id = ?', [result.insertId]);
    res.json(newProd[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
}

export async function actualizarProducto(req, res) {
  const { id } = req.params;
  const { nombre, categoria, stock, stock_minimo, precio, costo, proveedor, demanda_anual } = req.body;
  try {
    const [old] = await pool.query('SELECT stock FROM productos WHERE id = ?', [id]);
    if (!old.length) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const stockAnterior = old[0].stock;

    await pool.query(
      `UPDATE productos
       SET nombre=?, categoria=?, stock=?, stock_minimo=?, precio=?, costo=?, proveedor=?, demanda_anual=?
       WHERE id=?`,
      [nombre, categoria, stock, stock_minimo, precio, costo, proveedor, demanda_anual, id]
    );

    // Registro automático de movimiento si cambia stock y no es inicial
    if (stock !== stockAnterior && stockAnterior !== 0) {
      const tipo = stock > stockAnterior ? 'entrada' : 'salida';
      const cantidad = Math.abs(stock - stockAnterior);
      await pool.query(
        `INSERT INTO movimientos(producto_id, tipo, cantidad, motivo, usuario)
         VALUES(?,?,?,?,?)`,
        [id, tipo, cantidad, 'Ajuste manual', 'Admin']
      );
    }

    const [updated] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
}

export async function borrarProducto(req, res) {
  const { id } = req.params;
  try {
    const [exists] = await pool.query('SELECT 1 FROM productos WHERE id = ?', [id]);
    if (!exists.length) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
}

// ----------------------------------------------------
// Nuevo controlador para “ordenar” vía movimiento entrada
// ----------------------------------------------------
export async function ordenarProducto(req, res) {
  const { id } = req.params;
  const { cantidad } = req.body;

  try {
    // 1) Aumentar el stock
    const [updateResult] = await pool.query(
      'UPDATE productos SET stock = stock + ? WHERE id = ?',
      [cantidad, id]
    );
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 2) Registrar el movimiento de entrada
    await pool.query(
      `INSERT INTO movimientos(producto_id, tipo, cantidad, motivo, usuario)
       VALUES (?, 'entrada', ?, 'Orden EOQ', 'Sistema')`,
      [id, cantidad]
    );

    // 3) Devolver el producto actualizado
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al crear la orden' });
  }
}
