-- =====================================================
-- MÓDULO 1: Clientes + Usuários + Ponto Focal
-- =====================================================

-- 1. Limpar tabelas existentes que não serão usadas neste módulo
-- Manter apenas: clients, profiles, user_roles

-- 2. Atualizar tabela clients para o schema do módulo 1
-- Remover campos desnecessários e ajustar status
ALTER TABLE public.clients 
DROP COLUMN IF EXISTS cnpj,
DROP COLUMN IF EXISTS logo_url,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS notes;

-- Atualizar status existentes para o novo padrão
UPDATE public.clients SET status = 'ativo' WHERE status IN ('active', 'ativo');
UPDATE public.clients SET status = 'pausado' WHERE status IN ('inactive', 'pausado');
UPDATE public.clients SET status = 'encerrado' WHERE status IN ('churned', 'encerrado');

-- 3. Adicionar campos em profiles para o módulo de ponto focal
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ponto_focal boolean NOT NULL DEFAULT false;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ponto_focal ON public.profiles(client_id, ponto_focal) WHERE ponto_focal = true;

-- 5. Função para garantir ponto focal único por cliente
CREATE OR REPLACE FUNCTION public.set_ponto_focal(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove ponto_focal de todos os outros usuários do mesmo cliente
  UPDATE public.profiles 
  SET ponto_focal = false 
  WHERE client_id = _client_id AND id != _user_id;
  
  -- Define o usuário como ponto focal
  UPDATE public.profiles 
  SET ponto_focal = true 
  WHERE id = _user_id AND client_id = _client_id;
  
  RETURN true;
END;
$$;

-- 6. Função para verificar se cliente tem ponto focal
CREATE OR REPLACE FUNCTION public.client_has_ponto_focal(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE client_id = _client_id AND ponto_focal = true
  );
$$;

-- 7. Função para contar usuários do cliente
CREATE OR REPLACE FUNCTION public.count_client_users(_client_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.profiles 
  WHERE client_id = _client_id;
$$;

-- 8. Atualizar RLS de profiles
-- Primeiro dropar policies existentes
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recriar com as novas regras
-- Admin pode ver todos os profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Admin pode inserir profiles (criar usuários)
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin pode atualizar qualquer profile
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Admin pode deletar profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Client_user pode ver apenas próprio profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Client_user pode atualizar apenas campos permitidos do próprio profile (full_name)
-- Nota: A restrição de quais campos podem ser alterados será feita na aplicação
CREATE POLICY "Users can update own basic profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id AND NOT public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = id AND NOT public.has_role(auth.uid(), 'admin'));

-- 9. Atualizar RLS de clients
DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Account managers can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their linked clients" ON public.clients;

-- Admin tem acesso total
CREATE POLICY "Admins can manage all clients" 
ON public.clients 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Client_user pode ver apenas seu próprio cliente
CREATE POLICY "Client users can view their client" 
ON public.clients 
FOR SELECT 
USING (
  id IN (
    SELECT client_id FROM public.profiles WHERE id = auth.uid()
  )
);