---
name: Linkouzinho keyword import from spreadsheets
description: Tool import_keywords_from_document do assistant-chat lê CSV/XLSX direto do storage para popular palavras-chave em massa, sem depender de RAG
type: feature
---

O Linkouzinho (admin) tem a ferramenta `import_keywords_from_document` que importa palavras-chave em massa a partir de planilhas (CSV, XLSX, XLS) já enviadas para os arquivos do cliente atual.

Pipeline:
1. Localiza arquivo por `file_id` (preferencial) ou `file_name` (busca aproximada).
2. Baixa do bucket `client-files`.
3. Parseia com `xlsx@0.18.5` — CSV detecta separador (`,` `;` `\t`), XLSX concatena todas as abas.
4. Detecta colunas tolerante a PT/EN (Keyword|Palavra-chave, Volume|Search Volume, SD|KD|Difficulty, CPC, Intent, URL).
5. Cria/reusa cluster opcional (`cluster_name` ou `cluster_id`).
6. Deduplica contra keywords já existentes (case-insensitive, normalizada).
7. Suporta `limit` (padrão 200, máx 500), `min_volume`, `default_intent`, `status`, `tags`.
8. Insere em lotes de 100 e devolve resumo (importados, duplicados, inválidos, top 5 por volume).

Não usa embeddings/RAG — funciona mesmo se o arquivo NÃO estiver indexado pelo `ingest-document`. Para extrair conteúdo textual de PDFs/decks use `search_documents` (RAG) com `index_client_files` antes se necessário.

`bulk_create_keywords` foi expandido de 50 para 200 itens, mas para planilhas a tool acima é a preferida (não precisa que o modelo gere o JSON manualmente).

Tools relacionadas (admin-only): `import_keywords_from_document`, `index_client_files`. Ambas bloqueadas no allowlist do mode=client.
