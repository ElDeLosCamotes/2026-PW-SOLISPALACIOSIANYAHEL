export function validarNombre(nombre) {
    const valor = String(nombre).trim();
    return /^[A-Za-zÁÉÍÓÚÜÑñáéíóúü\s'-]+$/.test(valor) && valor.length >= 2;
}

export function validarFecha(fecha) {
    const valor = String(fecha ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

    const fechaDate = new Date(`${valor}T00:00:00`);
    if (Number.isNaN(fechaDate.getTime())) return false;

    return fechaDate.getFullYear() >= 1900;
}

export function validarBoleta(boleta) {
    return /^\d{10}$/.test(String(boleta).trim());
}
