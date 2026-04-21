

## Auditoria Pós-Refatoração — Inconsistências e Performance

Auditei as últimas 3 grandes mudanças: **Linkouzinho no Hero**, **PlanningTab reescrito** e **PDF editorial / Plano Estratégico Profundo**. TypeScript compila limpo, sem erros no dev server. Encontrei **6 inconsistências** (1 crítica, 3 médias, 2 cosméticas) e **3 oportunidades de performance**.

---

### 🔴 CRÍTICO — Página do cliente desatualizada

**`src/pages/cliente/PlanoEstrategico.tsx`** ficou para trás na refatoração. Está renderizando o **schema antigo** enquanto admin/PlanningTab/PDF já usam o novo:

| Problema | Impacto |
|---|---|
| Tipo `funnel_strategy: string` (era objeto agora) | Cliente nunca verá topo/meio/fundo |
| Renderiza apenas `obj.name` + `obj.description` (sem metric/baseline/target/deadline) | Cliente vê plano "raso" enquanto admin gerou plano profundo |
| Renderiza apenas `kpi.name` + `kpi.target` (sem categoria/unit/current/frequency) | Métricas incompletas |
| Renderiza apenas `persona.name` + `persona.description` (sem dores/canais/hook) | Personas vazias |
| **Sem renderização de**: `executive_summary`, `diagnostic` (SWOT), `execution_plan` (ondas/governança) | Cliente perde 50% do conteúdo do plano |
| Sem botão "Baixar PDF" | Cliente não consegue exportar o plano editorial |

**Correção:** alinhar com `ClientPlanTab.tsx` (admin) — mesmo tratamento `asArray`, mesmas seções, mesmo botão de PDF (read-only, sem botão Editar).

---

### 🟡 MÉDIO 1 — `useEffect` reseta `client_id` ao trocar de plano em edição

`PlanningTab.tsx` linhas 149-151:
```ts
useEffect(() => {
  if (clientId && !editingPlan) setForm(prev => ({ ...prev, client_id: clientId }));
}, [clientId, editingPlan]);
```
Quando `editingPlan` muda de `null` → objeto, o effect dispara e o spread `prev` pode entrar em corrida com `setForm(normalizeFromDB(plan))` em `openEdit`. Funciona hoje porque `setForm` está no mesmo tick, mas é frágil. **Correção:** mover lógica para dentro de `openNew`/`openEdit` e remover o effect.

### 🟡 MÉDIO 2 — `drawTable` no PDF recalcula altura 2x (bug visual)

`pdf-generator.ts` linhas 263-273: a borda do retângulo final usa `rows.reduce` recalculando `splitTextToSize` para cada linha **duas vezes** após já ter desenhado. Quando há 6+ KPIs ou objetivos longos, a borda fica desalinhada das linhas zebradas. **Correção:** acumular `dynH` num array durante o render e somar no final.

### 🟡 MÉDIO 3 — `ClientPlanTab` admin: card de Funil renderiza fora do grid

Linha 211: o `<Card>` de funil está **fora** do `<div className="grid md:grid-cols-2">` (que fechou na 209), mas dentro do JSX flui sem wrapper de espaçamento explícito. Visualmente OK por causa do `space-y-4` no pai, mas semanticamente o funil aparece full-width abaixo de um grid de 2 colunas — pode causar pulo visual. **Correção:** mover funil/budget/execução para dentro de seu próprio `<section>` com header.

---

### 🟢 COSMÉTICO

1. **Hero — atributo `fetchpriority` com `@ts-expect-error`**: já é suportado em React 19 e nas versões modernas do `@types/react`. Verificar versão e remover comentário se possível (limpa o código).
2. **PlanningTab — ícone `TrendingUp` rotacionado para "Risco"** (linha 460): truque visual confuso. Trocar por `TrendingDown` (já existe no lucide-react).

---

### ⚡ PERFORMANCE

| Item | Análise | Recomendação |
|---|---|---|
| **Hero — vídeo de fundo + drop-shadow + 3 blobs animados + float infinito** | drop-shadow + blur(40px) + 2 `animate-pulse` + animação Y infinita no mascote = **GPU constante**. Em mobile já está oculto (`hidden lg:block`), bom. Mas em desktop low-end o LCP pode subir. | Adicionar `prefers-reduced-motion` para parar o float e os pulses. Reduzir blur do glow de `40px` → `30px`. |
| **PlanningTab — 776 linhas, sem code-split** | Componente carregado dentro do bundle de `/admin/onboarding`. Não é lazy. | Já está dentro de uma rota lazy (`Onboarding` é lazy em `App.tsx`), então OK. Sem ação. |
| **PDF generator — 827 linhas sempre no bundle** | `generateStrategicPlanPDF` é importado estaticamente em `PlanningTab.tsx` e `ClientPlanTab.tsx`. Ele puxa `jspdf` (~250KB) mesmo quando o usuário não vai exportar. | Trocar por **dynamic import**: `const { generateStrategicPlanPDF } = await import("@/lib/pdf-generator")` no clique do botão. Reduz bundle inicial significativamente. |

---

### Plano de correção (ordem sugerida)

1. **Reescrever `src/pages/cliente/PlanoEstrategico.tsx`** — espelhar `ClientPlanTab.tsx` (sem botão Editar), com PDF download e todas as seções novas (sumário, diagnóstico, personas ricas, objetivos SMART, KPIs categorizados, funil 3-etapas, budget, execução)
2. **Corrigir grid de Funil/Budget no `ClientPlanTab.tsx`** (admin) — envolver em `<section className="space-y-4">`
3. **Dynamic import de `pdf-generator`** nos 2 callers — economiza ~250KB do bundle inicial
4. **`prefers-reduced-motion` no Hero** — parar float/pulses para usuários sensíveis
5. **Limpar `useEffect` redundante no PlanningTab** (linhas 149-151)
6. **Trocar `TrendingUp rotate-180` por `TrendingDown`** (cosmético)
7. **Bug da borda da tabela no PDF** — acumular alturas em array

### Sem alterações (já está bom)

- TypeScript compila limpo
- Dev server sem erros/warnings
- Migração SQL aplicada e tipos do Supabase atualizados
- Compatibilidade com schema antigo (helper `normalizeFromDB` + `asArray`) funcionando
- Tool da IA (`create_strategic_plan`) com schema profundo validado

### Arquivos afetados

| Arquivo | Severidade |
|---|---|
| `src/pages/cliente/PlanoEstrategico.tsx` | 🔴 Crítico — reescrever |
| `src/components/admin/client-detail/ClientPlanTab.tsx` | 🟡 Médio (dynamic import + grid funil) |
| `src/components/admin/onboarding/PlanningTab.tsx` | 🟡 Médio (effect + dynamic import + ícone) |
| `src/components/landing/Hero.tsx` | 🟢 Performance (reduced-motion) |
| `src/lib/pdf-generator.ts` | 🟡 Médio (bug borda tabela) |

