

## Card de projeto: contagem de criativos desconectada

### O que está acontecendo

No card de Projetos (admin e cliente) e na visão geral do projeto existe um tile **"Criativos"** com ícone de estrela. Esse número está **hard-coded como `0`** em três lugares — nunca foi conectado ao banco. Como agora demandas criativas são vinculadas a campanhas (e campanhas pertencem a projetos), faz sentido finalmente popular esse número de verdade, em vez de mostrar zero.

### Decisão

**Popular o contador via campanhas do projeto.** A cadeia é:

```text
project → campaigns (project_id) → creative_demands (campaign_id) → creative_deliverables (demand_id)
```

Vamos contar **demandas criativas** vinculadas às campanhas do projeto (mais útil que entregáveis individuais — uma demanda = "um criativo solicitado", entregáveis são as versões/peças produzidas dentro dela).

### O que muda

**1. `src/pages/admin/Projects.tsx`** — listagem de projetos
- Após buscar `campaigns` do projeto, fazer uma segunda query agregando `creative_demands` por `campaign_id IN (...)`.
- Construir `demandsByProject: Map<projectId, count>` somando demandas das campanhas daquele projeto.
- Substituir `deliverablesCount: 0` por esse valor.

**2. `src/pages/cliente/Projetos.tsx`** — mesma lógica para o painel do cliente (RLS já filtra por client).

**3. `src/components/admin/projects/ProjectCard.tsx`** — apenas trocar o label do tile de **"criativos"** para algo mais preciso. Sugestão: manter **"criativos"** (linguagem do usuário) — sem mudança visual, só passa a mostrar número real.

**4. `src/components/admin/projects/ProjectDetailDialog.tsx`** — na visão geral:
- Buscar `campaigns.id` do projeto, depois `creative_demands` agregadas por essas campanhas.
- Popular `counts.deliverables` com o total real (hoje fixo em 0).
- Renomear o `StatBox` de "Criativos" mantendo o ícone `Sparkles`.

**5. (Opcional) Aba Campanhas do projeto** — em `ProjectCampaignsTab.tsx`, exibir ao lado de cada campanha o badge "N criativos" (mesma lógica usada em `CampaignCreativesSection`). Isso fecha o loop visual: o usuário vê quantos criativos cada campanha do projeto tem.

### Implementação técnica (resumo)

```ts
// pseudo, dentro do load de Projects.tsx
const campaignIds = (campaignsRes.data || []).map(c => c.id);
const campaignToProject = new Map(campaignsRes.data.map(c => [c.id, c.project_id]));

const { data: demands } = await supabase
  .from("creative_demands")
  .select("campaign_id")
  .in("campaign_id", campaignIds);

const demandsByProject = new Map<string, number>();
demands?.forEach(d => {
  const pid = campaignToProject.get(d.campaign_id);
  if (pid) demandsByProject.set(pid, (demandsByProject.get(pid) || 0) + 1);
});
// usar demandsByProject.get(p.id) || 0 no lugar do 0 fixo
```

Demandas **sem campanha** (`campaign_id null`) ficam de fora propositalmente — elas não pertencem a nenhum projeto. Isso é coerente com o modelo atual.

### Fora do escopo

- Não vamos criar vínculo direto `creative_demands.project_id` (redundante — já chega via campanha).
- Não vamos mexer em RLS, kanban de criativos, nem fluxo de aprovação.
- Não vamos contar entregáveis (versões) — usamos demandas (1 demanda = 1 criativo solicitado).

### Resultado esperado

- Card de projeto mostra o número **real** de criativos solicitados via campanhas daquele projeto.
- Visão geral do projeto idem.
- Aba Campanhas (opcional) mostra "N criativos" por campanha.
- Zero queries pesadas: 1 SELECT extra agregado por listagem.

