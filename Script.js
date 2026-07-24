const boton = document.getElementById("analizarBtn");
const tendencia = document.getElementById("tendencia");
const rsi = document.getElementById("rsi");
const volatilidad = document.getElementById("volatilidad");

let precios = [];

tendencia.textContent = "Conectando con Deriv...";

const socket = new WebSocket(
  "wss://ws.derivws.com/websockets/v3?app_id=1089"
);

socket.onopen = function () {
  tendencia.textContent = "Conectado. Recibiendo precios...";

  socket.send(
    JSON.stringify({
      ticks: "1HZ100V",
      subscribe: 1
    })
  );
};

socket.onmessage = function (evento) {
  const datos = JSON.parse(evento.data);

  console.log("Datos recibidos:", datos);

  if (datos.error) {
    tendencia.textContent = "Error: " + datos.error.message;
    return;
  }

  if (datos.tick) {
    const precioActual = Number(datos.tick.quote);

    precios.push(precioActual);

    if (precios.length > 30) {
      precios.shift();
    }

    tendencia.textContent =
      "Precio recibido: " + precioActual;
  }
};

socket.onerror = function () {
  tendencia.textContent = "Error de conexión WebSocket";
};

socket.onclose = function (evento) {
  tendencia.textContent =
    "Conexión cerrada. Código: " + evento.code;
};

boton.onclick = function () {
  if (precios.length < 10) {
    tendencia.textContent =
      "Solo hay " + precios.length + " precios recibidos. Espera unos segundos.";

    rsi.textContent = "--";
    volatilidad.textContent = "--";
    return;
  }

  const primero = precios[0];
  const ultimo = precios[precios.length - 1];

  if (ultimo > primero) {
    tendencia.textContent = "Alcista 📈";
  } else if (ultimo < primero) {
    tendencia.textContent = "Bajista 📉";
  } else {
    tendencia.textContent = "Lateral ➖";
  }

  let ganancias = 0;
  let perdidas = 0;
  let sumaCambios = 0;

  for (let i = 1; i < precios.length; i++) {
    const cambio = precios[i] - precios[i - 1];

    sumaCambios += Math.abs(cambio);

    if (cambio > 0) {
      ganancias += cambio;
    } else if (cambio < 0) {
      perdidas += Math.abs(cambio);
    }
  }

  const cantidadCambios = precios.length - 1;
  const promedioGanancias = ganancias / cantidadCambios;
  const promedioPerdidas = perdidas / cantidadCambios;

  let valorRSI;

  if (promedioPerdidas === 0 && promedioGanancias === 0) {
    valorRSI = 50;
  } else if (promedioPerdidas === 0) {
    valorRSI = 100;
  } else {
    const rs = promedioGanancias / promedioPerdidas;
    valorRSI = 100 - 100 / (1 + rs);
  }

  rsi.textContent = valorRSI.toFixed(2);

  const valorVolatilidad =
    sumaCambios / cantidadCambios;

  volatilidad.textContent =
    valorVolatilidad.toFixed(3);
};