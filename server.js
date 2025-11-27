// server.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// --- Mock data / in-memory store ---
const CROPS = [
  // Kharif (Monsoon)
  { name: "Rice (Paddy)", seasons: ["Kharif (Monsoon)"], soils: ["Alluvial","Clay","Loamy","Black"], temp:[24,35], rain:[150,300], hum:[70,100] },
  { name: "Maize", seasons: ["Kharif (Monsoon)","Zaid (Summer)"], soils: ["Loamy","Alluvial","Red"], temp:[20,35], rain:[50,150], hum:[40,80] },
  { name: "Cotton", seasons: ["Kharif (Monsoon)"], soils: ["Black","Loamy","Red"], temp:[21,30], rain:[50,100], hum:[40,70] },
  { name: "Soybean", seasons: ["Kharif (Monsoon)"], soils: ["Loamy","Black","Alluvial"], temp:[20,30], rain:[60,120], hum:[50,80] },
  { name: "Groundnut", seasons: ["Kharif (Monsoon)","Zaid (Summer)"], soils: ["Sandy","Loamy","Red"], temp:[25,35], rain:[50,100], hum:[40,70] },
  // Rabi (Winter)
  { name: "Wheat", seasons: ["Rabi (Winter)"], soils: ["Loamy","Clay","Alluvial"], temp:[10,25], rain:[30,90], hum:[40,70] },
  { name: "Mustard", seasons: ["Rabi (Winter)"], soils: ["Alluvial","Loamy"], temp:[10,25], rain:[25,60], hum:[40,70] },
  { name: "Gram (Chickpea)", seasons: ["Rabi (Winter)"], soils: ["Black","Red","Loamy"], temp:[10,25], rain:[30,60], hum:[40,70] },
  { name: "Barley", seasons: ["Rabi (Winter)"], soils: ["Loamy","Light Alluvial"], temp:[8,22], rain:[20,60], hum:[40,70] },
  // Zaid (Summer)
  { name: "Moong (Green gram)", seasons: ["Zaid (Summer)"], soils: ["Sandy","Loamy","Alluvial"], temp:[25,35], rain:[30,70], hum:[40,70] },
  { name: "Sesame (Til)", seasons: ["Zaid (Summer)","Kharif (Monsoon)"], soils: ["Sandy","Loamy","Red"], temp:[25,35], rain:[30,80], hum:[40,70] },
  { name: "Cucumber", seasons: ["Zaid (Summer)"], soils: ["Loamy","Alluvial"], temp:[22,32], rain:[40,100], hum:[50,80] },
];

// Marketplace buyers and listings
const BUYERS = [
  { id: 1, name: "Shree Traders", crop: "Wheat", price: 23, location: "Kanpur, UP", contact: "98765 32110" },
  { id: 2, name: "Green Mandi", crop: "Rice", price: 28, location: "Lucknow, UP", contact: "97979 11223" },
  { id: 3, name: "Pulses & Co.", crop: "Gram (Chickpea)", price: 70, location: "Jaunpur, UP", contact: "99876 55443" },
  { id: 4, name: "SunOil Foods", crop: "Mustard", price: 56, location: "Varanasi, UP", contact: "98181 77889" },
  { id: 5, name: "Maize Hub", crop: "Maize", price: 18, location: "Prayagraj, UP", contact: "90000 11122" },
];
let LISTINGS = [];
const PRICE_SERIES = {
  "Wheat":  [21,22,22,23,24,23,22,22,23,24,24,25],
  "Rice":   [26,26,27,27,28,28,29,28,27,27,28,29],
  "Maize":  [17,17,18,18,19,18,17,18,18,19,19,20],
  "Mustard":[52,53,54,55,56,55,54,54,55,56,57,58],
};

// --- Utility functions ---
function randIn(min, max) { return min + Math.random() * (max - min); }
function simulateWeather(season, rainBias) {
  const ranges = {
    "Kharif (Monsoon)": { t:[24,33], r:[120,260], h:[65,95] },
    "Rabi (Winter)":   { t:[8,22],  r:[10,90],   h:[35,75] },
    "Zaid (Summer)":   { t:[26,38], r:[10,80],   h:[30,65] },
  };
  const base = ranges[season] || ranges["Kharif (Monsoon)"];
  let rmin = base.r[0], rmax = base.r[1];
  if (rainBias === "Low") rmax = Math.max(base.r[0] + 20, base.r[1] - 60);
  if (rainBias === "High") rmin = Math.min(base.r[1] - 80, base.r[0] + 40);
  const temp = Math.round(randIn(base.t[0], base.t[1]) * 10) / 10;
  const rain = Math.round(randIn(rmin, rmax));
  const hum  = Math.round(randIn(base.h[0], base.h[1]));
  return { temp, rain, hum };
}
function rangeScore(value, [min, max]) {
  if (value >= min && value <= max) return 1.0;
  const d = value < min ? (min - value) : (value - max);
  const span = Math.max(1, max - min);
  return Math.max(0, 1 - Math.min(1, d / span));
}
function scoreCrop(crop, soil, season, weather) {
  if (!crop.seasons.includes(season)) return { score: -Infinity, reasons: [] };
  if (!crop.soils.includes(soil)) return { score: -Infinity, reasons: [] };
  const { temp, rain, hum } = weather;
  const t = rangeScore(temp, crop.temp);
  const r = rangeScore(rain, crop.rain);
  const h = rangeScore(hum, crop.hum);
  const score = 0.45*t + 0.40*r + 0.15*h;
  const reasons = [
    `Matches ${season} season and ${soil} soil.`,
    temp < crop.temp[0] ? `Temp ${temp}°C below preferred (${crop.temp[0]}–${crop.temp[1]}°C).`
    : temp > crop.temp[1] ? `Temp ${temp}°C above preferred (${crop.temp[0]}–${crop.temp[1]}°C).`
    : `Temp ${temp}°C fits (${crop.temp[0]}–${crop.temp[1]}°C).`,
    rain < crop.rain[0] ? `Rain ${rain}mm below preferred (${crop.rain[0]}–${crop.rain[1]}mm).`
    : rain > crop.rain[1] ? `Rain ${rain}mm above preferred (${crop.rain[0]}–${crop.rain[1]}mm).`
    : `Rain ${rain}mm fits (${crop.rain[0]}–${crop.rain[1]}mm).`,
    hum < crop.hum[0] ? `Humidity ${hum}% below preferred (${crop.hum[0]}–${crop.hum[1]}%).`
    : hum > crop.hum[1] ? `Humidity ${hum}% above preferred (${crop.hum[0]}–${crop.hum[1]}%).`
    : `Humidity ${hum}% fits (${crop.hum[0]}–${crop.hum[1]}%).`,
  ];
  return { score, reasons };
}

// --- API routes ---
// Simulate weather
app.post("/api/weather/simulate", (req, res) => {
  const { season, rainBias } = req.body;
  return res.json(simulateWeather(season, rainBias));
});

// Recommend crops
app.post("/api/crops/recommend", (req, res) => {
  const { soil, season, rainBias } = req.body;
  const weather = simulateWeather(season, rainBias);
  const ranked = CROPS
    .map(c => ({ crop: c, ...scoreCrop(c, soil, season, weather) }))
    .filter(x => x.score !== -Infinity)
    .sort((a,b) => b.score - a.score)
    .slice(0, 6)
    .map(x => ({
      name: x.crop.name,
      score: Math.round(x.score * 100),
      reasons: x.reasons
    }));
  res.json({ weather, recommendations: ranked });
});

// Marketplace: buyers
app.get("/api/market/buyers", (req, res) => {
  const { crop = "", location = "" } = req.query;
  const out = BUYERS.filter(b =>
    (!crop || b.crop.toLowerCase().includes(String(crop).toLowerCase())) &&
    (!location || b.location.toLowerCase().includes(String(location).toLowerCase()))
  );
  res.json(out);
});

// Marketplace: listings CRUD (in-memory)
app.get("/api/market/listings", (req, res) => res.json(LISTINGS));
app.post("/api/market/listings", (req, res) => {
  const { crop, qty, price, loc, notes } = req.body;
  if (!crop || !qty || !price || !loc) return res.status(400).json({ error: "Missing crop, qty, price, or loc" });
  const item = { id: Date.now(), crop, qty: +qty, price: +price, loc, notes: notes || "", ts: Date.now() };
  LISTINGS.push(item);
  res.json(item);
});
app.delete("/api/market/listings/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = LISTINGS.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const removed = LISTINGS.splice(idx, 1)[0];
  res.json(removed);
});

// Price trends
app.get("/api/price/series", (req, res) => {
  const { crop } = req.query;
  const series = PRICE_SERIES[crop] || [];
  res.json({ crop, series });
});

// Assistant: simple rule-based replies
app.post("/api/assistant", (req, res) => {
  const { text = "" } = req.body;
  const s = text.toLowerCase();
  let reply =
    "I can help with crop suitability, seasons, irrigation basics, and marketplace steps. Ask: “Suggest Kharif crops for loamy soil” or “Show mustard price trend.”";

  if (s.includes("price") && s.includes("set")) {
    reply = "Set ₹/kg based on local rates and your quality grade. In Marketplace → add listing, compare with Buyers' target price.";
  } else if (s.includes("how") && s.includes("list")) {
    reply = "Go to Marketplace, fill crop, quantity, price, and location, then click Add. You can delete or edit later.";
  } else if (s.includes("zaid") || s.includes("summer")) {
    reply = "Zaid (Summer): Moong, Sesame, Cucumber do well in sandy/loamy soils with proper irrigation and heat management.";
  } else if (s.includes("kharif") || s.includes("monsoon")) {
    reply = "Kharif: Rice (alluvial/clay/loamy), Maize, Soybean, Groundnut, Cotton (black soil). Ensure drainage in high rainfall.";
  } else if (s.includes("rabi") || s.includes("winter")) {
    reply = "Rabi: Wheat, Mustard, Gram, Barley under cool temps and moderate irrigation. Loamy/alluvial soils are ideal.";
  } else if (s.includes("irrigation")) {
    reply = "Maintain consistent moisture without waterlogging. For wheat: timely, light irrigations—adjust to local advisories.";
  }

  res.json({ reply });
});

app.listen(PORT, () => console.log(`AgriFarm Hub running on http://localhost:${PORT}`));