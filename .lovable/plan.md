
# Funil de Email Automático para Novos Leads

## O que é e por que é valioso

Um funil de email (drip campaign) é uma sequência de emails que são enviados automaticamente em intervalos programados depois que o lead se cadastra. Em vez de um único email de agradecimento, o lead recebe uma série de comunicações estratégicas que o aquece e aumenta a chance de conversão.

**Exemplo de sequência padrão:**
```text
Dia 0  → Email 1: "Recebemos seu contato" (já existe)
Dia 1  → Email 2: Apresentação da Linkou + prova social
Dia 3  → Email 3: Conteúdo de valor (diagnóstico gratuito / dor do segmento)
Dia 7  → Email 4: Case de resultado / depoimento
Dia 14 → Email 5: Urgência / convite para conversa (CTA direto)
```

O funil para quando o lead avança de status (contacted, qualified, etc.) — evitando envio desnecessário.

---

## Arquitetura técnica

### Banco de dados: nova tabela `email_funnels`

Armazena os funis configurados pelo admin:

```text
email_funnels
  id, name, is_active, description, created_at

email_funnel_steps
  id, funnel_id, step_number, delay_days, subject, html_body, created_at

lead_funnel_enrollments
  id, lead_id, funnel_id, enrolled_at, current_step, status (active/paused/completed/converted)

lead_funnel_emails_sent
  id, enrollment_id, step_id, sent_at
```

### Edge Function: `process-lead-funnels`

Roda via cron diariamente (junto com o `check-task-deadlines`) e:
1. Busca enrollments ativos
2. Para cada enrollment, verifica se é hora de enviar o próximo step (baseado em `delay_days`)
3. Envia o email e registra em `lead_funnel_emails_sent`
4. Pausa/completa o enrollment se o lead foi convertido/arquivado

### Inscrição automática no funil

Quando um lead é criado (via `ContactForm.tsx` ou `CapturePage.tsx`), é chamada a edge function `notify-email` — vamos adicionar um evento `lead_funnel_enroll` que matricula o lead no funil padrão (o primeiro funil ativo).

---

## Interface admin: seção "Funil de Email"

Uma nova página `/admin/funil-email` com:

### Aba 1: Funis
- Listar funis criados (nome, status ativo/inativo, quantidade de steps, inscritos)
- Criar / editar / ativar/desativar funis

### Aba 2: Editor de Steps
- Ao selecionar um funil, exibir os steps em ordem
- Cada step tem: Dia do envio, Assunto, Corpo HTML (editor simples)
- Variáveis disponíveis: `{{nome}}`, `{{segmento}}`, `{{objetivo}}`
- Preview do email

### Aba 3: Leads inscritos
- Ver leads em cada funil, em qual step estão, status
- Ação manual: pausar, remover do funil, avançar step

---

## Arquivos a criar/alterar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/...` | Criar tabelas `email_funnels`, `email_funnel_steps`, `lead_funnel_enrollments`, `lead_funnel_emails_sent` com RLS |
| `supabase/functions/process-lead-funnels/index.ts` | Criar — edge function de processamento diário |
| `supabase/functions/notify-email/index.ts` | Alterar — adicionar handler `lead_funnel_enroll` |
| `supabase/config.toml` | Alterar — registrar nova função `process-lead-funnels` |
| `src/pages/admin/EmailFunnel.tsx` | Criar — página de gestão do funil |
| `src/layouts/AdminLayout.tsx` | Alterar — adicionar link "Funil de Email" no menu Comunicação |
| `src/App.tsx` | Alterar — registrar rota `/admin/funil-email` |
| `src/components/landing/ContactForm.tsx` | Alterar — enrolar lead no funil ao cadastrar |
| `src/pages/CapturePage.tsx` | Alterar — enrolar lead no funil ao cadastrar |

---

## Detalhes técnicos importantes

### Prevenção de duplicidade
A tabela `lead_funnel_emails_sent` registra cada email enviado. O cron verifica antes de enviar se aquele step já foi enviado para aquele enrollment.

### Pausa automática
Quando o status do lead mudar para `converted` ou `archived`, o enrollment é automaticamente marcado como `completed` ou `paused`. Isso evita enviar emails de nutrição para quem já é cliente.

### Step de Dia 0
O Email 1 (agradecimento) já é enviado pelo fluxo atual (`notify-email` → `lead_submitted`). O funil começa a partir do Dia 1, evitando duplicação.

### Template padrão incluído
O sistema virá com um funil padrão pré-configurado com 4 steps (Dias 1, 3, 7, 14) usando os templates de boas-vindas + prova social da Linkou, que o admin pode editar livremente.

### Variáveis de personalização
Os templates dos steps suportam substituição de `{{nome}}`, `{{segmento}}` e `{{objetivo}}` com os dados do lead antes do envio.
