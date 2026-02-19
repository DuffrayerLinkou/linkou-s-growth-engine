
# Correção da Navegação — ClientLayout Desktop

## Diagnóstico dos problemas encontrados

### Problema 1 — Botão "Sair" oculto (CRÍTICO)
**Arquivo:** `src/layouts/ClientLayout.tsx`, linha 145

```tsx
// ATUAL — sem overflow, nav expande indefinidamente
<nav className="flex-1 p-4 space-y-1">

// ADMIN (correto) — tem overflow-y-auto
<nav className="flex-1 p-4 space-y-1 overflow-y-auto">
```

A sidebar tem `h-full` e layout `flex flex-col`. A `<nav>` usa `flex-1` para ocupar o espaço disponível. Sem `overflow-y-auto`, quando o conteúdo dos 10 itens de menu supera a altura da janela (comum em telas de 768px–900px de altura), o `<nav>` transborda e empurra o footer com o botão "Sair" para além da viewport. O usuário não consegue clicar em "Sair" sem redimensionar a janela.

O `AdminLayout` já tem `overflow-y-auto` na nav (linha 180) — foi corrigido lá em algum momento mas a correção não foi aplicada ao `ClientLayout`.

**Correção:** Adicionar `overflow-y-auto` na `<nav>` do ClientLayout.

---

### Problema 2 — Item de menu ativo não detecta sub-rotas
**Arquivo:** `src/layouts/ClientLayout.tsx`, linha 147

```tsx
// ATUAL — só marca ativo em match exato
const isActive = location.pathname === item.href;

// CORRETO — marca ativo também para sub-rotas
const isActive = location.pathname === item.href || 
  (item.href !== "/cliente" && location.pathname.startsWith(item.href));
```

Se o usuário navega para `/cliente/agendamentos` e há sub-rotas futuras (ex: `/cliente/agendamentos/123`), o item do menu não fica destacado. O Dashboard (`/cliente`) precisa de match exato para não ficar sempre ativo — os demais devem usar `startsWith`.

**Correção:** Substituir a comparação de igualdade estrita por lógica `startsWith` com exceção para o item raiz.

---

### Problema 3 — Sidebar sem scroll visual no mobile
**Arquivo:** `src/layouts/ClientLayout.tsx`, linha 90-94

A sidebar mobile (`-translate-x-full` / `translate-x-0`) também não tem `overflow-y-auto` no container interno. Em celulares com tela pequena (iPhone SE, 568px de altura), os itens do final da lista ficam cortados mesmo com a sidebar aberta.

**Correção:** Aplicar `overflow-y-auto` no `<div className="flex flex-col h-full">` inner, já garantido pela correção do Problema 1 (a mesma `<nav>` com `overflow-y-auto` resolve ambos os casos).

---

## Resumo das alterações

| # | Arquivo | Linha | Mudança |
|---|---|---|---|
| 1 | `ClientLayout.tsx` | 145 | Adicionar `overflow-y-auto` na `<nav>` |
| 2 | `ClientLayout.tsx` | 147 | Corrigir detecção de rota ativa com `startsWith` |

Apenas **1 arquivo** modificado, **2 linhas** alteradas. Impacto zero em funcionalidade — correções puramente de layout e UX.
