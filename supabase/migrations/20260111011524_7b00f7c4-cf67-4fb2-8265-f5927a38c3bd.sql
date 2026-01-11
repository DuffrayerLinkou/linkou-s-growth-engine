-- Drop the old policy with incorrect condition
DROP POLICY IF EXISTS "Ponto focal can approve experiments" ON campaigns;

-- Create the corrected policy that allows approval of pending_approval campaigns
CREATE POLICY "Ponto focal can approve campaigns"
ON campaigns
FOR UPDATE
TO authenticated
USING (
  is_ponto_focal(auth.uid(), client_id) 
  AND status = 'pending_approval'
)
WITH CHECK (
  is_ponto_focal(auth.uid(), client_id)
);