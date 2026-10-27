const asistenciaModel = require('../Modelo/asistencia');
const talleresModel = require('../Modelo/taller');

async function registrarAsistencia(req, res) {
    const usuarioId = Number(req.body.usuario_id);
    const tallerId = Number(req.params.tallerId);
    if (!Number.isInteger(usuarioId) || usuarioId < 1) {
        return res.status(400).json({error: 'usuario_id debe ser un entero positivo'});
    }
    try {
        if (!await talleresModel.consultarPorTaller(tallerId)) {
            return res.status(404).json({error: 'Taller no encontrado'});
        }
        res.status(201).json(await asistenciaModel.registrarAsistencia({tallerId, usuarioId}));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
            return res.status(409).json({error: 'La asistencia de este usuario ya está registrada para el taller'});
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({error: 'Usuario o taller no encontrado'});
        res.status(500).json({error: error.message});
    }
}

async function consultarListaAsistencia(req, res) {
    try {
        if (!await talleresModel.consultarPorTaller(req.params.tallerId)) {
            return res.status(404).json({error: 'Taller no encontrado'});
        }
        res.json(await asistenciaModel.consultarListaAsistencia(req.params.tallerId));
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

module.exports = {registrarAsistencia, consultarListaAsistencia};