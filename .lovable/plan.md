

# Plano: Transformar Leads em CRM com Discagem e WhatsApp

## Resumo

Transformar a secao de Leads em um mini-CRM com:
- **Click-to-call** (tel:) para discagem rapida
- **WhatsApp via wa.me** com registro de cada interacao
- **Historico de atividades** por lead (ligacoes, mensagens, notas)
- **Agendamento de follow-ups** com lembretes
- **Estrutura pronta** para integrar API oficial de WhatsApp no futuro (templates de mensagem, fila de disparo)

---

## Novas Tabelas no Banco de Dados

### 1. `lead_activities` - Historico de Interacoes

Registra cada contato feito com o lead (ligacao, WhatsApp, email, nota).

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| lead_id | UUID | FK para leads |
| type | TEXT | "call", "whatsapp", "email", "note", "status_change" |
| description | TEXT | Descricao/nota da interacao |
| created_by | UUID | FK para auth.users |
| created_at | TIMESTAMPTZ | Data/hora |
| metadata | JSONB | Dados extras (duracao da ligacao, template usado, etc) |

### 2. `lead_follow_ups` - Agendamento de Follow-ups

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| lead_id | UUID | FK para leads |
| scheduled_at | TIMESTAMPTZ | Data/hora agendada |
| type | TEXT | "call", "whatsapp", "email" |
| message | TEXT | Mensagem planejada (para WhatsApp) |
| status | TEXT | "pending", "completed", "cancelled" |
| completed_at | TIMESTAMPTZ | Quando foi executado |
| created_by | UUID | FK para auth.users |
| created_at | TIMESTAMPTZ | Data criacao |

### 3. `whatsapp_templates` - Templates de Mensagem (preparacao para API oficial)

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| name | TEXT | Nome do template |
| category | TEXT | "follow_up", "welcome", "qualification", "proposal" |
| content | TEXT | Texto da mensagem com variaveis {{nome}}, {{empresa}} |
| is_active | BOOLEAN | Template ativo |
| created_at | TIMESTAMPTZ | Data criacao |

---

## Alteracoes na Interface

### 1. Dialog de Detalhe do Lead (reformulado)

O dialog atual sera expandido com abas:

```text
+--------------------------------------------------+
|  Lead: Joao Silva                                |
|  Status: [Qualificado v]                         |
|                                                  |
|  [Dados]  [Atividades]  [Follow-ups]             |
|  ------------------------------------------------|
|                                                  |
|  Acoes Rapidas:                                  |
|  [Ligar]  [WhatsApp]  [Email]  [+ Nota]         |
|                                                  |
|  Historico:                                      |
|  14:30 - Ligacao realizada (2min)                |
|  11:00 - WhatsApp enviado: "Oi Joao..."         |
|  Ontem - Status alterado para Qualificado        |
|  02/02 - Lead capturado via Landing Page         |
|                                                  |
|  Proximo follow-up: 08/02 as 10:00 (WhatsApp)   |
+--------------------------------------------------+
```

### 2. Botao "Ligar" (Click-to-call)

- Abre `tel:+55XXXXXXXXX` no dispositivo
- Registra automaticamente uma atividade "call" no historico
- Abre mini-dialog para anotar resultado da ligacao apos fechar

### 3. Botao "WhatsApp" (aprimorado)

- Mostra opcoes: mensagem livre ou escolher template
- Ao selecionar template, substitui variaveis (nome, segmento)
- Abre wa.me com a mensagem pre-preenchida
- Registra a interacao no historico automaticamente

### 4. Agendar Follow-up

- Botao para agendar proximo contato
- Selecionar tipo (ligacao, WhatsApp, email)
- Definir data/hora
- Se WhatsApp: escolher template ou escrever mensagem
- Aparece como lembrete no dashboard e na lista de leads

### 5. Indicadores visuais no Kanban

- Badge com quantidade de atividades
- Indicador de follow-up pendente (icone de relogio)
- Ultimo contato (ex: "ha 3 dias")

---

## Arquivos a Criar/Modificar

### Novos Arquivos

1. **`src/components/admin/leads/LeadDetailDialog.tsx`** - Dialog reformulado com abas
2. **`src/components/admin/leads/LeadActivityTimeline.tsx`** - Timeline de atividades
3. **`src/components/admin/leads/LeadFollowUpForm.tsx`** - Form de agendamento
4. **`src/components/admin/leads/LeadQuickActions.tsx`** - Botoes de acao (ligar, WhatsApp, email, nota)
5. **`src/components/admin/leads/WhatsAppTemplateSelector.tsx`** - Seletor de templates de mensagem

### Arquivos Modificados

1. **`src/pages/admin/Leads.tsx`** - Usar novo LeadDetailDialog, adicionar indicadores
2. **`src/components/admin/LeadsKanban.tsx`** - Adicionar badges de atividade e follow-up nos cards
3. **`src/integrations/supabase/types.ts`** - Tipos das novas tabelas

### Migration SQL

- Criar tabelas `lead_activities`, `lead_follow_ups`, `whatsapp_templates`
- RLS policies para todas as tabelas
- Inserir templates padrao de WhatsApp (boas-vindas, follow-up, qualificacao, proposta)

---

## Templates Padrao de WhatsApp

Serao inseridos 4 templates iniciais:

1. **Boas-vindas**: "Ola {{nome}}! Sou da Linkou, recebi seu contato sobre {{objetivo}}. Podemos conversar?"
2. **Follow-up**: "Oi {{nome}}, tudo bem? Estou retomando nosso contato sobre {{objetivo}}. Tem um horario disponivel essa semana?"
3. **Qualificacao**: "{{nome}}, analisei seu caso e acredito que podemos ajudar com {{segmento}}. Posso enviar uma proposta?"
4. **Proposta**: "{{nome}}, preparei uma proposta personalizada para voce. Podemos agendar uma reuniao para apresentar?"

---

## Detalhes Tecnicos

### Registro automatico de atividade

```typescript
async function logLeadActivity(
  leadId: string, 
  type: "call" | "whatsapp" | "email" | "note" | "status_change",
  description: string,
  metadata?: Record<string, any>
) {
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    type,
    description,
    metadata,
  });
}
```

### Click-to-call com registro

```typescript
const handleCall = (lead: Lead) => {
  // Abrir discador
  window.open(`tel:+55${lead.phone.replace(/\D/g, "")}`, "_self");
  // Registrar atividade
  logLeadActivity(lead.id, "call", "Ligacao realizada");
  // Abrir dialog de anotacao apos 3s
  setTimeout(() => setCallNoteDialogOpen(true), 3000);
};
```

### WhatsApp com template

```typescript
const handleWhatsApp = (lead: Lead, template?: WhatsAppTemplate) => {
  let message = template?.content || "";
  // Substituir variaveis
  message = message.replace("{{nome}}", lead.name);
  message = message.replace("{{segmento}}", lead.segment || "");
  message = message.replace("{{objetivo}}", lead.objective || "");
  
  const url = `https://wa.me/55${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
  
  // Registrar atividade
  logLeadActivity(lead.id, "whatsapp", `Mensagem enviada: ${message.substring(0, 100)}...`);
};
```

### Preparacao para API Oficial

A estrutura de `whatsapp_templates` e `lead_follow_ups` ja esta no formato compativel com a API oficial do WhatsApp (Evolution API, Z-API, etc). Quando conectar a API:

1. Os templates ja estarao cadastrados
2. Os follow-ups agendados poderao ser disparados automaticamente via Edge Function + cron
3. O historico de atividades ja estara populado
4. Bastara criar uma Edge Function que consome a API oficial em vez de abrir wa.me

---

## Resultado Esperado

1. Cada lead tem um historico completo de interacoes
2. Click-to-call abre o discador e registra a ligacao
3. WhatsApp abre com mensagem pre-formatada a partir de templates
4. Follow-ups agendados aparecem como lembretes
5. Cards do Kanban mostram ultimo contato e pendencias
6. Banco de dados pronto para integrar API oficial de WhatsApp no futuro

