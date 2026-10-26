const BACKEND_CAIDO = 'El backend no responde. Revisa que Express esté ejecutándose en el puerto 4000.';

export async function pedirJSON(ruta, opciones = {}) {
    let respuesta;

    try {
        respuesta = await fetch(`/api${ruta}`, {
            ...opciones,
            headers: {
                'Content-Type': 'application/json',
                ...opciones.headers,
            },
        });
    } catch {
        throw new Error(BACKEND_CAIDO);
    }

    let datos = null;
    try {
        datos = await respuesta.json();
    } catch {
        datos = null;
    }

    if (!respuesta.ok) {
        if (datos && datos.error) {
            throw new Error(datos.error);
        }
        if (respuesta.status >= 500) {
            throw new Error(BACKEND_CAIDO);
        }
        throw new Error(`El backend respondió ${respuesta.status}.`);
    }

    return datos;
}
