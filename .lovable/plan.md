

## Plano Estratégico Profundo — Estrutura, IA e PDF Editorial

O plano gerado está raso porque o **schema atual descarta dados ricos**: objetivos/KPIs viram strings simples, personas vira texto livre, e o PDF é uma lista chave→valor. Vou transformar em documento estratégico real, com profundidade, hierarquia e identidade Linkou.

---

### Diagnóstico do que está raso hoje

| Hoje | Problema |
|---|---|
| `objectives: { list: ["string"] }` | Sem meta numérica, prazo, dono, baseline |
| `kpis: { list: ["string"] }` | Sem unidade, valor atual, valor-alvo, fonte |
| `personas: { description: "texto" }` | Sem segmentação, dores, canais, gatilhos |
| `funnel_strategy: "texto longo"` | Sem separação topo/meio/fundo, sem KPIs por etapa |
| `budget_allocation` existe no schema mas **não tem campo no formulário** | IA preenche, humano não |
| **Sem campos**: diagnóstico, concorrência, posicionamento, mensagens-chave, cronograma de ondas, riscos, governança | Plano vira "ficha técnica" |
| PDF: lista de seções planas, fonte Helvetica, sem capa, sem tabelas | Parece relatório de log, não plano estratégico |

---

### O que vai mudar

#### 1. Enriquecer schema do `strategic_plans` (sem migração — usar JSONB existente)

Manter colunas, mas estruturar o JSONB como objetos profundos:

```ts
objectives: [{ name, description, metric, baseline, target, deadline, owner }]
kpis:       [{ name, category, unit, current, target, source, frequency }]
personas:   [{ name, demographics, pain_points[], desires[], objections[], channels[], message_hook }]
funnel_strategy: {
  topo:  { goal, channels[], creatives[], kpi, budget_pct },
  meio:  { goal, channels[], creatives[], kpi, budget_pct },
  fundo: { goal, channels[], creatives[], kpi, budget_pct },
  reengajamento: { ... }
}
budget_allocation: { total_monthly, by_channel: { meta:%, google:%, ... }, by_phase: { topo:%, meio:%, fundo:% }, reserve_pct }
```

Adicionar **2 novos campos JSONB** via migração leve:
- `diagnostic` — situação atual, concorrência, oportunidades, riscos
- `execution_plan` — ondas/sprints (mês 1, 2, 3...), entregas, marcos, governança (cadência de calls, relatórios)

#### 2. Reescrever `PlanningTab.tsx` com formulário multi-seção

Substituir os 4 textareas planos por **6 abas** dentro do dialog de criação/edição:

1. **Visão Geral** — título, cliente, período, status, sumário executivo (textarea)
2. **Diagnóstico** — situação atual, concorrência (lista), oportunidades, riscos (lista)
3. **Personas** — repeater dinâmico (botão "Adicionar persona") com 7 campos por persona
4. **Objetivos & KPIs** — duas tabelas editáveis (linhas adicionáveis) com colunas estruturadas
5. **Funil & Mensagens** — 3 blocos (topo/meio/fundo) com goal, canais (multi-select), criativos, KPI principal, % budget
6. **Execução** — alocação de budget (por canal + por fase), cronograma de ondas (repeater), governança

#### 3. Aprimorar prompt do `create_strategic_plan` na IA

Em `assistant-chat/index.ts`, expandir o `description` da tool e adicionar **instruções no system prompt** para a IA gerar:

- Mínimo 3 personas com dores e objeções
- Mínimo 5 objetivos SMART com baseline e target numéricos
- Mínimo 6 KPIs distribuídos entre aquisição/conversão/retenção
- Funil estruturado em 3-4 etapas com KPI e % budget por etapa
- Diagnóstico com 3 oportunidades + 3 riscos
- Plano de execução com 3 ondas (90 dias) e governança definida

Validar via `tool_choice` forçado e schema JSON estrito (já parcialmente aplicado).

#### 4. Reescrever PDF — `pdf-generator.ts` com modo "editorial"

Criar nova função `generateStrategicPlanPDF(plan, clientName)` separada da genérica:

**Estrutura visual (10-15 páginas):**

```text
Pág 1   │ CAPA: logo Linkou, nome cliente, título plano, período, status
Pág 2   │ Sumário executivo + índice clicável
Pág 3   │ Diagnóstico: situação atual, concorrência (tabela)
Pág 4   │ SWOT visual (oportunidades vs riscos, 2 colunas)
Pág 5-6 │ Personas: 1 persona por bloco com card (demografia | dores | canais | mensagem)
Pág 7   │ Objetivos SMART: tabela (Objetivo | Métrica | Baseline | Meta | Prazo | Dono)
Pág 8   │ KPIs: tabela agrupada por categoria (Aquisição / Conversão / Retenção)
Pág 9-10│ Funil: 3 colunas (Topo | Meio | Fundo) com goal, canais, KPI, % budget
Pág 11  │ Mensagens-chave: copy hooks por persona × etapa funil
Pág 12  │ Alocação de budget: 2 donuts (por canal | por fase) + tabela
Pág 13  │ Cronograma: timeline horizontal de ondas/sprints (Gantt simplificado)
Pág 14  │ Governança: cadência calls, relatórios, ferramentas, responsáveis
Pág 15  │ Próximos passos + assinatura Leo Santana / Linkou
```

**Identidade visual:**
- Fonte: Poppins (títulos) + Helvetica (corpo) — Poppins via base64 embedded ou fallback bold
- Cor primária: roxo Linkou `#6D28D9` em headers, divisórias, badges
- Capa com gradiente roxo + logo
- Footer em todas as páginas: "Linkou • agencialinkou.com.br • Página X de N"
- Tabelas com header roxo, linhas zebradas
- Cards de persona com borda lateral colorida
- Ícones via desenho vetorial inline (não emoji)

**Robustez:**
- Renderizar apenas seções com dados (skip vazias)
- Quebra de página inteligente (não cortar tabelas no meio)
- Suportar texto longo com wrap automático

#### 5. Atualizar `ClientPlanTab.tsx` (visualização no admin)

Refletir nova estrutura: cards de persona, tabela de KPIs, blocos de funil — alinhado ao PDF.

---

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/<new>.sql` | Adicionar colunas `diagnostic jsonb`, `execution_plan jsonb`, `executive_summary text` em `strategic_plans` |
| `src/integrations/supabase/types.ts` | Regenerado automaticamente pela migração |
| `src/components/admin/onboarding/PlanningTab.tsx` | Formulário com 6 abas, repeaters dinâmicos, schema rico |
| `src/components/admin/client-detail/ClientPlanTab.tsx` | Renderização rica com novas estruturas |
| `src/pages/cliente/PlanoEstrategico.tsx` | Mesma renderização rica para o cliente |
| `src/lib/pdf-generator.ts` | Adicionar `generateStrategicPlanPDF()` editorial (mantém função antiga para outros usos) |
| `supabase/functions/assistant-chat/index.ts` | Expandir tool `create_strategic_plan` (schema JSON profundo) + reforço no system prompt |

### Sem alterações
- Tabela `strategic_plans` mantida (apenas adiciona colunas opcionais — backwards compatible)
- Planos existentes continuam funcionando (renderer detecta formato antigo `{list:[…]}` vs novo `[{…}]`)
- Outros PDFs (briefing, projetos) continuam usando `generateStructuredPDF` genérico

### Próximo passo após aprovar
1. Migração SQL (3 colunas novas)
2. Reescrever `PlanningTab.tsx` com tabs + repeaters
3. Atualizar prompt da IA + tool schema
4. Implementar `generateStrategicPlanPDF` editorial
5. Atualizar visualizações (admin + cliente)
6. Testar: criar plano via IA → ver no admin → exportar PDF → conferir profundidade

