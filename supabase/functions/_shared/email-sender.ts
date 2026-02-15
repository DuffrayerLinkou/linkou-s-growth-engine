// Centralized email sender — calls the send-email edge function with service role key

export async function sendNotificationEmail(
  to: string | string[],
  subject: string,
  html: string,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[email-sender] Failed to send email to ${to}:`, err);
    } else {
      console.log(`[email-sender] Email sent to ${to}: ${subject}`);
    }
  } catch (e) {
    console.error("[email-sender] Error:", e);
  }
}
