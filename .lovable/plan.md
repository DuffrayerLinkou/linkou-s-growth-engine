

## Auditoria Responsiva — Grids Mobile-First & Desktop

Auditei as 7 seções da landing page no viewport atual (1438px) e em mobile (<640px). Encontrei **5 problemas reais de grid** que criam cards finos, espaçamento inconsistente ou breakpoints mal escolhidos. Aqui está o plano de correção, seção por seção.

---

### Problemas identificados

| Seção | Problema | Severidade |
|---|---|---|
| **Results** ("Por que uma auditoria") | `grid-cols-2` em mobile = 4 cards finos em 2x2 com texto apertado (~160px de largura cada) — descrições de 20+ palavras ficam ilegíveis | 🔴 Alta |
| **Hero stats** | Mesmo problema: `grid-cols-2` mobile com label de 12 palavras dentro de 100px de altura → texto `text-[10px]` ilegível | 🔴 Alta |
| **Method (timeline desktop)** | Salta direto de mobile vertical para `lg:` (1024px). Entre 768px–1024px (tablet) fica vertical desperdiçando espaço horizontal | 🟡 Média |
| **Services** | `md:grid-cols-2` cria cards densos em tablet (768px) com lista de features em 2 colunas dentro de coluna estreita → quebra texto feio | 🟡 Média |
| **ForWhom** | `md:grid-cols-3` ativa em 768px → 3 cards com ~220px cada, título "Negócios que Dependem de Mídia Paga" quebra em 4 linhas | 🟡 Média |
| **ContactForm** | `lg:grid-cols-2` (1024px+) — entre 768–1024 o formulário fica em coluna única muito largo (max-w-4xl sem limite interno) | 🟢 Cosmético |

---

### Plano de correção por seção

#### 1. `Results.tsx` — quebra para 1 coluna em mobile
```diff
- grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6
+ grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6
```
Mobile: 1 card por linha (largura total, descrição respira). Tablet (640px+): 2x2. Desktop: 4 colunas.

#### 2. `Hero.tsx` — stats com layout adaptativo
- Mobile: manter `grid-cols-2` MAS aumentar `text-[10px]` → `text-xs` e `min-h-[100px]` → `min-h-[120px]`
- Adicionar breakpoint intermediário: `sm:grid-cols-4` (4 colunas a partir de 640px) para evitar pulo brusco mobile→desktop
- Reduzir tamanho do `value` em mobile: `text-2xl` → `text-xl` para liberar espaço para o label

#### 3. `Method.tsx` — timeline tablet
Mudar breakpoint de timeline horizontal de `lg:` (1024px) para `md:` (768px), MAS com nodes mais compactos em tablet:
```diff
- <div className="hidden lg:block">
+ <div className="hidden md:block">
- <div className="grid lg:grid-cols-4 gap-6 mt-8">
+ <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
```
Tablet: timeline horizontal + cards 2x2. Desktop: timeline + cards 1x4.

#### 4. `Services.tsx` — coluna única até tablet largo
```diff
- grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8
+ grid lg:grid-cols-2 gap-6 lg:gap-8
```
E na lista interna de features:
```diff
- ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4"
+ ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4"
```
Cards full-width até 1024px (lg). A partir daí 2 colunas com espaço suficiente para a lista de features em 2 colunas.

#### 5. `ForWhom.tsx` — 1→2→3 colunas progressivo
```diff
- grid md:grid-cols-3 gap-6
+ grid sm:grid-cols-2 lg:grid-cols-3 gap-6
```
Mobile: 1 coluna. Tablet (640px+): 2 colunas (3º card quebra para linha de baixo, full-width centralizado seria ideal mas mantém 2x2 com 3º item natural). Desktop (1024px+): 3 colunas.

Para evitar 3º card sozinho em tablet, adicionar wrapper:
```tsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
  {/* primeiros 2 normais, terceiro com sm:col-span-2 lg:col-span-1 */}
</div>
```

#### 6. `ContactForm.tsx` — controle de largura intermediário
- Trocar `max-w-4xl` → `max-w-5xl` para o container desktop
- Adicionar `md:max-w-2xl md:mx-auto` no formulário em tablet para não esticar demais
- `lg:grid-cols-2` mantém

---

### Padronização de breakpoints (mobile-first)

Adoção de escala consistente em **todas** as seções:

```text
Default (0px+)    : 1 coluna
sm:  (640px+)     : 2 colunas (cards de catálogo) ou mantém 1 (texto longo)
md:  (768px+)     : breakpoint de transição (tablet portrait)
lg:  (1024px+)    : layout final (3-4 colunas)
xl:  (1280px+)    : ajustes finos opcionais
```

| Seção | Mobile | Tablet (sm) | Tablet wide (md) | Desktop (lg) |
|---|---|---|---|---|
| Hero stats | 2 col | 4 col | 4 col | 4 col |
| Services | 1 col | 1 col | 1 col | 2 col |
| Results | 1 col | 2 col | 2 col | 4 col |
| Method cards | 1 col | 1 col | 2 col | 4 col |
| ForWhom | 1 col | 2 col (3º full) | 2 col | 3 col |
| Testimonials | 1 col | carousel | carousel | carousel |
| ContactForm | 1 col | 1 col | 1 col | 2 col |

---

### Sem alterações
- Hero (layout principal split, mascote, fundo cosmos) — apenas stats ajustam
- Marquee — já é horizontal infinito, não tem grid
- FAQ — accordion vertical único, já está bom
- Footer — fora do escopo (não foi mencionado)
- Identidade visual (cores, fontes, animações)

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/landing/Results.tsx` | Grid `1 → sm:2 → lg:4`, gap consistente |
| `src/components/landing/Hero.tsx` | Stats: tipografia + breakpoint sm:4 cols |
| `src/components/landing/Method.tsx` | Timeline horizontal a partir de `md:`, cards `md:2 → lg:4` |
| `src/components/landing/Services.tsx` | Cards full-width até `lg:`, features `sm:2` |
| `src/components/landing/ForWhom.tsx` | Grid `1 → sm:2 → lg:3`, 3º card full em tablet |
| `src/components/landing/ContactForm.tsx` | Largura controlada em tablet |

