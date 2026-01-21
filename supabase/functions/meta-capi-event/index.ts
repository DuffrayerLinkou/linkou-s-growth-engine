import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA256 hash function for PII data (required by Meta CAPI)
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
    return '55' + digitsOnly;
  }
  return digitsOnly;
}

// Extract first name from full name
function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

interface CAPIRequestBody {
  email: string;
  phone?: string;
  name: string;
  segment?: string;
  investment?: string;
  source_url: string;
  fbc?: string;
  fbp?: string;
  event_name?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CAPIRequestBody = await req.json();
    console.log('Received CAPI request:', { ...body, email: '[REDACTED]', phone: '[REDACTED]' });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch landing settings
    const { data: settings, error: settingsError } = await supabase
      .from('landing_settings')
      .select('meta_pixel_id, meta_capi_enabled, meta_capi_access_token, meta_capi_test_event_code')
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if CAPI is enabled
    if (!settings?.meta_capi_enabled || !settings?.meta_pixel_id || !settings?.meta_capi_access_token) {
      console.log('CAPI not enabled or missing configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'CAPI not enabled or missing configuration' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client info from request
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Hash PII data
    const hashedEmail = await sha256(body.email);
    const hashedFirstName = await sha256(getFirstName(body.name));
    const hashedPhone = body.phone ? await sha256(normalizePhone(body.phone)) : null;

    // Build user_data object
    const userData: Record<string, unknown> = {
      em: [hashedEmail],
      fn: [hashedFirstName],
      client_ip_address: clientIP !== 'unknown' ? clientIP : undefined,
      client_user_agent: userAgent,
    };

    // Add phone if available
    if (hashedPhone) {
      userData.ph = [hashedPhone];
    }

    // Add Facebook click/browser IDs if available
    if (body.fbc) {
      userData.fbc = body.fbc;
    }
    if (body.fbp) {
      userData.fbp = body.fbp;
    }

    // Generate event ID for deduplication
    const eventId = crypto.randomUUID();
    const eventTime = Math.floor(Date.now() / 1000);

    // Build the event payload
    const eventPayload: Record<string, unknown> = {
      data: [{
        event_name: body.event_name || 'Lead',
        event_time: eventTime,
        event_id: eventId,
        event_source_url: body.source_url,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          lead_type: 'audit_request',
          segment: body.segment || 'not_specified',
          investment: body.investment || 'not_specified',
        }
      }]
    };

    // Add test event code if configured
    if (settings.meta_capi_test_event_code) {
      eventPayload.test_event_code = settings.meta_capi_test_event_code;
    }

    console.log('Sending event to Meta CAPI:', JSON.stringify(eventPayload, null, 2));

    // Send to Meta Conversions API
    const metaApiUrl = `https://graph.facebook.com/v18.0/${settings.meta_pixel_id}/events?access_token=${settings.meta_capi_access_token}`;
    
    const metaResponse = await fetch(metaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    const metaResult = await metaResponse.json();
    console.log('Meta CAPI response:', metaResult);

    if (!metaResponse.ok) {
      console.error('Meta CAPI error:', metaResult);
      return new Response(
        JSON.stringify({ success: false, error: 'Meta API error', details: metaResult }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: eventId,
        events_received: metaResult.events_received,
        fbtrace_id: metaResult.fbtrace_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing CAPI request:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
