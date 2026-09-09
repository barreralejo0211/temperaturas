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

/* ---------- Leer en voz alta (botón 🔊 Escuchar) ---------- */

const soporteVoz = 'speechSynthesis' in window;
const botonesVoz = document.querySelectorAll('.btn-voz');
let hablando = false;

function conseguirVozEspanol() {
  const voces = window.speechSynthesis.getVoices();
  return voces.find((v) => /^es/i.test(v.lang)) || null;
}

function detenerVoz() {
  if (soporteVoz) window.speechSynthesis.cancel();
}

function resetBotonVoz() {
  botonesVoz.forEach((b) => {
    b.classList.remove('escuchando');
    b.textContent = '🔊 Escuchar';
    b.setAttribute('aria-label', 'Escuchar el resultado en voz alta');
  });
}

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

if (soporteVoz) {
  /* Algunos navegadores cargan las voces con retraso */
  window.speechSynthesis.onvoiceschanged = conseguirVozEspanol;
} else {
  botonesVoz.forEach((b) => {
    b.disabled = true;
    b.title = 'Tu navegador no soporta la lectura en voz alta';
  });
}

botonesVoz.forEach((boton) => {
  boton.addEventListener('click', () => {
    if (!soporteVoz) return;

    if (hablando) {
      detenerVoz();
      resetBotonVoz();
      hablando = false;
      return;
    }

    detenerVoz();
    resetBotonVoz();

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
    };
    mensaje.onend = () => {
      hablando = false;
      resetBotonVoz();
    };
    mensaje.onerror = () => {
      hablando = false;
      resetBotonVoz();
    };

    window.speechSynthesis.speak(mensaje);
  });
});

/* ---------- Modo claro / oscuro (botón ☀️ / 🌙) ---------- */

const botonTema = document.getElementById('cambiar-tema');
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