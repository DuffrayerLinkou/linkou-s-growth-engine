
# Sistema Completo de Notificacoes por Email

## Visao Geral

Criar uma arquitetura centralizada de templates de email e implementar disparos automaticos em todos os momentos-chave da jornada do usuario na plataforma Linkou. Cada notificacao tera um template HTML profissional e consistente.

---

## Arquitetura: Template Base Reutilizavel

Criar um arquivo compartilhado `supabase/functions/_shared/email-templates.ts` com:

- **Layout base** (header com marca Linkou, corpo, rodape/assinatura)
- **Assinatura padrao** com dados da agencia e links de redes sociais
- **Funcoes auxiliares** para cada tipo de email
- **Funcao `sendNotificationEmail`** que centraliza o envio via `send-email`

```text
Estrutura:
  supabase/functions/_shared/email-templates.ts   <- Templates + assinatura
  supabase/functions/_shared/email-sender.ts      <- Funcao de envio centralizada
```

### Assinatura padrao (rodape de todos os emails)

- Logo/nome "Linkou"
- Texto: "Linkou -- Marketing de Performance"
- Link: agencialinkou.com.br
- Cor primaria: #7C3AED

---

## Categorias de Email e Cenarios

### Categoria 1: Conta e Acesso
| Cenario | Destinatario | Disparado quando |
|---------|-------------|------------------|
| Boas-vindas (ja existe) | Novo usuario | Admin cria usuario ou gestor convida membro |
| Senha alterada pelo admin | Usuario afetado | Admin altera senha via painel |

### Categoria 2: Tarefas
| Cenario | Destinatario | Disparado quando |
|---------|-------------|------------------|
| Nova tarefa atribuida | Usuario do cliente (ponto focal) | Tarefas sao criadas para o cliente |
| Tarefa concluida | Admin + ponto focal do cliente | Status muda para "completed" |
| Lembrete de prazo (ja existe como notificacao in-app) | Usuario + responsavel | Prazo hoje ou amanha (via cron) |

### Categoria 3: Campanhas
| Cenario | Destinatario | Disparado quando |
|---------|-------------|------------------|
| Campanha pendente de aprovacao | Ponto focal do cliente | Campanha muda para status "pending_approval" |
| Campanha aprovada | Admin que criou a campanha | Ponto focal aprova a campanha |

### Categoria 4: Agendamentos
| Cenario | Destinatario | Disparado quando |
|---------|-------------|------------------|
| Novo agendamento | Usuario do cliente + admin | Agendamento e criado |
| Lembrete de agendamento | Todos os envolvidos | 24h antes do agendamento (via cron) |

### Categoria 5: Jornada do Cliente
| Cenario | Destinatario | Disparado quando |
|---------|-------------|------------------|
| Mudanca de fase | Ponto focal do cliente | Admin muda a fase do cliente (diagnostico -> estruturacao, etc.) |

### Categoria 6: Comentarios
| Cenario | Destinatario | Disparado quando |
|---------|-------------|------------------|
| Novo comentario em campanha | Admin (se comentou cliente) ou ponto focal (se comentou admin) | Comentario e adicionado |

### Categoria 7: Pagamentos
| Cenario | Destinatario | Disparado quando |
|---------|-------------|------------------|
| Novo pagamento registrado | Ponto focal do cliente | Admin registra pagamento |
| Pagamento vencendo | Ponto focal do cliente | Vencimento em 3 dias (via cron) |

---

## Implementacao Tecnica

### Fase 1: Infraestrutura (base)

**Arquivo: `supabase/functions/_shared/email-templates.ts`**

Contera:
- `baseEmailLayout(content: string)` -- wrapper HTML com header Linkou + assinatura/rodape
- Funcoes de template por cenario: `welcomeEmail()`, `taskAssignedEmail()`, `campaignApprovalEmail()`, etc.
- Todas retornam `{ subject: string, html: string }`

**Arquivo: `supabase/functions/_shared/email-sender.ts`**

Contera:
- `sendNotificationEmail(to, subject, html)` -- faz fetch para `send-email` com service role key

### Fase 2: Integracao nos fluxos existentes

1. **`manage-users/index.ts`** -- Atualizar para usar templates do arquivo compartilhado (refatorar `buildWelcomeEmailHtml`)
2. **`check-task-deadlines/index.ts`** -- Adicionar envio de email alem da notificacao in-app

### Fase 3: Nova Edge Function para eventos em tempo real

**Arquivo: `supabase/functions/notify-email/index.ts`**

Uma edge function generica que aceita um `event_type` e dispara o email correto. Sera chamada pelo frontend nos momentos-chave:

- Quando tarefas sao criadas para um cliente
- Quando uma campanha muda para "pending_approval"
- Quando ponto focal aprova uma campanha
- Quando agendamento e criado
- Quando fase do cliente muda
- Quando comentarios sao adicionados
- Quando pagamentos sao registrados
- Quando admin altera senha de um usuario

### Fase 4: Cron para lembretes

Atualizar `check-task-deadlines/index.ts` para tambem:
- Enviar email de lembrete de prazo (alem da notificacao in-app)
- Verificar agendamentos nas proximas 24h e enviar lembrete
- Verificar pagamentos vencendo em 3 dias

---

## Arquivos a Criar/Alterar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/_shared/email-templates.ts` | Criar -- templates HTML + assinatura |
| `supabase/functions/_shared/email-sender.ts` | Criar -- funcao de envio centralizada |
| `supabase/functions/notify-email/index.ts` | Criar -- edge function para eventos |
| `supabase/functions/manage-users/index.ts` | Alterar -- usar template compartilhado |
| `supabase/functions/check-task-deadlines/index.ts` | Alterar -- adicionar envio de email |
| `supabase/config.toml` | Alterar -- registrar nova funcao |
| `src/pages/admin/ClientDetail.tsx` | Alterar -- chamar notify-email em mudanca de fase, criacao de tarefas |
| `src/components/cliente/ApprovalButton.tsx` | Alterar -- chamar notify-email ao aprovar campanha |
| `src/components/cliente/CommentSection.tsx` | Alterar -- chamar notify-email ao comentar |
| `src/components/cliente/RequestAppointmentDialog.tsx` | Alterar -- chamar notify-email ao agendar |

---

## Resultado Esperado

- Todos os emails seguem o mesmo visual (header Linkou roxo + assinatura no rodape)
- Usuarios recebem emails nos momentos certos sem precisar ficar acessando a plataforma
- Admins sao notificados de acoes dos clientes e vice-versa
- Lembretes automaticos mantém prazos e compromissos em dia
- Sistema escalavel: adicionar novo tipo de email = criar uma funcao de template + chamar `sendNotificationEmail`
