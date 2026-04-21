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

// ════════════════════════════════════════════════════════════════════
// Editorial Strategic Plan PDF — Linkou
// ════════════════════════════════════════════════════════════════════

const LINKOU_PURPLE: [number, number, number] = [109, 40, 217]; // #6D28D9
const LINKOU_PURPLE_LIGHT: [number, number, number] = [167, 139, 250]; // #A78BFA
const LINKOU_DARK: [number, number, number] = [30, 27, 75]; // #1E1B4B
const TEXT_DARK: [number, number, number] = [31, 41, 55];
const TEXT_MUTED: [number, number, number] = [107, 114, 128];
const BG_LIGHT: [number, number, number] = [243, 244, 246];
const BORDER: [number, number, number] = [229, 231, 235];

interface StrategicPlanData {
  title: string;
  status?: string | null;
  executive_summary?: string | null;
  timeline_start?: string | null;
  timeline_end?: string | null;
  objectives?: any;
  kpis?: any;
  personas?: any;
  funnel_strategy?: any;
  campaign_types?: string[] | null;
  budget_allocation?: any;
  diagnostic?: any;
  execution_plan?: any;
  created_at?: string | null;
}

type PDF = jsPDF;

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

function setFill(pdf: PDF, c: [number, number, number]) {
  pdf.setFillColor(c[0], c[1], c[2]);
}
function setText(pdf: PDF, c: [number, number, number]) {
  pdf.setTextColor(c[0], c[1], c[2]);
}
function setDraw(pdf: PDF, c: [number, number, number]) {
  pdf.setDrawColor(c[0], c[1], c[2]);
}

function ensureSpace(pdf: PDF, y: number, needed: number, addFooter: () => void): number {
  if (y + needed > PAGE_H - 22) {
    addFooter();
    pdf.addPage();
    return MARGIN + 10;
  }
  return y;
}

function drawFooter(pdf: PDF, pageNum: number, totalPages: number) {
  setDraw(pdf, BORDER);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setText(pdf, TEXT_MUTED);
  pdf.text('Linkou • agencialinkou.com.br', MARGIN, PAGE_H - 8);
  pdf.text(`Página ${pageNum} de ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
}

function drawSectionTitle(pdf: PDF, y: number, label: string, num?: string): number {
  setFill(pdf, LINKOU_PURPLE);
  pdf.rect(MARGIN, y - 4, 3, 8, 'F');
  if (num) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    setText(pdf, LINKOU_PURPLE);
    pdf.text(num, MARGIN + 6, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    setText(pdf, LINKOU_DARK);
    pdf.text(label, MARGIN + 14, y);
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    setText(pdf, LINKOU_DARK);
    pdf.text(label, MARGIN + 6, y);
  }
  return y + 8;
}

function drawParagraph(pdf: PDF, text: string, y: number, addFooter: () => void, opts?: { size?: number; color?: [number, number, number]; bold?: boolean; lh?: number }): number {
  if (!text) return y;
  const size = opts?.size ?? 10;
  const color = opts?.color ?? TEXT_DARK;
  const lh = opts?.lh ?? 4.8;
  pdf.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
  pdf.setFontSize(size);
  setText(pdf, color);
  const lines = pdf.splitTextToSize(text, CONTENT_W);
  for (const ln of lines) {
    y = ensureSpace(pdf, y, lh, addFooter);
    pdf.text(ln, MARGIN, y);
    y += lh;
  }
  return y;
}

function drawBadge(pdf: PDF, x: number, y: number, label: string, color: [number, number, number]): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  const w = pdf.getTextWidth(label) + 6;
  setFill(pdf, color);
  pdf.roundedRect(x, y - 3.5, w, 5, 1, 1, 'F');
  setText(pdf, [255, 255, 255]);
  pdf.text(label, x + 3, y);
  return x + w + 2;
}

function drawTable(pdf: PDF, headers: string[], rows: string[][], y: number, addFooter: () => void, colWidths?: number[]): number {
  const widths = colWidths || headers.map(() => CONTENT_W / headers.length);
  const rowH = 7;
  const headerH = 8;

  y = ensureSpace(pdf, y, headerH + rowH * Math.min(rows.length, 3), addFooter);

  // Header
  setFill(pdf, LINKOU_PURPLE);
  pdf.rect(MARGIN, y, CONTENT_W, headerH, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  setText(pdf, [255, 255, 255]);
  let x = MARGIN;
  headers.forEach((h, i) => {
    pdf.text(h, x + 2, y + 5.5);
    x += widths[i];
  });
  y += headerH;

  // Rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  rows.forEach((row, ri) => {
    // Wrap each cell to compute row height
    const cellLines = row.map((cell, i) => pdf.splitTextToSize(String(cell ?? ''), widths[i] - 4));
    const maxLines = Math.max(...cellLines.map(l => l.length), 1);
    const dynH = Math.max(rowH, maxLines * 4.2 + 2.5);

    y = ensureSpace(pdf, y, dynH, addFooter);

    if (ri % 2 === 0) {
      setFill(pdf, BG_LIGHT);
      pdf.rect(MARGIN, y, CONTENT_W, dynH, 'F');
    }
    setText(pdf, TEXT_DARK);
    x = MARGIN;
    cellLines.forEach((lines, i) => {
      let ly = y + 4.5;
      lines.forEach((ln: string) => {
        pdf.text(ln, x + 2, ly);
        ly += 4;
      });
      x += widths[i];
    });
    y += dynH;
  });

  setDraw(pdf, BORDER);
  pdf.setLineWidth(0.2);
  pdf.rect(MARGIN, y - rows.reduce((acc, _, ri) => {
    const cellLines = rows[ri].map((cell, i) => pdf.splitTextToSize(String(cell ?? ''), widths[i] - 4));
    const maxLines = Math.max(...cellLines.map(l => l.length), 1);
    return acc + Math.max(rowH, maxLines * 4.2 + 2.5);
  }, 0) - headerH, CONTENT_W, rows.reduce((acc, _, ri) => {
    const cellLines = rows[ri].map((cell, i) => pdf.splitTextToSize(String(cell ?? ''), widths[i] - 4));
    const maxLines = Math.max(...cellLines.map(l => l.length), 1);
    return acc + Math.max(rowH, maxLines * 4.2 + 2.5);
  }, 0) + headerH);

  return y + 4;
}

function drawCard(pdf: PDF, y: number, height: number, addFooter: () => void): number {
  y = ensureSpace(pdf, y, height + 4, addFooter);
  setFill(pdf, [255, 255, 255]);
  setDraw(pdf, BORDER);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(MARGIN, y, CONTENT_W, height, 2, 2, 'FD');
  // Left accent
  setFill(pdf, LINKOU_PURPLE);
  pdf.roundedRect(MARGIN, y, 2, height, 1, 1, 'F');
  return y;
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

function asArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.list)) return v.list;
  return [];
}

function statusLabel(s?: string | null): string {
  if (s === 'active') return 'Ativo';
  if (s === 'completed') return 'Concluído';
  return 'Rascunho';
}

export function generateStrategicPlanPDF(plan: StrategicPlanData, clientName: string): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let pageNum = 0;

  // We'll render footer at end via numbering pass
  const addFooter = () => {};

  // ─────── COVER ───────
  pageNum++;
  setFill(pdf, LINKOU_DARK);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
  // Diagonal purple accent
  setFill(pdf, LINKOU_PURPLE);
  pdf.triangle(0, 0, PAGE_W, 0, 0, 140, 'F');
  setFill(pdf, LINKOU_PURPLE_LIGHT);
  pdf.triangle(0, 0, PAGE_W * 0.65, 0, 0, 90, 'F');

  // Brand
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setText(pdf, [255, 255, 255]);
  pdf.text('LINKOU', MARGIN, 25);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('AGÊNCIA DE MARKETING DIGITAL', MARGIN, 30);

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setText(pdf, [255, 255, 255]);
  pdf.text('PLANO ESTRATÉGICO', MARGIN, 165);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  const titleLines = pdf.splitTextToSize(plan.title, CONTENT_W);
  let ty = 178;
  titleLines.forEach((l: string) => {
    pdf.text(l, MARGIN, ty);
    ty += 11;
  });

  // Client
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(13);
  setText(pdf, LINKOU_PURPLE_LIGHT);
  pdf.text(`Cliente: ${clientName}`, MARGIN, ty + 8);

  // Period & status
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  setText(pdf, [200, 200, 220]);
  const period = plan.timeline_start || plan.timeline_end
    ? `${fmtDate(plan.timeline_start)} — ${fmtDate(plan.timeline_end)}`
    : 'Período a definir';
  pdf.text(`Vigência: ${period}`, MARGIN, ty + 16);
  pdf.text(`Status: ${statusLabel(plan.status)}`, MARGIN, ty + 22);

  // Footer cover
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setText(pdf, [180, 180, 200]);
  pdf.text('Documento confidencial • agencialinkou.com.br', MARGIN, PAGE_H - 12);
  pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PAGE_W - MARGIN, PAGE_H - 12, { align: 'right' });

  // ─────── INTERNAL PAGES ───────
  const startContent = () => {
    pdf.addPage();
    pageNum++;
    return MARGIN + 10;
  };

  let y = startContent();

  // Page 2: Executive Summary
  y = drawSectionTitle(pdf, y, 'Sumário Executivo', '01');
  y += 2;
  if (plan.executive_summary) {
    y = drawParagraph(pdf, plan.executive_summary, y, addFooter, { size: 10.5, lh: 5.2 });
  } else {
    y = drawParagraph(pdf, `Plano estratégico desenvolvido para ${clientName} com foco em performance, escala sustentável e construção de canal previsível de aquisição. As próximas seções detalham diagnóstico, personas, objetivos SMART, KPIs, estratégia de funil e plano de execução.`, y, addFooter, { size: 10.5, lh: 5.2, color: TEXT_MUTED });
  }

  // Quick facts box
  y += 6;
  y = ensureSpace(pdf, y, 30, addFooter);
  setFill(pdf, BG_LIGHT);
  pdf.roundedRect(MARGIN, y, CONTENT_W, 26, 2, 2, 'F');
  const cellW = CONTENT_W / 4;
  const facts = [
    { label: 'Vigência', value: period },
    { label: 'Status', value: statusLabel(plan.status) },
    { label: 'Personas', value: String(asArray(plan.personas).length || '—') },
    { label: 'Objetivos', value: String(asArray(plan.objectives).length || '—') },
  ];
  facts.forEach((f, i) => {
    const cx = MARGIN + cellW * i + 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    setText(pdf, TEXT_MUTED);
    pdf.text(f.label.toUpperCase(), cx, y + 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    setText(pdf, LINKOU_DARK);
    pdf.text(f.value, cx, y + 18);
  });
  y += 32;

  // ─── Diagnostic ───
  const diag = plan.diagnostic && typeof plan.diagnostic === 'object' ? plan.diagnostic : null;
  if (diag && (diag.current_situation || (diag.opportunities?.length) || (diag.risks?.length) || (diag.competition?.length))) {
    y = ensureSpace(pdf, y, 20, addFooter);
    y = drawSectionTitle(pdf, y, 'Diagnóstico', '02');
    y += 2;

    if (diag.current_situation) {
      y = drawParagraph(pdf, 'Situação Atual', y, addFooter, { size: 10, bold: true, color: LINKOU_PURPLE });
      y = drawParagraph(pdf, diag.current_situation, y, addFooter);
      y += 3;
    }

    // SWOT-like 2-col: opportunities / risks
    const opps: string[] = Array.isArray(diag.opportunities) ? diag.opportunities : [];
    const risks: string[] = Array.isArray(diag.risks) ? diag.risks : [];
    if (opps.length || risks.length) {
      y = ensureSpace(pdf, y, 50, addFooter);
      const colW = (CONTENT_W - 4) / 2;
      const startY = y;
      // Opportunities
      setFill(pdf, [220, 252, 231]);
      setDraw(pdf, [134, 239, 172]);
      pdf.roundedRect(MARGIN, y, colW, 50, 2, 2, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      setText(pdf, [22, 101, 52]);
      pdf.text('OPORTUNIDADES', MARGIN + 4, y + 7);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      setText(pdf, TEXT_DARK);
      let oy = y + 13;
      opps.slice(0, 5).forEach((o) => {
        const lines = pdf.splitTextToSize('• ' + o, colW - 8);
        lines.forEach((l: string) => {
          if (oy < y + 47) { pdf.text(l, MARGIN + 4, oy); oy += 4; }
        });
      });
      // Risks
      setFill(pdf, [254, 226, 226]);
      setDraw(pdf, [252, 165, 165]);
      pdf.roundedRect(MARGIN + colW + 4, y, colW, 50, 2, 2, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      setText(pdf, [153, 27, 27]);
      pdf.text('RISCOS', MARGIN + colW + 8, y + 7);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      setText(pdf, TEXT_DARK);
      let ry = y + 13;
      risks.slice(0, 5).forEach((r) => {
        const lines = pdf.splitTextToSize('• ' + r, colW - 8);
        lines.forEach((l: string) => {
          if (ry < y + 47) { pdf.text(l, MARGIN + colW + 8, ry); ry += 4; }
        });
      });
      y = startY + 56;
    }

    // Competition table
    if (Array.isArray(diag.competition) && diag.competition.length) {
      y = drawParagraph(pdf, 'Concorrência', y, addFooter, { size: 10, bold: true, color: LINKOU_PURPLE });
      const compRows = diag.competition.slice(0, 6).map((c: any) => [
        String(c?.name || c || '—'),
        String(c?.strengths || '—'),
        String(c?.weaknesses || '—'),
      ]);
      y = drawTable(pdf, ['Concorrente', 'Pontos Fortes', 'Pontos Fracos'], compRows, y, addFooter, [50, 70, 54]);
    }
  }

  // ─── Personas ───
  const personas = asArray(plan.personas);
  if (personas.length > 0) {
    y = ensureSpace(pdf, y, 30, addFooter);
    y += 4;
    y = drawSectionTitle(pdf, y, 'Personas', '03');
    y += 4;

    personas.slice(0, 6).forEach((p: any, idx: number) => {
      if (typeof p === 'string') {
        y = ensureSpace(pdf, y, 16, addFooter);
        const cardY = drawCard(pdf, y, 14, addFooter);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        setText(pdf, LINKOU_DARK);
        pdf.text(`Persona ${idx + 1}`, MARGIN + 6, cardY + 6);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        setText(pdf, TEXT_DARK);
        pdf.text(p, MARGIN + 6, cardY + 11);
        y = cardY + 18;
        return;
      }

      const pains = Array.isArray(p.pain_points) ? p.pain_points : [];
      const desires = Array.isArray(p.desires) ? p.desires : [];
      const objections = Array.isArray(p.objections) ? p.objections : [];
      const channels = Array.isArray(p.channels) ? p.channels : [];

      // Estimate height
      const sections: { label: string; items: string[] }[] = [];
      if (p.demographics) sections.push({ label: 'Demografia', items: [p.demographics] });
      if (pains.length) sections.push({ label: 'Dores', items: pains });
      if (desires.length) sections.push({ label: 'Desejos', items: desires });
      if (objections.length) sections.push({ label: 'Objeções', items: objections });
      if (channels.length) sections.push({ label: 'Canais', items: channels });
      if (p.message_hook) sections.push({ label: 'Mensagem-chave', items: [p.message_hook] });

      let estH = 14;
      sections.forEach(s => { estH += 4 + s.items.length * 4.2; });

      y = ensureSpace(pdf, y, estH + 4, addFooter);
      const cardY = drawCard(pdf, y, estH, addFooter);

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      setText(pdf, LINKOU_DARK);
      pdf.text(p.name || `Persona ${idx + 1}`, MARGIN + 6, cardY + 7);

      let py = cardY + 13;
      sections.forEach(s => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        setText(pdf, LINKOU_PURPLE);
        pdf.text(s.label.toUpperCase(), MARGIN + 6, py);
        py += 3.5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.8);
        setText(pdf, TEXT_DARK);
        s.items.forEach(it => {
          const lines = pdf.splitTextToSize('• ' + it, CONTENT_W - 14);
          lines.forEach((l: string) => {
            pdf.text(l, MARGIN + 8, py);
            py += 4;
          });
        });
        py += 1;
      });
      y = cardY + estH + 4;
    });
  }

  // ─── Objectives ───
  const objectives = asArray(plan.objectives);
  if (objectives.length > 0) {
    y += 2;
    y = ensureSpace(pdf, y, 20, addFooter);
    y = drawSectionTitle(pdf, y, 'Objetivos SMART', '04');
    y += 2;
    const rows = objectives.map((o: any) => {
      if (typeof o === 'string') return [o, '—', '—', '—', '—'];
      return [
        String(o.name || o.title || '—'),
        String(o.metric || '—'),
        o.baseline != null ? String(o.baseline) : '—',
        o.target != null ? String(o.target) : '—',
        String(o.deadline ? fmtDate(o.deadline) : '—'),
      ];
    });
    y = drawTable(pdf, ['Objetivo', 'Métrica', 'Atual', 'Meta', 'Prazo'], rows, y, addFooter, [62, 36, 22, 22, 32]);
  }

  // ─── KPIs ───
  const kpis = asArray(plan.kpis);
  if (kpis.length > 0) {
    y += 2;
    y = ensureSpace(pdf, y, 20, addFooter);
    y = drawSectionTitle(pdf, y, 'KPIs de Acompanhamento', '05');
    y += 2;
    const rows = kpis.map((k: any) => {
      if (typeof k === 'string') return [k, '—', '—', '—', '—'];
      return [
        String(k.name || '—'),
        String(k.category || '—'),
        String(k.unit || '—'),
        k.current != null ? String(k.current) : '—',
        k.target != null ? String(k.target) : '—',
      ];
    });
    y = drawTable(pdf, ['KPI', 'Categoria', 'Unidade', 'Atual', 'Meta'], rows, y, addFooter, [54, 36, 26, 28, 30]);
  }

  // ─── Funnel ───
  const funnel = plan.funnel_strategy;
  if (funnel) {
    y += 2;
    y = ensureSpace(pdf, y, 30, addFooter);
    y = drawSectionTitle(pdf, y, 'Estratégia de Funil', '06');
    y += 2;

    if (typeof funnel === 'string') {
      y = drawParagraph(pdf, funnel, y, addFooter);
    } else if (typeof funnel === 'object') {
      const stages: Array<{ key: string; label: string; color: [number, number, number] }> = [
        { key: 'topo', label: 'TOPO • Awareness', color: [167, 139, 250] },
        { key: 'meio', label: 'MEIO • Consideração', color: [109, 40, 217] },
        { key: 'fundo', label: 'FUNDO • Conversão', color: [76, 29, 149] },
      ];

      stages.forEach(stage => {
        const s = funnel[stage.key];
        if (!s) return;
        const channels = Array.isArray(s.channels) ? s.channels.join(', ') : (s.channels || '—');
        const creatives = Array.isArray(s.creatives) ? s.creatives.join(', ') : (s.creatives || '—');
        const lines = [
          `Goal: ${s.goal || '—'}`,
          `Canais: ${channels}`,
          `Criativos: ${creatives}`,
          `KPI: ${s.kpi || '—'}    •    Budget: ${s.budget_pct != null ? s.budget_pct + '%' : '—'}`,
        ];
        const blockH = 8 + lines.length * 4.5 + 4;
        y = ensureSpace(pdf, y, blockH + 4, addFooter);

        // Stage header bar
        setFill(pdf, stage.color);
        pdf.roundedRect(MARGIN, y, CONTENT_W, 7, 1, 1, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        setText(pdf, [255, 255, 255]);
        pdf.text(stage.label, MARGIN + 4, y + 5);
        y += 9;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        setText(pdf, TEXT_DARK);
        lines.forEach(ln => {
          const wrapped = pdf.splitTextToSize(ln, CONTENT_W - 4);
          wrapped.forEach((w: string) => {
            y = ensureSpace(pdf, y, 4.5, addFooter);
            pdf.text(w, MARGIN + 2, y);
            y += 4.5;
          });
        });
        y += 3;
      });

      // Reengajamento
      if (funnel.reengajamento) {
        const r = funnel.reengajamento;
        y = ensureSpace(pdf, y, 20, addFooter);
        setFill(pdf, [248, 250, 252]);
        setDraw(pdf, BORDER);
        pdf.roundedRect(MARGIN, y, CONTENT_W, 18, 1, 1, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        setText(pdf, LINKOU_PURPLE);
        pdf.text('REENGAJAMENTO', MARGIN + 4, y + 6);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        setText(pdf, TEXT_DARK);
        const desc = r.goal || (typeof r === 'string' ? r : JSON.stringify(r));
        const wr = pdf.splitTextToSize(String(desc), CONTENT_W - 8);
        let ry = y + 11;
        wr.slice(0, 2).forEach((w: string) => { pdf.text(w, MARGIN + 4, ry); ry += 4; });
        y += 22;
      }
    }
  }

  // ─── Budget ───
  const budget = plan.budget_allocation;
  if (budget && typeof budget === 'object') {
    y += 2;
    y = ensureSpace(pdf, y, 30, addFooter);
    y = drawSectionTitle(pdf, y, 'Alocação de Budget', '07');
    y += 2;

    if (budget.total_monthly) {
      const total = Number(budget.total_monthly).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      y = drawParagraph(pdf, `Investimento mensal total: ${total}`, y, addFooter, { bold: true, size: 11, color: LINKOU_PURPLE });
      y += 2;
    }

    const byChannel = budget.by_channel && typeof budget.by_channel === 'object' ? budget.by_channel : null;
    if (byChannel && Object.keys(byChannel).length) {
      y = drawParagraph(pdf, 'Por Canal', y, addFooter, { bold: true, size: 10, color: LINKOU_DARK });
      const rows = Object.entries(byChannel).map(([k, v]) => [
        String(k).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        typeof v === 'number' ? `${v}%` : String(v),
      ]);
      y = drawTable(pdf, ['Canal', '% do Budget'], rows, y, addFooter, [120, 54]);
    }

    const byPhase = budget.by_phase && typeof budget.by_phase === 'object' ? budget.by_phase : null;
    if (byPhase && Object.keys(byPhase).length) {
      y = drawParagraph(pdf, 'Por Etapa do Funil', y, addFooter, { bold: true, size: 10, color: LINKOU_DARK });
      const rows = Object.entries(byPhase).map(([k, v]) => [
        String(k).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        typeof v === 'number' ? `${v}%` : String(v),
      ]);
      y = drawTable(pdf, ['Etapa', '% do Budget'], rows, y, addFooter, [120, 54]);
    }

    if (budget.reserve_pct != null) {
      y = drawParagraph(pdf, `Reserva estratégica: ${budget.reserve_pct}%`, y, addFooter, { color: TEXT_MUTED, size: 9 });
    }
  }

  // ─── Execution Plan ───
  const exec = plan.execution_plan;
  if (exec && typeof exec === 'object') {
    y += 2;
    y = ensureSpace(pdf, y, 30, addFooter);
    y = drawSectionTitle(pdf, y, 'Plano de Execução', '08');
    y += 2;

    const waves: any[] = Array.isArray(exec.waves) ? exec.waves : [];
    if (waves.length) {
      y = drawParagraph(pdf, 'Cronograma de Ondas', y, addFooter, { bold: true, size: 10, color: LINKOU_DARK });
      waves.forEach((w: any, i: number) => {
        const deliverables = Array.isArray(w.deliverables) ? w.deliverables : [];
        const milestones = Array.isArray(w.milestones) ? w.milestones : [];
        const blockH = 12 + (deliverables.length + milestones.length) * 4 + 6;
        y = ensureSpace(pdf, y, blockH, addFooter);

        setFill(pdf, LINKOU_PURPLE);
        pdf.circle(MARGIN + 4, y + 3.5, 3.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        setText(pdf, [255, 255, 255]);
        pdf.text(String(i + 1), MARGIN + 4, y + 5, { align: 'center' });

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        setText(pdf, LINKOU_DARK);
        pdf.text(w.name || `Onda ${i + 1}`, MARGIN + 11, y + 5);
        if (w.period) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          setText(pdf, TEXT_MUTED);
          pdf.text(w.period, PAGE_W - MARGIN, y + 5, { align: 'right' });
        }
        y += 9;

        if (deliverables.length) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          setText(pdf, LINKOU_PURPLE);
          pdf.text('ENTREGAS', MARGIN + 11, y);
          y += 3.5;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          setText(pdf, TEXT_DARK);
          deliverables.forEach((d: string) => {
            const wrapped = pdf.splitTextToSize('• ' + d, CONTENT_W - 14);
            wrapped.forEach((wln: string) => { pdf.text(wln, MARGIN + 13, y); y += 4; });
          });
        }
        if (milestones.length) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          setText(pdf, LINKOU_PURPLE);
          pdf.text('MARCOS', MARGIN + 11, y);
          y += 3.5;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          setText(pdf, TEXT_DARK);
          milestones.forEach((m: string) => {
            const wrapped = pdf.splitTextToSize('• ' + m, CONTENT_W - 14);
            wrapped.forEach((wln: string) => { pdf.text(wln, MARGIN + 13, y); y += 4; });
          });
        }
        y += 3;
      });
    }

    // Governance
    const gov = exec.governance;
    if (gov && typeof gov === 'object') {
      y = ensureSpace(pdf, y, 30, addFooter);
      y = drawParagraph(pdf, 'Governança', y, addFooter, { bold: true, size: 10, color: LINKOU_DARK });
      const rows: string[][] = [];
      if (gov.cadence) rows.push(['Cadência de calls', String(gov.cadence)]);
      if (gov.reports) rows.push(['Relatórios', String(gov.reports)]);
      if (gov.tools) rows.push(['Ferramentas', Array.isArray(gov.tools) ? gov.tools.join(', ') : String(gov.tools)]);
      if (gov.responsibles) rows.push(['Responsáveis', Array.isArray(gov.responsibles) ? gov.responsibles.join(', ') : String(gov.responsibles)]);
      if (rows.length) y = drawTable(pdf, ['Item', 'Definição'], rows, y, addFooter, [54, 120]);
    }
  }

  // ─── Closing ───
  y += 4;
  y = ensureSpace(pdf, y, 40, addFooter);
  setFill(pdf, LINKOU_DARK);
  pdf.roundedRect(MARGIN, y, CONTENT_W, 30, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setText(pdf, [255, 255, 255]);
  pdf.text('Próximos passos', MARGIN + 6, y + 9);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  setText(pdf, [220, 220, 240]);
  pdf.text('Aprovação do plano com o ponto focal e início da Onda 1.', MARGIN + 6, y + 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  setText(pdf, LINKOU_PURPLE_LIGHT);
  pdf.text('Leo Santana — Diretor Comercial • Linkou', MARGIN + 6, y + 25);

  // ─────── FOOTERS ───────
  const total = pdf.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    pdf.setPage(i);
    drawFooter(pdf, i, total);
  }

  const safeName = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  pdf.save(`plano-estrategico-${safeName || 'cliente'}.pdf`);
}
