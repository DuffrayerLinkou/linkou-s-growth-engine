

# PWA Completa para Agência Linkou

## Resumo

Transformar a SPA existente em uma Progressive Web App instalavel, com suporte offline, cache inteligente e fluxo de instalacao nativo + iOS.

---

## Arquivos a Criar

### 1. `public/manifest.webmanifest`
Web App Manifest com nome, cores da marca (roxo primary `#7C3AED`), icons 192 e 512, display standalone, start_url `/`.

### 2. `public/sw.js`
Service Worker manual (sem dependencia de plugin Vite) com:
- **Estrategia stale-while-revalidate** para assets estaticos (JS, CSS, imagens, fontes)
- **Network-first** para navegacao (HTML) e requests de API (Supabase)
- **Fallback offline** — quando offline e sem cache, serve `/offline.html`
- Pre-cache do app shell no evento `install`
- Ignora requests de tracking (google-analytics, googleads, facebook, tiktok) para nao interferir

### 3. `public/offline.html`
Pagina HTML simples e estilizada com a marca Linkou informando que o usuario esta offline, com botao "Tentar novamente".

### 4. `public/icons/icon-192x192.png` e `public/icons/icon-512x512.png`
Icons PWA gerados a partir do logo existente (`favicon.png`). Como nao posso gerar PNGs binarios, vou usar SVG inline como fallback e documentar a geracao dos PNGs reais.

### 5. `src/hooks/usePWAInstall.ts`
Hook React que:
- Captura o evento `beforeinstallprompt` (Chrome/Edge/Android)
- Detecta iOS (Safari) e exibe instrucoes "Adicionar a Tela de Inicio"
- Detecta se ja esta instalado (`display-mode: standalone`)
- Expoe `{ canInstall, isInstalled, isIOS, promptInstall }`

### 6. `src/components/PWAInstallPrompt.tsx`
Componente visual com:
- Banner/toast discreto na landing page: "Instale o app Linkou"
- Botao que chama `promptInstall()` no Android/desktop
- Modal com instrucoes visuais para iOS (icone Share → "Adicionar a Tela de Inicio")
- Desaparece apos instalacao ou dismiss (salva no localStorage)

---

## Arquivos a Alterar

### 7. `index.html`
- Adicionar `<link rel="manifest" href="/manifest.webmanifest">`
- Adicionar `<meta name="theme-color" content="#7C3AED">`
- Adicionar `<meta name="apple-mobile-web-app-capable" content="yes">`
- Adicionar `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- Adicionar `<link rel="apple-touch-icon" href="/icons/icon-192x192.png">`

### 8. `src/main.tsx`
- Registrar o Service Worker **apenas em producao**:
```tsx
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 9. `src/pages/Index.tsx`
- Importar e renderizar `<PWAInstallPrompt />` na landing page

---

## Detalhes Tecnicos

### Service Worker — Estrategia de Cache

```text
Request Type        | Strategy                | Cache Name
--------------------|-------------------------|------------------
JS/CSS/fonts/images | Stale-while-revalidate  | linkou-assets-v1
HTML/navigation     | Network-first           | linkou-pages-v1
Supabase API        | Network-only            | (sem cache)
Tracking scripts    | Network-only (passthru) | (sem cache)
```

O SW nao faz cache de requests para `supabase.co`, `google-analytics`, `googletagmanager`, `facebook`, `tiktok` — garantindo que tracking e dados em tempo real nao sejam afetados.

### Manifest

```json
{
  "name": "Agência Linkou",
  "short_name": "Linkou",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0F",
  "theme_color": "#7C3AED",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### Icons PWA

Como nao e possivel gerar binarios PNG diretamente, vou criar os icons usando SVG convertido via canvas no build, ou usar o `favicon.png` existente redimensionado. Na pratica, criarei um script simples ou usarei o favicon como placeholder nos tamanhos corretos.

### Hook `usePWAInstall`

```tsx
// Captura beforeinstallprompt
// Detecta iOS via userAgent
// Detecta standalone via matchMedia('(display-mode: standalone)')
// Persiste dismiss no localStorage por 7 dias
```

### Checklist PWA

| Requisito | Status |
|---|---|
| HTTPS | Lovable serve em HTTPS |
| Manifest linkado | Sera adicionado ao `index.html` |
| Service Worker registrado | Sera adicionado ao `main.tsx` |
| Icons 192 + 512 | Serao criados em `/public/icons/` |
| theme-color no HTML | Sera adicionado |
| Responde 200 offline | SW serve cache ou `offline.html` |
| SPA routing (refresh 200) | Ja funciona (Lovable/hosting SPA) |
| Tracking preservado | SW ignora domains de tracking |

---

## Ordem de Implementacao

1. Criar icons placeholder e manifest
2. Criar `offline.html`
3. Criar `sw.js` com estrategias de cache
4. Atualizar `index.html` com meta tags PWA
5. Atualizar `main.tsx` com registro do SW
6. Criar `usePWAInstall` hook
7. Criar `PWAInstallPrompt` componente
8. Adicionar prompt na `Index.tsx`

