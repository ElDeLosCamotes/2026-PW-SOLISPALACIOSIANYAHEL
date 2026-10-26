import { useEffect, useState } from 'react';
import TarjetaTaller from '../../components/TarjetaTaller';
import { pedirJSON } from '../../lib/api';
import estilos from '../../styles/Talleres.module.css';

export default function Talleres() {
    const [talleres, setTalleres] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        async function cargarTalleres() {
            try {
                const datos = await pedirJSON('/talleres');
                if (!Array.isArray(datos)) {
                    throw new Error('El backend devolvió una lista de talleres no válida.');
                }
                setTalleres(datos);
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargarTalleres();
    }, []);

    const texto = busqueda.trim().toLowerCase();
    const visibles = talleres.filter((taller) =>
        `${taller.nombre || ''}${taller.instructor || ''}`.toLowerCase().includes(texto)
    );

    return (
        <main>
            <h1>Talleres</h1>
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
