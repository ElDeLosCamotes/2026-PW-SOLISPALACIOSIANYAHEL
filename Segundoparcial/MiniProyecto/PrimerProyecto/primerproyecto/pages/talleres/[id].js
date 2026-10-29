import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { pedirJSON } from '../../lib/api';
import { formatearFecha, ocultarBoleta } from '../../lib/formato';
import { validarBoleta, validarNombre } from '../../lib/validaciones';
import estilos from '../../styles/Talleres.module.css';

function normalizarNombre(nombre) {
    return String(nombre)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLocaleLowerCase('es-MX')
        .replace(/\s+/g, ' ');
}

export default function DetalleTaller() {
    const router = useRouter();
    const { id } = router.query;
    const [taller, setTaller] = useState(null);
    const [asistencias, setAsistencias] = useState([]);
    const [errorCarga, setErrorCarga] = useState('');
    const [nombre, setNombre] = useState('');
    const [boleta, setBoleta] = useState('');
    const [errorForm, setErrorForm] = useState('');
    const [exito, setExito] = useState('');
    const [enviando, setEnviando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            const [tallerCargado, asistenciasCargadas] = await Promise.all([
                pedirJSON(`/talleres/${encodeURIComponent(String(id))}`),
                pedirJSON(`/talleres/${encodeURIComponent(String(id))}/inscripciones`),
            ]);
            if (!Array.isArray(asistenciasCargadas)) {
                throw new Error('El backend devolvió una lista de asistentes no válida.');
            }
            setTaller(tallerCargado);
            setAsistencias(asistenciasCargadas);
            setErrorCarga('');
        } catch (err) {
            setErrorCarga(err.message);
        }
    }, [id]);

    useEffect(() => {
        if (!router.isReady || !id) return;
        setTaller(null);
        setAsistencias([]);
        setErrorCarga('');
        if (router.query.boleta) setBoleta(String(router.query.boleta));
        if (router.query.nombre) setNombre(String(router.query.nombre));
        cargar();
    }, [router.isReady, id, router.query.boleta, router.query.nombre, cargar]);

    const ocupados = asistencias.length;
    const libres = taller ? Math.max(0, Number(taller.cupo) - ocupados) : 0;
    const lleno = Boolean(taller) && libres === 0;
    const porcentaje = taller && Number(taller.cupo) > 0
        ? Math.min(100, (ocupados / Number(taller.cupo)) * 100)
        : 0;

    async function inscribir(evento) {
        evento.preventDefault();
        setErrorForm('');
        setExito('');

        const nombreLimpio = nombre.trim();
        const boletaLimpia = boleta.trim();

        if (!nombreLimpio) {
            setErrorForm('Escribe tu nombre.');
            return;
        }
        if (!validarNombre(nombreLimpio)) {
            setErrorForm('El nombre solo debe contener letras, espacios y acentos.');
            return;
        }
        if (!validarBoleta(boletaLimpia)) {
            setErrorForm('La boleta debe tener 10 dígitos.');
            return;
        }
        if (asistencias.some((asistencia) => String(asistencia.boleta).trim() === boletaLimpia)) {
            setErrorForm('Esa boleta ya está inscrita en este taller.');
            return;
        }
        if (lleno) {
            setErrorForm('El taller ya no tiene lugares.');
            return;
        }

        setEnviando(true);
        try {
            const usuarios = await pedirJSON('/usuarios');
            if (!Array.isArray(usuarios)) {
                throw new Error('El backend devolvió una lista de usuarios no válida.');
            }
            const usuario = usuarios.find(
                (registro) => String(registro.boleta).trim() === boletaLimpia
            );
            if (!usuario) {
                throw new Error('No existe una cuenta con esa boleta. Regístrate primero en el sistema.');
            }
            if (normalizarNombre(usuario.nombre) !== normalizarNombre(nombreLimpio)) {
                throw new Error('El nombre no coincide con la cuenta registrada para esa boleta.');
            }

            await pedirJSON(`/talleres/${encodeURIComponent(String(id))}/inscripciones`, {
                method: 'POST',
                body: JSON.stringify({ usuario_id: usuario.id }),
            });
            setExito(`¡Listo! ${usuario.nombre} quedó inscrito(a) en el taller.`);
            await cargar();
        } catch (err) {
            setErrorForm(err.message);
        } finally {
            setEnviando(false);
        }
    }

    if (errorCarga) {
        return (
            <main>
                <p className="error" role="alert">{errorCarga}</p>
                <Link className={estilos.volver} href="/talleres">← Volver a talleres</Link>
            </main>
        );
    }

    if (!taller) {
        return <main><p role="status">Cargando taller…</p></main>;
    }

    return (
        <main>
            <Link className={estilos.volver} href="/talleres">← Volver a talleres</Link>
            <h1>{taller.nombre}</h1>
            {taller.descripcion && <p>{taller.descripcion}</p>}
            <section className={estilos.panel} aria-label="Disponibilidad del taller">
                <p><strong>Instructor:</strong> Por confirmar</p>
                <p><strong>Fecha:</strong> {formatearFecha(taller.fecha)}</p>
                {taller.hora && <p><strong>Hora:</strong> {String(taller.hora).slice(0, 5)}</p>}
                <div
                    className={estilos.barra}
                    role="progressbar"
                    aria-label="Lugares ocupados"
                    aria-valuemin="0"
                    aria-valuemax={taller.cupo}
                    aria-valuenow={Math.min(ocupados, Number(taller.cupo))}
                >
                    <div className={estilos.relleno} style={{ width: `${porcentaje}%` }} />
                </div>
                <p>
                    {ocupados} de {taller.cupo} lugares ocupados ·{' '}
                    {lleno
                        ? <span className={estilos.lleno}>Taller lleno</span>
                        : `${libres} ${libres === 1 ? 'lugar libre' : 'lugares libres'}`}
                </p>
            </section>

            <section className={estilos.panel}>
                <h2>Inscribirme</h2>
                <p>Necesitas una cuenta existente para inscribirte.</p>
                <form onSubmit={inscribir} className="formulario">
                    <label>
                        Nombre completo
                        <input
                            autoComplete="name"
                            value={nombre}
                            onChange={(evento) => setNombre(evento.target.value)}
                            pattern="[A-Za-zÁÉÍÓÚÜÑñáéíóúü\s'-]+"
                            title="Solo se permiten letras, espacios y acentos"
                        />
                    </label>
                    <label>
                        Boleta (10 dígitos)
                        <input
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={10}
                            value={boleta}
                            onChange={(evento) => setBoleta(evento.target.value)}
                        />
                    </label>
                    <button type="submit" disabled={lleno || enviando}>
                        {lleno ? 'Sin lugares' : enviando ? 'Inscribiendo…' : 'Inscribirme'}
                    </button>
                </form>
                {errorForm && <p className="error" role="alert">{errorForm}</p>}
                {exito && <p className={estilos.exito} role="status">{exito}</p>}
            </section>

            <h2>Inscritos ({ocupados})</h2>
            {ocupados === 0 ? (
                <p>Todavía no hay inscritos. ¡Sé el primero!</p>
            ) : (
                <div className="tabla-responsive">
                    <table className={estilos.tabla}>
                        <thead>
                            <tr><th>#</th><th>Nombre</th><th>Boleta</th></tr>
                        </thead>
                        <tbody>
                            {asistencias.map((asistencia, indice) => (
                                <tr key={asistencia.id}>
                                    <td>{indice + 1}</td>
                                    <td>{asistencia.nombre}</td>
                                    <td>{ocultarBoleta(asistencia.boleta)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
