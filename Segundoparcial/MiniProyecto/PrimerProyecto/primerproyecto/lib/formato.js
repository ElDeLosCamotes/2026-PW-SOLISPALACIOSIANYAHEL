export function formatearFecha(fecha) {
    if (!fecha) return 'Fecha por confirmar';

    const texto = String(fecha);
    const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const valor = partes
        ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
        : new Date(texto);

    if (Number.isNaN(valor.getTime())) return 'Fecha por confirmar';

    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(valor);
}

export function ocultarBoleta(boleta) {
    const texto = String(boleta ?? '');
    return `${'*'.repeat(Math.max(0, texto.length - 4))}${texto.slice(-4)}`;
}
