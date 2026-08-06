const CONTRACTS = {
  MGC: {
    name: "Micro Gold",
    tickSize: 0.1,
    tickValue: 1,
    pointValue: 10,
    decimals: 1,
    exampleEntry: "例 3400.0",
    exampleSl: "例 3395.0"
  },
  MNQ: {
    name: "Micro E-mini Nasdaq-100",
    tickSize: 0.25,
    tickValue: 0.5,
    pointValue: 2,
    decimals: 2,
    exampleEntry: "例 23100.00",
    exampleSl: "例 23050.00"
  },
  MYM: {
    name: "Micro E-mini Dow",
    tickSize: 1,
    tickValue: 0.5,
    pointValue: 0.5,
    decimals: 0,
    exampleEntry: "例 44500",
    exampleSl: "例 44450"
  }
};

const $ = (id) => document.getElementById(id);

const entryInput = $("entryPrice");
const slInput = $("slPrice");
const riskValue = $("riskValue");
const resultHint = $("resultHint");
const pointDistance = $("pointDistance");
const tickDistance = $("tickDistance");
const pointValue = $("pointValue");
const resultPanel = $("resultPanel");
const infoSymbol = $("infoSymbol");
const infoDescription = $("infoDescription");
const resetButton = $("resetButton");
const offlineStatus = $("offlineStatus");
const statusText = $("statusText");

let activeSymbol = localStorage.getItem("riskOneSymbol") || "MGC";
if (!CONTRACTS[activeSymbol]) activeSymbol = "MGC";

function parseNumber(value) {
  const normalized = String(value).replace(/,/g, "").trim();
  if (normalized === "") return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function money(value) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function compactNumber(value, maxDecimals = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  });
}

function isTickAligned(value, tickSize) {
  const quotient = value / tickSize;
  return Math.abs(quotient - Math.round(quotient)) < 1e-7;
}

function calculate() {
  const entry = parseNumber(entryInput.value);
  const sl = parseNumber(slInput.value);
  const contract = CONTRACTS[activeSymbol];

  resultPanel.classList.remove("invalid");

  if (entry === null || sl === null) {
    riskValue.textContent = "—";
    resultHint.textContent = "価格を入力すると自動で計算します";
    pointDistance.textContent = "—";
    tickDistance.textContent = "—";
    pointValue.textContent = `$${contract.pointValue.toFixed(2)}`;
    return;
  }

  if (entry < 0 || sl < 0) {
    showError("0以上の価格を入力してください");
    return;
  }

  const distance = Math.abs(entry - sl);

  if (distance === 0) {
    riskValue.textContent = "0.00";
    resultHint.textContent = "Entry価格とSL価格が同じです";
    pointDistance.textContent = "0";
    tickDistance.textContent = "0";
    pointValue.textContent = `$${contract.pointValue.toFixed(2)}`;
    return;
  }

  const ticks = distance / contract.tickSize;
  const risk = distance * contract.pointValue;
  const direction = sl < entry ? "LONG想定" : "SHORT想定";

  riskValue.textContent = money(risk);
  pointDistance.textContent = `${compactNumber(distance, 4)} pt`;
  tickDistance.textContent = compactNumber(ticks, 2);
  pointValue.textContent = `$${contract.pointValue.toFixed(2)}`;

  const aligned = isTickAligned(entry, contract.tickSize) && isTickAligned(sl, contract.tickSize);
  resultHint.textContent = aligned
    ? `${direction}・1枚あたりの想定損失`
    : `${direction}・価格が最小tick単位に一致していません`;
}

function showError(message) {
  resultPanel.classList.add("invalid");
  riskValue.textContent = "—";
  resultHint.textContent = message;
  pointDistance.textContent = "—";
  tickDistance.textContent = "—";
  pointValue.textContent = `$${CONTRACTS[activeSymbol].pointValue.toFixed(2)}`;
}

function setSymbol(symbol) {
  activeSymbol = symbol;
  localStorage.setItem("riskOneSymbol", symbol);
  const contract = CONTRACTS[symbol];

  document.querySelectorAll(".symbol-tab").forEach((button) => {
    const selected = button.dataset.symbol === symbol;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-checked", String(selected));
  });

  entryInput.placeholder = contract.exampleEntry;
  slInput.placeholder = contract.exampleSl;
  entryInput.step = String(contract.tickSize);
  slInput.step = String(contract.tickSize);

  infoSymbol.textContent = symbol;
  infoDescription.textContent =
    `1 point = $${contract.pointValue.toFixed(2)} / 1 tick = $${contract.tickValue.toFixed(2)}`;

  calculate();
}

function reset() {
  entryInput.value = "";
  slInput.value = "";
  calculate();
  entryInput.focus();
}

function updateConnectionStatus() {
  const online = navigator.onLine;
  offlineStatus.classList.toggle("offline", !online);
  statusText.textContent = online ? "ONLINE" : "OFFLINE";
}

document.querySelectorAll(".symbol-tab").forEach((button) => {
  button.addEventListener("click", () => setSymbol(button.dataset.symbol));
});

[entryInput, slInput].forEach((input) => {
  input.addEventListener("input", calculate);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (input === entryInput) slInput.focus();
      else input.blur();
    }
  });
});

document.querySelectorAll(".clear-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const input = $(button.dataset.clear);
    input.value = "";
    input.focus();
    calculate();
  });
});

resetButton.addEventListener("click", reset);
window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

setSymbol(activeSymbol);
updateConnectionStatus();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
