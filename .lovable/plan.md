

## Refletir o serviço do cliente na aba "Jornada" do Admin

### Problema

Na aba **Jornada** do painel admin do cliente (rota `/admin/clientes/:id`), o stepper visual e o histórico de fases estão **fixos no fluxo de Auditoria** (Diagnóstico → Estruturação → Op. Guiada → Transferência), independente do serviço do cliente.

Por isso a Dra Regeane — agora `service_type = gestao`, `phase = onboarding` — aparece com o stepper de Auditoria e nenhuma das 4 bolinhas fica destacada (porque "onboarding" não existe no fluxo de Auditoria). O diálogo "Alterar Fase" até oferece as fases corretas de Gestão, mas o stepper de fundo nunca atualiza.

### Causa raiz

Em `src/pages/admin/ClientDetail.tsx`:

1. `<JourneyStepper currentPhase={client.phase} />` é chamado **sem** `serviceType`, então cai no default `"auditoria"`.
2. Os badges do "Histórico de Alterações" usam `getPhaseLabel(...)`, que também é hard-coded para auditoria.
3. O toast de sucesso ao trocar de fase usa o mesmo helper antigo.

### Mudanças (somente `src/pages/admin/ClientDetail.tsx`)

1. Trocar o import:
   ```ts
   import { JourneyStepper, Phase, getPhaseLabelForService } from "@/components/journey/JourneyStepper";
   ```
   (remover `getPhaseLabel` e `getAllPhases` que não serão mais usados)

2. Calcular o serviço atual logo antes do render da aba:
   ```ts
   const currentServiceType = (client.service_type as ServiceType) || "auditoria";
   ```

3. Passar `serviceType` ao stepper:
   ```tsx
   <JourneyStepper currentPhase={client.phase} serviceType={currentServiceType} />
   ```

4. Substituir os dois `getPhaseLabel(fromPhase)` / `getPhaseLabel(toPhase)` no histórico por `getPhaseLabelForService(fromPhase, currentServiceType)` e idem para `toPhase`.

5. Substituir o `getPhaseLabel(toPhase)` do toast em `handleChangePhase` por `getPhaseLabelForService(toPhase, currentServiceType)`.

### Resultado esperado

- A aba **Jornada** da Dra Regeane vai mostrar **Onboarding → Setup → Otimização → Escala** com o passo "Onboarding" destacado.
- O botão **Alterar Fase** continua oferecendo as 4 fases de Gestão (já estava correto).
- O **Histórico de Alterações** mostra os labels corretos do serviço atual.
- Zero impacto em outros clientes (auditoria continua funcionando porque `currentServiceType` cai no default quando `service_type` é nulo).

### Observação

Nenhuma migração de banco é necessária — o problema é só de UI no admin. As fases de Gestão já estão salvas corretamente para a Dra Regeane.

