-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the check-task-deadlines function to run daily at 8am (UTC)
-- Note: Adjust the time if your users are in a different timezone
SELECT cron.schedule(
  'check-task-deadlines-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://inkwweudpaszunmfnogq.supabase.co/functions/v1/check-task-deadlines',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlua3d3ZXVkcGFzenVubWZub2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTgxNzIsImV4cCI6MjA4MzU3NDE3Mn0.H47RjEvsLn6HqstW1p50L1mV87c2r_WIUE87tBD7A3E"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);