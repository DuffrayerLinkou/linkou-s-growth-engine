-- Adicionar role admin ao usuário existente
INSERT INTO public.user_roles (user_id, role)
VALUES ('7905c2db-9749-43a9-9b1a-6958a9ed7c1c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;