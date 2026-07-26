import { APP_CONFIG, FALLBACK_MARKETS } from "./config.js";

const $ = (id) => document.getElementById(id);

export const UI = {
  elements: {},

  init() {
    const ids = [
      "connectionBadge",
      "connectionText",
      "marketSelect",
      "reconnectBtn",
      "livePrice",
      "priceChange",
      "lastTickTime",
      "tickCount",
      "latency",
      "priceChart",
      "analyzeBtn",
      "trendValue",
      "trendHint",
      "rsiValue",
      "rsiHint",
      "volatilityValue",
      "volatilityHint",
      "confidenceValue",
      "confidenceBar",
      "signalValue",
      "signalBadge",
      "analysisExplanation",
      "diagnosticLog"
    ];

    ids.forEach((id) => {
      this.elements[id] = $(id);
    });

    this.populateMarkets(FALLBACK_MARKETS);
  },

  populateMarkets(markets) {
    const select = this.elements.marketSelect;
    const current = select.value || APP_CONFIG.defaultSymbol;

    const unique = [
      ...new Map(
        markets.map((item) => [item.symbol, item])
      ).values()
    ]
      .filter((item) => item.symbol && item.name)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    select.innerHTML = "";

    unique.forEach((market) => {
      const option = document.createElement("option");
      option.value = market.symbol;
      option.textContent = market.name;
      select.appendChild(option);
    });

    select.value = unique.some((item) => item.symbol === current)
      ? current
      : APP_CONFIG.defaultSymbol;
  },

  setStatus(status) {
    const badge = this.elements.connectionBadge;

    badge.className = `status-badge status-${status}`;

    const texts = {
      online: "Conectado",
      offline: "Sin conexión",
      connecting: "Conectando…"
    };

    this.elements.connectionText.textContent =
      texts[status] || status;
  },

  setTick({ quote, epoch, pipSize }, previous, count) {
    const decimals =
      pipSize ?? this.inferDecimals(quote);

    this.elements.livePrice.textContent =
      quote.toLocaleString("es-SV", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

    const change =
      previous == null ? 0 : quote - previous;

    const changeEl =
      this.elements.priceChange;

    changeEl.className =
      `price-change ${
        change > 0
          ? "positive"
          : change < 0
          ? "negative"
          : "neutral"
      }`;

    changeEl.textContent =
      previous == null
        ? "Primer precio recibido"
        : `${
            change > 0
              ? "▲"
              : change < 0
              ? "▼"
              : "•"
          } ${Math.abs(change).toFixed(decimals)}`;

    this.elements.lastTickTime.textContent =
      new Date(epoch * 1000)
        .toLocaleTimeString("es-SV");

    this.elements.tickCount.textContent =
      String(count);
  },

  inferDecimals(value) {
    const text = String(value);

    return text.includes(".")
      ? Math.min(
          6,
          text.split(".")[1].length
        )
      : 2;
  },

  setLatency(ms) {
    this.elements.latency.textContent =
      `${ms} ms`;
  },

  renderAnalysis(result) {
    this.elements.trendValue.textContent =
      result.trend;

    this.elements.trendHint.textContent =
      result.trendHint;

    this.elements.rsiValue.textContent =
      result.rsi === null
        ? "--"
        : result.rsi.toFixed(1);

    this.elements.rsiHint.textContent =
      result.rsiHint;

    this.elements.volatilityValue.textContent =
      result.volatilityLabel;

    this.elements.volatilityHint.textContent =
      result.volatilityHint;

    this.elements.confidenceValue.textContent =
      result.ready
        ? `${result.confidence}%`
        : "--";

    this.elements.confidenceBar.style.width =
      `${result.confidence || 0}%`;

    this.elements.signalValue.textContent =
      result.signal;

    this.elements.analysisExplanation.textContent =
      result.explanation;

    const badge =
      this.elements.signalBadge;

    badge.className =
      `signal-badge signal-${result.signalType}`;

    badge.textContent =
      result.signalType === "buy"
        ? "ALCISTA"
        : result.signalType === "sell"
        ? "BAJISTA"
        : "ESPERAR";
  },

  drawChart(values) {
    const canvas =
      this.elements.priceChart;

    const rect =
      canvas.getBoundingClientRect();

    const dpr =
      Math.max(
        1,
        window.devicePixelRatio || 1
      );

    canvas.width =
      Math.round(rect.width * dpr);

    canvas.height =
      Math.round(rect.height * dpr);

    const ctx =
      canvas.getContext("2d");

    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    if (values.length < 2) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pad = 10;

    ctx.beginPath();

    values.forEach((value, index) => {
      const x =
        pad +
        (index / (values.length - 1)) *
          (width - pad * 2);

      const y =
        pad +
        ((max - value) / range) *
          (height - pad * 2);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        width,
        0
      );

    gradient.addColorStop(
      0,
      "#43d6ff"
    );

    gradient.addColorStop(
      1,
      "#4a8cff"
    );

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.stroke();
  },

  log(message) {
    const stamp =
      new Date()
        .toLocaleTimeString("es-SV");

    const lines =
      this.elements.diagnosticLog
        .textContent
        .split("\n")
        .slice(-18);

    lines.push(
      `[${stamp}] ${message}`
    );

    this.elements.diagnosticLog.textContent =
      lines.join("\n");

    this.elements.diagnosticLog.scrollTop =
      this.elements.diagnosticLog.scrollHeight;
  }
};
