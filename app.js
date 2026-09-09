'use strict';

/* =========================================================
   Termómetro Fácil — lógica de conversión
   Convierte en vivo entre Celsius, Fahrenheit y Kelvin.
   ========================================================= */

const entradas = {
  C: document.getElementById('celsius'),
  F: document.getElementById('fahrenheit'),
  K: document.getElementById('kelvin'),
};

const tarjetas = {
  C: document.getElementById('tarjeta-c'),
  F: document.getElementById('tarjeta-f'),
  K: document.getElementById('tarjeta-k'),
};

const errorEl = document.getElementById('error');
const botonLimpiar = document.getElementById('limpiar');
const btnMasPequeno = document.getElementById('mas-pequeno');
const btnMasGrande = document.getElementById('mas-grande');

/* Evita bucles cuando el programa rellena los campos */
let actualizando = false;

/* Estado de la voz: se declara al principio con valores seguros,
   para que cualquier botón (ejemplos, limpiar, escribir) pueda
   parar la lectura aunque el bloque de voz aún no se haya iniciado. */
let hablando = false;
let detenerVoz = function () {};
let resetBotonVoz = function () {};

/* ---------- Formato de números ---------- */

function formatear(valor) {
  if (!Number.isFinite(valor)) return '';
  const redondeado = Math.round(valor * 100) / 100;
  if (redondeado === 0) return '0';
  return String(redondeado);
}

function ponerValor(unidad, valor) {
  entradas[unidad].value = valor === '' ? '' : formatear(valor);
}

/* ---------- Errores ---------- */

function mostrarError(mensaje) {
  errorEl.textContent = mensaje;
  errorEl.classList.add('visible');
}

function ocultarError() {
  errorEl.textContent = '';
  errorEl.classList.remove('visible');
}

/* ---------- Lectura de lo que escribe la persona ---------- */

/* Número a medio escribir ("-", "12.") no cuenta como error */
const parcial = /^-?\d*\.?\d*$/;

function leerNumero(unidad) {
  const texto = entradas[unidad].value.trim();
  if (texto === '') return null; /* campo vacío: sin error */

  const normalizado = texto.replace(',', '.');
  const numero = Number(normalizado);

  if (Number.isNaN(numero)) {
    if (parcial.test(normalizado)) return null; /* a medio escribir */
    return NaN; /* texto raro, sí es error */
  }
  return numero;
}

/* ---------- Conversión ---------- */

function convertir(origen, valor) {
  let celsius;
  if (origen === 'C') {
    celsius = valor;
  } else if (origen === 'F') {
    celsius = (valor - 32) * 5 / 9;
  } else {
    celsius = valor - 273.15; /* origen === 'K' */
  }

  const kelvin = celsius + 273.15;
  if (kelvin < 0) {
    mostrarError('Esa temperatura no existe: la más baja posible es −273,15 °C (0 K).');
    if (origen !== 'C') ponerValor('C', '');
    if (origen !== 'F') ponerValor('F', '');
    if (origen !== 'K') ponerValor('K', '');
    return;
  }

  ocultarError();
  if (origen !== 'F') ponerValor('F', celsius * 9 / 5 + 32);
  if (origen !== 'K') ponerValor('K', kelvin);
  if (origen !== 'C') ponerValor('C', celsius);
}

/* ---------- Eventos de los tres campos ---------- */

function alEscribir(unidad) {
  if (actualizando) return;

  if (hablando) {
    detenerVoz();
    resetBotonVoz();
    hablando = false;
  }

  const valor = leerNumero(unidad);

  if (valor === null) {
    /* Campo vacío o a medio escribir: limpiamos los otros dos */
    ocultarError();
    actualizando = true;
    ['C', 'F', 'K'].forEach((u) => {
      if (u !== unidad) entradas[u].value = '';
    });
    actualizando = false;
    return;
  }

  if (Number.isNaN(valor)) {
    mostrarError('Escribe un número, por ejemplo: 20 o 37,5.');
    return;
  }

  convertir(unidad, valor);
}

Object.keys(entradas).forEach((unidad) => {
  const input = entradas[unidad];

  input.addEventListener('input', () => alEscribir(unidad));

  input.addEventListener('focus', () => {
    tarjetas[unidad].classList.add('activo');
    input.select(); /* al tocar el campo se selecciona para escribir encima */
  });

  input.addEventListener('focusout', () => {
    tarjetas[unidad].classList.remove('activo');
  });
});

/* ---------- Ejemplos rápidos ---------- */

document.querySelectorAll('.btn-ejemplo').forEach((boton) => {
  boton.addEventListener('click', () => {
    if (hablando) {
      detenerVoz();
      resetBotonVoz();
      hablando = false;
    }
    const celsius = Number(boton.dataset.c);
    entradas.C.value = String(celsius);
    ocultarError();
    convertir('C', celsius);
    tarjetas.C.classList.add('activo');
    entradas.C.focus();
  });
});

/* ---------- Botón limpiar ---------- */

botonLimpiar.addEventListener('click', () => {
  if (hablando) {
    detenerVoz();
    resetBotonVoz();
    hablando = false;
  }
  Object.values(entradas).forEach((input) => {
    input.value = '';
  });
  ocultarError();
  Object.values(tarjetas).forEach((tarjeta) => {
    tarjeta.classList.remove('activo');
  });
});

/* ---------- Tamaño del texto (A− / A+) ---------- */

const TAMANOS = [18, 20, 24, 28];
const CLAVE_GUARDADO = 'convertidor-tamano-texto';
let indiceTamano = 1; /* 20px por defecto */

try {
  const guardado = Number(localStorage.getItem(CLAVE_GUARDADO));
  if (Number.isInteger(guardado) && guardado >= 0 && guardado < TAMANOS.length) {
    indiceTamano = guardado;
  }
} catch (e) {
  /* sin almacenamiento disponible: se usa el tamaño por defecto */
}

function aplicarTamano() {
  document.documentElement.style.setProperty('--fs', TAMANOS[indiceTamano] + 'px');
  btnMasPequeno.disabled = indiceTamano === 0;
  btnMasGrande.disabled = indiceTamano === TAMANOS.length - 1;
  try {
    localStorage.setItem(CLAVE_GUARDADO, String(indiceTamano));
  } catch (e) {
    /* se ignora: el tamaño se aplica igualmente en esta sesión */
  }
}

btnMasPequeno.addEventListener('click', () => {
  if (indiceTamano > 0) {
    indiceTamano -= 1;
    aplicarTamano();
  }
});

btnMasGrande.addEventListener('click', () => {
  if (indiceTamano < TAMANOS.length - 1) {
    indiceTamano += 1;
    aplicarTamano();
  }
});

aplicarTamano();

/* =========================================================
   Leer en voz alta (botón 🔊 Escuchar)
   Todo el bloque va aislado: si el navegador no soporta voz
   o falla algo, el resto de la app sigue funcionando.
   ========================================================= */

try {
  const soporteVoz = 'speechSynthesis' in window;
  const botonesVoz = document.querySelectorAll('.btn-voz');

  if (soporteVoz) {
    const speech = window.speechSynthesis;

    /* Chrome carga la lista de voces con retraso.
       Hay que pedirlas al cargar la página y de nuevo al hablar,
       si no, a veces el sonido no arranca (bug conocido). */
    function prepararVoces() {
      try {
        speech.getVoices();
      } catch (e) {
        /* se ignora */
      }
    }
    prepararVoces();
    speech.onvoiceschanged = prepararVoces;

    function conseguirVozEspanol() {
      try {
        const voces = speech.getVoices();
        return voces.find((v) => /^es/i.test(v.lang)) || null;
      } catch (e) {
        return null;
      }
    }

    detenerVoz = function () {
      try {
        speech.cancel();
      } catch (e) {
        /* se ignora */
      }
    };

    resetBotonVoz = function () {
      botonesVoz.forEach((b) => {
        b.classList.remove('escuchando');
        b.textContent = '🔊 Escuchar';
        b.setAttribute('aria-label', 'Escuchar el resultado en voz alta');
      });
    };

    function textoParaLeer(unidad) {
      const valor = entradas[unidad].value.trim();
      if (valor === '') {
        return 'No hay ninguna temperatura escrita. Escribe un número y vuelve a pulsar escuchar.';
      }

      const nombres = { C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' };
      const equivalencias = [
        ['C', 'Celsius'],
        ['F', 'Fahrenheit'],
        ['K', 'Kelvin'],
      ].filter(([u]) => u !== unidad && entradas[u].value.trim() !== '');

      if (equivalencias.length === 0) {
        return 'Esa temperatura no se puede convertir. Pulsa limpiar y escribe otra.';
      }

      const frases = [`El resultado es: ${valor} grados ${nombres[unidad]} equivalen a`];
      equivalencias.forEach(([u, nombre], i) => {
        frases.push(`${entradas[u].value.trim()} grados ${nombre}`);
        if (i < equivalencias.length - 1) frases.push('y a');
      });
      frases.push('.');
      return frases.join(' ');
    }

    /* En iPhone/iPad, la voz necesita un reinicio antes de hablar;
       en el resto de navegadores, ese reinicio puede cancelar la lectura. */
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    botonesVoz.forEach((boton) => {
      boton.addEventListener('click', () => {
        /* Si ya está hablando, este clic para la lectura */
        if (hablando) {
          detenerVoz();
          hablando = false;
          resetBotonVoz();
          return;
        }

        try {
          resetBotonVoz();
          prepararVoces(); /* refrescar la lista de voces justo antes de hablar */

          if (esIOS) speech.cancel(); /* solo en iOS: prepara el motor de voz */

          let intentos = 0;
          let temporizador = null;

          function intentarHablar() {
            intentos += 1;

            const mensaje = new SpeechSynthesisUtterance(textoParaLeer(boton.dataset.unidad));
            mensaje.lang = 'es-ES';
            mensaje.rate = 0.9; /* un poco más lento: más fácil de seguir */

            const voz = conseguirVozEspanol();
            if (voz) mensaje.voice = voz;

            mensaje.onstart = () => {
              hablando = true;
              boton.classList.add('escuchando');
              boton.textContent = '⏹ Parar';
              boton.setAttribute('aria-label', 'Parar la lectura');
              window.clearTimeout(temporizador);
            };
            mensaje.onend = () => {
              hablando = false;
              resetBotonVoz();
            };
            mensaje.onerror = () => {
              hablando = false;
              resetBotonVoz();
            };

            speech.speak(mensaje);

            /* Si en 1 segundo la voz no ha arrancado, reintentamos una vez:
               a veces las voces aún no han cargado y el sonido falla en
               silencio (bug conocido de Chrome y otros). */
            window.clearTimeout(temporizador);
            temporizador = window.setTimeout(() => {
              if (hablando || speech.speaking || speech.pending) return;
              if (intentos < 2) {
                prepararVoces();
                intentarHablar();
              } else {
                mostrarError('No he podido activar la voz en este navegador. Prueba con Chrome o Edge, o comprueba que tu equipo tenga voces instaladas.');
                resetBotonVoz();
              }
            }, 1000);
          }

          intentarHablar();
        } catch (e) {
          mostrarError('No se pudo usar la voz en este navegador.');
          resetBotonVoz();
        }
      });
    });
  } else {
    /* El navegador no soporta lectura en voz alta: se desactiva y se explica */
    botonesVoz.forEach((b) => {
      b.disabled = true;
      b.title = 'Tu navegador no soporta la lectura en voz alta';
    });
  }
} catch (e) {
  /* Si algo de la voz falla, la app sigue funcionando */
}

/* =========================================================
   Modo claro / oscuro (botón ☀️ / 🌙)
   También aislado: nunca depende de la voz ni de otro bloque.
   ========================================================= */

try {
  const botonTema = document.getElementById('cambiar-tema');
  if (!botonTema) throw new Error('Botón de tema no encontrado');

  const CLAVE_TEMA = 'convertidor-tema';
  let temaClaro = false;

  try {
    temaClaro = localStorage.getItem(CLAVE_TEMA) === 'claro';
  } catch (e) {
    /* sin almacenamiento: se usa el tema oscuro por defecto */
  }

  function aplicarTema() {
    document.documentElement.dataset.tema = temaClaro ? 'claro' : 'oscuro';
    botonTema.textContent = temaClaro ? '🌙 Modo oscuro' : '☀️ Modo claro';
    botonTema.setAttribute('aria-label', temaClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    try {
      localStorage.setItem(CLAVE_TEMA, temaClaro ? 'claro' : 'oscuro');
    } catch (e) {
      /* se ignora: el tema se aplica igualmente en esta sesión */
    }
  }

  botonTema.addEventListener('click', () => {
    temaClaro = !temaClaro;
    aplicarTema();
  });

  aplicarTema();
} catch (e) {
  /* Si el tema falla, el resto de la app sigue funcionando */
}