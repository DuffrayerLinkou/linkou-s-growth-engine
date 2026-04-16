// Shared config for campaign channels and their dynamic metrics

export const platformLabels: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
  email_marketing: "E-mail Marketing",
  whatsapp: "WhatsApp",
  database_blast: "Disparo Banco de Dados",
  organic: "Orgânico / SEO",
  event: "Evento / Presencial",
  other: "Outro",
};

export const platformObjectives: Record<string, string[]> = {
  meta_ads: ["Reconhecimento", "Tráfego", "Engajamento", "Leads", "Vendas", "Promoção de App"],
  google_ads: ["Search", "Display", "Video (YouTube)", "Shopping", "Performance Max"],
  tiktok: ["Alcance", "Tráfego", "Visualizações de Vídeo", "Conversões"],
  linkedin: ["Reconhecimento", "Visitas ao Site", "Engajamento", "Leads", "Conversões"],
  email_marketing: ["Nutrição", "Conversão", "Retenção", "Reengajamento"],
  whatsapp: ["Disparo em Massa", "Atendimento", "Follow-up", "Promoção"],
  database_blast: ["Reativação", "Prospecção", "Upsell", "Comunicação"],
  organic: ["Tráfego Orgânico", "Autoridade", "SEO Local", "Branding"],
  event: ["Networking", "Geração de Leads", "Lançamento", "Relacionamento"],
  other: ["Awareness", "Conversão", "Retenção", "Outro"],
};

// Which channels are "ads" type (have impressions, clicks, CTR, etc.)
const adsChannels = ["meta_ads", "google_ads", "tiktok", "linkedin"];
const messagingChannels = ["email_marketing", "database_blast"];
const directChannels = ["whatsapp"];
const contentChannels = ["organic", "event", "other"];

export type MetricFieldConfig = {
  key: string;
  label: string;
  type: "number" | "currency" | "percent";
  computed?: boolean; // auto-calculated
};

const adsMetrics: MetricFieldConfig[] = [
  { key: "impressoes", label: "Impressões", type: "number" },
  { key: "alcance", label: "Alcance", type: "number" },
  { key: "cliques", label: "Cliques", type: "number" },
  { key: "ctr", label: "CTR (%)", type: "percent", computed: true },
  { key: "leads", label: "Leads", type: "number" },
  { key: "conversoes", label: "Conversões", type: "number" },
  { key: "custo", label: "Custo Total (R$)", type: "currency" },
  { key: "cpc", label: "CPC", type: "currency", computed: true },
  { key: "cpl", label: "CPL", type: "currency", computed: true },
  { key: "roas", label: "ROAS", type: "number" },
];

const messagingMetrics: MetricFieldConfig[] = [
  { key: "enviados", label: "Enviados", type: "number" },
  { key: "entregues", label: "Entregues", type: "number" },
  { key: "aberturas", label: "Aberturas", type: "number" },
  { key: "taxa_abertura", label: "Taxa Abertura (%)", type: "percent", computed: true },
  { key: "cliques", label: "Cliques", type: "number" },
  { key: "taxa_cliques", label: "Taxa Cliques (%)", type: "percent", computed: true },
  { key: "respostas", label: "Respostas", type: "number" },
  { key: "conversoes", label: "Conversões", type: "number" },
  { key: "custo", label: "Custo Total (R$)", type: "currency" },
];

const directMetrics: MetricFieldConfig[] = [
  { key: "enviados", label: "Enviados", type: "number" },
  { key: "entregues", label: "Entregues", type: "number" },
  { key: "lidos", label: "Lidos", type: "number" },
  { key: "respostas", label: "Respostas", type: "number" },
  { key: "conversoes", label: "Conversões", type: "number" },
  { key: "custo", label: "Custo Total (R$)", type: "currency" },
];

const contentMetrics: MetricFieldConfig[] = [
  { key: "alcance", label: "Alcance", type: "number" },
  { key: "impressoes", label: "Impressões", type: "number" },
  { key: "leads", label: "Leads", type: "number" },
  { key: "conversoes", label: "Conversões", type: "number" },
  { key: "custo", label: "Custo Total (R$)", type: "currency" },
];

export function getMetricsForChannel(platform: string): MetricFieldConfig[] {
  if (adsChannels.includes(platform)) return adsMetrics;
  if (messagingChannels.includes(platform)) return messagingMetrics;
  if (directChannels.includes(platform)) return directMetrics;
  return contentMetrics;
}

export function computeMetrics(platform: string, raw: Record<string, string>): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  const fields = getMetricsForChannel(platform);

  // Store all raw values
  for (const field of fields) {
    if (!field.computed) {
      const val = parseFloat(raw[field.key] || "");
      result[field.key] = isNaN(val) ? null : val;
    }
  }

  // Compute derived fields
  const impressoes = result.impressoes || 0;
  const cliques = result.cliques || 0;
  const custo = result.custo || 0;
  const leads = result.leads || 0;
  const enviados = result.enviados || 0;
  const aberturas = result.aberturas || 0;

  if (adsChannels.includes(platform)) {
    result.ctr = impressoes > 0 ? +((cliques / impressoes) * 100).toFixed(2) : null;
    result.cpc = cliques > 0 ? +(custo / cliques).toFixed(2) : null;
    result.cpl = leads > 0 ? +(custo / leads).toFixed(2) : null;
  }

  if (messagingChannels.includes(platform)) {
    result.taxa_abertura = enviados > 0 ? +((aberturas / enviados) * 100).toFixed(2) : null;
    result.taxa_cliques = enviados > 0 ? +((cliques / enviados) * 100).toFixed(2) : null;
  }

  return result;
}

// Display formatting for the client side
export const allMetricLabels: Record<string, string> = {
  impressoes: "Impressões",
  alcance: "Alcance",
  cliques: "Cliques",
  ctr: "CTR",
  leads: "Leads",
  conversoes: "Conversões",
  custo: "Custo",
  cpc: "CPC",
  cpl: "CPL",
  roas: "ROAS",
  enviados: "Enviados",
  entregues: "Entregues",
  aberturas: "Aberturas",
  taxa_abertura: "Taxa Abertura",
  taxa_cliques: "Taxa Cliques",
  lidos: "Lidos",
  respostas: "Respostas",
  // Legacy keys
  impressions: "Impressões",
  clicks: "Cliques",
  cost: "Custo",
  reach: "Alcance",
  frequency: "Frequência",
  spend: "Investimento",
  investimento: "Investimento",
  vendas: "Vendas",
  sales: "Vendas",
  conversions: "Conversões",
  frequencia: "Frequência",
};

export const currencyKeys = new Set(["custo", "cpc", "cpl", "cost", "spend", "investimento"]);
export const percentKeys = new Set(["ctr", "taxa_abertura", "taxa_cliques"]);

export function formatMetricValue(key: string, value: unknown): string {
  if (value == null) return "—";
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);

  if (currencyKeys.has(key.toLowerCase())) {
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (percentKeys.has(key.toLowerCase())) {
    return `${num.toFixed(2)}%`;
  }
  return num.toLocaleString("pt-BR");
}
