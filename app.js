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