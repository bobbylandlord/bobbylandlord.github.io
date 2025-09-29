let templateData = null;

// Mapping placeholder ke label input
const labelsMap = {
  "*001*": "Nomor Surat Perjanjian",
  "*002*": "NIK Penjual",
  "*003*": "Nama Penjual",
  "*004*": "Jabatan Penjual",
  "*005*": "Alamat Penjual",
  "*006*": "Status Penjual (misalnya: Direktur)",
  "*007*": "Nama Perusahaan Penjual",
  "*008*": "NIK Pembeli",
  "*009*": "Nama Pembeli",
  "*010*": "Tempat & Tanggal Lahir Pembeli",
  "*011*": "Alamat Pembeli",
  "*012*": "Pekerjaan Pembeli",
  "*013*": "Nomor HP Pembeli",
  "*014*": "Jumlah Kavling Dibeli",
  "*015*": "Nama Lokasi Kavling",
  "*016*": "Alamat Lokasi Kavling",
  "*017*": "Nama Surat Induk",
  "*018*": "Nomor Surat Induk",
  "*019*": "Atas Nama Surat Induk",
  "*020*": "Nomor Kavling",
  "*021*": "Ukuran Tanah per Kavling",
  "*022*": "Luas Area Total",
  "*023*": "Cara Pembayaran",
  "*024*": "Harga Total",
  "*025*": "Uang Muka",
  "*026*": "Sisa Bayar",
  "*027*": "Tanggal & Tempat Penandatanganan"
};

// Load template.json
fetch("template.json")
  .then(res => res.json())
  .then(data => {
    templateData = data;
    buildForm();
  });

// Generate 27 input fields
function buildForm() {
  const form = document.getElementById("contractForm");
  for (let i = 1; i <= 27; i++) {
    const code = `*${String(i).padStart(3, "0")}*`;
    const wrapper = document.createElement("div");
    wrapper.classList.add("form-group");

    const label = document.createElement("label");
    label.textContent = labelsMap[code] || code;

    const input = document.createElement("input");
    input.type = "text";
    input.name = code;
    input.dataset.code = code;
    input.addEventListener("input", updatePreview);

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  }
}

// Replace placeholders
function replacePlaceholders(textObj, inputs) {
  if (typeof textObj === "string") {
    let result = textObj;
    inputs.forEach(input => {
      result = result.replaceAll(input.code, input.value || input.code);
    });
    return result;
  }
  if (Array.isArray(textObj)) {
    return textObj.map(item => replacePlaceholders(item, inputs));
  }
  return textObj;
}

// Update Preview
function updatePreview() {
  const inputs = [...document.querySelectorAll("input")].map(inp => ({
    code: inp.dataset.code,
    value: inp.value
  }));

  const page1 = replacePlaceholders(templateData.page1, inputs).join("");
  const page2 = replacePlaceholders(templateData.page2, inputs).join("");
  const page3 = replacePlaceholders(templateData.page3, inputs).join("");

  const preview = document.getElementById("preview");
  preview.innerHTML = `
    <div class="doc-preview">
      <div class="doc-page">${page1}</div>
      <div class="doc-page">${page2}</div>
      <div class="doc-page">${page3}</div>
    </div>
  `;
}

// Generate PDF (sementara masih basic)
document.getElementById("generateBtn").addEventListener("click", () => {
  const inputs = [...document.querySelectorAll("input")].map(inp => ({
    code: inp.dataset.code,
    value: inp.value
  }));

  const page1 = replacePlaceholders(templateData.page1, inputs).join("");
  const page2 = replacePlaceholders(templateData.page2, inputs).join("");
  const page3 = replacePlaceholders(templateData.page3, inputs).join("");

  const docContent = page1 + "<div style='page-break-after:always'></div>" +
                     page2 + "<div style='page-break-after:always'></div>" +
                     page3;

  const opt = {
    margin:       20,
    filename:     "Surat_Perjanjian_Jual_Beli_Tanah_Kavling.pdf",
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: "pt", format: "a4", orientation: "portrait" }
  };

  html2pdf().from(docContent).set(opt).save();
});
