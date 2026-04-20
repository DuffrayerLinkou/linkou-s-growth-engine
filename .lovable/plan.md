

## Próximas Evoluções Sugeridas para o Linkouzinho

Confirmando: hoje o Linkouzinho **já cria tarefas** (`create_task`) e **já agenda reuniões** (`create_appointment`). A seguir, 5 evoluções de alto impacto, ordenadas por ROI.

---

### 🥇 Sugestão 1 — Memória persistente entre sessões (alto impacto, baixo custo)

**Hoje:** conversa some ao fechar o navegador (`sessionStorage`).
**Proposta:** criar tabela `assistant_conversations` (user_id, client_id, messages jsonb, updated_at). Persistir histórico no banco para o admin retomar de onde parou + Linkouzinho ter memória de longo prazo do cliente ("você comentou semana passada que o CPL estava alto").

**Impacto:** continuidade real de gestão. Nada de "começar do zero" toda manhã.

---

### 🥈 Sugestão 2 — Tool `analyze_metrics_period` (análise comparativa)

**Hoje:** vê últimos 6 meses no contexto, mas não faz cálculos automáticos.
**Proposta:** tool que recebe `period_a` e `period_b` (ex: "últimos 30d vs 30d anteriores"), calcula deltas (CPL, ROAS, conversão, ticket médio), identifica variações > 15% e devolve análise estruturada para o modo AUDITOR.

**Impacto:** diagnóstico de performance em 1 mensagem ("o que mudou esse mês?") sem o modelo tentar fazer matemática manual.

---

### 🥉 Sugestão 3 — Tool `send_whatsapp` para o lead/cliente

**Hoje:** Linkouzinho pode criar tarefa "responder fulano", mas não dispara mensagem.
**Proposta:** integrar com a função `whatsapp-api` existente. No modo EXECUTOR, ao identificar "manda um follow-up pra Maria", o bot envia direto via Cloud API com template aprovado.

**Impacto:** fecha o ciclo análise → ação → execução real, sem trocar de tela.

---

### Sugestão 4 — Tool `generate_proposal_draft`

**Hoje:** existe `/admin/proposals` com gerador IA separado.
**Proposta:** tool que recebe `lead_id` (ou contexto do cliente atual) + `service_type` e cria proposta em rascunho na tabela `proposals` reaproveitando `ProposalTemplates`. Linkouzinho devolve o link "Proposta criada → /admin/proposals/{id}".

**Impacto:** "cria uma proposta de gestão pra esse lead" vira 1 frase.

---

### Sugestão 5 — Briefing "voice-to-data"

**Hoje:** briefing é preenchido manualmente em formulário longo.
**Proposta:** Linkouzinho conduz uma conversa de descoberta (5–8 perguntas guiadas) e ao final usa `create_briefing` com tudo estruturado. Modo ESTRATEGISTA com fluxo conversacional pré-roteirizado.

**Impacto:** onboarding de novo cliente em 5 minutos de chat ao invés de 30min de formulário.

---

### Bônus — Quick wins menores (1 linha cada)

- **Tool `update_task_status`**: marcar tarefa como concluída por chat
- **Tool `create_payment`**: lançar cobrança/recebimento na timeline financeira  
- **Tool `log_lead_activity`**: registrar interação com lead (call, e-mail) sem abrir o CRM
- **Sugestões dinâmicas**: chips do chat se adaptam ao contexto do cliente (ex: se há tarefa atrasada → "ver tarefas atrasadas")

---

### Recomendação

Começar pela **Sugestão 1 (Memória persistente)** — desbloqueia tudo o resto e transforma o Linkouzinho de "assistente de sessão" em **gestor contínuo do cliente**.

Quer que eu siga com alguma? Posso implementar uma, várias ou criar um roadmap por sprint.

