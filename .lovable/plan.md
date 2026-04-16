

# Nova Página Admin "Métricas" no Operacional + Relatório Estruturado no Cliente

## Contexto
Atualmente, métricas de tráfego são gerenciadas apenas dentro do detalhe de cada cliente (`/admin/clientes/:id` aba Métricas). O pedido é ter uma **página dedicada** no menu Operacional para gestão centralizada de métricas de todos os clientes, com visão técnica e controle completo. O relatório estruturado resultante já é exibido no painel do cliente (`/cliente/metricas-trafego`), que possui gráficos, tabela, exportação XLSX e KPIs.

## O que será feito

### 1. Nova página `/admin/metricas` — Gestão Centralizada de Métricas
**Novo arquivo**: `src/pages/admin/Metrics.tsx`

- **Seletor de cliente** no topo (dropdown com todos os clientes ativos)
- **Visão geral**: cards resumo do mês mais recente do cliente selecionado (Investimento, Leads, CPL, Vendas, CPV, ROAS)
- **Tabela completa**: todos os meses do cliente com todas as colunas técnicas (alcance, impressões, frequência, cliques, CPC, leads, CPL, SQLs, CPSQL, vendas, CPV)
- **CRUD completo**: criar, editar e excluir registros mensais com cálculos automáticos (CPL, CPV, CPC, CPSQL)
- **Filtro por ano**: seletor de ano igual ao do cliente
- **Visão multi-cliente**: tabela resumo mostrando o último mês de cada cliente para comparação rápida (investimento, leads, CPL, vendas)
- **Exportação**: botão para exportar os dados do cliente selecionado em XLSX

### 2. Adicionar ao menu e rotas
**Arquivos editados**:
- `src/layouts/AdminLayout.tsx` — adicionar item "Métricas" com ícone `BarChart3` no grupo Operacional
- `src/App.tsx` — adicionar rota lazy `/admin/metricas` → `Metrics.tsx`

### 3. Relatório no cliente (já existe)
A página `/cliente/metricas-trafego` já exibe relatório estruturado com:
- Cards de KPIs do mês mais recente
- Gráfico de evolução mensal (LineChart)
- Tabela completa com todos os dados
- Exportação XLSX
- Edição pelo Ponto Focal

Qualquer dado inserido na nova página admin aparece automaticamente no painel do cliente (mesma tabela `traffic_metrics`).

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/Metrics.tsx` | **Novo** — Página centralizada de métricas por cliente |
| `src/layouts/AdminLayout.tsx` | Adicionar "Métricas" no grupo Operacional |
| `src/App.tsx` | Adicionar rota `/admin/metricas` |

## Sem mudanças de banco
Tabela `traffic_metrics` e RLS já existem e suportam admin com ALL.

