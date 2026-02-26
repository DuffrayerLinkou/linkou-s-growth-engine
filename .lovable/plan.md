

# Correção Completa PWA: Instalação, Segurança e Splash Screen

## Diagnóstico dos Problemas Atuais

1. **Android "aviso de risco"**: O manifest não tem `id` nem `scope`, o que pode confundir o Chrome. O SW pre-cacheia `/` mas o `start_url` é `/auth` — inconsistência que pode causar falha na verificação de installability.
2. **"Instalou mas não aparece"**: Sem `scope` explícito e sem `id` no manifest, o Chrome pode criar instalações "fantasma". O SW não pre-cacheia `/auth`, então o `start_url` pode não retornar 200 offline.
3. **iOS não instala corretamente**: Falta `apple-mobile-web-app-title` e o `apple-touch-icon` aponta para 192px (deveria ser 180px dedicado). O comportamento de "Adicionar à Tela de Início" depende dessas tags.
4. **Splash Screen atual**: Usa `framer-motion` (pesado), dura 2.4s (lento), e depende de JS carregar para exibir — pode causar flash branco. Precisa ser mais leve e rápida.

---

## Plano de Alterações

### 1. `public/manifest.webmanifest` — Manifest completo e correto

- Adicionar `"id": "/auth"` (identidade estável para evitar instalação duplicada)
- Adicionar `"scope": "/"`
- Manter `start_url: "/auth?source=pwa"`
- Manter `display: "standalone"`
- Cores consistentes (`theme_color: #7C3AED`, `background_color: #0A0A0F`)
- Ícones separados `any` e `maskable` (já feito)

### 2. `public/icons/apple-touch-icon-180x180.png` — Novo ícone iOS

- Copiar a logo do usuário como ícone 180x180 dedicado para iOS (será o mesmo asset da logo já enviada, referenciado no `<head>`)

### 3. `index.html` — Tags iOS completas e meta segurança

Adicionar/corrigir:
- `<meta name="apple-mobile-web-app-title" content="Linkou">`
- `<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png">`
- `<meta http-equiv="X-Content-Type-Options" content="nosniff">`
- `<meta name="referrer" content="strict-origin-when-cross-origin">`

### 4. `public/sw.js` — Service Worker mais seguro

- Incrementar `CACHE_VERSION` para `v2` (forçar atualização)
- Pre-cachear `/auth` em vez de `/` (alinhar com `start_url`)
- Adicionar limpeza mais agressiva de caches antigos
- Manter network-first para navegação e stale-while-revalidate para assets

### 5. `src/components/SplashScreen.tsx` — Splash leve com CSS puro

Reescrever completamente:
- **Remover dependência de `framer-motion`** — usar CSS animations puras
- Duração total: ~800ms (fade-in 300ms + hold 200ms + fade-out 300ms)
- Respeitar `prefers-reduced-motion` (sem animação, apenas flash rápido)
- Logo centralizada com fade + scale suave
- Detectar standalone da mesma forma (matchMedia + navigator.standalone)
- Children são renderizados imediatamente (splash é overlay)

### 6. `src/main.tsx` — Registro de SW melhorado

- Adicionar tratamento de atualização do SW (quando nova versão disponível, recarregar)

### 7. Rota `/auth` — Sem alteração funcional

A rota `/auth` já existe e retorna 200 (SPA com client-side routing). O Auth.tsx já tem o botão de instalação iOS.

---

## Detalhes Técnicos

### Manifest final
```json
{
  "name": "Agência Linkou",
  "short_name": "Linkou",
  "description": "Ecossistemas de tráfego e vendas que aprendem e evoluem.",
  "id": "/auth",
  "start_url": "/auth?source=pwa",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0A0A0F",
  "theme_color": "#7C3AED",
  "orientation": "portrait-primary",
  "icons": [...]
}
```

### SplashScreen CSS-only (sem framer-motion)
```text
Abertura do PWA:
  → Overlay escuro (#0A0A0F) com logo
  → CSS: opacity 0→1 + scale 0.85→1 em 300ms
  → Segura 200ms
  → CSS: opacity 1→0 em 300ms
  → Remove overlay, mostra /auth
  Total: ~800ms

prefers-reduced-motion:
  → Mostra overlay 100ms sem animação
  → Remove
```

### SW v2 pre-cache
```text
install → cache: ['/offline.html', '/auth']
activate → limpa caches que não são v2
fetch → navigation: network-first → cache → offline.html
fetch → assets: stale-while-revalidate
```

### Tags `<head>` iOS
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Linkou">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png">
```

---

## Arquivos Alterados

| Arquivo | Ação |
|---|---|
| `public/manifest.webmanifest` | Adicionar `id`, `scope`, ajustar `start_url` |
| `public/icons/apple-touch-icon-180x180.png` | Criar (copiar logo da marca) |
| `index.html` | Tags iOS completas + headers de segurança |
| `public/sw.js` | v2, pre-cache `/auth`, limpeza melhorada |
| `src/components/SplashScreen.tsx` | Reescrever com CSS puro, 800ms, respeitar reduced-motion |
| `src/main.tsx` | SW update handling |

---

## Checklist Final

```text
[ ] GET /manifest.webmanifest → 200 (com id, scope, start_url corretos)
[ ] GET /icons/icon-192x192.png → 200
[ ] GET /icons/icon-512x512.png → 200
[ ] GET /icons/apple-touch-icon-180x180.png → 200
[ ] Ícones maskable com safe padding
[ ] Android: instala sem aviso de risco
[ ] Android: após instalar, aparece no launcher
[ ] iOS: "Adicionar à Tela de Início" funciona com ícone correto
[ ] Abrir pelo ícone: splash 800ms → /auth
[ ] prefers-reduced-motion respeitado
[ ] SW network-first para navegação (sem tela branca)
[ ] Sem mixed content (tudo HTTPS)
[ ] Sem dependência de framer-motion no splash
```

