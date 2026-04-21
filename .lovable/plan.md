

## Demandas Criativas — Módulo Colaborativo de Produção de Conteúdo

Nova área operacional para gerenciar o ciclo recorrente de produção de **criativos, copies de vídeo, posts estáticos e enxoval de mídia** em colaboração entre **time interno** e **cliente (Ponto Focal)**. Cada demanda é uma unidade de trabalho com briefing → produção → aprovação → entrega.

---

### Conceito

Cada **Demanda Criativa** representa um pedido de produção. Pode conter múltiplos **entregáveis** (copies, vídeos, posts, artes). O fluxo segue um Kanban com aprovação obrigatória do Ponto Focal antes de publicar.

```text
Briefing → Em Produção → Em Aprovação → Ajustes → Aprovado → Entregue
   ↑           ↑              ↑            ↑          ↑          ↑
 cliente    interno       cliente      interno    cliente    interno
```

---

### Funcionalidades

**Para o cliente (`/cliente/criativos`)**
- Solicitar nova demanda preenchendo briefing (objetivo, formato, plataforma, prazo, referências, copy bruta)
- Anexar arquivos de referência (logos, vídeos brutos, fotos)
- Visualizar entregáveis em produção com preview
- **Aprovar ou solicitar ajustes** (Ponto Focal apenas) com comentários
- Histórico completo de versões e revisões

**Para o admin (`/admin/criativos`)**
- Kanban com todas demandas filtradas por cliente/status/prazo
- Criar entregáveis vinculados a uma demanda (copy, vídeo, arte, roteiro)
- Upload de arquivos de produção (versão 1, 2, 3...) via Supabase Storage
- Marcar como "Pronto para aprovação" → notifica Ponto Focal
- Visualizar feedback do cliente e atualizar versão
- Métricas: demandas por status, tempo médio de aprovação, taxa de ajustes

**Detalhe de uma demanda (compartilhada cliente + admin)**
- Briefing fixo no topo
- Lista de entregáveis com preview, status, versão atual
- Thread de comentários por entregável (reaproveita tabela `comments`)
- Botão de aprovação destacado para Ponto Focal
- Histórico de versões clicável

---

### Tipos de entregáveis suportados

| Tipo | Conteúdo principal | Preview |
|---|---|---|
| Copy de vídeo | Roteiro/legenda em texto rico | Markdown render |
| Copy de post estático | Headline + corpo + CTA | Texto formatado |
| Vídeo editado | Arquivo .mp4 | Player inline |
| Arte/imagem | .png / .jpg | Imagem responsiva |
| Enxoval de mídia | Pacote (múltiplos arquivos) | Galeria |

---

### Dados (novas tabelas)

**`creative_demands`** — a demanda em si
- `id, client_id, title, briefing, objective, platform, format, deadline`
- `status` (briefing, in_production, in_approval, adjustments, approved, delivered)
- `priority, requested_by, assigned_to, created_at, updated_at`

**`creative_deliverables`** — entregáveis vinculados a uma demanda
- `id, demand_id, type, title, content (text), current_version`
- `status, approved_by_ponto_focal, approved_at`

**`creative_deliverable_versions`** — histórico de versões
- `id, deliverable_id, version_number, content, file_url, notes, created_by, created_at`

**RLS**
- Admin/Account Manager: gerenciam tudo
- Cliente: vê apenas demandas do próprio `client_id`
- Apenas Ponto Focal pode aprovar (reuso da função `is_ponto_focal`)
- Comentários reaproveitam tabela `comments` com `entity_type='creative_deliverable'`

**Storage** — reuso do bucket `client-files`, pasta `creative-deliverables/{client_id}/`

---

### Notificações automáticas (reuso do `notify-email`)

- Cliente cria demanda → notifica admin
- Entregável "Pronto para aprovação" → notifica Ponto Focal
- Cliente aprova → notifica admin
- Cliente solicita ajustes → notifica admin com comentário

---

### Navegação

**Cliente:** novo item no sidebar **"Criativos"** (ícone `Sparkles`) entre **Campanhas** e **Arquivos**

**Admin:** novo item **"Criativos"** no grupo **Operacional** entre **Campanhas** e **Métricas**

---

### Arquivos a criar/alterar

**Migrations:**
- 3 novas tabelas + RLS + índices

**Cliente:**
- `src/pages/cliente/Criativos.tsx` — lista + kanban próprio
- `src/components/cliente/CreativeDemandDialog.tsx` — criar nova demanda
- `src/components/cliente/CreativeDeliverableViewer.tsx` — preview + aprovação

**Admin:**
- `src/pages/admin/Criativos.tsx` — kanban com filtros
- `src/components/admin/criativos/CreativeDemandDetail.tsx` — detalhe completo
- `src/components/admin/criativos/CreativeDeliverableEditor.tsx` — editor + upload de versão
- `src/components/admin/criativos/CreativeDemandKanban.tsx` — board

**Compartilhado:**
- `src/lib/creative-config.ts` — tipos, statusConfig, formatConfig
- `src/components/shared/CreativeVersionHistory.tsx` — timeline de versões

**Roteamento:**
- `src/App.tsx` — 2 novas rotas
- `src/layouts/ClientLayout.tsx` — item de menu
- `src/layouts/AdminLayout.tsx` — item de menu

---

### Antes de começar — confirmações

1. **Quem pode solicitar nova demanda no painel do cliente?** Sugestão: qualquer usuário do cliente (operadores incluídos), mas só Ponto Focal aprova.
2. **Aprovação por entregável ou pela demanda inteira?** Sugestão: por entregável — assim cliente aprova roteiro de vídeo enquanto arte ainda está em produção.
3. **Versionamento automático ao subir novo arquivo?** Sugestão: sim, cada upload incrementa `current_version` e mantém versão anterior visível no histórico.

Se concordar com as sugestões padrão, posso seguir direto. Caso queira ajustar algo, me diga antes de aprovar.

