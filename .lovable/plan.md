

## Bug: "Estratégia de Funil" mostra JSON cru no Plano Estratégico

### Diagnóstico

A coluna `strategic_plans.funnel_strategy` está como **TEXT** no banco, enquanto as outras seções estruturadas (`objectives`, `kpis`, `personas`, `budget_allocation`, `diagnostic`, `execution_plan`) estão como **JSONB**.

Quando o admin salva o funil estruturado (`{topo, meio, fundo}`) pelo `PlanningTab`, o Supabase serializa o objeto como string JSON (porque a coluna é TEXT). Na hora de exibir, o componente faz:

```ts
const isFunnelObject = funnel && typeof funnel === "object" && !Array.isArray(funnel);
// ...
{!isFunnelObject ? <p>{String(funnel)}</p> : <Cards estruturados/>}
```

Como o valor volta como **string** (`"{\"topo\":..."`), `isFunnelObject` é `false` e cai no fallback que joga o JSON inteiro na tela — exatamente o que aparece na sua screenshot.

Efeito colateral: o editor (`PlanningTab` linha 240) também ignora a string ao carregar (`typeof === "object"` falha), então o admin abre o formulário com os campos do funil **em branco**, mesmo tendo salvo antes.

### Correção

**1. Migração SQL** — converter coluna para JSONB preservando dados existentes:
```sql
ALTER TABLE public.strategic_plans
  ALTER COLUMN funnel_strategy TYPE jsonb
  USING CASE
    WHEN funnel_strategy IS NULL THEN NULL
    WHEN funnel_strategy ~ '^\s*[\{\[]' THEN funnel_strategy::jsonb
    ELSE to_jsonb(funnel_strategy)
  END;
```
Lida com 3 casos: nulo, JSON válido (objeto/array), texto livre legado (vira string JSON).

**2. Regenerar `src/integrations/supabase/types.ts`** — passa a refletir `funnel_strategy: Json | null`.

**3. Defesa em profundidade nos 3 leitores** — caso ainda exista algum registro string em outro ambiente, normalizar antes de renderizar:
- `src/components/admin/client-detail/ClientPlanTab.tsx`
- `src/pages/cliente/PlanoEstrategico.tsx`
- `src/lib/pdf-generator.ts` (a função `drawFunnel` usa `plan.funnel_strategy` direto)

Helper compartilhado:
```ts
const parseFunnel = (v: unknown) => {
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
};
```

**4. Verificar `assistant-chat`** — linha 1711 já usa o valor como string no contexto da IA. Após virar JSONB, trocar para `JSON.stringify(plan.funnel_strategy)` para manter o contexto legível pra IA.

### Sem mudanças

- Nenhuma alteração visual nos cards "Topo / Meio / Fundo" — eles já estão prontos e funcionarão assim que o dado chegar como objeto.
- Outras seções do plano (objetivos, KPIs, personas, budget) não são afetadas.

### Risco

Baixo. A migração preserva dados (texto livre vira string JSON, JSON estruturado vira jsonb). Após aplicar, planos antigos com funil em texto livre continuam exibindo corretamente (o helper `parseFunnel` retorna a string e o fallback `<p>` renderiza como antes).

