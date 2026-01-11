-- Fase 1: Corrigir funções sem search_path definido

-- Corrigir update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Corrigir validate_traffic_metrics_month
CREATE OR REPLACE FUNCTION public.validate_traffic_metrics_month()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.month < 1 OR NEW.month > 12 THEN
    RAISE EXCEPTION 'Month must be between 1 and 12';
  END IF;
  RETURN NEW;
END;
$function$;