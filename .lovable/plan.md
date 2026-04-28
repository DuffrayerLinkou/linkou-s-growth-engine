Você não sobrecarregou o Linkouzinho. O que está acontecendo é um problema técnico no fluxo dele: a Edge Function retorna status 200, mas a stream vem com `finish_reason: MALFORMED_FUNCTION_CALL` e `content: ""`. Como não chega texto real, o frontend mostra a mensagem genérica de “IA pode ter sobrecarregado”. Também vi no histórico que ele tentou continuar uma ação de e-mail sem ter uma ferramenta real de envio habilitada, o que aumenta a chance de chamada malformada.

## Plano de correção

### 1. Impedir resposta vazia no backend
- Em `assistant-chat`, substituir o repasse cru da stream final por um wrapper de SSE.
- Esse wrapper vai monitorar se chegou algum conteúdo útil.
- Se a IA retornar `MALFORMED_FUNCTION_CALL`, `finish_reason: error`, ou terminar sem texto, o backend não deixará isso chegar vazio ao chat.
- Em vez disso, retornará uma mensagem operacional baseada no resultado real das ferramentas executadas, por exemplo:
  - tarefa criada com sucesso;
  - e-mail enviado com sucesso;
  - ação não executada e motivo claro.

### 2. Criar fallback operacional de verdade
- Reforçar o fallback determinístico já existente para cobrir também streams que começam corretamente, mas terminam sem conteúdo.
- Quando houver tool executada, a resposta final será montada a partir do resultado da tool, sem depender de uma segunda chamada à IA.
- Quando não houver tool executada, retornar uma orientação clara: “não consegui concluir essa resposta; nenhuma ação foi executada”.

### 3. Reduzir risco de contexto quebrado
- Sanitizar o histórico enviado ao modelo:
  - limitar mensagens muito longas;
  - remover mensagens assistentes claramente incompletas/vazias;
  - reduzir o histórico operacional enviado para evitar que uma resposta interrompida contamine a próxima chamada.
- Isso mantém memória suficiente sem arrastar respostas quebradas como a que aparece no log terminando em “Missão cumprida por”.

### 4. Tornar o Linkouzinho operacional para e-mail transacional
- Adicionar uma ferramenta real no `assistant-chat`: `send_campaign_approval_email`.
- Essa ferramenta só poderá ser usada por admin/equipe interna.
- Ela buscará campanhas em `pending_approval` do cliente atual e enviará aviso pelo fluxo existente de e-mail transacional.
- Usará o template já existente de “campanha aguardando aprovação”.
- O Linkouzinho só poderá dizer “enviei” se a ferramenta retornar sucesso.

### 5. Melhorar destinatários do aviso
- Ajustar o envio para alcançar corretamente:
  - ponto focal;
  - gestores do cliente;
  - opcionalmente usuários vinculados ao cliente quando o pedido disser “todos os usuários”.
- Evitar envio duplicado para o mesmo e-mail.
- Retornar ao chat quantos destinatários receberam o aviso e quais campanhas foram incluídas.

### 6. Melhorar o feedback no frontend
- Trocar a mensagem atual de “IA pode ter sobrecarregado” por algo menos confuso e mais acionável.
- Exemplo:
  - “Não recebi uma resposta válida da IA. Nenhuma ação foi confirmada. Tente novamente ou peça uma ação mais específica.”
- Se o backend enviar erro estruturado ou fallback operacional, mostrar esse texto diretamente.

## Arquivos previstos
- `supabase/functions/assistant-chat/index.ts`
- `supabase/functions/notify-email/index.ts` se for necessário ampliar o evento de campanha para mais destinatários
- `supabase/functions/_shared/email-templates.ts` se precisarmos de um template agregado para várias campanhas
- `src/components/LinkouzinhoInternal.tsx`
- Memória operacional do Linkouzinho para registrar que respostas vazias/erro de tool call devem sempre virar retorno operacional claro

## Resultado esperado
O Linkouzinho deve parar de responder frequentemente com “não recebi resposta”. Mesmo quando a IA falhar, ele vai retornar algo útil e rastreável. E para ações como avisar o ponto focal sobre campanhas aguardando aprovação, ele terá uma ferramenta real: envia o e-mail, registra a ação e confirma somente se realmente executou.