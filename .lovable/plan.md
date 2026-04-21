

## Adicionar Linkouzinho no Banner Principal (Hero)

Substituir o blob decorativo abstrato no lado direito do Hero pela ilustração do novo Linkouzinho (versão 3D roxo/branca enviada).

---

### O que muda

**Antes:** lado direito mostra apenas formas decorativas (blobs gradientes pulsando).

**Depois:** mascote Linkouzinho aparece em destaque no lado direito, com os blobs como aura/halo sutil atrás dele.

---

### Implementação

**1. Asset**
- Copiar a imagem enviada para `src/assets/linkouzinho-hero.png` (mantém `linkouzinho.png` atual intocado — usado no widget de chat).

**2. Edição em `src/components/landing/Hero.tsx`**
- Importar o novo asset.
- Manter os blobs decorativos, mas reduzir opacidade (de `/20` para `/15`) e mantê-los como aura atrás do mascote.
- Adicionar `<img>` do Linkouzinho dentro do segundo grid item (atualmente vazio: `<div className="hidden lg:block" />`):
  - Tamanho: `max-w-[420px]` desktop
  - Posicionamento: centralizado verticalmente, ligeiramente offset à direita
  - Animação de entrada: fade + leve translateY com Framer Motion (delay 0.5s, duração 0.8s)
  - Animação contínua: leve "float" vertical (`y: [0, -12, 0]`, duração 4s, infinite, ease-in-out) — mesmo padrão usado no scroll indicator
  - `loading="eager"` + `fetchpriority="high"` (above the fold)
  - `alt="Linkouzinho — assistente IA da Agência Linkou"`
  - `drop-shadow-2xl` para destaque sobre o vídeo de fundo

**3. Mobile**
- Em telas pequenas o mascote NÃO aparece (mantém `hidden lg:block` no container) — preserva foco no headline e stats em mobile, evita poluição visual e mantém performance.

**4. Sem alterações em**
- Estrutura do grid (mantém `lg:grid-cols-[55%_45%]`)
- Headline, stats, CTA, badge — todos preservados
- Vídeo de fundo, scroll indicator, identidade visual (Poppins, cores roxas)
- Widget flutuante do Linkouzinho (`linkouzinho.png` continua sendo usado lá)

---

### Resultado visual

```text
┌─────────────────────────────────────────────────┐
│  [Badge]                                        │
│                                                 │
│  Marketing digital                ✨ aura ✨    │
│  com clareza,                  🤖 LINKOUZINHO   │
│  performance e autonomia.       (flutuando)     │
│                                                 │
│  Texto secundário...                            │
│                                                 │
│  [CTA: Quero auditoria gratuita]                │
│                                                 │
├─────────────────────────────────────────────────┤
│  25-40%  │  72%  │  5x  │  60%   (stats)        │
└─────────────────────────────────────────────────┘
```

---

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/assets/linkouzinho-hero.png` | **Novo** — imagem enviada copiada |
| `src/components/landing/Hero.tsx` | Importar asset + renderizar mascote no grid item direito com animação float |

