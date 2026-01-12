import jsPDF from 'jspdf';

interface PDFSection {
  title: string;
  content: string | string[];
}

interface PDFOptions {
  filename: string;
  title: string;
  subtitle?: string;
}

export function generateStructuredPDF(
  sections: PDFSection[],
  options: PDFOptions
): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = 30;

  // Header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(options.title, margin, y);
  y += 8;

  if (options.subtitle) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(options.subtitle, margin, y);
    pdf.setTextColor(0);
    y += 15;
  } else {
    y += 10;
  }

  // Divider line
  pdf.setDrawColor(200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Sections
  sections.forEach(section => {
    // Check page break
    if (y > 260) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60);
    pdf.text(section.title.toUpperCase(), margin, y);
    pdf.setTextColor(0);
    y += 7;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const content = Array.isArray(section.content)
      ? section.content
      : [section.content];

    content.forEach(line => {
      if (!line || line.trim() === '') return;
      
      const lines = pdf.splitTextToSize(line, pageWidth - margin * 2);
      lines.forEach((l: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(l, margin, y);
        y += 5;
      });
    });

    y += 8;
  });

  // Footer with page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${pageCount}`,
      margin,
      290
    );
  }

  pdf.save(options.filename);
}
