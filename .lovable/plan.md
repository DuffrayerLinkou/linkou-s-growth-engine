

## Linkouzinho como Operador Contextual Multi-Cliente

Plano para evoluir o Linkouzinho em **4 camadas** (memória operacional, documental, estado da conversa, motor de decisão) sem alterar a interface do chat.

---

### Diagnóstico do que já existe

| Camada | Já existe | Falta |
|---|---|---|
| Operacional | `clients`, `campaigns`, `tasks`, `appointments`, `briefings`, `strategic_plans`, `traffic_metrics`, `learnings`, `payments` | `client_goals`, `client_offers`, `client_channels`, `client_constraints`, `client_decisions`, `client_actions`, `insights` |
| Documental | `files` (storage `client-files`) + tool `read_file` | `document_chunks`, `document_embeddings`, `document_permissions` (RAG) |
| Estado da conversa | `assistant_conversations` (messages, mode) | Campos de estado: cliente atual, assunto, objetivo, última ação, pendências |
| Motor de decisão | Roteamento implícito via prompt (AUDITOR/ESTRATEGISTA/EXECUTOR) | Pipeline determinístico no edge function + log de decisões |

---

### Camada 1 — Memória Operacional (novas tabelas)

Criar 7 tabelas, todas com `client_id NOT NULL`, RLS por cliente + admin/account_manager.

```text
client_goals          → objetivos atuais (qualitativos + KPIs alvo)
                        campos: title, description, target_metric, target_value,
                        deadline, priority, status (active/achieved/abandoned)

client_offers         → ofertas/produtos ativos do cliente
                        campos: name, description, price, target_audience,
                        differentiators jsonb, status

client_channels       → canais ativos (Meta/Google/TikTok/Orgânico/E-mail/WPP)
                        campos: channel, account_id, status,
                        monthly_budget, notes, last_activity_at

client_constraints    → restrições/regras (ex: "não usar criativo agressivo",
                        "evitar palavra X", "horário comercial apenas")
                        campos: type, description, severity, active

client_decisions      → decisões tomadas (com ou sem o bot)
                        campos: title, decision, rationale, decided_by,
                        decided_at, related_entity_type, related_entity_id

client_actions        → ações executadas pelo bot ou usuário
                        campos: action_type, payload jsonb, executed_by,
                        executed_at, status (success/failed),
                        triggered_by_message_id (referência opcional)

insights              → conclusões da IA validadas/persistidas
                        campos: title, body, category (audit/opportunity/risk),
                        evidence jsonb, generated_by (bot/manual),
                        status (new/acknowledged/dismissed), acknowledged_by
```

**RLS padrão para todas:**
- Admin/account_manager: ALL
- Client users: SELECT onde `client_id = get_user_client_id(auth.uid())`
- INSERT pelo bot: via service role no edge function

---

### Camada 2 — Memória Documental (RAG por cliente)

```text
document_chunks       → trechos de 500-800 tokens extraídos de cada arquivo
                        campos: file_id (FK files.id), client_id, chunk_index,
                        content text, token_count, page_number, metadata jsonb

document_embeddings   → vetores (pgvector extension)
                        campos: chunk_id (FK), embedding vector(768),
                        model text default 'gemini-embedding-001'

document_permissions  → granularidade extra além de RLS por cliente
                        campos: file_id, role (manager/focal/operator),
                        user_id (opcional), can_read bool, can_be_used_by_ai bool
```

**Pipeline de ingestão (edge function `ingest-document`):**
1. Trigger ao criar registro em `files` (ou manual)
2. Baixa do bucket `client-files`
3. Extrai texto (pdf-parse, leitura direta para txt/md/csv)
4. Divide em chunks (500-800 tokens, overlap 80)
5. Gera embeddings via Lovable AI Gateway (`google/gemini-embedding-001`)
6. Persiste em `document_chunks` + `document_embeddings`

**Tool nova `search_documents`** (substitui parte do `read_file`):
- Input: `query` (string), `top_k` (default 5)
- Gera embedding da query → busca cosine similarity escopada por `client_id` → retorna top 5 chunks com `file_name + page_number + content`
- Custo controlado: usado só quando AUDITOR/ESTRATEGISTA precisa de contexto documental

`read_file` continua existindo para leitura completa quando solicitado explicitamente.

---

### Camada 3 — Estado da Conversa

Estender `assistant_conversations` com colunas:

```text
current_client_id     uuid       (cliente em foco — pode mudar mid-chat)
current_topic         text       (ex: "campanha Black Friday")
current_objective     text       (ex: "reduzir CPL Meta em 20%")
last_recommendation   jsonb      ({title, body, created_at})
last_action           jsonb      ({tool, params, result, created_at})
pending_items         jsonb      ([{type, description, due}])
state_updated_at      timestamptz
```

O edge function `assistant-chat` lê e atualiza esse estado a cada turno (via service role).

---

### Camada 4 — Motor de Decisão (refatoração do `assistant-chat`)

Refatorar `supabase/functions/assistant-chat/index.ts` para um **pipeline explícito de 7 passos** antes de chamar a LLM:

```text
[Pipeline por mensagem]

  1. IDENTIFY_CLIENT
     - usa client_id do payload OU current_client_id do estado
     - se admin trocar de cliente, atualiza state

  2. CLASSIFY_INTENT  (chamada LLM rápida, gemini-flash, ~50 tokens)
     - retorna: { intent: audit|strategy|execute|chat, requires_docs: bool,
                  topic: string, urgency: low|med|high }

  3. LOAD_OPERATIONAL_CONTEXT
     - Promise.all queries: client + goals + offers + channels +
       constraints + active tasks + recent decisions/actions/insights +
       campaigns + last 6mo metrics

  4. LOAD_DOCUMENT_CONTEXT  (só se requires_docs=true)
     - search_documents(topic, top_k=5)
     - injeta chunks como "Trechos relevantes de arquivos"

  5. APPLY_SECURITY
     - garante que TODOS os IDs no contexto pertencem ao client_id atual
     - filtra constraints aplicáveis ("nunca usar X")
     - bloqueia tools de execução se usuário não tiver role

  6. INVOKE_LLM
     - system prompt = identidade + estado + contexto + constraints
     - tools disponíveis conforme intent (executor → todas; auditor → só leitura)

  7. RECORD_OUTCOME
     - se houve tool call → grava em client_actions
     - se houve recomendação → atualiza last_recommendation no state
     - se houve insight novo → grava em insights (status=new)
     - atualiza state_updated_at
```

---

### Comportamentos novos garantidos

| Situação | Comportamento |
|---|---|
| Admin troca de cliente no chat | State atualiza `current_client_id`, contexto recarrega, anti-vazamento |
| "Lembra do que decidimos semana passada?" | Lê `client_decisions` ordenado por `decided_at desc` |
| "Resume tudo que sabemos sobre o produto X" | `search_documents` retorna chunks relevantes do briefing/PDFs |
| "Quais pendências?" | Lê `pending_items` do state + `tasks` em atraso |
| "Cria tarefa para revisar o plano" | EXECUTOR cria tarefa + grava em `client_actions` com link |
| Usuário pede algo proibido por `client_constraints` | Bot recusa citando a restrição registrada |

---

### Segurança reforçada

- Toda query no edge function inclui `WHERE client_id = $current_client_id`
- `search_documents` usa filtro RLS no SQL via `user_has_client_access`
- `document_permissions.can_be_used_by_ai = false` exclui o doc da busca vetorial
- Admin (`client_id IS NULL`) pode operar qualquer cliente, mas deve selecionar um explicitamente
- Logs em `client_actions` permitem auditoria de tudo que o bot executou

---

### Roadmap de implementação (3 sprints)

**Sprint 1 — Memória Operacional + Estado** (1 migração + refactor edge)
- Criar 7 tabelas + RLS
- Adicionar colunas de estado em `assistant_conversations`
- Refatorar `assistant-chat` para pipeline 7-passos (sem RAG ainda)
- Injetar novo contexto operacional no system prompt

**Sprint 2 — RAG Documental** (extensão pgvector + edge function)
- `CREATE EXTENSION vector`
- 3 tabelas (chunks, embeddings, permissions)
- Edge function `ingest-document` (manual + on-upload)
- Tool `search_documents` no `assistant-chat`

**Sprint 3 — UX + Insights ativos**
- Botão "ingerir documento" em `Arquivos.tsx` para reprocessar
- Tela `/admin/insights` listando `insights` gerados pelo bot (admin valida/descarta)
- Notificação quando bot gera insight de alta urgência

---

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/...` | 1 migração Sprint 1: 7 tabelas operacionais + colunas de estado + RLS |
| `supabase/migrations/...` | 1 migração Sprint 2: pgvector + 3 tabelas documentais |
| `supabase/functions/assistant-chat/index.ts` | Refatoração completa: pipeline 7 passos + novas tools |
| `supabase/functions/ingest-document/index.ts` | **Nova** — chunking + embeddings |
| `src/components/LinkouzinhoInternal.tsx` | Mostrar cliente atual no header (admin) + sugestões dinâmicas |
| `src/pages/cliente/Arquivos.tsx` | Botão "Tornar pesquisável pelo Linkouzinho" |
| `src/pages/admin/Insights.tsx` (nova) | Listar/aprovar insights gerados |

### Sem mudanças
- Identidade visual, modo cliente padrão, frontend de chat (mesma UX), tools existentes (continuam disponíveis).

### Aprovação por sprint
Recomendo aprovar **Sprint 1** primeiro (impacto imediato, baixo risco). Sprint 2 (RAG) e Sprint 3 (UX) entram após validação.

