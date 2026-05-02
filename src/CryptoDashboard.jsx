import { useState, useEffect, useRef, useCallback } from "react";
import "./CryptoDashboard.css";


const MAX = 20;

const COINS = {
  btc: { label: "Bitcoin",  icon: "₿", color: "#f7931a" },
  eth: { label: "Ethereum", icon: "Ξ", color: "#627eea" },
  sol: { label: "Solana",   icon: "◎", color: "#9945ff" },
};

const fmt  = (n) => n >= 1000 ? "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "$" + Number(n).toFixed(2);
const fmts = (n) => n >= 10000 ? "$" + (n / 1000).toFixed(1) + "k" : n >= 1000 ? "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "$" + Number(n).toFixed(1);

const emptyState = {
  btc: { prices: [], times: [], high: 0, low: 0 },
  eth: { prices: [], times: [], high: 0, low: 0 },
  sol: { prices: [], times: [], high: 0, low: 0 },
};

// Chart
function Chart({ prices, times, chartType, color }) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || prices.length === 0) return;

    const wrap = cv.parentElement;
    cv.width = wrap.clientWidth;
    cv.height = wrap.clientHeight;

    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;

    const minP = Math.min(...prices) * 0.998;
    const maxP = Math.max(...prices) * 1.002;
    const range = maxP - minP || 1;

    const toX = (i) => (i / (prices.length - 1)) * W;
    const toY = (p) => H - ((p - minP) / range) * H;

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(128,128,128,0.12)";
    ctx.lineWidth = 1;
    for (let r = 0; r <= 4; r++) {
      const y = (r / 4) * H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    if (chartType === "bar") {
      const bw = Math.max(2, W / prices.length - 2);
      prices.forEach((p, i) => {
        const x = toX(i) - bw / 2;
        const y = toY(p);
        ctx.fillStyle = color + "33";
        ctx.fillRect(x, y, bw, H - y);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, bw, 2);
      });

    } else if (chartType === "dot") {
      ctx.beginPath();
      ctx.strokeStyle = color + "40";
      prices.forEach((p, i) =>
        i === 0 ? ctx.moveTo(toX(i), toY(p)) : ctx.lineTo(toX(i), toY(p))
      );
      ctx.stroke();

      prices.forEach((p, i) => {
        const isLast = i === prices.length - 1;
        ctx.beginPath();
        ctx.arc(toX(i), toY(p), isLast ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isLast ? color : color + "99";
        ctx.fill();
      });

    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, color + "33");
      grad.addColorStop(1, color + "00");

      ctx.beginPath();
      prices.forEach((p, i) =>
        i === 0 ? ctx.moveTo(toX(i), toY(p)) : ctx.lineTo(toX(i), toY(p))
      );
      ctx.lineTo(toX(prices.length - 1), H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      prices.forEach((p, i) =>
        i === 0 ? ctx.moveTo(toX(i), toY(p)) : ctx.lineTo(toX(i), toY(p))
      );
      ctx.stroke();
    }
  }, [prices, chartType, color]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, [draw]);

  const minP = prices.length ? Math.min(...prices) * 0.998 : 0;
  const maxP = prices.length ? Math.max(...prices) * 1.002 : 1;
  const range = maxP - minP || 1;

  const yLabels = Array.from({ length: 5 }, (_, r) =>
    fmts(minP + range * (4 - r) / 4)
  );

  const step = Math.floor(prices.length / 4) || 1;
  const xLabels = [0, step, step * 2, step * 3, prices.length - 1]
    .map(i => times[i] || "");

  return (
    <div className="cd-chart-wrap">
      <div className="cd-y-axis">
        {yLabels.map((l, i) => <span key={i}>{l}</span>)}
      </div>

      <canvas ref={canvasRef} className="cd-canvas" />

      <div className="cd-x-axis">
        {xLabels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </div>
  );
}

// Dashboard 
export default function CryptoDashboard() {
  const [coinData, setCoinData] = useState(emptyState);
  const [active, setActive] = useState("btc");
  const [chartType, setChartType] = useState("bar");

  // 🔥 Fetch real data
  // useEffect(() => {
  //   const fetchData = () => {
  //     fetch("http://localhost:8081/get-data")
  //       .then(res => res.json())
  //       .then((data) => {
  //         setCoinData((prev) => {
  //           const next = { ...prev };

  //           data.forEach((item) => {
  //             const id = item.symbol.toLowerCase();
  //             if (!next[id]) return;

  //             const price = Number(item.price);
  //             const time = new Date(item.timestamp).toLocaleTimeString();

  //             const prices = [...next[id].prices, price].slice(-MAX);
  //             const times = [...next[id].times, time].slice(-MAX);

  //             next[id] = {
  //               prices,
  //               times,
  //               high: Math.max(...prices),
  //               low: Math.min(...prices),
  //             };
  //           });

  //           return next;
  //         });
  //       })
  //       .catch(console.error);
  //   };

  //   fetchData();
  //   const interval = setInterval(fetchData, 3000);
  //   return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
  const ws = new WebSocket("ws://localhost:8081/ws");

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    const item = JSON.parse(event.data);
    console.log(item);
    

    setCoinData((prev) => {
      const next = { ...prev };
      const id = item.currency.toLowerCase();
      console.log(next);
      

      if (!next[id]) return prev;

      const price = Number(item.price);
      const time = new Date(item.timestamp).toLocaleTimeString();

      const prices = [...next[id].prices, price].slice(-MAX);
      const times = [...next[id].times, time].slice(-MAX);

      next[id] = {
        prices,
        times,
        high: Math.max(...prices),
        low: Math.min(...prices),
      };
      return next;
    });
  };

  ws.onerror = (err) => {
    console.error("WebSocket error", err);
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
  };

  return () => {
    ws.close();
  };
}, []);


  const coin = COINS[active];
  const s = coinData[active];

  const cur = s.prices.at(-1) || 0;
  const prev = s.prices.at(-2) || cur;

  const chg = prev ? ((cur - prev) / prev) * 100 : 0;
  const isUp = chg >= 0;

  return (
    <div className="cd-root">

      {/* Tabs */}
      <div className="cd-tabs">
        {Object.entries(COINS).map(([id, c]) => (
          <button
            key={id}
            className={`cd-tab${active === id ? " active" : ""}`}
            onClick={() => setActive(id)}
            style={{ borderBottomColor: active === id ? c.color : "transparent" }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="cd-stats">
        <div className="cd-stat-card">
          <div className="cd-stat-label">Price</div>
          <div className="cd-stat-value" style={{ color: coin.color }}>
            {fmt(cur)}
          </div>
          <div className={`cd-stat-change ${isUp ? "up" : "down"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
          </div>
        </div>

        <div className="cd-stat-card">
          <div className="cd-stat-label">24h High</div>
          <div className="cd-stat-value" style={{ color: "#1D9E75" }}>
            {fmt(s.high)}
          </div>
        </div>

        <div className="cd-stat-card">
          <div className="cd-stat-label">24h Low</div>
          <div className="cd-stat-value" style={{ color: "#D85A30" }}>
            {fmt(s.low)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="cd-controls">
        <span className="cd-controls-label">View</span>
        {["bar", "dot", "line"].map((t) => (
          <button
            key={t}
            className={`cd-ctrl-btn${chartType === t ? " active" : ""}`}
            onClick={() => setChartType(t)}
            style={chartType === t ? { borderColor: coin.color, color: coin.color } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Chart
        key={active}
        prices={s.prices}
        times={s.times}
        chartType={chartType}
        color={coin.color}
      />
    </div>
  );
}