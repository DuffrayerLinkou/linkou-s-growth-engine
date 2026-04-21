

## Linkouzinho — autonomia sobre Demandas Criativas

Estender o `assistant-chat` para que o Linkouzinho **leia, crie e movimente** demandas criativas e entregáveis, no modo admin (orquestração) e no modo cliente (consulta + solicitação).

---

### O que o bot vai poder fazer

**Modo admin (equipe interna)** — orquestração completa
- Listar demandas em aberto e seu status
- **Criar demanda criativa** para um cliente (briefing + objetivo + plataforma + formato + prazo + prioridade)
- **Criar entregável** vinculado a uma demanda (copy de vídeo, copy estática, vídeo, arte, enxoval)
- **Mover status** de demanda ou entregável (briefing → em produção → em aprovação → ajustes → aprovado → entregue)
- **Adicionar versão de copy** a um entregável (texto direto via tool, sem upload de arquivo)
- Resumir backlog: o que está atrasado, o que está aguardando aprovação do Ponto Focal, taxa de ajustes

**Modo cliente** — consulta + solicitação leve
- Listar minhas demandas em aberto e seu status
- **Solicitar nova demanda** (briefing curto via chat, criada em status `briefing`)
- Mostrar o que está aguardando minha aprovação (se Ponto Focal)
- **Não** aprova/rejeita pelo bot — aprovação obrigatoriamente via UI (preserva a regra "só Ponto Focal aprova" e a auditoria por clique)

---

### Mudanças no `supabase/functions/assistant-chat/index.ts`

**1. Carregar demandas no contexto** (paralelo com as outras 15 fontes)
- Buscar últimas 15 demandas do cliente + entregáveis abertos
- Renderizar no system prompt em seção `## 🎨 Demandas Criativas`:
  ```text
  - [in_approval] Vídeo lançamento Abril (Reel/Instagram, prazo 25/04, prio: alta)
    └ entregáveis: 2 em aprovação, 1 em produção
  ```

**2. Novas tools (admin)**

| Tool | Função |
|---|---|
| `create_creative_demand` | Cria demanda (title, briefing, objective, platform, format, deadline, priority) |
| `create_creative_deliverable` | Cria entregável vinculado (demand_id, type, title, content opcional) |
| `update_demand_status` | Move status da demanda |
| `update_deliverable_status` | Move status do entregável (não permite "approved" — só Ponto Focal via UI) |
| `add_deliverable_version` | Adiciona versão de copy (text content) ao entregável; incrementa `current_version` |

**3. Novas tools (cliente)** — primeiro conjunto de tools no modo cliente
- `request_creative_demand` — cria demanda em status `briefing` no client_id do próprio usuário
- Sem tools de aprovação (proteção arquitetural)

**4. Reforços no system prompt**
- Admin: incluir Criativos na lista de ferramentas do EXECUTOR; instruir a usar `add_deliverable_version` quando o admin ditar a copy diretamente no chat
- Cliente: nova seção "Você pode solicitar uma nova demanda criativa descrevendo o que precisa — copy de vídeo, post, arte ou enxoval. Aprovação só via UI."
- Restrição explícita: bot **nunca** marca como `approved` — sempre devolve "abra a demanda em /cliente/criativos para aprovar".

---

### Camada de memória/auditoria (já existente, reaproveitada)
- Toda execução de tool é logada em `client_actions` (status sucesso/falha)
- Demandas e versões geradas pelo bot ficam visíveis na UI normal — sem fluxo paralelo
- `set_conversation_state` pode marcar tópico = "Demanda Criativa: <título>"

---

### Permissões (sem migration)
- Modo admin já roda com service role + verificação de `admin`/`account_manager`
- Modo cliente já valida `profile.client_id === client_id`
- RLS das tabelas `creative_demands` / `creative_deliverables` / `creative_deliverable_versions` é bypassada pela service role no edge function — segurança garantida pela checagem de papel feita antes de executar a tool

### Bloqueio explícito no executor cliente
- Mesmo que o LLM tente, o switch do `executeTool` no modo cliente só registra `request_creative_demand`. Outras tools criativas retornam `{ success: false, message: "Ação restrita ao admin." }`.

---

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | +5 tools admin, +1 tool cliente, +contexto de demandas, +instruções de prompt |

Sem novos arquivos, sem migrations, sem novos secrets.

---

### Fluxos de teste sugeridos (após implementação)

1. **Admin**: "Cria uma demanda de Reel para o cliente X com prazo dia 30, copy de vídeo + arte" → bot cria demanda + 2 entregáveis
2. **Admin**: "Adiciona essa copy no entregável Y: [texto]" → bot chama `add_deliverable_version`, incrementa versão
3. **Admin**: "Move o entregável Y para aprovação" → status = `in_approval`
4. **Cliente Ponto Focal**: "Quero um vídeo curto pro lançamento da semana que vem" → bot cria demanda em `briefing`
5. **Cliente**: "Aprova esse roteiro pra mim" → bot recusa e instrui ir até /cliente/criativos

