
-- Make client_id nullable
ALTER TABLE public.appointments ALTER COLUMN client_id DROP NOT NULL;

-- Add lead_id column
ALTER TABLE public.appointments ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add check constraint: at least one must be filled
ALTER TABLE public.appointments ADD CONSTRAINT appointments_participant_check CHECK (client_id IS NOT NULL OR lead_id IS NOT NULL);
