-- Adicionar campo executor_type na tabela tasks
ALTER TABLE tasks 
ADD COLUMN executor_type TEXT DEFAULT 'internal';

-- Adicionar constraint para valores válidos
ALTER TABLE tasks 
ADD CONSTRAINT tasks_executor_type_check 
CHECK (executor_type IN ('internal', 'client'));

-- Comentário para documentação
COMMENT ON COLUMN tasks.executor_type IS 
'Tipo de executor: internal = equipe interna, client = ponto focal ou usuário do cliente';

-- Criar política RLS para permitir que clientes atualizem suas próprias tarefas
CREATE POLICY "Client users can update their assigned tasks"
ON tasks FOR UPDATE
USING (
  executor_type = 'client' 
  AND assigned_to = auth.uid()
  AND user_has_client_access(auth.uid(), client_id)
)
WITH CHECK (
  executor_type = 'client' 
  AND assigned_to = auth.uid()
);