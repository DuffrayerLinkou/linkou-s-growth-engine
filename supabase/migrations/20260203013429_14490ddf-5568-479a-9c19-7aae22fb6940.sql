-- Add service_interest column to leads table for tracking which service the lead is interested in
ALTER TABLE public.leads 
ADD COLUMN service_interest text NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.service_interest IS 'The service the lead is interested in: auditoria, producao, gestao, or design';