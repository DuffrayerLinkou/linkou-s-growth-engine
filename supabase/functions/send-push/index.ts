import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
  user_ids?: string[]; // Optional: send to specific users
}

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Web Push signing using native crypto
async function generateVapidJWT(
  audience: string,
  subject: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0)
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(signingInput)
  );

  // Convert signature to base64url
  const signatureArray = new Uint8Array(signature);
  const signatureB64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${signatureB64}`;
}

async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;

    // Generate VAPID JWT
    const jwt = await generateVapidJWT(audience, vapidSubject, vapidPrivateKey);

    // Prepare payload
    const payloadBytes = new TextEncoder().encode(
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
        icon: payload.icon || "/icons/icon-192x192.png",
        tag: payload.tag || "linkou-notification",
      })
    );

    // For simplicity, send unencrypted (requires HTTPS endpoint which push services use)
    // In production, you'd want to use web-push library or implement full encryption
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
        TTL: "86400",
        Urgency: "normal",
      },
      body: payloadBytes,
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is admin
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const payload: PushPayload = await req.json();

    if (!payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: "Title and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch subscriptions
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase.from("push_subscriptions").select("*");

    if (payload.user_ids && payload.user_ids.length > 0) {
      query = query.in("user_id", payload.user_ids);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, message: "No subscriptions found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send notifications
    const vapidSubject = "mailto:contato@linkou.com.br";
    const results = await Promise.all(
      subscriptions.map((sub) =>
        sendPushNotification(sub as PushSubscription, payload, vapidPublicKey, vapidPrivateKey, vapidSubject)
      )
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Clean up failed subscriptions (410 Gone means subscription expired)
    const failedIndices = results
      .map((r, i) => (r.error?.includes("410") ? i : -1))
      .filter((i) => i >= 0);

    if (failedIndices.length > 0) {
      const expiredEndpoints = failedIndices.map((i) => subscriptions[i].endpoint);
      await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({
        sent,
        failed,
        cleaned: failedIndices.length,
        total: subscriptions.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Send push error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
