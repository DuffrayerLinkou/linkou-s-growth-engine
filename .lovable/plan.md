

# Admin gerencia resultados + Cliente visualiza em tempo real

## Situação atual
- **Cliente** (`/cliente/metricas-trafego`): Já tem tabela completa de métricas com CRUD, cálculos automáticos (CPL, CPV, CPSQL), gráficos e exportação. Porém estava bloqueado por `isManager` (já corrigido).
- **Admin** (`/admin/clientes/:id`): Tem apenas 3 abas (Jornada, Usuários, Arquivos). Não consegue ver nem preencher métricas, campanhas ou plano estratégico do cliente.
- **Dados compartilhados**: Ambos lêem/escrevem na mesma tabela `traffic_metrics` (RLS já permite admin e ponto_focal). Qualquer dado preenchido por um lado aparece automaticamente no outro.

## Plano de implementação

### 1. Nova aba "Métricas" no ClientDetail (admin)
**Arquivo**: `src/pages/admin/ClientDetail.tsx`
- Adicionar `TabsTrigger` "Métricas" com ícone `BarChart3`
- Conteúdo: tabela mensal de `traffic_metrics` filtrada pelo `client_id` do cliente aberto
- Formulário dialog para criar/editar mês com os campos de entrada: investimento, alcance, impressões, frequência, cliques, leads, SQLs, vendas
- **Cálculos automáticos** (mesma lógica do cliente): CPL = investimento/leads, CPV = investimento/vendas, CPSQL = investimento/sql, CPC = investimento/cliques
- Botão de excluir registro mensal
- Cards resumo do mês mais recente no topo da aba

### 2. Nova aba "Campanhas" no ClientDetail (admin)
**Arquivo**: `src/pages/admin/ClientDetail.tsx`
- Adicionar `TabsTrigger` "Campanhas" com ícone `Megaphone`
- Lista de campanhas do cliente com status e datas
- Dialog para editar o campo `metrics` (jsonb) de cada campanha: impressões, cliques, CTR, leads, custo, CPL
- Admin preenche; cliente visualiza automaticamente em `/cliente/campanhas`

### 3. Nova aba "Plano" no ClientDetail (admin)
**Arquivo**: `src/pages/admin/ClientDetail.tsx`
- Adicionar `TabsTrigger` "Plano" com ícone `FileText`
- Exibir plano estratégico do cliente (`strategic_plans`) com objetivos, KPIs, personas, estratégia de funil
- Link direto para a página de Onboarding (`/admin/onboarding`) onde o plano é gerenciado em detalhe

### 4. Garantir que o cliente vê e edita em tempo real
- A página `/cliente/metricas-trafego` já permite que o Ponto Focal edite (mesma tabela `traffic_metrics`)
- A página `/cliente/campanhas` já mostra métricas do campo `metrics` (implementado anteriormente)
- A página `/cliente/plano-estrategico` já mostra o plano read-only (implementado anteriormente)
- **Nenhuma mudança necessária** no lado do cliente — os dados são compartilhados via Supabase em tempo real

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/ClientDetail.tsx` | Adicionar 3 novas abas (Métricas, Campanhas, Plano) com queries, formulários CRUD e cálculos automáticos |

## Sem mudanças de banco
Todas as tabelas (`traffic_metrics`, `campaigns`, `strategic_plans`) e RLS já existem e permitem acesso para admin.

## Lógica de cálculo automático (replicada do cliente)
```text
CPL = investimento / quantidade_leads
CPV = investimento / quantidade_vendas  
CPSQL = investimento / quantidade_sql
CPC = investimento / cliques (se houver)
```
O admin preenche os dados brutos e os campos calculados são gerados automaticamente no save.

