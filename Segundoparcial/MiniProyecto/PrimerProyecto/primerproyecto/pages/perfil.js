import { useState } from 'react';
import Link from 'next/link';
import { pedirJSON } from '../lib/api';
import { formatearFecha } from '../lib/formato';
import { validarBoleta } from '../lib/validaciones';
import estilos from '../styles/Talleres.module.css';

export default function Perfil() {
    const [boleta, setBoleta] = useState('');
    const [buscada, setBuscada] = useState('');
    const [alumno, setAlumno] = useState(null);
    const [nombreInscrito, setNombreInscrito] = useState('');
    const [misTalleres, setMisTalleres] = useState([]);
    const [disponibles, setDisponibles] = useState([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    async function buscar(evento) {
        evento.preventDefault();
        setError('');
        setBuscada('');
        setAlumno(null);
        setNombreInscrito('');
        setMisTalleres([]);
        setDisponibles([]);

        const boletaLimpia = boleta.trim();
        if (!validarBoleta(boletaLimpia)) {
            setError('La boleta debe tener 10 dígitos.');
            return;
        }

        setCargando(true);
        try {
            const [usuarios, talleres] = await Promise.all([
                pedirJSON('/usuarios'),
                pedirJSON('/talleres'),
            ]);
            if (!Array.isArray(usuarios) || !Array.isArray(talleres)) {
                throw new Error('El backend devolvió datos de perfil no válidos.');
            }

            const listas = await Promise.all(
                talleres.map((taller) =>
                    pedirJSON(`/talleres/${encodeURIComponent(String(taller.id))}/asistencias`)
                )
            );
            const conAsistencias = talleres.map((taller, indice) => {
                if (!Array.isArray(listas[indice])) {
                    throw new Error('El backend devolvió una lista de asistentes no válida.');
                }
                return { ...taller, asistencias: listas[indice] };
            });
            const mios = conAsistencias.filter((taller) =>
                taller.asistencias.some(
                    (asistencia) => String(asistencia.boleta).trim() === boletaLimpia
                )
            );
            const conLugar = conAsistencias.filter(
                (taller) =>
                    !mios.includes(taller) &&
                    taller.asistencias.length < Number(taller.cupo)
            );
            const inscripcion = mios.length > 0
                ? mios[0].asistencias.find(
                    (asistencia) => String(asistencia.boleta).trim() === boletaLimpia
                )
                : null;

            setAlumno(
                usuarios.find((usuario) => String(usuario.boleta).trim() === boletaLimpia) || null
            );
            setNombreInscrito(inscripcion ? inscripcion.nombre : '');
            setMisTalleres(mios);
            setDisponibles(conLugar);
            setBuscada(boletaLimpia);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    const nombre = alumno ? alumno.nombre : nombreInscrito;

    return (
        <main>
            <h1>Mi perfil</h1>
            <p>Busca tus datos y talleres usando tu boleta.</p>
            <form onSubmit={buscar} className="formulario">
                <label>
                    Tu boleta (10 dígitos)
                    <input
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={10}
                        value={boleta}
                        onChange={(evento) => setBoleta(evento.target.value)}
                    />
                </label>
                <button type="submit" disabled={cargando}>
                    {cargando ? 'Buscando…' : 'Ver mi perfil'}
                </button>
            </form>
            {error && <p className="error" role="alert">{error}</p>}
            {buscada && (
                <>
                    <section className={estilos.panel}>
                        {alumno ? (
                            <>
                                <h2>{alumno.nombre}</h2>
                                <p><strong>Correo:</strong> {alumno.correo}</p>
                                <p><strong>Boleta:</strong> {alumno.boleta}</p>
                                <p><strong>Rol:</strong> {alumno.rol}</p>
                            </>
                        ) : (
                            <p>
                                La boleta {buscada} no tiene cuenta registrada
                                {nombreInscrito ? ` (inscripciones a nombre de ${nombreInscrito})` : ''}.
                                Aun así puedes consultar los talleres disponibles.
                            </p>
                        )}
                    </section>

                    <h2>Mis talleres ({misTalleres.length})</h2>
                    {misTalleres.length === 0 ? (
                        <p>Todavía no estás inscrito en ningún taller.</p>
                    ) : (
                        <ul className={estilos.lista}>
                            {misTalleres.map((taller) => (
                                <li key={taller.id}>
                                    <Link href={`/talleres/${taller.id}`}>{taller.nombre}</Link>
                                    {' — '}{formatearFecha(taller.fecha)}
                                </li>
                            ))}
                        </ul>
                    )}

                    <h2>Talleres con lugar disponible</h2>
                    {disponibles.length === 0 ? (
                        <p>No hay más talleres con lugar.</p>
                    ) : (
                        <ul className={estilos.lista}>
                            {disponibles.map((taller) => {
                                const lugares = Number(taller.cupo) - taller.asistencias.length;
                                const query = new URLSearchParams({
                                    boleta: buscada,
                                    nombre,
                                });
                                return (
                                    <li key={taller.id}>
                                        {taller.nombre} — {lugares} {lugares === 1 ? 'lugar' : 'lugares'} ·{' '}
                                        <Link href={`/talleres/${taller.id}?${query.toString()}`}>
                                            Inscribirme
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </>
            )}
        </main>
    );
}
