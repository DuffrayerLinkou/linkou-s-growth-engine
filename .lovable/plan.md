

# Linkouzinho com Ações: Tool Calling para Agendar, Criar Tarefas, Preencher Métricas e Pesquisar

## Visão geral
Transformar o Linkouzinho de assistente **somente leitura** para um **assistente com ações**, usando o mecanismo de **function calling** do Gemini. O admin diz "Agende uma reunião com o cliente X dia 20 às 14h" e o Linkouzinho executa diretamente no banco.

## Arquitetura

```text
Usuário → "Agende reunião dia 20 às 14h"
       ↓
Edge Function → Gemini (com tools definidos)
       ↓
Gemini responde: tool_call: create_appointment({date: "2026-04-20T14:00", title: "Reunião"})
       ↓
Edge Function executa INSERT no banco via service role
       ↓
Edge Function envia resultado de volta ao Gemini
       ↓
Gemini responde: "Reunião agendada para 20/04 às 14h ✅"
       ↓
Stream pro frontend
```

## Ferramentas disponíveis para o AI

### 1. `create_appointment` (Agendar reuniões)
- Params: `title`, `date`, `duration_minutes`, `description`
- Executa: INSERT na tabela `appointments` com `client_id` e `created_by`
- Disponível para: admin

### 2. `create_task` (Criar tarefas)
- Params: `title`, `description`, `priority`, `due_date`, `executor_type`
- Executa: INSERT na tabela `tasks` com `client_id` e `created_by`
- Disponível para: admin

### 3. `upsert_traffic_metrics` (Preencher métricas)
- Params: `month`, `year`, `investimento`, `impressoes`, `cliques`, `quantidade_leads`, `quantidade_vendas`, `custo_por_lead`, `custo_por_venda`
- Executa: UPSERT na tabela `traffic_metrics` verificando duplicata (client_id + month + year)
- Disponível para: admin

### 4. `web_search` (Pesquisa online)
- Params: `query`
- Executa: Chamada à Perplexity API (conector) com `sonar` model
- Retorna: resumo + citações
- Disponível para: admin e client

## Implementação

### 1. Atualizar Edge Function `assistant-chat`
**Arquivo**: `supabase/functions/assistant-chat/index.ts`

Mudanças principais:
- Definir array `tools` no formato OpenAI (function calling) com as 4 ferramentas
- Fazer primeira chamada ao Gemini **sem streaming** (`stream: false`) para detectar tool calls
- Se Gemini retornar `tool_calls`:
  - Executar cada tool call (INSERT no DB ou chamada Perplexity)
  - Montar mensagem `tool` com resultado
  - Fazer segunda chamada ao Gemini **com streaming** incluindo o resultado
- Se não houver tool calls: fazer streaming normal (comportamento atual)
- Filtrar tools por `mode` (client não pode criar tasks/appointments/metrics)
- Adicionar instruções no system prompt sobre quando usar cada tool

### 2. Conectar Perplexity para pesquisa web
- Usar conector Perplexity via `standard_connectors--connect`
- Na Edge Function, ler `PERPLEXITY_API_KEY` do env
- Chamar `https://api.perplexity.ai/chat/completions` com model `sonar`

### 3. Atualizar o frontend `LinkouzinhoInternal`
**Arquivo**: `src/components/LinkouzinhoInternal.tsx`

Mudanças mínimas:
- Detectar no stream se há um bloco de "ação executada" (o AI já responde em texto)
- Adicionar sugestões rápidas novas para admin: "Agendar reunião", "Criar tarefa"
- Mostrar indicador visual diferente durante execução de ação (ícone de engrenagem ao invés de typing dots)

### 4. Atualizar system prompt
Adicionar instruções claras sobre as ferramentas:
- "Use `create_appointment` quando o usuário pedir para agendar reunião/call"
- "Use `create_task` quando pedirem para criar tarefa ou lembrete"
- "Use `upsert_traffic_metrics` quando fornecerem dados de métricas para preencher"
- "Use `web_search` quando precisar de informações externas, benchmarks, ou tendências"
- "SEMPRE confirme o que foi feito após executar uma ação"

## Pré-requisito: Perplexity
Para pesquisa online, precisamos conectar o Perplexity. Se não estiver disponível, as outras 3 ferramentas funcionam independentemente.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | Lógica de tool calling completa + execução de ações |
| `src/components/LinkouzinhoInternal.tsx` | Novas sugestões + indicador de ação |

## Sem mudanças de banco
Todas as tabelas já existem. A Edge Function usa service role que tem acesso total.

