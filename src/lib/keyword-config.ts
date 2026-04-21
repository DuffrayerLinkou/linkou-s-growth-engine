export const intentLabels: Record<string, string> = {
  informational: "Informacional",
  navigational: "Navegacional",
  transactional: "Transacional",
  commercial: "Comercial",
};

export const intentColors: Record<string, string> = {
  informational: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  navigational: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  transactional: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  commercial: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export const keywordStatusLabels: Record<string, string> = {
  target: "Alvo",
  ranking: "Rankeando",
  opportunity: "Oportunidade",
  archived: "Arquivada",
};

export const keywordStatusColors: Record<string, string> = {
  target: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  ranking: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  opportunity: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  archived: "bg-muted text-muted-foreground border-border",
};

export function difficultyColor(d: number | null | undefined): string {
  if (d == null) return "text-muted-foreground";
  if (d < 30) return "text-emerald-600";
  if (d < 60) return "text-amber-600";
  return "text-rose-600";
}

export function positionColor(p: number | null | undefined): string {
  if (p == null) return "text-muted-foreground";
  if (p <= 3) return "text-emerald-600 font-semibold";
  if (p <= 10) return "text-emerald-500";
  if (p <= 20) return "text-amber-600";
  return "text-rose-600";
}