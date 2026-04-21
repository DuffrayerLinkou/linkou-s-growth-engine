

## Linkouzinho ganha autonomia total sobre Projetos + verificação de consistência por papel

Hoje o Linkouzinho admin já tem `create_project`, mas só isso — não consegue atualizar status, mover datas/budget, vincular tarefas/campanhas, registrar aprendizados nem listar/buscar projetos pra agir em cima deles. Vou destravar o controle completo da nova seção de Projetos e validar que o que ele faz aparece corretamente para admin, account_manager e cliente (ponto focal / manager / operador).

### 1. Novas tools no `assistant-chat` (admin only)

Adicionar à lista `adminTools` em `supabase/functions/assistant-chat/index.ts`:

| Tool | O que faz |
|---|---|
| `list_projects` | Lista projetos do cliente atual (id curto, nome, status, datas, budget) para o bot referenciar nas próximas tools |
| `update_project` | Atualiza nome, descrição (hipótese), datas, budget, status (`planning`/`active`/`paused`/`completed`) |
| `link_task_to_project` | Define `project_id` de uma task existente (recebe `task_id` + `project_id`) |
| `link_campaign_to_project` | Define `project_id` de uma campaign existente |
| `create_learning` | Insere em `learnings` (title, description, impact, category, tags[]) já vinculado ao `project_id` e `client_id`. Status `approved_by_ponto_focal=false` |
| `update_learning` | Edita um aprendizado (campos texto + tags). Não toca em `approved_by_ponto_focal` (só ponto focal aprova via UI) |

Estendo `create_project` para também aceitar `description` rotulada como "hipótese/objetivo" (já aceita, só reforço no prompt).

### 2. Contexto enriquecido no system prompt

Hoje o prompt carrega 17 fontes em paralelo, mas **não traz projetos nem learnings**. Vou adicionar 2 fetches paralelos no `Promise.all`:

- `projects` do cliente (id, name, status, start_date, end_date, budget, description) — últimos 10
- `learnings` do cliente últimas 8 (title, impact, category, project_id, approved_by_ponto_focal)

E renderizar dois novos blocos no contexto:
```text
## 📦 Projetos Ativos
- `abc12345` [active] Lançamento Q2 — R$15.000 (01/04 → 30/06)
   └ tarefas vinculadas: 8 (3 concluídas)
   └ campanhas vinculadas: 4

## 🎓 Aprendizados Recentes
- (12/04) [hipótese/oferta] **CTA "Quero falar com humano" gerou +32% CTR** ✅ aprovado
```

Isso permite o bot referenciar projetos por id curto em todas as tools novas e raciocinar com a "memória do que já foi aprendido" naquela conta.

### 3. Atualização do system prompt admin

Adicionar uma seção dedicada:
```text
## 📦 Projetos & Aprendizados
- list_projects / update_project: ondas de execução (hipótese, escopo, status, budget)
- link_task_to_project / link_campaign_to_project: amarra entrega a uma onda
- create_learning: registra hipótese validada (impacto + categoria + tags)
- update_learning: edita texto/tags. NUNCA marque como aprovado — só o Ponto Focal pela UI.
```

### 4. Verificação de consistência (objetivo "as mudanças foram consistentes para todos os usuários")

Como tudo passa pelas mesmas tabelas (`projects`, `tasks`, `campaigns`, `learnings`) que JÁ são lidas pela nova UI de `/admin/projetos` e respeitam RLS, qualquer mudança feita pelo bot via service role aparece automaticamente para:

- **Admin / Account Manager** — full access via RLS existente; verão na grade de cards e em todas as 4 abas do `ProjectDetailDialog`
- **Cliente (Manager / Ponto Focal / Operador)** — em `/cliente/tarefas`, `/cliente/campanhas` e nos drill-downs do plano; a tabela `learnings` já tem RLS que mostra para o cliente os registros do próprio `client_id`

Para garantir que isto realmente funciona, vou:

1. **Auditar a RLS de `learnings`** com SQL `SELECT polname, polcmd, polqual FROM pg_policy WHERE polrelid='public.learnings'::regclass` e, se NÃO existir uma policy SELECT para o cliente daquele `client_id`, criar via migração:
   ```sql
   CREATE POLICY "Client users view own learnings"
     ON public.learnings FOR SELECT
     USING (client_id = get_user_client_id(auth.uid()));
   ```
2. **Verificar que `projects` tem SELECT para o cliente daquele client_id** (a aba Projetos do cliente, se vier no futuro, e o `ProjectDetailDialog` que admin abre carrega via service role do bot mas o cliente lê direto). Se faltar, adicionar policy idêntica.
3. Confirmar que o log em `client_actions` (já automático após cada tool) vai registrar `update_project`, `create_learning`, etc. — assim aparece no card "⚡ Últimas Ações Executadas" e fica auditável.

### 5. Estrutura técnica resumida

**Arquivo editado**
- `supabase/functions/assistant-chat/index.ts` — adicionar 6 tools, 2 fetches no Promise.all, 2 blocos de contexto, seção no system prompt, 6 cases no `executeTool`

**Migração SQL (somente se a auditoria mostrar policies faltando)**
- Policies SELECT em `learnings` e/ou `projects` para clientes do mesmo `client_id`

**Sem mudança de UI** — a página `/admin/projetos` revamp já consome `projects`/`tasks`/`campaigns`/`learnings`/`files` por `project_id`, então tudo que o bot fizer aparecerá na grade e nas 4 abas do detalhe automaticamente.

### Fora de escopo (próximo passo se quiser)
- Tools de DELETE de projeto/learning (mais arriscado, peço aprovação separada)
- Tool de aprovação de learning (proibido por design — fica com o Ponto Focal via UI)
- Linkouzinho do cliente com tools de projeto (manter cliente só com `request_creative_demand`)

