
-- Allow client users (ponto focal and managers) to INSERT tasks for their client
CREATE POLICY "Client users can create tasks for their client"
ON public.tasks
FOR INSERT
WITH CHECK (
  client_id = get_user_client_id(auth.uid())
  AND created_by = auth.uid()
  AND executor_type = 'client'
  AND visible_to_client = true
);

-- Allow client users (ponto focal and managers) to INSERT campaigns (draft requests) for their client
CREATE POLICY "Client users can create draft campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (
  client_id = get_user_client_id(auth.uid())
  AND created_by = auth.uid()
  AND status = 'draft'
);

-- Allow client users to INSERT appointments (pending) for their client
CREATE POLICY "Client users can create appointments for their client"
ON public.appointments
FOR INSERT
WITH CHECK (
  client_id = get_user_client_id(auth.uid())
  AND created_by = auth.uid()
  AND status = 'pending'
);
