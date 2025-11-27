// Example: load marketplace data
const marketTable = document.getElementById("marketTable");
if (marketTable) {
  fetch("/api/marketplace")
    .then(res => res.json())
    .then(data => {
      data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = <td>${item.crop}</td><td>${item.qty}</td><td>₹${item.price}</td><td>${item.loc}</td>;
        marketTable.appendChild(row);
      });
    });
}

// Example: add crop form
const cropForm = document.getElementById("cropForm");
if (cropForm) {
  cropForm.addEventListener("submit", e => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(cropForm));
    fetch("/api/crops", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(formData)
    }).then(res => res.json()).then(data => alert("Crop added!"));
  });
}
