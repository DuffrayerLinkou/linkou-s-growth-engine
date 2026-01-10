-- 1. Add user_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'operator' 
CHECK (user_type IN ('operator', 'manager'));

COMMENT ON COLUMN public.profiles.user_type IS 'Tipo de usuário: operator (operador) ou manager (gestor)';

-- 2. Create helper function to check upload permission
CREATE OR REPLACE FUNCTION public.can_upload_files(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
      AND client_id = _client_id 
      AND (ponto_focal = true OR user_type = 'manager')
  );
$$;

-- 3. Update RLS policy for files table (INSERT)
DROP POLICY IF EXISTS "Clients can upload files for their client" ON public.files;

CREATE POLICY "Clients can upload files for their client"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = get_user_client_id(auth.uid()) 
  AND can_upload_files(auth.uid(), client_id)
);

-- 4. Update storage policies for client-files bucket
DROP POLICY IF EXISTS "Clients can upload files" ON storage.objects;

CREATE POLICY "Clients can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-files' 
  AND can_upload_files(auth.uid(), (storage.foldername(name))[1]::uuid)
);