

## Atualizar System Prompt do Linkouzinho (Modo Admin) — Persona Estratégica

### Objetivo
Substituir o system prompt atual do modo admin no `assistant-chat/index.ts` pela nova persona "gestor estratégico operacional" fornecida pelo usuário, mantendo intactas todas as 7 tools (`create_appointment`, `create_task`, `upsert_traffic_metrics`, `create_campaign`, `create_project`, `create_strategic_plan`, `create_briefing`) e o contexto enriquecido (briefings, planos, métricas, campanhas).

### O que muda
- **Novo prompt admin**: persona "Linkouzinho — gestor estratégico", regras (resultado > resposta), comportamento (DIAGNÓSTICO → AÇÃO → IMPACTO), formato de resposta padrão em 5 blocos.
- **Integração com tools**: adicionar instrução curta de que ao identificar uma ação acionável (criar campanha, plano, tarefa, etc.), deve **executar via tool call** seguindo a estrutura DIAGNÓSTICO → AÇÃO → IMPACTO antes ou junto da execução.
- **Mantém**: bloco de contexto dinâmico (cliente, briefing, plano, métricas, campanhas), regras anti-invenção de dados, modo cliente intacto.

### Formato de resposta forçado (admin)
```
1. DIAGNÓSTICO
2. PROBLEMA PRINCIPAL
3. AÇÃO RECOMENDADA
4. IMPACTO ESPERADO
5. PRÓXIMO PASSO (apenas 1)
```

### Modo cliente
Sem alteração — mantém o tom consultivo amigável existente.

### Arquivo alterado
| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | Substituir apenas o `ADMIN_SYSTEM_PROMPT` pela nova persona estratégica, preservando bloco de contexto e tools |

### Sem mudanças
- Tools, executors, tabelas, frontend, contexto fetch — tudo permanece igual.

