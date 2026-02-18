
# Gerador de Steps de Funil de Email com IA

## Visão geral

Na aba "Editor de Steps" da página `/admin/funil-email`, ao selecionar um funil, o usuário poderá clicar em um botão "Gerar com IA" para descrever em linguagem natural o objetivo do funil. A IA irá gerar automaticamente todos os steps com assunto e corpo HTML prontos para uso, usando as variáveis `{{nome}}`, `{{segmento}}` e `{{objetivo}}`.

## Experiência do usuário

1. Usuário seleciona um funil na aba "Editor de Steps"
2. Clica no botão **"✨ Gerar Steps com IA"** (ao lado do botão "Adicionar Step")
3. Um dialog abre com campos de contexto:
   - Objetivo do funil (ex: "converter leads frios que viram a landing page mas não responderam")
   - Público-alvo (ex: "e-commerce, academias, clínicas")
   - Tom de voz (opções: Profissional, Consultivo, Direto/Urgente)
   - Quantidade de steps (3, 4 ou 5)
   - Intervalo entre emails (ex: a cada 2 dias, 3 dias, 7 dias)
4. IA gera todos os steps com assunto + HTML completo usando o template Linkou (cor roxa, assinatura Leo Santana)
5. Preview dos steps gerados é exibido no dialog antes de salvar
6. Usuário confirma → steps são salvos em batch no banco

## Arquitetura técnica

### 1. Nova Edge Function: `generate-funnel-steps`

Segue o mesmo padrão de `generate-capture-page`:
- Autenticação via `Authorization` header
- Chama Lovable AI Gateway com tool calling estruturado
- Retorna array de steps com `delay_days`, `subject` e `html_body`

**Parâmetros de entrada:**
```typescript
{
  objective: string;       // Objetivo do funil
  audience: string;        // Público-alvo
  tone: "professional" | "consultive" | "direct";
  step_count: 3 | 4 | 5;
  interval_days: number;   // Dias entre emails
  funnel_name: string;     // Nome do funil (contexto extra)
}
```

**Saída esperada (tool call):**
```typescript
{
  steps: Array<{
    step_number: number;
    delay_days: number;
    subject: string;
    html_body: string;  // HTML pronto com variáveis {{nome}}, {{segmento}}, {{objetivo}}
  }>
}
```

**Prompt de sistema:** Especialista em email marketing consultivo B2B/B2C brasileiro, sempre usando variáveis de personalização, assinatura "Leo Santana — Diretor Comercial — Linkou" em estilo HTML inline compatível com o design system roxo (#7C3AED), e nunca mencionando "tráfego pago" mas sim "consultoria, tráfego e vendas".

### 2. Alterações em `EmailFunnel.tsx`

- Novo estado: `aiDialog: boolean`
- Novo estado: `generatedSteps: FunnelStep[]` (preview antes de salvar)
- Novo componente `GenerateStepsDialog` com os campos de contexto
- Novo componente `GeneratedStepsPreview` dentro do dialog para revisar antes de salvar
- Botão "✨ Gerar com IA" na aba de steps (visível quando um funil está selecionado)
- Mutation `saveAllSteps` para inserir os steps gerados em batch

### 3. Registro em `config.toml`

```toml
[functions.generate-funnel-steps]
verify_jwt = false
```

## Fluxo detalhado

```text
[Usuário clica "Gerar com IA"]
        ↓
[Dialog abre com campos de contexto]
        ↓
[Usuário preenche e clica "Gerar"]
        ↓
[Frontend chama supabase.functions.invoke("generate-funnel-steps")]
        ↓
[Edge Function chama Lovable AI Gateway com tool calling]
        ↓
[IA retorna array de steps estruturados]
        ↓
[Dialog mostra preview dos N steps gerados]
        ↓
[Usuário aprova → INSERT em batch em email_funnel_steps]
        ↓
[Toast de sucesso + lista de steps atualizada]
```

## Arquivos alterados / criados

| Arquivo | Ação | O que muda |
|---|---|---|
| `supabase/functions/generate-funnel-steps/index.ts` | Criar | Nova edge function com IA |
| `supabase/config.toml` | Editar | Registrar nova função com `verify_jwt = false` |
| `src/pages/admin/EmailFunnel.tsx` | Editar | Botão + dialog + preview + mutation de batch save |

## Pontos de cuidado

- Se o funil já tiver steps, o dialog avisa: "Este funil já possui X steps. Os novos serão adicionados ao final."
- Steps gerados pela IA partem do `delay_days` a partir do último step existente (se houver), evitando conflitos
- Erros de rate limit (429) e créditos (402) são exibidos via toast com mensagem amigável
- O HTML gerado seguirá o padrão inline já usado nos steps existentes (sem folhas de estilo externas)
