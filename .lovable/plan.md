

## Tela branca ao abrir "Plano" no Onboarding — diagnóstico + correção defensiva

### Cenário atual

- Você relatou **tela branca** ao clicar em **Ver / Editar** na aba **Plano** do Onboarding (admin).
- Não há logs de erro de runtime capturados, e o banco hoje está com **0 planos** (`strategic_plans` vazio).
- Sem o erro exato, vou aplicar **dois passes**: ativar instrumentação para capturar o crash + blindar os pontos mais prováveis de quebra com base nas mudanças recentes.

### O que vou fazer

**1. Capturar o erro real (instrumentação leve)**

- Envolver a aba **Plano** (`PlanningTab`) em um **ErrorBoundary** local que mostra a mensagem do erro em vez de tela branca, com botão "Recarregar".
- Esse boundary já vai destravar a navegação e revelar a causa raiz na próxima tentativa, sem precisar abrir DevTools.

**2. Blindar `normalizeFromDB` (suspeito principal)**

A função que prepara o plano para os diálogos Ver/Editar foi atualizada recentemente para o funil JSONB, mas ainda tem pontos onde um valor inesperado (string, null, número) pode crashar:

- `plan.diagnostic`, `plan.execution_plan`, `plan.budget_allocation`: hoje assume objeto. Vou aplicar o mesmo padrão defensivo do `funnel_strategy` (parse se string, fallback para default se inválido).
- `plan.objectives`/`plan.kpis`/`plan.personas`: já tratam array vs `.list`, mas não tratam `null` profundo nem itens não-string em `.list.map`.
- Defaults garantidos para todos os campos do `PlanForm` mesmo quando o registro do DB vier incompleto (planos antigos pré-migração).

**3. Blindar a renderização**

- `ClientPlanTab.tsx` e `PlanoEstrategico.tsx` (cliente): mesmo helper defensivo aplicado a `diagnostic`, `execution_plan`, `budget_allocation` (hoje só `funnel_strategy` está protegido).
- Diálogo de visualização (`viewingPlan`) no `PlanningTab`: garantir que `statusConfig[plan.status]` nunca seja `undefined` (status fora do mapa hoje quebra `.color` / `.label`).

**4. Verificar PDF generator**

- `generateStrategicPlanPDF` é chamado tanto no Ver quanto no botão PDF. Vou confirmar que ele aceita um plano com campos `null` sem crashar (passe rápido pelo `drawFunnel`, `drawDiagnostic`, etc. com guards).

### Arquivos a modificar

- `src/components/admin/onboarding/PlanningTab.tsx` — ErrorBoundary local + `normalizeFromDB` defensivo + guards no diálogo Ver
- `src/components/admin/client-detail/ClientPlanTab.tsx` — parse defensivo nas demais seções
- `src/pages/cliente/PlanoEstrategico.tsx` — mesmo tratamento
- `src/lib/pdf-generator.ts` — guards nos `draw*` que dependem de objetos
- `src/components/ErrorBoundary.tsx` (novo, pequeno e reutilizável)

### Sem mudanças

- Banco de dados (schema OK após a migração anterior do `funnel_strategy`).
- Layout/estilo dos cards.
- Lógica de salvamento (`saveMutation`).

### Resultado esperado

- Se o erro persistir após o fix defensivo, a tela mostrará a mensagem real (ex: "Cannot read properties of null") em vez de ficar branca, e eu corrijo na sequência sem precisar do console.
- Em 90% dos casos de tela branca causados por dados inesperados, o passe defensivo já resolve.

### Próximo passo

Aprove para eu executar. Após aplicar, abra novamente Onboarding → aba Plano → clique em Novo Plano (ou Ver/Editar se aparecer). Se ainda houver tela vermelha do boundary, me mande a mensagem que aparecer.

