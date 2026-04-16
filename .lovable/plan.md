

# Correções de Consistência: Admin ↔ Cliente

## Problemas Encontrados na Revisão

### 1. Formatação de Budget Allocation inconsistente
- **Admin** (`ClientPlanTab.tsx` linha 155): formata como moeda BRL (`toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`)
- **Cliente** (`PlanoEstrategico.tsx` linha 246): formata como porcentagem (`${value}%`)
- **Problema**: Se o admin salvar R$ 5.000, o cliente vai exibir "5000%"
- **Correção**: Unificar a lógica — detectar se o valor é numérico e usar a mesma formatação inteligente (se < 100 e parece %, mostrar como %; se parecer valor monetário, mostrar como BRL)

### 2. Missing DialogDescription (warnings no console)
- `ClientMetricsTab.tsx` e `ClientCampaignsTab.tsx` não têm `DialogDescription` nos dialogs
- Causa warnings de acessibilidade no console
- **Correção**: Adicionar `DialogDescription` nos dois componentes

### 3. Tudo mais está OK
- **traffic_metrics**: Admin e cliente usam mesmos campos (`investimento`, `quantidade_leads`, `custo_por_lead`, etc.) com mesmos cálculos automáticos
- **campaigns.metrics**: Admin salva `impressoes`, `cliques`, `ctr`, `leads`, `custo`, `cpl` — cliente mapeia todos corretamente no `metricLabels`
- **strategic_plans**: Ambos lêem os mesmos campos (`objectives`, `kpis`, `personas`, `funnel_strategy`, `campaign_types`, `budget_allocation`)
- **Dashboard KPIs**: Query correta buscando mês atual/anterior de `traffic_metrics` com cálculos de variação
- **RLS**: Todas as políticas permitem admin (ALL) e cliente (SELECT via `get_user_client_id`)

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/cliente/PlanoEstrategico.tsx` | Corrigir formatação de budget allocation (usar mesma lógica do admin) |
| `src/components/admin/client-detail/ClientMetricsTab.tsx` | Adicionar `DialogDescription` |
| `src/components/admin/client-detail/ClientCampaignsTab.tsx` | Adicionar `DialogDescription` |

Correções pequenas e focadas — sem mudanças de banco nem de lógica.

