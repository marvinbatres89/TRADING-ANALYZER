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
      ticks: "1HZ100V
