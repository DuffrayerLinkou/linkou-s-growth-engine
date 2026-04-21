

## Onde encaixar Gestão de Palavras-chave (SEO Keywords)

### Minha sugestão: módulo próprio "Palavras-chave" por cliente

**Não recomendo enfiar em Plano nem em Campanha.** Cada um tem propósito errado pra isso:

- **Plano estratégico** = visão macro (objetivos, KPIs, personas, funil, budget). Encher de keywords vira ruído.
- **Campanha** = execução de ads (Meta/Google/TikTok). Keywords serve só pra Google Ads, não cobre SEO orgânico, conteúdo, blog, YouTube.

Keywords é um **ativo transversal do cliente**: alimenta SEO orgânico, Google Ads, YouTube, conteúdo do blog, posts de Instagram, scripts de vídeo. Precisa ter **vida própria** com histórico de ranking, dificuldade, intenção de busca e relacionamentos. Por isso → módulo dedicado.

### O que entrega (visão de especialista em SEO)

**Página `/admin/keywords` (admin) + `/cliente/keywords` (cliente, leitura)**

**1. Header com KPIs reais**
- Total de keywords monitoradas · Top 10 (rankeando 1-10 no Google) · Volume de busca total · Oportunidades (alto volume + baixa concorrência)

**2. Grade/tabela rica de keywords**
Por keyword:
- Termo + intenção (informacional / navegacional / transacional / comercial)
- Volume mensal de busca (manual ou import)
- Dificuldade SEO (0-100)
- CPC estimado (Google Ads)
- Posição atual + posição histórica (mini-sparkline)
- URL alvo no site do cliente
- Cluster/grupo (ex: "fundo de funil cursos online")
- Status (alvo / rankeando / oportunidade / arquivada)
- Tags livres (BR-only, mobile, local, etc)

**3. Clusters de keywords (agrupamento)**
Cada cluster = um pillar de conteúdo. Ex: "consultoria de tráfego" agrupa 12 keywords correlatas → orienta criação de 1 artigo pillar + 12 satélites.

**4. Análise de concorrentes**
Lista de concorrentes (já existe no `briefings` e `strategic_plans.diagnostic.competitors`) — para cada keyword, registrar posição dos top 3 concorrentes.

**5. Recomendações geradas por IA (Linkouzinho)**
Botão "Analisar oportunidades" → IA olha keywords + clusters + concorrentes e sugere:
- Quais merecem virar artigo de blog
- Quais merecem campanha Google Ads (alto comercial + baixo orgânico)
- Quais já rankeam mas estão na pos 11-20 (quick wins, otimizar)
- Gaps vs concorrentes

**6. Vínculos opcionais** (não obriga)
- `keyword.campaign_id` opcional → liga keyword a campanha Google Ads ativa
- `keyword.task_id` opcional → liga keyword a task de produção de conteúdo
- `keyword.cluster_id` → agrupa em pillar

### Estrutura técnica

**Migrações novas (3 tabelas)**

```sql
-- Clusters/pillares de conteúdo
CREATE TABLE public.keyword_clusters (
  id uuid PK, client_id uuid NOT NULL,
  name text NOT NULL, pillar_url text, intent text,
  description text, created_at, updated_at
);

-- Keywords
CREATE TABLE public.keywords (
  id uuid PK, client_id uuid NOT NULL,
  cluster_id uuid NULL, term text NOT NULL,
  intent text, -- informational/navigational/transactional/commercial
  search_volume int, difficulty int, cpc numeric,
  current_position int, target_url text, status text DEFAULT 'target',
  -- target/ranking/opportunity/archived
  tags text[] DEFAULT '{}',
  campaign_id uuid NULL, task_id uuid NULL,
  notes text, created_at, updated_at, created_by
);

-- Histórico de posição (sparkline + evolução)
CREATE TABLE public.keyword_rankings (
  id uuid PK, keyword_id uuid NOT NULL,
  client_id uuid NOT NULL, position int NOT NULL,
  checked_at timestamptz DEFAULT now(),
  source text DEFAULT 'manual' -- manual/serpapi/gsc futuro
);
```

**RLS padrão** (admin/account_manager FULL · cliente SELECT do próprio `client_id`).

**Páginas/componentes novos**
- `src/pages/admin/Keywords.tsx` — grade + filtros + KPIs + import CSV
- `src/pages/cliente/Keywords.tsx` — leitura
- `src/components/admin/keywords/KeywordTable.tsx` (tabela com sparkline + edição inline)
- `src/components/admin/keywords/KeywordDetailDialog.tsx` (histórico de ranking + vínculos)
- `src/components/admin/keywords/ClusterCard.tsx` (cluster como card com keywords dentro)
- `src/components/admin/keywords/ImportKeywordsDialog.tsx` (cola CSV ou colunas Volume/Dificuldade/CPC vindas de Semrush/Ahrefs/Ubersuggest/Keyword Planner)

**Rota + menu**
- `/admin/keywords` em `App.tsx` + item "Palavras-chave" (ícone `Search` ou `KeyRound`) em `AdminLayout.tsx`
- `/cliente/keywords` + item no `ClientLayout.tsx`

**Linkouzinho — novas tools admin** (autonomia total, padrão dos outros módulos)
- `list_keywords(filter?)` — lê keywords + clusters do cliente atual
- `create_keyword(term, intent, volume, difficulty, target_url, cluster_id?)`
- `update_keyword(id, ...)` — posição, status, tags, vínculos
- `create_keyword_cluster(name, pillar_url, intent)`
- `record_keyword_ranking(keyword_id, position)` — registra ponto histórico
- `analyze_keyword_opportunities()` — IA cruza volume × dificuldade × posição atual e devolve recomendações priorizadas

E adicionar bloco no system prompt:
```text
## 🔑 Palavras-chave & SEO
- Top 10 keywords ativas: termo [intenção · vol · dif · pos]
- Clusters ativos: nome → nº de keywords
```

**Conexões com o que já existe**
- Plano estratégico ganha menção "ver clusters de keywords →" linkando pra `/admin/keywords?client=X`
- Campanha Google Ads ganha campo opcional "keywords vinculadas" (multi-select de keywords do cliente)
- Tarefas de conteúdo (categoria `criativo`/`conteudo`) ganham campo opcional "keyword alvo"

### Integração futura (fora de escopo agora, mas a arquitetura prepara)
- **Google Search Console API** → puxar posição real e impressões automaticamente
- **SerpAPI / DataForSEO** → atualização automática de ranking
- **Geração de brief de artigo via IA** a partir do cluster (título + H2s + entities + perguntas relacionadas)

### O que NÃO faço agora (pra entregar enxuto)
- Integrações pagas (GSC/SerpAPI) — ficam plugáveis depois
- Geração automática de artigos — depois
- Auditoria técnica de SEO da página (Core Web Vitals já tem em `PerformanceTab` da landing) — fica separado

### Resumo da resposta à sua pergunta

> "Em plano ou campanha?"

**Em nenhum dos dois.** Crie o módulo **Palavras-chave** como cidadão de primeira classe ao lado de Projetos / Campanhas / Plano — porque keywords alimenta múltiplas frentes (SEO, Ads, conteúdo, vídeo) e tem ciclo de vida próprio (volume, dificuldade, posição evolutiva). Plano e Campanha **referenciam** keywords via vínculo opcional, mas não são donos delas.

