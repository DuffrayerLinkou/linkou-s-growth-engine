

# Linkouzinho com Tool Calling: 3 Ações Internas (sem pesquisa externa)

## Escopo
Adicionar ao Linkouzinho a capacidade de executar 3 ações no banco via function calling do Gemini:
1. **Agendar reunião** (`create_appointment`) — admin only
2. **Criar tarefa** (`create_task`) — admin only
3. **Preencher métricas** (`upsert_traffic_metrics`) — admin only

Sem pesquisa externa. Consulta de dados continua funcionando como hoje (read-only via contexto).

## Arquitetura

```text
Usuário → "Agende reunião dia 20 às 14h"
  ↓
Edge Function → Gemini (stream: false, com tools)
  ↓
Gemini retorna tool_call → Edge Function executa INSERT
  ↓
Edge Function → Gemini (stream: true, com resultado)
  ↓
Stream de confirmação → Frontend
```

## Alterações

### 1. Edge Function `assistant-chat/index.ts`

- Definir 3 tools no formato OpenAI function calling:
  - `create_appointment`: params `title`, `date` (ISO), `duration_minutes`, `description`
  - `create_task`: params `title`, `description`, `priority`, `due_date`, `executor_type`
  - `upsert_traffic_metrics`: params `month`, `year`, `investimento`, `impressoes`, `cliques`, `quantidade_leads`, `quantidade_vendas`, `custo_por_lead`, `custo_por_venda`

- Filtrar tools por mode: client mode recebe `tools: []` (sem ações), admin recebe as 3

- Fluxo de execução:
  1. Primeira chamada ao Gemini com `stream: false` e `tools` + `tool_choice: "auto"`
  2. Se resposta contém `tool_calls`: executar cada tool (INSERT/UPSERT via service role `db`)
  3. Montar mensagens com resultado da tool e fazer segunda chamada com `stream: true`
  4. Se não contém `tool_calls`: fazer chamada normal com `stream: true` (comportamento atual)

- Adicionar instruções no system prompt admin sobre quando usar cada tool

- Executores das tools:
  - `create_appointment`: `db.from("appointments").insert({ client_id, title, appointment_date, duration_minutes, description, created_by: userId, status: "scheduled" })`
  - `create_task`: `db.from("tasks").insert({ client_id, title, description, priority, due_date, executor_type, created_by: userId, status: "todo" })`
  - `upsert_traffic_metrics`: SELECT existente por client_id+month+year → INSERT ou UPDATE

### 2. Frontend `LinkouzinhoInternal.tsx`

Mudanças mínimas:
- Adicionar sugestões admin: "Agendar reunião", "Criar tarefa", "Preencher métricas" (substituir 1 das atuais)
- Mostrar ícone de engrenagem (⚙️) no typing indicator quando a resposta demora mais (ação sendo executada) — detectado pelo tempo de resposta (>3s mostra "Executando ação...")
- Nenhuma mudança no parsing SSE (o streaming continua igual)

### 3. Config `supabase/config.toml`

Já existe `assistant-chat` registrado — sem mudança necessária.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | Tool calling + execução de 3 ações |
| `src/components/LinkouzinhoInternal.tsx` | Novas sugestões + indicador de ação |

## Sem mudanças de banco
Tabelas `appointments`, `tasks`, `traffic_metrics` já existem. Service role ignora RLS.

