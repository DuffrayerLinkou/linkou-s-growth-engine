

# Corrigir Logo do PWA e Melhorar Splash Screen

## Problema Identificado

A logo errada no ícone do PWA provavelmente vem de duas causas:

1. **React duplicado no bundle** — O stack-overflow hint indica que múltiplas instâncias de React podem causar assets renderizados incorretamente. O `vite.config.ts` já tem `dedupe: ["react", "react-dom"]` mas falta `"react/jsx-runtime"`.

2. **Ícones do manifest podem estar com a imagem errada** — Os arquivos `public/icons/icon-192x192.png` e `icon-512x512.png` podem não ser a logo correta da marca (logo-linkou-roxo). Precisam ser verificados/substituídos.

3. **Splash Screen** — A animação atual é funcional mas a transição (fade-in 300ms + hold 200ms + fade-out 300ms) pode parecer abrupta. Melhorar para uma transição mais suave e visualmente agradável.

---

## Alterações

### 1. `vite.config.ts` — Deduplicar React completamente

Adicionar `"react/jsx-runtime"` ao array `dedupe` para evitar instâncias duplicadas que causam problemas de contexto e assets incorretos.

### 2. `src/components/SplashScreen.tsx` — Melhorar a transição

- Aumentar o hold para 600ms (total ~900ms) para uma transição mais premium
- Garantir que a logo `logo-linkou-roxo.png` está sendo importada corretamente via `@/assets/`

### 3. `src/index.css` — Animação mais suave

- Aumentar duração do fade-in para 400ms
- Adicionar animação de scale mais pronunciada na logo
- Fade-out mais suave (400ms)

### 4. Verificar/corrigir ícones do PWA

Os ícones em `public/icons/` precisam corresponder à logo da marca (`logo-linkou-roxo.png`). Se estiverem errados, copiar a logo correta para os ícones do manifest.

---

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `vite.config.ts` | Adicionar `"react/jsx-runtime"` ao `dedupe` |
| `src/components/SplashScreen.tsx` | Ajustar timings para transição mais suave (~900ms total) |
| `src/index.css` | Melhorar keyframes da splash (400ms fade, scale mais suave) |
| `public/icons/icon-192x192.png` | Copiar logo correta da marca |
| `public/icons/icon-512x512.png` | Copiar logo correta da marca |
| `public/icons/apple-touch-icon-180x180.png` | Copiar logo correta da marca |

## Detalhes Técnicos

### vite.config.ts
```typescript
dedupe: ["react", "react-dom", "react/jsx-runtime"],
```

### SplashScreen timings
```text
fade-in: 400ms (opacity 0→1, scale 0.85→1)
hold: 500ms
fade-out: 400ms (opacity 1→0)
Total: ~900ms (reduced-motion: 100ms)
```

### Ícones PWA
Copiar `src/assets/logo-linkou-roxo.png` para os três ícones em `public/icons/` para garantir que a logo da marca aparece corretamente no launcher Android/iOS. O manifest já referencia os paths corretos.

