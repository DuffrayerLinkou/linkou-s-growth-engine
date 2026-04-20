

## Expandir Linkouzinho: Acesso a Tarefas + Leitura de PDFs/Arquivos

### Resposta direta às perguntas

**1. PDFs?** ❌ Hoje **não lê**. Precisa ser adicionado.
**2. Tarefas dos clientes?** ❌ Hoje **não vê**. O contexto tem cliente, briefing, plano, métricas e campanhas — mas **nenhuma tarefa**. Precisa ser adicionado.

---

### Mudanças propostas

#### Parte 1 — Adicionar contexto de tarefas (ganho imediato, custo zero)

No `assistant-chat/index.ts`, adicionar **2 novas queries paralelas** ao bloco `Promise.all`:

```text
tasks         → últimas 20 tarefas (open + done recentes)
                campos: title, status, priority, due_date,
                executor_type, journey_phase, description (200 chars),
                execution_guide (300 chars), assigned_to
files         → últimos 15 arquivos do cliente
                campos: name, file_type, category, description, task_id,
                created_at
```

Renderizar no contexto do system prompt como:

```text
## Tarefas Ativas (8 abertas / 12 concluídas no último mês)
| Status | Prioridade | Título | Prazo | Executor |
|---|---|---|---|---|
| todo | high | Otimizar campanha Meta CBO | 2026-04-25 | internal |
| in_progress | medium | Validar criativo carrossel | — | client |
...

## Arquivos do Cliente (últimos 15)
- briefing-marca.pdf (briefing) — anexo da tarefa "Kickoff"
- plano-midia-q2.xlsx (planning) — 2026-04-15
- ...
```

**Impacto**: o Linkouzinho passa a saber se há tarefas paradas, gargalos de execução, qual o foco operacional, e referenciar arquivos por nome.

#### Parte 2 — Nova tool `read_file` (leitura sob demanda de PDFs/docs)

Adicionar tool ao `adminTools`:

```text
read_file
  params: file_id (uuid) | file_name (string)
  ação: baixa do bucket Supabase Storage 'client-files',
        extrai texto e retorna ao modelo (máx ~8k caracteres).
```

**Implementação técnica do executor:**
1. Busca `files` por `id` ou `name` (escopado ao `client_id`)
2. `db.storage.from('client-files').download(file_path)` 
3. Detecta tipo via `mime_type`:
   - **PDF** → `pdf-parse` via esm.sh (`https://esm.sh/pdf-parse@1.1.1`)
   - **TXT/MD/CSV/JSON** → leitura direta como texto
   - **DOCX/XLSX** → mensagem "formato não suportado, peça conversão para PDF"
   - **Imagem** → mensagem "use OCR via outra ferramenta"
4. Trunca a 8.000 caracteres com aviso `[...truncado]`
5. Retorna `{ success, file_name, content }` para o segundo passo do tool calling

**Quando usar (instrução no prompt):**
> Use `read_file` apenas quando o usuário pedir explicitamente para "analisar", "ler", "resumir" um arquivo OU quando for essencial para responder. Nunca dispare automaticamente — leitura consome tokens.

#### Parte 3 — Sugestões no frontend

Em `LinkouzinhoInternal.tsx`, atualizar `ADMIN_SUGGESTIONS`:

```text
+ "Tarefas paradas do cliente"
+ "Resumir último briefing PDF"
+ "Próximas entregas da semana"
```

---

### Como o Linkouzinho usa isso (exemplos)

| Pergunta | Comportamento novo |
|---|---|
| "O que tá travado nesse cliente?" | **AUDITOR** lê tabela de tarefas, identifica 3 em atraso, aponta gargalo |
| "Resume o briefing PDF que eu subi" | **EXECUTOR** chama `read_file`, retorna síntese estruturada |
| "Cria tarefa para revisar o plano de mídia" | **EXECUTOR** já tinha; agora também referencia o arquivo `plano-midia-q2.xlsx` |
| "Próximos passos da semana" | **ESTRATEGISTA** cruza tarefas com prazo + plano estratégico |

---

### Detalhes técnicos

| Item | Decisão |
|---|---|
| Bucket | `client-files` (já existe, privado) |
| Acesso | Service role no edge function (já usado) |
| Limite de leitura | 8.000 caracteres por chamada (proteção de tokens) |
| Limite de tarefas no contexto | 20 (10 abertas + 10 recentes) |
| Limite de arquivos no contexto | 15 (lista de nomes, não conteúdo) |
| Biblioteca PDF | `pdf-parse` via esm.sh (Deno-compatível) |
| Custo extra do contexto | ~+1k tokens por chamada (aceitável) |
| Custo de `read_file` | só dispara quando solicitado |

---

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | + 2 queries paralelas (tasks, files); + render no contexto; + tool `read_file` + executor com pdf-parse |
| `src/components/LinkouzinhoInternal.tsx` | + 3 novas sugestões admin |

### Sem mudanças
- Banco de dados, RLS, storage policies, frontend de upload, modo cliente.

