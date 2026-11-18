const pool = require('../db-local');

async function registrarAsistencia({tallerId, nombreAlumno, boleta, usuarioId = null}) {
    const [info] = await pool.query(
        `INSERT INTO asistencias (taller_id, usuario_id, nombre_alumno, boleta, fecha_asistencia)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [tallerId, usuarioId, nombreAlumno, boleta]
    );
    const [filas] = await pool.query(
        `SELECT id, taller_id, usuario_id, nombre_alumno, nombre_alumno AS nombre,
            boleta, fecha_asistencia AS fecha_registro
         FROM asistencias WHERE id = ?`,
        [info.insertId]
    );
    return filas[0];
}

async function consultarListaAsistencia(tallerId) {
    const [filas] = await pool.query(`
        SELECT a.id, a.taller_id, a.usuario_id, a.nombre_alumno, a.nombre_alumno AS nombre,
            a.boleta, a.fecha_asistencia AS fecha_registro
        FROM asistencias a
        WHERE a.taller_id = ?
        ORDER BY a.fecha_asistencia, a.nombre_alumno`,
    [tallerId]);
    return filas;
}

module.exports = {registrarAsistencia, consultarListaAsistencia};