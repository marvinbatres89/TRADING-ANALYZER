// Todo el resto de tu código queda debajo
const boton = document.getElementById("analizarBtn");
...
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
      ticks:ticks: "1HZ100V", 
      subscribe: 1
    })
  );
};

socket.onmessage = function (evento) {
  const datos = JSON.parse(evento.data);

  if (datos.error) {
    tendencia.textContent = "Error: " + datos.error.message;
    return;
  }

  if (datos.tick) {
    precios.push(Number(datos.tick.quote));

    if (precios.length > 30) {
      precios.shift();
    }

    tendencia.textContent =
      "Precio recibido: " + datos.tick.quote;
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
      "Solo hay " + precios.length + " precios recibidos";
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
    } else {
      perdidas += Math.abs(cambio);
    }
  }

  const promedioGanancias = ganancias / (precios.length - 1);
  const promedioPerdidas = perdidas / (precios.length - 1);

  if (promedioPerdidas === 0) {
    rsi.textContent = "100";
  } else {
    const rs = promedioGanancias / promedioPerdidas;
    const valorRSI = 100 - 100 / (1 + rs);
    rsi.textContent = valorRSI.toFixed(2);
  }

  volatilidad.textContent =
    (sumaCambios / (precios.length - 1)).toFixed(3);
};