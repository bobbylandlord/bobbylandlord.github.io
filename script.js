// Pastikan pdfmake sudah dimuat di index.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script>

let templateData = null;

// Ambil template JSON
fetch("template.json")
  .then(res => res.json())
  .then(data => {
    templateData = data;
    buildForm(); // buat form input 27 field
  });

// Buat form input otomatis
function buildForm() {
  const form = document.getElementById("contractForm");
  for (let i = 1; i <= 27; i++) {
    const code = `*${String(i).padStart(3, "0")}*`;
    const wrapper = document.createElement("div");
    wrapper.classList.add("form-group");

    const label = document.createElement("label");
    label.textContent = code;
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

// Ganti placeholder dengan input user
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

// Update preview (sekadar teks JSON ter-render)
function updatePreview() {
  const inputs = [...document.querySelectorAll("input")].map(inp => ({
    code: inp.dataset.code,
    value: inp.value
  }));

  const merged = {
    page1: replacePlaceholders(templateData.page1, inputs),
    page2: replacePlaceholders(templateData.page2, inputs),
    page3: replacePlaceholders(templateData.page3, inputs)
  };

  document.getElementById("preview").textContent = JSON.stringify(merged, null, 2);
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
