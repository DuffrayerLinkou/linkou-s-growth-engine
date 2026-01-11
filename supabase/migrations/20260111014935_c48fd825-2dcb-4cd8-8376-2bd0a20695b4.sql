-- Backfill: corrigir campanhas já aprovadas que ainda estão com status pending_approval
UPDATE campaigns
SET status = 'running',
    updated_at = now()
WHERE approved_by_ponto_focal = true
  AND status = 'pending_approval';

-- Trigger para garantir consistência futura
CREATE OR REPLACE FUNCTION public.sync_campaign_status_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a campanha foi aprovada pelo ponto focal e ainda está pending_approval, muda para running
  IF NEW.approved_by_ponto_focal = true AND NEW.status = 'pending_approval' THEN
    NEW.status := 'running';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_sync_campaign_status ON campaigns;
CREATE TRIGGER trigger_sync_campaign_status
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_campaign_status_on_approval();