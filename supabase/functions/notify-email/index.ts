import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendNotificationEmail } from "../_shared/email-sender.ts";
import {
  taskAssignedEmail,
  taskCompletedEmail,
  campaignPendingApprovalEmail,
  campaignApprovedEmail,
  appointmentCreatedEmail,
  phaseChangedEmail,
  newCommentEmail,
  paymentRegisteredEmail,
  passwordChangedEmail,
  leadThankYouEmail,
} from "../_shared/email-templates.ts";

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

async function getPontoFocalEmails(supabase: ReturnType<typeof createClient>, clientId: string): Promise<string[]> {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("client_id", clientId)
    .eq("ponto_focal", true);
  return data?.map((p: any) => p.email).filter(Boolean) || [];
}

async function getAdminEmails(supabase: ReturnType<typeof createClient>): Promise<string[]> {
  const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  if (!roles || roles.length === 0) return [];
  const userIds = roles.map((r: any) => r.user_id);
  const { data: profiles } = await supabase.from("profiles").select("email").in("id", userIds);
  return profiles?.map((p: any) => p.email).filter(Boolean) || [];
}

async function getClientName(supabase: ReturnType<typeof createClient>, clientId: string): Promise<string> {
  const { data } = await supabase.from("clients").select("name").eq("id", clientId).single();
  return data?.name || "Cliente";
}

async function getUserName(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single();
  return data?.full_name || data?.email || "Usuário";
}

async function getUserEmail(supabase: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).single();
  return data?.email || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getAdminClient();
    const { event_type, ...payload } = await req.json();

    console.log(`[notify-email] Event: ${event_type}`, JSON.stringify(payload));

    switch (event_type) {
      // ── Tasks ──
      case "task_assigned": {
        const { client_id, task_title, due_date } = payload;
        const clientName = await getClientName(supabase, client_id);
        const emails = await getPontoFocalEmails(supabase, client_id);
        if (emails.length > 0) {
          const { subject, html } = taskAssignedEmail(clientName, task_title, due_date || null);
          await sendNotificationEmail(emails, subject, html);
        }
        break;
      }

      case "task_completed": {
        const { client_id, task_title } = payload;
        const clientName = await getClientName(supabase, client_id);
        const adminEmails = await getAdminEmails(supabase);
        const pfEmails = await getPontoFocalEmails(supabase, client_id);
        const allEmails = [...new Set([...adminEmails, ...pfEmails])];
        if (allEmails.length > 0) {
          const { subject, html } = taskCompletedEmail(clientName, task_title);
          await sendNotificationEmail(allEmails, subject, html);
        }
        break;
      }

      // ── Campaigns ──
      case "campaign_pending_approval": {
        const { client_id, campaign_name } = payload;
        const clientName = await getClientName(supabase, client_id);
        const emails = await getPontoFocalEmails(supabase, client_id);
        if (emails.length > 0) {
          const { subject, html } = campaignPendingApprovalEmail(clientName, campaign_name);
          await sendNotificationEmail(emails, subject, html);
        }
        break;
      }

      case "campaign_approved": {
        const { client_id, campaign_name, approver_name } = payload;
        const clientName = await getClientName(supabase, client_id);
        const adminEmails = await getAdminEmails(supabase);
        if (adminEmails.length > 0) {
          const { subject, html } = campaignApprovedEmail(clientName, campaign_name, approver_name);
          await sendNotificationEmail(adminEmails, subject, html);
        }
        break;
      }

      // ── Appointments ──
      case "appointment_created": {
        const { client_id, title, appointment_date } = payload;
        const clientName = await getClientName(supabase, client_id);
        const dateStr = new Date(appointment_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
        const adminEmails = await getAdminEmails(supabase);
        const pfEmails = await getPontoFocalEmails(supabase, client_id);
        const allEmails = [...new Set([...adminEmails, ...pfEmails])];
        if (allEmails.length > 0) {
          const { subject, html } = appointmentCreatedEmail(title, dateStr, clientName);
          await sendNotificationEmail(allEmails, subject, html);
        }
        break;
      }

      // ── Journey ──
      case "phase_changed": {
        const { client_id, from_phase, to_phase } = payload;
        const clientName = await getClientName(supabase, client_id);
        const emails = await getPontoFocalEmails(supabase, client_id);
        if (emails.length > 0) {
          const { subject, html } = phaseChangedEmail(clientName, from_phase, to_phase);
          await sendNotificationEmail(emails, subject, html);
        }
        break;
      }

      // ── Comments ──
      case "new_comment": {
        const { client_id, commenter_name, entity_label, entity_type, commenter_is_admin } = payload;
        const comment_preview = (payload.comment_preview || "").substring(0, 150);
        let emails: string[] = [];
        if (commenter_is_admin) {
          emails = await getPontoFocalEmails(supabase, client_id);
        } else {
          emails = await getAdminEmails(supabase);
        }
        if (emails.length > 0) {
          const { subject, html } = newCommentEmail(commenter_name, entity_label, comment_preview, entity_type);
          await sendNotificationEmail(emails, subject, html);
        }
        break;
      }

      // ── Payments ──
      case "payment_registered": {
        const { client_id, amount, description, due_date } = payload;
        const clientName = await getClientName(supabase, client_id);
        const emails = await getPontoFocalEmails(supabase, client_id);
        if (emails.length > 0) {
          const { subject, html } = paymentRegisteredEmail(clientName, amount, description || "Pagamento", due_date || null);
          await sendNotificationEmail(emails, subject, html);
        }
        break;
      }

      // ── Password changed ──
      case "password_changed": {
        const { user_id, new_password } = payload;
        const userName = await getUserName(supabase, user_id);
        const { data: profile } = await supabase.from("profiles").select("email").eq("id", user_id).single();
        if (profile?.email) {
          const { subject, html } = passwordChangedEmail(userName, new_password);
          await sendNotificationEmail(profile.email, subject, html);
        }
        break;
      }

      // ── Lead Thank You ──
      case "lead_submitted": {
        const { lead_name, lead_email } = payload;
        if (lead_email) {
          const { subject, html } = leadThankYouEmail(lead_name || "");
          await sendNotificationEmail(lead_email, subject, html);
        }
        break;
      }

      default:
        console.warn(`[notify-email] Unknown event type: ${event_type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[notify-email] Error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
