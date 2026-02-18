
SELECT cron.schedule(
  'process-lead-funnels-daily',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://inkwweudpaszunmfnogq.supabase.co/functions/v1/process-lead-funnels',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlua3d3ZXVkcGFzenVubWZub2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTgxNzIsImV4cCI6MjA4MzU3NDE3Mn0.H47RjEvsLn6HqstW1p50L1mV87c2r_WIUE87tBD7A3E"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
