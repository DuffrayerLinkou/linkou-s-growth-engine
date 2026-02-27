

# Fix: Email Sending 401 Error

## Root Cause

The `send-email` edge function validates user JWTs by dynamically importing `@supabase/supabase-js@2.39.3` (old version). This fails with the current ES256 JWT format, causing every frontend email send to return 401.

The `notify-email` function (automations) calls `send-email` via service role key, so it should work — but the `email-sender.ts` shared module also relies on `send-email` being functional.

## Fix

### `supabase/functions/send-email/index.ts`

Replace the dynamic import + old supabase client auth validation with a direct HTTP call to the Supabase Auth API (`/auth/v1/user`). This is version-independent and reliable.

```typescript
// Replace lines 38-52 (the dynamic import auth block) with:
if (!isServiceRole) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader || "",
      apikey: Deno.env.get("SUPABASE_ANON_KEY") || apikey || "",
    },
  });
  if (!res.ok) {
    await res.text(); // consume body
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  await res.json(); // consume body
}
```

This removes the dependency on `esm.sh/@supabase/supabase-js@2.39.3` entirely.

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/send-email/index.ts` | Replace dynamic import auth with direct Auth API call |

