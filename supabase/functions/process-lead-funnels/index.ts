import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendNotificationEmail } from "../_shared/email-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getAdminClient();
    const now = new Date();

    console.log("[process-lead-funnels] Starting at", now.toISOString());

    // Fetch all active enrollments with their lead and funnel info
    const { data: enrollments, error: enrollErr } = await supabase
      .from("lead_funnel_enrollments")
      .select(`
        id,
        enrolled_at,
        lead_id,
        funnel_id,
        status,
        leads!inner(id, name, email, segment, objective, status)
      `)
      .eq("status", "active");

    if (enrollErr) {
      throw new Error(`Failed to fetch enrollments: ${enrollErr.message}`);
    }

    if (!enrollments || enrollments.length === 0) {
      console.log("[process-lead-funnels] No active enrollments found.");
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[process-lead-funnels] Found ${enrollments.length} active enrollments`);

    let processed = 0;
    let skipped = 0;

    for (const enrollment of enrollments) {
      const lead = enrollment.leads as any;

      // Pause enrollment if lead is converted or archived
      if (lead.status === "converted" || lead.status === "archived") {
        await supabase
          .from("lead_funnel_enrollments")
          .update({ status: lead.status === "converted" ? "completed" : "paused" })
          .eq("id", enrollment.id);
        console.log(`[process-lead-funnels] Paused enrollment ${enrollment.id} for lead status: ${lead.status}`);
        continue;
      }

      const enrolledAt = new Date(enrollment.enrolled_at);
      const daysSinceEnroll = Math.floor((now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24));

      // Fetch all steps for this funnel ordered by delay_days
      const { data: steps, error: stepsErr } = await supabase
        .from("email_funnel_steps")
        .select("*")
        .eq("funnel_id", enrollment.funnel_id)
        .order("delay_days", { ascending: true });

      if (stepsErr || !steps) continue;

      // Fetch already sent step IDs for this enrollment
      const { data: sentRows } = await supabase
        .from("lead_funnel_emails_sent")
        .select("step_id")
        .eq("enrollment_id", enrollment.id);

      const sentStepIds = new Set((sentRows || []).map((r: any) => r.step_id));

      // Find steps that should be sent now and haven't been sent yet
      for (const step of steps) {
        if (sentStepIds.has(step.id)) continue;
        if (daysSinceEnroll < step.delay_days) continue;

        // Send email
        const vars = {
          nome: lead.name || "",
          segmento: lead.segment || "",
          objetivo: lead.objective || "",
        };

        const subject = interpolate(step.subject, vars);
        const htmlBody = interpolate(step.html_body, vars);

        try {
          await sendNotificationEmail(lead.email, subject, htmlBody);

          // Record as sent
          await supabase.from("lead_funnel_emails_sent").insert({
            enrollment_id: enrollment.id,
            step_id: step.id,
          });

          console.log(`[process-lead-funnels] Sent step ${step.step_number} (day ${step.delay_days}) to ${lead.email}`);
          processed++;
        } catch (emailErr) {
          console.error(`[process-lead-funnels] Failed to send email to ${lead.email}:`, emailErr);
          skipped++;
        }
      }

      // Check if all steps have been sent — mark enrollment as completed
      const allSent = steps.every((s: any) => sentStepIds.has(s.id) || steps.filter((st: any) => st.delay_days <= daysSinceEnroll).some((st: any) => st.id === s.id));
      const pendingSteps = steps.filter((s: any) => !sentStepIds.has(s.id) && s.delay_days > daysSinceEnroll);
      if (pendingSteps.length === 0 && steps.length > 0) {
        const { data: freshSent } = await supabase
          .from("lead_funnel_emails_sent")
          .select("step_id")
          .eq("enrollment_id", enrollment.id);
        const freshSentIds = new Set((freshSent || []).map((r: any) => r.step_id));
        if (steps.every((s: any) => freshSentIds.has(s.id))) {
          await supabase
            .from("lead_funnel_enrollments")
            .update({ status: "completed" })
            .eq("id", enrollment.id);
          console.log(`[process-lead-funnels] Enrollment ${enrollment.id} completed — all steps sent.`);
        }
      }
    }

    console.log(`[process-lead-funnels] Done. Processed: ${processed}, Skipped: ${skipped}`);

    return new Response(JSON.stringify({ success: true, processed, skipped }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[process-lead-funnels] Error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
