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

// Load template.json (harus ada di root)
fetch("template.json")
  .then(res => {
    if (!res.ok) throw new Error("Gagal load template.json: " + res.status);
    return res.json();
  })
  .then(data => {
    templateData = data;
    buildForm();
    updatePreview(); // render awal (kosong)
  })
  .catch(err => {
    console.error(err);
    document.getElementById("preview").innerText = "Error: tidak dapat memuat template.json — cek console.";
  });

// build 27 inputs berdasarkan labelsMap
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

  // tombol sample / clear
  document.getElementById("fillSample").addEventListener("click", fillSample);
  document.getElementById("clearSample").addEventListener("click", clearForm);
  // generate
  document.getElementById("generateBtn").addEventListener("click", generatePDF);
}

// apabila textObj (string/object/array) -> ganti placeholder *00x* dengan nilai input
function replacePlaceholders(textObj, inputs) {
  if (typeof textObj === "string") {
    let result = textObj;
    inputs.forEach(input => {
      // ganti semua kemunculan
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

// render a single content item (object/string) ke HTML
function renderItem(item) {
  if (typeof item === "string") {
    return `<div class="doc-text">${escapeHtml(item)}</div>`;
  }
  if (item === null || item === undefined) return "";

  // handle typed objects
  if (item.title) {
    return `<div class="doc-title">${escapeHtml(item.title)}</div>`;
  }
  if (item.subtitle) {
    return `<div class="doc-subtitle">${escapeHtml(item.subtitle)}</div>`;
  }
  if (item.text) {
    if (item.italics) {
      return `<div class="doc-text italics">${escapeHtml(item.text)}</div>`;
    }
    return `<div class="doc-text">${escapeHtml(item.text)}</div>`;
  }
  if (item.line) {
    // label & value — memastikan ":" sejajar lewat CSS
    const lab = escapeHtml(item.line.label || "");
    const val = escapeHtml(item.line.value || "");
    return `<div class="line"><div class="label">${lab}</div><div class="value">: ${val}</div></div>`;
  }
  if (item.ol) {
    const lis = item.ol.map(li => `<li>${escapeHtml(li)}</li>`).join("");
    return `<ol class="doc-ol">${lis}</ol>`;
  }
  if (item.columns) {
    const cols = item.columns.map(col => `<div class="col">${escapeHtml(col.text || "")}</div>`).join("");
    return `<div class="columns">${cols}</div>`;
  }

  // fallback — render JSON string
  return `<div class="doc-text">${escapeHtml(JSON.stringify(item))}</div>`;
}

// update preview (ambil templateData, replace placeholder, render HTML)
function updatePreview() {
  if (!templateData) return;
  const inputs = [...document.querySelectorAll("#contractForm input")].map(inp => ({
    code: inp.dataset.code,
    value: inp.value ? String(inp.value) : ""
  }));

  // replace placeholders (menghasilkan struktur baru)
  const p1 = replacePlaceholders(templateData.page1 || [], inputs);
  const p2 = replacePlaceholders(templateData.page2 || [], inputs);
  const p3 = replacePlaceholders(templateData.page3 || [], inputs);

  // convert to HTML
  const pageToHtml = arr => {
    return arr.map(item => renderItem(item)).join("");
  };

  const previewEl = document.getElementById("preview");
  previewEl.innerHTML = `
    <div class="doc-page">${pageToHtml(p1)}</div>
    <div class="doc-page">${pageToHtml(p2)}</div>
    <div class="doc-page">${pageToHtml(p3)}</div>
  `;
}

// Generate PDF dari elemen .doc-preview
function generatePDF() {
  // pastikan preview up-to-date
  updatePreview();

  const preview = document.getElementById("preview");
  // html2pdf expects an element; we pass preview (which contains doc pages)
  const opt = {
    margin:       [10,10,10,10],
    filename:     'Surat_Perjanjian_Jual_Beli_Tanah_Kavling.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // disable the button while generating
  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.textContent = "Membuat PDF...";

const opt = {
  margin:       [0,0,0,0],   // biar margin dari CSS
  filename:     'Surat_Perjanjian_Jual_Beli_Tanah_Kavling.pdf',
  image:        { type: 'jpeg', quality: 0.98 },
  html2canvas:  { scale: 2, useCORS: true },
  jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
};

  
  // create pdf
  html2pdf().set(opt).from(preview).toPdf().get('pdf').then(function(pdf) {
    // success (no-op)
  }).save().finally(() => {
    btn.disabled = false;
    btn.textContent = "Generate PDF";
  });
}

// helper: isi contoh data (demo)
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

// clear all inputs
function clearForm() {
  document.querySelectorAll("#contractForm input").forEach(i => i.value = "");
  updatePreview();
}
