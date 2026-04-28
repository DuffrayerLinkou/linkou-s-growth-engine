# Linkouzinho: importar palavras-chave de planilhas do cliente

## Diagnóstico

Hoje o assistente já tem ferramentas de SEO (`list_keywords`, `create_keyword_cluster`, `bulk_create_keywords`, `analyze_keyword_opportunities`) e busca em documentos (`search_documents` via embeddings). Porém o pedido na Dra. Regeane falha por 3 motivos:

1. **As planilhas dela existem mas não foram indexadas.** Os 3 CSVs do Ubersuggest (`ubersuggest_aposentadoria_servidor_público.csv`, `ubersuggest_Integralidade_e_paridade.csv`, `ubersuggest_Geral_-_Concorrentes.csv`) estão na tabela `files` com 0 chunks e sem permissão `can_be_used_by_ai`. O `search_documents` retorna vazio.
2. **Não existe botão "Tornar pesquisável" no admin.** Esse fluxo só está em `/cliente/arquivos`. Admin que quiser preparar dados precisa hoje logar como cliente — fricção que faz parecer que o bot "trava".
3. **`bulk_create_keywords` está capada em 50 itens** e o assistente precisa montar manualmente o JSON item-a-item. Uma planilha Ubersuggest tem 200–800 termos com colunas estruturadas (Keyword, Volume, SD/Difficulty, CPC) — o ping-pong de chamadas explode tokens e às vezes o modelo retorna `MALFORMED_FUNCTION_CALL`.

## O que vai mudar

### 1. Indexação de arquivos no admin
- Adicionar na página admin de arquivos do cliente (componente que lista os files do cliente no `/admin/clientes/:id`) o mesmo botão "🧠 Tornar pesquisável pelo Linkouzinho" que existe em `/cliente/arquivos`. Reaproveita a Edge Function `ingest-document` que já suporta CSV e XLSX.
- Adicionar uma ferramenta nova no assistente: `index_client_files` — lista arquivos não indexados do cliente atual e dispara `ingest-document` para os escolhidos (ou todos os CSV/XLSX/PDF). Assim o admin pode pedir "indexa as planilhas da Dra. Regeane" e o bot resolve sozinho antes de ler.

### 2. Nova ferramenta `import_keywords_from_document`
Ferramenta de alto nível, admin-only, que faz o pipeline inteiro em uma chamada:

- Recebe: `file_id` (ou `file_name` para fuzzy match nos arquivos do cliente atual), `cluster_name` (opcional — cria/usa cluster), `default_intent`, `status`, `tags`, `limit` (default 200, máx 500), `min_volume` (filtro opcional).
- Faz download direto do storage (sem depender de embeddings/RAG, que são lossy para tabelas).
- Detecta o formato (CSV, XLSX, XLS) e parseia com `xlsx@0.18.5` (já usado em `ingest-document`).
- Mapeia colunas de forma tolerante: `keyword|term|palavra|palavra-chave` → term; `volume|search volume|volume de busca` → search_volume; `sd|kd|difficulty|dificuldade` → difficulty; `cpc` → cpc; `intent|intenção` → intent.
- Deduplica contra keywords já existentes (case-insensitive) do cliente — não recria.
- Cria/reusa cluster se `cluster_name` foi passado.
- Insere em lote único (`db.from("keywords").insert([...])`) — sem o limite de 50.
- Retorna resumo: `X termos importados, Y duplicados ignorados, Z linhas sem term válido. Cluster: <nome>. Top 5 por volume: ...`.

### 3. Aumentar `bulk_create_keywords` para 200
Sobe o teto de 50 → 200 e ajusta a descrição. Útil quando o admin dita uma lista textual ou quando o conteúdo veio de `search_documents`.

### 4. Atualizar o system prompt do assistente (admin)
Adicionar bloco no prompt orientando o fluxo correto para SEO baseado em planilhas:

> "Quando o admin pedir para preencher palavras-chave a partir de uma planilha/arquivo:
> 1. `list_files` no cliente atual para localizar a planilha pelo nome.
> 2. Se for CSV/XLSX, prefira `import_keywords_from_document` (lê a planilha estruturada direto, sem RAG).
> 3. Use `search_documents` apenas quando precisar de contexto textual (briefing, manual), não para extrair tabelas.
> 4. Sempre confirme o cluster/intent antes de importar listas grandes (>100 termos)."

### 5. Documentação
Atualizar `mem://features/linkouzinho-operational-memory` (ou criar `mem://features/linkouzinho-keyword-import`) com o novo fluxo e exemplos.

## Arquivos a modificar

- `supabase/functions/assistant-chat/index.ts` — novas tools `import_keywords_from_document` e `index_client_files`, limite de `bulk_create_keywords` para 200, prompt atualizado, registro nos arrays de tools admin.
- `supabase/functions/ingest-document/index.ts` — sem mudança (já suporta CSV/XLSX). Apenas reutilizado.
- `src/pages/admin/Arquivos.tsx` (ou componente equivalente que lista files do cliente no admin) — botão "🧠 Tornar pesquisável" reaproveitando a chamada já feita em `src/pages/cliente/Arquivos.tsx`.
- `mem://features/linkouzinho-operational-memory.md` — registrar nova capacidade.

## Resultado esperado para a Dra. Regeane

Você poderá pedir no chat do Linkouzinho (com a Dra. Regeane como cliente atual):

> "Indexa as 3 planilhas do Ubersuggest e cadastra todas as keywords no cluster 'Aposentadoria Servidor Público', intent informacional, status target."

E ele vai: localizar os 3 CSVs → indexar (background) → criar o cluster → importar todos os termos com volume/dificuldade/CPC já preenchidos a partir das colunas do Ubersuggest → responder com "X termos importados em Y segundos, top 5 por volume: …".

## Não-objetivos

- Não vou alterar o esquema do banco (todas as colunas necessárias já existem em `keywords` e `keyword_clusters`).
- Não vou trocar o provider de embeddings nem o RPC `match_document_chunks`.
- Não vou expor `import_keywords_from_document` para clientes — só admin/account_manager.
