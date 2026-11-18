const asistenciaModel = require('../Modelo/asistencia');
const talleresModel = require('../Modelo/taller');
const usuariosModel = require('../Modelo/usuario');

function esIdValido(id) {
    return /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

async function registrarAsistencia(req, res) {
    const body = req.body || {};
    const desdeRutaDeTaller = req.params.tallerId !== undefined;
    const tallerId = desdeRutaDeTaller ? req.params.tallerId : body.taller_id;

    if (!tallerId) {
        return res.status(400).json({error: 'taller_id, nombre_alumno y boleta son obligatorios'});
    }
    if (!esIdValido(tallerId)) return res.status(404).json({error: 'Taller no encontrado'});

    let usuarioId = null;
    let nombreAlumno = body.nombre_alumno;
    let boleta = body.boleta;

    if (desdeRutaDeTaller) {
        usuarioId = Number(body.usuario_id);
        if (!Number.isInteger(usuarioId) || usuarioId < 1) {
            return res.status(400).json({error: 'usuario_id debe ser un entero positivo'});
        }
    } else if (!nombreAlumno || !boleta) {
        return res.status(400).json({error: 'taller_id, nombre_alumno y boleta son obligatorios'});
    }

    try {
        if (desdeRutaDeTaller) {
            const usuario = await usuariosModel.obtenerPorId(usuarioId);
            if (!usuario) return res.status(404).json({error: 'Usuario no encontrado'});
            nombreAlumno = usuario.nombre;
            boleta = usuario.boleta;
        }
        if (typeof nombreAlumno !== 'string' || !nombreAlumno.trim()) {
            return res.status(400).json({error: 'nombre_alumno no puede estar vacío'});
        }
        nombreAlumno = nombreAlumno.trim();
        if (typeof boleta !== 'string' && typeof boleta !== 'number') {
            return res.status(400).json({error: 'La boleta debe tener 10 dígitos'});
        }
        boleta = String(boleta).trim();
        if (!/^\d{10}$/.test(boleta)) {
            return res.status(400).json({error: 'La boleta debe tener 10 dígitos'});
        }
        if (!await talleresModel.consultarPorTaller(tallerId)) {
            return res.status(404).json({error: 'Taller no encontrado'});
        }
        const asistencia = await asistenciaModel.registrarAsistencia({
            tallerId: Number(tallerId),
            usuarioId,
            nombreAlumno,
            boleta,
        });
        res.status(201).json(asistencia);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
            return res.status(409).json({error: 'La boleta ya tiene asistencia registrada para este taller'});
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({error: 'Taller no encontrado'});
        res.status(500).json({error: error.message});
    }
}

async function consultarListaAsistencia(req, res) {
    try {
        if (!esIdValido(req.params.tallerId)) return res.status(404).json({error: 'Taller no encontrado'});
        if (!await talleresModel.consultarPorTaller(req.params.tallerId)) {
            return res.status(404).json({error: 'Taller no encontrado'});
        }
        res.json(await asistenciaModel.consultarListaAsistencia(req.params.tallerId));
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

module.exports = {registrarAsistencia, consultarListaAsistencia};