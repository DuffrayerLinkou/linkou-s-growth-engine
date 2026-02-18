
# Atualização da Identidade do Remetente e Assinatura dos Emails

## O que muda

Dois pontos concentram toda a lógica de envio e identidade dos emails:

1. **`supabase/functions/send-email/index.ts`** — define o campo `from` que aparece na caixa de entrada do destinatário.
2. **`supabase/functions/_shared/email-templates.ts`** — define o rodapé/assinatura que aparece no corpo HTML de todos os emails.

Nenhuma outra edge function precisa ser alterada, pois todas usam `sendNotificationEmail` do `_shared/email-sender.ts`, que por sua vez chama `send-email`, e todos os HTMLs são gerados por funções de `email-templates.ts` que usam `baseEmailLayout` (rodapé centralizado).

## Alterações

### 1. Nome do remetente — `send-email/index.ts`

Linha 71, mudar o `from` padrão de:
```
"Linkou <contato@agencialinkou.com.br>"
```
para:
```
"Leo Santana | Linkou <contato@agencialinkou.com.br>"
```

Isso atualiza o nome que aparece no campo **"De:"** em 100% dos emails enviados pela plataforma.

### 2. Assinatura no rodapé — `email-templates.ts`

Linhas 22–26, a função `baseEmailLayout` renderiza o rodapé de todos os emails. Mudar de:

```html
Linkou — Marketing de Performance
✉ contato@agencialinkou.com.br
📞 (41) 98898-8054
agencialinkou.com.br
```

para:

```html
Leo Santana — Diretor Comercial
Linkou — Marketing de Performance
✉ contato@agencialinkou.com.br
📞 (41) 98898-8054
agencialinkou.com.br
```

O nome e cargo aparecem em destaque (cor mais escura) acima da linha institucional, mantendo o padrão visual roxo já existente.

### 3. Re-deploy das edge functions

Após as alterações de código, será necessário fazer o deploy de:
- `send-email`
- (não há re-deploy das outras funções necessário, pois `_shared` é importado em tempo de execução)

## Arquivos alterados

| Arquivo | Linha(s) | Mudança |
|---------|----------|---------|
| `supabase/functions/send-email/index.ts` | 71 | Campo `from` com nome do remetente |
| `supabase/functions/_shared/email-templates.ts` | 22–26 | Rodapé com nome + cargo |

## Impacto

Todos os emails do sistema serão afetados automaticamente, incluindo:
- Boas-vindas (novo cliente)
- Agradecimento ao lead
- Notificação de tarefas
- Aprovação de campanhas
- Agendamentos
- Lembretes de prazo
- Funil Cold Outbound (5 steps)
- Qualquer outro email futuro gerado via `baseEmailLayout`
