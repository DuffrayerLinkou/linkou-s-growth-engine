export type ServiceType = "auditoria" | "producao" | "gestao" | "design";

export interface ServicePhase {
  value: string;
  label: string;
  color: string;
  order: number;
}

export interface ServiceConfig {
  value: ServiceType;
  label: string;
  description: string;
}

export const serviceTypes: ServiceConfig[] = [
  { value: "auditoria", label: "Auditoria e Consultoria", description: "Serviço de consultoria em tráfego pago" },
  { value: "producao", label: "Produção de Mídia", description: "Criação de anúncios e conteúdo orgânico" },
  { value: "gestao", label: "Gestão de Tráfego", description: "Gestão recorrente de campanhas pagas" },
  { value: "design", label: "Design", description: "Identidade visual, apps, sites e landing pages" },
];

export const servicePhases: Record<ServiceType, ServicePhase[]> = {
  auditoria: [
    { value: "diagnostico", label: "Diagnóstico", color: "bg-purple-500/20 text-purple-600 border-purple-500/30", order: 1 },
    { value: "estruturacao", label: "Estruturação", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", order: 2 },
    { value: "operacao_guiada", label: "Op. Guiada", color: "bg-orange-500/20 text-orange-600 border-orange-500/30", order: 3 },
    { value: "transferencia", label: "Transferência", color: "bg-green-500/20 text-green-600 border-green-500/30", order: 4 },
  ],
  producao: [
    { value: "briefing", label: "Briefing", color: "bg-pink-500/20 text-pink-600 border-pink-500/30", order: 1 },
    { value: "producao", label: "Produção", color: "bg-amber-500/20 text-amber-600 border-amber-500/30", order: 2 },
    { value: "revisao", label: "Revisão", color: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30", order: 3 },
    { value: "entrega", label: "Entrega", color: "bg-green-500/20 text-green-600 border-green-500/30", order: 4 },
  ],
  gestao: [
    { value: "onboarding", label: "Onboarding", color: "bg-indigo-500/20 text-indigo-600 border-indigo-500/30", order: 1 },
    { value: "setup", label: "Setup", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", order: 2 },
    { value: "otimizacao", label: "Otimização", color: "bg-orange-500/20 text-orange-600 border-orange-500/30", order: 3 },
    { value: "escala", label: "Escala", color: "bg-green-500/20 text-green-600 border-green-500/30", order: 4 },
  ],
  design: [
    { value: "descoberta", label: "Descoberta", color: "bg-violet-500/20 text-violet-600 border-violet-500/30", order: 1 },
    { value: "conceito", label: "Conceito", color: "bg-fuchsia-500/20 text-fuchsia-600 border-fuchsia-500/30", order: 2 },
    { value: "desenvolvimento", label: "Desenvolvimento", color: "bg-sky-500/20 text-sky-600 border-sky-500/30", order: 3 },
    { value: "entrega", label: "Entrega", color: "bg-green-500/20 text-green-600 border-green-500/30", order: 4 },
  ],
};

export const getPhasesByService = (serviceType: ServiceType): ServicePhase[] => {
  return servicePhases[serviceType] || servicePhases.auditoria;
};

export const getPhaseLabel = (serviceType: ServiceType, phaseValue: string): string => {
  const phases = servicePhases[serviceType];
  const phase = phases?.find((p) => p.value === phaseValue);
  return phase?.label || phaseValue;
};

export const getPhaseColor = (serviceType: ServiceType, phaseValue: string): string => {
  const phases = servicePhases[serviceType];
  const phase = phases?.find((p) => p.value === phaseValue);
  return phase?.color || "bg-muted text-muted-foreground";
};

export const getServiceLabel = (serviceType: ServiceType): string => {
  const service = serviceTypes.find((s) => s.value === serviceType);
  return service?.label || serviceType;
};
