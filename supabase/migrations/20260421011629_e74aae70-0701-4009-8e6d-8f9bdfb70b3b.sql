
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLE: document_chunks
-- ============================================================
CREATE TABLE public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  token_count int,
  page_number int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_chunks_file_id ON public.document_chunks(file_id);
CREATE INDEX idx_document_chunks_client_id ON public.document_chunks(client_id);

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage document_chunks"
  ON public.document_chunks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers manage document_chunks"
  ON public.document_chunks FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'account_manager'::app_role));

CREATE POLICY "Client users view own document_chunks"
  ON public.document_chunks FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

-- ============================================================
-- TABLE: document_embeddings
-- ============================================================
CREATE TABLE public.document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id uuid NOT NULL REFERENCES public.document_chunks(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  model text NOT NULL DEFAULT 'google/text-embedding-004',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_embeddings_client_id ON public.document_embeddings(client_id);
CREATE INDEX idx_document_embeddings_chunk_id ON public.document_embeddings(chunk_id);
CREATE INDEX idx_document_embeddings_vector ON public.document_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage document_embeddings"
  ON public.document_embeddings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers manage document_embeddings"
  ON public.document_embeddings FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'account_manager'::app_role));

CREATE POLICY "Client users view own document_embeddings"
  ON public.document_embeddings FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

-- ============================================================
-- TABLE: document_permissions
-- ============================================================
CREATE TABLE public.document_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  can_be_used_by_ai boolean NOT NULL DEFAULT true,
  role text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(file_id, role, user_id)
);

CREATE INDEX idx_document_permissions_file_id ON public.document_permissions(file_id);

ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage document_permissions"
  ON public.document_permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers manage document_permissions"
  ON public.document_permissions FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'account_manager'::app_role));

CREATE POLICY "Client users view own document_permissions"
  ON public.document_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.id = document_permissions.file_id
        AND f.client_id = get_user_client_id(auth.uid())
    )
  );

-- ============================================================
-- FUNCTION: match_document_chunks
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(768),
  target_client_id uuid,
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  chunk_id uuid,
  file_id uuid,
  file_name text,
  content text,
  page_number int,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate caller has access to this client
  IF NOT public.user_has_client_access(auth.uid(), target_client_id) THEN
    RAISE EXCEPTION 'Access denied to client %', target_client_id;
  END IF;

  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.file_id,
    f.name AS file_name,
    dc.content,
    dc.page_number,
    (1 - (de.embedding <=> query_embedding))::float AS similarity
  FROM public.document_embeddings de
  JOIN public.document_chunks dc ON dc.id = de.chunk_id
  JOIN public.files f ON f.id = dc.file_id
  WHERE de.client_id = target_client_id
    AND (1 - (de.embedding <=> query_embedding)) >= similarity_threshold
    -- AI permission check: allowed if no explicit row OR row says can_be_used_by_ai=true
    AND NOT EXISTS (
      SELECT 1 FROM public.document_permissions dp
      WHERE dp.file_id = dc.file_id
        AND dp.can_be_used_by_ai = false
        AND dp.role IS NULL
        AND dp.user_id IS NULL
    )
  ORDER BY de.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
