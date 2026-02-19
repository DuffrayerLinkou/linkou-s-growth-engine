
# Persistência da Conversa do Linkouzinho via localStorage

## Causa raiz

Todo o estado do chat é armazenado apenas em memória React (`useState`). No mobile, o navegador descarrega a página ao minimizar o app e a recarrega ao voltar — zerando completamente a conversa.

```text
Reload da página
      |
      v
useState inicializa com WELCOME_MESSAGE
      |
      v
Conversa perdida ❌
```

## Solução: persistência com localStorage

Salvar e restaurar os estados relevantes usando `localStorage`. Na inicialização, o componente lê os dados salvos em vez de começar do zero.

### Estados que serão persistidos

| Estado | Chave no localStorage | Motivo |
|---|---|---|
| `messages` | `linkouzinho_messages` | Histórico da conversa |
| `captureMode` | `linkouzinho_capture_mode` | Exibir form novamente se necessário |
| `captureSubmitted` | `linkouzinho_submitted` | Não pedir dados novamente |
| `whatsappUrl` | `linkouzinho_wa_url` | Exibir botão do WhatsApp após reload |
| `isOpen` | `linkouzinho_open` | Manter chat aberto se o usuário recarregar |

### Estados que NÃO serão persistidos (correto assim)

- `isStreaming` — sempre `false` após reload (stream interrompido)
- `input` — texto digitado não precisa persistir
- `captureLoading` — estado temporário de carregamento
- `hasUnread` — reseta para `false` se já havia conversa

### Padrão de implementação

**Inicialização com lazy initializer do useState:**
```typescript
// Leitura do localStorage só na montagem (lazy init — não re-executa em cada render)
const [messages, setMessages] = useState<Message[]>(() => {
  try {
    const saved = localStorage.getItem("linkouzinho_messages");
    return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
});
```

**Sincronização com useEffect:**
```typescript
// Toda vez que messages mudar, persistir
useEffect(() => {
  try {
    localStorage.setItem("linkouzinho_messages", JSON.stringify(messages));
  } catch {} // localStorage pode estar bloqueado em modo privado
}, [messages]);
```

**Lógica de `hasUnread`:**
Se existir conversa salva com mais de 1 mensagem, o badge de "não lido" começa como `false` (usuário já viu a conversa antes).

**Limpeza da sessão:**
Após `captureSubmitted = true` E o usuário clicar no botão do WhatsApp, a conversa pode ser limpa opcionalmente. Mas por padrão, mantemos o histórico. Para permitir uma nova conversa, adicionamos um botão discreto "Nova conversa" no header do chat que limpa o `localStorage` e reinicia o estado.

### Expiração automática (TTL)

Para evitar que uma conversa de 7 dias atrás apareça como se fosse de hoje, salvaremos também um timestamp. Se a conversa tiver mais de **24 horas**, ela é descartada e o bot recomeça do zero.

```typescript
const CHAT_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

const [messages, setMessages] = useState<Message[]>(() => {
  try {
    const saved = localStorage.getItem("linkouzinho_messages");
    const ts = localStorage.getItem("linkouzinho_ts");
    if (saved && ts && Date.now() - Number(ts) < CHAT_TTL_MS) {
      return JSON.parse(saved);
    }
  } catch {}
  return [WELCOME_MESSAGE];
});
```

## Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `src/components/landing/LinkouzinhoWidget.tsx` | Lazy initializers + useEffects de sincronização + TTL de 24h + botão "Nova conversa" |

Nenhuma edge function precisa ser alterada — o contexto da conversa já é enviado no corpo de cada requisição ao chat.

## Fluxo após a correção

```text
Usuário conversa com Linkouzinho
      |
      v
Cada mensagem é salva no localStorage automaticamente
      |
      v
Usuário recarrega a página / troca de app no celular
      |
      v
Widget lê localStorage na inicialização
      |
      v
Conversa restaurada integralmente ✅
      |
(se conversa > 24h)
      v
Nova sessão limpa automaticamente ✅
```
