-- =====================================================
-- SECURITY FIX: Function Search Path Mutable
-- =====================================================
-- Fix function without search_path set

CREATE OR REPLACE FUNCTION public.sync_campaign_status_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Se a campanha foi aprovada pelo ponto focal e ainda está pending_approval, muda para running
  IF NEW.approved_by_ponto_focal = true AND NEW.status = 'pending_approval' THEN
    NEW.status := 'running';
  END IF;
  RETURN NEW;
END;
$function$;

-- =====================================================
-- SECURITY FIX: RLS Policy Always True
-- =====================================================
-- Note: The "Anyone can insert leads" policy with WITH CHECK (true) 
-- is INTENTIONAL for a public lead capture form on the landing page.
-- However, we can add rate limiting and input validation via the policy.

-- Drop and recreate the leads insert policy with basic validation
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

CREATE POLICY "Anyone can insert leads" 
ON public.leads 
FOR INSERT 
TO public
WITH CHECK (
  -- Ensure required fields are not empty (basic validation)
  name IS NOT NULL AND name != '' AND
  email IS NOT NULL AND email != '' AND
  -- Ensure email format is somewhat valid (contains @)
  email LIKE '%@%.%'
);

-- For notifications: this should only allow service role or authenticated users
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a more restrictive policy - only allow authenticated users to insert their own notifications
-- or admin/account_managers to insert for others
CREATE POLICY "Authenticated users can insert notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Users can only insert notifications for themselves
  (user_id = auth.uid())
  OR
  -- Admins and account managers can insert for anyone
  has_role(auth.uid(), 'admin'::app_role)
  OR
  has_role(auth.uid(), 'account_manager'::app_role)
);