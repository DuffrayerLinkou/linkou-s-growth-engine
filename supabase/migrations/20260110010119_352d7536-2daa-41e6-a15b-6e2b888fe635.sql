-- =====================================================
-- MÓDULO 2: Jornada do Cliente + Histórico (Audit)
-- =====================================================

-- 1. Adicionar campos de jornada em clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'diagnostico',
ADD COLUMN IF NOT EXISTS autonomy boolean NOT NULL DEFAULT false;

-- Criar constraint para validar fases
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_phase_check;

ALTER TABLE public.clients
ADD CONSTRAINT clients_phase_check 
CHECK (phase IN ('diagnostico', 'estruturacao', 'operacao_guiada', 'transferencia'));

-- 2. Criar tabela acknowledgements
CREATE TABLE IF NOT EXISTS public.acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  phase text NOT NULL,
  acknowledged_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text,
  
  CONSTRAINT acknowledgements_phase_check 
  CHECK (phase IN ('diagnostico', 'estruturacao', 'operacao_guiada', 'transferencia'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_acknowledgements_client_id ON public.acknowledgements(client_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgements_phase ON public.acknowledgements(client_id, phase);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_action ON public.audit_logs(client_id, action);

-- 3. Habilitar RLS
ALTER TABLE public.acknowledgements ENABLE ROW LEVEL SECURITY;

-- 4. Função para verificar se usuário é ponto focal do cliente
CREATE OR REPLACE FUNCTION public.is_ponto_focal(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
      AND client_id = _client_id 
      AND ponto_focal = true
  );
$$;

-- 5. Função para obter client_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.profiles WHERE id = _user_id;
$$;

-- 6. RLS para acknowledgements
-- Admin pode tudo
CREATE POLICY "Admins can manage all acknowledgements" 
ON public.acknowledgements 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Client user pode ver acknowledgements do próprio cliente
CREATE POLICY "Client users can view their client acknowledgements" 
ON public.acknowledgements 
FOR SELECT 
USING (client_id = public.get_user_client_id(auth.uid()));

-- Apenas ponto focal pode criar acknowledgement
CREATE POLICY "Ponto focal can create acknowledgements" 
ON public.acknowledgements 
FOR INSERT 
WITH CHECK (
  public.is_ponto_focal(auth.uid(), client_id)
  AND acknowledged_by = auth.uid()
);

-- 7. Atualizar RLS de audit_logs para client_user poder ler do próprio cliente
DROP POLICY IF EXISTS "Client users can view their client audit logs" ON public.audit_logs;

CREATE POLICY "Client users can view their client audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  client_id IS NOT NULL 
  AND client_id = public.get_user_client_id(auth.uid())
);

-- 8. Função para registrar mudança de fase
CREATE OR REPLACE FUNCTION public.log_phase_change(
  _client_id uuid,
  _actor_user_id uuid,
  _from_phase text,
  _to_phase text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    client_id,
    action,
    entity_type,
    entity_id,
    new_data,
    old_data
  ) VALUES (
    _actor_user_id,
    _client_id,
    'phase_changed',
    'clients',
    _client_id,
    jsonb_build_object('phase', _to_phase),
    jsonb_build_object('phase', _from_phase)
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;