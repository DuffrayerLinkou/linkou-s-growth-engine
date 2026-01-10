// Centralized status and color configurations for the admin system

// ============= CLIENT STATUS =============
export const clientStatusLabels: Record<string, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};

export const clientStatusColors: Record<string, string> = {
  ativo: "bg-green-500/10 text-green-500",
  pausado: "bg-yellow-500/10 text-yellow-500",
  encerrado: "bg-red-500/10 text-red-500",
};

// ============= LEAD STATUS =============
export const leadStatusLabels: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
};

export const leadStatusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  contacted: "bg-yellow-500/10 text-yellow-500",
  qualified: "bg-green-500/10 text-green-500",
  converted: "bg-purple-500/10 text-purple-500",
  lost: "bg-red-500/10 text-red-500",
};

// ============= PROJECT STATUS =============
export const projectStatusLabels: Record<string, string> = {
  planning: "Planejamento",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
};

export const projectStatusColors: Record<string, string> = {
  planning: "bg-gray-500/10 text-gray-500",
  active: "bg-green-500/10 text-green-500",
  paused: "bg-yellow-500/10 text-yellow-500",
  completed: "bg-blue-500/10 text-blue-500",
};

// ============= JOURNEY PHASES =============
export const phaseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  estruturacao: "Estruturação",
  operacao_guiada: "Operação Guiada",
  transferencia: "Transferência",
};

export const phaseColors: Record<string, string> = {
  diagnostico: "bg-blue-500/10 text-blue-600",
  estruturacao: "bg-purple-500/10 text-purple-600",
  operacao_guiada: "bg-orange-500/10 text-orange-600",
  transferencia: "bg-green-500/10 text-green-600",
};

export const phaseOrder = ["diagnostico", "estruturacao", "operacao_guiada", "transferencia"];
