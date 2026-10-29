const express = require('express');

const app = express();

app.use(express.json());

const usuarios = require('./Controlador/usuario_controlador');
const talleres = require('./Controlador/taller_controlador');
const asistencias = require('./Controlador/asistencia_controlador');

const PORT = process.env.PORT || 4000;


//tenemos la ruta principal por medio del metodo get
app.get('/saludo', (req, res) => {
    res.json({mensaje:'Hola esto es una prueba en GET'});
});

//rutas por medio del metodo post, como un endpoint propio
app.post('/eco', (req, res) => {
    const {texto} = req.body;
    if(!texto){
        return res.status(400).json({error:'EL texto es obligatorio'});
    }
    res.status(201).json({eco:texto})
});

app.get('/api/usuarios', usuarios.listarUsuarios);
app.get('/api/usuarios/:id', usuarios.obtenerUsuario);
app.post('/api/usuarios', usuarios.crearUsuario);
app.patch('/api/usuarios/:id', usuarios.actualizarUsuario);
app.delete('/api/usuarios/:id', usuarios.eliminarUsuario);

app.get('/api/talleres', talleres.listarTalleres);
app.get('/api/talleres/:id', talleres.obtenerTaller);
app.post('/api/talleres', talleres.crearTaller);
app.patch('/api/talleres/:id', talleres.actualizarTaller);
app.delete('/api/talleres/:id', talleres.eliminarTaller);
app.get('/api/talleres/:id/inscripciones', talleres.consultarInscripcionesEnTaller);
app.post('/api/talleres/:id/inscripciones', talleres.registrarseEnTaller);

app.post('/api/talleres/:tallerId/asistencias', asistencias.registrarAsistencia);
app.get('/api/talleres/:tallerId/asistencias', asistencias.consultarListaAsistencia);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto: ${PORT}`);
})
