import jsPDF from "jspdf";
import type { ProposalSlide } from "./ProposalTemplates";

interface ExportOptions {
  title: string;
  clientName: string;
  slides: ProposalSlide[];
}

export function exportProposalPDF({ title, clientName, slides }: ExportOptions) {
  const pdf = new jsPDF("l", "mm", "a4"); // landscape
  const pw = pdf.internal.pageSize.getWidth(); // ~297
  const ph = pdf.internal.pageSize.getHeight(); // ~210
  const margin = 20;
  const maxTextW = pw - margin * 2;

  slides.forEach((slide, idx) => {
    if (idx > 0) pdf.addPage();

    // Background
    pdf.setFillColor(26, 26, 46);
    pdf.rect(0, 0, pw, ph, "F");

    // Purple accent bar
    pdf.setFillColor(124, 58, 237);
    pdf.rect(0, 0, 6, ph, "F");

    if (slide.type === "cover") {
      // Cover slide
      pdf.setTextColor(124, 58, 237);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("LINKOU", margin + 10, 40);

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      const titleLines = pdf.splitTextToSize(title || slide.title, maxTextW - 10);
      pdf.text(titleLines, margin + 10, 75);

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(200, 200, 220);
      pdf.text(clientName, margin + 10, 75 + titleLines.length * 12 + 15);

      pdf.setFontSize(11);
      pdf.setTextColor(150, 150, 170);
      pdf.text(
        new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        margin + 10,
        75 + titleLines.length * 12 + 30
      );
    } else {
      // Content slide
      // Title
      pdf.setTextColor(124, 58, 237);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      const typeLabel = slide.type.replace(/_/g, " ").toUpperCase();
      pdf.text(typeLabel, margin + 10, 18);

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(slide.title, margin + 10, 30);

      // Content
      let y = 45;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(220, 220, 230);

      const hasHighlights = slide.highlights && slide.highlights.length > 0;
      const contentMaxW = hasHighlights ? maxTextW * 0.55 : maxTextW - 10;

      slide.content.forEach((line) => {
        if (y > ph - 25) return;
        const wrapped = pdf.splitTextToSize(`• ${line}`, contentMaxW);
        wrapped.forEach((wl: string) => {
          if (y > ph - 25) return;
          pdf.text(wl, margin + 10, y);
          y += 6;
        });
        y += 2;
      });

      // Highlights sidebar
      if (hasHighlights) {
        const hx = pw - margin - maxTextW * 0.35;
        let hy = 45;

        pdf.setFillColor(40, 30, 80);
        pdf.roundedRect(hx - 8, 38, maxTextW * 0.37, slide.highlights!.length * 12 + 20, 3, 3, "F");

        pdf.setTextColor(180, 160, 240);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.text("DESTAQUES", hx, hy);
        hy += 10;

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        slide.highlights!.forEach((h) => {
          pdf.text(`✓ ${h}`, hx, hy);
          hy += 10;
        });
      }

      // Footer
      pdf.setDrawColor(60, 50, 90);
      pdf.line(margin + 10, ph - 15, pw - margin, ph - 15);
      pdf.setTextColor(100, 100, 120);
      pdf.setFontSize(8);
      pdf.text("Linkou", margin + 10, ph - 9);
      pdf.text(`${idx + 1} / ${slides.length}`, pw - margin - 15, ph - 9);
    }
  });

  // Page date footer on all pages
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(80, 80, 100);
    pdf.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      pw / 2 - 15,
      ph - 5
    );
  }

  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  pdf.save(`proposta_${safeName}.pdf`);
}
