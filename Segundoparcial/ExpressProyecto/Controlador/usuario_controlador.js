const bcrypt = require('bcryptjs');
const usuariosModel = require('../Modelo/usuario');

const validarNombre = (nombre) => /^[A-Za-zÁÉÍÓÚÜÑñáéíóúü\s'-]+$/.test(String(nombre).trim()) && String(nombre).trim().length >= 2;
const validarCorreo = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
const validarBoleta = (boleta) => /^\d{10}$/.test(String(boleta));
const validarContrasena = (contrasena) => contrasena.length >= 8;
const validarId = (id) => /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;

//que pasa si el correo y la boleta se duplica
function esDuplicado(error){
    return error.code === 'ER_DUP_ENTRY' || error.code === '23505';
}


async function listarUsuarios(req , res) {
    try{
        const usuarios = await usuariosModel.listar();
        res.json(usuarios);
    }catch(error){
        res.status(500).json({error: error.message})
    }
    
}

async function obtenerUsuario(req, res) {
    if (!validarId(req.params.id)) return res.status(404).json({error: 'Usuario no encontrado'});
    try{
        const usuario = await usuariosModel.obtenerPorId(req.params.id);
        if(!usuario) return res.status(404).json({error: 'Usuario no encontrado'});
        res.json(usuario);
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

async function crearUsuario(req, res) {
    const {nombre, correo, contrasena, boleta, rol} = req.body || {};
    if(!nombre || !correo || !contrasena || !boleta){
        return res.status(400).json({error: 'nombre, correo, contrasena y boleta son obligatorios'});
    }
    if(!validarCorreo(correo)) return res.status(400).json({error: 'El correo no tiene un formato valido'});
    if(!validarBoleta(boleta)) return res.status(400).json({error: 'La boleta debe tener 10 digitos'});
    if(!validarContrasena(contrasena)) return res.status(400).json({error: 'La contraseña debe tener al menos 8 caracteres'});

    try{
        const contrasenaHash = await bcrypt.hash(contrasena, 10);
        const usuario = await usuariosModel.crear({nombre, correo, contrasenaHash, boleta, rol});

        res.status(201).json(usuario);
    }catch(error){
        if (esDuplicado(error)) return res.status(409).json({error:'Ya existe un usuario con ese correo o boleta'});
        res.status(500).json({error: error.message});
    }
    
}

async function actualizarUsuario(req, res) {
    if (!validarId(req.params.id)) return res.status(404).json({error: 'Usuario no encontrado'});
    const {nombre, correo, rol} = req.body || {};

    if(correo === undefined && nombre === undefined && rol === undefined){
        return res.status(400).json({error: 'Envía al menos uno de: nombre, correo, rol'});
    }
    if(correo !== undefined && !validarCorreo(correo)){
        return res.status(400).json({error : 'El correo no tiene un formato válido'});
    }
    try{
        const usuario = await usuariosModel.actualizar(req.params.id, {nombre, correo, rol});
        if(!usuario) return res.status(404).json({error: 'Usuario no encontrado'});
        res.json(usuario);
    }catch(error){
        if(esDuplicado(error)) return res.status(409).json({error: 'Ya existe un usuario con ese correo'});
        res.status(500).json({error: error.message});
    }
    
}

async function eliminarUsuario(req, res) {
    if (!validarId(req.params.id)) return res.status(404).json({error: 'Usuario no encontrado'});
    try{
        const eliminado = await usuariosModel.eliminar(req.params.id);
        if(!eliminado) return res.status(404).json({error: 'Usuario no encontrado'});
        res.status(204).send();
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

module.exports = {listarUsuarios, obtenerUsuario, crearUsuario, actualizarUsuario, eliminarUsuario};