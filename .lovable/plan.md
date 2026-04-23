

## Jornada flexível por tipo de serviço

### O problema

A página **Minha Jornada** assume que todo cliente segue o fluxo de **Auditoria** (Diagnóstico → Estruturação → Operação Guiada → Transferência). Mas você atende seis serviços diferentes (Auditoria, Produção, Gestão, Design, Site, Web App) e cada um tem seu próprio fluxo — já definidos em `src/lib/service-phases-config.ts`, **só que ninguém usa esse arquivo na jornada do cliente**. Resultado: cliente de Produção de Mídia vê "Diagnóstico/Transferência" que não fazem sentido pra ele.

### A solução (sem quebrar nada)

Adicionar **tipo de serviço por cliente** e fazer a Jornada renderizar as fases corretas conforme o serviço. Quem já existe continua em "auditoria" como padrão — **zero migração de dados, zero perda de histórico**.

### Mudanças no banco

**Tabela `clients`** — duas colunas novas:

- `service_type text not null default 'auditoria'` — qual fluxo o cliente segue (`auditoria | producao | gestao | design | site | webapp`)
- `phase_dates jsonb default '{}'` — substitui as 8 colunas hard-coded (`phase_diagnostico_start`, etc.) por um mapa flexível: `{ "diagnostico": { start, end, completed_at }, "briefing": {...}, ... }`

As 8 colunas antigas **continuam existindo** (não removo agora). O frontend lê de `phase_dates` quando preenchido, senão cai nas colunas antigas como fallback. Isso garante que clientes existentes não percam datas.

### Mudanças no frontend

**1. `src/lib/service-phases-config.ts`** — já existe e tem os 6 fluxos. Vou usar como fonte única de verdade.

**2. `src/components/journey/JourneyStepper.tsx`** — receber `phases` como prop (array dinâmico) em vez de hard-coded. As funções `getPhaseLabel`, `getPhaseDescription`, `getAllPhases` passam a aceitar `serviceType` como argumento.

**3. `src/components/journey/JourneyTimeline.tsx`** — `PhaseDates` vira `Record<string, PhaseDate>` em vez de objeto fixo com 4 chaves. Loop renderiza N fases (4, 5, ou o que vier do config).

**4. `src/components/journey/JourneyOverviewCard.tsx`** — mesma adaptação: lê fases dinâmicas em vez de assumir `transferencia` como última.

**5. `src/pages/cliente/MinhaJornada.tsx`** — busca `service_type` do cliente, deriva fases via `getPhasesByService(serviceType)`, passa para todos os componentes filhos. Título passa a ser **"Minha Jornada — {Nome do Serviço}"** (ex: "Minha Jornada — Produção de Mídia").

**6. `src/hooks/useAuth.tsx`** — `ClientInfo` ganha `service_type`.

**7. `src/pages/admin/ClientDetail.tsx`** + form de criação de cliente — admin pode escolher o `service_type` e editar datas das fases do serviço escolhido. Quando troca o tipo, mantém o histórico mas mostra as fases novas.

**8. `src/lib/task-config.ts`** — `journeyPhaseConfig` deixa de ser hard-coded de 4 fases. Helper `getJourneyPhaseConfig(serviceType, phase)` retorna label/cor a partir do `service-phases-config`.

**9. Onde `journey_phase` aparece em tasks** (Tarefas, Templates, Kanban) — passa a respeitar as fases do serviço do cliente. Sem cliente associado (tarefa interna), continua mostrando as 4 fases padrão como hoje.

### Compatibilidade e fallback

- Cliente sem `service_type` → assume `'auditoria'` (default no banco). Nada muda visualmente.
- Cliente sem `phase_dates` populado → lê das 8 colunas antigas. Nada muda.
- Tarefas existentes com `journey_phase` de auditoria continuam válidas (auditoria mantém os 4 valores atuais).
- Audit logs e acknowledgements continuam funcionando — usam o valor de `phase` como string opaca.

### O que o usuário vê

- **Cliente de Auditoria**: idêntico ao hoje.
- **Cliente de Produção**: vê **Briefing → Produção → Revisão → Entrega** com as cores do config.
- **Cliente de Site**: vê 5 fases (Briefing → Wireframe → Desenvolvimento → Revisão → Publicação).
- **Admin**: ao criar/editar cliente, escolhe o tipo de serviço e configura datas das fases corretas.

### Fora do escopo

- Não vou remover as 8 colunas antigas agora (descontinuar depois, em migração separada).
- Não vou criar UI de gestão de fases customizadas pelo cliente (as fases vêm do config — você edita o `.ts` se quiser ajustar).
- Não vou suportar **múltiplos serviços simultâneos por cliente** (um cliente = um service_type por enquanto; se quiser múltiplos, fica como evolução futura via tabela `client_services`).
- Não mexo em RLS, comentários, kanban de tarefas (apenas labels).

### Resultado

A página Minha Jornada deixa de forçar o fluxo de Auditoria. Cada cliente vê a jornada certa do serviço dele, com nomes, ordem, cores e quantidade de fases corretos — mantendo a metáfora visual de stepper + timeline + KPIs que já está consolidada.

