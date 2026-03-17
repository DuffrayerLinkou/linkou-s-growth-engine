

# Agendamentos para Leads

## Problema
A tabela `appointments` tem `client_id` como NOT NULL e não tem coluna para leads. O formulário admin só lista clientes no seletor.

## Alterações

### 1. Migration SQL
- Tornar `client_id` nullable na tabela `appointments`
- Adicionar coluna `lead_id uuid` nullable com referência à tabela `leads`
- Adicionar constraint CHECK para garantir que ao menos um dos dois (client_id ou lead_id) esteja preenchido
- Atualizar RLS: admins já têm acesso total, sem necessidade de mudança

### 2. `src/pages/admin/Appointments.tsx`
- Adicionar fetch de leads junto com clientes
- No formulário, trocar o seletor de "Cliente" por um seletor com duas categorias: **Clientes** e **Leads** (agrupados com labels)
- `formData` passa a ter `client_id` e `lead_id` (mutuamente exclusivos)
- Na lista de agendamentos, exibir o nome do lead quando não houver cliente vinculado (join com leads)
- No filtro lateral, incluir leads como opção de filtro

### 3. Interface do Appointment
- Adicionar `lead_id` e `leads?: { name: string }` ao tipo `Appointment`
- Query passa a fazer `select(*, clients(name), leads(name))`
- Exibir badge "Lead" ou "Cliente" ao lado do nome para diferenciar

## Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Alterar tabela appointments (client_id nullable, add lead_id) |
| `src/pages/admin/Appointments.tsx` | Adicionar suporte a leads no form, listagem e filtros |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente |

