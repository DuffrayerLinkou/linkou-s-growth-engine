-- Função que notifica admins quando um comentário de campanha é criado
CREATE OR REPLACE FUNCTION public.notify_admins_on_campaign_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
  commenter_name TEXT;
  campaign_name TEXT;
  client_name TEXT;
BEGIN
  -- Só notifica para comentários de campanhas
  IF NEW.entity_type != 'campaign' THEN
    RETURN NEW;
  END IF;

  -- Busca o nome do autor do comentário
  SELECT COALESCE(full_name, email) INTO commenter_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Busca o nome da campanha
  SELECT name INTO campaign_name
  FROM campaigns
  WHERE id = NEW.entity_id;

  -- Busca o nome do cliente
  SELECT c.name INTO client_name
  FROM clients c
  WHERE c.id = NEW.client_id;

  -- Insere notificação para cada admin
  FOR admin_user IN 
    SELECT ur.user_id
    FROM user_roles ur
    WHERE ur.role = 'admin'
      AND ur.user_id != NEW.user_id  -- Não notifica o próprio autor
  LOOP
    INSERT INTO notifications (
      user_id,
      client_id,
      title,
      message,
      type,
      reference_type,
      reference_id,
      read
    ) VALUES (
      admin_user.user_id,
      NEW.client_id,
      'Novo comentário em campanha',
      commenter_name || ' comentou na campanha "' || COALESCE(campaign_name, 'Sem nome') || '" do cliente ' || COALESCE(client_name, 'N/A') || ': "' || LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END || '"',
      'info',
      'campaign',
      NEW.entity_id,
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Remove trigger existente se houver
DROP TRIGGER IF EXISTS trigger_notify_admins_campaign_comment ON comments;

-- Cria o trigger para notificar admins quando um comentário é inserido
CREATE TRIGGER trigger_notify_admins_campaign_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_campaign_comment();