

## Vincular tarefas a projetos (criar/editar)

### Problema

No formulário de **criar/editar tarefa** (Admin → Tarefas), o campo `project_id` já existe no estado e no banco, mas **não há um seletor visível na UI**. Hoje, ao criar uma tarefa para um cliente, não dá para vinculá-la a um projeto específico — então a aba "Tarefas" do `ProjectDetailDialog` (que filtra por `project_id`) sempre aparece vazia, mesmo quando o cliente tem tarefas.

### Mudanças

**1. `src/pages/admin/Tasks.tsx` — adicionar seletor de Projeto**

- Adicionar uma nova query `useQuery(["client-projects-list", formData.client_id])` que busca os projetos do cliente selecionado:
  ```ts
  supabase.from("projects").select("id, name, status").eq("client_id", formData.client_id).order("created_at", { ascending: false })
  ```
  Habilitada somente quando `formData.client_id` estiver preenchido.
- Inserir um `<Select>` "Projeto (opcional)" logo abaixo do par Cliente / Tipo de Executor. Opções:
  - `"none"` → "Sem projeto" (default)
  - lista de projetos do cliente (mostrando nome + status entre parênteses se útil).
- Quando o usuário trocar o **cliente**, resetar `project_id` para `""` (mesma lógica usada hoje para `journey_phase`), pois o projeto antigo não pertence ao novo cliente.
- No `taskMutation`, manter o tratamento já existente: `project_id: data.project_id || null` (basta tratar `"none"` como `null`, igual ao `journey_phase`).
- Em `openEditDialog`, o `project_id` já é carregado — ok.
- Estado vazio: se o cliente não tiver projetos, mostrar item desabilitado "Nenhum projeto cadastrado para este cliente".

**2. (Opcional, mesmo arquivo) — Filtro topo "Projeto"**

Adicionar um terceiro filtro `projectFilter` ao lado dos filtros de Cliente e Fase, ativo apenas quando há um cliente selecionado, listando os projetos daquele cliente. Aplicar como `.eq("project_id", projectFilter)` na query de `admin-tasks`. Isso facilita auditar tarefas de um projeto específico direto na página de Tarefas, sem abrir o dialog de projeto.

**3. Sem alterações no banco**

- A coluna `tasks.project_id` já existe (vista no `Task` interface e no schema). Sem migração.

**4. Sem mudanças no painel do cliente**

- `CreateTaskDialog` (cliente) cria tarefas internas do dia-a-dia sem projeto — manter como está. Caso a Dra Regeane queira no futuro vincular suas próprias tarefas a um projeto, isso pode ser uma segunda iteração.

### Resultado esperado

- Ao criar/editar uma tarefa para a Dra Regeane (ou qualquer cliente), o admin pode escolher o projeto **"Escalabilidade e Qualificação"** (ou qualquer outro do cliente).
- A aba **Tarefas** dentro do `ProjectDetailDialog` passa a listar essas tarefas vinculadas (já está implementada, só faltava o link na origem).
- Os contadores de tarefas e o "Progresso de tarefas" no card de visão geral do projeto passam a refletir os números reais.
- Filtro opcional por projeto na página Admin → Tarefas, quando útil.

