

## Ações básicas no Kanban de Criativos (Editar, Apagar, Mover, Duplicar)

### Diagnóstico

Hoje no Kanban admin de Demandas Criativas (`/admin/criativos`) só dá para **clicar no card e abrir a tela de detalhe**. Faltam ações rápidas:

- **Editar** dados da demanda (título, briefing, plataforma, formato, prazo, prioridade, cliente)
- **Apagar** demanda (com cascata para entregáveis)
- **Mover de coluna** sem precisar abrir a tela de detalhe
- **Duplicar** demanda (útil para campanhas similares)

Mesma carência existe nos **entregáveis** dentro da demanda (hoje só edita conteúdo, não dá para apagar nem duplicar).

### O que vou implementar

**1. Menu de ações rápidas no card do Kanban (`CreativeDemandKanban.tsx`)**
- Ícone de três pontinhos no canto superior direito de cada card → `DropdownMenu` com:
  - **Abrir** (comportamento atual, padrão ao clicar no card)
  - **Editar** → abre dialog de edição (reaproveita o form de "Nova demanda")
  - **Mover para…** → submenu com as 6 colunas (Briefing, Em Produção, Em Aprovação, Ajustes, Aprovado, Entregue)
  - **Duplicar** → cria nova demanda copiando todos os campos, status volta para "briefing", título recebe "(cópia)"
  - **Apagar** → `AlertDialog` de confirmação, depois `delete` em `creative_demands` (entregáveis caem por cascata via FK ou exclusão manual prévia)

O clique no corpo do card continua abrindo o detalhe. O menu não propaga o clique.

**2. Dialog de edição reutilizável (`CreativeDemandFormDialog.tsx` — novo)**
- Extrai o formulário de "Nova demanda" (atualmente inline em `Criativos.tsx`) para um componente único que serve para **criar** e **editar**.
- Recebe `demand?: Demand` opcional. Se vier, faz `update`; se não, `insert`.
- Substitui o dialog inline atual em `Criativos.tsx` e é usado também pelo card do Kanban.

**3. Mesmas ações na tela de detalhe (`CreativeDemandDetail.tsx`)**
- Botão **Editar** ao lado do título → abre o mesmo dialog.
- Botão **Apagar** (ícone lixeira, vermelho discreto) → confirmação + redireciona pra lista.
- Para **entregáveis** (`CreativeDeliverableEditor`): adicionar menu com **Apagar entregável** e **Duplicar entregável**.

**4. Mesmas ações na visão de Lista**
- A aba "Lista" também ganha o menu de três pontinhos no canto direito de cada linha.

### Confirmações e segurança

- **Apagar** sempre passa por `AlertDialog` ("Tem certeza? Esta ação não pode ser desfeita. Os entregáveis vinculados também serão apagados.").
- Apenas admins e account_managers conseguem editar/apagar/mover (RLS já garante isso na tabela `creative_demands`).
- **Cliente** continua com permissão limitada do lado deles (só editam demandas próprias em status `briefing`, conforme RLS atual). Não vou tocar nas RLS.

### Arquivos

**Novos:**
- `src/components/admin/criativos/CreativeDemandFormDialog.tsx` — dialog reutilizável criar/editar
- `src/components/admin/criativos/CreativeDemandActions.tsx` — menu dropdown reutilizável (Kanban + Lista + Detail)

**Editados:**
- `src/components/admin/criativos/CreativeDemandKanban.tsx` — adiciona menu de ações no card
- `src/components/admin/criativos/CreativeDemandDetail.tsx` — botões editar/apagar + menu nos entregáveis
- `src/components/admin/criativos/CreativeDeliverableEditor.tsx` — menu apagar/duplicar entregável
- `src/pages/admin/Criativos.tsx` — usa o novo `CreativeDemandFormDialog` no lugar do form inline; passa callbacks de ação para Kanban/Lista

### Sem mudanças

- Banco de dados (tabelas, colunas, RLS).
- Painel do cliente (`src/pages/cliente/Criativos.tsx`) — fora do escopo deste pedido. Posso adicionar depois se você quiser.

### Resultado visual

```text
┌─ Card Kanban ─────────────┐
│ DRA REGEANE         ⋯    │ ← novo menu
│ Vídeo 01 – Hook Pré...   │
│ [Alta]  📅 23/04         │
└───────────────────────────┘
       ↓ clicando ⋯
       ┌────────────────┐
       │ Abrir          │
       │ Editar         │
       │ Mover para  ▶  │
       │ Duplicar       │
       │ ─────────      │
       │ Apagar    🗑   │
       └────────────────┘
```

