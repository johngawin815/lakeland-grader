import html2pdf from "html2pdf.js";

/**
 * Promotes @media print rules to unconditional rules so html2canvas
 * (which only renders screen styles) picks up the print layout.
 */
function promoteMediaPrintRules(html) {
  return html.replace(/@media\s+print\s*\{([\s\S]*?\})\s*\}/g, "$1");
}

/**
 * Converts an HTML workbook string to a PDF Blob.
 * Uses html2pdf.js (jspdf + html2canvas) for client-side rendering.
 *
 * @param {string} htmlString - Full HTML document string (with embedded CSS)
 * @returns {Promise<Blob>} PDF blob
 */
export async function generatePdfBlob(htmlString) {
  const processed = promoteMediaPrintRules(htmlString);

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "8.5in";
  document.body.appendChild(container);

  // Parse the HTML and inject into the container
  const doc = new DOMParser().parseFromString(processed, "text/html");
  // Copy style tags into the container
  doc.querySelectorAll("style").forEach((style) => {
    container.appendChild(style.cloneNode(true));
  });
  // Copy body content
  container.innerHTML += doc.body.innerHTML;

  try {
    const blob = await html2pdf()
      .set({
        margin: 0,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], before: ".print-page" },
      })
      .from(container)
      .outputPdf("blob");
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}
