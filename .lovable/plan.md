

## Linkouzinho como Orquestrador Multi-Modo (Interno)

### Objetivo
Evoluir o `ADMIN_SYSTEM_PROMPT` no `assistant-chat/index.ts` para que o Linkouzinho funcione como **orquestrador único** que detecta automaticamente a intenção e assume internamente um dos 3 modos (AUDITOR, ESTRATEGISTA, EXECUTOR), mantendo a interface idêntica.

### Arquitetura proposta (sem mudanças de UI/banco)

```text
Mensagem do usuário
        ↓
[Camada de Roteamento — invisível]
        ↓
   ┌────┴────┬─────────────┐
AUDITOR  ESTRATEGISTA  EXECUTOR
(análise) (plano)      (ação + tools)
        ↓
Resposta no formato do modo escolhido
```

### Detecção automática (instruída via prompt)

| Sinais na mensagem | Modo |
|---|---|
| "analisa", "diagnóstico", "problema", "por que caiu", "o que tá errado" | **AUDITOR** |
| "o que fazer", "plano", "estratégia", "prioridade", "próximos passos", "como melhorar" | **ESTRATEGISTA** |
| "cria", "agenda", "estrutura", "lança", "preenche", "ajusta" | **EXECUTOR** (dispara tool calls) |
| Ambíguo | Assume **ESTRATEGISTA** (mais útil por padrão) |

### Formatos de saída por modo

**AUDITOR**
```
1. Diagnóstico
2. Problema principal
3. Evidência (dados do contexto)
4. Impacto
```

**ESTRATEGISTA**
```
1. Contexto
2. Objetivo
3. Plano (prioritizado)
4. Prioridade #1
5. Próximo passo
```

**EXECUTOR**
```
1. Ação
2. Como executar (+ tool call quando aplicável)
3. Resultado esperado
4. Próximo passo
```

### O que muda

| Item | Mudança |
|---|---|
| `ADMIN_SYSTEM_PROMPT` | Reestruturado: identidade + camada de roteamento + 3 personas internas + regras de decisão + formatos por modo |
| Tools (7 atuais) | **Sem mudança** — continuam disponíveis, usadas principalmente no modo EXECUTOR |
| Contexto enriquecido (briefing/plano/métricas/campanhas) | **Sem mudança** — todos os modos consomem |
| Frontend `LinkouzinhoInternal.tsx` | **Sem mudança** — usuário não vê os modos |
| Modo cliente (`CLIENT_SYSTEM_PROMPT`) | **Sem mudança** |
| Banco de dados | **Sem mudança** |

### Regras críticas reforçadas no prompt

- Modo escolhido é **interno** — nunca mencionar "modo AUDITOR/ESTRATEGISTA/EXECUTOR" na resposta
- **Uma direção por resposta** — nunca misturar análise + plano + execução longa
- Se faltar dado essencial: pedir **uma única** informação objetiva
- Sempre terminar com **um próximo passo claro**
- Em EXECUTOR: chamar a tool apropriada imediatamente quando a ação for clara

### Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | Reescrita do `ADMIN_SYSTEM_PROMPT` com camada de roteamento + 3 personas |

### Sem mudanças
- Tools, executors, fetch de contexto, frontend, banco, modo cliente.

