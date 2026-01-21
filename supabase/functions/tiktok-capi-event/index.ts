import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA256 hash function for PII data (required by TikTok Events API)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize phone number for hashing
function normalizePhone(phone: string): string {
  // Remove all non-digit characters and add country code if not present
  const digitsOnly = phone.replace(/\D/g, '');
  // If Brazilian number without country code, add +55
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return '+55' + digitsOnly;
  }
  return '+' + digitsOnly;
}

interface TikTokCAPIRequestBody {
  email: string;
  phone?: string;
  name?: string;
  segment?: string;
  investment?: string;
  source_url: string;
  ttclid?: string;
  ttp?: string;
  event_name?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TikTokCAPIRequestBody = await req.json();
    console.log('Received TikTok CAPI request:', { ...body, email: '[REDACTED]', phone: '[REDACTED]' });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch landing settings
    const { data: settings, error: settingsError } = await supabase
      .from('landing_settings')
      .select('tiktok_pixel_id, tiktok_capi_enabled, tiktok_access_token, tiktok_test_event_code')
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if TikTok CAPI is enabled
    if (!settings?.tiktok_capi_enabled || !settings?.tiktok_pixel_id || !settings?.tiktok_access_token) {
      console.log('TikTok CAPI not enabled or missing configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'TikTok CAPI not enabled or missing configuration' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client info from request
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     '';
    const userAgent = req.headers.get('user-agent') || '';

    // Hash PII data (TikTok requires SHA256 hashing)
    const hashedEmail = await sha256(body.email);
    const hashedPhone = body.phone ? await sha256(normalizePhone(body.phone)) : null;

    // Generate event ID for deduplication
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Build user object (TikTok format)
    const user: Record<string, unknown> = {
      email: hashedEmail,
    };

    if (hashedPhone) {
      user.phone = hashedPhone;
    }

    if (clientIP) {
      user.ip = clientIP;
    }

    if (userAgent) {
      user.user_agent = userAgent;
    }

    // Add TikTok click ID if available
    if (body.ttclid) {
      user.ttclid = body.ttclid;
    }

    // Add TikTok cookie if available
    if (body.ttp) {
      user.ttp = body.ttp;
    }

    // Build the event payload (TikTok Events API format)
    const eventPayload = {
      pixel_code: settings.tiktok_pixel_id,
      event: body.event_name || 'SubmitForm',
      event_id: eventId,
      timestamp: timestamp,
      context: {
        page: {
          url: body.source_url,
        },
        user: user,
        user_agent: userAgent,
        ip: clientIP,
      },
      properties: {
        content_type: 'product',
        contents: [{
          content_id: 'audit_request',
          content_name: 'Traffic Audit Request',
          content_category: body.segment || 'general',
        }],
        description: `Lead from landing page - ${body.segment || 'general'}`,
      },
    };

    // Add test event code if configured
    const requestPayload: Record<string, unknown> = {
      data: [eventPayload],
    };

    if (settings.tiktok_test_event_code) {
      requestPayload.test_event_code = settings.tiktok_test_event_code;
    }

    console.log('Sending event to TikTok Events API:', JSON.stringify(requestPayload, null, 2));

    // Send to TikTok Events API
    const tiktokApiUrl = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
    
    const tiktokResponse = await fetch(tiktokApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': settings.tiktok_access_token,
      },
      body: JSON.stringify(requestPayload),
    });

    const tiktokResult = await tiktokResponse.json();
    console.log('TikTok Events API response:', tiktokResult);

    if (!tiktokResponse.ok || tiktokResult.code !== 0) {
      console.error('TikTok Events API error:', tiktokResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TikTok API error', 
          details: tiktokResult,
          code: tiktokResult.code,
          message: tiktokResult.message 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: eventId,
        code: tiktokResult.code,
        message: tiktokResult.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing TikTok CAPI request:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
