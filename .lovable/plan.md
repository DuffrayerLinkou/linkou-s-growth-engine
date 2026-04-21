

## Sprint 2 — Memória Documental (RAG por cliente)

Adicionar busca semântica em arquivos do cliente (PDFs, TXT, MD, CSV) sem inflar o prompt. O Linkouzinho passa a recuperar trechos relevantes sob demanda via cosine similarity.

---

### Mudanças no banco

**1. Habilitar extensão pgvector**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**2. Três novas tabelas**

```text
document_chunks
  id uuid PK
  file_id uuid (FK files.id ON DELETE CASCADE)
  client_id uuid NOT NULL
  chunk_index int
  content text
  token_count int
  page_number int (nullable)
  metadata jsonb default '{}'
  created_at timestamptz

document_embeddings
  id uuid PK
  chunk_id uuid (FK document_chunks.id ON DELETE CASCADE)
  client_id uuid NOT NULL  (denormalizado p/ filtro RLS rápido)
  embedding vector(768)
  model text default 'google/text-embedding-004'
  created_at timestamptz
  INDEX ivfflat (embedding vector_cosine_ops) WITH (lists=100)

document_permissions
  id uuid PK
  file_id uuid (FK files.id ON DELETE CASCADE)
  can_be_used_by_ai boolean default true
  role text (manager|focal|operator|null=any)
  user_id uuid (nullable)
  created_at timestamptz
  UNIQUE(file_id, role, user_id)
```

**3. RLS** (mesmo padrão das outras tabelas)
- Admin/account_manager: ALL
- Client users: SELECT onde `client_id = get_user_client_id(auth.uid())`
- Service role (edge functions) faz INSERT/UPDATE/DELETE

**4. Função SQL `match_document_chunks`** (busca vetorial escopada)
```sql
match_document_chunks(
  query_embedding vector(768),
  target_client_id uuid,
  match_count int default 5,
  similarity_threshold float default 0.5
) RETURNS TABLE (chunk_id, file_id, file_name, content, page_number, similarity)
```
Inclui filtro `document_permissions.can_be_used_by_ai = true` (default true se sem registro).

---

### Nova edge function `ingest-document`

Pipeline:
1. Recebe `{ file_id }` + JWT do usuário
2. Valida permissão (mesmo client_id)
3. Baixa do bucket `client-files` via `file_path`
4. Detecta MIME e extrai texto:
   - **PDF**: `pdf-parse` (Deno-compatível via esm.sh)
   - **TXT/MD/CSV**: leitura direta
   - **DOCX**: `mammoth` (best-effort)
5. Chunking: 600 tokens com overlap de 80 (split por parágrafos preservando contexto)
6. Para cada chunk: chama Lovable AI Gateway `google/text-embedding-004`
7. Persiste em `document_chunks` + `document_embeddings` (deleta versões anteriores antes — re-ingestão idempotente)
8. Retorna `{ chunks_created, tokens_processed }`

Trigger opcional: `files` insert → enfileira ingestão (Sprint 3 cuida da UI).

---

### Tool nova `search_documents` no `assistant-chat`

```typescript
{
  name: "search_documents",
  description: "Busca trechos relevantes nos arquivos do cliente atual via similaridade semântica",
  parameters: {
    query: string,           // pergunta ou tópico
    top_k: number = 5
  }
}
```

Executor:
1. Gera embedding da query
2. Chama `match_document_chunks(embedding, current_client_id, top_k)`
3. Retorna lista `[{file_name, page, content, similarity}]`
4. Loga em `client_actions` (tipo `search_documents`)

`read_file` continua existindo para leitura completa quando solicitado.

---

### Atualização do system prompt

Adicionar bloco no `ADMIN_SYSTEM_PROMPT`:
```
🔍 BUSCA DOCUMENTAL
Use search_documents quando o usuário perguntar sobre conteúdo de arquivos,
briefings, contratos, ou pedir resumo de documento. NÃO chame se a resposta
está no contexto operacional já carregado.
```

---

### UI mínima (Sprint 2)

**`src/pages/cliente/Arquivos.tsx`** + **`src/pages/admin/ClientDetail.tsx`** (aba arquivos):
- Botão "🧠 Tornar pesquisável" por arquivo
- Badge "Indexado ✓" quando já tem chunks
- Toggle "Permitir uso pela IA" (`document_permissions.can_be_used_by_ai`)

A UI completa de gestão de insights (Sprint 3) fica para depois.

---

### Custo & performance

| Item | Estimativa |
|---|---|
| Embedding por chunk | ~$0.00001 |
| PDF típico (20 páginas) | ~30 chunks → $0.0003 |
| Busca por mensagem | 1 embedding query + 1 SQL → desprezível |
| Latência ingest | 5–15s por arquivo (assíncrono) |
| Latência search | <500ms |

Re-ingestão só roda quando usuário clica no botão (controle total).

---

### Segurança reforçada

- `client_id` **denormalizado** em `document_embeddings` para filtro RLS sem JOIN
- Função `match_document_chunks` é `SECURITY DEFINER` mas valida `target_client_id` contra `user_has_client_access`
- `document_permissions.can_be_used_by_ai = false` exclui o doc da busca
- Service role do `ingest-document` valida JWT antes de baixar arquivo

---

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| Migration nova | pgvector + 3 tabelas + RLS + função `match_document_chunks` |
| `supabase/functions/ingest-document/index.ts` | **Novo** — chunking + embeddings |
| `supabase/functions/assistant-chat/index.ts` | + tool `search_documents` + executor + bloco no prompt |
| `supabase/config.toml` | + entrada `[functions.ingest-document]` com `verify_jwt = false` |
| `src/pages/cliente/Arquivos.tsx` | Botão "Tornar pesquisável" + badge |
| `src/pages/admin/ClientDetail.tsx` | Mesmo botão na aba arquivos do admin |

### Sem mudanças
- Tabela `files` (intacta), bucket storage, frontend de upload, modo cliente do chat, tools existentes.

### Próximo passo
Após aprovar, executo migração + edge function + integração. Sprint 3 (página `/admin/insights` + notificações) fica pendente.

