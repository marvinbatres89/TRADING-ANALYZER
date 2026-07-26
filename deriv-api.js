import { APP_CONFIG, FALLBACK_MARKETS } from "./config.js";

export class DerivAPI {
  constructor(callbacks = {}) {
    this.socket = null;
    this.callbacks = callbacks;
    this.currentSymbol = APP_CONFIG.defaultSymbol;
    this.subscriptionId = null;
    this.reconnectTimer = null;
    this.manualClose = false;
  }

  connect() {
    this.manualClose = false;
    clearTimeout(this.reconnectTimer);

    this.callbacks.onStatus?.("connecting");
    this.callbacks.onLog?.("Intentando conectar con Deriv...");

    try this.socket = new WebSocket(
  APP_CONFIG.websocketUrl
);
    } catch (error) {
      this.callbacks.onError?.(
        "No se pudo iniciar la conexión: " + error.message
      );
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.callbacks.onStatus?.("online");
      this.callbacks.onLog?.(
        "Conexión con Deriv establecida correctamente."
      );

      this.requestActiveSymbols();
      this.subscribeTicks(this.currentSymbol);
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.socket.onerror = () => {
      this.callbacks.onError?.(
        "El navegador informó un error de conexión WebSocket."
      );
    };

    this.socket.onclose = (event) => {
      this.callbacks.onStatus?.("offline");
      this.callbacks.onLog?.(
        `Conexión cerrada. Código: ${event.code}`
      );

      if (!this.manualClose) {
        this.scheduleReconnect();
      }
    };
  }

  send(data) {
    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      this.callbacks.onError?.(
        "No se pudo enviar la solicitud porque la conexión no está abierta."
      );
      return false;
    }

    this.socket.send(JSON.stringify(data));
    return true;
  }

  requestActiveSymbols() {
    this.send({
      active_symbols: "brief",
      product_type: "basic",
      req_id: 1
    });
  }

  subscribeTicks(symbol) {
    this.currentSymbol = symbol;

    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    if (this.subscriptionId) {
      this.send({
        forget: this.subscriptionId
      });

      this.subscriptionId = null;
    }

    this.send({
      ticks: symbol,
      subscribe: 1,
      req_id: 2
    });

    this.callbacks.onLog?.(
      `Solicitando precios de ${symbol}...`
    );
  }

  handleMessage(event) {
    let data;

    try {
      data = JSON.parse(event.data);
    } catch (error) {
      this.callbacks.onError?.(
        "Deriv envió una respuesta que no pudo leerse."
      );
      return;
    }

    if (data.error) {
      this.callbacks.onError?.(
        `${data.error.code}: ${data.error.message}`
      );
      return;
    }

    if (data.msg_type === "active_symbols") {
      const markets =
        Array.isArray(data.active_symbols) &&
        data.active_symbols.length > 0
          ? data.active_symbols.map((market) => ({
              symbol: market.symbol,
              name:
                market.display_name ||
                market.symbol
            }))
          : FALLBACK_MARKETS;

      this.callbacks.onMarkets?.(markets);

      this.callbacks.onLog?.(
        `${markets.length} mercados disponibles.`
      );

      return;
    }

    if (
      data.msg_type === "tick" &&
      data.tick
    ) {
      this.subscriptionId =
        data.subscription?.id ||
        this.subscriptionId;

      this.callbacks.onTick?.({
        symbol: data.tick.symbol,
        quote: Number(data.tick.quote),
        epoch: Number(data.tick.epoch),
        pipSize:
          Number.isInteger(data.tick.pip_size)
            ? data.tick.pip_size
            : null
      });

      return;
    }

    if (data.msg_type === "ping") {
      this.callbacks.onLatency?.(0);
    }
  }

  reconnect() {
    this.disconnect();

    setTimeout(() => {
      this.connect();
    }, 500);
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);

    this.callbacks.onLog?.(
      "Intentando reconectar en 3 segundos..."
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  disconnect() {
    this.manualClose = true;
    clearTimeout(this.reconnectTimer);

    if (this.socket) {
      this.socket.close();
    }
  }
}
