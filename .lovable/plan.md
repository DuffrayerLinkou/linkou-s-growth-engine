

## Entregáveis criativos visíveis e aprováveis para todos os envolvidos

### Diagnóstico

A área **Entregáveis** dentro de uma demanda em `/cliente/criativos` é renderizada para **qualquer** usuário do cliente — a query filtra só por `demand_id` e o RLS de `creative_deliverables` permite `client_id = get_user_client_id(auth.uid())`. Mesma coisa para `creative_demands`.

Você relatou que só **quem criou a demanda** consegue ver. Isso só acontece se os outros usuários do cliente (ponto focal e gestor) **não enxergam nem a lista de demandas**. As causas reais são duas, cobertas no plano:

1. **Profile sem `client_id`** — usuários convidados via "Minha Equipe" do gestor cliente podem ter sido criados como `profiles.client_id = NULL` (vinculados só por `client_users`). As funções `get_user_client_id` e `is_ponto_focal` leem **somente** `profiles.client_id`, então RLS bloqueia tudo (criativos, tarefas, agendamentos…). Quem cria a demanda é sempre alguém logado com `client_id` válido — por isso "só ele vê".
2. **Permissão de aprovação restrita** — hoje só Ponto Focal aprova/pede ajustes. Você quer Ponto Focal **+ Manager**.

### O que vai mudar

**1. Backfill de `profiles.client_id` para usuários do cliente (migration)**

Migration única que sincroniza `profiles.client_id` a partir de `client_users` para todos os usuários onde o profile está com `client_id` nulo. Isso destrava criativos, tarefas, projetos, agendamentos etc. de uma vez.

```sql
UPDATE public.profiles p
SET client_id = cu.client_id
FROM public.client_users cu
WHERE cu.user_id = p.id AND p.client_id IS NULL;
```

Também adiciona um trigger leve em `client_users` (AFTER INSERT) que aplica o mesmo update — garantindo que novos convites via "Minha Equipe" já saiam com profile correto, sem depender de o gestor lembrar de salvar manualmente.

**2. `useClientPermissions` — `canApprove` inclui Manager**

```ts
canApprove: isPontoFocal || userType === "manager",
```

**3. `CreativeDeliverableViewer` — texto e CTA atualizados**

- Botões **Aprovar** e **Solicitar ajustes** passam a aparecer também para Manager (já automático via `canApprove`).
- Mensagem de bloqueio para Operator: "Apenas o Ponto Focal ou o Gestor pode aprovar este entregável."
- Adicionar pequena legenda ao lado do título quando o entregável estiver `in_production`/`internal_review` para deixar claro que **todos os usuários** do cliente já estão acompanhando, mesmo antes da aprovação.

**4. (Opcional, mesmo arquivo) — Header da seção Entregáveis no `Criativos.tsx`**

Trocar o título "Entregáveis" por "Entregáveis (visível para toda a equipe do cliente)" como reforço visual de transparência.

### Resultado esperado

- Ponto Focal e Manager (Dra. Regeane e gestores) passam a ver as demandas e a área de Entregáveis em `/cliente/criativos`, mesmo sem terem sido eles a criar a demanda.
- Ambos podem **Aprovar** ou **Solicitar ajustes** quando o entregável estiver em `in_approval`.
- Operadores continuam só visualizando.
- Usuários convidados pelo "Minha Equipe" passam a herdar o `client_id` automaticamente, destravando todas as outras seções (tarefas, projetos, agendamentos) que sofriam do mesmo problema silencioso.

### Observação técnica

Sem alterações em RLS — o problema é dado faltando, não política. A migration é idempotente (`WHERE p.client_id IS NULL`).

