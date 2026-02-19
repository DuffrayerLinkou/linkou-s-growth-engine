
# Linkouzinho — Conversão em 3 Caminhos

## Visão Geral

O bot já captura leads com um único caminho: coleta o cadastro e redireciona ao WhatsApp. A melhoria é transformar esse momento de conversão em uma **escolha consciente do lead**, com 3 opções apresentadas de forma simpática e natural, cada uma com seu fluxo completo de backend.

---

## Os 3 Caminhos de Conversão

### Caminho 1 — Falar com alguém agora (WhatsApp)
O lead quer contato imediato. Coleta nome + telefone, registra no CRM e abre o WhatsApp com contexto da conversa já na mensagem.

### Caminho 2 — Agendar uma reunião
O lead quer uma conversa mais estruturada. Coleta nome, e-mail, telefone e uma data/hora sugerida. **Cria o agendamento no sistema** (tabela `appointments`, status `pending`) e dispara e-mail de aviso para os admins via `notify-email` com `event_type: appointment_created`.

### Caminho 3 — Só deixar o contato (Cadastro)
O lead ainda não quer compromisso. Coleta nome + e-mail, registra no CRM e inscreve automaticamente no funil de e-mail via `notify-email` com `event_type: lead_funnel_enroll`.

---

## Como Aparece no Chat

Quando a IA aciona `<CAPTURE_MODE>`, em vez de exibir diretamente o formulário de captura, o bot exibe **primeiro uma tela de escolha** com 3 botões simpaticamente apresentados:

```
💬 Falar agora no WhatsApp
📅 Agendar uma reunião
📝 Deixar meu contato
```

Ao clicar em um, o formulário correto aparece.

---

## Mudanças Técnicas Detalhadas

### `src/components/landing/LinkouzinhoWidget.tsx`

#### Novos estados
- `conversionPath: "whatsapp" | "appointment" | "register" | null` — qual caminho o lead escolheu
- `captureStep: "choose" | "form" | "done"` — etapa do fluxo de conversão

#### Novos componentes internos

**`ConversionPathChooser`** — tela de escolha dos 3 caminhos, aparece quando `captureMode === true` e `captureStep === "choose"`:
```tsx
<div className="space-y-2 mt-2">
  <p className="text-sm font-medium">Como prefere continuar? 😊</p>
  <Button onClick={() => setPath("whatsapp")}>💬 Falar agora no WhatsApp</Button>
  <Button onClick={() => setPath("appointment")}>📅 Agendar uma reunião</Button>
  <Button onClick={() => setPath("register")}>📝 Só deixar meu contato</Button>
</div>
```

**`WhatsAppCaptureForm`** — nome + telefone (telefone obrigatório aqui):
- Ao submeter: insere lead no CRM com `source: "bot_linkouzinho"`, dispara CAPI, abre WhatsApp com contexto

**`AppointmentForm`** — nome + e-mail + telefone + data/hora sugerida:
- Ao submeter:
  1. Insere lead no CRM com `source: "bot_linkouzinho"`
  2. Busca `client_id` nulo (agendamento público não tem client_id) — **solução**: insere na tabela `leads` e cria `appointments` com `client_id = null` e um campo `lead_id` — mas a tabela `appointments` exige `client_id`. **Alternativa**: salvar apenas no CRM (`leads`) com o campo `objective` contendo a data/hora sugerida + enviar e-mail aos admins via `notify-email` com evento customizado `bot_appointment_request`
  3. Dispara `notify-email` com `event_type: "bot_appointment_request"` → e-mail para admins com nome, e-mail, telefone e data/hora sugerida

**`RegisterForm`** — nome + e-mail (formulário mais simples, menos atrito):
- Ao submeter: insere lead no CRM, inscreve no funil de e-mail via `notify-email` com `lead_funnel_enroll`, envia e-mail de obrigado ao lead

#### Mudanças no `localStorage`
Adicionar: `linkouzinho_conversion_path` e `linkouzinho_capture_step` para persistência do estado entre aberturas/fechamentos do chat dentro do TTL de 24h.

---

### `supabase/functions/notify-email/index.ts`

Adicionar novo `case "bot_appointment_request"`:
```typescript
case "bot_appointment_request": {
  const { lead_name, lead_email, lead_phone, suggested_date } = payload;
  const adminEmails = await getAdminEmails(supabase);
  if (adminEmails.length > 0) {
    const { subject, html } = botAppointmentRequestEmail(lead_name, lead_email, lead_phone, suggested_date);
    await sendNotificationEmail(adminEmails, subject, html);
  }
  break;
}
```

---

### `supabase/functions/_shared/email-templates.ts`

Adicionar `botAppointmentRequestEmail(name, email, phone, suggested_date)`:
- **Assunto**: `🗓️ Nova solicitação de reunião via Linkouzinho — ${name}`
- **Corpo**: Card informativo com dados do lead e data/hora sugerida, com botão "Confirmar reunião" que abre o CRM

---

## Fluxo Completo por Caminho

### WhatsApp
```
IA aciona CAPTURE_MODE → Escolha de caminho → Clica "WhatsApp"
→ Form (nome + telefone) → Submete
→ [CRM: insere lead] + [CAPI: Lead event]
→ Abre WhatsApp com mensagem contextualizada
→ Mensagem de confirmação no chat
```

### Agendamento
```
IA aciona CAPTURE_MODE → Escolha de caminho → Clica "Reunião"
→ Form (nome + e-mail + telefone + data/hora) → Submete
→ [CRM: insere lead com objetivo = "Reunião via Linkouzinho - data sugerida: ..."]
→ [notify-email: bot_appointment_request → e-mail para admins]
→ [CAPI: Lead event]
→ Mensagem de confirmação: "Perfeito! Solicitação enviada. Nossa equipe confirmará o horário com você por e-mail ou WhatsApp 😊"
```

### Só o contato
```
IA aciona CAPTURE_MODE → Escolha de caminho → Clica "Deixar contato"
→ Form (nome + e-mail, sem telefone obrigatório) → Submete
→ [CRM: insere lead]
→ [notify-email: lead_submitted → e-mail de obrigado ao lead]
→ [notify-email: lead_funnel_enroll → inscreve no funil]
→ [CAPI: Lead event]
→ Mensagem de confirmação: "Anotado! Em breve entraremos em contato 🎯"
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/components/landing/LinkouzinhoWidget.tsx` | Refatorar CaptureForm → 3 componentes + tela de escolha |
| `supabase/functions/notify-email/index.ts` | Adicionar `case "bot_appointment_request"` |
| `supabase/functions/_shared/email-templates.ts` | Adicionar `botAppointmentRequestEmail` |

**Sem migrações de banco de dados.** Os agendamentos do bot são salvos como leads com objetivo descritivo + e-mail para o admin — evita problema de `client_id` obrigatório na tabela `appointments`.

---

## Decisão de Arquitetura: Por que NÃO criar appointment direto no banco?

A tabela `appointments` requer `client_id` (não nullable), e o lead do Linkouzinho ainda não tem um `client_id` (ele não é cliente ainda). Forçar um `client_id = null` quebraria as RLS policies.

A solução correta é:
1. Salvar como `lead` no CRM com nota da data sugerida no campo `objective`
2. Notificar os admins por e-mail com todos os dados
3. O admin confirma manualmente e cria o agendamento no painel se necessário

Isso mantém a integridade do banco e não cria dados orphaned.
