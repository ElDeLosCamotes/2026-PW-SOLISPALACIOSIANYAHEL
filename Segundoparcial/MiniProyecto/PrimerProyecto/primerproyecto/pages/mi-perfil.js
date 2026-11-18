import { useState } from 'react';
import Link from 'next/link';
import { pedirJSON } from '../lib/api';
import { formatearFecha } from '../lib/formato';
import { validarBoleta } from '../lib/validaciones';
import estilos from '../styles/Talleres.module.css';

export default function MiPerfil() {
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
        const boletaLimpia = boleta.trim();
        setError('');
        setBuscada('');
        setAlumno(null);
        setNombreInscrito('');
        setMisTalleres([]);
        setDisponibles([]);

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
                throw new Error('El backend devolvió datos con un formato inesperado.');
            }

            const listasAsistencia = await Promise.all(
                talleres.map((taller) =>
                    pedirJSON(`/talleres/${encodeURIComponent(String(taller.id))}/asistencias`)
                )
            );
            if (!listasAsistencia.every(Array.isArray)) {
                throw new Error('El backend devolvió una lista de asistentes no válida.');
            }

            const talleresConAsistencia = talleres.map((taller, indice) => ({
                ...taller,
                asistencias: listasAsistencia[indice],
            }));
            const inscritos = talleresConAsistencia.filter((taller) =>
                taller.asistencias.some(
                    (asistencia) => String(asistencia.boleta).trim() === boletaLimpia
                )
            );
            const cuenta = usuarios.find(
                (usuario) => String(usuario.boleta).trim() === boletaLimpia
            ) || null;
            const asistencia = inscritos.length
                ? inscritos[0].asistencias.find(
                    (registro) => String(registro.boleta).trim() === boletaLimpia
                )
                : null;

            setAlumno(cuenta);
            setNombreInscrito(asistencia ? asistencia.nombre_alumno : '');
            setMisTalleres(inscritos);
            setDisponibles(talleresConAsistencia.filter((taller) => (
                !inscritos.includes(taller)
                && taller.asistencias.length < Number(taller.cupo)
            )));
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
            <form className="formulario" onSubmit={buscar}>
                <label htmlFor="boleta-perfil">Boleta (10 dígitos)</label>
                <input
                    id="boleta-perfil"
                    inputMode="numeric"
                    maxLength="10"
                    value={boleta}
                    onChange={(evento) => setBoleta(evento.target.value)}
                    required
                />
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
                                La boleta {buscada} no tiene una cuenta registrada
                                {nombreInscrito ? ` (inscripciones a nombre de ${nombreInscrito})` : ''}.
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
                                const href = `/talleres/${taller.id}?boleta=${encodeURIComponent(buscada)}&nombre=${encodeURIComponent(nombre)}`;
                                return (
                                    <li key={taller.id}>
                                        {taller.nombre} — {lugares} {lugares === 1 ? 'lugar' : 'lugares'}
                                        {' · '}<Link href={href}>Inscribirme</Link>
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
