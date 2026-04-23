

## Vincular criativos ↔ campanhas

### O que existe hoje

- **Campanhas** (`campaigns`) tem um campo solto `creatives jsonb` que ninguém edita pela UI.
- **Demandas Criativas** (`creative_demands`) e seus **Entregáveis** (`creative_deliverables`) vivem isolados — não há vínculo com campanha.
- Não existe nenhum link entre os dois módulos. Você não consegue dizer "essa campanha usa esses 4 criativos".

### Solução

Adicionar relação **N demandas criativas → 1 campanha** (uma campanha pode ter várias demandas; cada demanda gera 1+ entregáveis). É o modelo mais limpo e reaproveita toda a infra de versões/aprovação que já existe nos entregáveis.

```text
Campaign
  └── CreativeDemand (vários)
         └── CreativeDeliverable (vários, com versões e aprovação)
```

### Mudanças no banco (1 migration)

- Adicionar coluna `campaign_id uuid` em `creative_demands` (nullable, FK para `campaigns.id` com `ON DELETE SET NULL`).
- Índice em `campaign_id` para lookup rápido.

Sem mexer em RLS (já está coberta por `client_id`).

### Mudanças na UI

**1. `CreativeDemandFormDialog` (criar/editar demanda)**
- Novo campo opcional **"Campanha vinculada"** (Select) que aparece logo abaixo do Cliente. Carrega campanhas do cliente selecionado.

**2. `Criativos.tsx` (página principal de criativos)**
- Novo filtro **"Campanha"** ao lado do filtro de Cliente.
- Badge "📢 Nome da campanha" no card do Kanban e na lista.
- Botão **"Nova demanda em lote"** que abre dialog para criar várias demandas de uma vez para a mesma campanha (ex: "Reel 1", "Reel 2", "Story 1"...).

**3. `CreativeDemandDetail.tsx`**
- Mostrar campanha vinculada com link "Ver campanha →" que leva para `/admin/campanhas` filtrado.

**4. `Campaigns.tsx` (página de campanhas)**
- No diálogo de **visualização** da campanha, nova seção **"Criativos desta campanha"** listando todas as demandas vinculadas com:
  - Status (briefing, em produção, aprovado, etc.)
  - Quantidade de entregáveis (ex: "3 entregáveis · 2 aprovados")
  - Botão "Abrir no módulo Criativos"
- Botão **"+ Nova demanda criativa"** dentro da campanha que pré-preenche cliente + campanha.

### Diálogo "Nova demanda em lote" (novo componente)

Permite digitar uma lista de títulos e cria N demandas de uma só vez, todas vinculadas à mesma campanha + cliente, com mesmo prazo/prioridade. Exemplo de uso: ao criar campanha "Black Friday", o gestor cria de uma vez: "Reel hook 1", "Reel hook 2", "Static carrossel", "Story sequence" — cada uma vira uma demanda no Kanban.

### Arquivos tocados

- **Migration nova**: adiciona `campaign_id` em `creative_demands`
- `src/components/admin/criativos/CreativeDemandFormDialog.tsx` — campo de campanha
- `src/components/admin/criativos/CreativeDemandDetail.tsx` — mostra campanha + link
- `src/components/admin/criativos/CreativeDemandKanban.tsx` — badge da campanha no card
- `src/components/admin/criativos/CreativeBatchCreateDialog.tsx` — **novo** (dialog de lote)
- `src/pages/admin/Criativos.tsx` — filtro por campanha + botão lote
- `src/pages/admin/Campaigns.tsx` — seção "Criativos" no view dialog + atalho de criação

### Fora do escopo

- Não vou mexer no campo `creatives jsonb` legado de `campaigns` (fica obsoleto, sem migrar dados — provavelmente está vazio).
- Não vou alterar RLS, fluxo de aprovação, versões, ou kanban drag-drop.
- Painel do cliente não muda agora (a vinculação fica visível só no admin).

### Resultado

Você cria uma campanha → adiciona N demandas criativas (uma por vez ou em lote) → cada demanda recebe seus entregáveis com versões e aprovação como já funciona hoje → no detalhe da campanha você vê tudo agrupado e o status de cada criativo.

