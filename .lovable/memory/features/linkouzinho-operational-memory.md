---
name: Linkouzinho operational memory
description: Linkouzinho assistant 4-layer architecture — operational tables, conversation state, automatic action logging
type: feature
---
O Linkouzinho opera como Operador Contextual Multi-Cliente em 4 camadas (Sprint 1 implementado).

**Camada 1 — Memória Operacional** (tabelas com client_id NOT NULL, RLS: admin/account_manager FULL, clientes apenas SELECT do próprio):
- `client_goals` (objetivos com KPI alvo, prazo, prioridade)
- `client_offers` (ofertas/produtos ativos)
- `client_channels` (canais ativos com budget mensal)
- `client_constraints` (regras a respeitar — bot recusa violações citando a restrição)
- `client_decisions` (decisões tomadas com justificativa)
- `client_actions` (log automático de toda tool executada exceto set_conversation_state)
- `insights` (status: new/acknowledged/dismissed)

**Camada 3 — Estado da Conversa** (colunas em `assistant_conversations`):
- `current_client_id`, `current_topic`, `current_objective`, `last_recommendation`, `last_action`, `pending_items`, `state_updated_at`
- Atualizado pelo edge function via service role após cada turno

**Camada 4 — Pipeline `supabase/functions/assistant-chat/index.ts`**:
Carrega 15 fontes em paralelo (cliente + campanhas + métricas 6mo + plano + briefing + tarefas + arquivos + goals + offers + channels + constraints + decisions + recent actions + open insights + conversation state) e injeta no system prompt com seções emoji-prefixadas. Após cada tool call: grava em `client_actions` (sucesso/falha) e faz upsert em `assistant_conversations`.

**Tools de memória admin** (além das de execução): `log_decision`, `record_insight`, `set_conversation_state`.

**Sprint 2 — Memória Documental (RAG)** implementado:
- Extensão `pgvector` + tabelas `document_chunks` (file_id, client_id, content, chunk_index, page_number, token_count), `document_embeddings` (vector(768), modelo `google/text-embedding-004`, índice ivfflat cosine), `document_permissions` (file_id, can_be_used_by_ai, role, user_id).
- Função SQL `match_document_chunks(query_embedding, target_client_id, match_count, similarity_threshold)` SECURITY DEFINER com validação `user_has_client_access` + filtro de permissão IA.
- Edge function `supabase/functions/ingest-document/index.ts`: baixa do bucket `client-files`, extrai texto (PDF via `pdf-parse`, DOCX via `mammoth`, TXT/MD/CSV/JSON/HTML direto), chunka em ~600 tokens com overlap 80, gera embeddings via Lovable AI Gateway `/v1/embeddings` `google/text-embedding-004`, persiste idempotente (delete + insert). Loga em `client_actions` (`action_type: ingest_document`).
- Tool nova `search_documents(query, top_k)` no `assistant-chat`: gera embedding da query, chama RPC `match_document_chunks` (similarity_threshold=0.4), retorna trechos formatados com nome do arquivo + página + similaridade.
- UI em `src/pages/cliente/Arquivos.tsx`: botão "🧠 Tornar pesquisável pelo Linkouzinho" por arquivo (apenas formatos indexáveis: PDF/TXT/MD/CSV/JSON/HTML/DOCX), badge "Indexado · re-indexar" quando já tem chunks, query `indexed-files` lista IDs com chunks.

Sprint 3 (UI `/admin/insights` listando insights com aprovação + notificações de alta urgência + UI de toggle `can_be_used_by_ai` por arquivo) ainda pendente.

**Sprint 4 — RAG estendido + Keywords no modo cliente:**
- `ingest-document` agora indexa também **XLSX/XLS** (via `xlsx@0.18.5` SheetJS — cada aba vira `### Aba: <nome>` em TSV, máx 5000 linhas/aba) e **PPTX** (via `jszip@3.10.1` extraindo `<a:t>` de `ppt/slides/slide*.xml`, cada slide vira `### Slide N: <título>\n<corpo>`).
- `Arquivos.tsx` `isIndexable` aceita xlsx/xls/pptx.
- `assistant-chat` ganhou 3 tools novas: `bulk_create_keywords` (até 50), `delete_keyword` (mode archive/hard), `update_keyword_cluster`.
- Allowlist de `mode === "client"` agora inclui TODAS as tools de keywords (`list_keywords`, `create_keyword`, `bulk_create_keywords`, `update_keyword`, `delete_keyword`, `create_keyword_cluster`, `update_keyword_cluster`, `record_keyword_ranking`, `analyze_keyword_opportunities`) e `search_documents`. Cliente passa a operar `/cliente/keywords` por chat.
- System prompt do modo client documenta as tools de SEO + busca documental.

**Sprint 5 — Robustez de stream + e-mail transacional real:**
- `assistant-chat` etapa pós-tool agora roda em modo NÃO-stream e detecta `finish_reason: error` / `MALFORMED_FUNCTION_CALL` / `content_filter` / texto vazio, caindo num fallback determinístico montado a partir do resultado real das tools. O usuário nunca recebe resposta vazia.
- `sanitizeHistory()` antes de chamar o gateway: descarta mensagens assistentes vazias/truncadas e as mensagens de erro do front (`⚠️ …`, `❌ …`), evitando que respostas anteriores quebradas disparem novo MALFORMED_FUNCTION_CALL no próximo turno. Histórico reduzido pra 16 últimas mensagens, cada uma capada em 8000 chars.
- Nova tool `send_campaign_approval_email` (admin only): busca campanhas em `pending_approval` (ou IDs específicos), resolve destinatários (Ponto Focal + Manager por padrão; opcional `include_all_client_users`), dispara via Edge Function `notify-email` evento `campaign_pending_approval` com o template oficial `campaignPendingApprovalEmail`. Sucesso só se ao menos um envio for OK.
- Regra #8 do system prompt: avisos de aprovação por e-mail DEVEM usar `send_campaign_approval_email`; demais ações externas (WhatsApp, publicação em plataforma) viram `create_task`.
- Frontend: mensagem de fallback mais clara — "Não recebi uma resposta válida da IA. Nenhuma ação foi confirmada."
