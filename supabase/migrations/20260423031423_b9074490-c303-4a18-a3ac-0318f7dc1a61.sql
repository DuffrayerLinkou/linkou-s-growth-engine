-- Remove old check constraint that only allowed 4 audit phases
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_phase_check;

-- Update Dra Regeane to Gestão de Tráfego service
UPDATE public.clients
SET service_type = 'gestao',
    phase = 'onboarding',
    phase_dates = '{}'::jsonb
WHERE id = '640b69d9-632e-4634-a09f-9c26f0b8c648';