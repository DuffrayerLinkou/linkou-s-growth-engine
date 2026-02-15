
# Corrigir Envio de Email de Boas-Vindas

## Problema

A pagina de detalhe do cliente cria usuarios usando `supabase.auth.signUp()` direto no frontend (linha 539 de `ClientDetail.tsx`). Isso causa dois problemas:

1. O Supabase envia o email padrao de confirmacao do remetente `noreply@mail.app.supabase.io` -- que cai na lixeira/spam
2. A edge function `manage-users` (que tem o email bonito via Resend) nunca e chamada

## Solucao

Alterar `ClientDetail.tsx` para chamar a edge function `manage-users` com action `create-user`, em vez de usar `supabase.auth.signUp()` direto. Assim:

- O usuario e criado via Admin API (email ja confirmado automaticamente, sem email do Supabase)
- O email de boas-vindas personalizado e enviado via Resend (remetente `contato@agencialinkou.com.br`)
- O email chega na caixa de entrada, nao na lixeira

```text
Fluxo atual (com problema):
  ClientDetail.tsx -> supabase.auth.signUp() -> email padrao do Supabase (lixeira)

Fluxo corrigido:
  ClientDetail.tsx -> manage-users (create-user) -> email Resend personalizado (caixa de entrada)
```

## Mudancas tecnicas

### Arquivo: `src/pages/admin/ClientDetail.tsx`

Substituir o bloco `handleCreateUser` (linhas 538-561) para:

1. Chamar `supabase.functions.invoke("manage-users", { body: { action: "create-user", email, password, full_name, role: "client", client_id } })`
2. Usar o ID do usuario retornado para atualizar `ponto_focal` e `user_type` no profile
3. Manter a logica de `set_ponto_focal` via RPC

### Arquivo: `supabase/functions/manage-users/index.ts`

Verificar se a action `create-user` ja retorna o ID do usuario criado na resposta (necessario para o frontend atualizar o profile com `ponto_focal` e `user_type`). Ajustar se necessario.

## Resultado esperado

- Admin cria usuario na pagina do cliente
- Email de boas-vindas profissional chega via Resend com credenciais
- Nenhum email padrao do Supabase e enviado
- Usuario ja chega com email confirmado
