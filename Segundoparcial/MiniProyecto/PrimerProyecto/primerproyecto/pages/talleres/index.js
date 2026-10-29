import { useEffect, useState } from 'react';
import TarjetaTaller from '../../components/TarjetaTaller';
import { pedirJSON } from '../../lib/api';
import { validarFecha, validarNombre } from '../../lib/validaciones';
import estilos from '../../styles/Talleres.module.css';

export default function Talleres() {
    const [talleres, setTalleres] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [mensajeError, setMensajeError] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    async function cargarTalleres() {
        try {
            const datos = await pedirJSON('/talleres');
            if (!Array.isArray(datos)) {
                throw new Error('El backend devolvió una lista de talleres no válida.');
            }
            setTalleres(datos);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarTalleres();
    }, []);

    async function crearTaller(evento) {
        evento.preventDefault();
        const formulario = evento.currentTarget;
        const datos = new FormData(formulario);
        const nombre = String(datos.get('nombre')).trim();
        const fecha = String(datos.get('fecha')).trim();
        setGuardando(true);
        setMensaje('');
        setMensajeError(false);

        if (!validarNombre(nombre)) {
            setMensaje('El nombre del taller solo debe contener letras, espacios y acentos.');
            setMensajeError(true);
            setGuardando(false);
            return;
        }

        if (!validarFecha(fecha)) {
            setMensaje('La fecha del taller es inválida. No uses años muy antiguos, por ejemplo 1200.');
            setMensajeError(true);
            setGuardando(false);
            return;
        }

        try {
            await pedirJSON('/talleres', {
                method: 'POST',
                body: JSON.stringify({
                    nombre,
                    descripcion: String(datos.get('descripcion')).trim(),
                    fecha,
                    hora: datos.get('hora') || null,
                    cupo: Number(datos.get('cupo')),
                }),
            });
            formulario.reset();
            await cargarTalleres();
            setMensaje('Taller registrado correctamente.');
        } catch (err) {
            setMensaje(err.message);
            setMensajeError(true);
        } finally {
            setGuardando(false);
        }
    }

    const texto = busqueda.trim().toLowerCase();
    const visibles = talleres.filter((taller) =>
        `${taller.nombre || ''}${taller.instructor || ''}`.toLowerCase().includes(texto)
    );

    return (
        <main>
            <h1>Talleres</h1>
            <section className={estilos.panel}>
                <h2>Registrar taller</h2>
                <form className="formulario" onSubmit={crearTaller}>
                    <label>Nombre del taller
                        <input
                            name="nombre"
                            maxLength="150"
                            pattern="[A-Za-zÁÉÍÓÚÜÑñáéíóúü\s'-]+"
                            title="Solo se permiten letras, espacios y acentos"
                            required
                        />
                    </label>
                    <label>Descripción
                        <textarea name="descripcion" rows="3" />
                    </label>
                    <label>Fecha
                        <input
                            name="fecha"
                            type="date"
                            min="1900-01-01"
                            required
                        />
                    </label>
                    <label>Hora
                        <input name="hora" type="time" />
                    </label>
                    <label>Cupo
                        <input name="cupo" type="number" min="1" step="1" required />
                    </label>
                    <button type="submit" disabled={guardando}>
                        {guardando ? 'Guardando…' : 'Registrar taller'}
                    </button>
                </form>
                {mensaje && <p className={mensajeError ? 'error' : estilos.exito} role={mensajeError ? 'alert' : 'status'}>{mensaje}</p>}
            </section>

            <label className="formulario">
                <span>Buscar taller</span>
                <input
                    className={estilos.buscador}
                    type="search"
                    placeholder="Buscar por nombre o instructor"
                    value={busqueda}
                    onChange={(evento) => setBusqueda(evento.target.value)}
                />
            </label>

            {cargando && <p role="status">Cargando talleres…</p>}
            {error && <p className="error" role="alert">{error}</p>}
            {!cargando && !error && talleres.length === 0 && (
                <p>No hay talleres registrados.</p>
            )}
            {!cargando && !error && talleres.length > 0 && visibles.length === 0 && (
                <p>No hay talleres que coincidan con la búsqueda.</p>
            )}
            {!cargando && !error && visibles.length > 0 && (
                <div className={estilos.rejilla}>
                    {visibles.map((taller) => (
                        <TarjetaTaller key={taller.id} taller={taller} />
                    ))}
                </div>
            )}
        </main>
    );
}
