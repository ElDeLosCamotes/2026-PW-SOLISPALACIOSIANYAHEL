const pool = require('../db-local');

async function registrarAsistencia({tallerId, usuarioId}) {
    const [info] = await pool.query(
        'INSERT INTO asistencias (taller_id, usuario_id, fecha_asistencia) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [tallerId, usuarioId]
    );
    const [filas] = await pool.query(
        'SELECT id, taller_id, usuario_id, fecha_asistencia FROM asistencias WHERE id = ?',
        [info.insertId]
    );
    return filas[0];
}

async function consultarListaAsistencia(tallerId) {
    const [filas] = await pool.query(`
        SELECT a.id, a.taller_id, a.usuario_id, u.nombre, u.boleta, a.fecha_asistencia
        FROM asistencias a
        INNER JOIN usuarios u ON u.id = a.usuario_id
        WHERE a.taller_id = ?
        ORDER BY a.fecha_asistencia, u.nombre`,
    [tallerId]);
    return filas;
}

module.exports = {registrarAsistencia, consultarListaAsistencia};