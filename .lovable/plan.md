
# Confirmação de Reunião do Linkouzinho → Agendamentos

## Problema Identificado

O fluxo atual pára no meio:
1. Lead solicita reunião via Linkouzinho ✅
2. Lead é cadastrado no CRM com `source: "bot_linkouzinho"` ✅
3. Admin recebe e-mail de notificação ✅
4. Admin vê banner na página de Leads ✅
5. **Admin confirma a reunião → gera agendamento real → notifica o lead por e-mail** ❌ — FALTANDO

---

## Solução: "Confirmar Reunião" em 3 partes

### Parte 1 — Botão de confirmação na página de Leads

No banner de solicitações pendentes e no detalhe do lead (LeadDetailDialog), aparece um botão **"Confirmar Reunião"** para leads com `source === "bot_linkouzinho"` e `objective?.includes("Reunião")`.

Ao clicar, abre um dialog de confirmação com:
- **Data e hora** (pré-preenchida com a data sugerida pelo lead extraída do campo `objective`)
- **Local / Link** (ex: link do Google Meet)
- **Cliente** a associar (select dos clientes cadastrados, para poder criar o `appointment` com `client_id`)
- **Duração** (30/60/90 min)
- Botão "Confirmar e Notificar"

### Parte 2 — Ação de confirmação no backend

Ao confirmar:
1. **Cria o agendamento** na tabela `appointments` com status `confirmed` e o `client_id` selecionado
2. **Atualiza o status do lead** para `contacted` (ou mantém conforme fluxo)
3. **Registra atividade** no lead: "Reunião confirmada"
4. **Envia e-mail para o lead** via `notify-email` com `event_type: "appointment_confirmed_to_lead"` — novo evento com template específico informando data/hora/local confirmados

### Parte 3 — Novo template de e-mail para o lead

Cria `appointmentConfirmedToLeadEmail(leadName, date, location)` em `_shared/email-templates.ts`:
- Assunto: `✅ Sua reunião foi confirmada — Linkou`
- Corpo: data/hora confirmada + local/link + orientações de preparo
- CTA: botão "Adicionar à agenda" (link Google Calendar)

---

## Detalhes Técnicos

### Mudança 1 — `src/pages/admin/Leads.tsx`

Adicionar estado `confirmingLead: Lead | null` e dialog de confirmação:

```tsx
const [confirmingLead, setConfirmingLead] = useState<Lead | null>(null);
const [confirmForm, setConfirmForm] = useState({
  client_id: "",
  confirmed_date: "",    // extraído do objective ou manual
  confirmed_time: "",
  location: "",
  duration_minutes: "60",
});
```

O dialog extrai a data sugerida do campo `objective` do lead usando regex sobre o texto "data sugerida: DD/MM/YYYY HH:mm".

Botão "Confirmar Reunião" aparece:
1. Em cada item do **banner** de solicitações pendentes (ao lado do nome)
2. Na **tabela de leads**, coluna de ações, quando o lead é do bot com solicitação de reunião

**Handler `handleConfirmAppointment`:**
```tsx
// 1. Insert na tabela appointments
await supabase.from("appointments").insert({
  title: `Reunião com ${confirmingLead.name}`,
  client_id: confirmForm.client_id,
  appointment_date: combinedDateTime,
  duration_minutes: parseInt(confirmForm.duration_minutes),
  location: confirmForm.location || null,
  status: "confirmed",
  type: "meeting",
  created_by: user.id,
  description: `Solicitação via Linkouzinho. Lead: ${confirmingLead.email} / ${confirmingLead.phone}`,
});

// 2. Atualiza lead para contacted
await supabase.from("leads").update({ status: "contacted" }).eq("id", confirmingLead.id);

// 3. Loga atividade
await logLeadActivity(confirmingLead.id, "note", "Reunião confirmada e agendada");

// 4. Envia e-mail ao lead
await supabase.functions.invoke("notify-email", {
  body: {
    event_type: "appointment_confirmed_to_lead",
    lead_name: confirmingLead.name,
    lead_email: confirmingLead.email,
    confirmed_date: formattedDate,
    location: confirmForm.location,
  }
});
```

### Mudança 2 — `supabase/functions/notify-email/index.ts`

Adicionar case `appointment_confirmed_to_lead`:
```typescript
case "appointment_confirmed_to_lead": {
  const { lead_name, lead_email, confirmed_date, location } = payload;
  if (lead_email) {
    const { subject, html } = appointmentConfirmedToLeadEmail(lead_name, confirmed_date, location || "");
    await sendNotificationEmail(lead_email, subject, html);
  }
  break;
}
```

### Mudança 3 — `supabase/functions/_shared/email-templates.ts`

Adicionar `appointmentConfirmedToLeadEmail(name, date, location)`:
- **Assunto:** `✅ Sua reunião foi confirmada! — Linkou`
- **Corpo:** 
  - Saudação personalizada com o nome do lead
  - Box informativo: data/hora confirmada + local/link de acesso
  - CTA: "Adicionar à Agenda" (Google Calendar deep link gerado dinamicamente)
  - Dica: "Separe suas principais dúvidas sobre [objetivo] para aproveitarmos ao máximo"

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/Leads.tsx` | Adicionar dialog de confirmação + handler completo |
| `supabase/functions/notify-email/index.ts` | Adicionar `case "appointment_confirmed_to_lead"` |
| `supabase/functions/_shared/email-templates.ts` | Adicionar `appointmentConfirmedToLeadEmail` |

**Sem migrações de banco.** O agendamento é criado na tabela `appointments` existente — o admin seleciona o `client_id` no formulário de confirmação, resolvendo a restrição NOT NULL da tabela.

---

## Fluxo Completo após a implementação

```
Lead solicita reunião via Linkouzinho
        ↓
Lead registrado no CRM + e-mail para admins (já funciona)
        ↓
Admin vê banner/lista na página Leads
        ↓
Admin clica "Confirmar Reunião" → abre dialog
        ↓
Admin define: cliente, data/hora real, local/link, duração
        ↓
[appointments] criado com status "confirmed"
[lead] status → "contacted"
[lead_activities] nota "Reunião confirmada"
[notify-email] → e-mail ao lead com data/hora/local confirmados
        ↓
Lead recebe: "✅ Sua reunião foi confirmada — Linkou"
Admin vê reunião em /admin/agendamentos
```
