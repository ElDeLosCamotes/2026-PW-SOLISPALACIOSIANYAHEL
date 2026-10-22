const pool = require('../db-local');

async function listar() {
    const [filas] = await pool.query('SELECT id, nombre, descripcion, fecha, hora, cupo FROM talleres ORDER BY fecha, hora');
    return filas;
}

async function obtenerPorId(id) {
    const [filas] = await pool.query('SELECT id, nombre, descripcion, fecha, hora, cupo FROM talleres WHERE id = ?', [id]);
    return filas[0];
}

async function crear({nombre, descripcion, fecha, hora, cupo}) {
    const [info] = await pool.query(
        'INSERT INTO talleres (nombre, descripcion, fecha, hora, cupo) VALUES (?, ?, ?, ?, ?)',
        [nombre, descripcion || null, fecha, hora || null, cupo]
    );
    return obtenerPorId(info.insertId);
}

async function actualizar(id, {nombre, descripcion, fecha, hora, cupo}) {
    const cambios = Object.entries({nombre, descripcion, fecha, hora, cupo}).filter(([, valor]) => valor !== undefined);
    if (cambios.length === 0) return obtenerPorId(id);

    const columnas = cambios.map(([columna]) => `${columna} = ?`).join(', ');
    const [info] = await pool.query(
        `UPDATE talleres SET ${columnas} WHERE id = ?`,
        [...cambios.map(([, valor]) => valor), id]
    );
    if (info.affectedRows === 0) return undefined;
    return obtenerPorId(id);
}

async function eliminar(id) {
    const [info] = await pool.query('DELETE FROM talleres WHERE id = ?', [id]);
    return info.affectedRows > 0;
}

async function consultarPorTaller(id) {
    return obtenerPorId(id);
}

async function registrarse(tallerId, usuarioId) {
    const [info] = await pool.query(
        'INSERT INTO inscripciones (taller_id, usuario_id) VALUES (?, ?)',
        [tallerId, usuarioId]
    );
    return {id: info.insertId, taller_id: Number(tallerId), usuario_id: Number(usuarioId)};
}

module.exports = {listar, obtenerPorId, crear, actualizar, eliminar, consultarPorTaller, registrarse};