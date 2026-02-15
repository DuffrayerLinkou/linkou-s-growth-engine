

# Integracao Resend - Envio de Emails

## O que sera feito

Criar uma edge function `send-email` que usa a API do Resend para enviar emails a partir do dominio `agencialinkou.com.br`, e integrar nos fluxos existentes (notificacao de leads, etc).

## Pre-requisito: Adicionar o Secret

Antes de implementar, preciso adicionar o secret `RESEND_API_KEY` ao projeto. Isso sera feito via ferramenta de secrets do Lovable no momento da implementacao.

## Mudancas

### 1. Adicionar secret `RESEND_API_KEY`

Solicitar ao usuario que cole a API Key do Resend quando o campo aparecer.

### 2. Nova Edge Function `send-email`

**Arquivo:** `supabase/functions/send-email/index.ts`

Funcao generica de envio de email via Resend API (`https://api.resend.com/emails`), que aceita:
- `to`: destinatario(s)
- `subject`: assunto
- `html`: corpo HTML do email
- `from`: remetente (default: `Linkou <contato@agencialinkou.com.br>`)
- `reply_to`: opcional

Validacao de autenticacao: apenas usuarios logados ou chamadas internas (com service role key) podem enviar emails.

### 3. Registrar no config.toml

**Arquivo:** `supabase/config.toml`

Adicionar:
```text
[functions.send-email]
verify_jwt = false
```

### 4. Integracao opcional nos fluxos

Apos a funcao estar funcionando, ela pode ser chamada de qualquer lugar do sistema:
- Notificacao de novo lead para o admin
- Confirmacao de cadastro para o lead
- Alertas de tarefas vencidas
- Qualquer automacao futura

A integracao nos fluxos sera feita sob demanda apos validar que o envio basico funciona.

## Detalhes Tecnicos

### Estrutura da Edge Function

```text
1. Validar CORS (OPTIONS)
2. Verificar secret RESEND_API_KEY
3. Autenticar usuario (token ou service role)
4. Extrair parametros do body (to, subject, html, from, reply_to)
5. Chamar POST https://api.resend.com/emails com headers Authorization: Bearer RESEND_API_KEY
6. Retornar resultado
```

### Remetente padrao

`Linkou <contato@agencialinkou.com.br>` - usando o dominio ja verificado no Resend.

### Arquivos criados/alterados

1. `supabase/functions/send-email/index.ts` - nova edge function
2. `supabase/config.toml` - registro da funcao

