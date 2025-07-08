"use client";
import React, { useEffect, useState, useRef } from "react";

// List of supported currencies for the converter
const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "PKR",
  "JPY",
  "CAD",
  "AUD",
  "CNY",
  "CHF",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "SGD",
];

// Configuration for animated background currency symbols
const SYMBOLS = [
  { char: "$", colorDark: "text-blue-400/40", colorLight: "text-gray-400/30" },
  {
    char: "€",
    colorDark: "text-yellow-300/40",
    colorLight: "text-yellow-500/20",
  },
  {
    char: "£",
    colorDark: "text-green-400/30",
    colorLight: "text-green-600/20",
  },
  { char: "¥", colorDark: "text-pink-400/40", colorLight: "text-pink-500/20" },
  {
    char: "₿",
    colorDark: "text-orange-300/30",
    colorLight: "text-orange-400/20",
  },
];

// State for each animated symbol
// x/y: position in viewport width/height (vw/vh)
// dx/dy: movement per frame
// size: font size in rem
// rotate: current rotation in degrees
// rotateSpeed: rotation speed per frame
// Used for random, independent movement
//
type SymbolState = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  rotate: number;
  rotateSpeed: number;
};

// Utility to get a random float between min and max
function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Generate a random initial state for a symbol, starting just outside the viewport on a random edge
function getRandomSymbolState(): SymbolState {
  const edge = Math.floor(Math.random() * 4);
  let x = 0,
    y = 0,
    dx = 0,
    dy = 0;
  switch (edge) {
    case 0: // left
      x = -10;
      y = getRandom(0, 100);
      dx = getRandom(0.1, 0.5);
      dy = getRandom(-0.2, 0.2);
      break;
    case 1: // right
      x = 110;
      y = getRandom(0, 100);
      dx = -getRandom(0.1, 0.5);
      dy = getRandom(-0.2, 0.2);
      break;
    case 2: // top
      x = getRandom(0, 100);
      y = -10;
      dx = getRandom(-0.2, 0.2);
      dy = getRandom(0.1, 0.5);
      break;
    case 3: // bottom
      x = getRandom(0, 100);
      y = 110;
      dx = getRandom(-0.2, 0.2);
      dy = -getRandom(0.1, 0.5);
      break;
  }
  return {
    x,
    y,
    dx,
    dy,
    size: getRandom(2.5, 5.5),
    rotate: getRandom(-20, 20),
    rotateSpeed: getRandom(-0.1, 0.1),
  };
}

export default function Home() {
  // Currency converter state
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [result, setResult] = useState<string | null>(null);
  const [, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // State for animated background symbols
  const [symbolStates, setSymbolStates] = useState<SymbolState[]>(() =>
    SYMBOLS.map(() => getRandomSymbolState())
  );
  const animationRef = useRef<number>();

  // Fetch currency rates from the backend API route on mount
  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data.rates);
      })
      .catch(() => setError("Failed to load currencies."));
  }, []);

  // Toggle dark/light theme by adding/removing the 'dark' class on <body>
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [theme]);

  // Animate background currency symbols with random, independent movement
  useEffect(() => {
    function animate() {
      setSymbolStates((prev) =>
        prev.map((s) => {
          let { x, y, rotate } = s;
          const { dx, dy, size, rotateSpeed } = s;
          x += dx;
          y += dy;
          rotate += rotateSpeed;
          // If out of bounds, reset to a new random path
          if (x < -15 || x > 115 || y < -15 || y > 115) {
            return getRandomSymbolState();
          }
          return { x, y, dx, dy, size, rotate, rotateSpeed };
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    }
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Toggle between light and dark themes
  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Handle currency conversion form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/rates");
      const data = await res.json();
      const fromRate = parseFloat(data.rates[from]);
      const toRate = parseFloat(data.rates[to]);
      const converted = (parseFloat(amount) / fromRate) * toRate;
      setResult(`${converted.toFixed(2)} ${to}`);
    } catch {
      setError("Failed to convert currency.");
    } finally {
      setLoading(false);
    }
  };

  // Swap the 'from' and 'to' currencies
  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setResult(null);
  };

  // Reset the form to initial state
  const handleReset = () => {
    setAmount("");
    setFrom("USD");
    setTo("EUR");
    setResult(null);
    setError(null);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 relative overflow-hidden ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      {/* Animated floating currency symbols in the background */}
      <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
        {SYMBOLS.map((symbol, i) => {
          const s = symbolStates[i];
          return (
            <span
              key={i}
              className={`fixed select-none z-0 ${
                theme === "dark" ? symbol.colorDark : symbol.colorLight
              }`}
              style={{
                left: `${s.x}vw`,
                top: `${s.y}vh`,
                fontSize: `${s.size}rem`,
                transform: `rotate(${s.rotate}deg)`,
                pointerEvents: "none",
              }}
            >
              {symbol.char}
            </span>
          );
        })}
      </div>
      {/* Main currency converter UI */}
      <div
        className={`w-full max-w-md rounded-xl shadow-2xl p-8 mx-2 animate-fade-in transition-colors duration-300 z-10 ${
          theme === "dark" ? "bg-gray-800" : "bg-white border border-gray-200"
        }`}
      >
        <div className="flex justify-center items-center mb-6 gap-2">
          <h1
            className={`text-3xl font-extrabold tracking-tight drop-shadow-lg ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Currency Converter
          </h1>
          <button
            type="button"
            onClick={handleThemeToggle}
            className={`ml-2 p-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
              theme === "dark"
                ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-100"
                : "border-gray-300 bg-gray-200 hover:bg-gray-300 text-gray-900"
            }`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            className={`w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-inner ${
              theme === "dark"
                ? "border-gray-700 bg-gray-900 text-gray-100"
                : "border-gray-300 bg-white text-gray-900"
            }`}
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            step="any"
          />
          <div className="flex items-center gap-2">
            <select
              className={`flex-1 p-3 rounded border focus:outline-none transition-all duration-200 ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-900 text-gray-100"
                  : "border-gray-300 bg-white text-gray-900"
              }`}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            >
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSwap}
              className={`p-2 rounded-full active:scale-90 transition-all duration-200 flex items-center justify-center text-xl shadow-md ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-blue-700 text-gray-100"
                  : "bg-gray-200 hover:bg-blue-200 text-gray-900"
              }`}
              aria-label="Swap currencies"
            >
              ⇌
            </button>
            <select
              className={`flex-1 p-3 rounded border focus:outline-none transition-all duration-200 ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-900 text-gray-100"
                  : "border-gray-300 bg-white text-gray-900"
              }`}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            >
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className={`flex-1 font-semibold py-3 rounded transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-blue-700 hover:bg-blue-800 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              disabled={loading || !amount}
            >
              {loading ? "Converting..." : "Convert"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className={`flex-1 font-semibold py-3 rounded transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 ${
                theme === "dark"
                  ? "bg-gray-500 hover:bg-gray-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-900"
              }`}
            >
              Reset
            </button>
          </div>
        </form>
        <div className="mt-6 min-h-[2.5rem] text-center">
          {error && (
            <div
              className={`animate-fade-in-fast ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {error}
            </div>
          )}
          {result && (
            <div
              className={`text-xl font-bold border rounded p-3 inline-block shadow-lg animate-bounce-in ${
                theme === "dark"
                  ? "text-blue-300 border-blue-300 bg-blue-900/30"
                  : "text-blue-700 border-blue-400 bg-blue-100"
              }`}
            >
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
