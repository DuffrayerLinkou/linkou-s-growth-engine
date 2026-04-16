

# Melhorar Acompanhamento de Resultados, Métricas e Plano Estratégico

## Problemas Identificados

1. **Métricas bloqueadas**: A página `MetricasTrafego.tsx` exige `user_type === "manager"` — Ponto Focal e Operadores não conseguem ver nem preencher a tabela
2. **Campanhas sem KPIs visíveis**: A página de campanhas do cliente não mostra métricas de performance por campanha
3. **Dashboard do cliente sem resumo de resultados**: Não há cards de KPIs de tráfego (investimento, leads, CPL, vendas) no dashboard
4. **Plano estratégico invisível para o cliente**: Não há página no painel do cliente para visualizar o plano estratégico criado pelo admin

## Solução em 4 Partes

### 1. Liberar métricas para todos os perfis do cliente
**Arquivo**: `src/pages/cliente/MetricasTrafego.tsx`
- Remover o bloqueio `if (!isManager)` (linhas 434-445)
- Manter `canEdit` apenas para Ponto Focal (`profile?.ponto_focal`) — os demais visualizam sem editar
- Manager continua podendo ver, Ponto Focal vê e edita, Operador apenas visualiza

### 2. Adicionar KPIs de resultados no Dashboard do cliente
**Arquivo**: `src/pages/cliente/Dashboard.tsx`
- Adicionar query para buscar métricas do mês atual e anterior de `traffic_metrics`
- Inserir seção "Resultados do Mês" com 4 cards: Investimento, Leads, CPL Médio, Vendas
- Mostrar variação percentual vs mês anterior
- Visível para todos os perfis (dados já protegidos por RLS)

### 3. Mostrar métricas por campanha individual
**Arquivo**: `src/pages/cliente/Campanhas.tsx`
- No card expandido de cada campanha, exibir o campo `metrics` (jsonb) como mini-cards de KPIs
- Campos: impressões, cliques, CTR, leads, custo, CPL (já armazenados no campo `metrics` da tabela `campaigns`)
- Admin preenche via painel; cliente visualiza

### 4. Página de Plano Estratégico para o cliente
**Novos arquivos**:
- `src/pages/cliente/PlanoEstrategico.tsx` — página read-only exibindo dados de `strategic_plans`
- Mostra: título, objetivos, KPIs, personas, estratégia de funil, tipos de campanha, timeline, alocação de budget
- Layout em cards organizados por seção

**Arquivo editado**: `src/App.tsx` — adicionar rota `/cliente/plano-estrategico`
**Arquivo editado**: `src/layouts/ClientLayout.tsx` — adicionar item no menu lateral

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/cliente/MetricasTrafego.tsx` | Remover bloqueio de Manager, manter edição só para Ponto Focal |
| `src/pages/cliente/Dashboard.tsx` | Adicionar seção de KPIs de resultados do mês |
| `src/pages/cliente/Campanhas.tsx` | Exibir métricas individuais por campanha |
| `src/pages/cliente/PlanoEstrategico.tsx` | Nova página read-only do plano estratégico |
| `src/App.tsx` | Adicionar rota do plano estratégico |
| `src/layouts/ClientLayout.tsx` | Adicionar link no menu |

Nenhuma mudança de banco necessária — todas as tabelas e RLS já existem.

