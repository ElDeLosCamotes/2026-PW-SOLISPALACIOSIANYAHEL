const talleresModel = require('../Modelo/taller');

function esDuplicado(error) {
    return error.code === 'ER_DUP_ENTRY' || error.code === '23505';
}

async function listarTalleres(req, res) {
    try {
        res.json(await talleresModel.listar());
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

async function obtenerTaller(req, res) {
    try {
        const taller = await talleresModel.consultarPorTaller(req.params.id);
        if (!taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.json(taller);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

async function crearTaller(req, res) {
    const {nombre, fecha, cupo} = req.body;
    if (!nombre || !fecha || !Number.isInteger(Number(cupo)) || Number(cupo) < 1) {
        return res.status(400).json({error: 'nombre, fecha y un cupo entero mayor que cero son obligatorios'});
    }
    try {
        res.status(201).json(await talleresModel.crear(req.body));
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

async function actualizarTaller(req, res) {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({error: 'Debe enviar al menos un campo para actualizar'});
    }
    try {
        const taller = await talleresModel.actualizar(req.params.id, req.body);
        if (!taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.json(taller);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

async function eliminarTaller(req, res) {
    try {
        if (!await talleresModel.eliminar(req.params.id)) return res.status(404).json({error: 'Taller no encontrado'});
        res.status(204).send();
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

async function registrarseEnTaller(req, res) {
    const usuarioId = Number(req.body.usuario_id);
    if (!Number.isInteger(usuarioId) || usuarioId < 1) {
        return res.status(400).json({error: 'usuario_id debe ser un entero positivo'});
    }
    try {
        const taller = await talleresModel.consultarPorTaller(req.params.id);
        if (!taller) return res.status(404).json({error: 'Taller no encontrado'});
        res.status(201).json(await talleresModel.registrarse(req.params.id, usuarioId));
    } catch (error) {
        if (esDuplicado(error)) return res.status(409).json({error: 'El usuario ya está inscrito en este taller'});
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({error: 'Usuario no encontrado'});
        res.status(500).json({error: error.message});
    }
}

module.exports = {listarTalleres, obtenerTaller, crearTaller, actualizarTaller, eliminarTaller, registrarseEnTaller};