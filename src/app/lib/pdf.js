export async function generatePDF(elementId, fileName = 'invoice.pdf', isPro = false) {
  if (typeof window === 'undefined') return;

  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found.`);
      return;
    }

    // Save original styles
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    const originalBoxShadow = element.style.boxShadow;
    const originalPosition = element.style.position;

    // Standardize preview element for A4 screenshot quality
    element.style.width = '794px';
    element.style.maxWidth = '794px';
    element.style.boxShadow = 'none'; // Remove shadow in PDF
    element.style.position = 'relative';

    // Inject temporary watermark for non-pro users
    let watermark = null;
    if (!isPro) {
      watermark = document.createElement('div');
      watermark.innerText = 'Freelancer Business OS Free';
      watermark.style.position = 'absolute';
      watermark.style.top = '50%';
      watermark.style.left = '50%';
      watermark.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
      watermark.style.fontSize = '80px';
      watermark.style.fontWeight = '900';
      watermark.style.color = 'rgba(148, 163, 184, 0.12)';
      watermark.style.pointerEvents = 'none';
      watermark.style.zIndex = '9999';
      watermark.style.whiteSpace = 'nowrap';
      watermark.style.textTransform = 'uppercase';
      watermark.style.letterSpacing = '8px';
      watermark.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      watermark.style.userSelect = 'none';
      element.appendChild(watermark);
    }

    // Render canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true, // Allow external image URLs (e.g. logos)
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remove watermark
    if (watermark) {
      element.removeChild(watermark);
    }

    // Restore original styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.boxShadow = originalBoxShadow;
    element.style.position = originalPosition;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Create A4 PDF (210mm x 297mm)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Scale image to fit the page width
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add extra pages if invoice spans multiple pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}
