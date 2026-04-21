

## Ajustar proporção do Linkouzinho no Hero

O mascote ficou pequeno e perdido no espaço à direita. Vou ancorá-lo visualmente, aumentar o tamanho e reforçar a aura para equilibrar com a headline.

---

### Problemas identificados

1. **Tamanho insuficiente** — `max-w-[420px]` resulta em ~280–320px renderizados, parece miniatura ao lado da headline de ~72px
2. **Falta de ancoragem visual** — mascote flutua isolado, sem "moldura" que o segure no espaço
3. **Aura fraca** — blobs decorativos (`/15`, `/8`) ficam invisíveis sobre o vídeo escuro, mascote não tem destaque
4. **Posicionamento** — está centralizado no grid, mas o grid é `45%` da largura → mascote fica colado na borda direita do conteúdo, longe da headline

---

### Mudanças em `src/components/landing/Hero.tsx`

**1. Aumentar mascote e ajustar grid**
- `max-w-[420px]` → `max-w-[560px]` (desktop padrão)
- Em telas `xl` (≥1280px): `max-w-[620px]`
- Grid: manter `lg:grid-cols-[55%_45%]` mas remover restrição de overflow no container do mascote

**2. Reforçar aura/halo atrás do mascote**
- Aumentar opacidade dos blobs: `/15` → `/30` e `/8` → `/20`
- Adicionar **glow circular** centrado no mascote: `radial-gradient` roxo (`hsl(var(--primary)/0.25)`) com `blur-3xl`, posicionado absolutamente atrás do `<img>`
- Anel decorativo sutil ao redor (já existe parcialmente nos blobs, mas será reposicionado)

**3. Melhor ancoragem do container**
- Container do mascote: `relative flex items-center justify-center` com altura mínima `min-h-[500px]`
- Adicionar pseudo-base elíptica embaixo do mascote (sombra projetada no "chão") para dar peso visual: elipse achatada com `bg-primary/20 blur-2xl` posicionada no rodapé
- Manter animação float, mas reduzir amplitude (`y: [0, -10, 0]`) para não descolar da sombra

**4. Drop-shadow reforçado**
- Trocar `drop-shadow-2xl` por `filter: drop-shadow(0 25px 60px hsl(var(--primary)/0.4))` inline para sombra colorida roxa

---

### Resultado visual esperado

```text
┌─────────────────────────────────────────────────┐
│  [Badge]                                        │
│                                                 │
│  Marketing digital              ╭─ glow ─╮      │
│  com clareza,                  ✨ AURA ✨       │
│  performance e                  🤖              │
│  autonomia.                  LINKOUZINHO        │
│                              (maior, ancorado)  │
│  Texto secundário...           ◡ sombra ◡       │
│                                                 │
│  [CTA: Quero auditoria]                         │
│                                                 │
├─────────────────────────────────────────────────┤
│  25-40%  │  72%  │  5x  │  60%                  │
└─────────────────────────────────────────────────┘
```

---

### Sem alterações
- Imagem (`linkouzinho-hero.png` mantém)
- Mobile (`hidden lg:block` mantém — mascote continua oculto)
- Headline, badge, stats, CTA, vídeo de fundo
- Identidade visual (Poppins, cores roxas)

### Arquivo alterado
| Arquivo | Mudança |
|---|---|
| `src/components/landing/Hero.tsx` | Aumentar mascote, adicionar glow + sombra projetada, reforçar aura |

