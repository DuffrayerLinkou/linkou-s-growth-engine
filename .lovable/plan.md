Identifiquei dois problemas principais no Linkouzinho interno:

1. Em alguns retornos do Lovable AI, a segunda chamada de confirmação ainda tenta chamar uma ferramenta (`tool_calls`) mesmo sem ferramentas habilitadas nessa etapa. O frontend hoje ignora esse tipo de evento porque não vem texto (`delta.content`), então parece que ele “carrega e não responde”.
2. Algumas ações que ele afirma executar não existem nas ferramentas atuais. Exemplo visto no histórico: envio de e-mail transacional. Ele respondeu como se tivesse enviado, mas `assistant-chat` não tem ferramenta de envio de e-mail. Isso precisa ser bloqueado ou implementado corretamente.

## Plano de correção

### 1. Tornar o chat à prova de resposta vazia
- No frontend (`LinkouzinhoInternal.tsx`), detectar quando a stream termina sem nenhum texto útil.
- Mostrar uma mensagem amigável em vez de ficar sem retorno, por exemplo: “Não consegui finalizar essa ação. Tente novamente ou detalhe melhor o pedido.”
- Tratar eventos de stream que chegam como `tool_calls` inesperados, para não sumirem silenciosamente.
- Corrigir o aviso de React sobre `ref` no `ScrollArea`, separando o ref da viewport/scroll do ref do componente.

### 2. Corrigir o fluxo de ferramentas no backend
- Em `assistant-chat`, na etapa final depois de executar ferramentas, forçar o modelo a responder apenas com texto, sem novas chamadas de ferramenta.
- Se mesmo assim vier resposta sem conteúdo, retornar uma confirmação determinística baseada no resultado das ferramentas executadas.
- Adicionar timeouts/abort control nas chamadas para Lovable AI e embeddings para evitar espera infinita.
- Padronizar erros 402/429/500 com mensagens claras para o usuário.

### 3. Evitar falsas execuções
- Ajustar o prompt do Linkouzinho para nunca dizer que executou algo se não houve ferramenta real executada com sucesso.
- Quando o pedido exigir uma ferramenta inexistente (como “enviar e-mail”), ele deve responder que ainda não tem essa ação disponível, em vez de simular.
- Registrar falhas em `client_actions` com mensagem curta e rastreável.

### 4. Opcional, mas recomendado: adicionar ferramenta real de e-mail transacional
Como vocês já têm Resend, `notify-email` e templates, posso adicionar uma ferramenta segura no `assistant-chat` para disparar avisos operacionais, começando por:
- `send_campaign_approval_email`
- Busca destinatários do cliente: ponto focal, managers e usuários vinculados.
- Usa layout padrão Linkou via `notify-email`/template existente.
- Permite ao Linkouzinho dizer “enviei” somente quando a função confirmar sucesso.

### 5. Validação
- Testar os casos que hoje travam:
  - pedido de preencher palavras-chave a partir de uma planilha;
  - pedido que tenta ler arquivo/documento;
  - pedido de ação não suportada;
  - pedido com ferramenta executada e confirmação final.
- Conferir logs da Edge Function `assistant-chat` após as chamadas.

## Arquivos previstos
- `supabase/functions/assistant-chat/index.ts`
- `src/components/LinkouzinhoInternal.tsx`
- Possivelmente `supabase/functions/notify-email/index.ts` se formos adicionar o disparo real de e-mail
- Memória operacional do projeto para registrar que o Linkouzinho não deve simular execução de ações sem ferramenta real

## Resultado esperado
O Linkouzinho deve sempre dar retorno claro: ou executa e confirma, ou explica por que não conseguiu. Ele não deve mais ficar apenas carregando, nem afirmar que fez uma ação que não foi executada.