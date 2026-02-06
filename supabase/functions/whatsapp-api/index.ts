import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getWhatsAppConfig() {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const businessAccountId = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID");
  const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

  return { token, phoneNumberId, businessAccountId, verifyToken };
}

// ============= SEND TEXT MESSAGE =============
async function handleSendText(body: any, userId: string) {
  const { phone, message, lead_id } = body;
  if (!phone || !message) {
    return new Response(JSON.stringify({ error: "phone and message required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const config = getWhatsAppConfig();
  if (!config.token || !config.phoneNumberId) {
    return new Response(JSON.stringify({ error: "WhatsApp API not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID secrets." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cleanPhone = phone.replace(/\D/g, "");

  console.log(`[WhatsApp] Sending text to ${cleanPhone}`);

  // Call Meta Graph API
  const response = await fetch(
    `${GRAPH_API_BASE}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    }
  );

  const result = await response.json();
  console.log(`[WhatsApp] Meta API response:`, JSON.stringify(result));

  if (!response.ok) {
    // Save as failed
    const supabase = getSupabaseAdmin();
    await supabase.from("whatsapp_messages").insert({
      lead_id: lead_id || null,
      phone: cleanPhone,
      direction: "outbound",
      type: "text",
      content: message,
      status: "failed",
      metadata: { error: result },
      created_by: userId,
    });

    return new Response(JSON.stringify({ error: "Failed to send message", details: result }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const waMessageId = result.messages?.[0]?.id;

  // Save message to DB
  const supabase = getSupabaseAdmin();
  const { data: savedMsg, error: saveError } = await supabase.from("whatsapp_messages").insert({
    lead_id: lead_id || null,
    wa_message_id: waMessageId,
    phone: cleanPhone,
    direction: "outbound",
    type: "text",
    content: message,
    status: "sent",
    created_by: userId,
  }).select().single();

  if (saveError) console.error("[WhatsApp] Error saving message:", saveError);

  // Log activity
  if (lead_id) {
    await supabase.from("lead_activities").insert({
      lead_id,
      type: "whatsapp",
      description: `WhatsApp enviado: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`,
      created_by: userId,
      metadata: { wa_message_id: waMessageId, direction: "outbound" },
    });
  }

  return new Response(JSON.stringify({ success: true, message_id: waMessageId, data: savedMsg }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============= SEND TEMPLATE =============
async function handleSendTemplate(body: any, userId: string) {
  const { phone, template_name, language = "pt_BR", components, lead_id } = body;
  if (!phone || !template_name) {
    return new Response(JSON.stringify({ error: "phone and template_name required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const config = getWhatsAppConfig();
  if (!config.token || !config.phoneNumberId) {
    return new Response(JSON.stringify({ error: "WhatsApp API not configured" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cleanPhone = phone.replace(/\D/g, "");
  console.log(`[WhatsApp] Sending template "${template_name}" to ${cleanPhone}`);

  const templatePayload: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "template",
    template: {
      name: template_name,
      language: { code: language },
    },
  };

  if (components && components.length > 0) {
    templatePayload.template.components = components;
  }

  const response = await fetch(
    `${GRAPH_API_BASE}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templatePayload),
    }
  );

  const result = await response.json();
  console.log(`[WhatsApp] Template response:`, JSON.stringify(result));

  const supabase = getSupabaseAdmin();
  const waMessageId = result.messages?.[0]?.id;
  const status = response.ok ? "sent" : "failed";

  await supabase.from("whatsapp_messages").insert({
    lead_id: lead_id || null,
    wa_message_id: waMessageId,
    phone: cleanPhone,
    direction: "outbound",
    type: "template",
    content: `Template: ${template_name}`,
    template_name,
    status,
    metadata: response.ok ? { language, components } : { error: result },
    created_by: userId,
  });

  if (lead_id) {
    await supabase.from("lead_activities").insert({
      lead_id,
      type: "whatsapp",
      description: `Template WhatsApp "${template_name}" ${status === "sent" ? "enviado" : "falhou"}`,
      created_by: userId,
      metadata: { template_name, wa_message_id: waMessageId },
    });
  }

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Failed to send template", details: result }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, message_id: waMessageId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============= SYNC TEMPLATES =============
async function handleSyncTemplates() {
  const config = getWhatsAppConfig();
  if (!config.token || !config.businessAccountId) {
    return new Response(JSON.stringify({ error: "WhatsApp API not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID secrets." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("[WhatsApp] Syncing templates from Meta...");

  const response = await fetch(
    `${GRAPH_API_BASE}/${config.businessAccountId}/message_templates?limit=100`,
    {
      headers: { Authorization: `Bearer ${config.token}` },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error("[WhatsApp] Failed to fetch templates:", result);
    return new Response(JSON.stringify({ error: "Failed to fetch templates", details: result }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const templates = result.data || [];
  console.log(`[WhatsApp] Found ${templates.length} templates`);

  const supabase = getSupabaseAdmin();

  // Upsert templates
  for (const t of templates) {
    if (t.status !== "APPROVED") continue;

    const bodyComponent = t.components?.find((c: any) => c.type === "BODY");
    const content = bodyComponent?.text || "";

    await supabase.from("whatsapp_templates").upsert(
      {
        name: t.name,
        category: t.category?.toLowerCase() || "utility",
        content,
        is_active: true,
      },
      { onConflict: "name" }
    );
  }

  // Update config last_synced_at
  await supabase
    .from("whatsapp_config")
    .update({ last_synced_at: new Date().toISOString() })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // update all rows

  return new Response(JSON.stringify({ success: true, count: templates.filter((t: any) => t.status === "APPROVED").length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============= SEND BULK =============
async function handleSendBulk(body: any, userId: string) {
  const { lead_ids, template_name, language = "pt_BR", components } = body;
  if (!lead_ids?.length || !template_name) {
    return new Response(JSON.stringify({ error: "lead_ids and template_name required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const config = getWhatsAppConfig();
  if (!config.token || !config.phoneNumberId) {
    return new Response(JSON.stringify({ error: "WhatsApp API not configured" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabaseAdmin();

  // Fetch leads with phone numbers
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id, name, phone")
    .in("id", lead_ids)
    .not("phone", "is", null);

  if (leadsError || !leads?.length) {
    return new Response(JSON.stringify({ error: "No leads found with phone numbers" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[WhatsApp] Bulk sending template "${template_name}" to ${leads.length} leads`);

  const results: { lead_id: string; name: string; status: string; error?: any }[] = [];

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const cleanPhone = lead.phone!.replace(/\D/g, "");

    try {
      const templatePayload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "template",
        template: {
          name: template_name,
          language: { code: language },
        },
      };

      if (components?.length) {
        templatePayload.template.components = components;
      }

      const response = await fetch(
        `${GRAPH_API_BASE}/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templatePayload),
        }
      );

      const result = await response.json();
      const waMessageId = result.messages?.[0]?.id;
      const status = response.ok ? "sent" : "failed";

      // Save message
      await supabase.from("whatsapp_messages").insert({
        lead_id: lead.id,
        wa_message_id: waMessageId,
        phone: cleanPhone,
        direction: "outbound",
        type: "template",
        content: `Template: ${template_name}`,
        template_name,
        status,
        metadata: response.ok ? { bulk: true, language } : { error: result, bulk: true },
        created_by: userId,
      });

      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        type: "whatsapp",
        description: `Disparo em massa - Template "${template_name}" ${status === "sent" ? "enviado" : "falhou"}`,
        created_by: userId,
        metadata: { template_name, bulk: true },
      });

      results.push({ lead_id: lead.id, name: lead.name, status });

      // Rate limiting: 50ms delay between messages
      if (i < leads.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (err) {
      console.error(`[WhatsApp] Error sending to ${lead.name}:`, err);
      results.push({ lead_id: lead.id, name: lead.name, status: "failed", error: String(err) });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;
  console.log(`[WhatsApp] Bulk complete: ${sent} sent, ${failed} failed`);

  return new Response(JSON.stringify({ success: true, sent, failed, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============= WEBHOOK (GET - Verification) =============
function handleWebhookVerify(url: URL) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const config = getWhatsAppConfig();
  const verifyToken = config.verifyToken;

  console.log(`[WhatsApp Webhook] Verification request - mode: ${mode}, token match: ${token === verifyToken}`);

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new Response(challenge, { status: 200, headers: corsHeaders });
  }

  console.error("[WhatsApp Webhook] Verification failed");
  return new Response("Forbidden", { status: 403, headers: corsHeaders });
}

// ============= WEBHOOK (POST - Incoming Messages) =============
async function handleWebhookIncoming(body: any) {
  console.log("[WhatsApp Webhook] Incoming:", JSON.stringify(body));

  const supabase = getSupabaseAdmin();

  // Process message entries
  const entries = body?.entry || [];
  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      if (change.field !== "messages") continue;

      const value = change.value;

      // Process status updates
      const statuses = value?.statuses || [];
      for (const status of statuses) {
        const waId = status.id;
        const newStatus = status.status; // sent, delivered, read, failed
        console.log(`[WhatsApp Webhook] Status update: ${waId} -> ${newStatus}`);

        await supabase
          .from("whatsapp_messages")
          .update({ status: newStatus })
          .eq("wa_message_id", waId);
      }

      // Process incoming messages
      const messages = value?.messages || [];
      const contacts = value?.contacts || [];

      for (const msg of messages) {
        const phone = msg.from;
        const waMessageId = msg.id;
        const contactName = contacts?.[0]?.profile?.name || phone;

        console.log(`[WhatsApp Webhook] New message from ${phone} (${contactName}): ${msg.type}`);

        // Check for duplicate
        const { data: existing } = await supabase
          .from("whatsapp_messages")
          .select("id")
          .eq("wa_message_id", waMessageId)
          .maybeSingle();

        if (existing) {
          console.log("[WhatsApp Webhook] Duplicate message, skipping");
          continue;
        }

        // Find lead by phone
        const { data: lead } = await supabase
          .from("leads")
          .select("id")
          .or(`phone.eq.${phone},phone.eq.+${phone},phone.like.%${phone.slice(-8)}%`)
          .maybeSingle();

        // Extract content based on type
        let content = "";
        let type = msg.type || "text";
        const metadata: any = { contact_name: contactName };

        switch (type) {
          case "text":
            content = msg.text?.body || "";
            break;
          case "image":
            content = msg.image?.caption || "[Imagem]";
            metadata.media_id = msg.image?.id;
            break;
          case "audio":
            content = "[Áudio]";
            metadata.media_id = msg.audio?.id;
            break;
          case "document":
            content = msg.document?.caption || `[Documento: ${msg.document?.filename || ""}]`;
            metadata.media_id = msg.document?.id;
            metadata.filename = msg.document?.filename;
            break;
          case "video":
            content = msg.video?.caption || "[Vídeo]";
            metadata.media_id = msg.video?.id;
            break;
          case "sticker":
            content = "[Sticker]";
            metadata.media_id = msg.sticker?.id;
            break;
          case "location":
            content = `[Localização: ${msg.location?.latitude}, ${msg.location?.longitude}]`;
            metadata.location = msg.location;
            break;
          case "contacts":
            content = "[Contato compartilhado]";
            metadata.contacts = msg.contacts;
            break;
          default:
            content = `[${type}]`;
        }

        // Save inbound message
        await supabase.from("whatsapp_messages").insert({
          lead_id: lead?.id || null,
          wa_message_id: waMessageId,
          phone,
          direction: "inbound",
          type,
          content,
          status: "delivered",
          metadata,
        });

        // Log lead activity
        if (lead?.id) {
          await supabase.from("lead_activities").insert({
            lead_id: lead.id,
            type: "whatsapp",
            description: `WhatsApp recebido: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"`,
            metadata: { wa_message_id: waMessageId, direction: "inbound", contact_name: contactName },
          });
        }
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============= TEST CONNECTION =============
async function handleTestConnection() {
  const config = getWhatsAppConfig();
  if (!config.token || !config.phoneNumberId) {
    return new Response(JSON.stringify({ connected: false, error: "Secrets not configured" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${config.phoneNumberId}`,
      { headers: { Authorization: `Bearer ${config.token}` } }
    );
    const result = await response.json();

    if (response.ok) {
      return new Response(
        JSON.stringify({
          connected: true,
          phone_number: result.display_phone_number,
          quality_rating: result.quality_rating,
          verified_name: result.verified_name,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ connected: false, error: result.error?.message || "Unknown error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ connected: false, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// ============= GET CONFIG =============
async function handleGetConfig() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("whatsapp_config").select("*").limit(1).single();

  const config = getWhatsAppConfig();
  const hasSecrets = !!(config.token && config.phoneNumberId && config.businessAccountId);

  return new Response(
    JSON.stringify({
      config: data,
      has_secrets: hasSecrets,
      webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-api?action=webhook`,
      verify_token: data?.verify_token || "",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============= MAIN HANDLER =============
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  console.log(`[WhatsApp API] Action: ${action}, Method: ${req.method}`);

  // Webhook endpoints are public (no auth)
  if (action === "webhook") {
    if (req.method === "GET") {
      return handleWebhookVerify(url);
    }
    if (req.method === "POST") {
      const body = await req.json();
      return handleWebhookIncoming(body);
    }
  }

  // All other endpoints require authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check role
  const adminSupabase = getSupabaseAdmin();
  const { data: roles } = await adminSupabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const userRoles = roles?.map((r: any) => r.role) || [];
  const isAuthorized = userRoles.includes("admin") || userRoles.includes("account_manager");

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Forbidden - admin or account_manager role required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = req.method === "POST" ? await req.json() : {};
    // Support action from query param or body
    const finalAction = action || body.action;

    switch (finalAction) {
      case "send-text":
        return await handleSendText(body, user.id);
      case "send-template":
        return await handleSendTemplate(body, user.id);
      case "sync-templates":
        return await handleSyncTemplates();
      case "send-bulk":
        return await handleSendBulk(body, user.id);
      case "test-connection":
        return await handleTestConnection();
      case "get-config":
        return await handleGetConfig();
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${finalAction}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("[WhatsApp API] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
