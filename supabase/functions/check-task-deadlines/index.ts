import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting check-task-deadlines function");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date and tomorrow's date in YYYY-MM-DD format
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    console.log(`Checking tasks with deadlines: today=${todayStr}, tomorrow=${tomorrowStr}`);

    // Fetch tasks with deadlines today or tomorrow that are not completed
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        due_date,
        client_id,
        status,
        assigned_to,
        visible_to_client
      `)
      .in("due_date", [todayStr, tomorrowStr])
      .neq("status", "completed")
      .eq("visible_to_client", true);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      throw tasksError;
    }

    console.log(`Found ${tasks?.length || 0} tasks with upcoming deadlines`);

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tasks with upcoming deadlines", notificationsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get unique client IDs
    const clientIds = [...new Set(tasks.map((t) => t.client_id))];

    // Fetch all users associated with these clients
    const { data: clientUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, client_id")
      .in("client_id", clientIds);

    if (usersError) {
      console.error("Error fetching client users:", usersError);
      throw usersError;
    }

    console.log(`Found ${clientUsers?.length || 0} users to notify`);

    // Create a map of client_id to user_ids
    const clientUserMap: Record<string, string[]> = {};
    clientUsers?.forEach((user) => {
      if (user.client_id) {
        if (!clientUserMap[user.client_id]) {
          clientUserMap[user.client_id] = [];
        }
        clientUserMap[user.client_id].push(user.id);
      }
    });

    // Also notify assigned users (admins/managers)
    const assignedUserIds = tasks
      .filter((t) => t.assigned_to)
      .map((t) => t.assigned_to as string);

    // Check for existing notifications to avoid duplicates
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("reference_id, user_id")
      .eq("reference_type", "task_deadline")
      .in("reference_id", tasks.map((t) => t.id))
      .gte("created_at", todayStr);

    const existingSet = new Set(
      existingNotifications?.map((n) => `${n.reference_id}-${n.user_id}`) || []
    );

    // Create notifications for each task
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

      // Notify client users
      const usersToNotify = clientUserMap[task.client_id] || [];
      
      // Add assigned user if exists
      if (task.assigned_to && !usersToNotify.includes(task.assigned_to)) {
        usersToNotify.push(task.assigned_to);
      }

      for (const userId of usersToNotify) {
        const key = `${task.id}-${userId}`;
        if (!existingSet.has(key)) {
          notifications.push({
            user_id: userId,
            client_id: task.client_id,
            title,
            message,
            type: isToday ? "warning" : "info",
            reference_type: "task_deadline",
            reference_id: task.id,
          });
          existingSet.add(key);
        }
      }
    }

    console.log(`Creating ${notifications.length} notifications`);

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        throw insertError;
      }
    }

    console.log("Notifications created successfully");

    return new Response(
      JSON.stringify({
        message: "Notifications sent successfully",
        tasksChecked: tasks.length,
        notificationsSent: notifications.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-task-deadlines function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
