

## Fases da jornada por serviço no formulário de Tarefas (Admin)

### Problema

Em `Admin → Tarefas`, ao criar/editar uma tarefa o seletor **"Fase da Jornada"** sempre mostra apenas as 4 fases legadas de Auditoria (Diagnóstico, Estruturação, Operação Guiada, Transferência). O mesmo acontece no filtro de fase no topo da página. Como agora cada cliente tem seu próprio fluxo (Auditoria, Gestão, Produção, Design, Site, WebApp), tarefas para a Dra Regeane (gestão) não conseguem ser vinculadas às fases reais — Onboarding/Setup/Otimização/Escala.

### Causa

`src/pages/admin/Tasks.tsx` lê `allPhases` e `journeyPhaseConfig` de `src/lib/task-config.ts`, que estão hard-coded no fluxo de auditoria. As fases corretas por serviço já existem em `src/lib/service-phases-config.ts` (`getPhasesByService(serviceType)`), mas não são usadas aqui.

### Mudanças

**1. `src/pages/admin/Tasks.tsx` — formulário (criar/editar tarefa)**
- Ampliar a query `clients-list` para trazer também `service_type`:
  ```ts
  .select("id, name, service_type")
  ```
- Calcular o serviço do cliente selecionado no formulário:
  ```ts
  const selectedClient = clients.find(c => c.id === formData.client_id);
  const selectedServiceType = (selectedClient?.service_type as ServiceType) || "auditoria";
  const phasesForForm = getPhasesByService(selectedServiceType);
  ```
- Trocar o `<Select>` de "Fase da Jornada" para iterar `phasesForForm` (usando `phase.value` e `phase.label`).
- Quando o usuário trocar o cliente, resetar `journey_phase` para `"none"` se a fase atual não pertencer ao novo serviço, evitando salvar uma fase incompatível.

**2. `src/pages/admin/Tasks.tsx` — filtro do topo "Todas as Fases"**
- Hoje filtra só pelas 4 fases de auditoria. Comportamento novo:
  - Se o filtro de cliente (`clientFilter`) estiver selecionado, mostrar as fases daquele cliente (`getPhasesByService(client.service_type)`).
  - Se for "Todos os Clientes", mostrar a união de todas as fases de todos os serviços (deduplicadas por `value`), com label do serviço entre parênteses quando houver colisão de label, para evitar ambiguidade.

**3. `src/components/admin/TasksKanban.tsx` (se aplicável)**
- Verificar/ajustar para também derivar fases por serviço quando agrupar tarefas por fase no Kanban admin (mesma lógica do filtro: por cliente quando filtrado, união quando "todos").

**4. Sem alterações no banco**
- A coluna `tasks.journey_phase` já é `text` livre, então aceita qualquer valor de fase de qualquer serviço.

**5. Lado cliente (`/cliente/tarefas`)**
- `src/pages/cliente/Tarefas.tsx` já agrupa por `journey_phase`, mas usa `journeyPhaseConfig` hard-coded de auditoria para labels/cores. Trocar para `getPhasesByService(clientInfo.service_type)` para que o cliente veja seus grupos com os nomes corretos do próprio serviço (Onboarding, Setup, etc.) — caso contrário tarefas com fase "onboarding" cairão num grupo "sem fase" ou sem label.

### Resultado esperado

- Criar/editar tarefa para a Dra Regeane (gestão) → o seletor "Fase da Jornada" mostra **Onboarding / Setup / Otimização / Escala**.
- Criar/editar tarefa para um cliente de auditoria → mantém **Diagnóstico / Estruturação / Op. Guiada / Transferência**.
- Filtro de fases do topo se adapta ao cliente selecionado.
- Painel do cliente agrupa tarefas pelas fases corretas do seu serviço.

