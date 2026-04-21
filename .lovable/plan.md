

## Finalizar módulo Palavras-chave — rotas, menus e autonomia do Linkouzinho

Faltam 3 plugagens pra fechar o módulo já criado:

### 1. Rotas em `src/App.tsx`
Adicionar lazy imports e rotas dentro dos respectivos layouts:
- `/admin/keywords` → `AdminLayout` (admin/account_manager)
- `/cliente/keywords` → `ClientLayout` (qualquer papel do cliente)

### 2. Menus laterais

**`src/layouts/AdminLayout.tsx`** — adicionar item "Palavras-chave" com ícone `KeyRound` no grupo **Operacional**, posicionado logo após "Métricas":
```ts
{ href: "/admin/keywords", icon: KeyRound, label: "Palavras-chave" }
```

**`src/layouts/ClientLayout.tsx`** — adicionar item "Palavras-chave" com ícone `KeyRound`, posicionado logo após "Criativos" e antes de "Projetos". Sem `permission` (visível para todos os papéis do cliente).

### 3. Linkouzinho admin — 6 tools novas + contexto SEO

**`supabase/functions/assistant-chat/index.ts`** — adicionar:

**Fetches paralelos** no `Promise.all` (cliente atual):
- `keywords` últimas 20 (term, intent, search_volume, difficulty, current_position, status, cluster_id)
- `keyword_clusters` ativos (id, name, intent, pillar_url) com count de keywords

**Bloco no system prompt:**
```text
## 🔑 Palavras-chave & SEO
- Top 10 keywords ativas: termo [intenção · vol · dif · pos]
- Clusters ativos: nome [intenção] → nº de keywords
- Status: alvo / rankeando / oportunidade / arquivada
```

**6 tools novas (admin only):**

| Tool | Função |
|---|---|
| `list_keywords(filter?)` | Lista keywords + clusters do cliente atual com id curto |
| `create_keyword(term, intent, search_volume?, difficulty?, cpc?, target_url?, cluster_id?, status?)` | Insere nova keyword vinculada ao client_id |
| `update_keyword(id, ...campos)` | Atualiza qualquer campo (posição, status, tags, vínculos task/campaign) |
| `create_keyword_cluster(name, intent?, pillar_url?, description?)` | Cria pillar/cluster |
| `record_keyword_ranking(keyword_id, position)` | Registra ponto histórico em `keyword_rankings` E atualiza `current_position` na keyword |
| `analyze_keyword_opportunities()` | Lê todas as keywords do cliente, cruza volume × dificuldade × posição atual e devolve recomendações priorizadas (quick wins, novos artigos, ads sugeridos, gaps) — usa o próprio modelo via mensagem de contexto, sem chamada extra à API |

Cada tool grava em `client_actions` automaticamente (já é o padrão do `executeTool`).

**Seção dedicada no system prompt:**
```text
## 🔑 Palavras-chave & SEO
- list_keywords: lê keywords + clusters do cliente
- create_keyword / update_keyword: gerencia termo, intenção, posição, vínculos
- create_keyword_cluster: agrupa em pillars de conteúdo
- record_keyword_ranking: registra histórico de posição (sparkline)
- analyze_keyword_opportunities: cruza volume × dificuldade × posição → quick wins
- NUNCA invente volume/dificuldade — peça ao admin importar de Semrush/Ahrefs/Keyword Planner
```

### Estrutura técnica resumida

**Arquivos editados (3):**
- `src/App.tsx` — 2 lazy imports + 2 rotas
- `src/layouts/AdminLayout.tsx` — 1 item de menu + import `KeyRound`
- `src/layouts/ClientLayout.tsx` — 1 item de menu + import `KeyRound`
- `supabase/functions/assistant-chat/index.ts` — 2 fetches, 1 bloco de contexto, 1 seção no prompt, 6 tools no `adminTools`, 6 cases no `executeTool`

**Sem mudanças de banco** — as 3 tabelas (`keywords`, `keyword_clusters`, `keyword_rankings`) já existem com RLS.

### Fora de escopo
- Tools DELETE de keyword/cluster (peço aprovação separada se quiser)
- Integração GSC/SerpAPI (próximo passo)
- Multi-select de keywords vinculadas em campanhas/tasks (também próximo passo)

