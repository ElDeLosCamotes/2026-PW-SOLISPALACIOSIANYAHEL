const pool = require('../db-local')

const COLUMNAS_PUBLICAS ='id, nombre, correo, boleta, rol';

//consultar usuarios
async function listar() {
    const[filas] = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios ORDER BY id`);
    return filas;

}

async function obtenerporId() {
    const[filas] = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = ?`, [id] );
    return filas[0];

}

async function crear({nombre, correo, contrasenaHash, boleta, rol}) {
    const[info] = await pool.query(`INSERTO INTO usuarios (nombre, correo, contrasena_hash, boleta, rol) VALUES (?, ?, ?, ?, ?)`, [nombre, correo, contrasenaHash, boleta, rol || 'alumno']);
    return obtenerporId(info.insertId);
}

async function actualizar(id, {nombre, correo, rol}) {
    const cambios = Object.entries({nombre, correo, rol}).filter
    (([, valor])=> valor !== undefined);
}