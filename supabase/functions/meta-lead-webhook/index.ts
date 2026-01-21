import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify HMAC-SHA256 signature from Meta
async function verifySignature(payload: string, signature: string, appSecret: string): Promise<boolean> {
  if (!signature || !appSecret) return false;
  
  const expectedSignature = signature.replace('sha256=', '');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedSignature === expectedSignature;
}

// Fetch lead data from Meta Graph API
async function fetchLeadData(leadgenId: string, pageAccessToken: string): Promise<any> {
  const url = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${pageAccessToken}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    console.error('Error fetching lead data:', error);
    throw new Error(`Failed to fetch lead data: ${error}`);
  }
  
  return response.json();
}

// Parse lead field data from Meta format
function parseLeadFields(fieldData: Array<{ name: string; values: string[] }>): Record<string, string> {
  const parsed: Record<string, string> = {};
  
  for (const field of fieldData) {
    const value = field.values?.[0] || '';
    const name = field.name.toLowerCase();
    
    // Map common field names
    if (name.includes('name') || name === 'full_name') {
      parsed.name = value;
    } else if (name.includes('email')) {
      parsed.email = value;
    } else if (name.includes('phone') || name.includes('telefone')) {
      parsed.phone = value;
    } else if (name.includes('segment') || name.includes('segmento') || name.includes('nicho')) {
      parsed.segment = value;
    } else if (name.includes('invest') || name.includes('budget') || name.includes('orçamento')) {
      parsed.investment = value;
    } else if (name.includes('objective') || name.includes('objetivo') || name.includes('goal')) {
      parsed.objective = value;
    }
  }
  
  return parsed;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch landing settings
    const { data: settings, error: settingsError } = await supabase
      .from('landing_settings')
      .select('meta_webhook_verify_token, meta_app_secret, meta_page_access_token')
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(JSON.stringify({ error: 'Settings not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle webhook verification (GET request from Meta)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification request:', { mode, token, challenge: challenge?.substring(0, 10) });

      if (mode === 'subscribe' && token === settings?.meta_webhook_verify_token) {
        console.log('Webhook verified successfully');
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      console.error('Webhook verification failed - token mismatch');
      return new Response('Forbidden', {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Handle leadgen webhook (POST request from Meta)
    if (req.method === 'POST') {
      const rawBody = await req.text();
      const signature = req.headers.get('x-hub-signature-256') || '';
      
      console.log('Received webhook POST, signature present:', !!signature);

      // Verify signature if app secret is configured
      if (settings?.meta_app_secret) {
        const isValid = await verifySignature(rawBody, signature, settings.meta_app_secret);
        if (!isValid) {
          console.error('Invalid webhook signature');
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log('Signature verified successfully');
      } else {
        console.warn('App secret not configured - skipping signature verification');
      }

      const body = JSON.parse(rawBody);
      console.log('Webhook payload:', JSON.stringify(body, null, 2));

      // Process each entry
      if (body.object === 'page' && body.entry) {
        for (const entry of body.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'leadgen' && change.value?.leadgen_id) {
                const leadgenId = change.value.leadgen_id;
                console.log('Processing leadgen_id:', leadgenId);

                if (!settings?.meta_page_access_token) {
                  console.error('Page access token not configured');
                  continue;
                }

                try {
                  // Fetch full lead data from Graph API
                  const leadData = await fetchLeadData(leadgenId, settings.meta_page_access_token);
                  console.log('Lead data from Graph API:', JSON.stringify(leadData, null, 2));

                  // Parse lead fields
                  const parsedFields = parseLeadFields(leadData.field_data || []);
                  console.log('Parsed fields:', parsedFields);

                  // Insert lead into database
                  const { data: insertedLead, error: insertError } = await supabase
                    .from('leads')
                    .insert({
                      name: parsedFields.name || 'Lead do Meta',
                      email: parsedFields.email || `lead-${leadgenId}@meta.temp`,
                      phone: parsedFields.phone || null,
                      segment: parsedFields.segment || null,
                      investment: parsedFields.investment || null,
                      objective: parsedFields.objective || null,
                      source: 'meta_instant_form',
                      status: 'new',
                    })
                    .select()
                    .single();

                  if (insertError) {
                    console.error('Error inserting lead:', insertError);
                  } else {
                    console.log('Lead inserted successfully:', insertedLead.id);
                  }
                } catch (fetchError) {
                  console.error('Error processing lead:', fetchError);
                }
              }
            }
          }
        }
      }

      // Always respond with 200 to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
