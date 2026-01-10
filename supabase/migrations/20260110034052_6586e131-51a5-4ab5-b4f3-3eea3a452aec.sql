-- Add phase date fields to clients table for journey timeline
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS phase_diagnostico_start DATE,
ADD COLUMN IF NOT EXISTS phase_diagnostico_end DATE,
ADD COLUMN IF NOT EXISTS phase_diagnostico_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS phase_estruturacao_start DATE,
ADD COLUMN IF NOT EXISTS phase_estruturacao_end DATE,
ADD COLUMN IF NOT EXISTS phase_estruturacao_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS phase_operacao_guiada_start DATE,
ADD COLUMN IF NOT EXISTS phase_operacao_guiada_end DATE,
ADD COLUMN IF NOT EXISTS phase_operacao_guiada_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS phase_transferencia_start DATE,
ADD COLUMN IF NOT EXISTS phase_transferencia_end DATE,
ADD COLUMN IF NOT EXISTS phase_transferencia_completed_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.phase_diagnostico_start IS 'Planned start date for diagnostico phase';
COMMENT ON COLUMN public.clients.phase_diagnostico_end IS 'Planned end date for diagnostico phase';
COMMENT ON COLUMN public.clients.phase_diagnostico_completed_at IS 'Actual completion timestamp for diagnostico phase';
COMMENT ON COLUMN public.clients.phase_estruturacao_start IS 'Planned start date for estruturacao phase';
COMMENT ON COLUMN public.clients.phase_estruturacao_end IS 'Planned end date for estruturacao phase';
COMMENT ON COLUMN public.clients.phase_estruturacao_completed_at IS 'Actual completion timestamp for estruturacao phase';
COMMENT ON COLUMN public.clients.phase_operacao_guiada_start IS 'Planned start date for operacao_guiada phase';
COMMENT ON COLUMN public.clients.phase_operacao_guiada_end IS 'Planned end date for operacao_guiada phase';
COMMENT ON COLUMN public.clients.phase_operacao_guiada_completed_at IS 'Actual completion timestamp for operacao_guiada phase';
COMMENT ON COLUMN public.clients.phase_transferencia_start IS 'Planned start date for transferencia phase';
COMMENT ON COLUMN public.clients.phase_transferencia_end IS 'Planned end date for transferencia phase';
COMMENT ON COLUMN public.clients.phase_transferencia_completed_at IS 'Actual completion timestamp for transferencia phase';