-- 1) Backfill: profiles.client_id a partir de client_users quando estiver nulo
UPDATE public.profiles p
SET client_id = cu.client_id
FROM public.client_users cu
WHERE cu.user_id = p.id
  AND p.client_id IS NULL;

-- 2) Trigger para manter sincronizado em novos vínculos (Minha Equipe)
CREATE OR REPLACE FUNCTION public.sync_profile_client_id_from_client_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET client_id = NEW.client_id
  WHERE id = NEW.user_id
    AND client_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_client_id ON public.client_users;
CREATE TRIGGER trg_sync_profile_client_id
AFTER INSERT ON public.client_users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_client_id_from_client_users();