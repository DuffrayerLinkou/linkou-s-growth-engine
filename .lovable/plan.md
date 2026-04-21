

## Inspirações do Pocketchange — o que dá pra adaptar à Linkou

Visitei o site. É um one-page com forte estética editorial, **animações scroll-triggered** e **tipografia oversized**. A identidade deles é vermelho/laranja saturado com mockups de iPhone — bem diferente do nosso roxo cosmos. Mas várias **técnicas de movimento e composição** podem elevar a Linkou sem quebrar a identidade.

---

### Análise — o que faz o site funcionar

| Técnica | Como usam | Compatível com Linkou? |
|---|---|---|
| **Letras reveladas individualmente no scroll** (SplitText) | Headlines aparecem letra-a-letra conforme o usuário rola, com espaçamento exagerado entre caracteres durante a animação | ✅ Sim — combina com o tom editorial |
| **Mockups 3D em ângulos dramáticos** | iPhones flutuando rotacionados (~15-20°), com sombras profundas e profundidade | ⚠️ Adaptar — usar dashboards/painéis do app Linkou em vez de iPhones |
| **Tipografia oversized** (10rem+) | Headlines gigantescas que dominam viewport inteiro | ✅ Sim — combina com a Poppins bold |
| **"Scroll down" animado** com letras espaçadas | Indicador de scroll com letras separadas que pulsam | ✅ Sim |
| **Marquee de palavras-conceito** | Texto rolando horizontal com keywords | ✅ Já temos! |
| **Sticky scroll com troca de conteúdo** | Conforme rola, texto fixo muda de cor/conteúdo | ✅ Sim — bom para a seção Method |
| **Citação em coluna vertical** (uma letra por linha) | "Pocketchange will always be free…" empilhada verticalmente | ⚠️ Decorativo demais — pular |
| **Cor saturada cobrindo viewport inteiro** | Vermelho dominante full-bleed | ❌ Não — manteríamos roxo cosmos |
| **Cards de categorias com imagem + label** | Grid de "Veteran-owned brands", "LGBTQ+ cafés" etc. | ✅ Sim — bom para reformular ForWhom |

---

### Proposta de adaptação para Linkou

#### 1. **Letras reveladas no scroll** (alta prioridade) — `Hero.tsx` e `Method.tsx`

Implementar com `framer-motion` (já instalado) + componente `<RevealText>` reutilizável que divide texto em chars/words e anima opacidade + translateY conforme entra no viewport.

```tsx
<RevealText as="h1" className="text-5xl md:text-7xl">
  Marketing digital com clareza
</RevealText>
```

- Animação: cada char/word com `delay` escalonado (stagger de 0.02-0.04s)
- Trigger: `whileInView` com viewport `once: true`
- Performance: usar `transform` + `opacity` (GPU-friendly)
- Respeita `prefers-reduced-motion`

Aplicar nas headlines de: **Hero** (já existente), **Results**, **Method**, **ForWhom**, **ContactForm**.

#### 2. **Mockups 3D dos painéis Linkou** (média prioridade) — substituir mascote em seções secundárias

Em vez de só o mascote no Hero, criar uma nova seção "Dentro da plataforma" com:
- 2-3 screenshots de painéis (Dashboard cliente, Kanban de tarefas, Plano estratégico)
- Rotação 3D leve (`rotate-y-12 rotate-x-3`)
- Sombras profundas (`shadow-2xl shadow-primary/30`)
- Animação parallax sutil ao scroll (mover Y conforme `useScroll`)

Posicionamento sobreposto, criando profundidade. Manter o mascote só no Hero.

#### 3. **"Scroll down" com letras espaçadas pulsantes** (baixa prioridade) — `Hero.tsx`

Substituir o ícone atual de scroll por:
```
S · c · r · o · l · l
```
Com cada letra fazendo `opacity` pulse em sequência (efeito wave). Decorativo mas charmoso.

#### 4. **Sticky scroll na seção Method** (alta prioridade)

Hoje o Method é uma timeline horizontal estática. Transformar em **sticky scroll narrative**:
- Lado esquerdo: lista vertical das 4 etapas (sticky enquanto rola)
- Lado direito: imagens/cards trocam conforme cada etapa entra no viewport
- Ao chegar na etapa atual, ela fica com `text-primary` e bold; outras ficam `text-muted`

Padrão muito usado em sites editoriais (Apple, Stripe, Linear). Encaixa com nosso tom premium.

#### 5. **Tipografia oversized estratégica** (média prioridade)

Aumentar 1-2 headlines-âncora ao tamanho de viewport-dominante:
- "Não gerenciamos contas. Construímos ecossistemas." em `text-6xl md:text-8xl lg:text-9xl`
- Posicionar como divisor entre seções (full-width, centro)

Combina com o roxo cosmos e cria pausa visual.

#### 6. **Grid de "Para quem" com imagens reais** (média prioridade) — refinar `ForWhom.tsx`

Atualmente é só cards com ícones. Adicionar imagens reais ou ilustrações de cada perfil:
- "Negócios que dependem de mídia paga" → imagem de e-commerce/loja
- "Ecommerces e DTC" → imagem de produto
- "Consultorias e SaaS" → imagem de dashboard

Layout estilo Pocketchange: imagem em cima + label + descrição embaixo.

---

### O que NÃO copiar

- ❌ Cor vermelha saturada full-bleed (mantém roxo cosmos)
- ❌ Citação em letras empilhadas verticalmente (decoração excessiva, ruim de ler)
- ❌ Cookie banner animado custom (mantém padrão simples)
- ❌ Mockups de iPhone (somos B2B SaaS, não app mobile)

---

### Ordem de implementação sugerida

| Fase | Item | Esforço |
|---|---|---|
| **1ª** | Componente `<RevealText>` reutilizável + aplicar nas headlines | Médio (1 componente novo, 5-6 lugares pra trocar) |
| **2ª** | Sticky scroll narrative no `Method.tsx` | Médio-alto (reescrever seção) |
| **3ª** | Tipografia oversized em 1-2 divisores entre seções | Baixo |
| **4ª** | "Scroll down" com letras espaçadas | Baixo (cosmético) |
| **5ª** | Grid `ForWhom` com imagens reais | Depende de assets |
| **6ª** | Seção "Dentro da plataforma" com mockups 3D dos painéis | Alto (precisa screenshots reais dos painéis) |

---

### Performance & acessibilidade
- Tudo respeitando `prefers-reduced-motion`
- `RevealText` usa `whileInView` com `once: true` — anima apenas 1x por sessão
- Sem libs novas (já temos `framer-motion`)
- Mockups 3D: usar `transform: rotate()` com `will-change: transform` apenas durante animação

### Arquivos que seriam alterados
- **Novo**: `src/components/landing/RevealText.tsx`
- **Editado**: `Hero.tsx`, `Results.tsx`, `Method.tsx`, `ForWhom.tsx`, `ContactForm.tsx`
- **Opcional novo**: `src/components/landing/PlatformShowcase.tsx` (fase 6)

**Quais fases quer aprovar?** Posso fazer só as fases 1+2+3 (que dão o maior impacto visual sem precisar de assets novos), ou o pacote completo.

