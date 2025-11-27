// Simple tab navigation
document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    ["advisory","market","trends","assistant"].forEach(id => {
      document.getElementById(id).style.display = (id === tab) ? "" : "none";
    });
  });
});

// Advisory: recommend
const soilEl = document.getElementById("soil");
const seasonEl = document.getElementById("season");
const rainBiasEl = document.getElementById("rainBias");
const tempEl = document.getElementById("temp");
const rainEl = document.getElementById("rain");
const humEl  = document.getElementById("hum");
const recList = document.getElementById("recList");
const recNote = document.getElementById("recNote");

document.getElementById("recommend").addEventListener("click", async () => {
  const payload = { soil: soilEl.value, season: seasonEl.value, rainBias: rainBiasEl.value };
  const res = await fetch("/api/crops/recommend", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
  const data = await res.json();
  tempEl.textContent = `${data.weather.temp} °C`;
  rainEl.textContent = `${data.weather.rain} mm`;
  humEl.textContent  = `${data.weather.hum} %`;
  recList.innerHTML = "";
  data.recommendations.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${r.name}</b> — Fit: ${r.score}%<br><small>${r.reasons.join(" ")}</small>`;
    recList.appendChild(li);
  });
  recNote.textContent = data.recommendations.length ? "" : "No exact matches. Try another soil or season.";
});

// Marketplace: listings
const listingTableBody = document.querySelector("#listingTable tbody");
const buyersTableBody  = document.querySelector("#buyersTable tbody");

async function loadListings() {
  const res = await fetch("/api/market/listings");
  const items = await res.json();
  listingTableBody.innerHTML = "";
  items.forEach(L => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${L.crop}</td><td>${L.qty}</td><td>₹${L.price}</td><td>${L.loc}</td>
      <td><button data-del="${L.id}">Delete</button></td>`;
    listingTableBody.appendChild(tr);
  });
  listingTableBody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await fetch(`/api/market/listings/${btn.dataset.del}`, { method:"DELETE" });
      loadListings();
    });
  });
}
async function addListing() {
  const crop = document.getElementById("mCrop").value.trim();
  const qty  = +document.getElementById("mQty").value;
  const price= +document.getElementById("mPrice").value;
  const loc  = document.getElementById("mLoc").value.trim();
  const notes= document.getElementById("mNotes").value.trim();
  if (!crop || !qty || !price || !loc) { alert("Fill crop, qty, price, location"); return; }
  await fetch("/api/market/listings", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ crop, qty, price, loc, notes })
  });
  document.getElementById("mCrop").value = "";
  document.getElementById("mQty").value = "";
  document.getElementById("mPrice").value = "";
  document.getElementById("mLoc").value = "";
  document.getElementById("mNotes").value = "";
  loadListings();
}
document.getElementById("addListing").addEventListener("click", addListing);
document.getElementById("clearListings").addEventListener("click", async () => {
  const res = await fetch("/api/market/listings");
  const items = await res.json();
  if (!items.length) return;
  if (confirm("Clear all your listings?")) {
    for (const it of items) {
      await fetch(`/api/market/listings/${it.id}`, { method:"DELETE" });
    }
    loadListings();
  }
});
loadListings();

// Buyers
async function loadBuyers(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`/api/market/buyers?${params}`);
  const items = await res.json();
  buyersTableBody.innerHTML = "";
  items.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${b.name}</td><td>${b.crop}</td><td>₹${b.price}</td><td>${b.location}</td><td>${b.contact}</td>`;
    buyersTableBody.appendChild(tr);
  });
}
document.getElementById("buyerCropFilter").addEventListener("input", e => {
  loadBuyers({ crop: e.target.value, location: document.getElementById("buyerLocFilter").value });
});
document.getElementById("buyerLocFilter").addEventListener("input", e => {
  loadBuyers({ crop: document.getElementById("buyerCropFilter").value, location: e.target.value });
});
loadBuyers();

// Trends: simple canvas chart
const trendCanvas = document.getElementById("trendCanvas");
const ctx = trendCanvas.getContext("2d");

function movingAverage(arr, window) {
  const out = [];
  for (let i=0;i<arr.length;i++) {
    const start = Math.max(0, i-window+1);
    const slice = arr.slice(start, i+1);
    out.push(slice.reduce((a,b)=>a+b,0)/slice.length);
  }
  return out;
}
function drawSeries(series, maSeries) {
  const W = trendCanvas.clientWidth || 800, H = trendCanvas.clientHeight || 260;
  trendCanvas.width = W * devicePixelRatio; trendCanvas.height = H * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  ctx.clearRect(0,0,W,H);
  const pad = 24;
  const maxV = Math.max(...series, ...maSeries);
  const minV = Math.min(...series, ...maSeries);
  const xStep = (W - 2*pad) / (series.length - 1);
  const Y = v => H - pad - ((v - minV) / (maxV - minV)) * (H - 2*pad);

  ctx.strokeStyle = "#24324f"; ctx.beginPath();
  ctx.moveTo(pad, pad); ctx.lineTo(pad, H-pad); ctx.lineTo(W-pad, H-pad); ctx.stroke();

  ctx.strokeStyle = "#74c0fc"; ctx.lineWidth = 2; ctx.beginPath();
  series.forEach((v,i)=>{ const x=pad+i*xStep, y=Y(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();

  ctx.strokeStyle = "#63e6be"; ctx.lineWidth = 2; ctx.beginPath();
  maSeries.forEach((v,i)=>{ const x=pad+i*xStep, y=Y(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();

  ctx.fillStyle = "#9bb0d1"; ctx.font = "12px Segoe UI";
  ctx.fillText(`Min: ₹${minV.toFixed(0)}`, W - 120, H - pad + 16);
  ctx.fillText(`Max: ₹${maxV.toFixed(0)}`, W - 120, H - pad + 32);
}
async function renderTrend() {
  const crop = document.getElementById("trendCrop").value;
  const window = Math.max(2, Math.min(10, +document.getElementById("trendWindow").value || 3));
  const res = await fetch(`/api/price/series?crop=${encodeURIComponent(crop)}`);
  const data = await res.json();
  if (!data.series || !data.series.length) { alert("No series for selected crop."); return; }
  drawSeries(data.series, movingAverage(data.series, window));
}
document.getElementById("renderTrend").addEventListener("click", renderTrend);
renderTrend();

// Assistant
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
function pushMsg(who, text) {
  const wrap = document.createElement("div");
  wrap.className = "msg";
  wrap.innerHTML = `<div class="who">${who}</div><div class="text">${text}</div>`;
  chatBox.appendChild(wrap); chatBox.scrollTop = chatBox.scrollHeight;
}
async function sendChat() {
  const q = chatInput.value.trim();
  if (!q) return;
  pushMsg("You", q);
  const res = await fetch("/api/assistant", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text: q })
  });
  const data = await res.json();
  pushMsg("AgriFarm Assistant", data.reply);
  chatInput.value = "";
}
document.getElementById("chatSend").addEventListener("click", sendChat);
chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });