import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendNotificationEmail } from "../_shared/email-sender.ts";
import {
  taskDeadlineReminderEmail,
  appointmentReminderEmail,
  paymentDueReminderEmail,
} from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const expectedToken = Deno.env.get("CRON_SECRET_TOKEN");
  const authHeader = req.headers.get("Authorization");

  if (!expectedToken) {
    console.error("CRON_SECRET_TOKEN not configured");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    console.warn("Unauthorized access attempt to check-task-deadlines");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    console.log("Starting check-task-deadlines function");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysStr = threeDaysLater.toISOString().split("T")[0];

    let totalNotifications = 0;
    let totalEmails = 0;

    // ═══ 1. TASK DEADLINE REMINDERS ═══
    console.log(`Checking tasks with deadlines: today=${todayStr}, tomorrow=${tomorrowStr}`);

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, due_date, client_id, status, assigned_to, visible_to_client")
      .in("due_date", [todayStr, tomorrowStr])
      .neq("status", "completed")
      .eq("visible_to_client", true);

    if (tasksError) throw tasksError;

    console.log(`Found ${tasks?.length || 0} tasks with upcoming deadlines`);

    if (tasks && tasks.length > 0) {
      const clientIds = [...new Set(tasks.map((t) => t.client_id))];

      const { data: clientUsers } = await supabase
        .from("profiles")
        .select("id, email, client_id")
        .in("client_id", clientIds);

      const clientUserMap: Record<string, Array<{ id: string; email: string }>> = {};
      clientUsers?.forEach((user) => {
        if (user.client_id) {
          if (!clientUserMap[user.client_id]) clientUserMap[user.client_id] = [];
          clientUserMap[user.client_id].push({ id: user.id, email: user.email });
        }
      });

      // Check existing notifications to avoid duplicates
      const { data: existingNotifications } = await supabase
        .from("notifications")
        .select("reference_id, user_id")
        .eq("reference_type", "task_deadline")
        .in("reference_id", tasks.map((t) => t.id))
        .gte("created_at", todayStr);

      const existingSet = new Set(
        existingNotifications?.map((n) => `${n.reference_id}-${n.user_id}`) || [],
      );

      const notifications: Array<{
        user_id: string;
        client_id: string;
        title: string;
        message: string;
        type: string;
        reference_type: string;
        reference_id: string;
      }> = [];

      for (const task of tasks) {
        const isToday = task.due_date === todayStr;
        const title = isToday ? "⚠️ Prazo hoje!" : "📅 Prazo amanhã";
        const message = isToday
          ? `A tarefa "${task.title}" vence hoje!`
          : `A tarefa "${task.title}" vence amanhã.`;

        const usersToNotify = clientUserMap[task.client_id] || [];

        // Add assigned user if not already in list
        if (task.assigned_to) {
          const assignedAlready = usersToNotify.some((u) => u.id === task.assigned_to);
          if (!assignedAlready) {
            const { data: assignedProfile } = await supabase
              .from("profiles")
              .select("id, email")
              .eq("id", task.assigned_to)
              .single();
            if (assignedProfile) usersToNotify.push(assignedProfile);
          }
        }

        for (const userInfo of usersToNotify) {
          const key = `${task.id}-${userInfo.id}`;
          if (!existingSet.has(key)) {
            notifications.push({
              user_id: userInfo.id,
              client_id: task.client_id,
              title,
              message,
              type: isToday ? "warning" : "info",
              reference_type: "task_deadline",
              reference_id: task.id,
            });
            existingSet.add(key);

            // Send email
            const { subject, html } = taskDeadlineReminderEmail(task.title, task.due_date!, isToday);
            sendNotificationEmail(userInfo.email, subject, html);
            totalEmails++;
          }
        }
      }

      if (notifications.length > 0) {
        const { error: insertError } = await supabase.from("notifications").insert(notifications);
        if (insertError) throw insertError;
        totalNotifications += notifications.length;
      }
    }

    // ═══ 2. APPOINTMENT REMINDERS (24h before) ═══
    console.log(`Checking appointments for tomorrow: ${tomorrowStr}`);

    const tomorrowStart = `${tomorrowStr}T00:00:00`;
    const tomorrowEnd = `${tomorrowStr}T23:59:59`;

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, title, appointment_date, client_id, status")
      .gte("appointment_date", tomorrowStart)
      .lte("appointment_date", tomorrowEnd)
      .neq("status", "cancelled");

    if (appointments && appointments.length > 0) {
      console.log(`Found ${appointments.length} appointments for tomorrow`);
      for (const apt of appointments) {
        const { data: clientUsers } = await supabase
          .from("profiles")
          .select("email")
          .eq("client_id", apt.client_id);

        const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
        const adminIds = adminRoles?.map((r) => r.user_id) || [];
        const { data: adminProfiles } = await supabase.from("profiles").select("email").in("id", adminIds);

        const allEmails = [
          ...(clientUsers?.map((u) => u.email) || []),
          ...(adminProfiles?.map((u) => u.email) || []),
        ].filter(Boolean);

        const uniqueEmails = [...new Set(allEmails)];
        if (uniqueEmails.length > 0) {
          const dateStr = new Date(apt.appointment_date).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          });
          const { subject, html } = appointmentReminderEmail(apt.title, dateStr);
          sendNotificationEmail(uniqueEmails, subject, html);
          totalEmails++;
        }
      }
    }

    // ═══ 3. PAYMENT DUE REMINDERS (3 days before) ═══
    console.log(`Checking payments due on: ${threeDaysStr}`);

    const { data: payments } = await supabase
      .from("payments")
      .select("id, description, amount, due_date, client_id, status")
      .eq("due_date", threeDaysStr)
      .neq("status", "paid");

    if (payments && payments.length > 0) {
      console.log(`Found ${payments.length} payments due in 3 days`);
      for (const payment of payments) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("name")
          .eq("id", payment.client_id)
          .single();

        const { data: pfUsers } = await supabase
          .from("profiles")
          .select("email")
          .eq("client_id", payment.client_id)
          .eq("ponto_focal", true);

        const emails = pfUsers?.map((u) => u.email).filter(Boolean) || [];
        if (emails.length > 0) {
          const { subject, html } = paymentDueReminderEmail(
            clientData?.name || "Cliente",
            payment.amount.toFixed(2),
            payment.description || "Pagamento",
            payment.due_date!,
          );
          sendNotificationEmail(emails, subject, html);
          totalEmails++;
        }
      }
    }

    console.log(`Done. Notifications: ${totalNotifications}, Emails: ${totalEmails}`);

    return new Response(
      JSON.stringify({
        message: "Check completed successfully",
        notificationsSent: totalNotifications,
        emailsSent: totalEmails,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-task-deadlines function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
