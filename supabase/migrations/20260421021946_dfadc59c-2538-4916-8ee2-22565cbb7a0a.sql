ALTER TABLE public.strategic_plans
  ADD COLUMN IF NOT EXISTS diagnostic jsonb,
  ADD COLUMN IF NOT EXISTS execution_plan jsonb,
  ADD COLUMN IF NOT EXISTS executive_summary text;