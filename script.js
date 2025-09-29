let templateData = null;

// Mapping placeholder ke label deskriptif
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
    label.textContent = labelsMap[code] || code; // tampilkan label deskriptif

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

  if (typeof textObj === "object" && textObj !== null) {
    const newObj = {};
    for (const key in textObj) {
      newObj[key] = replacePlaceholders(textObj[key], inputs);
    }
    return newObj;
  }

  return textObj;
}

function updatePreview() {
  const inputs = [...document.querySelectorAll("input")].map(inp => ({
    code: inp.dataset.code,
    value: inp.value
  }));

  const page1 = replacePlaceholders(templateData.page1, inputs);
  const page2 = replacePlaceholders(templateData.page2, inputs);
  const page3 = replacePlaceholders(templateData.page3, inputs);

  const preview = document.getElementById("preview");
  preview.innerHTML = `
    <div class="doc-page">
      <div class="doc-title">SURAT PERJANJIAN PENGIKATAN JUAL BELI TANAH KAVLING</div>
      <div class="doc-subtitle">No. : ${inputs.find(i => i.code === "*001*").value}</div>
      ${renderContent(page1)}
    </div>

    <div class="doc-page">
      ${renderContent(page2)}
    </div>

    <div class="doc-page">
      ${renderContent(page3)}
    </div>
  `;
}

// Render konten (string/array/object) ke HTML
function renderContent(content) {
  if (typeof content === "string") {
    // biar teks panjang tetap mengikuti baris seperti dokumen
    return `<div class="line">${content}</div>`;
  }
  if (Array.isArray(content)) {
    return content.map(item => renderContent(item)).join("\n");
  }
  if (typeof content === "object" && content !== null) {
    if (content.table) {
      return renderDocTable(content.table);
    }
    if (content.ol) {
      return `<div class="ol">${content.ol.map((li, i) => 
        `<div>${i + 1}. ${li}</div>`
      ).join("")}</div>`;
    }
    if (content.text) {
      return `<div class="line">${content.text}</div>`;
    }
  }
  return "";
}

function renderDocTable(table) {
  return table.body.map(row =>
    row.map(cell => `<div class="line">${cell}</div>`).join("")
  ).join("");
}

// Generate PDF
document.getElementById("generateBtn").addEventListener("click", () => {
  const inputs = [...document.querySelectorAll("input")].map(inp => ({
    code: inp.dataset.code,
    value: inp.value
  }));

  const page1 = replacePlaceholders(templateData.page1, inputs);
  const page2 = replacePlaceholders(templateData.page2, inputs);
  const page3 = replacePlaceholders(templateData.page3, inputs);

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [50, 50, 50, 50],
    content: [
      ...page1,
      { text: "", pageBreak: "after" },
      ...page2,
      { text: "", pageBreak: "after" },
      ...page3
    ],
    styles: {
      title: {
        fontSize: 14,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 10]
      }
    },
    defaultStyle: {
      font: "Helvetica",
      fontSize: 11,
      lineHeight: 1.2
    }
  };

  pdfMake.createPdf(docDefinition).download("Surat_Perjanjian_Jual_Beli_Tanah_Kavling.pdf");
});



