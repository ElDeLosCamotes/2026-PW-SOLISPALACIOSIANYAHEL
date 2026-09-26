// 02-objetos-json.js
// Object.keys/values/entries y JSON.stringify/parse. Completa cada TODO.

const formularioObjetos = document.getElementById('formulario-objetos');
const seleccionTaller = document.getElementById('taller-objeto');
const operacionObjeto = document.getElementById('operacion-objeto');
const resultadoObjeto = document.getElementById('resultado-objeto');

talleres.forEach((taller, indice) => {
  const opcion = document.createElement('option');
  opcion.value = String(indice);
  opcion.textContent = taller.nombre;
  seleccionTaller.append(opcion);
});

formularioObjetos.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const taller = talleres[Number(seleccionTaller.value)];
  let resultado;

  if (operacionObjeto.value === 'keys') {
    resultado = Object.keys(taller).join('\n');
  } else if (operacionObjeto.value === 'values') {
    resultado = Object.values(taller).join('\n');
  } else {
    resultado = '';
    for (const [campo, valor] of Object.entries(taller)) {
      resultado += `${campo}: ${valor}\n`;
    }
    resultado = resultado.trimEnd();
  }

  resultadoObjeto.textContent = resultado;
});

// TODO: JSON.stringify — convierte `taller` a texto (guárdalo en `textoJson`) e imprímelo

// TODO: JSON.parse — convierte `textoJson` de vuelta a objeto (guárdalo en `objetoDeVuelta`)
//       e imprime `objetoDeVuelta.nombre`