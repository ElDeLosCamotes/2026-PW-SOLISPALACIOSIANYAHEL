import Link from 'next/link';
import { formatearFecha } from '../lib/formato';
import estilos from './TarjetaTaller.module.css';

export default function TarjetaTaller({ taller }) {
    return (
        <article className={estilos.tarjeta}>
            <span className={estilos.etiqueta}>Taller</span>
            <h2 className={estilos.titulo}>{taller.nombre}</h2>
            <p className={estilos.dato}>
                <strong>Instructor:</strong> Por confirmar
            </p>
            {taller.descripcion && <p className={estilos.dato}>{taller.descripcion}</p>}
            <p className={estilos.dato}>
                <strong>Fecha:</strong> {formatearFecha(taller.fecha)}
            </p>
            {taller.hora && (
                <p className={estilos.dato}>
                    <strong>Hora:</strong> {String(taller.hora).slice(0, 5)}
                </p>
            )}
            <p className={estilos.dato}>
                <strong>Cupo:</strong> {taller.cupo} lugares
            </p>
            <Link className={estilos.enlace} href={`/talleres/${taller.id}`}>
                Ver detalle e inscribirme →
            </Link>
        </article>
    );
}
