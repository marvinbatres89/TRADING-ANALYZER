const boton = document.getElementById("analizarBtn");
const tendencia = document.getElementById("tendencia");
const rsi = document.getElementById("rsi");
const volatilidad = document.getElementById("volatilidad");

let precios = [];
let conectado = false;

// Texto inicial
tendencia.textContent = "Conectando con Deriv...";
rsi.textContent = "--";
volatilidad.textContent = "--";

const socket = new WebSocket(
  "wss://ws.derivws.com/websockets/v3?app_id=1089"
);
// Cuando la conexión se abre
socket.onopen = function () {
  conectado = true;

  tendencia.textContent =
    "Conectado. Esperando precios...";

  socket.send(
  JSON.stringify({
    ticks: "1HZ100V",
    subscribe: 1,
    req_id: 1
  })
);
);
  
// Cuando Deriv envía información
socket.onmessage = function (evento) {
  const datos = JSON.parse(evento.data);

  console.log("Respuesta de Deriv:", datos);

  if (datos.error) {
    tendencia.textContent =
      "Error: " + datos.error.message;
    return;
  }

  if (datos.tick) {
    const precioActual = Number(datos.tick.quote);

    precios.push(precioActual);

    // Conservamos únicamente los últimos 100 precios
    if (precios.length > 100) {
      precios.shift();
    }

    tendencia.textContent =
      "Precio actual: " + precioActual;

    // Análisis automático después de reunir 30 precios
    if (precios.length >= 30) {
      analizarMercado();
    }
  }
};

// Error de conexión
socket.onerror = function () {
  conectado = false;

  tendencia.textContent =
    "No se pudo conectar con Deriv.";
};

// Conexión cerrada
socket.onclose = function () {
  conectado = false;

  tendencia.textContent =
    "La conexión con Deriv se cerró.";
};

// Botón para analizar manualmente
boton.addEventListener("click", function () {
  if (!conectado) {
    alert("Todavía no hay conexión con Deriv.");
    return;
  }

  if (precios.length < 15) {
    alert(
      "Todavía faltan precios. Espera unos segundos."
    );
    return;
  }

  analizarMercado();
});

// Ejecuta todos los cálculos
function analizarMercado() {
  calcularTendencia();
  calcularRSI();
  calcularVolatilidad();
}

// Calcula la tendencia
function calcularTendencia() {
  const cantidad = Math.min(20, precios.length);
  const recientes = precios.slice(-cantidad);

  const mitad = Math.floor(recientes.length / 2);

  const primeraMitad = recientes.slice(0, mitad);
  const segundaMitad = recientes.slice(mitad);

  const promedioAnterior =
    obtenerPromedio(primeraMitad);

  const promedioActual =
    obtenerPromedio(segundaMitad);

  if (promedioActual > promedioAnterior) {
    tendencia.textContent =
      "Tendencia alcista 📈";
  } else if (promedioActual < promedioAnterior) {
    tendencia.textContent =
      "Tendencia bajista 📉";
  } else {
    tendencia.textContent =
      "Tendencia lateral ➡️";
  }
}

// Calcula el RSI de 14 periodos
function calcularRSI() {
  const periodo = 14;

  if (precios.length < periodo + 1) {
    rsi.textContent =
      "Esperando más datos...";
    return;
  }

  const recientes =
    precios.slice(-(periodo + 1));

  let ganancias = 0;
  let perdidas = 0;

  for (let i = 1; i < recientes.length; i++) {
    const cambio =
      recientes[i] - recientes[i - 1];

    if (cambio > 0) {
      ganancias += cambio;
    } else {
      perdidas += Math.abs(cambio);
    }
  }

  const promedioGanancias =
    ganancias / periodo;

  const promedioPerdidas =
    perdidas / periodo;

  let valorRSI;

  if (promedioPerdidas === 0) {
    valorRSI = 100;
  } else {
    const fuerzaRelativa =
      promedioGanancias / promedioPerdidas;

    valorRSI =
      100 - 100 / (1 + fuerzaRelativa);
  }

  let resultado = valorRSI.toFixed(2);

  if (valorRSI >= 70) {
    resultado += " — Sobrecompra";
  } else if (valorRSI <= 30) {
    resultado += " — Sobreventa";
  } else {
    resultado += " — Zona neutral";
  }

  rsi.textContent = resultado;
}

// Calcula la volatilidad
function calcularVolatilidad() {
  const cantidad =
    Math.min(30, precios.length);

  const recientes =
    precios.slice(-cantidad);

  const promedio =
    obtenerPromedio(recientes);

  let sumaDiferencias = 0;

  recientes.forEach(function (precio) {
    sumaDiferencias +=
      Math.pow(precio - promedio, 2);
  });

  const desviacion = Math.sqrt(
    sumaDiferencias / recientes.length
  );

  const porcentaje =
    promedio !== 0
      ? (desviacion / promedio) * 100
      : 0;

  let nivel;

  if (porcentaje < 0.005) {
    nivel = "Baja";
  } else if (porcentaje < 0.02) {
    nivel = "Media";
  } else {
    nivel = "Alta";
  }

  volatilidad.textContent =
    nivel +
    " — " +
    porcentaje.toFixed(4) +
    "%";
}

// Calcula el promedio de una lista
function obtenerPromedio(lista) {
  if (lista.length === 0) {
    return 0;
  }

  let suma = 0;

  lista.forEach(function (numero) {
    suma += numero;
  });

  return suma / lista.length;
}
