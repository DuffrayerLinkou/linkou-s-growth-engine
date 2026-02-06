import { 
  Search, 
  Video, 
  BarChart3, 
  Palette,
  Globe,
  Code,
  type LucideIcon 
} from "lucide-react";

export interface Service {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

export const services: Service[] = [
  {
    id: "auditoria",
    icon: Search,
    title: "Auditoria e Consultoria",
    subtitle: "Tráfego Pago",
    description:
      "Diagnóstico completo das suas contas de anúncios, funis e rastreamento. Você entende o que está funcionando, o que não está, e sai com um plano claro de ação.",
    features: [
      "Análise de contas de anúncios",
      "Setup de tracking e pixels",
      "Dashboards de performance",
      "Treinamento do time interno",
    ],
    highlight: true,
  },
  {
    id: "producao",
    icon: Video,
    title: "Produção de Mídia",
    subtitle: "Anúncios e Orgânico",
    description:
      "Criativos que convertem. Produzimos vídeos, imagens e conteúdos estratégicos para suas campanhas de tráfego pago e redes sociais.",
    features: [
      "Criativos para anúncios",
      "Conteúdo para redes sociais",
      "Vídeos e imagens profissionais",
      "Roteiros estratégicos",
    ],
  },
  {
    id: "gestao",
    icon: BarChart3,
    title: "Gestão de Tráfego",
    subtitle: "Recorrente e Estratégico",
    description:
      "Operação contínua das suas campanhas de Meta Ads e Google Ads. Estratégia, otimização e relatórios mensais transparentes.",
    features: [
      "Meta Ads e Google Ads",
      "Estratégia de funil completo",
      "Otimização semanal",
      "Relatórios mensais claros",
    ],
  },
  {
    id: "design",
    icon: Palette,
    title: "Design",
    subtitle: "Digital Completo",
    description:
      "Identidade visual e presença digital profissional. Do branding aos sites e apps — tudo integrado para sua marca brilhar.",
    features: [
      "Identidade Visual",
      "Apps Web e Mobile",
      "Sites institucionais",
      "Landing Pages de alta conversão",
    ],
  },
  {
    id: "site",
    icon: Globe,
    title: "Sites e Landing Pages",
    subtitle: "Presença Digital",
    description:
      "Sites institucionais e landing pages de alta conversão. Do wireframe à publicação, com design responsivo e otimização para resultados.",
    features: [
      "Sites institucionais",
      "Landing pages de conversão",
      "Design responsivo",
      "SEO otimizado",
    ],
  },
  {
    id: "webapp",
    icon: Code,
    title: "Aplicação Web",
    subtitle: "Desenvolvido com IA",
    description:
      "Aplicações web sob medida, criadas com auxílio de inteligência artificial. Do protótipo ao deploy, com banco de dados e integrações.",
    features: [
      "Apps sob medida",
      "Integração com IA",
      "Banco de dados",
      "Deploy automatizado",
    ],
  },
];

export function getServiceById(id: string): Service | undefined {
  return services.find((service) => service.id === id);
}

export function getServiceIcon(id: string): LucideIcon {
  const service = getServiceById(id);
  return service?.icon ?? Search;
}
