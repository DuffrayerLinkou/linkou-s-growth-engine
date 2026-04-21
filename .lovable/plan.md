

## Hero — separar stats, simplificar e abrir o grid

A barra de stats está colada ao CTA, com texto longo demais e grid apertado no desktop. Vou tratar isso como uma **seção secundária independente** abaixo do Hero, com respiro visual claro e copy mais objetiva.

---

### Mudanças

#### 1. Separar visualmente do bloco CTA
- Remover a barra de stats de dentro do `<section>` do Hero
- Criar bloco próprio com `mt-16 md:mt-24` (respiro generoso) e um label discreto acima: **"Por que isso importa"** em `text-xs uppercase tracking-widest text-primary/70`
- Adicionar borda superior sutil (`border-t border-primary/10`) para marcar a separação

#### 2. Encurtar drasticamente as labels (mais objetivas)

| Antes (12+ palavras) | Depois (3-5 palavras) |
|---|---|
| "do orçamento de mídia é desperdiçado em campanhas mal configuradas" | "do orçamento desperdiçado" |
| "das empresas não têm tracking corretamente implementado" | "sem tracking correto" |
| "mais caro converter leads sem rastreabilidade clara" | "mais caro sem rastreio" |
| "das contas de ads têm problemas de atribuição que escondem o ROI real" | "com atribuição quebrada" |

Resultado: cards limpos, leitura instantânea, sem texto comprimido.

#### 3. Abrir o grid desktop
- Trocar `justify-start gap-0` + separadores verticais por **grid real** `grid-cols-4 gap-12 lg:gap-16`
- Cada stat fica num card discreto com `py-6 px-4`, alinhamento à esquerda
- Remover separadores `w-px h-12` (visual datado), substituir por **espaçamento generoso**
- Container com `max-w-6xl mx-auto` para respirar nas bordas
- Valor (`3xl → 4xl`) maior e label abaixo em `text-sm text-foreground/60`

#### 4. Mobile mais clean
- Manter grid 2x2 (já aprovado), mas com labels curtas o `min-h-[140px]` cai para `min-h-[100px]`
- Tipografia: valor `text-2xl`, label `text-xs` (sem mais `text-[11px]` apertado)
- Cards mantêm `bg-primary/5 border-primary/15`

#### 5. Estrutura final do Hero
```text
<Hero section>
  badge → headline → sub → CTA → micro-texto
  └ scroll indicator (desktop only)

<Stats section>  ← NOVO bloco separado
  "Por que isso importa" label
  └ grid de 4 stats (responsive)
```

---

### Antes vs depois (desktop)

```text
ANTES (apertado, justify-start, separadores finos):
[25-40%] | [72%] | [5x] | [60%]
 ↑ tudo colado à esquerda, separadores verticais finos

DEPOIS (grid 4 colunas com respiro):
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  25-40%  │  │   72%    │  │    5x    │  │   60%    │
│ orçamento│  │ sem track│  │ sem rast.│  │ atribuição│
└──────────┘  └──────────┘  └──────────┘  └──────────┘
   ↑ gap-12, max-w-6xl, alinhamento equilibrado
```

---

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/landing/Hero.tsx` | Remover bloco de stats interno; encurtar copy |
| `src/components/landing/HeroStats.tsx` | **Novo** — seção independente com label + grid 4 col aberto |
| `src/pages/Index.tsx` | Renderizar `<HeroStats />` logo após `<Hero />` e antes de `<Marquee />` |

### Sem alterações
- Identidade visual (cores, fonte, fundo cosmos)
- Headline, badge, CTA, mascote
- Layout mobile do Hero principal (apenas stats migram para o novo bloco)
- Demais seções da landing

