/* script.js - lengkap, sinkron dengan template.json & style.css */
let templateData = null;

// mapping label names untuk form input
const labelsMap = {
  "*001*": "Nomor Surat Perjanjian",
  "*002*": "NIK Penjual",
  "*003*": "Nama Penjual",
  "*004*": "Jabatan Penjual",
  "*005*": "Alamat Penjual",
  "*006*": "Status Penjual",
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

// helper: escape HTML (safety)
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Load template.json
fetch("template.json")
  .then(res => {
    if (!res.ok) throw new Error("Gagal load template.json: " + res.status);
    return res.json();
  })
  .then(data => {
    templateData = data;
    buildForm();
    updatePreview();
  })
  .catch(err => {
    console.error(err);
    document.getElementById("preview").innerText =
      "Error: tidak dapat memuat template.json — cek console.";
  });

// build 27 inputs
function buildForm() {
  const form = document.getElementById("contractForm");
  form.innerHTML = "";
  for (let i = 1; i <= 27; i++) {
    const code = `*${String(i).padStart(3, "0")}*`;
    const wrapper = document.createElement("div");
    wrapper.className = "form-group";

    const label = document.createElement("label");
    label.htmlFor = "inp" + i;
    label.textContent = labelsMap[code] || code;

    const input = document.createElement("input");
    input.type = "text";
    input.id = "inp" + i;
    input.name = code;
    input.dataset.code = code;
    input.addEventListener("input", updatePreview);

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  }

  // tombol aksi
  document.getElementById("fillSample").addEventListener("click", fillSample);
  document.getElementById("clearSample").addEventListener("click", clearForm);
  document.getElementById("generateBtn").addEventListener("click", generatePDF);
}

// replace placeholder *00x*
function replacePlaceholders(textObj, inputs) {
  if (typeof textObj === "string") {
    let result = textObj;
    inputs.forEach(input => {
      result = result.split(input.code).join(input.value || "");
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

// render 1 item
function renderItem(item) {
  if (typeof item === "string") {
    return `<div class="doc-text">${escapeHtml(item)}</div>`;
  }
  if (item === null || item === undefined) return "";

  if (item.title) {
    return `<div class="doc-title">${escapeHtml(item.title)}</div>`;
  }
  if (item.subtitle) {
    return `<div class="doc-subtitle">${escapeHtml(item.subtitle)}</div>`;
  }
  if (item.text) {
    let cls = "doc-text";
    if (item.italics) cls += " italics";
    let style = "";
    if (item.alignment === "right") style = "text-align:right;";
    if (item.alignment === "center") style = "text-align:center;";
    return `<div class="${cls}" style="${style}">${escapeHtml(item.text)}</div>`;
  }
  if (item.line) {
    const lab = escapeHtml(item.line.label || "");
    const val = escapeHtml(item.line.value || "");
    return `<div class="line"><div class="label">${lab}</div><div class="value">: ${val}</div></div>`;
  }
  if (item.ol) {
    const lis = item.ol.map(li => `<li>${escapeHtml(li)}</li>`).join("");
    return `<ol class="doc-ol">${lis}</ol>`;
  }
  if (item.columns) {
    const cols = item.columns
      .map(col => {
        let style = "";
        if (col.alignment === "center") style = "text-align:center;";
        return `<div class="col" style="${style}">${escapeHtml(col.text || "")}</div>`;
      })
      .join("");
    return `<div class="columns">${cols}</div>`;
  }

  return `<div class="doc-text">${escapeHtml(JSON.stringify(item))}</div>`;
}

// update preview
function updatePreview() {
  if (!templateData) return;
  const inputs = [...document.querySelectorAll("#contractForm input")].map(inp => ({
    code: inp.dataset.code,
    value: inp.value ? String(inp.value) : ""
  }));

  const p1 = replacePlaceholders(templateData.page1 || [], inputs);
  const p2 = replacePlaceholders(templateData.page2 || [], inputs);
  const p3 = replacePlaceholders(templateData.page3 || [], inputs);

  const pageToHtml = arr => arr.map(item => renderItem(item)).join("");

  document.getElementById("preview").innerHTML = `
    <div class="doc-page">${pageToHtml(p1)}</div>
    <div class="doc-page">${pageToHtml(p2)}</div>
    <div class="doc-page">${pageToHtml(p3)}</div>
  `;
}

// generate PDF
function generatePDF() {
  updatePreview();
  const preview = document.getElementById("preview");

  const opt = {
    margin: [0, 0, 0, 0], // biar CSS atur margin
    filename: "Surat_Perjanjian_Jual_Beli_Tanah_Kavling.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.textContent = "Membuat PDF...";

  html2pdf()
    .set(opt)
    .from(preview)
    .save()
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Generate PDF";
    });
}

// isi contoh
function fillSample() {
  const sample = {
    "*001*": "00209/TK/PT. BJB/17-04-2025",
    "*002*": "6409014506860007",
    "*003*": "SITI AISYAH",
    "*004*": "Direktur",
    "*005*": "JL. SWADAYA RT. 001 RW. 004\nKEL. LOKTABAT SELATAN\nKEC. BANJARBARU SELATAN",
    "*006*": "Direktur",
    "*007*": "PT. BERKAH JAYA BERSAUDARA",
    "*008*": "6371051904860008",
    "*009*": "YOSVAN SYAIPUL",
    "*010*": "BANJARMASIN, 19-04-1986",
    "*011*": "JL. DAHLIA I NO. 06 RT.010 RW.002\nKEL. MAWAR KEC. BANJARMASIN TENGAH",
    "*012*": "WIRASWASTA",
    "*013*": "08123456789",
    "*014*": "6 (enam)",
    "*015*": "BERKAH JAYA BERSAUDARA KAVLING LAND 38",
    "*016*": "JL. KARANGANYAR 2 RT.030 RW.001 KEL. LOKTABAT UTARA",
    "*017*": "SPORADIK",
    "*018*": "195/-/KLTB/1981",
    "*019*": "SRI DJATI MOERDOKO",
    "*020*": "B8, B9, B10",
    "*021*": "10 M x 19 M / KAVLING",
    "*022*": "570",
    "*023*": "CASH BERTAHAP",
    "*024*": "225.000.000",
    "*025*": "50.000.000",
    "*026*": "175.000.000",
    "*027*": "Banjarbaru, 17 April 2025"
  };

  for (const key in sample) {
    const inp = document.querySelector(`#contractForm input[data-code="${key}"]`);
    if (inp) inp.value = sample[key];
  }
  updatePreview();
}

// clear form
function clearForm() {
  document.querySelectorAll("#contractForm input").forEach(i => (i.value = ""));
  updatePreview();
}
