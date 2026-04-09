

# Modernizar Animacoes e Estrutura da Landing Page

Manter 100% da identidade visual (fontes, cores, logos, textos). Aplicar apenas melhorias em animacoes, layout do Hero e interacoes inspiradas no Tahiti Numerique.

## Mudancas

### 1. Hero — Layout Split (texto a esquerda, visual a direita)
- Trocar layout centralizado por split: texto alinhado a esquerda (~55%), lado direito com uma forma decorativa abstrata (gradiente com shape blob via CSS, sem imagem externa)
- Manter video de fundo mas com overlay mais forte e blur maior para dar destaque ao texto
- Stats em linha horizontal com separadores verticais em vez de grid
- Adicionar indicador de scroll animado (seta para baixo) no rodape da secao
- Animacoes: clip-path reveal no headline (texto aparece de baixo pra cima com mask), stagger mais pronunciado entre elementos (delays maiores)

### 2. Header — Transicao ao Scroll
- Header comeca transparente (sem glass/border) no topo da pagina
- Ao rolar ~50px, transiciona suavemente para glass + border-b (como esta hoje)
- Adicionar `useEffect` com scroll listener + state `isScrolled`

### 3. Marquee/Ticker entre Hero e Services
- Novo componente `Marquee.tsx` com faixa horizontal infinita
- Palavras: Auditoria, Trafego, Performance, Dados, Autonomia, Design (extraidas dos servicos existentes)
- Tipografia uppercase, tamanho grande, opacidade alternada (100% / 30%)
- Animacao CSS pura (keyframe `marquee` de translateX(0) a translateX(-50%))
- Duplicar conteudo para loop seamless

### 4. Scroll Animations Aprimoradas (todas as secoes)
- Substituir `opacity: 0, y: 20` por animacoes com clip-path: `inset(100% 0 0 0)` → `inset(0)` nos headings
- Stagger maior entre cards (delay 0.15 em vez de 0.1)
- Cards de servico, resultados e para-quem: hover com `y: -8` em vez de `scale: 1.02` (mais elegante)

### 5. Testimonials — Carousel com Aspas Decorativas
- Adicionar aspas tipograficas gigantes (`"`) como elemento decorativo absoluto atras do texto
- Em desktop: carousel horizontal com 1 depoimento por vez + setas de navegacao + autoplay
- Em mobile: manter grid vertical

### 6. Method — Simplificar Timeline
- Remover pulsing rings animados (muito ruidoso)
- Numeros de fase maiores e mais bold (text-5xl) como elemento visual principal
- Manter timeline horizontal em desktop mas mais clean

## Arquivos

| Arquivo | Mudanca |
|---|---|
| `src/components/landing/Hero.tsx` | Layout split, clip-path reveal, scroll indicator |
| `src/components/landing/Header.tsx` | Scroll-based background transition |
| `src/components/landing/Marquee.tsx` | Novo componente marquee ticker |
| `src/pages/Index.tsx` | Inserir Marquee entre Hero e Services |
| `src/components/landing/Services.tsx` | Hover y:-8, clip-path nos headings |
| `src/components/landing/Results.tsx` | Hover y:-8, clip-path nos headings |
| `src/components/landing/ForWhom.tsx` | Hover y:-8, clip-path nos headings |
| `src/components/landing/Method.tsx` | Remover pulsing rings, numeros maiores |
| `src/components/landing/Testimonials.tsx` | Aspas decorativas, carousel desktop |
| `src/index.css` | Keyframe marquee |
| `tailwind.config.ts` | Keyframe marquee |

## O que NAO muda
- Fontes (Poppins, Lora, Cascadia Code)
- Cores (roxo primary, dark/light mode)
- Textos e conteudo
- Logo e branding
- Funcionalidade (formulario, tracking, SEO, PWA)
- Componentes que nao sao landing (admin, cliente)

