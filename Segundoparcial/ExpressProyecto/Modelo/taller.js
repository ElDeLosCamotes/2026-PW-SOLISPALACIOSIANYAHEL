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
    const [inscripcionesExistentes] = await pool.query(
        'SELECT id, taller_id FROM inscripciones WHERE usuario_id = ? LIMIT 1',
        [usuarioId]
    );

    if (inscripcionesExistentes.length > 0) {
        const yaEstaEnEsteTaller = Number(inscripcionesExistentes[0].taller_id) === Number(tallerId);
        const error = new Error(
            yaEstaEnEsteTaller
                ? 'El usuario ya está inscrito en este taller'
                : 'El usuario ya está inscrito en otro taller'
        );
        error.code = yaEstaEnEsteTaller ? 'ER_DUP_ENTRY' : 'USER_ALREADY_REGISTERED';
        throw error;
    }

    const [info] = await pool.query(
        'INSERT INTO inscripciones (taller_id, usuario_id) VALUES (?, ?)',
        [tallerId, usuarioId]
    );
    return {id: info.insertId, taller_id: Number(tallerId), usuario_id: Number(usuarioId)};
}

async function listarInscripciones(tallerId) {
    const [filas] = await pool.query(`
        SELECT i.id, i.taller_id, i.usuario_id, u.nombre, u.boleta, i.fecha_inscripcion
        FROM inscripciones i
        INNER JOIN usuarios u ON u.id = i.usuario_id
        WHERE i.taller_id = ?
        ORDER BY i.fecha_inscripcion, u.nombre`,
    [tallerId]);
    return filas;
}

module.exports = {listar, obtenerPorId, crear, actualizar, eliminar, consultarPorTaller, registrarse, listarInscripciones};