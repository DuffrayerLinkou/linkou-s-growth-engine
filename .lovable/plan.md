

# Corrigir: Banner de instalação PWA não reaparece após fechar

## Problema

Quando o usuário fecha o banner "Instale o app Linkou", o hook `usePWAInstall` salva um timestamp no `localStorage` com a chave `linkou-pwa-dismiss`. Isso faz o banner sumir por **7 dias**. No iPhone do usuário, o banner já foi dispensado e não volta mais.

## Solução

Duas melhorias:

### 1. Reduzir o tempo de dismiss de 7 dias para 1 dia
Assim, se o usuário fechar sem querer, o banner volta no dia seguinte.

### 2. Adicionar botão "Instalar App" fixo no menu/header
Independente do banner ter sido fechado, o usuário sempre terá acesso a um botão para instalar. Isso resolve o problema de forma permanente — o banner é apenas um lembrete, mas o botão no layout está sempre disponível.

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `src/hooks/usePWAInstall.ts` | Reduzir `DISMISS_DAYS` de 7 para 1 |
| `src/components/landing/Header.tsx` | Adicionar botão "Instalar App" visível no header quando `showIOSPrompt` ou `canInstall` for true |

## Solução Imediata (para o iPhone do usuário agora)

Para resolver **agora** no iPhone onde já foi dispensado: basta abrir o site no Safari, ir em **Ajustes do Safari → Limpar Dados de Sites** (ou abrir em aba anônima) e o banner reaparecerá. Mas com a mudança acima, bastará esperar 1 dia.

## Detalhes Técnicos

**`usePWAInstall.ts`** — linha 9:
```ts
const DISMISS_DAYS = 1; // era 7
```

**`Header.tsx`** — adicionar um item de menu discreto:
```tsx
import { usePWAInstall } from "@/hooks/usePWAInstall";
// No componente, renderizar um botão "Instalar App" com ícone Download
// quando canInstall || showIOSPrompt for true
```

