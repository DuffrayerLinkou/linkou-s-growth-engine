

# Plano: CRM Offline Conversions via Meta CAPI

## O que isso faz

Quando um lead muda de status no CRM (ex: "novo" para "qualificado", ou "qualificado" para "convertido"), o sistema envia automaticamente um evento de conversao para o Meta via Conversions API (CAPI). Isso permite que o Meta:

- **Otimize campanhas** para encontrar pessoas semelhantes as que realmente convertem (nao apenas quem preenche formulario)
- **Calcule ROAS real** baseado em leads que viraram clientes
- **Melhore o publico** com dados do funil completo

---

## Como funciona

```text
Lead muda de status no CRM
         |
         v
Frontend detecta a mudanca
         |
         v
Chama Edge Function "meta-capi-event"
com event_name baseado no novo status
         |
         v
Edge Function envia para Meta CAPI:
  - Lead -> ja existe (formulario)
  - Contact -> lead contatado  
  - Lead Qualified -> lead qualificado
  - Purchase/CompleteRegistration -> convertido
         |
         v
Meta recebe e otimiza campanhas
```

---

## Mapeamento de Status para Eventos Meta

| Status CRM | Evento Meta | Descricao |
|------------|-------------|-----------|
| new | Lead | Ja enviado no formulario |
| contacted | Contact | Primeiro contato realizado |
| qualified | Lead (qualified) | Lead qualificado, com custom_data |
| proposal | InitiateCheckout | Proposta enviada |
| converted | Purchase | Convertido em cliente |
| lost | - | Nao envia (sem valor para otimizacao) |
| archived | - | Nao envia |

O Meta usa eventos padrao (Lead, Contact, InitiateCheckout, Purchase) que ele reconhece nativamente para otimizacao de campanhas.

---

## Alteracoes Necessarias

### 1. Modificar `src/pages/admin/Leads.tsx`

Na funcao `updateLeadStatus`, apos atualizar o status no banco, disparar a chamada CAPI para os status relevantes.

```typescript
const updateLeadStatus = async (leadId: string, newStatus: string) => {
  // ... update no banco (ja existe) ...
  
  // Enviar evento offline para Meta CAPI
  const lead = leads.find(l => l.id === leadId);
  if (lead) {
    sendCRMEventToMeta(lead, newStatus).catch(console.error);
  }
};
```

### 2. Criar `src/lib/crm-capi-utils.ts`

Novo arquivo utilitario que:
- Mapeia status do CRM para event_name do Meta
- Monta o payload com dados do lead (email, phone, name)
- Chama a Edge Function `meta-capi-event` ja existente
- Inclui `action_source: "system_generated"` (padrao Meta para offline conversions)

```typescript
const CRM_EVENT_MAP: Record<string, string | null> = {
  contacted: "Contact",
  qualified: "Lead",        // com custom_data.lead_event_source = "CRM"
  proposal: "InitiateCheckout",
  converted: "Purchase",
  lost: null,               // nao envia
  archived: null,           // nao envia
};

export async function sendCRMEventToMeta(lead: Lead, newStatus: string) {
  const eventName = CRM_EVENT_MAP[newStatus];
  if (!eventName) return; // status sem evento associado
  
  await supabase.functions.invoke("meta-capi-event", {
    body: {
      email: lead.email,
      phone: lead.phone,
      name: lead.name,
      segment: lead.segment,
      source_url: window.location.origin,
      event_name: eventName,
      // Dados extras para diferenciar do evento original
      crm_stage: newStatus,
    },
  });
}
```

### 3. Modificar Edge Function `supabase/functions/meta-capi-event/index.ts`

Ajustar para suportar eventos offline do CRM:

- Aceitar campo `crm_stage` no body
- Quando `crm_stage` estiver presente, usar `action_source: "system_generated"` em vez de `"website"` (padrao Meta para offline conversions)
- Incluir `crm_stage` no `custom_data` para rastreabilidade
- Manter compatibilidade com o fluxo atual (formulario de contato continua funcionando igual)

```typescript
// No payload do evento:
{
  event_name: body.event_name || 'Lead',
  action_source: body.crm_stage ? 'system_generated' : 'website',
  custom_data: {
    lead_type: body.crm_stage ? 'crm_offline' : 'audit_request',
    crm_stage: body.crm_stage || undefined,
    segment: body.segment,
  }
}
```

### 4. Toggle de ativacao no Admin (Pixels Tab)

Adicionar um toggle "Enviar eventos do CRM para Meta" na aba de Pixels, para que o admin possa ativar/desativar o envio de conversoes offline sem mexer em codigo.

**Banco de dados:** Adicionar coluna `meta_capi_crm_events_enabled` (BOOLEAN) na tabela `landing_settings`.

**UI em `PixelsTab.tsx`:** Novo switch abaixo das configuracoes existentes do CAPI.

---

## Alteracoes no Banco de Dados

### Migration SQL

```sql
ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS meta_capi_crm_events_enabled BOOLEAN DEFAULT false;
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/lib/crm-capi-utils.ts` | Criar - logica de mapeamento e envio |
| `src/pages/admin/Leads.tsx` | Modificar - chamar envio CAPI no updateLeadStatus |
| `supabase/functions/meta-capi-event/index.ts` | Modificar - suportar action_source "system_generated" e crm_stage |
| `src/components/admin/landing/PixelsTab.tsx` | Modificar - adicionar toggle de eventos CRM |
| `src/integrations/supabase/types.ts` | Modificar - adicionar tipo da nova coluna |
| Migration SQL | Criar - nova coluna na landing_settings |

---

## Detalhes Tecnicos

### action_source correto

O Meta exige `action_source` para saber a origem do evento:
- `"website"` = evento aconteceu no site (formulario)
- `"system_generated"` = evento gerado por sistema interno (CRM, ERP)

Usar `system_generated` para eventos do CRM e essencial para que o Meta processe corretamente e nao duplique com eventos de pixel do browser.

### Deduplicacao

Cada evento CRM tera um `event_id` unico (UUID gerado na Edge Function), entao nao ha risco de duplicacao. O evento de "Lead" original (do formulario) e o evento de "Lead qualified" (do CRM) sao eventos diferentes com nomes ou custom_data diferentes.

### Verificacao no Meta Events Manager

Apos implementar, os eventos offline aparecerao no Events Manager do Meta com:
- Origem: "Server" (nao "Browser")
- action_source: "system_generated"
- custom_data mostrando o crm_stage

---

## Resultado Esperado

1. Quando um lead e qualificado no CRM, o Meta recebe um evento "Lead" com contexto de qualificacao
2. Quando uma proposta e enviada, o Meta recebe "InitiateCheckout"
3. Quando o lead vira cliente, o Meta recebe "Purchase"
4. O Meta usa esses dados para otimizar campanhas e encontrar mais pessoas como as que realmente convertem
5. Toggle no admin permite ativar/desativar sem deploy
6. Tudo usa a infraestrutura CAPI ja existente (pixel ID, access token, test event code)

