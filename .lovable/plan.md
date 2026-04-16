

# Adicionar Tool `create_campaign` ao Linkouzinho

## Objetivo
Permitir que o Linkouzinho estruture campanhas profissionais na tabela `campaigns` usando dados contextuais do cliente (briefing, plano estratégico, métricas históricas, segmento).

## Alterações

### 1. Edge Function `assistant-chat/index.ts`

**Nova tool `create_campaign`** no array `adminTools`:
- Params: `name`, `platform` (meta_ads, google_ads, tiktok_ads, linkedin_ads, etc.), `objective`, `objective_detail`, `campaign_type`, `strategy`, `budget`, `daily_budget`, `start_date`, `end_date`, `headline`, `ad_copy`, `call_to_action`, `targeting` (JSON), `description`
- Required: `name`, `platform`
- O AI deve usar os dados do briefing, plano e métricas para preencher campos como targeting, strategy e objective de forma técnica

**Novo executor** no `executeTool`:
- INSERT na tabela `campaigns` com `status: "draft"`, `client_id`, `created_by`
- Precisa de um `project_id` — buscar o projeto mais recente do cliente ou criar sem project_id se não houver

**Enriquecer o contexto** com dados do briefing:
- Adicionar fetch de `briefings` (nicho, público_alvo, objetivos, diferenciais, concorrentes, budget_mensal) no `Promise.all`
- Incluir no bloco de contexto do system prompt para que o AI tenha base para criar campanhas inteligentes

**Atualizar system prompt admin**:
- Adicionar instrução sobre `create_campaign`: "Use para estruturar campanhas completas. Baseie-se no briefing, plano estratégico, segmento e métricas do cliente. Defina targeting, estratégia e budget como um gestor de tráfego profissional."
- Instruir o AI a ser técnico: definir objetivos corretos por plataforma, sugerir placements, definir público-alvo baseado nas personas do plano

### 2. Frontend `LinkouzinhoInternal.tsx`

- Adicionar sugestão rápida: "Estruturar campanha" nas `ADMIN_SUGGESTIONS`

## Tabela `campaigns` — campos relevantes já existentes
A tabela já possui todos os campos necessários: `name`, `platform`, `objective`, `objective_detail`, `campaign_type`, `strategy`, `budget`, `daily_budget`, `start_date`, `end_date`, `headline`, `ad_copy`, `call_to_action`, `targeting` (jsonb), `placements` (jsonb), `creatives` (jsonb), `bidding_strategy`, `target_cpa`, `target_roas`. Nenhuma migração necessária.

## Dados de contexto adicionados ao AI
| Fonte | Dados para o AI |
|---|---|
| `briefings` | nicho, público_alvo, diferenciais, concorrentes, objetivos, budget_mensal |
| `strategic_plans` | personas, KPIs, tipos de campanha, estratégia de funil |
| `traffic_metrics` | CPL/CPV históricos, volume de leads/vendas |
| `campaigns` | campanhas existentes (evitar duplicação) |

Com esses dados, o AI poderá gerar campanhas tecnicamente sólidas como um gestor de marketing.

## Arquivos alterados
| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | Nova tool + fetch briefing + executor + prompt |
| `src/components/LinkouzinhoInternal.tsx` | Nova sugestão "Estruturar campanha" |

