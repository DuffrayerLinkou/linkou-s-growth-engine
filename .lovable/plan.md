

## Auditoria: cache antigo + performance

### Diagnóstico — causa raiz confirmada

**Você tem um Service Worker (SW) ativo em produção** (`public/sw.js`) que está servindo a versão antiga da aplicação. Isso explica 100% do sintoma:

- Em navegadores normais → SW cacheado serve build antiga (`linkou-assets-v2`, `linkou-pages-v2`).
- Em aba anônima → sem SW registrado, sem cache → versão atual.

**Por que o auto-update não funciona:**

1. `sw.js` está versionado manualmente (`CACHE_VERSION = 'v2'`). Como esse número **não muda a cada deploy**, o navegador considera o SW idêntico, **não dispara `updatefound`** e o `window.location.reload()` em `main.tsx` nunca roda.
2. O SW intercepta navegações com `networkFirst`, mas em caso de sucesso ele **substitui o HTML em cache** — porém o HTML já carregado em memória continua referenciando hashes de JS/CSS antigos, que vêm do `ASSETS_CACHE` via `staleWhileRevalidate` (serve cacheado primeiro, atualiza em segundo plano → próxima visita).
3. Resultado: precisa de **2-3 reloads** para pegar a versão nova, e mesmo assim chunks antigos podem ficar presos.

**Pontos secundários de peso/lentidão:**

- Service Worker não traz benefício real aqui (app é 100% autenticada, sem uso offline declarado), mas adiciona complexidade e bugs de cache.
- Bundle: 40+ rotas lazy-loaded (bom), mas `Index`, `Auth` e `App.tsx` carregam eager + Toaster + Sonner + Splash + 2 prompts PWA imediatamente.
- React Query com `staleTime: 5min` está OK. Não é a causa.

### Correção — abordagem recomendada

**Opção escolhida: remover o Service Worker** (manter PWA "instalável" via manifest, sem SW).

Justificativa:
- Você não usa offline real (todas as queries vão para Supabase, que está no `BYPASS_DOMAINS` do SW de qualquer forma → SW não acelera nada de dado).
- Push notifications **não exigem** o SW de cache de assets — basta um SW dedicado e mínimo só para `push`/`notificationclick`.
- Manifest + ícones continuam → app continua instalável (Add to Home Screen).
- Elimina 100% do problema de cache antigo, agora e no futuro.

### O que vou fazer

**1. Substituir `public/sw.js` por uma versão mínima**
- Remove todo cache de assets/páginas (`ASSETS_CACHE`, `PAGES_CACHE`, `staleWhileRevalidate`, `networkFirst`).
- Mantém apenas os handlers de `push`, `notificationclick`, `notificationclose` (push notifications continuam funcionando).
- No `install`/`activate`: `skipWaiting` + `clients.claim` + **deleta TODOS os caches antigos** (`linkou-assets-*`, `linkou-pages-*`) → primeira visita após o deploy limpa o cache acumulado de todos os usuários automaticamente.

**2. Ajustar `src/main.tsx`**
- Mantém o registro do SW (necessário para push), mas remove o handler de `updatefound`/reload (não precisa mais — não há cache de assets para invalidar).
- Adiciona `reg.update()` no load para forçar verificação de SW novo.

**3. Adicionar headers no `index.html`**
- `<meta http-equiv="Cache-Control" content="no-cache">` no HTML para garantir que o documento principal sempre revalide (a Vercel/Lovable já faz isso para `index.html`, mas reforça).

**4. Comunicar ao usuário (você)**
- Após o deploy, na **primeira visita** de cada navegador, o SW novo vai limpar o cache antigo e recarregar. Pode ser preciso **um único reload manual** em cada browser que já tem o SW antigo cacheado, mas a partir dali o problema some para sempre.
- Alternativa imediata se quiser forçar agora: DevTools → Application → Service Workers → **Unregister** + Clear storage.

### Impacto e risco

| Item | Antes | Depois |
|---|---|---|
| Versão sempre atualizada | ❌ (cache trava) | ✅ |
| Push notifications | ✅ | ✅ |
| App instalável (PWA) | ✅ | ✅ |
| Offline | ⚠️ parcial e quebrado | ❌ (não usa mesmo) |
| Tela de offline.html | ✅ | ❌ removida |

**Risco**: baixíssimo. A página `/offline.html` deixa de ser servida, mas só aparecia quando o usuário estava offline (caso raro num app que depende 100% de Supabase online).

### Sobre "lentidão em anônimo"

A primeira carga em anônimo é naturalmente mais lenta porque:
- Não tem nenhum asset cacheado (cache HTTP normal do browser).
- Carrega Inter font + chunks lazy + Supabase auth bootstrap em paralelo.

Após esse primeiro fix, posso fazer um segundo passe de performance se ainda achar lento (analisar bundle size, mover Toaster/Sonner para depois do mount, preconnect para Supabase, etc). Mas **primeiro resolvemos o cache** — é o problema real que você está vivendo.

### Arquivos a modificar

- `public/sw.js` — reescrito (mínimo, só push)
- `src/main.tsx` — simplificar registro

### Sem mudanças

- `manifest.webmanifest`, ícones, rotas, lógica de auth, queries, banco.

