let templateText = "";

// Load template.json
fetch("template.json")
  .then(res => res.json())
  .then(data => {
    templateText = JSON.stringify(data, null, 2);
    buildForm(data);
  });

// Buat form input dari placeholder *001*–*028*
function buildForm(data) {
  const form = document.getElementById("contractForm");
  for (let i = 1; i <= 28; i++) {
    const field = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = `*${String(i).padStart(3, "0")}*`;
    const input = document.createElement("input");
    input.type = "text";
    input.name = `field${i}`;
    input.dataset.code = `*${String(i).padStart(3, "0")}*`;
    input.addEventListener("input", updatePreview);
    field.appendChild(label);
    field.appendChild(input);
    form.appendChild(field);
  }
}

// Update preview real-time
function updatePreview() {
  let text = templateText;
  document.querySelectorAll("input").forEach(input => {
    const val = input.value || input.dataset.code;
    text = text.replaceAll(input.dataset.code, val);
  });
  document.getElementById("preview").textContent = text;
}

// Generate PDF A4
document.getElementById("generateBtn").addEventListener("click", () => {
  let text = document.getElementById("preview").textContent;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const pageWidth = 210 - margin * 2;
  const textLines = doc.splitTextToSize(text, pageWidth);
  doc.text(textLines, margin, 20);
  doc.save("Kontrak_Jual_Beli_Tanah_Kavling.pdf");
});