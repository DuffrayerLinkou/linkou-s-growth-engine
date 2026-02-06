import { supabase } from "@/integrations/supabase/client";

// Mapeamento de status CRM para eventos Meta
const CRM_EVENT_MAP: Record<string, string | null> = {
  contacted: "Contact",
  qualified: "Lead",
  proposal: "InitiateCheckout",
  converted: "Purchase",
  lost: null,
  archived: null,
};

interface CRMLeadData {
  email: string;
  phone: string | null;
  name: string;
  segment: string | null;
  objective?: string | null;
}

/**
 * Envia evento de conversão offline do CRM para o Meta CAPI.
 * Verifica se o toggle meta_capi_crm_events_enabled está ativo antes de enviar.
 */
export async function sendCRMEventToMeta(lead: CRMLeadData, newStatus: string): Promise<void> {
  const eventName = CRM_EVENT_MAP[newStatus];
  if (!eventName) return; // status sem evento associado

  try {
    // Verificar se o envio de eventos CRM está habilitado
    const { data: settings } = await supabase
      .from("landing_settings")
      .select("meta_capi_crm_events_enabled, meta_capi_enabled")
      .maybeSingle();

    if (!settings?.meta_capi_crm_events_enabled || !settings?.meta_capi_enabled) {
      console.log("[CRM CAPI] Envio de eventos CRM desabilitado");
      return;
    }

    console.log(`[CRM CAPI] Enviando evento "${eventName}" para status "${newStatus}"`);

    await supabase.functions.invoke("meta-capi-event", {
      body: {
        email: lead.email,
        phone: lead.phone,
        name: lead.name,
        segment: lead.segment,
        source_url: window.location.origin,
        event_name: eventName,
        crm_stage: newStatus,
      },
    });

    console.log(`[CRM CAPI] Evento "${eventName}" enviado com sucesso`);
  } catch (error) {
    console.error("[CRM CAPI] Erro ao enviar evento:", error);
  }
}
