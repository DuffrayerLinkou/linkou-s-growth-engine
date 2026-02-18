
# Linkouzinho — Botão Amarelo + Diálogo Humanizado

## Problema atual

- O botão flutuante usa `bg-primary` (roxo) no círculo de fundo do avatar — precisa mudar para amarelo
- O system prompt instrui respostas de "máximo 3-4 parágrafos", o que gera blocos de texto longos, impessoais e nada conversacionais
- O bot entrega todas as informações de uma vez, sem deixar o usuário respirar e interagir

---

## O que será alterado

### 1. `LinkouzinhoWidget.tsx` — Botão amarelo

O botão flutuante tem `bg-primary` como classe de fundo. Será substituído por `bg-yellow-400` com anel de foco também amarelo. A animação `pulse-slow` será ajustada para usar amarelo.

Trecho atual:
```tsx
"bg-primary p-0 overflow-visible",
"focus:ring-4 focus:ring-primary/30"
```

Trecho novo:
```tsx
"bg-yellow-400 p-0 overflow-visible",
"focus:ring-4 focus:ring-yellow-400/40"
```

A animação `pulse-slow` no `tailwind.config.ts` também será ajustada para usar `yellow-400` em vez de `primary`, garantindo que o glow de pulso seja amarelo.

---

### 2. `linkouzinho-chat/index.ts` — System prompt humanizado

O prompt atual permite respostas longas e estruturadas (listas, múltiplos parágrafos). O novo prompt vai forçar o bot a se comportar como uma conversa de WhatsApp:

**Regras novas no prompt:**
- Máximo **2 frases curtas por mensagem** — sem paredes de texto
- **Nunca liste tudo de uma vez** — apresente um serviço por vez, pergunte se quer saber mais
- **Faça perguntas** ao final de cada resposta para manter o diálogo vivo
- **Tom de WhatsApp** — informal, quente, sem formatação excessiva de markdown
- Use markdown **só quando o usuário pedir uma lista explicitamente**
- Em vez de despejar o portfólio completo, **descubra o contexto do usuário primeiro** (segmento, dor, objetivo)
- Reaja ao que o usuário disse antes de dar informação nova

**Exemplo de comportamento atual (problema):**
```
Usuário: "O que vocês fazem?"
Bot: [3 parágrafos + 4 serviços listados + metodologia de 4 fases]
```

**Exemplo do novo comportamento (objetivo):**
```
Usuário: "O que vocês fazem?"
Bot: "A gente ajuda negócios a vender mais usando consultoria, tráfego e vendas de forma integrada 🚀
     Você tem algum negócio específico em mente ou está pesquisando ainda?"
```

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/landing/LinkouzinhoWidget.tsx` | `bg-primary` → `bg-yellow-400` + `ring-primary` → `ring-yellow-400` |
| `tailwind.config.ts` | Keyframe `pulse-slow` com cor amarela |
| `supabase/functions/linkouzinho-chat/index.ts` | System prompt reescrito para conversa curta e humanizada |

---

## Deploy

A edge function `linkouzinho-chat` precisará ser re-deployada após a mudança no system prompt.
