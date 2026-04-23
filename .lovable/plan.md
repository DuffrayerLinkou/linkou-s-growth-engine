

## Atualizar a jornada da Dra Regeane para Gestão de Tráfego

### Estado atual no banco

- **Cliente**: Dra Regeane (`640b69d9-632e-4634-a09f-9c26f0b8c648`)
- **Serviço atual**: `auditoria` (default aplicado pela migração)
- **Fase atual**: `estruturacao`
- **Datas**: todas vazias (8 colunas legadas vazias, `phase_dates` é objeto com chaves vazias)
- **Autonomia**: `false`

Não há histórico de datas para perder. A troca é segura.

### O que vou fazer

Uma única operação de UPDATE na linha da Dra Regeane, via tool de manipulação de dados do Supabase:

```sql
UPDATE public.clients
SET service_type = 'gestao',
    phase = 'onboarding',
    phase_dates = '{}'::jsonb
WHERE id = '640b69d9-632e-4634-a09f-9c26f0b8c648';
```

Resultado:

- **`service_type`** = `gestao` → fluxo: Onboarding → Setup → Otimização → Escala
- **`phase`** = `onboarding` (primeira fase do fluxo de Gestão; você ajusta no painel admin para a fase real dela em 2 cliques se for diferente)
- **`phase_dates`** = `{}` (limpo, pronto para receber datas das novas fases pelo painel admin)
- **`autonomy`** permanece `false`

### Por que isso não afeta nada

- A página **Minha Jornada** já lê `service_type` e renderiza o fluxo dinamicamente — vai mostrar "Minha Jornada — Gestão de Tráfego" com as 4 fases corretas (Onboarding, Setup, Otimização, Escala) nas cores do config.
- O painel admin (`ClientDetail`) já tem o seletor "Tipo de Jornada" e o diálogo de mudança de fase já lista as fases do serviço escolhido — você consegue ajustar fase atual e datas direto pela interface.
- Comentários, tarefas, campanhas, criativos, arquivos, audit logs, acknowledgements — **nada** depende do `service_type`. Continuam idênticos.
- Outros clientes não são tocados.
- Nenhuma alteração de schema, nenhuma alteração de código.

### Depois do UPDATE — como você ajusta o resto

Pelo painel admin → **Clientes → Dra Regeane**:

1. Se ela não está em "Onboarding", clica em **"Mudar Fase"** e escolhe a fase real (Setup, Otimização ou Escala).
2. Para preencher datas: edita os campos de data das fases dentro da aba do cliente — eles já vão refletir as 4 fases de Gestão.

### Resultado esperado

- No próximo login da Dra Regeane (ou refresh), ela vê **"Minha Jornada — Gestão de Tráfego"** com stepper, timeline e KPIs nas fases certas.
- Zero impacto em qualquer outra parte da aplicação.

