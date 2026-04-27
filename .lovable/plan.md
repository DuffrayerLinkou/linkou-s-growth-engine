# Linkouzinho: planilhas/apresentações + controle total de Palavras-Chave

## O que vai mudar (visão do usuário)

**1. Linkouzinho lê planilhas e apresentações dos clientes**
Hoje o bot já indexa PDF, DOCX, TXT, MD, CSV, JSON, HTML. Vai passar a indexar também **XLSX/XLS** (Excel) e **PPTX** (PowerPoint) — os dois formatos que mais aparecem nos arquivos dos clientes (planilhas de métricas, relatórios, decks de planejamento).

Na página `/cliente/arquivos` (e na visão admin equivalente), o botão "🧠 Tornar pesquisável pelo Linkouzinho" passa a aparecer para esses dois formatos novos.

**2. Linkouzinho ganha controle total da seção Palavras-Chave**
O bot vai poder, a pedido do usuário em linguagem natural:
- **Listar/buscar** keywords do cliente (com filtros: status, intent, cluster, faixa de volume, faixa de dificuldade, posição atual)
- **Criar** keywords novas (uma ou em lote)
- **Atualizar** keywords existentes (status, intent, posição, URL alvo, cluster, tags, notas)
- **Arquivar/excluir** keywords
- **Criar/editar clusters** (pilares de conteúdo)
- **Registrar rankings** (snapshot de posição numa data)
- **Analisar e gerar insights**: identificar oportunidades (alto volume + baixa dificuldade), quick-wins (posição 11–20 que dá pra empurrar pro top 10), keywords em queda, gaps de cluster, canibalizações (duas keywords mirando a mesma URL), distribuição de intent

Tudo respeitando RLS: cliente só mexe nas próprias, admin/account_manager mexe em qualquer um.

## Como vai funcionar

### Parte 1 — XLSX e PPTX no RAG

Estender `supabase/functions/ingest-document/index.ts`:

- **XLSX/XLS**: usar `xlsx` (SheetJS) via esm.sh. Para cada aba, converter pra texto formatado: `### Aba: <nome>` seguido das linhas como TSV (`coluna1\tcoluna2\t...`). Limita a 5000 linhas por aba pra não estourar embedding. Mantém cabeçalho legível pro modelo entender o que é cada coluna.
- **PPTX**: usar `jszip` (PPTX é um zip de XMLs) e extrair texto de `ppt/slides/slide*.xml` com regex simples em `<a:t>...</a:t>`. Cada slide vira um bloco `### Slide N: <título>\n<conteúdo>`.

Frontend (`src/pages/cliente/Arquivos.tsx` e onde mais for necessário): adicionar `xlsx`, `xls`, `pptx` na lista de formatos indexáveis (`isIndexable`).

Sem migration nesta parte — a tabela `document_chunks` já guarda texto puro.

### Parte 2 — Keywords no Linkouzinho

**Tools novas no `supabase/functions/assistant-chat/index.ts`** (todas com `client_id` resolvido pelo `current_client_id` da conversa, e gravando em `client_actions`):

| Tool | O que faz |
|---|---|
| `list_keywords` | Lista com filtros (status, intent, cluster_id, min_volume, max_difficulty, position_range, search_term). Retorna até 100. |
| `get_keyword` | Detalhe + histórico de rankings de uma keyword. |
| `create_keyword` | Cria 1 keyword. Campos: term (obrigatório), intent, search_volume, difficulty, cpc, target_url, cluster_id, status, tags, notes. |
| `bulk_create_keywords` | Cria várias de uma vez (até 50). |
| `update_keyword` | Atualiza campos de uma keyword. |
| `delete_keyword` | Remove (ou arquiva, conforme `mode`). |
| `list_clusters` | Lista clusters do cliente. |
| `create_cluster` | Cria cluster (name, description, intent, pillar_url). |
| `update_cluster` | Atualiza cluster. |
| `record_ranking` | Insere snapshot em `keyword_rankings` (keyword_id, position, source, notes). |
| `analyze_keywords` | Roda análise agregada e devolve insights estruturados: top oportunidades, quick-wins, em queda, canibalizações, distribuição de intent, gaps de cluster. Pode opcionalmente gravar como `insight` na tabela `insights` se `save_as_insight: true`. |

**System prompt do bot** (admin e cliente): adicionar bloco "🔑 Palavras-Chave do cliente" com resumo (total, top 10, oportunidades, distribuição de intent, últimas 5 mexidas em `client_actions` com `action_type` começando em `keyword_`). Carregado em paralelo com os outros 15 contextos já existentes.

**Permissões**: as tools usam o JWT do usuário (cliente do bot vê/mexe só nas próprias keywords; admin/AM mexe em qualquer cliente alvo). Já está coberto pelas RLS existentes em `keywords`, `keyword_clusters`, `keyword_rankings`.

**Sem migration** — schema de keywords já está completo.

### Parte 3 — Análise de oportunidades (lógica do `analyze_keywords`)

Uma única consulta agregada no banco (rápida) classifica cada keyword em buckets:
- **Oportunidade**: `search_volume >= 500` AND `difficulty < 40` AND (`current_position` NULL OR > 20)
- **Quick-win**: `current_position` BETWEEN 11 AND 20 AND `search_volume >= 100`
- **Em queda**: comparar última posição com a média das 3 anteriores em `keyword_rankings` — queda de 5+ posições
- **Canibalização**: agrupar por `target_url` onde aparecem 2+ keywords com mesma intent
- **Gap de cluster**: clusters com menos de 3 keywords ativas

Retorna JSON estruturado pro bot interpretar e responder em linguagem natural no mesmo turno.

## Arquivos afetados

- `supabase/functions/ingest-document/index.ts` — adicionar branches XLSX e PPTX
- `supabase/functions/assistant-chat/index.ts` — adicionar 11 tools de keywords + bloco de contexto no system prompt
- `src/pages/cliente/Arquivos.tsx` — incluir xlsx/xls/pptx nos formatos indexáveis
- `.lovable/memory/features/linkouzinho-operational-memory.md` — registrar Sprint 4

## Fora do escopo

- UI nova (a seção `/cliente/keywords` e `/admin/keywords` já existem e continuam idênticas — o bot só passa a operar via chat)
- Integração com Google Search Console (pode ficar pra depois, como combinado)
- OCR em PDFs escaneados ou imagens dentro de PPTX
- Coleta automática de volume/dificuldade via API externa (DataForSEO, etc.)

## Sem alterações em

RLS, layout, identidade visual, rotas, permissões existentes, regras de negócio das outras seções.