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

Sprint 2 (RAG documental com pgvector + tool `search_documents`) e Sprint 3 (UI `/admin/insights` + botão "tornar pesquisável" em Arquivos) pendentes.
