

# Expandir Linkouzinho: Criar Projeto, Plano Estratégico e Funções de Alto Valor IA

## Novas Tools

### 1. `create_project` — Criar Projeto
- Params: `name`, `description`, `start_date`, `end_date`, `budget`, `status`
- Required: `name`
- INSERT em `projects` com `client_id`, `created_by`, `status: "planning"`

### 2. `create_strategic_plan` — Criar Plano Estratégico
- Params: `title`, `objectives` (JSON array), `kpis` (JSON array), `personas` (JSON array), `funnel_strategy`, `campaign_types` (array), `timeline_start`, `timeline_end`, `budget_allocation` (JSON)
- Required: `title`
- O AI usa briefing, segmento, métricas históricas para gerar um plano técnico completo com personas, KPIs SMART, estratégia de funil e alocação de budget
- INSERT em `strategic_plans` com `status: "draft"`

### 3. `create_briefing` — Criar/Atualizar Briefing
- Params: `title`, `nicho`, `publico_alvo`, `objetivos`, `diferenciais`, `concorrentes`, `budget_mensal`, `observacoes`
- Required: `title`
- INSERT em `briefings` com `status: "pending"`
- Útil quando admin dita dados do cliente ao Linkouzinho

### 4. `generate_campaign_analysis` — Análise Estratégica de Campanhas
- Não é uma tool de banco — é uma instrução no prompt para que o AI, quando solicitado, gere uma análise completa comparando campanhas, identificando gargalos no funil, sugerindo otimizações e projetando cenários
- Sem tool call, apenas reforço no system prompt para ser técnico e usar os dados de contexto

## Alterações

### Edge Function `assistant-chat/index.ts`

1. **3 novas tools** no array `adminTools`: `create_project`, `create_strategic_plan`, `create_briefing`
2. **3 novos executors** no `executeTool`:
   - `create_project`: INSERT simples
   - `create_strategic_plan`: INSERT com JSONs (objectives, kpis, personas, budget_allocation)
   - `create_briefing`: INSERT simples
3. **System prompt atualizado**:
   - Instruções sobre cada nova tool
   - Para `create_strategic_plan`: "Gere personas detalhadas, KPIs SMART, estratégia de funil (topo/meio/fundo), alocação de budget por canal e tipos de campanha recomendados. Baseie-se no briefing e métricas."
   - Para `create_project`: "Use quando o admin quiser iniciar um novo projeto. Defina nome e descrição claros."
   - Para análise: "Quando pedirem análise, compare CPL/CPV entre meses, identifique tendências, calcule variação percentual e sugira ações concretas."

### Frontend `LinkouzinhoInternal.tsx`

- Atualizar `ADMIN_SUGGESTIONS` com "Criar projeto" e "Criar plano estratégico"

## Valor do AI nestas funções

| Tool | Valor IA |
|---|---|
| `create_strategic_plan` | **Alto** — AI gera personas, KPIs, estratégia de funil e alocação de budget automaticamente baseado no briefing |
| `create_campaign` | **Alto** — já implementado, usa briefing+plano para targeting e copy |
| `create_briefing` | **Médio** — admin dita info e AI estrutura; menos geração criativa |
| `create_project` | **Baixo** — principalmente conveniência operacional |
| Análise (prompt) | **Alto** — comparações, projeções e recomendações técnicas |

## Sem mudanças de banco
Tabelas `projects`, `strategic_plans`, `briefings` já existem com todos os campos necessários.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | 3 novas tools + executors + prompt |
| `src/components/LinkouzinhoInternal.tsx` | Novas sugestões |

