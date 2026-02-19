
# Corrigir Dialog de Confirmação de Reunião — Equipe Linkou

## Problema Atual

O dialog pede "Cliente a associar" e lista os **clientes da agência** (empresas como "Empresa X", "Loja Y"). Isso está conceitualmente errado para o admin:

- O campo `client_id` na tabela `appointments` serve para organização interna do sistema (qual cliente a reunião pertence)
- O admin quer escolher **quem da equipe Linkou** vai participar e ser notificado
- Atualmente, ninguém da equipe interna recebe aviso quando a reunião é confirmada

## Solução em 3 partes

### Parte 1 — Adicionar campo `internal_attendees` na tabela appointments (migration)

Adicionar coluna `internal_attendees` do tipo `uuid[]` (array de UUIDs) à tabela `appointments`. Isso armazena os membros da equipe Linkou que participarão da reunião, sem quebrar nada existente (nullable com default `{}`).

### Parte 2 — Reformular o dialog de confirmação

O dialog passa a ter:

**Seção "Equipe Linkou"** (novo — principal mudança visual):
- Lista com checkboxes dos membros da equipe interna (admins + account_managers), exibindo nome e role
- Pelo menos 1 membro deve ser selecionado (responsável pela reunião)
- E-mail de aviso será enviado a todos os selecionados

**Seção "Associar ao cliente"** (existente — renomeada e simplificada):
- Campo de seleção do cliente do CRM com label mais claro: "Associar a um cliente existente (opcional)"
- Tornado **opcional** — quando não selecionado, usa um `client_id` padrão (o primeiro cliente da lista ou lida com isso de outra forma)
- **Problema real**: `client_id` é NOT NULL na tabela. A solução é: se não for selecionado nenhum cliente, o agendamento pode ser vinculado a um cliente "placeholder" ou, melhor ainda, criar o lead como cliente de forma automática. Porém isso complica demais.

**Decisão de arquitetura**: manter `client_id` obrigatório (restrição do banco), mas mudar o label para "Vincular a cliente do CRM" e deixar claro que é para organização interna. O foco visual fica nos membros da equipe.

### Parte 3 — Notificação para a equipe interna

Adicionar `event_type: "appointment_team_notify"` no `notify-email`:
- Busca os profiles dos `internal_attendees` selecionados
- Envia e-mail a cada um com: nome do lead, data/hora, local/link, dados de contato do lead

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/` | Adicionar coluna `internal_attendees uuid[] DEFAULT '{}'` em `appointments` |
| `src/pages/admin/Leads.tsx` | Reformular dialog: buscar equipe interna, multi-seleção com checkboxes, novo handler |
| `supabase/functions/notify-email/index.ts` | Adicionar case `appointment_team_notify` |
| `supabase/functions/_shared/email-templates.ts` | Adicionar `appointmentTeamNotifyEmail` |

## Fluxo Completo após a implementação

```
Admin clica "Confirmar Reunião"
        ↓
Dialog abre com:
  [✓] Leo Santana - Chef Comercial (admin)
  [ ] Lucas (admin)
  [ ] Mauro (admin)
  
  Data: 25/02/2026  Hora: 14:00
  Duração: 1 hora
  Local: https://meet.google.com/...
  
  Vincular a cliente: [Selecione...]  ← obrigatório (restrição do banco)
        ↓
Admin seleciona quem da equipe participa + cliente + data/hora
        ↓
[appointments] criado com client_id + internal_attendees = [uuid1, uuid2]
[leads] status → "contacted"
[notify-email: appointment_confirmed_to_lead] → e-mail ao lead
[notify-email: appointment_team_notify] → e-mail p/ cada membro selecionado da equipe
        ↓
Lead recebe: "✅ Sua reunião foi confirmada"
Equipe recebe: "📅 Nova reunião confirmada — [Nome do Lead] em DD/MM às HH:mm"
Admin vê reunião em /admin/agendamentos
```

## Detalhes Técnicos

### Migration

```sql
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS internal_attendees uuid[] DEFAULT '{}';
```

### Fetch da equipe interna no frontend

```tsx
// Busca via manage-users edge function
const { data } = await supabase.functions.invoke("manage-users", {
  body: { action: "list-users" }
});
// Filtra apenas admin e account_manager
const teamMembers = data.users.filter(u => 
  u.roles.includes("admin") || u.roles.includes("account_manager")
);
```

### Novo estado no dialog

```tsx
const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

// Confirmação — incluir attendees no insert
await supabase.from("appointments").insert({
  ...existing fields,
  internal_attendees: selectedAttendees,
});

// Notificar equipe selecionada
if (selectedAttendees.length > 0) {
  await supabase.functions.invoke("notify-email", {
    body: {
      event_type: "appointment_team_notify",
      attendee_ids: selectedAttendees,
      lead_name: confirmingLead.name,
      lead_email: confirmingLead.email,
      lead_phone: confirmingLead.phone,
      confirmed_date: formattedDate,
      location: confirmForm.location,
    }
  });
}
```

### Template de e-mail para a equipe

**Assunto**: `📅 Nova reunião confirmada — {Lead Name}`

**Corpo**:
- "Você foi adicionado como participante de uma reunião com um prospect via Linkouzinho"
- Card com: Nome, e-mail, telefone do lead
- Data/hora e local/link
- Botão "Ver no CRM" → link para `/admin/leads`

### Mudança visual no dialog

O campo "Equipe participante" aparece **primeiro** e com destaque, com checkboxes e avatares. "Vincular a cliente" fica abaixo, com label explicativo de que é para organização interna do sistema.

### Validação

- Pelo menos **1 membro da equipe** selecionado (obrigatório)
- `client_id` continua obrigatório (restrição do banco)
- Data/hora obrigatórios como antes
