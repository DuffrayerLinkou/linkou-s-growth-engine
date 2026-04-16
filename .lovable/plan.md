

# Resultados de Campanhas: Gestão Completa no Admin + Relatório no Cliente

## Problema atual
1. A página `/admin/campanhas` **não tem aba de Resultados/Métricas** — o admin cria a campanha mas não pode preencher resultados ali
2. As plataformas são limitadas a 4 (Meta, Google, TikTok, LinkedIn) — faltam canais como "Disparo Banco de Dados", "E-mail Marketing", "WhatsApp", "Evento Presencial", "Orgânico"
3. O campo `metrics` (JSONB) aceita qualquer estrutura, mas o formulário é fixo em 6 campos (impressões, cliques, CTR, leads, custo, CPL) — insuficiente para diferentes tipos de canal
4. Não existe conceito de "Ações" dentro de uma campanha (sub-ações com métricas individuais)
5. O cliente vê métricas genéricas sem contexto de relatório profissional

## Plano de implementação

### 1. Expandir plataformas/canais
**Arquivo**: `src/pages/admin/Campaigns.tsx`

Adicionar novos canais ao `platformLabels` e `platformObjectives`:
- `email_marketing` → E-mail Marketing (objetivos: Nutrição, Conversão, Retenção)
- `whatsapp` → WhatsApp (objetivos: Disparo em Massa, Atendimento, Follow-up)
- `database_blast` → Disparo Banco de Dados (objetivos: Reativação, Prospecção)
- `organic` → Orgânico / SEO (objetivos: Tráfego, Autoridade)
- `event` → Evento / Presencial (objetivos: Networking, Geração de Leads)
- `other` → Outro

Replicar no `platformLabels` do cliente (`src/pages/cliente/Campanhas.tsx`)

### 2. Nova aba "Resultados" no formulário de campanha do admin
**Arquivo**: `src/pages/admin/Campaigns.tsx`

Adicionar 5a aba `results` no TabsList do dialog de criação/edição:
- Campo `results` (textarea) — resumo textual dos resultados
- Formulário dinâmico de métricas baseado no tipo de canal:
  - **Ads (Meta/Google/TikTok/LinkedIn)**: impressões, alcance, cliques, CTR, leads, conversões, custo, CPC, CPL, ROAS
  - **E-mail/Disparo BD**: enviados, entregues, aberturas, taxa_abertura, cliques, taxa_cliques, respostas, conversões
  - **WhatsApp**: enviados, entregues, lidos, respostas, conversões
  - **Orgânico/Evento**: alcance, leads, conversões, observações
- Cálculos automáticos (CTR, CPL, taxa_abertura, taxa_cliques)
- Salva tudo no campo `metrics` (JSONB) + `results` (text)

### 3. Melhorar exibição de métricas no painel do cliente
**Arquivo**: `src/pages/cliente/Campanhas.tsx`

- Expandir o `metricLabels` para incluir as novas chaves (enviados, entregues, aberturas, taxa_abertura, respostas, etc.)
- Adicionar formatação inteligente: detectar se é percentual, moeda ou número inteiro
- Exibir `results` (texto) como bloco de "Resumo do Relatório" com destaque visual
- Organizar métricas em seções lógicas (Alcance, Engajamento, Conversão, Custo)

### 4. Atualizar ClientCampaignsTab (detalhe do cliente no admin)
**Arquivo**: `src/components/admin/client-detail/ClientCampaignsTab.tsx`

- Usar o mesmo formulário dinâmico de métricas por canal (consistente com a aba Resultados)
- Mostrar campo `results` também

## Sem mudanças de banco
O campo `metrics` já é JSONB (aceita qualquer estrutura) e `results` já existe como TEXT na tabela `campaigns`. Apenas código frontend.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/Campaigns.tsx` | Novos canais, nova aba "Resultados" com métricas dinâmicas por tipo de canal |
| `src/pages/cliente/Campanhas.tsx` | Novos labels, bloco de relatório, métricas organizadas por seção |
| `src/components/admin/client-detail/ClientCampaignsTab.tsx` | Formulário de métricas dinâmico por canal + campo results |

