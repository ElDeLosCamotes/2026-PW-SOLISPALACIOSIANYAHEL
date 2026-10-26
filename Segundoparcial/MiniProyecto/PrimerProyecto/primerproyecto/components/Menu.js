import Link from 'next/link';

export default function Menu() {
    return (
        <nav aria-label="Navegación principal">
            <Link href="/">Inicio</Link>
            <Link href="/talleres">Talleres</Link>
            <Link href="/perfil">Mi perfil</Link>
        </nav>
    );
}