ALTER TABLE public.strategic_plans
  ALTER COLUMN funnel_strategy TYPE jsonb
  USING CASE
    WHEN funnel_strategy IS NULL THEN NULL
    WHEN btrim(funnel_strategy) ~ '^[\{\[]' THEN funnel_strategy::jsonb
    ELSE to_jsonb(funnel_strategy)
  END;