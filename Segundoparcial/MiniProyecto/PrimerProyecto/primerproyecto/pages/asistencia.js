import { useEffect, useState } from 'react';
import { pedirJSON } from '../lib/api';
import estilos from '../styles/Talleres.module.css';

export default function Asistencia() {
    const [usuarios, setUsuarios] = useState([]);
    const [talleres, setTalleres] = useState([]);
    const [tallerId, setTallerId] = useState('');
    const [asistencias, setAsistencias] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [esError, setEsError] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        async function cargarOpciones() {
            try {
                const [listaUsuarios, listaTalleres] = await Promise.all([
                    pedirJSON('/usuarios'),
                    pedirJSON('/talleres'),
                ]);
                if (!Array.isArray(listaUsuarios) || !Array.isArray(listaTalleres)) {
                    throw new Error('El backend devolvió datos con un formato inesperado.');
                }
                setUsuarios(listaUsuarios);
                setTalleres(listaTalleres);
            } catch (error) {
                setMensaje(error.message);
                setEsError(true);
            } finally {
                setCargando(false);
            }
        }
        cargarOpciones();
    }, []);

    async function cambiarTaller(evento) {
        const id = evento.target.value;
        setTallerId(id);
        setAsistencias([]);
        setMensaje('');
        if (!id) return;

        try {
            const lista = await pedirJSON(`/talleres/${encodeURIComponent(id)}/asistencias`);
            if (!Array.isArray(lista)) {
                throw new Error('El backend devolvió una lista de asistencias no válida.');
            }
            setAsistencias(lista);
            setEsError(false);
        } catch (error) {
            setMensaje(error.message);
            setEsError(true);
        }
    }

    async function registrar(evento) {
        evento.preventDefault();
        const formulario = evento.currentTarget;
        const datos = new FormData(formulario);
        setGuardando(true);
        setMensaje('');
        try {
            await pedirJSON(`/talleres/${encodeURIComponent(tallerId)}/asistencias`, {
                method: 'POST',
                body: JSON.stringify({usuario_id: Number(datos.get('usuario_id'))}),
            });
            const lista = await pedirJSON(`/talleres/${encodeURIComponent(tallerId)}/asistencias`);
            if (!Array.isArray(lista)) {
                throw new Error('El backend devolvió una lista de asistencias no válida.');
            }
            setAsistencias(lista);
            setMensaje('Asistencia registrada correctamente.');
            setEsError(false);
        } catch (error) {
            setMensaje(error.message);
            setEsError(true);
        } finally {
            setGuardando(false);
        }
    }

    return (
        <main>
            <h1>Asistencia</h1>
            <p>Selecciona un taller y el usuario que asistió para guardar su asistencia.</p>

            {mensaje && (
                <p className={esError ? 'error' : estilos.exito} role={esError ? 'alert' : 'status'}>
                    {mensaje}
                </p>
            )}
            {cargando ? <p role="status">Cargando usuarios y talleres…</p> : (
                <section className={estilos.panel}>
                    <h2>Registrar asistencia</h2>
                    {!talleres.length || !usuarios.length ? (
                        <p>Primero registra al menos un usuario y un taller.</p>
                    ) : (
                        <form className="formulario" onSubmit={registrar}>
                            <label>Taller
                                <select value={tallerId} onChange={cambiarTaller} required>
                                    <option value="">Selecciona un taller</option>
                                    {talleres.map((taller) => (
                                        <option key={taller.id} value={taller.id}>{taller.nombre}</option>
                                    ))}
                                </select>
                            </label>
                            <label>Usuario
                                <select name="usuario_id" required disabled={!tallerId}>
                                    <option value="">Selecciona un usuario</option>
                                    {usuarios.map((usuario) => (
                                        <option key={usuario.id} value={usuario.id}>
                                            {usuario.nombre} · {usuario.boleta}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button type="submit" disabled={guardando || !tallerId}>
                                {guardando ? 'Guardando…' : 'Registrar asistencia'}
                            </button>
                        </form>
                    )}
                </section>
            )}

            {tallerId && (
                <section className={estilos.panel}>
                    <h2>Asistencias registradas ({asistencias.length})</h2>
                    {asistencias.length === 0 ? <p>Aún no hay asistencias para este taller.</p> : (
                        <div className="tabla-responsive">
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr><th>Nombre</th><th>Boleta</th><th>Fecha de asistencia</th></tr>
                                </thead>
                                <tbody>
                                    {asistencias.map((asistencia) => (
                                        <tr key={asistencia.id}>
                                            <td>{asistencia.nombre}</td>
                                            <td>{asistencia.boleta}</td>
                                            <td>{String(asistencia.fecha_asistencia).replace('T', ' ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}
