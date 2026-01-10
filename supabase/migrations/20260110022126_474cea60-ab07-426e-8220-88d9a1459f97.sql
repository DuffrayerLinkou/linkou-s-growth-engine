-- Add journey_phase column to link tasks to journey phases
ALTER TABLE public.tasks ADD COLUMN journey_phase TEXT DEFAULT NULL;

-- Add visible_to_client column to control visibility
ALTER TABLE public.tasks ADD COLUMN visible_to_client BOOLEAN DEFAULT true;

-- Create index for better query performance
CREATE INDEX idx_tasks_journey_phase ON public.tasks (journey_phase);
CREATE INDEX idx_tasks_visible_to_client ON public.tasks (visible_to_client);

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.journey_phase IS 'Journey phase: diagnostico, estruturacao, operacao_guiada, transferencia';
COMMENT ON COLUMN public.tasks.visible_to_client IS 'Whether the task is visible to client users';