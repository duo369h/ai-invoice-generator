export async function generatePDF(elementId, fileName = 'invoice.pdf') {
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

    // Standardize preview element for A4 screenshot quality
    element.style.width = '794px';
    element.style.maxWidth = '794px';
    element.style.boxShadow = 'none'; // Remove shadow in PDF

    // Render canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true, // Allow external image URLs (e.g. logos)
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Restore original styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.boxShadow = originalBoxShadow;

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
