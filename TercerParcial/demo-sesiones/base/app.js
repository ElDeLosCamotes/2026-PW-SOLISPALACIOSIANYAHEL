const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

const NOMBRE_COOKIE = 'connect.sid';

function todasLasSesiones(almacen) {
  return new Promise((resolve, reject) => {
    let resuelta = false;
    const terminar = (error, sesiones) => {
      if (resuelta) return;
      resuelta = true;
      if (error) reject(error);
      else resolve(sesiones);
    };

    try {
      const resultado = almacen.all((error, sesiones) => terminar(error, sesiones));
      if (resultado && typeof resultado.then === 'function') {
        resultado.then((sesiones) => terminar(null, sesiones), (error) => terminar(error));
      }
    } catch (error) {
      terminar(error);
    }
  });
}

function crearApp(config, pool) {
  const app = express();
  const usuarios = crearModeloUsuarios(pool);
  const maxAgeMs = config.maxAgeMs ?? 10 * 60 * 1000;
  const httpOnly = config.httpOnly ?? true;
  const sameSite = config.sameSite ?? 'lax';
  const secure = config.secure ?? false;
  const almacen = config.almacen === 'memoria'
    ? new session.MemoryStore()
    : new MySQLStore({ createDatabaseTable: false, clearExpired: false }, pool);

  app.locals.almacen = almacen;
  app.use(express.json());
  app.use(session({
    name: NOMBRE_COOKIE,
    secret: process.env.SESSION_SECRET || 'secreto-solo-para-la-demo',
    store: almacen,
    resave: false,
    saveUninitialized: false,
    rolling: config.rolling ?? false,
    cookie: {
      maxAge: maxAgeMs,
      httpOnly,
      sameSite,
      secure,
    },
  }));

  const idCorto = (id) => (id ? `${id.slice(0, 8)}...` : null);
  const vencida = (sesion) => {
    const desde = config.rolling ? sesion.ultimoUso : sesion.creada;
    return !Number.isFinite(desde) || Date.now() - desde > maxAgeMs;
  };
  const borrarCookie = (res) => res.clearCookie(NOMBRE_COOKIE, {
    path: '/',
    httpOnly,
    sameSite,
    secure,
  });

  function requiereSesion(req, res, next) {
    if (!req.session.usuario) {
      return res.status(401).json({ error: 'No has iniciado sesión.' });
    }

    if (vencida(req.session)) {
      return req.session.destroy((error) => {
        if (error) return next(error);
        borrarCookie(res);
        return res.status(401).json({ error: 'Tu sesión ya expiró; vuelve a iniciar sesión.' });
      });
    }

    req.session.ultimoUso = Date.now();
    return next();
  }

  function requiereRol(rol) {
    return (req, res, next) => {
      if (req.session.usuario.rol !== rol) {
        return res.status(403).json({
          error: `Eres ${req.session.usuario.usuario}, pero esta ruta es solo para ${rol}.`,
        });
      }
      return next();
    };
  }

  app.get('/api/config', (req, res) => {
    res.json({
      almacen: config.almacen,
      maxAgeMs,
      rolling: config.rolling ?? false,
      httpOnly,
      sameSite,
      secure,
      regenerarAlEntrar: config.regenerarAlEntrar ?? true,
    });
  });

  app.post('/api/visita', (req, res) => {
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({ visitas: req.session.visitas, sesion: idCorto(req.sessionID) });
  });

  app.post('/api/login', async (req, res, next) => {
    try {
      const { usuario, contrasena } = req.body || {};
      const datos = await usuarios.verificar(usuario, contrasena);
      if (!datos) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      }

      const sesionAntes = req.session.visitas !== undefined ? idCorto(req.sessionID) : null;
      const visitas = req.session.visitas || 0;
      const guardarSesion = () => {
        const ahora = Date.now();
        req.session.usuario = datos;
        req.session.visitas = visitas;
        req.session.creada = ahora;
        req.session.ultimoUso = ahora;
        req.session.save((error) => {
          if (error) return next(error);
          return res.json({
            usuario: datos,
            sesionAntes,
            sesionDespues: idCorto(req.sessionID),
          });
        });
      };

      if (config.regenerarAlEntrar ?? true) {
        return req.session.regenerate((error) => {
          if (error) return next(error);
          return guardarSesion();
        });
      }
      return guardarSesion();
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/logout', (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      borrarCookie(res);
      return res.json({ mensaje: 'Sesión cerrada.' });
    });
  });

  app.get('/api/sesion', requiereSesion, (req, res) => {
    const desde = config.rolling ? req.session.ultimoUso : req.session.creada;
    res.json({
      usuario: req.session.usuario,
      sesion: idCorto(req.sessionID),
      expiraEnSegundos: Math.max(0, Math.round((desde + maxAgeMs - Date.now()) / 1000)),
    });
  });

  app.get('/api/perfil', requiereSesion, (req, res) => {
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({
      mensaje: `Hola ${req.session.usuario.nombre}, rol ${req.session.usuario.rol}, visitas: ${req.session.visitas}`,
      usuario: req.session.usuario,
      visitas: req.session.visitas,
    });
  });

  app.get('/api/admin/reporte', requiereSesion, requiereRol('admin'), (req, res) => {
    res.json({
      mensaje: 'Acceso de administrador autorizado.',
      usuario: req.session.usuario,
    });
  });

  app.get('/api/diagnostico/sesiones', async (req, res, next) => {
    try {
      const sesiones = await todasLasSesiones(almacen);
      const lista = Object.entries(sesiones || {}).map(([id, sesion]) => ({
        sesion: idCorto(id),
        esLaTuya: id === req.sessionID,
        usuario: sesion.usuario ? sesion.usuario.usuario : 'sin iniciar sesión',
        visitas: sesion.visitas || 0,
        expira: sesion.cookie && sesion.cookie.expires,
      }));
      return res.json({ almacen: config.almacen, sesiones: lista });
    } catch (error) {
      return next(error);
    }
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
    return res.status(status).json({ error: status === 500 ? 'Error del servidor.' : error.message });
  });

  return app;
}

module.exports = { crearApp, NOMBRE_COOKIE };
