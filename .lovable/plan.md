
# Inscrição Manual de Leads no Funil de Email

## O que será feito

Adicionar um botão "Inscrever Lead" na aba "Leads Inscritos" da página `/admin/funil-email` que abre um dialog para o admin buscar e selecionar um lead e um funil, inscrevendo-o manualmente.

## Fluxo da funcionalidade

1. Admin clica em **"+ Inscrever Lead"** (botão novo no topo da aba "Leads Inscritos")
2. Abre um dialog com:
   - **Campo de busca de lead** — digita nome ou email e filtra os leads cadastrados
   - **Seleção do funil** — dropdown com os funis disponíveis
3. Ao confirmar, verifica se já existe inscrição ativa do lead naquele funil (prevenção de duplicidade)
4. Se não existir, insere em `lead_funnel_enrollments` com `status = 'active'`
5. Feedback de sucesso via toast + atualização da tabela

## Detalhes técnicos

### Query de busca de leads
Busca na tabela `leads` filtrando por `name` ou `email` com `ilike` para busca parcial. Limitado a 50 resultados para performance.

### Verificação de duplicidade
Antes de inserir, verifica se já existe um enrollment com mesmo `lead_id` + `funnel_id` e `status = 'active'` ou `status = 'paused'`. Se existir, mostra mensagem de aviso.

### Arquivo alterado
Apenas **`src/pages/admin/EmailFunnel.tsx`** — sem necessidade de migração de banco ou novos arquivos.

## Mudanças no código

### Estado novo
```typescript
const [enrollDialog, setEnrollDialog] = useState(false);
```

### Nova mutation `manualEnroll`
```typescript
const manualEnroll = useMutation({
  mutationFn: async ({ leadId, funnelId }) => {
    // Verifica duplicidade
    const { data: existing } = await supabase
      .from("lead_funnel_enrollments")
      .select("id, status")
      .eq("lead_id", leadId)
      .eq("funnel_id", funnelId)
      .in("status", ["active", "paused"])
      .maybeSingle();

    if (existing) throw new Error("Lead já está inscrito neste funil.");

    const { error } = await supabase
      .from("lead_funnel_enrollments")
      .insert({ lead_id: leadId, funnel_id: funnelId, status: "active" });
    if (error) throw error;
  },
  onSuccess: () => { ... }
});
```

### Novo componente `EnrollLeadDialog`
Dialog com:
- **Input de busca** com debounce que filtra leads por nome/email via Supabase query
- **Lista de resultados** em scroll com seleção do lead
- **Select de funil** com os funis ativos
- **Botão Inscrever** habilitado apenas quando lead e funil estão selecionados

### Botão na tab "Leads Inscritos"
Adicionado no topo da aba ao lado de um eventual filtro futuro:
```tsx
<div className="flex justify-end mb-4">
  <Button onClick={() => setEnrollDialog(true)}>
    <Plus className="h-4 w-4 mr-2" /> Inscrever Lead
  </Button>
</div>
```

## Resumo das mudanças

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/pages/admin/EmailFunnel.tsx` | Adicionar estado, mutation e componente `EnrollLeadDialog` |

Nenhuma migração de banco necessária — as tabelas já estão criadas e com RLS configurado para admins e account_managers.
