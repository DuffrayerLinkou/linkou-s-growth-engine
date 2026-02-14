

# Corrigir Tabs da Landing Page - Mostrar Nomes Sempre

## Problema
As abas da Landing Page estao mostrando apenas icones sem os nomes dos itens, tornando impossivel saber o que cada aba faz. O `hidden sm:inline` esconde os textos em telas que nao sao "sm" (640px+), mas como a pagina admin ja tem a sidebar de 256px, a area util fica menor e os nomes somem.

## Solucao
Remover o `hidden sm:inline` dos textos e manter a `TabsList` com scroll horizontal (`overflow-x-auto`). Assim os nomes sempre aparecem e, se nao couberem, o usuario pode rolar horizontalmente.

## Mudancas

**Arquivo:** `src/pages/admin/LandingPage.tsx`

- Remover `hidden sm:inline` de todos os 6 `<span>` dentro dos `TabsTrigger`
- Manter o `overflow-x-auto` na `TabsList` para scroll horizontal quando necessario
- Reduzir o texto "UTM Builder" para "UTM" e "Checklist" para "Check" para economizar espaco

Resultado: todas as abas sempre mostram icone + nome, com scroll horizontal se a tela for muito estreita.
