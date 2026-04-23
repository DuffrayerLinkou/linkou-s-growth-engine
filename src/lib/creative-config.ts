import { Sparkles, Video, FileText, Image as ImageIcon, Layers, type LucideIcon } from "lucide-react";

export type DemandStatus =
  | "briefing"
  | "in_production"
  | "in_approval"
  | "adjustments"
  | "approved"
  | "delivered";

export type DeliverableStatus =
  | "in_production"
  | "in_approval"
  | "adjustments"
  | "approved"
  | "delivered";

export type DeliverableType = "video_copy" | "static_copy" | "video" | "image" | "media_kit";

export type Priority = "low" | "medium" | "high" | "urgent";

export const demandStatusConfig: Record<
  DemandStatus,
  { label: string; color: string; description: string }
> = {
  briefing: {
    label: "Briefing",
    color: "bg-muted text-muted-foreground border-border",
    description: "Aguardando refinamento do briefing",
  },
  in_production: {
    label: "Em Produção",
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    description: "Equipe interna produzindo entregáveis",
  },
  in_approval: {
    label: "Em Aprovação",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    description: "Aguardando aprovação do Ponto Focal",
  },
  adjustments: {
    label: "Ajustes",
    color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    description: "Cliente solicitou ajustes",
  },
  approved: {
    label: "Aprovado",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    description: "Aprovado, pronto para entrega",
  },
  delivered: {
    label: "Entregue",
    color: "bg-primary/15 text-primary border-primary/30",
    description: "Demanda concluída e entregue",
  },
};

export const deliverableStatusConfig: Record<DeliverableStatus, { label: string; color: string }> = {
  in_production: {
    label: "Em Produção",
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  in_approval: {
    label: "Em Aprovação",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  adjustments: {
    label: "Ajustes",
    color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  approved: {
    label: "Aprovado",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  delivered: {
    label: "Entregue",
    color: "bg-primary/15 text-primary border-primary/30",
  },
};

export const deliverableTypeConfig: Record<
  DeliverableType,
  { label: string; icon: LucideIcon; description: string }
> = {
  video_copy: {
    label: "Copy de Vídeo",
    icon: FileText,
    description: "Roteiro/legenda para vídeo",
  },
  static_copy: {
    label: "Copy de Post",
    icon: FileText,
    description: "Headline + corpo + CTA",
  },
  video: {
    label: "Vídeo Editado",
    icon: Video,
    description: "Arquivo de vídeo .mp4",
  },
  image: {
    label: "Arte/Imagem",
    icon: ImageIcon,
    description: "Imagem .png ou .jpg",
  },
  media_kit: {
    label: "Enxoval de Mídia",
    icon: Layers,
    description: "Pacote com múltiplos arquivos",
  },
};

export const priorityConfig: Record<Priority, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-muted text-muted-foreground" },
  medium: { label: "Média", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  high: { label: "Alta", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  urgent: { label: "Urgente", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

export const platformOptions = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Google Ads",
  "Meta Ads",
  "Site/Blog",
  "Email",
  "Outro",
];

export const formatOptions = [
  "Reel",
  "Shorts (YouTube)",
  "Shorts vertical (9:16)",
  "Story",
  "Feed (1:1)",
  "Feed (4:5)",
  "Vídeo curto (<60s)",
  "Vídeo longo (>60s)",
  "YouTube horizontal (16:9)",
  "Carrossel",
  "Anúncio estático",
  "Banner",
  "Outro",
];

export const CreativesIcon = Sparkles;