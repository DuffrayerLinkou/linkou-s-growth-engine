
# Multi-seleção de Leads, Ações em Lote e Métricas por Segmento

## Problemas identificados

A página `/admin/leads` atual tem:
- Sem checkbox de seleção individual ou "selecionar todos"
- Nenhuma ação em lote (bulk action)
- Métricas apenas por status — sem visibilidade por segmento, origem ou investimento
- Sem filtro por segmento na lista

## O que será implementado

### 1. Multi-seleção com barra de ações em lote

Na view de lista, cada linha recebe um **checkbox** na primeira coluna. Um checkbox de "selecionar todos" aparece no cabeçalho da tabela.

Quando ≥1 lead estiver selecionado, uma **barra de ações flutuante** aparece acima da tabela com:

- Contador: "X leads selecionados"
- Botão: **Alterar status** (dropdown com todos os status)
- Botão: **Inscrever no funil** (dropdown dos funis ativos)
- Botão: **Arquivar** (atalho rápido)
- Botão: **Exportar seleção** (gera XLSX só dos selecionados)
- Botão: **Excluir** (com confirmação)

### 2. Filtro por segmento

Ao lado dos filtros de status e origem, adicionar um `<Select>` de **segmento** usando `clientSegments` do `segments-config.ts` já existente. Isso permite isolar leads por nicho (Construtora, Imobiliária, E-commerce, etc.).

### 3. Métricas expandidas — painel de breakdown

Abaixo dos cards de status atuais, adicionar um segundo nível de métricas colapsável:

- **Por segmento**: barras horizontais mostrando quantidade de leads por nicho, calculadas a partir dos dados já carregados (sem nova query)
- **Por origem**: distribuição Landing Page vs. Meta Lead Ads vs. Manual
- **Taxa de conversão**: (converted / total) × 100%
- **Investimento médio declarado**: quando o campo `investment` está preenchido

Todos calculados client-side a partir do array `leads` já existente no estado.

## Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/pages/admin/Leads.tsx` | Adicionar estados de seleção, checkbox na tabela, barra de bulk actions, filtro de segmento, painel de métricas expandido |

Nenhuma alteração de banco, edge function ou schema necessária — tudo baseado nos dados já carregados.

## Detalhes técnicos

### Estados adicionados

```typescript
const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
const [segmentFilter, setSegmentFilter] = useState<string>("all");
const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
const [isBulkFunnelOpen, setIsBulkFunnelOpen] = useState(false);
const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
const [isBulkActioning, setIsBulkActioning] = useState(false);
const [showMetricsBreakdown, setShowMetricsBreakdown] = useState(false);
```

### Lógica de seleção

```typescript
const toggleLead = (id: string) =>
  setSelectedLeadIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

const toggleAll = () =>
  setSelectedLeadIds(
    selectedLeadIds.size === filteredLeads.length
      ? new Set()
      : new Set(filteredLeads.map(l => l.id))
  );
```

### Bulk actions

```typescript
const bulkUpdateStatus = async (newStatus: string) => { ... }
const bulkEnrollFunnel = async (funnelId: string) => { ... }
const bulkDelete = async () => { ... }
const bulkExport = () => { /* XLSX só dos selecionados */ }
```

### Métricas de breakdown (client-side)

```typescript
const segmentBreakdown = useMemo(() =>
  clientSegments.map(seg => ({
    segment: seg,
    count: leads.filter(l => l.segment === seg).length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count),
[leads]);

const sourceBreakdown = useMemo(() => ({
  landing_page: leads.filter(l => l.source === 'landing_page').length,
  meta_instant_form: leads.filter(l => l.source === 'meta_instant_form').length,
  manual: leads.filter(l => l.source === 'manual').length,
}), [leads]);

const conversionRate = useMemo(() => {
  const converted = leads.filter(l => l.status === 'converted').length;
  return leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : '0';
}, [leads]);
```

### Filtro de segmento integrado ao `filteredLeads`

O `useMemo` de `filteredLeads` receberá um terceiro critério:
```typescript
if (segmentFilter !== "all") {
  result = result.filter(l => l.segment === segmentFilter);
}
```

### Prevenção de conflito de clique

As linhas da tabela já têm `onClick={() => openLeadDetail(lead)}`. O checkbox terá `onClick={(e) => e.stopPropagation()}` para não abrir o detalhe ao clicar no checkbox.

### Limpeza automática da seleção

Ao aplicar qualquer bulk action, a seleção é limpa após sucesso. Ao mudar filtros, a seleção também é zerada.
