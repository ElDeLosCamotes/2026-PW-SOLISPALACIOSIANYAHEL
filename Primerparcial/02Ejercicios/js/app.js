function pintarTabla(){
const cuerpoTabla = document.querySelector('#tabla-talleres tbody');
cuerpoTabla.innerHTML = '';

talleres.forEach((t) => {
    cuerpoTabla.innerHTML += `
    <tr>
        <td>${t.nombre}</td>
        <td>${t.instructor}</td>
        <td>${t.cupo}</td>
        <td>${t.inscritos}</td>
    </tr>`;
});
}

const formArreglos = document.getElementById('formulario-arreglos');
const resultadoArreglos = document.getElementById('resultado-arreglo');
const selectOperacionArreglo = document.getElementById('operacion-arreglo');

formArreglos.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const operacion = selectOperacionArreglo.value;

        let resultado;

        switch(operacion){
            case 'forEach' :
            resultado = talleres.map((t) => `- ${t.nombre} (${t.inscritos}/${t.cupo})`).join('\n');
            break;
        case 'map' :
            resultado = nombres.join('\n');
            break;
        case 'filter' :
            resultado = llenos.map((t) => t.nombre).join('\n');
            break;
        case 'find' :
            resultado = tallerMaria.nombre;
            break;
        case 'reduce' :
            resultado = totalInscritos;
            break;
        case 'disponibles' :
            resultado = talleresDisponibles.join('\n');
                break;
        }

        resultadoArreglos.textContent = resultado;
})

    pintarTabla();