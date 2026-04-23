

## Cache antigo travando navegadores logados — fix definitivo

### Diagnóstico (causa real)

A correção anterior do Service Worker está **correta no código**, mas tem um detalhe do ciclo de vida que está te travando:

1. **SW antigo continua no controle até todas as abas fecharem.** Mesmo com `skipWaiting()` + `clients.claim()`, o navegador só promove o novo SW depois que o usuário fecha 100% das abas do domínio. Como você mantém abas abertas, **continua pegando o SW antigo** que serve `index.html` cacheado da build velha.
2. **Tela preta ao abrir card novo:** o `index.html` velho referencia chunks JS com hash que **não existem mais** no servidor (build nova tem hashes diferentes). Resultado: `import()` de uma rota lazy falha → React quebra → tela preta. Não é bug de componente, é chunk 404.
3. **Aba anônima funciona** porque não tem SW antigo registrado.

A correção atual depende do usuário fechar tudo. Precisamos de uma estratégia que **force a saída do SW antigo na primeira visita** e **se recupere de chunks 404**.

### O que vou implementar

**1. Auto-unregister do SW + reload único (em `src/main.tsx`)**

Em vez de tentar manter o SW para push notifications a qualquer custo, vou **desregistrar o SW completamente** quando detectar a versão antiga ainda ativa, limpar todos os caches via `caches.keys()`, e recarregar a página **uma vez só** (com um flag em `sessionStorage` para não loop).

```ts
// pseudo
if ('serviceWorker' in navigator) {
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) await r.unregister();
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  if (!sessionStorage.getItem('linkou-sw-purged')) {
    sessionStorage.setItem('linkou-sw-purged', '1');
    location.reload();
  }
}
```

Depois do purge, **re-registro o SW novo** em produção (mantém push notifications funcionando).

**2. Recovery automático para chunks faltando (em `src/App.tsx`)**

Adicionar handler global para `window.addEventListener('error')` e `unhandledrejection` que detecta erros do tipo `Failed to fetch dynamically imported module` / `Loading chunk failed`. Quando acontece, limpa caches e dá `location.reload()` único — também guardado por `sessionStorage` para evitar loop.

```ts
// pseudo
window.addEventListener('error', (e) => {
  if (/Loading chunk|dynamically imported module/i.test(e.message)) {
    if (!sessionStorage.getItem('linkou-chunk-reloaded')) {
      sessionStorage.setItem('linkou-chunk-reloaded', '1');
      caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
        .finally(() => location.reload());
    }
  }
});
```

Isso resolve **a tela preta** em cards novos: quando o JS antigo tenta carregar um chunk que não existe mais, em vez de quebrar silenciosamente o app recarrega limpo e busca os chunks corretos.

**3. Meta tags anti-cache no `index.html`**

Adicionar no `<head>`:

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

Isso **não** afeta os assets com hash (que devem ser cacheados eternamente), mas instrui o navegador a **revalidar `index.html`** a cada visita — que é o arquivo que aponta para os chunks corretos da build atual. Hoje seu hosting pode estar cacheando `index.html` no navegador, o que perpetua o problema.

**4. Bump de versão no SW (em `public/sw.js`)**

Adicionar comentário de versão `// v3` no topo. Trocar bytes do arquivo é o que faz o navegador detectar "novo SW disponível" e disparar `install`. Sem isso, o navegador acha que o SW não mudou e ignora.

### Por que vai funcionar

- **Usuários travados na versão antiga**: ao abrir hoje, o `main.tsx` antigo carrega → mas a próxima vez que abrirem (ou se já tiverem o `main.tsx` novo carregado), o purge dispara → reload único → versão nova.
- **Navegadores que ainda peguem o SW antigo no primeiro load**: o handler de chunk-error captura a quebra e força reload limpo.
- **Cards novos abrindo em tela preta**: resolvido pelo recovery de chunk error.
- **A partir de agora**: meta tags anti-cache em `index.html` evitam que isso volte a acontecer.

### Arquivos modificados

- `src/main.tsx` — purge + re-registro condicional do SW
- `src/App.tsx` — handler global de erro de chunk
- `public/sw.js` — bump de versão (`// v3`) para forçar update detection
- `index.html` — meta tags anti-cache no `<head>`

### Sem mudanças

- Banco, RLS, lógica de auth, queries, rotas, componentes do Onboarding/Criativos.

### Após aplicar

Você (e qualquer usuário travado) vai abrir o app **uma vez**, ver um reload automático rapidíssimo (~1s), e depois disso fica na versão nova permanentemente. Aba anônima continua funcionando igual. Push notifications continuam funcionando.

