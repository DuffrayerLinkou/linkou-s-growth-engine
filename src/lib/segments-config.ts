// Centralized segment options for clients

import {
  Building2,
  Home,
  Car,
  Key,
  Briefcase,
  ShoppingCart,
  Cloud,
  GraduationCap,
  Heart,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const clientSegments = [
  "Construtora / Incorporadora",
  "Imobiliária",
  "Concessionária",
  "Locadora de Veículos",
  "B2B / Serviços",
  "E-commerce",
  "SaaS",
  "Educação",
  "Saúde",
  "Outro",
];

// Landing page uses a subset of segments
export const landingSegments = [
  "Construtora / Incorporadora",
  "Imobiliária",
  "Concessionária",
  "Locadora de Veículos",
  "B2B / Serviços",
  "E-commerce",
  "Outro",
];

// Segment icons mapping
export const segmentIcons: Record<string, LucideIcon> = {
  "Construtora / Incorporadora": Building2,
  "Imobiliária": Home,
  "Concessionária": Car,
  "Locadora de Veículos": Key,
  "B2B / Serviços": Briefcase,
  "E-commerce": ShoppingCart,
  "SaaS": Cloud,
  "Educação": GraduationCap,
  "Saúde": Heart,
  "Outro": HelpCircle,
};

// Get icon for a segment, with fallback
export const getSegmentIcon = (segment: string | null | undefined): LucideIcon => {
  if (!segment) return HelpCircle;
  return segmentIcons[segment] || HelpCircle;
};
