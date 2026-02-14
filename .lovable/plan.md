

# Responsividade: WhatsApp e Landing Page (Admin)

## Problemas Identificados

### WhatsApp (`/admin/whatsapp`)
- O layout de conversas usa `flex` com a lista fixa em `w-[320px]` + area de chat lado a lado. Em telas menores que ~700px, os dois elementos vazam para fora da tela
- Em mobile, o padrao correto e mostrar **ou** a lista de conversas **ou** a janela de chat (como o WhatsApp real funciona)
- As tabs "Conversas / Disparo em Massa / Configuracoes" tambem podem ficar apertadas

### Landing Page (`/admin/landing`)
- A `TabsList` com 6 abas (Pixels, Google, SEO, UTM Builder, Scripts, Checklist) pode vazar horizontalmente em telas pequenas mesmo com `overflow-x-auto`, pois o container pai nao tem `max-width` limitado
- Textos longos nos labels das abas ocupam espaco desnecessario em mobile

---

## Solucao

### 1. WhatsApp - Layout Mobile/Desktop Adaptativo

**Arquivo:** `src/pages/admin/WhatsApp.tsx`

- Importar `useIsMobile` de `@/hooks/use-mobile`
- Em mobile: mostrar apenas a lista de conversas quando nenhuma conversa esta selecionada, e apenas o chat quando uma conversa e selecionada (com botao "Voltar" no header do chat)
- Em desktop: manter o layout lado a lado atual
- Reduzir a largura da lista de `w-[320px]` para `w-[280px]` em telas medias
- Ajustar `h-[calc(100vh-220px)]` para funcionar melhor em mobile com `h-[calc(100vh-180px)]` ou similar

**Arquivo:** `src/components/admin/whatsapp/ChatWindow.tsx`

- Adicionar prop `onBack` opcional para o botao voltar em mobile
- Mostrar botao de voltar (seta) no header quando `onBack` e fornecido

**Arquivo:** `src/components/admin/whatsapp/ConversationList.tsx`

- Nenhuma mudanca estrutural necessaria (ja responsivo internamente)

### 2. Landing Page - Tabs Responsivas

**Arquivo:** `src/pages/admin/LandingPage.tsx`

- Adicionar `max-w-full overflow-hidden` no container pai para evitar vazamento
- Em mobile, esconder os textos das abas e mostrar apenas os icones (usando classes `hidden sm:inline` nos `<span>`)
- Adicionar `min-w-0` no container para permitir que o `overflow-x-auto` funcione corretamente

---

## Detalhes Tecnicos

### WhatsApp - Mudancas no layout de conversas:

```
// Mobile: alterna entre lista e chat
// Desktop: lado a lado (comportamento atual)

Mobile (< 768px):
  selectedPhone == null  ->  mostra ConversationList (tela cheia)
  selectedPhone != null  ->  mostra ChatWindow (tela cheia) com botao Voltar

Desktop (>= 768px):
  Layout flex atual com lista lateral + chat
```

### Landing Page - Tabs so com icones em mobile:

Cada `TabsTrigger` tera o texto dentro de `<span className="hidden sm:inline">`:
- Mobile: mostra apenas o icone (compacto)
- Desktop: mostra icone + texto (como esta hoje)

### Arquivos alterados:
1. `src/pages/admin/WhatsApp.tsx` - layout condicional mobile/desktop
2. `src/components/admin/whatsapp/ChatWindow.tsx` - prop `onBack` + botao voltar
3. `src/pages/admin/LandingPage.tsx` - tabs responsivas com icones-only em mobile

