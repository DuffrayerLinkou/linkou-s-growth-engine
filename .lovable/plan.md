
# Push Notifications para PWA

Sim, é totalmente possível! PWAs suportam **Web Push Notifications** que funcionam mesmo quando o app não está aberto.

## Requisitos Técnicos

| Componente | Descrição |
|---|---|
| **VAPID Keys** | Par de chaves públicas/privadas para autenticação |
| **Service Worker** | Adicionar listener para eventos `push` |
| **Tabela no Supabase** | Armazenar subscriptions dos usuários |
| **Edge Function** | Enviar notificações via Web Push API |
| **Frontend** | Solicitar permissão e gerenciar subscriptions |

## Fluxo do Usuário

```text
1. Usuário instala o PWA
2. App solicita permissão de notificação
3. Subscription é salva no Supabase (vinculada ao user_id)
4. Admin envia notificação via painel
5. Edge function dispara push para todas subscriptions ativas
```

## Implementação

### 1. `push_subscriptions` — Nova tabela

Campos: `id`, `user_id`, `endpoint`, `keys` (p256dh, auth), `created_at`. RLS: usuários gerenciam suas próprias subscriptions, admins podem enviar para todas.

### 2. `public/sw.js` — Adicionar push handler

Listener para `push` que exibe notificação nativa e `notificationclick` para abrir o app.

### 3. `src/hooks/usePushNotifications.ts` — Hook de subscription

Solicita permissão, gera subscription via `pushManager.subscribe()`, salva no Supabase.

### 4. `supabase/functions/send-push/index.ts` — Edge function

Recebe payload (título, mensagem, url), busca todas subscriptions ativas, envia via `web-push` library.

### 5. VAPID Keys

Será necessário gerar um par de chaves e configurar como secrets no Supabase (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

### 6. UI de envio

Adicionar botão/modal no painel admin para enviar notificações push para todos usuários ou segmentos específicos.

## Arquivos

| Arquivo | Ação |
|---|---|
| Migração SQL | Criar tabela `push_subscriptions` |
| `public/sw.js` | Adicionar handlers de push e notificationclick |
| `src/hooks/usePushNotifications.ts` | Criar hook de subscription |
| `src/components/PushNotificationPrompt.tsx` | UI para solicitar permissão |
| `supabase/functions/send-push/index.ts` | Edge function para enviar pushes |
| Secrets | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` |

## Limitações

- **iOS Safari**: Notificações push em PWAs só funcionam a partir do iOS 16.4+, e o usuário precisa adicionar à tela inicial
- **Permissão**: Usuário precisa aceitar notificações
- **HTTPS**: Obrigatório (já está ok)

