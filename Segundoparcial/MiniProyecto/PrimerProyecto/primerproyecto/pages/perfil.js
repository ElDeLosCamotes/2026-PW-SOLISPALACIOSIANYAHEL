import { useState } from 'react';
import { pedirJSON } from '../lib/api';
import { validarBoleta, validarNombre } from '../lib/validaciones';
import estilos from '../styles/Talleres.module.css';

export default function Usuarios() {
    const [boleta, setBoleta] = useState('');
    const [usuario, setUsuario] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [esError, setEsError] = useState(false);
    const [cargando, setCargando] = useState(false);

    async function consultar(evento) {
        evento.preventDefault();
        setUsuario(null);
        setMensaje('');
        const boletaLimpia = boleta.trim();
        if (!validarBoleta(boletaLimpia)) {
            setMensaje('La boleta debe tener 10 dígitos.');
            setEsError(true);
            return;
        }

        setCargando(true);
        try {
            const usuarios = await pedirJSON('/usuarios');
            if (!Array.isArray(usuarios)) {
                throw new Error('El backend devolvió una lista de usuarios no válida.');
            }
            const encontrado = usuarios.find(
                (registro) => String(registro.boleta).trim() === boletaLimpia
            );
            setUsuario(encontrado || null);
            setMensaje(encontrado ? 'Usuario encontrado.' : 'No hay un usuario registrado con esa boleta.');
            setEsError(!encontrado);
        } catch (error) {
            setMensaje(error.message);
            setEsError(true);
        } finally {
            setCargando(false);
        }
    }

    async function crear(evento) {
        evento.preventDefault();
        const formulario = evento.currentTarget;
        const datos = new FormData(formulario);
        const nombre = String(datos.get('nombre')).trim();
        const boletaNueva = String(datos.get('boleta')).trim();
        setMensaje('');

        if (!validarNombre(nombre)) {
            setMensaje('El nombre solo debe contener letras, espacios y acentos.');
            setEsError(true);
            return;
        }

        if (!validarBoleta(boletaNueva)) {
            setMensaje('La boleta debe tener 10 dígitos.');
            setEsError(true);
            return;
        }

        setCargando(true);
        try {
            const creado = await pedirJSON('/usuarios', {
                method: 'POST',
                body: JSON.stringify({
                    nombre,
                    correo: String(datos.get('correo')).trim(),
                    contrasena: datos.get('contrasena'),
                    boleta: boletaNueva,
                }),
            });
            formulario.reset();
            setBoleta(boletaNueva);
            setUsuario(creado);
            setMensaje('Usuario creado correctamente.');
            setEsError(false);
        } catch (error) {
            setMensaje(error.message);
            setEsError(true);
        } finally {
            setCargando(false);
        }
    }

    return (
        <main>
            <h1>Usuarios</h1>
            <p>Crea una cuenta y consulta los datos de un usuario mediante su boleta.</p>

            <section className={estilos.panel}>
                <h2>Crear usuario</h2>
                <form className="formulario" onSubmit={crear}>
                    <label>Nombre completo
                        <input
                            name="nombre"
                            maxLength="120"
                            autoComplete="name"
                            pattern="[A-Za-zÁÉÍÓÚÜÑñáéíóúü\s'-]+"
                            title="Solo se permiten letras, espacios y acentos"
                            required
                        />
                    </label>
                    <label>Correo electrónico
                        <input name="correo" type="email" maxLength="180" autoComplete="email" required />
                    </label>
                    <label>Contraseña (mínimo 8 caracteres)
                        <input name="contrasena" type="password" minLength="8" autoComplete="new-password" required />
                    </label>
                    <label>Boleta (10 dígitos)
                        <input
                            name="boleta"
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength="10"
                            required
                        />
                    </label>
                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Guardando…' : 'Crear usuario'}
                    </button>
                </form>
            </section>

            <section className={estilos.panel}>
                <h2>Consultar usuario por boleta</h2>
                <form className="formulario" onSubmit={consultar}>
                    <label>Boleta (10 dígitos)
                        <input
                            inputMode="numeric"
                            maxLength="10"
                            value={boleta}
                            onChange={(evento) => setBoleta(evento.target.value)}
                            required
                        />
                    </label>
                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Consultando…' : 'Consultar'}
                    </button>
                </form>
                {mensaje && (
                    <p className={esError ? 'error' : estilos.exito} role={esError ? 'alert' : 'status'}>
                        {mensaje}
                    </p>
                )}
                {usuario && (
                    <div>
                        <h3>{usuario.nombre}</h3>
                        <p><strong>Correo:</strong> {usuario.correo}</p>
                        <p><strong>Boleta:</strong> {usuario.boleta}</p>
                        <p><strong>Rol:</strong> {usuario.rol}</p>
                    </div>
                )}
            </section>
        </main>
    );
}
