-- Unschedule the old cron job
SELECT cron.unschedule('check-task-deadlines-daily');

-- Schedule the check-task-deadlines function to run daily at 11am UTC (8am Brasília)
SELECT cron.schedule(
  'check-task-deadlines-daily',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://inkwweudpaszunmfnogq.supabase.co/functions/v1/check-task-deadlines',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlua3d3ZXVkcGFzenVubWZub2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTgxNzIsImV4cCI6MjA4MzU3NDE3Mn0.H47RjEvsLn6HqstW1p50L1mV87c2r_WIUE87tBD7A3E"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);