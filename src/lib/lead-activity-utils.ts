import { supabase } from "@/integrations/supabase/client";

export type LeadActivityType = "call" | "whatsapp" | "email" | "note" | "status_change";

export async function logLeadActivity(
  leadId: string,
  type: LeadActivityType,
  description: string,
  metadata?: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await (supabase.from("lead_activities") as any).insert({
    lead_id: leadId,
    type,
    description,
    created_by: user?.id || null,
    metadata: metadata || {},
  });

  if (error) {
    console.error("Error logging lead activity:", error);
    throw error;
  }
}

export function replaceTemplateVars(
  content: string,
  lead: { name: string; segment?: string | null; objective?: string | null }
): string {
  return content
    .replace(/\{\{nome\}\}/g, lead.name)
    .replace(/\{\{segmento\}\}/g, lead.segment || "")
    .replace(/\{\{objetivo\}\}/g, lead.objective || "");
}
