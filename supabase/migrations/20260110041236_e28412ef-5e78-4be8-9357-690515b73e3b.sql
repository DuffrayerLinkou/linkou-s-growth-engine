-- Atualizar função user_has_client_access para também verificar a tabela profiles
CREATE OR REPLACE FUNCTION public.user_has_client_access(_user_id uuid, _client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.client_users
    where user_id = _user_id and client_id = _client_id
  )
  -- Verificar também na tabela profiles onde client_id está associado
  or exists (
    select 1 from public.profiles
    where id = _user_id and client_id = _client_id
  )
  or public.has_role(_user_id, 'admin')
  or public.has_role(_user_id, 'account_manager')
$function$;