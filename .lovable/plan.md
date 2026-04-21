

## Hero estilo "cosmos roxo" — referência aplicada

A imagem mostra uma cena imersiva: fundo cósmico roxo escuro com **rede de pontos/linhas conectadas** (constellation network), partículas brilhantes e o mascote integrado como parte da cena (sem blobs decorativos, sem vídeo de fundo). Vou recriar esse visual mantendo identidade Linkou.

---

### Diferenças chave entre o atual e a referência

| Atual | Referência |
|---|---|
| Vídeo de fundo + blur | Cena estática com rede de constelação roxa |
| 2 blobs gradientes pulsando atrás do mascote | Partículas + linhas conectadas em todo o fundo |
| Glow halo + drop-shadow forte no mascote | Mascote com aura roxa difusa, integrado no cenário |
| Fundo neutro escuro | Gradiente radial roxo profundo (#1a0533 → #0a0118) |
| Stats com bordas/separadores | Stats mais discretos sobre o fundo cósmico |

---

### O que vai mudar em `src/components/landing/Hero.tsx`

#### 1. Substituir vídeo por cena cósmica em camadas
- Remover `<video>` e `backdrop-blur`
- Camada 1 (mais fundo): gradiente radial — `radial-gradient(ellipse at center, hsl(270 60% 12%) 0%, hsl(265 70% 6%) 50%, hsl(260 80% 3%) 100%)`
- Camada 2: **rede de constelação SVG** — pontos com linhas conectando-os (gerados em pattern, repetindo). Animação sutil de opacidade pulsante (3s, low-cost).
- Camada 3: partículas brilhantes (10-15 pontos com `box-shadow` roxo/branco e animação de twinkle individual com delays diferentes)
- Camada 4: glow radial atrás do mascote (mantém)

#### 2. Remover blobs decorativos
Apagar os 3 `<div>` com `rounded-[40%_60%...]` que criam as bolhas — não combinam mais com a cena cósmica.

#### 3. Mascote — manter mas reforçar integração
- Manter `linkouzinho-hero.png` no mesmo lugar
- Aumentar aura: glow radial roxo mais intenso atrás (raio maior, `hsl(var(--primary) / 0.4)`)
- Adicionar sombra "no chão" elíptica (já existe, manter)
- Manter float animation respeitando `prefers-reduced-motion`

#### 4. Ajustes de tipografia/copy
- Manter headline com `text-gradient` no "Marketing digital"
- Manter badge, sub-line, CTA — sem mudanças

#### 5. Stats
- Remover borda/separadores pesados, usar apenas espaço + cor primária nos números
- Tornar os cards transparentes (sem `bg-card/20`), apenas tipografia sobre o fundo cósmico

#### 6. Performance
- SVG da rede de constelação: estático (não animado em transform/positions). Apenas opacity pulse leve.
- Partículas: máximo 12, cada uma com keyframe próprio mas todas usando `opacity` (compositor GPU).
- Respeitar `prefers-reduced-motion` em tudo (já implementado no float).
- Sem `backdrop-blur` (caro). Sem `drop-shadow` filter (caro) — substituir por `box-shadow` no wrapper.

---

### Diagrama da estrutura

```text
┌────────────────────────────────────────────────┐
│  HEADER (transparente)                         │
├────────────────────────────────────────────────┤
│ [● Auditoria · Tráfego · Produção · Design]    │
│                                                 │
│  Marketing digital                              │
│  com clareza,             ╭──── glow ────╮     │
│  performance e            │   🤖           │   │
│  autonomia.               │  Linkouzinho   │   │
│                           │  + aura roxa   │   │
│  A Agência Linkou...      ╰────────────────╯   │
│                                                 │
│  [ Quero auditoria gratuita → ]                │
│  Primeiro passo é entender...                   │
│                                                 │
│  25-40%   │   72%   │   5x   │   60%           │
│                                                 │
│  ←Fundo: rede de constelação + partículas→     │
└────────────────────────────────────────────────┘
```

---

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/landing/Hero.tsx` | Reescrever fundo (cosmos+constellation+particles), remover vídeo/blobs, reforçar aura do mascote, simplificar stats |
| `src/index.css` | Adicionar keyframes `twinkle` e `constellation-pulse` se necessário |

### Sem alterações
- Imagem do mascote (`linkouzinho-hero.png`)
- Headline, badge, CTA, copy
- Layout responsivo (mobile continua sem mascote)
- Vídeo `/videos/hero-background.mp4` permanece no projeto (caso queira reaproveitar depois) — apenas removido do Hero
- Identidade visual (cores roxas, Poppins)

