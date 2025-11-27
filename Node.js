// server.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// --- In-memory storage (replace with DB later) ---
const farmingData = {
  crops: [],        // {id, name, season, soil, tempRange, rainRange, humRange}
  soils: [],        // {id, type, description}
  seasons: [],      // {id, name, months}
  weather: [],      // {id, season, temp, rain, humidity}
  marketplace: [],  // {id, crop, qty, price, location, notes}
  buyers: [],       // {id, name, crop, price, location, contact}
  advisories: []    // {id, title, content, date}
};

// --- Generic CRUD endpoints ---
// Add new data
app.post("/api/:category", (req, res) => {
  const { category } = req.params;
  if (!farmingData[category]) return res.status(400).json({ error: "Invalid category" });
  const item = { id: Date.now(), ...req.body };
  farmingData[category].push(item);
  res.json(item);
});

// Get all data
app.get("/api/:category", (req, res) => {
  const { category } = req.params;
  if (!farmingData[category]) return res.status(400).json({ error: "Invalid category" });
  res.json(farmingData[category]);
});

// Get single item
app.get("/api/:category/:id", (req, res) => {
  const { category, id } = req.params;
  const list = farmingData[category];
  if (!list) return res.status(400).json({ error: "Invalid category" });
  const item = list.find(i => i.id == id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

// Update item
app.put("/api/:category/:id", (req, res) => {
  const { category, id } = req.params;
  const list = farmingData[category];
  if (!list) return res.status(400).json({ error: "Invalid category" });
  const idx = list.findIndex(i => i.id == id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  list[idx] = { ...list[idx], ...req.body };
  res.json(list[idx]);
});

// Delete item
app.delete("/api/:category/:id", (req, res) => {
  const { category, id } = req.params;
  const list = farmingData[category];
  if (!list) return res.status(400).json({ error: "Invalid category" });
  const idx = list.findIndex(i => i.id == id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const removed = list.splice(idx, 1)[0];
  res.json(removed);
});

// --- Start server ---
app.listen(PORT, () => console.log(`🌾 Farming server running at http://localhost:${PORT}`));
